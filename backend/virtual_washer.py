from flask import Flask, request, jsonify
from datetime import datetime
import traceback
import pandas as pd
import math
import os
import re

app = Flask(__name__)

machine_state = {"power": "off"}


@app.route("/")
def home():
    return f"""
    <html>
    <head>
        <title>Virtual Washing Machine</title>
        <meta http-equiv="refresh" content="5"> <!-- auto-refresh every 5s -->
        <style>
            body {{ font-family: sans-serif; text-align: center; margin-top: 5em; }}
            .on {{ color: green; }}
            .off {{ color: red; }}
            a {{ padding: 10px; }}
        </style>
    </head>
    <body>
        <h1>Virtual Washing Machine</h1>
        <p>Current power state:
           <strong class="{machine_state['power']}">
               {machine_state['power'].upper()}
           </strong>
        </p>
        <p>
            <a href="/power?state=on">🟢 Turn On</a>
            <a href="/power?state=off">🔴 Turn Off</a>
        </p>
    </body>
    </html>
    """


@app.route("/power", methods=["GET"])
def power():
    state = request.args.get("state")
    if state not in ("on", "off"):
        return jsonify({"error": "Invalid state. Use ?state=on or ?state=off"}), 400

    machine_state["power"] = state

    # Auto‑redirect back to home after 1.5 s
    return f"""
    <html>
    <head>
      <meta http-equiv="refresh" content="1.5; url=/">
    </head>
    <body style="font-family:sans-serif; text-align:center; margin-top:5em;">
        <h2>Status updated ✅</h2>
        <p>Machine is now <b>{machine_state['power'].upper()}</b></p>
        <p>Returning to home...</p>
    </body>
    </html>
    """


@app.route("/status", methods=["GET"])
def status():
    return jsonify({"power": machine_state["power"]})


@app.route("/auto-check", methods=["GET"])
def auto_check():
    """
    Verifică automat scorul și pornește mașina dacă condițiile sunt îndeplinite.
    Acest endpoint poate fi apelat periodic de frontend.
    """
    try:
        from use import color as use_color, _build_intervals
        from api import send_api
    except Exception as e:
        return jsonify({"ok": False, "error": f"Import failed: {str(e)}"}), 500

    result = {
        "ok": False,
        "inside_interval": False,
        "details": None,
        "power": machine_state.get("power"),
        "triggered": False,
        "action": "none"
    }

    try:
        csv_path = _latest_colored_csv()
        inside, details = use_color(csv_path=csv_path, when=None)
        result["inside_interval"] = bool(inside)
        
        if details:
            safe = {k: (v.isoformat() if hasattr(v, 'isoformat') else v) for k, v in details.items()}
            result["details"] = safe

        color_now = (details or {}).get("Color")
        
        # Verifică dacă mașina este deja pornită
        if machine_state.get("power") == "on":
            result["action"] = "already_on"
            result["ok"] = True
            return jsonify(result)
        
        # Pornește automat pentru verde
        if color_now == "green":
            try:
                send_api()
                machine_state["power"] = "on"
                result["triggered"] = True
                result["action"] = "started_green"
                print(f"🟢 AUTO-START: Green score detected, machine started!")
            except Exception as e:
                result["error"] = f"Failed to send API: {str(e)}"
                result["action"] = "failed"
        
        # Pentru yellow, verifică ultimele 12 intervale
        elif color_now == "yellow":
            try:
                df = pd.read_csv(csv_path)
                intervals = _build_intervals(df, time_col="Data")
                current_start = details.get("Start")
                if current_start:
                    current_start_ts = current_start if isinstance(current_start, pd.Timestamp) else pd.to_datetime(current_start)
                    matches = intervals.index[intervals["Start"] == current_start_ts].tolist()
                    if matches:
                        idx = matches[0]
                        if idx >= 12:
                            prev_colors = intervals.loc[idx-12:idx-1, "Color"].astype(str).str.lower().tolist()
                            if all(c in {"orange", "red"} for c in prev_colors):
                                try:
                                    send_api()
                                    machine_state["power"] = "on"
                                    result["triggered"] = True
                                    result["action"] = "started_yellow_after_red"
                                    print(f"🟡 AUTO-START: Yellow after 12 red/orange intervals, machine started!")
                                except Exception as e:
                                    result["error"] = f"Failed to send API: {str(e)}"
                                    result["action"] = "failed"
                            else:
                                result["action"] = "yellow_waiting"
                        else:
                            result["action"] = "yellow_not_enough_history"
            except Exception as e:
                result["action"] = f"yellow_check_failed: {str(e)}"
        else:
            result["action"] = f"color_{color_now}_no_action"
        
        result["ok"] = True
        result["power"] = machine_state.get("power")
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "ok": False, 
            "error": str(e), 
            "trace": traceback.format_exc(),
            "power": machine_state.get("power")
        }), 500


def _latest_colored_csv():
    # Use absolute path based on this file's location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base = os.path.join(script_dir, "data")
    try:
        files = [f for f in os.listdir(base) if re.match(r"next_day_predictions_colored_\d{4}-\d{2}-\d{2}\.csv", f)]
        if not files:
            return os.path.join(base, "next_day_predictions_colored_2025-10-18.csv")
        files.sort(reverse=True)
        return os.path.join(base, files[0])
    except Exception as e:
        # Fallback to absolute path
        return os.path.join(base, "next_day_predictions_colored_2025-10-18.csv")


@app.route("/decision", methods=["POST", "GET"])
def decision():
    try:
        from use import color as use_color, _build_intervals
        from api import send_api
    except Exception:
        return jsonify({"ok": False, "error": "use.py not available"}), 500

    result = {
        "ok": False,
        "inside_interval": False,
        "details": None,
        "power": machine_state.get("power"),
        "triggered": False,
    }

    try:
        when_str = request.args.get("when") or ((request.json or {}).get("when") if request.is_json else None)
        when = None
        if when_str:
            try:
                norm = when_str.replace('Z', '+00:00')
                when = datetime.fromisoformat(norm)
                if getattr(when, 'tzinfo', None) is not None:
                    when = when.astimezone().replace(tzinfo=None)
            except Exception:
                when = None

        csv_path = _latest_colored_csv()
        inside, details = use_color(csv_path=csv_path, when=when)
        result["inside_interval"] = bool(inside)
        if details:
            safe = {k: (v.isoformat() if hasattr(v, 'isoformat') else v) for k, v in details.items()}
            result["details"] = safe

        # Decision logic: check color and trigger API if appropriate
        should_trigger = False
        color_now = (details or {}).get("Color")
        
        if color_now == "green":
            # Always send API for green - immediate start
            should_trigger = True
            try:
                send_api()
                machine_state["power"] = "on"
                result["triggered"] = True
            except Exception as e:
                result["error"] = f"Failed to send API: {str(e)}"
        elif color_now == "yellow":
            # For yellow: check if previous 12 intervals were orange or red
            try:
                df = pd.read_csv(csv_path)
                intervals = _build_intervals(df, time_col="Data")
                current_start = details.get("Start")
                if current_start:
                    current_start_ts = current_start if isinstance(current_start, pd.Timestamp) else pd.to_datetime(current_start)
                    matches = intervals.index[intervals["Start"] == current_start_ts].tolist()
                    if matches:
                        idx = matches[0]
                        if idx >= 12:
                            prev_colors = intervals.loc[idx-12:idx-1, "Color"].astype(str).str.lower().tolist()
                            if all(c in {"orange", "red"} for c in prev_colors):
                                should_trigger = True
                                try:
                                    send_api()
                                    machine_state["power"] = "on"
                                    result["triggered"] = True
                                except Exception as e:
                                    result["error"] = f"Failed to send API: {str(e)}"
            except Exception:
                pass
        
        result["power"] = machine_state.get("power")
        result["ok"] = True
        return jsonify(result)
    except Exception as e:
        return jsonify({"ok": False, "error": str(e), "trace": traceback.format_exc()}), 500


@app.route("/windows", methods=["GET"])
def windows():
    try:
        from use import _build_intervals as build_intervals, find_interval as find_interval
    except Exception:
        return jsonify({"ok": False, "error": "use.py not available"}), 500

    try:
        duration = max(1, int(request.args.get('duration', '60')))
        window_size = max(1, math.ceil(duration / 10))
        csv_path = _latest_colored_csv()
        df = pd.read_csv(csv_path)
        df['Data'] = pd.to_datetime(df['Data'], errors='coerce')
        df = df.dropna(subset=['Data']).sort_values('Data').reset_index(drop=True)
        intervals = build_intervals(df, time_col='Data')

        now = datetime.now()
        row_now = find_interval(df, now, time_col='Data')
        if row_now is not None and 'Scor_pred' in row_now:
            try:
                current_score = float(row_now['Scor_pred'])
            except Exception:
                current_score = float(df['Scor_pred'].iloc[-1])
        else:
            current_score = float(df['Scor_pred'].iloc[-1])

        scores_all = [float(x) for x in df['Scor_pred'].tolist() if pd.notna(x)]
        scores_all.sort()
        def percentile_for(value: float) -> int:
            if not scores_all:
                return 0
            for i, s in enumerate(scores_all):
                if s >= value:
                    return int(round((i / len(scores_all)) * 100))
            return 100

        results = []
        n = len(df)
        for i in range(0, n - window_size + 1):
            w = df.iloc[i:i+window_size]
            w_scores = [float(x) for x in w['Scor_pred'].tolist() if pd.notna(x)]
            if not w_scores:
                continue
            avg = sum(w_scores) / len(w_scores)
            mn, mx = min(w_scores), max(w_scores)
            stability_value = mx - mn
            stability = 'ridicată' if stability_value <= 5 else ('medie' if stability_value <= 10 else 'scăzută')
            start = w['Data'].iloc[0].strftime('%H:%M')
            end = w['Data'].iloc[-1].strftime('%H:%M')
            results.append({
                'start': start,
                'end': end,
                'avgScore': round(avg),
                'percentile': percentile_for(avg),
                'deltaVsNow': round(avg - current_score, 2),
                'stability': stability,
                'stabilityValue': round(stability_value, 2),
                'trend': 'stabil',
            })

        results.sort(key=lambda x: (-x['avgScore'], x['stabilityValue']))
        return jsonify({ 'ok': True, 'duration': duration, 'currentScore': round(current_score, 2), 'windows': results[:3] })
    except Exception as e:
        return jsonify({"ok": False, "error": str(e), "trace": traceback.format_exc()}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)