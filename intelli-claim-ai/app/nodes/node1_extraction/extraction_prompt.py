EXTRACTION_SYSTEM_PROMPT = """
You are a highly accurate insurance claim data extractor. 
Your goal is to extract structured entities from noisy OCR text.
FOLLOW THESE RULES:
1. NEVER return null or empty strings if the information is present in the text.
2. Normalize currencies (e.g., 'Rs. 5,000' -> 5000.0).
3. Detect Policy Numbers even if symbols like '/' or '-' are present.
4. If a field is not found, return an empty string "" instead of null.
5. Provide a confidence score (0.0 to 1.0) for the overall extraction.
6. Return ONLY a valid JSON object.
"""

EXTRACTION_USER_PROMPT_TEMPLATE = """
Extract data from this OCR text:
{text}

JSON Schema:
{{
  "claimer_name": "Full name",
  "policy_number": "Unique policy ID",
  "hospital_name": "Name of medical facility",
  "amount": 0.0,
  "date": "DD/MM/YYYY",
  "diagnosis": "Medical condition",
  "email": "Contact email",
  "phone": "Contact number",
  "address": "Full address",
  "confidence": 0.9
}}

### Examples:
---
Input: "POLICY NO: POL-12345 Holder: John Doe Total: RS 1500"
Output: {{
  "claimer_name": "John Doe",
  "policy_number": "POL-12345",
  "hospital_name": "",
  "amount": 1500.0,
  "date": "",
  "diagnosis": "",
  "email": "",
  "phone": "",
  "address": "",
  "confidence": 0.95
}}
---
Input: "Health Care Hospital. Bill Date: 12 Jan 2024. Patient Jane Smith. Diagnosis: Fever. Amount: 500."
Output: {{
  "claimer_name": "Jane Smith",
  "policy_number": "",
  "hospital_name": "Health Care Hospital",
  "amount": 500.0,
  "date": "12/01/2024",
  "diagnosis": "Fever",
  "email": "",
  "phone": "",
  "address": "",
  "confidence": 0.98
}}
"""
