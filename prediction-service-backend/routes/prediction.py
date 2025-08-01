from flask import Blueprint, request, jsonify

from service import fetch_price, fetch_sentiment, DataProcessor, CryptoModel

prediction_bp = Blueprint('prediction', __name__, url_prefix='/predict')


@prediction_bp.route('/', methods=['GET'])
def predict():
    symbol = request.args.get('symbol')
    if not symbol:
        return jsonify({'error': 'symbol is required'})

    price_data = fetch_price(symbol)
    # sentiment_data = fetch_sentiment(symbol) # TODO with sentiment_data

    data_processor = DataProcessor()
    data = data_processor.preprocess(price_data, [])

    pred = CryptoModel().model(data)
    output = data_processor.postprocess(pred)

    return jsonify({'prediction': output})
