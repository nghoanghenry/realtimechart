from flask import Blueprint, request, jsonify

from service import fetch_price, fetch_sentiment
from service.model import PriceModel

prediction_bp = Blueprint('prediction', __name__, url_prefix='/predict')


@prediction_bp.route('/', methods=['POST'])
def predict():
    data = request.get_json(force=True)
    symbol = data.get('symbol')
    interval = data.get('interval')

    if not symbol or not interval:
        return jsonify({'error': 'symbol and interval parameters are required'})

    model = PriceModel()
    prices = fetch_price(symbol, interval)
    sentiments = fetch_sentiment(symbol)

    return jsonify({'prediction': model.predict(prices, sentiments)})
