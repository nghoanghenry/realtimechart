import json
import os
import time
from typing import Any

import google.generativeai as genai
from transformers import pipeline


class Analyzer:
    def __init__(self) -> None:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.gemini_model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",
            generation_config=genai.GenerationConfig(
                temperature=0,
                top_k=40,
                top_p=0.95,
                max_output_tokens=1024,
                response_mime_type="application/json",
            ),
        )
        self.our_model = pipeline('text-classification', model=os.getenv('HF_MODEL_REPO'))

    def analyze(self, content: str, retry=5) -> dict[str, Any]:
        try:
            sentiment = self.our_model(content, truncation=True)[0]["label"]

            prompt = f"""You are an expert in economics and cryptocurrency, your job are:
            1. Read an article and it's sentiment score (negative, neutral or positive).
            2. Answer these questions:
            - What is reason why the given sentiment score is negative, neutral or positive?
            - What is the relevant trading pair?
            The result must in JSON format: {{"symbol": "<trading pair>", "reason": "<reason about sentiment score>"}}
            
            Important: If you find that the article is not related to any trading pair, must return {{"symbol": "None", "sentiment": 0, "reason": "None"}}
            Important: The trading pair must be in the following list: "BTCUSDT", "ETHUSDT", "BNBUSDT", "NEOUSDT", "LTCUSDT", "QTUMUSDT", "ADAUSDT", "XRPUSDT", "TUSDUSDT", "IOTAUSDT", "XLMUSDT", "ONTUSDT", "TRXUSDT", "ETCUSDT", "ICXUSDT", "VETUSDT", "USDCUSDT", "LINKUSDT", "ONGUSDT", "HOTUSDT", "ZILUSDT", "ZRXUSDT", "FETUSDT", "BATUSDT", "ZECUSDT", "IOSTUSDT", "CELRUSDT", "DASHUSDT", "THETAUSDT", "ENJUSDT", "ATOMUSDT", "TFUELUSDT", "ONEUSDT", "ALGOUSDT", "DOGEUSDT", "DUSKUSDT", "ANKRUSDT", "WINUSDT", "COSUSDT", "MTLUSDT", "DENTUSDT", "WANUSDT", "FUNUSDT", "CVCUSDT", "CHZUSDT", "BANDUSDT", "XTZUSDT", "RVNUSDT", "HBARUSDT", "NKNUSDT"
            
            This is the article:
            {content}
            
            This is the sentiment score of the article:
            {sentiment}
            """

            gemini_res = json.loads(self.gemini_model.generate_content(prompt).text)
            sentiment = { "negative": 0, "neutral": 1, "positive": 2 }[sentiment]

            return {**gemini_res, "sentiment": sentiment}

        except Exception as e:
            print(f"[!] Failed to analyze article: {type(e).__name__}")
            time.sleep(5)
            return self.analyze(content, retry - 1) if retry > 0 else {}

    @staticmethod
    def check_result(result: dict[str, Any]) -> bool:
        return "symbol" in result and "sentiment" in result and "reason" in result and result["sentiment"] in [0, 1, 2]
