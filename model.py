from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, root_mean_squared_error


try:
    # sklearn >=1.4 provides this helper
    from sklearn.metrics import root_mean_squared_error as sk_rmse
except Exception:  # pragma: no cover
    sk_rmse = None

import pandas as pd
from datetime import timedelta

def train(df):
    # split
    train_df, test_df = train_test_split(df, test_size=0.285, random_state=42)

    # target
    if 'Scor' not in df.columns:
        raise ValueError("DataFrame must contain a 'Scor' column as target")
    y_train = train_df['Scor']
    y_test = test_df['Scor']

    # build feature matrix: drop non-feature cols like target and datetimes, then keep numeric columns
    drop_cols = ['Scor', 'Data']
    X_train = train_df.drop(columns=[c for c in drop_cols if c in train_df.columns], errors='ignore')
    X_test = test_df.drop(columns=[c for c in drop_cols if c in test_df.columns], errors='ignore')

    # keep only numeric features
    X_train = X_train.select_dtypes(include=['number'])
    X_test = X_test.select_dtypes(include=['number'])

    # ensure we have a 2D array (DataFrame). If only a single numeric column exists, select_dtypes returns a DataFrame.
    if X_train.shape[1] == 0:
        raise ValueError('No numeric feature columns found. Ensure DataFrame has numeric features besides "Scor" and "Data"')

    model = RandomForestRegressor(random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    if sk_rmse is not None:
        rmse = sk_rmse(y_test, y_pred)
    else:
        rmse = root_mean_squared_error(y_test, y_pred, squared=False)
    print(f"R2: {r2_score(y_test, y_pred):.4f}")
    print(f"RMSE: {rmse:.4f}")

    return train_df, test_df, y_pred, y_test, model


def predict_next_day(df: pd.DataFrame, model: RandomForestRegressor, freq: str = '10min') -> pd.DataFrame:
    """Predict Scor for the next day using time features and mean-filled numeric features.

    - Builds a timestamp range from the day after the last `Data` to that day's end using `freq`.
    - Constructs the same numeric feature columns used in training:
      drops 'Scor' and 'Data', keeps numeric columns; for future rows, fills with the training means.
    - Returns a DataFrame with 'Data' and 'Scor_pred'.
    """
    if 'Data' not in df.columns:
        raise ValueError("DataFrame must contain a 'Data' datetime column")

    last_ts = pd.to_datetime(df['Data'].max())
    if pd.isna(last_ts):
        raise ValueError('No valid timestamps in Data column')

    start = (last_ts + timedelta(days=1)).normalize()  # next day 00:00
    end = start + timedelta(days=1) - timedelta(minutes=1)
    future_index = pd.date_range(start=start, end=end, freq=freq)
    future = pd.DataFrame({'Data': future_index})

    # add time features
    future['Ora'] = future['Data'].dt.hour
    future['Minut'] = future['Data'].dt.minute
    future['Ziua'] = future['Data'].dt.day
    future['Luna'] = future['Data'].dt.month
    future['Weekday'] = future['Data'].dt.weekday

    # determine numeric feature columns from training data
    drop_cols = ['Scor', 'Data']
    base_features = df.drop(columns=[c for c in drop_cols if c in df.columns], errors='ignore')
    numeric_cols = list(base_features.select_dtypes(include=['number']).columns)
    if not numeric_cols:
        raise ValueError('No numeric feature columns found for prediction.')

    # compute training means for numeric cols as baseline fillers
    means = base_features[numeric_cols].mean(numeric_only=True)

    # build future feature matrix: start with time features and fill missing numeric cols
    for col in numeric_cols:
        if col not in future.columns:
            future[col] = means.get(col, 0.0)

    # ensure column order matches training expectations
    X_future = future[numeric_cols]
    preds = model.predict(X_future)
    out = future[['Data']].copy()
    out['Scor_pred'] = preds
    return out