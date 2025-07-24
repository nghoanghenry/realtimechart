import os

from pymongo import MongoClient, DESCENDING

client = MongoClient(os.getenv('MONGO_URI'))
db = client['sentiment-service']
collection = db['sentiment']


def save_sentiment(doc):
    collection.insert_one(doc)


def get_sentiment(skip=0, limit=0):
    return collection.find().skip(skip).limit(limit).sort("published", DESCENDING)
