import pandas as pd
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl")

def data():
    def calculate_percentage(supply, energy_source):
        try:
            energy_source = float(energy_source)
            supply = float(supply)
            if supply == 0:
                return 0
            return energy_source / supply
        except ValueError:
            return 0

    def clean_energy(df):
        # `row` is a pandas Series for a single record
        row = df
        scor = 0.0

        # safe numeric conversion helper
        def to_num(x):
            try:
                return float(x)
            except Exception:
                return 0.0

        prod = to_num(row.get('Productie[MW]', 0))
        scor += 0.35 * calculate_percentage(prod, row.get('Hidrocarburi[MW]', 0))
        scor -= 0.2 * calculate_percentage(prod, row.get('Carbune[MW]', 0))
        scor += calculate_percentage(prod, row.get('Ape[MW]', 0))
        scor += calculate_percentage(prod, row.get('Nuclear[MW]', 0))
        scor += calculate_percentage(prod, row.get('Eolian[MW]', 0))
        scor += calculate_percentage(prod, row.get('Foto[MW]', 0))
        scor += calculate_percentage(prod, row.get('Biomasa[MW]', 0))

        sold = to_num(row.get('Sold[MW]', 0))
        if sold > 0:
            scor -= 1.2 * calculate_percentage(prod, sold)
        else:
            scor += 2.5 * calculate_percentage(prod, sold)

        scor *= 100
        # ensure numeric
        try:
            return float(scor)
        except Exception:
            return 0.0



    df = pd.read_excel("/home/tibi/Proiecte/Sustenability/input/Grafic_SEN (1).xlsx")
    # parse datetime first to allow dropping invalid rows early
    df['Data'] = pd.to_datetime(df['Data'], errors='coerce', dayfirst=True)
    # compute score per row
    df['Scor'] = df.apply(clean_energy, axis=1)
    df['Ora'] = df['Data'].dt.hour
    df['Minut'] = df['Data'].dt.minute
    df['Ziua'] = df['Data'].dt.day
    df['Luna'] = df['Data'].dt.month
    df['Weekday'] = df['Data'].dt.weekday

    # drop rows with invalid/missing Data (which often indicate empty trailing rows in the Excel file)
    df = df.dropna(subset=['Data'])

    return df