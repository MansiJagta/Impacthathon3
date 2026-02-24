from app.nodes.node1_extraction.extractor import process_documents
from app.nodes.node2_cross_validation.validator import cross_validate
from pathlib import Path
import os
import json

print("Starting Node 1 Enhancement Test...")
# Provide dummy file for structure testing, or actual if available
files = ["sample_docs/bill.jpg"] 
if not os.path.exists(files[0]):
    # Create a dummy file if not exists for structural test
    os.makedirs("sample_docs", exist_ok=True)
    with open(files[0], "wb") as f: f.write(b"dummy")

try:
    node1_output = process_documents("test_reliability_001", files)
    print("\n--- Node 1 Results ---")
    print(f"Extracted Entities: {json.dumps(node1_output['extracted_entities'], indent=2)}")
    print(f"Field Confidences: {json.dumps(node1_output['field_confidence'], indent=2)}")
    print(f"Overall Confidence: {node1_output['overall_confidence']}")
    
    print("\nStarting Node 2...")
    # Node 2 expects 'documents' list with 'structured_fields'
    # Wait, I changed Node 1 output structure. Does Node 2 need a fix?
    # Let's check validator.py
    node2_output = cross_validate(node1_output)
    print(f"Node 2 Output: {node2_output}")
    
except Exception as e:
    print(f"Error occurred: {e}")
    import traceback
    traceback.print_exc()

