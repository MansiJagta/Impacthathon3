import json
import os
import requests
import base64
from typing import Any, Dict, List, Optional

class LLMService:
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model = "gemma3:4b"  # Found on user's system

    def _call_ollama(self, prompt: str, system_prompt: str = "", images: Optional[List[str]] = None) -> str:
        url = f"{self.base_url}/api/generate"
        
        # Use bakllava if images are provided, otherwise use default gemma3
        current_model = "bakllava" if images else self.model
        
        payload = {
            "model": current_model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "format": "json"
        }
        
        if images:
            payload["images"] = images
            
        try:
            print(f"DEBUG: Calling Ollama with model: {current_model}")
            response = requests.post(url, json=payload, timeout=90) # Increased timeout for vision
            response.raise_for_status()
            res_text = response.json().get("response", "")
            print(f"DEBUG: Ollama Raw Response: {res_text[:200]}")
            return res_text
        except Exception as e:
            print(f"Ollama Call Error: {e}")
            return ""

    def extract_structured_data(self, text: str, document_type: str, image_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Extract structured information from OCR text and optionally an image using local Ollama.
        """
        from app.nodes.node1_extraction.extraction_prompt import EXTRACTION_SYSTEM_PROMPT, EXTRACTION_USER_PROMPT_TEMPLATE
        
        prompt = EXTRACTION_USER_PROMPT_TEMPLATE.format(text=text[:4000]) # Increased context window

        images = None
        if image_path and os.path.exists(image_path):
            try:
                with open(image_path, "rb") as f:
                    img_base64 = base64.b64encode(f.read()).decode("utf-8")
                    images = [img_base64]
                print(f"DEBUG: Including image from {image_path} for vision extraction.")
            except Exception as e:
                print(f"Error reading image for Ollama: {e}")

        raw_response = self._call_ollama(prompt, EXTRACTION_SYSTEM_PROMPT, images=images)
        try:
            data = json.loads(raw_response)
            # Ensure confidence exists
            if "confidence" not in data:
                data["confidence"] = 0.8
            return data
        except Exception as e:
            print(f"Ollama JSON Parse Error: {e}\nRaw: {raw_response}")
            return {}


    def analyze_claim_context(self, documents_context: str) -> Dict[str, Any]:
        """
        Perform qualitative analysis on the entire claim context using Ollama.
        """
        system_prompt = "You are an insurance fraud expert. Analyze sequences of documents and return results in JSON format."
        
        prompt = f"""
        Analyze the following insurance claim document context for fraud and risk.
        Look for inconsistencies in names, dates, amounts, or missing critical info.
        Return a JSON object with:
        - risk_level (LOW, MEDIUM, HIGH, CRITICAL)
        - fraud_indicators (list of strings)
        - reasoning (detailed explanation)
        - extraction_confidence (0.0 to 1.0)

        Claim Context:
        {documents_context[:4000]}
        """

        raw_response = self._call_ollama(prompt, system_prompt)
        try:
            return json.loads(raw_response)
        except Exception as e:
            print(f"Ollama Analysis Parse Error: {e}")
            return {
                "risk_level": "UNKNOWN",
                "fraud_indicators": ["Local AI Error"],
                "reasoning": f"Error parsing Ollama response: {e}",
                "extraction_confidence": 0.5
            }

llm_service = LLMService()
