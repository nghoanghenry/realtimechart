from flask import Blueprint, request

from database import get_sentiment

sentiment_bp = Blueprint("sentiment", __name__, url_prefix="/sentiment")


@sentiment_bp.route("/", methods=["GET"])
def sentiment():
    symbol = request.args.get("symbol", None, type=str)
    skip = request.args.get("skip", 0, type=int)
    limit = request.args.get("limit", 0, type=int)

    data = [doc for doc in get_sentiment(limit=limit, skip=skip, symbol=symbol)]

    for doc in data:
        doc["_id"] = str(doc["_id"])
    print(f"[*] Send {len(data)} documents to sentiment")
    return data


@sentiment_bp.route("/avg", methods=["GET"])
def sentiment_avg():
    symbol = request.args.get("symbol", None, type=str)
    interval = request.args.get("interval", "1d", type=str)
    limit = request.args.get("limit", 1, type=int)
    
    data: list[float] = []
    return data
    