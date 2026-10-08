import sys
import unittest
from pathlib import Path
from unittest.mock import patch
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from data import data, energy_score
from emissions import add_emissions
from model import train, predict_next_day, scale_forecast_scores, TARGETS


def row(**values):
    result = {c: 0.0 for c in TARGETS}
    result.update({'Productie[MW]': 100.0, 'Consum[MW]': 100.0})
    result.update(values)
    return result


class ScoreTests(unittest.TestCase):
    def test_export_bonus_uses_consumption_and_is_not_capped(self):
        # 75% hydro + 25% coal gives base score 80; 10% export adds 25% = 20 points.
        for exported, expected in [(0, 80), (10, 82), (50, 90), (100, 100), (200, 120)]:
            frame = pd.DataFrame([row(**{'Consum[MW]': 1000, 'Productie[MW]': 1200,
                                         'Ape[MW]': 900, 'Carbune[MW]': 300, 'Sold[MW]': -exported})])
            self.assertAlmostEqual(energy_score(frame).iloc[0], expected)

    def test_import_keeps_penalty_without_export_bonus(self):
        frame = pd.DataFrame([row(**{'Consum[MW]': 1000, 'Productie[MW]': 900,
                                     'Ape[MW]': 900, 'Sold[MW]': 100})])
        self.assertAlmostEqual(energy_score(frame).iloc[0], 100 - 120 * 100 / 900)

    def test_zero_consumption_rejected(self):
        with self.assertRaises(ValueError):
            energy_score(pd.DataFrame([row(**{'Consum[MW]': 0, 'Sold[MW]': -100})]))


class EmissionsTests(unittest.TestCase):
    def test_source_units_and_zero_sources(self):
        for source, expected in [('Carbune[MW]', 1000), ('Hidrocarburi[MW]', .286),
                                 ('Ape[MW]', 0), ('Nuclear[MW]', 0), ('Eolian[MW]', 0), ('Foto[MW]', 0)]:
            result = add_emissions(pd.DataFrame([row(**{source: 100})]))
            self.assertAlmostEqual(result.CO2_g_kWh.iloc[0], expected)

    def test_import_export_and_unknown_generation(self):
        # 100 MW available: 10% coal, 20% hydrocarbons, 10% imports.
        mixed = row(**{'Productie[MW]': 90, 'Carbune[MW]': 10, 'Hidrocarburi[MW]': 20,
                       'Sold[MW]': 10, 'Ape[MW]': 50, 'Biomasa[MW]': 5})
        out = add_emissions(pd.DataFrame([mixed])).iloc[0]
        self.assertAlmostEqual(out.CO2_g_kWh, 160.0572)
        self.assertAlmostEqual(out.Biomasa_share, .05)
        self.assertAlmostEqual(out.Unallocated_share, .05)
        out = add_emissions(pd.DataFrame([row(**{'Carbune[MW]': 100, 'Sold[MW]': -50})])).iloc[0]
        self.assertEqual(out.CO2_g_kWh, 1000)
        self.assertEqual(out['Import[MW]'], 0)
        out = add_emissions(pd.DataFrame([row(**{'Productie[MW]': 0, 'Sold[MW]': 100})])).iloc[0]
        self.assertEqual(out.CO2_g_kWh, 600)

    def test_invalid_denominator_rejected(self):
        with self.assertRaises(ValueError):
            add_emissions(pd.DataFrame([row(**{'Productie[MW]': 0})]))


class InputTests(unittest.TestCase):
    def test_starred_values_dates_and_duplicates(self):
        rows = []
        for date, coal in [('08-10-2026 10:00:00', '40*'), ('07-10-2026 10:00:00', '30'),
                           ('08-10-2026 10:00:00', '50*'), ('* - estimare', 'bad')]:
            rows.append({**row(), 'Data': date, 'Carbune[MW]': coal})
        with patch('data.pd.read_excel', return_value=pd.DataFrame(rows)):
            result = data('fixture.xlsx')
        self.assertEqual(len(result), 2)
        self.assertTrue(result.Data.is_monotonic_increasing)
        self.assertEqual(result['Carbune[MW]'].tolist(), [30, 50])
        self.assertTrue(result.Estimated.iloc[-1])
        self.assertEqual(result.Scor.iloc[-1], 10)

    def test_bad_numeric_is_not_silently_zero(self):
        frame = pd.DataFrame([{**row(), 'Data': '08-10-2026 10:00:00', 'Carbune[MW]': 'bad'}])
        with patch('data.pd.read_excel', return_value=frame), self.assertRaises(ValueError):
            data('fixture.xlsx')


class ScoreScalingTests(unittest.TestCase):
    def test_one_factor_scales_every_point_and_preserves_co2(self):
        source = pd.DataFrame({'Scor_pred': [80., 160., -40.], 'CO2_g_kWh': [200., 100., 300.]})
        result = scale_forecast_scores(source)
        np.testing.assert_allclose(result.Scor_pred, [50, 100, -25])
        np.testing.assert_allclose(result.Scor_raw, source.Scor_pred)
        np.testing.assert_allclose(result.CO2_g_kWh, source.CO2_g_kWh)
        pd.testing.assert_frame_equal(scale_forecast_scores(result), result)

    def test_scores_below_limit_are_not_scaled_up(self):
        for scores in ([0., 40., 80.], [-10., -5., 0.], [100., 50.]):
            result = scale_forecast_scores(pd.DataFrame({'Scor_pred': scores}))
            np.testing.assert_allclose(result.Scor_pred, scores)


class ForecastTests(unittest.TestCase):
    def test_temporal_validation_and_next_day_contract(self):
        times = pd.date_range('2026-09-20', '2026-10-08 10:20:00', freq='10min')
        frame = pd.DataFrame([row(**{'Carbune[MW]': 20, 'Ape[MW]': 80}) for _ in times])
        frame['Data'] = times
        frame['Scor'] = energy_score(frame)
        import model as module
        original = module.predict_mix
        def guard(history, future, method, forest=None):
            self.assertLess(history.Data.max(), pd.Series(future).min())
            return original(history, future, method, forest)
        with patch('model.predict_mix', side_effect=guard):
            *_, model = train(frame)
            forecast = predict_next_day(frame, model)
        self.assertEqual(len(forecast), 144)
        self.assertEqual(str(forecast.Data.min()), '2026-10-09 00:00:00')
        self.assertEqual(str(forecast.Data.max()), '2026-10-09 23:50:00')
        np.testing.assert_allclose(forecast.CO2_g_kWh, 200)
        self.assertLess(model.validation['methods'][model.method]['co2_mae_g_kwh'], 1e-8)
        with self.assertRaises(ValueError):
            predict_next_day(frame.iloc[:-1], model)


if __name__ == '__main__':
    unittest.main()
