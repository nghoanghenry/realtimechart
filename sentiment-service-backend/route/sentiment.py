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
    symbol = request.args.get("symbol", None, type=str)
    interval = request.args.get("interval", "1d", type=str)
    limit = request.args.get("limit", 500, type=int)
    startTime = request.args.get("startTime", None, type=str)
    endTime = request.args.get("endTime", None, type=str)

    interval_seconds = timeparse(interval)

    data = get_sentiment(skip=0, limit=0, symbol=symbol).to_list()
    print(
        "Data length:",
        len(data),
        "symbol:",
        symbol,
        "interval:",
        interval,
        "limit:",
        limit,
    )

    delta = datetime.timedelta(seconds=interval_seconds)
    if endTime is not None:
        endMark = datetime.datetime.fromtimestamp(float(endTime) / 1000, datetime.timezone.utc)
    else:
        endMark = datetime.datetime.now(datetime.timezone.utc)
    time_threshold = endMark - delta

    if startTime is not None:
        startMark = datetime.datetime.fromtimestamp(float(startTime) / 1000, datetime.timezone.utc)
    else:
        startMark = None

    print("Start mark:", startMark, "End mark:", endMark)

    result: list[float] = []

    index = 0
    while len(result) < limit and index < len(data):
        interval_list = []
        print("Index", len(result))
        while (
            index < len(data)
            and data[index]["published"]
            > time_threshold.replace(microsecond=0).isoformat()
        ):
            interval_list.append(data[index]["sentiment"])
            print(" +", data[index]["published"])
            index += 1

        avg = sum(interval_list) / len(interval_list) if interval_list else 0.0

        print(f"Interval average: {avg}")
        result.insert(0, avg)
        if startMark is not None and time_threshold < startMark:
            break
        else:
            time_threshold = (
                max(time_threshold - delta, startMark)
                if startMark is not None
                else time_threshold - delta
            )

    while len(result) < limit:
        result.insert(0, 0.0)

    return result
