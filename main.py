import os
from data import data
from model import train, predict_next_day
from print import plot_predictions_hour_line, print_hourly_line_colors, plot_hourly_colors_line
from scor import color_by_quartiles, describe_quartiles

if __name__ == "__main__":
    df = data()
    train_df, test_df, y_pred, y_test, model = train(df)
    # Optional next-day prediction path controlled by env flag
    if os.getenv("PREDICT_NEXT_DAY", "false").lower() in ("1", "true", "yes"): 
        # default output directory is the project 'data' folder
        base_dir = os.path.dirname(os.path.abspath(__file__))
        default_out_dir = os.path.join(base_dir, "data")
        out_dir = os.getenv("OUTPUT_DIR", default_out_dir)
        try:
            os.makedirs(out_dir, exist_ok=True)
        except Exception as e:
            print(f"Warning: could not create output directory {out_dir}: {e}")

        next_day_df = predict_next_day(df, model)
        # show a small sample
        print("\nNext-day predictions (head):")
        print(next_day_df.head())
        # derive next-day date string for filenames, e.g., 2025-10-19
        try:
            next_day_str = next_day_df['Data'].dt.date.iloc[0].isoformat()
        except Exception:
            next_day_str = "next_day"
        # optionally save to CSV
        out_path = os.getenv("NEXT_DAY_OUT") or os.path.join(out_dir, f"next_day_predictions_{next_day_str}.csv")
        try:
            next_day_df.to_csv(out_path, index=False)
            print(f"Saved next-day predictions to {out_path}")
        except Exception as e:
            print(f"Warning: could not save predictions to {out_path}: {e}")

        # save hourly line chart as well
        hour_line_out = os.getenv("NEXT_DAY_HOURLY_LINE") or os.path.join(out_dir, f"next_day_predictions_hourly_{next_day_str}.png")
        try:
            plot_predictions_hour_line(next_day_df, save_path=hour_line_out, show=False)
        except Exception as e:
            print(f"Warning: could not generate hourly line plot {hour_line_out}: {e}")

        # Add quartile-based colors to next-day predictions and save
        try:
            next_day_colored = color_by_quartiles(next_day_df.copy(), score_col='Scor_pred', out_col='Color')
            colored_path = os.getenv("NEXT_DAY_COLORED_OUT") or os.path.join(out_dir, f"next_day_predictions_colored_{next_day_str}.csv")
            next_day_colored.to_csv(colored_path, index=False)
            print(f"Saved colored next-day predictions to {colored_path}")
        except Exception as e:
            print(f"Warning: could not color predictions: {e}")

        # Print and save hourly average score with color labels
        try:
            hourly_colored = print_hourly_line_colors(next_day_df, score_col='Scor_pred', color_col='Color')
            hourly_out = os.getenv("NEXT_DAY_HOURLY_COLORS_OUT") or os.path.join(out_dir, f"hourly_line_colors_{next_day_str}.csv")
            hourly_colored.to_csv(hourly_out, index=False)
            print(f"Saved hourly color table to {hourly_out}")
            # Save a line chart from the hourly colored CSV
            hourly_line_out = os.getenv("NEXT_DAY_HOURLY_COLORS_PLOT") or os.path.join(out_dir, f"hourly_line_colors_{next_day_str}.png")
            plot_hourly_colors_line(hourly_colored, hour_col='Ora', score_col='Scor_pred', color_col='Color', save_path=hourly_line_out, show=False)
        except Exception as e:
            print(f"Warning: could not generate hourly color labels: {e}")

#PREDICT_NEXT_DAY=true python3 /home/tibi/Proiecte/Sustenability/main.py