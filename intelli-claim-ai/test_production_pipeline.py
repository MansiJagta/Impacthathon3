import os
import sys
from pathlib import Path

# Add project root to path
sys.path.append(os.getcwd())

from app.nodes.node1_extraction.extractor import extract_documents

def test_production_pipeline():
    print("Starting Production-Grade Pipeline Test...")
    
    # 1. Pick sample documents
    sample_dir = Path("sample_docs")
    # Try to find a mix of docs
    files = list(sample_dir.glob("*.jpg")) + list(sample_dir.glob("*.pdf"))
    
    # Filter out known corrupted/bad files if any, or just take first two
    test_files = [str(f) for f in files[:2]]
    
    if not test_files:
        print("ERROR: No sample files found in sample_docs/ folder.")
        return

    print(f"Using files: {test_files}")

    # 2. Run extraction
    print("\nRunning extraction node...")
    try:
        result = extract_documents(test_files, claim_id="PROD_TEST_001")

        print("\n===== FINAL RESOLVED ENTITIES =====")
        import json
        print(json.dumps(result["extracted_entities"], indent=2))
        
        print("\n===== DOCUMENT DETAILS =====")
        for doc in result["documents"]:
            print(f"File: {os.path.basename(doc['file'])}")
            print(f"  Fields: {json.dumps(doc['fields'], indent=2)}")
        
        print(f"\nOverall Confidence: {result['overall_confidence']}")
        print("\nSUCCESS: Production-grade pipeline executed.")
        
    except Exception as e:
        print(f"\nPIPELINE ERROR: {e}")
        print("Note: This will fail if qwen2.5vl:7b is not fully pulled yet.")

if __name__ == "__main__":
    test_production_pipeline()
