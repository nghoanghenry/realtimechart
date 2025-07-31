from flask import Blueprint, request, jsonify

from service import CryptoModel, fetch_price, fetch_sentiment

prediction_bp = Blueprint('prediction', __name__, url_prefix='/predict')


@prediction_bp.route('/', methods=['POST'])
def predict():
    data = request.get_json(force=True)
    symbol = data.get('symbol')
    interval = data.get('interval')

    if not symbol or not interval:
        return jsonify({'error': 'symbol and interval parameters are required'})

    model = CryptoModel()
    prices = fetch_price(symbol, interval)
    sentiments = fetch_sentiment(symbol)

    return jsonify({'prediction': 'Hehehehe'})
