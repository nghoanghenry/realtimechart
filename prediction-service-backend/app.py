from flask import Flask
from dotenv import load_dotenv

from routes import prediction_bp, model_bp
from service import CryptoModel, DataProcessor

load_dotenv()
CryptoModel()
DataProcessor()

app = Flask(__name__)
app.register_blueprint(prediction_bp)
app.register_blueprint(model_bp)


@app.route('/')
def home():
    return 'Prediction service is listening...'


if __name__ == '__main__':
    app.run(port=5001)
