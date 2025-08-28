import os

import torch
from flask import Blueprint, request, jsonify

from service import fetch_price, fetch_sentiment, CryptoModel

prediction_bp = Blueprint("prediction", __name__, url_prefix="/predict")


@prediction_bp.route("/", methods=["GET"])
def predict():
    seq_len = int(os.getenv("MODEL_SEQ_LEN")) - 1

    symbol = request.args.get("symbol", "BTCUSDT", type=str)
    interval = request.args.get("interval", "1h", type=str)
    limit = request.args.get("limit", 1, type=int) + seq_len
    start_time = request.args.get("startTime", "", type=str)
    end_time = request.args.get("endTime", "", type=str)

    price_data = fetch_price(symbol, interval, limit, start_time, end_time)
    sentiment_data = fetch_sentiment(symbol, interval, limit, start_time, end_time)

    data = [
        [
            candle["open"],
            candle["high"],
            candle["low"],
            candle["volume"],
            candle["quote_asset_volume"],
            candle["number_of_trade"],
            candle["taker_buy_base_asset_volume"],
            candle["taker_buy_quote_asset_volume"],
            sentiment_score,
            candle["close"],
        ]
        for candle, sentiment_score in zip(price_data, sentiment_data)
    ]
    inputs = torch.tensor(data, dtype=torch.float32)

    model = CryptoModel().model
    with torch.no_grad():
        outputs = model(inputs).squeeze(1).tolist()

    return jsonify(
        {
            "prediction": outputs,
            "model_name": "prediction-service-backend\model\model.pt",
        }
    ), 200
