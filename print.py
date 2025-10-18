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


def plot_predictions_by_hour_minute(
    pred_df: pd.DataFrame,
    score_col: str = "Scor_pred",
    save_path: str | None = None,
    show: bool = False,
    cmap: str = "viridis",
):
    """Plot predictions by hour/minute with score as color.

    Inputs:
    - pred_df: DataFrame with either a 'Data' datetime column or both 'Ora' and 'Minut'. Must contain `score_col`.
    - score_col: Column name containing predicted scores (default 'Scor_pred').
    - save_path: Optional file path to save the plot (PNG, SVG, etc.). If None, won't save.
    - show: Whether to display the plot interactively (default False).
    - cmap: Matplotlib colormap name (default 'viridis').

    Returns: (fig, ax)
    """
    if score_col not in pred_df.columns:
        raise ValueError(f"Missing '{score_col}' column in predictions DataFrame")

    df = pred_df.copy()
    if 'Data' in df.columns:
        df['Data'] = pd.to_datetime(df['Data'], errors='coerce')
        df['Ora'] = df['Data'].dt.hour
        df['Minut'] = df['Data'].dt.minute
    else:
        if 'Ora' not in df.columns or 'Minut' not in df.columns:
            raise ValueError("Provide either 'Data' datetime column or both 'Ora' and 'Minut' columns")

    fig, ax = plt.subplots(figsize=(10, 6))
    sc = ax.scatter(df['Ora'], df['Minut'], c=df[score_col], cmap=cmap, s=30, edgecolor='none')
    cbar = plt.colorbar(sc, ax=ax)
    cbar.set_label(score_col)
    ax.set_xlabel('Hour of day')
    ax.set_ylabel('Minute')
    ax.set_title('Predicted score by hour and minute')
    ax.set_xlim(-0.5, 23.5)
    ax.set_ylim(-2, 61)
    ax.grid(True, linestyle='--', alpha=0.3)

    if save_path:
        try:
            fig.savefig(save_path, bbox_inches='tight')
            print(f"Saved plot to {save_path}")
        except Exception as e:
            print(f"Warning: could not save plot to {save_path}: {e}")

    if show:
        plt.show()
    else:
        plt.close(fig)

    return fig, ax


def plot_predictions_heatmap(
    pred_df: pd.DataFrame,
    score_col: str = "Scor_pred",
    save_path: str | None = None,
    show: bool = False,
    cmap: str = "viridis",
    minute_tick_step: int = 10,
    hour_tick_step: int = 1,
):
    """Plot a heatmap (Hour x Minute) with score as color.

    Inputs:
    - pred_df: DataFrame with 'Data' or both 'Ora' and 'Minut', plus score_col.
    - score_col: column with predicted scores.
    - save_path: optional file path to save image; if None, only shows/returns.
    - show: whether to display the plot interactively.
    - cmap: matplotlib colormap.
    - minute_tick_step: y-axis tick interval for minutes.
    - hour_tick_step: x-axis tick interval for hours.

    Returns: (fig, ax)
    """
    if score_col not in pred_df.columns:
        raise ValueError(f"Missing '{score_col}' column in predictions DataFrame")

    df = pred_df.copy()
    if 'Data' in df.columns:
        df['Data'] = pd.to_datetime(df['Data'], errors='coerce')
        df['Ora'] = df['Data'].dt.hour
        df['Minut'] = df['Data'].dt.minute
    else:
        if 'Ora' not in df.columns or 'Minut' not in df.columns:
            raise ValueError("Provide either 'Data' datetime column or both 'Ora' and 'Minut' columns")

    # Create a complete Hour x Minute grid and aggregate scores (mean if multiple)
    pivot = (
        df.pivot_table(index='Minut', columns='Ora', values=score_col, aggfunc='mean')
        .reindex(index=range(0, 60), columns=range(0, 24))
    )

    fig, ax = plt.subplots(figsize=(12, 6))
    # Use imshow with origin lower so minute 0 is at the bottom
    im = ax.imshow(pivot.values, aspect='auto', origin='lower', cmap=cmap)
    cbar = plt.colorbar(im, ax=ax)
    cbar.set_label(score_col)

    # Set ticks and labels
    hours = np.arange(0, 24, hour_tick_step)
    minutes = np.arange(0, 60, minute_tick_step)
    ax.set_xticks(hours)
    ax.set_yticks(minutes)
    ax.set_xticklabels(hours)
    ax.set_yticklabels(minutes)
    ax.set_xlabel('Hour of day')
    ax.set_ylabel('Minute')
    ax.set_title('Predicted score heatmap by hour and minute')
    ax.grid(False)

    if save_path:
        try:
            fig.savefig(save_path, bbox_inches='tight')
            print(f"Saved heatmap to {save_path}")
        except Exception as e:
            print(f"Warning: could not save heatmap to {save_path}: {e}")

    if show:
        plt.show()
    else:
        plt.close(fig)

    return fig, ax


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