"""Forecast the energy mix using only information available before the forecast.

Compare a calendar Random Forest with a seven-day time-of-day profile on three
rolling validation days. These validation errors select a method; they are not
an independent estimate of future accuracy. No weather forecast is available.
"""
from dataclasses import dataclass
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from data import energy_score
from emissions import add_emissions

TARGETS = ['Consum[MW]', 'Productie[MW]', 'Carbune[MW]', 'Hidrocarburi[MW]', 'Ape[MW]',
           'Nuclear[MW]', 'Eolian[MW]', 'Foto[MW]', 'Biomasa[MW]', 'Sold[MW]']


def features(times):
    hour = times.dt.hour + times.dt.minute / 60
    return pd.DataFrame({'sin_hour': np.sin(hour * np.pi / 12),
                         'cos_hour': np.cos(hour * np.pi / 12),
                         'weekend': (times.dt.weekday >= 5).astype(int)})


def fit_forest(history):
    recent = history[history.Data > history.Data.max() - pd.Timedelta(days=14)]
    model = RandomForestRegressor(n_estimators=120, min_samples_leaf=18, random_state=42, n_jobs=2)
    model.fit(features(recent.Data), recent[TARGETS])
    return model


def predict_mix(history, times, method, forest=None):
    times = pd.Series(times).reset_index(drop=True)
    if method == 'calendar_random_forest':
        values = (forest or fit_forest(history)).predict(features(times))
    else:
        recent = history[history.Data > history.Data.max() - pd.Timedelta(days=7)].copy()
        recent['bucket'] = recent.Data.dt.hour * 6 + recent.Data.dt.minute // 10
        profile = recent.groupby('bucket')[TARGETS].mean().reindex(range(144)).interpolate(limit_direction='both')
        values = profile.loc[times.dt.hour * 6 + times.dt.minute // 10].to_numpy()
    out = pd.DataFrame(values, columns=TARGETS)
    out.insert(0, 'Data', times)
    # Negative net solar/wind measurements are retained in the forecast. CO2 uses
    # positive generation only; Sold > 0 is import, Sold < 0 is export.
    out['Scor_pred'] = energy_score(out)
    return add_emissions(out)


@dataclass
class ForecastModel:
    method: str
    forest: object
    validation: dict
    last_observation: str


def train(df):
    df = df.sort_values('Data').reset_index(drop=True)
    last = df.Data.max()
    methods = ['calendar_random_forest', 'seven_day_profile']
    errors = {name: [] for name in methods}
    score_errors = {name: [] for name in methods}
    validation_days = []
    # Match the production horizon: partial previous day -> next complete day.
    for offset in (3, 2, 1):
        day = last.normalize() - pd.Timedelta(days=offset)
        cutoff = day - pd.Timedelta(days=1) + (last - last.normalize())
        history = df[df.Data <= cutoff]
        actual = df[(df.Data >= day) & (df.Data < day + pd.Timedelta(days=1))]
        if len(history) < 144 * 7 or len(actual) < 100:
            continue
        actual_co2 = add_emissions(actual)['CO2_g_kWh']
        for name in methods:
            prediction = predict_mix(history, actual.Data, name)
            errors[name].append(float(mean_absolute_error(actual_co2, prediction.CO2_g_kWh)))
            score_errors[name].append(float(mean_absolute_error(actual.Scor, prediction.Scor_pred)))
        validation_days.append(day.date().isoformat())
    if not validation_days:
        raise ValueError('At least about 11 days of valid history are required for temporal validation')
    metrics = {name: {'co2_mae_g_kwh': float(np.mean(errors[name])),
                      'score_mae': float(np.mean(score_errors[name])),
                      'daily_co2_mae_g_kwh': errors[name]} for name in methods}
    selected = min(methods, key=lambda name: metrics[name]['co2_mae_g_kwh'])
    report = {'days': validation_days, 'methods': metrics, 'selected': selected,
              'note': 'Rolling validation used for model selection, not an independent test; no weather inputs.'}
    print(report)
    model = ForecastModel(selected, fit_forest(df) if selected == methods[0] else None, report, last.isoformat())
    test = df[df.Data.dt.normalize().isin(pd.to_datetime(validation_days))]
    # Legacy callers use this tuple; predictions here also use a strict past cutoff.
    first_day = test.Data.min().normalize()
    training = df[df.Data <= first_day - pd.Timedelta(days=1) + (last - last.normalize())]
    predicted = predict_mix(training, test.Data, selected).Scor_pred.to_numpy()
    return training, test, predicted, test.Scor, model


def scale_forecast_scores(frame):
    """Scale the entire forecast by one factor when its raw maximum exceeds 100."""
    out = frame.copy()
    raw = out['Scor_raw'] if 'Scor_raw' in out else out['Scor_pred']
    if raw.empty or not np.isfinite(raw).all():
        raise ValueError('Cannot scale empty or non-finite forecast scores')
    maximum = float(raw.max())
    out['Scor_raw'] = raw
    out['Scor_pred'] = raw * (100.0 / maximum) if maximum > 100 else raw
    return out


def predict_next_day(df, model, freq='10min'):
    last = df.Data.max()
    if last.isoformat() != model.last_observation:
        raise ValueError('Forecast input differs from training history')
    start = last.normalize() + pd.Timedelta(days=1)
    times = pd.date_range(start, start + pd.Timedelta(days=1), freq=freq, inclusive='left')
    out = predict_mix(df, times, model.method, model.forest)
    out = scale_forecast_scores(out)
    out['Method'] = model.method
    return out
