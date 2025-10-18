from sklearn.metrics import r2_score, mean_squared_error
try:
    # Prefer the new API when available to avoid deprecation warnings
    from sklearn.metrics import root_mean_squared_error as sk_rmse
except Exception:  # pragma: no cover
    sk_rmse = None

import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
from scor import color_by_quartiles

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

    hourly = df.groupby('Ora', as_index=False).agg({score_col: 'mean'})
    hourly = hourly.set_index('Ora').sort_index().reset_index()

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


def print_hourly_line_colors(
    pred_df: pd.DataFrame,
    score_col: str = "Scor_pred",
    color_col: str = "Color",
):
    """Compute hourly average score and print a table with color labels based on quartiles.

    - pred_df: DataFrame with 'Data' or 'Ora' and the score column (default 'Scor_pred')
    - score_col: the numeric score column to aggregate by hour
    - color_col: name of the output color column

    This function DOES NOT modify values, only adds a color label per hour.
    """
    if score_col not in pred_df.columns:
        raise ValueError(f"Missing '{score_col}' column in predictions DataFrame")

    df = pred_df.copy()
    if 'Data' in df.columns and 'Ora' not in df.columns:
        df['Data'] = pd.to_datetime(df['Data'], errors='coerce')
        df['Ora'] = df['Data'].dt.hour
    elif 'Ora' not in df.columns:
        raise ValueError("Provide either 'Data' datetime column or 'Ora' column")

    hourly = df.groupby('Ora', as_index=False)[score_col].mean()
    hourly = hourly.set_index('Ora').sort_index().reset_index()

    # color by quartiles
    hourly_colored = color_by_quartiles(hourly, score_col=score_col, out_col=color_col)

    print("Hourly average score with color label:")
    print(hourly_colored[['Ora', score_col, color_col]].to_string(index=False))

    return hourly_colored


def plot_hourly_colors_line(
    hourly_df: pd.DataFrame,
    hour_col: str = 'Ora',
    score_col: str = 'Scor_pred',
    color_col: str = 'Color',
    save_path: str | None = None,
    show: bool = False,
):
    """Plot a line chart from an hourly colored DataFrame (hour vs score) and color markers by color_col.

    Expects columns:
    - hour_col (default 'Ora')
    - score_col (default 'Scor_pred')
    - color_col (default 'Color')
    """
    for col in (hour_col, score_col, color_col):
        if col not in hourly_df.columns:
            raise ValueError(f"Missing '{col}' in hourly DataFrame")

    df = hourly_df.copy()
    df = df.sort_values(by=hour_col)

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(df[hour_col], df[score_col], color='#5A6FDC', linewidth=2, alpha=0.8)

    # Colored markers by category
    color_map = {
        'green': '#2ecc71',
        'yellow': '#f1c40f',
        'orange': '#e67e22',
        'red': '#e74c3c',
    }
    for color_name, color_hex in color_map.items():
        mask = df[color_col].str.lower() == color_name
        if mask.any():
            ax.scatter(df.loc[mask, hour_col], df.loc[mask, score_col],
                       color=color_hex, label=color_name, s=50, zorder=3, edgecolor='none')

    ax.set_xlabel('Hour of day')
    ax.set_ylabel(score_col)
    ax.set_title('Hourly average predicted score with colors')
    ax.set_xticks(range(0, 24))
    ax.grid(True, linestyle='--', alpha=0.3)
    ax.legend(title='Color', ncols=4, loc='upper center', bbox_to_anchor=(0.5, 1.15))

    if save_path:
        try:
            fig.savefig(save_path, bbox_inches='tight')
            print(f"Saved hourly line (from CSV) to {save_path}")
        except Exception as e:
            print(f"Warning: could not save hourly line plot to {save_path}: {e}")

    if show:
        plt.show()
    else:
        plt.close(fig)

    return fig, ax