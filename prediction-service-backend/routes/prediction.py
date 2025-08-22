from flask import Blueprint, request, jsonify

from service import fetch_price, fetch_sentiment, DataProcessor, CryptoModel

prediction_bp = Blueprint('prediction', __name__, url_prefix='/predict')


@prediction_bp.route('/', methods=['GET'])
def predict():
    symbol = request.args.get('symbol', 'BTCUSDT', type=str)
    interval = request.args.get('interval', '1d', type=str)
    limit = request.args.get('limit', 100, type=int)

    price_data = fetch_price(symbol, interval, limit)
    sentiment_data = fetch_sentiment(symbol, interval, limit)

    data_processor = DataProcessor()
    data = data_processor.preprocess(price_data, sentiment_data)

    preds = [CryptoModel().model(window) for window in data]
    output = [data_processor.postprocess(pred) for pred in preds]

    return jsonify({'prediction': output})
