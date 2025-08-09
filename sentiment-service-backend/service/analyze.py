import json
import os
import time
from typing import Any

import google.generativeai as genai


class Analyzer:
    def __init__(self) -> None:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",
            generation_config=genai.GenerationConfig(
                temperature=0,
                top_k=40,
                top_p=0.95,
                max_output_tokens=1024,
                response_mime_type="application/json",
            ),
        )

    def analyze(self, content: str, retry=5) -> dict[str, Any]:
        try:
            prompt = f"""You are an expert in economics and cryptocurrency, your job is to read an article and answer:
            - The relevant trading pair
            - The sentiment score about trading pair -1 (negative) to 1 (positive)
            - The reason about the sentiment result
            The result must in JSON format: {{"symbol": "<tranding pair>", "sentiment": <sentiment result>, "reason": "<reason about sentiment result>"}}
            
            Important: If you find that the article is not related to any trading pair, must return {{"symbol": "None", "sentiment": 0, "reason": "No relevant"}}
            Important: The trading pair must be in the following list: "BTCUSDT", "ETHUSDT", "BNBUSDT", "NEOUSDT", "LTCUSDT", "QTUMUSDT", "ADAUSDT", "XRPUSDT", "TUSDUSDT", "IOTAUSDT", "XLMUSDT", "ONTUSDT", "TRXUSDT", "ETCUSDT", "ICXUSDT", "VETUSDT", "USDCUSDT", "LINKUSDT", "ONGUSDT", "HOTUSDT", "ZILUSDT", "ZRXUSDT", "FETUSDT", "BATUSDT", "ZECUSDT", "IOSTUSDT", "CELRUSDT", "DASHUSDT", "THETAUSDT", "ENJUSDT", "ATOMUSDT", "TFUELUSDT", "ONEUSDT", "ALGOUSDT", "DOGEUSDT", "DUSKUSDT", "ANKRUSDT", "WINUSDT", "COSUSDT", "MTLUSDT", "DENTUSDT", "WANUSDT", "FUNUSDT", "CVCUSDT", "CHZUSDT", "BANDUSDT", "XTZUSDT", "RVNUSDT", "HBARUSDT", "NKNUSDT"
            
            This is the article:
            {content}
            """

            response = self.model.generate_content(prompt)
            return json.loads(response.text)

        except Exception as e:
            print(f"[!] Failed to analyze article: {type(e).__name__}")
            time.sleep(5)

            if retry > 0:
                return self.analyze(content, retry - 1)
            else:
                return {}

    @staticmethod
    def check_result(result: dict[str, Any]) -> bool:
        return (
            "symbol" in result
            and "sentiment" in result
            and isinstance(result["sentiment"], float)
            and -1 <= result["sentiment"] <= 1
            and "reason" in result
        )
