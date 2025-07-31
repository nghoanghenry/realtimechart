from typing import Self

import torch


class CryptoModel:
    _instance = None
    model = None

    def __new__(cls) -> Self:
        if cls._instance is None:
            cls._instance = super(CryptoModel, cls).__new__(cls)
        return cls._instance

    def load_model(self, model_load_path: str) -> None:
        self.model = torch.load(model_load_path)
        self.model.eval()
