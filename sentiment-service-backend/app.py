from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from route import sentiment_bp
from service import FetchScheduler

load_dotenv()

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
