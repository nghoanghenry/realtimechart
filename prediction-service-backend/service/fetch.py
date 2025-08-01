import requests
import os


def fetch_price(symbol: str) -> list[float]:
    response = requests.get(f'{os.getenv('BINANCE_URL')}?symbol={symbol}&interval=1d&limit=24')
    return response.json()


def fetch_sentiment(symbol: str) -> list[float]:
    response = requests.get(f'{os.getenv('SENTIMENT_URL')}?symbol={symbol}&limit=1024')
    data = response.json()
    return [data['sentiment'] for data in data]
