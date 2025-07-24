from flask import Blueprint

from database import get_sentiment

sentiment_bp = Blueprint('sentiment', __name__, url_prefix='/sentiment')


@sentiment_bp.route('/', methods=['GET'])
def sentiment():
    data = [doc for doc in get_sentiment()]
    for doc in data:
        doc['_id'] = str(doc['_id'])
    print(f'[*] Send {len(data)} documents to sentiment')
    return data
