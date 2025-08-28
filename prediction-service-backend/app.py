from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from routes import prediction_bp, model_bp
from service import CryptoModel

load_dotenv()
CryptoModel()

app = Flask(__name__)
CORS(app)
app.register_blueprint(prediction_bp)
app.register_blueprint(model_bp)


@app.route("/")
def home():
    return "Prediction service is listening..."


if __name__ == "__main__":
    app.run(port=5001)
