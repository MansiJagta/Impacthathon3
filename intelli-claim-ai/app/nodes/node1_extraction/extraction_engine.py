import ollama
import os
import logging
import pytesseract
from pdf2image import convert_from_path
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

# Load env for binary paths
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Configure Tesseract path from env
TESSERACT_CMD = os.getenv("TESSERACT_CMD", r"C:\Program Files\Tesseract-OCR\tesseract.exe")
pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

# Configure Poppler path from env
POPPLER_PATH = os.getenv("POPPLER_PATH")

# 1. Define the 'Golden Record' Schema (Validation)
class LineItem(BaseModel):
    description: str
    amount: float

    @field_validator('amount', mode='before')
    @classmethod
    def validate_amount(cls, v):
        if isinstance(v, str):
            # Clean currency symbols and commas
            v = v.replace("Rs.", "").replace("₹", "").replace(",", "").replace("/", "").strip()
            try:
                return float(v)
            except ValueError:
                return 0.0
        return v

class ClaimSchema(BaseModel):
    # Identity & Contact
    claimer_name: str = Field(default="Unknown", alias="claimant_name")
    aadhaar_id: str = Field(default="", alias="aadhaar_number")
    dob: str = Field(default="")
    phone: str = Field(default="")
    email: str = Field(default="")
    address: str = Field(default="")
    
    # Insurance & Hospital
    policy_number: str = Field(default="")
    hospital_name: str = Field(default="")
    admission_date: str = Field(default="", alias="date")
    discharge_date: str = Field(default="")
    diagnosis: str = Field(default="")
    
    # Billing
    total_amount: float = Field(default=0.0, alias="amount")
    line_items: List[LineItem] = Field(default_factory=list)

    @field_validator('aadhaar_id', mode='before')
    @classmethod
    def validate_aadhaar_id(cls, v):
        if not v: return ""
        s = str(v).replace(" ", "").strip()
        # Aadhaar must be 12 digits. If it contains letters (except in aliases), it's likely a hallucination/swap.
        if any(char.isalpha() for char in s) and "@" not in s: 
            return "" # Discard if it contains letters (it's not an Aadhaar)
        # Keep only digits if it looks like an Aadhaar segment
        clean = "".join(filter(str.isdigit, s))
        if len(clean) >= 10: # Allow minor OCR miss (10-12 digits)
             return clean
        return ""

    @field_validator('email', mode='before')
    @classmethod
    def validate_email(cls, v):
        if not v: return ""
        s = str(v).strip()
        # Email must have @ and . (basic check)
        if "@" not in s or "." not in s:
            return ""
        # If it looks like a long number (Aadhaar snippet), it's a swap
        if len(s.split("@")[0]) > 12 and s.split("@")[0].isdigit():
            return ""
        return s

    @field_validator('total_amount', mode='before')
    @classmethod
    def validate_amount(cls, v):
        if isinstance(v, str):
            v = v.replace("Rs.", "").replace("₹", "").replace(",", "").strip()
            try:
                return float(v)
            except ValueError:
                return 0.0
        if isinstance(v, (int, float)) and v <= 0: 
            return 0.0
        return v

    @model_validator(mode='after')
    def verify_totals(self) -> 'ClaimSchema':
        if self.line_items:
            sum_items = sum(item.amount for item in self.line_items)
            if self.total_amount > 0 and abs(sum_items - self.total_amount) > 10.0:
                logger.warning(f"Total amount mismatch: Extracted {self.total_amount}, Sum of items {sum_items}")
        return self

    class Config:
        populate_by_name = True

# 2. Hybrid OCR-LLM Extraction Logic
def extract_text_hybrid(file_path: str) -> str:
    """
    Extracts raw text from Image or PDF using Tesseract and Poppler.
    """
    ext = os.path.splitext(file_path)[1].lower()
    full_text = ""

    try:
        if ext == ".pdf":
            logger.info(f"Extracting text from PDF: {file_path}")
            # Convert PDF to images
            images = convert_from_path(file_path, poppler_path=POPPLER_PATH)
            for i, image in enumerate(images):
                page_text = pytesseract.image_to_string(image)
                full_text += f"\n--- Page {i+1} ---\n{page_text}"
        else:
            logger.info(f"Extracting text from Image: {file_path}")
            full_text = pytesseract.image_to_string(file_path)
            
        return full_text
    except Exception as e:
        logger.error(f"OCR failed for {file_path}: {e}")
        return ""

def extract_node_1(file_path: str, doc_type: str = "auto") -> Dict[str, Any]:
    """
    Hybrid extraction: Tesseract OCR -> Gemma 3 Reasoning -> Pydantic Validation.
    """
    logger.info(f"Starting Hybrid OCR-LLM extraction for [{doc_type}]: {file_path}")
    
    model_name = 'gemma3:4b'
    
    try:
        # A. OCR Pass
        raw_text = extract_text_hybrid(file_path)
        if not raw_text.strip():
            raise ValueError("No text could be extracted from the document.")

        # B. LLM Reasoning Pass (Specialized based on doc_type)
        type_prefix = f"This document is a {doc_type.upper()}. " if doc_type != "auto" else ""
        
        prompt = f"""
        ### SYSTEM ROLE
        You are an Insurance Data Analyst. Your goal is to extract detailed information from the OCR text of a SINGLE document.
        {type_prefix}
        
        ### RAW OCR TEXT
        {raw_text}
        
        ### EXTRACTION FIELDS
        1. IDENTITY: claimant_name, aadhaar_id, dob, address, phone, email.
        2. INSURANCE: policy_number.
        3. MEDICAL: hospital_name, admission_date, discharge_date, diagnosis.
        4. BILLING: total_amount, line_items (description + amount).
        
        ### JSON TEMPLATE
        {{
          "claimant_name": "",
          "aadhaar_id": "",
          "dob": "",
          "phone": "",
          "email": "",
          "address": "",
          "policy_number": "",
          "hospital_name": "",
          "admission_date": "",
          "discharge_date": "",
          "diagnosis": "",
          "total_amount": 0.0,
          "line_items": []
        }}
        
        ### CRITICAL INSTRUCTIONS
        - AADHAAR ID: Look for a 12-digit number (often formatted as XXXX XXXX XXXX). If found, return it exactly as digits or with spaces.
        - EMAIL: Look for standard email patterns (user@domain.com).
        - If a field is not found, use "" or 0.0.
        - Fix obvious OCR typos.
        - Return ONLY valid JSON.
        """

        logger.info(f"Calling Ollama ({model_name}) for reasoning on {os.path.basename(file_path)}...")
        response = ollama.chat(
            model=model_name,
            messages=[{'role': 'user', 'content': prompt}],
            format='json'
        )
        
        raw_content = response['message']['content']
        
        # C. Validation (Pydantic)
        try:
            validated_data = ClaimSchema.model_validate_json(raw_content)
        except Exception as ve:
            logger.warning(f"Pydantic Validation failure for {model_name}: {ve}")
            try:
                import json
                data = json.loads(raw_content)
                # Map potential alternate keys
                mapped_data = {
                    "claimant_name": data.get("claimant_name", data.get("claimer_name", data.get("name", "Unknown"))),
                    "aadhaar_id": data.get("aadhaar_id", data.get("aadhaar_number", "")),
                    "dob": data.get("dob", ""),
                    "phone": data.get("phone", ""),
                    "email": data.get("email", ""),
                    "address": data.get("address", ""),
                    "policy_number": data.get("policy_number", ""),
                    "hospital_name": data.get("hospital_name", ""),
                    "admission_date": data.get("admission_date", data.get("date", "")),
                    "discharge_date": data.get("discharge_date", ""),
                    "diagnosis": data.get("diagnosis", ""),
                    "total_amount": data.get("total_amount", data.get("amount", 0.0)),
                    "line_items": data.get("line_items", [])
                }
                validated_data = ClaimSchema(**mapped_data)
            except Exception as e2:
                logger.error(f"Literal fallback failed: {e2}")
                validated_data = ClaimSchema()

        return validated_data.model_dump()

    except Exception as e:
        logger.error(f"Hybrid Extraction failed for {file_path}: {e}")
        return ClaimSchema().model_dump()

def global_reconcile(all_texts: List[str]) -> Dict[str, Any]:
    """
    Final pass: Combines OCR text from ALL documents to resolve cross-document entities.
    """
    logger.info("Executing Global Reconciliation Pass...")
    model_name = 'gemma3:4b'
    
    combined_text = "\n\n".join(all_texts)
    if len(combined_text) > 40000: # Slightly larger for multi-doc
        combined_text = combined_text[:40000] + "... [TRUNCATED]"

    prompt = f"""
    ### SYSTEM ROLE
    You are a Senior Insurance Claims Auditor. I will provide you with OCR text from MULTIPLE documents 
    related to a single claim.
    
    ### CONSOLIDATED OCR TEXT
    {combined_text}
    
    ### GOAL
    Reconcile all documents into a SINGLE "Golden Record". 
    - Prefer ID cards (Aadhaar/Voter/Passport) for Name, Aadhaar ID, DOB, and Address.
    - Prefer ID cards or Policy documents for Email/Phone contact info.
    - Prefer Policy documents for Policy Number.
    - Prefer Bills/Invoices for Amounts and Provider names.
    - Prefer Discharge Summaries for Diagnosis and Dates.
    
    ### JSON TEMPLATE
    {{
      "claimant_name": "",
      "aadhaar_id": "",
      "dob": "",
      "phone": "",
      "email": "",
      "address": "",
      "policy_number": "",
      "hospital_name": "",
      "admission_date": "",
      "discharge_date": "",
      "diagnosis": "",
      "total_amount": 0.0,
      "line_items": []
    }}
    
    ### CRITICAL RULES
    1. Cross-reference all documents.
    2. If fields conflict, use your auditing judgment (Identity Doc > Billing Doc for name).
    3. Return ONLY valid JSON.
    """

    try:
        response = ollama.chat(
            model=model_name,
            messages=[{'role': 'user', 'content': prompt}],
            format='json'
        )
        raw_content = response['message']['content']
        validated_data = ClaimSchema.model_validate_json(raw_content)
        return validated_data.model_dump()
    except Exception as e:
        logger.error(f"Global Reconciliation failed: {e}")
        return {}
