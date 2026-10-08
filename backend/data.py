import pandas as pd
import warnings
from pathlib import Path
warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')


def energy_score(df):
    """Energy score with +2.5% of the base score per 1% of consumption exported."""
    production = df['Productie[MW]']
    clean = df[['Ape[MW]', 'Nuclear[MW]', 'Eolian[MW]', 'Foto[MW]', 'Biomasa[MW]']].sum(axis=1)
    sold = df['Sold[MW]']
    consumption = df['Consum[MW]']
    if consumption.isna().any() or (consumption <= 0).any():
        raise ValueError('Export bonus requires positive consumption')
    base_score = 100 * (0.35 * df['Hidrocarburi[MW]'] + 0.2 * df['Carbune[MW]'] + clean
                        - 1.2 * sold.clip(lower=0)) / production
    export_multiplier = 1 + 2.5 * (-sold).clip(lower=0) / consumption
    return base_score * export_multiplier


def data(input_path=None):
    input_path = input_path or Path(__file__).resolve().parent / 'input' / 'Grafic_SEN (1).xlsx'
    df = pd.read_excel(input_path)
    df['Data'] = pd.to_datetime(df['Data'], errors='coerce', dayfirst=True)
    df = df.dropna(subset=['Data']).copy()
    columns = [c for c in df if '[MW]' in c]
    df['Estimated'] = df[columns].astype(str).apply(lambda s: s.str.contains('*', regex=False)).any(axis=1)
    for column in columns:
        df[column] = pd.to_numeric(df[column].astype(str).str.replace('*', '', regex=False).str.strip(), errors='coerce')
    if df[columns].isna().any().any() or (df['Productie[MW]'] <= 0).any():
        raise ValueError('Invalid or missing MW values in Excel; refusing to replace them with zero')
    df = df.sort_values('Data', kind='stable').drop_duplicates('Data', keep='last').reset_index(drop=True)
    df['Scor'] = energy_score(df)
    df['Ora'] = df['Data'].dt.hour
    df['Minut'] = df['Data'].dt.minute
    df['Ziua'] = df['Data'].dt.day
    df['Luna'] = df['Data'].dt.month
    df['Weekday'] = df['Data'].dt.weekday
    return df
