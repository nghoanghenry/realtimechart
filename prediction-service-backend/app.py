from flask import Flask
from dotenv import load_dotenv

from routes import prediction_bp
from routes.model import model_bp

load_dotenv()

app = Flask(__name__)
app.register_blueprint(prediction_bp)
app.register_blueprint(model_bp)


@app.route('/')
def home():  # put application's code here
    return 'Prediction service is listening...'


if __name__ == '__main__':
    app.run(port=5001)
