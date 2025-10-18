from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_squared_error

def train(df):
    # split
    train_df, test_df = train_test_split(df, test_size=0.285, random_state=42)

    # target
    if 'Scor' not in df.columns:
        raise ValueError("DataFrame must contain a 'Scor' column as target")
    y_train = train_df['Scor']
    y_test = test_df['Scor']

    # build feature matrix: drop non-feature cols like target and datetimes, then keep numeric columns
    drop_cols = ['Scor', 'Data']
    X_train = train_df.drop(columns=[c for c in drop_cols if c in train_df.columns], errors='ignore')
    X_test = test_df.drop(columns=[c for c in drop_cols if c in test_df.columns], errors='ignore')

    # keep only numeric features
    X_train = X_train.select_dtypes(include=['number'])
    X_test = X_test.select_dtypes(include=['number'])

    # ensure we have a 2D array (DataFrame). If only a single numeric column exists, select_dtypes returns a DataFrame.
    if X_train.shape[1] == 0:
        raise ValueError('No numeric feature columns found. Ensure DataFrame has numeric features besides "Scor" and "Data"')

    model = RandomForestRegressor(random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    rmse = mse ** 0.5
    print(f"R2: {r2_score(y_test, y_pred):.4f}")
    print(f"RMSE: {rmse:.4f}")

    return train_df, test_df, y_pred, y_test