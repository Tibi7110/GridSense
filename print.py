from sklearn.metrics import r2_score, mean_squared_error
try:
    # Prefer the new API when available to avoid deprecation warnings
    from sklearn.metrics import root_mean_squared_error as sk_rmse
except Exception:  # pragma: no cover
    sk_rmse = None

import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

def printf(y_test, y_pred):
    """Print regression metrics for predictions vs ground truth.

    - R2: coefficient of determination (1.0 is perfect, can be negative)
    - RMSE: root mean squared error (lower is better, in target units)
    """
    r2 = r2_score(y_test, y_pred)
    rmse = sk_rmse(y_test, y_pred) if sk_rmse is not None else mean_squared_error(y_test, y_pred, squared=False)
    print(f"R2: {r2:.4f}")
    print(f"RMSE: {rmse:.4f}")

def plot_predictions_hour_line(
    pred_df: pd.DataFrame,
    score_col: str = "Scor_pred",
    save_path: str | None = None,
    show: bool = False,
):
    """Plot a line chart of average predicted score by hour (0..23).

    Inputs:
    - pred_df: DataFrame with 'Data' or 'Ora' and the score column.
    - score_col: Column name for predicted scores.
    - save_path: Optional path to save the figure; if None, won't save.
    - show: Whether to display the plot interactively (default False).

    Returns: (fig, ax)
    """
    if score_col not in pred_df.columns:
        raise ValueError(f"Missing '{score_col}' column in predictions DataFrame")

    df = pred_df.copy()
    if 'Data' in df.columns:
        df['Data'] = pd.to_datetime(df['Data'], errors='coerce')
        df['Ora'] = df['Data'].dt.hour
    elif 'Ora' not in df.columns:
        raise ValueError("Provide either 'Data' datetime column or 'Ora' column")

    hourly = (
        df.groupby('Ora', as_index=False)
          .agg({score_col: 'mean'})
          .sort_values('Ora')
    )

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(hourly['Ora'], hourly[score_col], marker='o', linewidth=2)
    ax.set_xlabel('Hour of day')
    ax.set_ylabel(score_col)
    ax.set_title('Average predicted score by hour')
    ax.set_xticks(range(0, 24))
    ax.grid(True, linestyle='--', alpha=0.3)

    if save_path:
        try:
            fig.savefig(save_path, bbox_inches='tight')
            print(f"Saved hour line plot to {save_path}")
        except Exception as e:
            print(f"Warning: could not save hour line plot to {save_path}: {e}")

    if show:
        plt.show()
    else:
        plt.close(fig)

    return fig, ax