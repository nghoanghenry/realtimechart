import requests
import os


def fetch_price(symbol: str, interval: str, limit=1000) -> list[float]:
    response = requests.get(f'{os.getenv('BINANCE_URL')}?symbol={symbol}&interval={interval}&limit={limit}')
    data = response.json()
    return [candle[4] for candle in data]


def fetch_sentiment(symbol: str, limit=1000) -> list[float]:
    response = requests.get(f'{os.getenv('SENTIMENT_URL')}?symbol={symbol}&limit={limit}')
    data = response.json()
    return [data['sentiment'] for data in data]
