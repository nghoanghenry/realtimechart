
class PriceModel:
    def __init__(self):
        self.model = None

    def predict(self, prices: list[float], sentiments: list[float]) -> float:
        return prices[-1]