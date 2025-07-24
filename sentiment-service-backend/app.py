from flask import Flask
from dotenv import load_dotenv

from route import sentiment_bp
from service import FetchScheduler

load_dotenv()

scheduler = FetchScheduler()
scheduler.start()

app = Flask(__name__)
app.register_blueprint(sentiment_bp)


@app.route('/')
def home():
    return 'Sentiment service is listening...'


if __name__ == '__main__':
    app.run(debug=True)
