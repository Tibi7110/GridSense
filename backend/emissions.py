"""User-configured operational CO2 factors, in g CO2/kWh (not lifecycle LCA)."""
import numpy as np
import pandas as pd

FACTORS_G_KWH = {"Carbune[MW]": 1000.0, "Hidrocarburi[MW]": 0.286,
                 "Ape[MW]": 0.0, "Nuclear[MW]": 0.0,
                 "Eolian[MW]": 0.0, "Foto[MW]": 0.0, "Import[MW]": 600.0}


def add_emissions(frame):
    out = frame.copy()
    imports = out['Sold[MW]'].clip(lower=0)
    supply = out['Productie[MW]'] + imports
    if (supply <= 0).any() or not np.isfinite(supply).all():
        raise ValueError('CO2 requires positive finite production + imports')
    out['Import[MW]'] = imports
    emissions = pd.Series(0.0, index=out.index)
    for source, factor in FACTORS_G_KWH.items():
        share = out[source].clip(lower=0) / supply
        out[source.replace('[MW]', '_share')] = share
        emissions += share * factor
    out['Biomasa_share'] = out['Biomasa[MW]'].clip(lower=0) / supply
    known = out[[c for c in FACTORS_G_KWH if c != 'Import[MW]'] + ['Biomasa[MW]']].clip(lower=0).sum(axis=1)
    out['Unallocated_share'] = (out['Productie[MW]'] - known).clip(lower=0) / supply
    out['CO2_g_kWh'] = emissions
    return out
