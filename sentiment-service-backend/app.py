import os

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from transformers import pipeline

from route import sentiment_bp
from service import FetchScheduler

load_dotenv()
pipeline('text-classification', model=os.getenv('HF_MODEL_REPO'))  # Download model before starting app

scheduler = FetchScheduler()
scheduler.start()

app = Flask(__name__)
CORS(app)
app.register_blueprint(sentiment_bp)


@app.route('/')
def home():
    return 'Sentiment service is listening...'


if __name__ == '__main__':
    app.run(debug=True)
