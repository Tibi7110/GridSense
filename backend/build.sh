#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
MPLBACKEND=Agg PREDICT_NEXT_DAY=true python main.py
# main.py catches some export errors; fail the build if the forecast is missing.
python - <<'PY'
import json
from pathlib import Path
import pandas as pd

report = json.loads(Path('data/model_validation.json').read_text())
day = report['forecast_start'][:10]
frame = pd.read_csv(f'data/next_day_predictions_colored_{day}.csv')
assert len(frame) > 0, 'Forecast is empty'
assert {'Data', 'Scor_pred', 'Color', 'CO2_g_kWh'} <= set(frame), 'Forecast columns missing'
PY
