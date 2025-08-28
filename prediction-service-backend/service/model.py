import os
from typing import Self

import torch


class CryptoModel:
    _instance = None
    model = None

    def __new__(cls) -> Self:
        if cls._instance is None:
            cls._instance = super(CryptoModel, cls).__new__(cls)
            if os.path.exists(os.getenv("MODEL_UPLOAD_PATH")):
                cls._instance.load_model()
        return cls._instance

    def load_model(self) -> None:
        self.model = torch.jit.load(os.getenv("MODEL_UPLOAD_PATH"))
        self.model.eval()
        print("Model loaded")
