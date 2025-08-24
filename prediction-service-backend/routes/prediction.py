import os

import torch
from flask import Blueprint, request, jsonify

from service import fetch_price, fetch_sentiment, CryptoModel

prediction_bp = Blueprint('prediction', __name__, url_prefix='/predict')


@prediction_bp.route('/', methods=['GET'])
def predict():
    seq_len = int(os.getenv('MODEL_SEQ_LEN'))

    symbol = request.args.get('symbol', 'BTCUSDT', type=str)
    interval = request.args.get('interval', '1h', type=str)
    limit = request.args.get('limit', 1, type=int) + seq_len
    start_time = request.args.get('startTime', '', type=str)
    end_time = request.args.get('endTime', '', type=str)

    price_data = fetch_price(symbol, interval, limit, start_time, end_time)
    sentiment_data = fetch_sentiment(symbol, interval, limit, start_time, end_time)

    data = [[float(candle['close']), float(candle['open']), float(candle['high']),
            float(candle['low']), float(candle['volume']), sentiment_score]
            for candle, sentiment_score in zip(price_data, sentiment_data)]
    inputs = torch.tensor(data, dtype=torch.float32)
    windows = list(inputs.unfold(0, seq_len + 1, 1).permute(0, 2, 1))
    
    model = CryptoModel()
    outputs = [model.model(w).item() for w in windows]

    return jsonify({'prediction': outputs})
