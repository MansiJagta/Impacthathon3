import os
import sys
import logging
import json
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from app.nodes.node1_extraction.extraction_engine import extract_node_1

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_vdu_extraction():
    # Use a specific valid sample document
    test_file = os.path.join("sample_docs", "IMG-20260221-WA0001.jpg")
    if not os.path.exists(test_file):
        print(f"Test file {test_file} not found.")
        return
    print(f"\nTesting VDU Extraction on: {test_file}")
    
    try:
        result = extract_node_1(test_file)
        print("\nExtraction Result:")
        print(json.dumps(result, indent=2))
        
        # Basic assertions
        assert "claimer_name" in result
        assert "policy_number" in result
        assert "line_items" in result
        assert isinstance(result["line_items"], list)
        
        print("\nVerification Successful!")
        
    except Exception as e:
        print(f"\nVerification Failed: {e}")

if __name__ == "__main__":
    test_vdu_extraction()
