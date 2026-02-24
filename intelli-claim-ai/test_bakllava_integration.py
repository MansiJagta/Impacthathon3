import os
import sys
from pathlib import Path

# Add project root to path
sys.path.append(os.getcwd())

from app.services.llm_service import llm_service

def test_vision_extraction():
    print("Starting BakLLaVA Vision Extraction Test...")
    
    # 1. Pick a sample image
    sample_dir = Path("sample_docs")
    image_files = list(sample_dir.glob("*.jpg")) + list(sample_dir.glob("*.jpeg")) + list(sample_dir.glob("*.png"))
    
    if not image_files:
        print("ERROR: No sample images found in sample_docs/ folder.")
        return

    sample_image = str(image_files[0])
    print(f"Using sample image: {sample_image}")

    # 2. Call extraction (mocking OCR text)
    dummy_ocr_text = "Policy Number: POL-9999. Bill for Jane Smith at City Hospital. Amount: 1200. Date: 15/05/2023."
    
    print("Calling LLM with image...")
    result = llm_service.extract_structured_data(
        text=dummy_ocr_text,
        document_type="bill",
        image_path=sample_image
    )

    print("\n===== EXTRACTION RESULT =====")
    import json
    print(json.dumps(result, indent=2))
    
    if result:
        print("\nSUCCESS: Received response from BakLLaVA.")
    else:
        print("\nFAILURE: Empty response. Ensure 'bakllava' is pulled and Ollama is running.")

if __name__ == "__main__":
    test_vision_extraction()
