import os

from flask import Blueprint, request, jsonify

from service import CryptoModel

model_bp = Blueprint('model', __name__, url_prefix='/model')


@model_bp.route('/upload', methods=['POST'])
def upload():
    if 'model' not in request.files:
        return jsonify({'error': 'No model file provided'}), 400

    model_file = request.files['model']
    model_file.save(os.getenv('MODEL_UPLOAD_PATH'))

    try:
        CryptoModel().load_model()
        return jsonify({'message': 'Model uploaded successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to load model: {str(e)}'}), 500
