from typing import cast
import pandas as pd
import numpy as np

def color_by_quartiles(df: pd.DataFrame, score_col: str = 'Scor', out_col: str = 'ScorColor') -> pd.DataFrame:
	"""Add a color label column based on quartiles of the score column without altering values.

	Rules (customizable):
	- Score >= Q3 -> 'green'
	- Q2 <= Score < Q3 -> 'yellow'
	- Q1 <= Score < Q2 -> 'orange'
	- Score < Q1 -> 'red'

	Returns the same DataFrame with a new `out_col` column.
	"""
	if score_col not in df.columns:
		raise ValueError(f"Missing '{score_col}' column in DataFrame")

	# Coerce to numeric and drop NaNs for quantile computation
	# Ensure we operate on a pandas Series
	s = cast(pd.Series, pd.to_numeric(df[score_col], errors='coerce'))
	s_clean = cast(pd.Series, s).dropna()
	if s_clean.empty:
		# No valid values; default thresholds so mapping will mark NaNs as 'red'
		q1 = q2 = q3 = np.nan
	else:
		q1 = np.quantile(s_clean, 0.25)
		q2 = np.quantile(s_clean, 0.5)
		q3 = np.quantile(s_clean, 0.75)

	def map_color(v):
		try:
			x = float(v)
		except Exception:
			return 'red'
		if pd.isna(x):
			return 'red'
		if not pd.isna(q3) and x >= q3:
			return 'green'
		if not pd.isna(q2) and x >= q2:
			return 'yellow'
		if not pd.isna(q1) and x >= q1:
			return 'orange'
		return 'red'

	# Write to the requested output column name
	df[out_col] = cast(pd.Series, s).apply(map_color)
	return df


def describe_quartiles(df: pd.DataFrame, score_col: str = 'Scor') -> pd.Series:
	"""Return Q1, Q2, Q3 of the score column for quick inspection."""
	s = cast(pd.Series, pd.to_numeric(df[score_col], errors='coerce'))
	s = cast(pd.Series, s).dropna()
	if s.empty:
		return pd.Series({'Q1': np.nan, 'Q2': np.nan, 'Q3': np.nan})
	return pd.Series({
		'Q1': np.quantile(s, 0.25),
		'Q2': np.quantile(s, 0.5),
		'Q3': np.quantile(s, 0.75),
	})
