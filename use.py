import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, Tuple
from api import send_api

def _build_intervals(df: pd.DataFrame, time_col: str = "Data") -> pd.DataFrame:
    """
    Ensure DataFrame has [start, end) intervals by creating an 'End' column from the next row's start.
    For the last row, infer frequency from median difference, defaulting to 10 minutes if unknown.
    Returns a new DataFrame with 'Start' (alias of time_col) and 'End' columns.
    """
    if time_col not in df.columns:
        raise ValueError(f"Column '{time_col}' not found in DataFrame")

    out = df.copy()
    # Parse datetime and sort
    out[time_col] = pd.to_datetime(out[time_col], errors="coerce")
    out = out.dropna(subset=[time_col]).sort_values(time_col).reset_index(drop=True)

    # Compute frequency from deltas
    deltas = out[time_col].diff().dropna()
    if not deltas.empty:
        # Use median of total seconds to be robust and avoid dtype issues
        try:
            med_seconds = deltas.dt.total_seconds().median()
            if pd.isna(med_seconds) or med_seconds <= 0:
                med_seconds = 600.0  # default 10 minutes
            freq = pd.to_timedelta(med_seconds, unit="s")
        except Exception:
            freq = pd.Timedelta(minutes=10)
    else:
        freq = pd.Timedelta(minutes=10)

    out["Start"] = out[time_col]
    out["End"] = out[time_col].shift(-1)
    # Fill last interval end using inferred frequency
    if not out.empty:
        last_start = out[time_col].iloc[-1]
        if not isinstance(last_start, pd.Timestamp):
            last_start = pd.Timestamp(last_start)
        out.loc[out.index[-1], "End"] = last_start + freq

    return out


def find_interval(
    df: pd.DataFrame,
    when: datetime,
    time_col: str = "Data",
) -> Optional[pd.Series]:
    """
    Return the row (with Start/End) whose interval [Start, End) contains 'when'.
    If none found, return None.
    """
    intervals = _build_intervals(df, time_col=time_col)
    mask = (intervals["Start"] <= when) & (when < intervals["End"])
    if mask.any():
        return intervals.loc[mask].iloc[0]
    return None


def color(
    csv_path: str = "/home/tibi/Proiecte/Sustenability/data/next_day_predictions_colored_2025-10-18.csv",
    when: Optional[datetime] = None,
) -> Tuple[bool, Optional[dict]]:
    """
    Load the colored predictions CSV and verify if the given datetime (default: now)
    falls within any [Start, End) interval in the file.

    Returns (is_in_interval, details_dict or None).
    details_dict includes: Start, End, Scor_pred (if available), Color (if available).
    """
    if when is None:
        when = datetime.now()

    df = pd.read_csv(csv_path)

    row = find_interval(df, when, time_col="Data")
    print("Current time:", when.strftime("%Y-%m-%d %H:%M:%S"))
    if row is None:
        print("Outside of all intervals in CSV")
        return False, None

    details = {
        "Start": row.get("Start"),
        "End": row.get("End"),
        "Scor_pred": row.get("Scor_pred") if "Scor_pred" in row else None,
        "Color": row.get("Color") if "Color" in row else None,
    }
    # Friendly printout
    print(
        f"Inside interval: [{details['Start']}, {details['End']}) | "
        f"Scor_pred={details['Scor_pred']}, Color={details['Color']}"
    )
    return True, details

def send(
    dictionary: Optional[dict],
    csv_path: str = "/home/tibi/Proiecte/Sustenability/data/next_day_predictions_colored_2025-10-18.csv",
):
    """
    Trigger send() based on current color and recent history:
    - Always send for green (unchanged behavior unless requested otherwise)
    - For yellow: only send if the previous 12 intervals were all orange or red
    - For other colors (orange/red): do not send
    """
    color_now = (dictionary or {}).get("Color")
    if color_now is None:
        return

    # Always send for green (kept as-is)
    if color_now == "green":
        send_api()
        return

    # For yellow, check previous 12 intervals in the CSV
    if color_now == "yellow":
        try:
            df = pd.read_csv(csv_path)
            intervals = _build_intervals(df, time_col="Data")
            # Locate current interval by Start timestamp if available
            if dictionary is None:
                return
            current_start = dictionary.get("Start")
            if current_start is None:
                return
            # Normalize to Timestamp for safe comparison
            current_start_ts = current_start if isinstance(current_start, pd.Timestamp) else pd.to_datetime(current_start)
            # Find index of the current interval
            matches = intervals.index[intervals["Start"] == current_start_ts].tolist()
            if not matches:
                return
            idx = matches[0]
            # Ensure we have at least 12 previous intervals
            if idx < 12:
                return
            prev_colors = intervals.loc[idx-12:idx-1, "Color"].astype(str).str.lower().tolist()
            allowed = {"orange", "red"}
            if all(c in allowed for c in prev_colors):
                send_api()
                return
        except Exception:
            return

if __name__ == "__main__":
    NUll, dictionary = color()
    send(dictionary)