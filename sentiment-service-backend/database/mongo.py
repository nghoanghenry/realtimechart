import os

from pymongo import MongoClient, DESCENDING

client = MongoClient(os.getenv("MONGO_URI"))
db = client["sentiment-service"]
collection = db["sentiment"]


def save_sentiment(doc):
    collection.insert_one(doc)


def get_sentiment(skip=0, limit=0, symbol=None):
    return (
        collection.find({"symbol": {"$ne": "None"} if symbol is None else symbol})
        .sort("published", DESCENDING)
        .skip(skip)
        .limit(limit)
    )
