import requests
import os


def fetch_price(symbol: str, interval: str, limit: int) -> list[float]:
    response = requests.get(f'{os.getenv('BINANCE_URL')}{symbol}?interval={interval}&limit={limit}')
    return response.json()


def fetch_sentiment(symbol: str, interval: str, limit: int) -> list[float]:
    response = requests.get(f'{os.getenv('SENTIMENT_URL')}?symbol={symbol}&interval={interval}&limit={limit}')
    return response.json()
