from flask import Flask


app = Flask(__name__)

@app.route('/')
def home():
    return 'Sentiment service is listening...'

@app.route('/sentiment')
def sentiment_analysis():
    pass


if __name__ == '__main__':
    app.run(debug=True)
