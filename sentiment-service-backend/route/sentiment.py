import datetime
import dateutil.parser
from pytimeparse.timeparse import timeparse
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
    symbol = request.args.get("symbol", "ETHUSDT", type=str)
    interval = request.args.get("interval", "1d", type=str)
    limit = request.args.get("limit", 100, type=int)
    
    interval_seconds = timeparse(interval)
    
    data = get_sentiment(skip=0, limit=0, symbol=symbol).to_list()
    print("Data length:", len(data), "symbol:", symbol, "interval:", interval, "limit:", limit)
    
    delta = datetime.timedelta(seconds=interval_seconds)
    time_threshold = datetime.datetime.now(datetime.timezone.utc) - delta
    
    result: list[float] = []
    
    index = 0
    while len(result) < limit and index < len(data):
        interval_list = []
        print("Index", len(result))
        while index < len(data) and data[index]["published"] > time_threshold.replace(microsecond=0).isoformat():
            interval_list.append(data[index]["sentiment"])
            print(" +", data[index]["published"])
            index += 1
        
        avg = sum(interval_list) / len(interval_list) if interval_list else 0.0
        
        time_threshold -= delta
        print(f"Interval average: {avg}")
        result.append(avg)
    
    return result
    