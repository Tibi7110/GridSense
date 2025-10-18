from sklearn.metrics import r2_score, mean_squared_error

def printf(y_test, y_pred):
    """Print regression metrics for predictions vs ground truth.

    - R2: coefficient of determination (1.0 is perfect, can be negative)
    - RMSE: root mean squared error (lower is better, in target units)
    """
    r2 = r2_score(y_test, y_pred)
    rmse = mean_squared_error(y_test, y_pred, squared=False)
    print(f"R2: {r2:.4f}")
    print(f"RMSE: {rmse:.4f}")