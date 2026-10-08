import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import virtual_washer


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.client = virtual_washer.app.test_client()
        virtual_washer.machine_state['power'] = 'off'

    def tearDown(self):
        virtual_washer.machine_state['power'] = 'off'

    def test_missing_forecast_is_404(self):
        with patch.object(virtual_washer, '_latest_colored_csv', return_value='/nonexistent/forecast.csv'):
            self.assertEqual(self.client.get('/forecast-data').status_code, 404)

    def test_forecast_transfer_preserves_csv_and_report(self):
        with tempfile.TemporaryDirectory() as directory:
            csv = Path(directory) / 'next_day_predictions_colored_2026-10-09.csv'
            content = 'Data,Scor_pred,Color,CO2_g_kWh\n2026-10-09 12:00:00,80,green,10\n'
            csv.write_text(content)
            report = {'forecast_start': '2026-10-09T00:00:00'}
            (csv.parent / 'model_validation.json').write_text(json.dumps(report))
            with patch.object(virtual_washer, '_latest_colored_csv', return_value=str(csv)):
                response = self.client.get('/forecast-data')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json['content'], content)
            self.assertEqual(response.json['report'], report)
            self.assertEqual(response.json['source'], csv.name)
            self.assertEqual(response.headers['Cache-Control'], 'no-store')

    def test_green_decision_does_not_call_itself_over_http(self):
        with patch('use.color', return_value=(True, {'Color': 'green'})), patch('requests.get') as get:
            response = self.client.post('/decision', json={})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['triggered'])
        self.assertEqual(self.client.get('/status').json['power'], 'on')
        get.assert_not_called()
