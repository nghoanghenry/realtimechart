import json
import os
import time
from typing import Any

import google.generativeai as genai


class Analyzer:
    def __init__(self) -> None:
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.model = genai.GenerativeModel(
            model_name='gemini-2.0-flash-exp',
            generation_config=genai.GenerationConfig(temperature=0, top_k=40, top_p=0.95,
                                                     max_output_tokens=1024, response_mime_type='application/json'),
        )

    def analyze(self, content: str, retry=5) -> dict[str, Any]:
        try:
            prompt = f'''You are an expert in economics and cryptocurrency, your job is to read an article and answer:
            - The relevant cryptocurrency
            - The sentiment score about cryptocurrency 1 (negative) to 5 (positive)
            - The reason about the sentiment result
            The result must in JSON format: {{"coin": "<coin name>", "sentiment": <sentiment result>, "reason": "<reason about sentiment result>"}}
            
            Important: If you find that the article is not related to any cryptocurrency, must return {{"coin": "None", "sentiment": 0, "reason": "No relevant"}}
            
            This is the article:
            {content}
            '''

            response = self.model.generate_content(prompt)
            return json.loads(response.text)

        except Exception as e:
            print(f'[!] Failed to analyze article: {type(e).__name__}')
            time.sleep(5)

            if retry > 0:
                return self.analyze(content, retry - 1)
            else:
                return {}

    @staticmethod
    def check_result(result: dict[str, Any]) -> bool:
        return (
                'coin' in result and
                'sentiment' in result and isinstance(result['sentiment'], int) and 0 <= result['sentiment'] <= 5 and
                'reason' in result
        )
