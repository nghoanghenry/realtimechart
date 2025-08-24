import requests
import os


def fetch_price(symbol: str, interval: str, limit: int, start_time: str, end_time: str) -> list[dict[str, float]]:
    query = f'?interval={interval}&limit={limit}'
    if start_time: query += f'&startTime={start_time}'
    if end_time: query += f'&endTime={end_time}'
    response = requests.get(f'{os.getenv('BINANCE_URL')}/{symbol}{query}')
    return response.json()


def fetch_sentiment(symbol: str, interval: str, limit: int, start_time: str, end_time: str) -> list[float]:
    query = f'?symbol={symbol}&interval={interval}&limit={limit}'
    if start_time: query += f'&startTime={start_time}'
    if end_time: query += f'&endTime={end_time}'
    response = requests.get(f'{os.getenv('SENTIMENT_URL')}{query}')
    return response.json()
