from data import data
from model import train
from print import printf

if __name__ == "__main__":
    df = data()
    train_df, test_df, y_pred, y_test = train(df)
    printf(y_test, y_pred)