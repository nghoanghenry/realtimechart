import os
from typing import Self

import pandas as pd
import torch
from sklearn.preprocessing import MinMaxScaler


class DataProcessor:
    _instance = None
    X_scaler = MinMaxScaler()
    y_scaler = MinMaxScaler()

    def __new__(cls) -> Self:
        if cls._instance is None:
            cls._instance = super(DataProcessor, cls).__new__(cls)
            cls._instance.fit_scaler()
        return cls._instance

    def fit_scaler(self) -> None:
        cols = ['current_price_usd', 'trading_volume_24h', 'news_sentiment_score', 'price_change_24h_percent']
        df = pd.read_csv(os.getenv('TRAINING_DATA_PATH'))[cols].dropna()
        self.X_scaler.fit_transform(df[cols[:3]].values)
        self.y_scaler.fit_transform(df[cols[3:]].values)

    def preprocess(self, price_data, sentiment_data) -> list[torch.Tensor]:
        data = [[float(candle[1]), float(candle[5]), sentiment_score]
                for candle, sentiment_score in zip(price_data, sentiment_data)]
        scaled = self.X_scaler.transform(data)
        tensor = torch.tensor(scaled).float()
        windows = tensor.unfold(0, min(int(os.getenv('MODEL_SEQ_LEN')), tensor.shape[0]), 1)
        windows = windows.permute(0, 2, 1).unsqueeze(1)
        return list(windows)

    def postprocess(self, data) -> float:
        scaled = self.y_scaler.inverse_transform([[data.item()]])
        return scaled[0][0]
