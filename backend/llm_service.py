import os
import httpx
import json
from openai import OpenAI
from typing import List, Dict, Any, Optional

class LLMService:
    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "openai").lower()
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/api/chat")

    def create_completion(self, 
                          messages: List[Dict[str, str]], 
                          model: Optional[str] = None, 
                          temperature: float = 0.7, 
                          max_tokens: int = 1000,
                          response_format: Optional[Dict[str, str]] = None) -> str:
        
        if self.provider == "openai":
            selected_model = model or "gpt-4o"
            try:
                params = {
                    "model": selected_model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
                if response_format:
                    params["response_format"] = response_format
                
                response = self.openai_client.chat.completions.create(**params)
                return response.choices[0].message.content
            except Exception as e:
                print(f"OpenAI Error: {e}")
                raise e
        
        elif self.provider == "ollama":
            # Ollama API 호출 (로컬)
            selected_model = model or "llama3" # 기본값
            try:
                payload = {
                    "model": selected_model,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens
                    }
                }
                if response_format and response_format.get("type") == "json_object":
                    payload["format"] = "json"

                response = httpx.post(self.ollama_base_url, json=payload, timeout=60.0)
                response.raise_for_status()
                result = response.json()
                return result["message"]["content"]
            except Exception as e:
                print(f"Ollama Error: {e}")
                # 로컬 실패 시 OpenAI로 자동 스위칭하거나 에러 반환
                raise e
        
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")

# 싱글톤 인스턴스
_llm_instance = None

def get_llm_service():
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = LLMService()
    return _llm_instance
