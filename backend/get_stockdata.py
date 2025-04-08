#!/usr/bin/env python3
import sys
import json
import traceback

try:
    import pandas as pd
    import yfinance as yf
    import numpy as np
    from sklearn.preprocessing import MinMaxScaler
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import Dense, LSTM
    import math
    from sklearn.metrics import mean_squared_error

    combined_args = sys.argv[1]
    start, end, stock_symbol = combined_args.split(',')

    def predict_stock_prices(start, end, stock_symbol, ttldays=30):
        df = yf.download(stock_symbol + ".NS", start, end)

        if df.empty:
            raise ValueError(f"No data found for stock: {stock_symbol} from {start} to {end}")

        df1 = df.reset_index()['Close']
        scaler = MinMaxScaler(feature_range=(0, 1))
        df1 = scaler.fit_transform(np.array(df1).reshape(-1, 1))

        training_size = int(len(df1) * 0.75)
        test_size = len(df1) - training_size
        train_data, test_data = df1[0:training_size, :], df1[training_size:len(df1), :1]

        def create_dataset(dataset, time_step=1):
            dataX, dataY = [], []
            for i in range(len(dataset) - time_step - 1):
                a = dataset[i:(i + time_step), 0]
                dataX.append(a)
                dataY.append(dataset[i + time_step, 0])
            return np.array(dataX), np.array(dataY)

        time_step = max(test_size - 5, 10)  # fallback in case test set is small

        X_train, y_train = create_dataset(train_data, time_step)
        X_test, y_test = create_dataset(test_data, time_step)

        X_train = X_train.reshape(X_train.shape[0], X_train.shape[1], 1)
        X_test = X_test.reshape(X_test.shape[0], X_test.shape[1], 1)

        model = Sequential()
        model.add(LSTM(50, return_sequences=True, input_shape=(time_step, 1)))
        model.add(LSTM(50, return_sequences=True))
        model.add(LSTM(50))
        model.add(Dense(1))
        model.compile(loss="mean_squared_error", optimizer="adam")

        model.fit(X_train, y_train, validation_data=(X_test, y_test), epochs=10, batch_size=32, verbose=0)

        x_input = test_data[-time_step:].reshape(1, time_step, 1)

        predictions = []
        for i in range(ttldays):
            yhat = model.predict(x_input, verbose=0)
            predictions.append(yhat[0, 0])
            x_input = np.append(x_input, yhat.reshape(1, 1, 1), axis=1)
            x_input = x_input[:, 1:, :]

        predictions = scaler.inverse_transform(np.array(predictions).reshape(-1, 1))
        return predictions.tolist()

    predictions = predict_stock_prices(start, end, stock_symbol)
    print(json.dumps(predictions))

except Exception as e:
    print(f"ERROR: {str(e)}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)
