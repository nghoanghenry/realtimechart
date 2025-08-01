import os

import pandas as pd
import torch
from sklearn.preprocessing import MinMaxScaler


class DataProcessor:
    def __init__(self) -> None:
        self.X_scaler = MinMaxScaler()
        self.y_scaler = MinMaxScaler()
        self.fit_scaler()

    def fit_scaler(self) -> None:
        cols = ['current_price_usd', 'trading_volume_24h', 'news_sentiment_score', 'price_change_24h_percent']
        df = pd.read_csv(os.getenv('TRAINING_DATA_PATH'))[cols].dropna()
        self.X_scaler.fit_transform(df[cols[:3]].values)
        self.y_scaler.fit_transform(df[cols[3:]].values)

    def preprocess(self, price_data, sentiment_data) -> torch.Tensor:
        # TODO with sentiment_data
        sentiment_value = torch.randint(1, 5, (1,)).item()  # just placeholder

        data = [[float(candle[1]), float(candle[5]), sentiment_value] for candle in price_data]
        scaled = self.X_scaler.transform(data)
        return torch.tensor(scaled).unsqueeze(dim=0).float()

    def postprocess(self, data) -> float:
        scaled = self.y_scaler.inverse_transform([[data.item()]])
        return scaled[0][0]
