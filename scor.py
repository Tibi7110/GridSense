import pandas as pd

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

	s = pd.to_numeric(df[score_col], errors='coerce')
	q1 = s.quantile(0.25)
	q2 = s.quantile(0.50)
	q3 = s.quantile(0.75)

	def map_color(v):
		try:
			x = float(v)
		except Exception:
			return 'red'
		if pd.isna(x):
			return 'red'
		if x >= q3:
			return 'green'
		if x >= q2:
			return 'yellow'
		if x >= q1:
			return 'orange'
		return 'red'

	df[out_col] = s.apply(map_color)
	return df


def describe_quartiles(df: pd.DataFrame, score_col: str = 'Scor') -> pd.Series:
	"""Return Q1, Q2, Q3 of the score column for quick inspection."""
	s = pd.to_numeric(df[score_col], errors='coerce')
	return pd.Series({
		'Q1': s.quantile(0.25),
		'Q2': s.quantile(0.5),
		'Q3': s.quantile(0.7),
	})
