"""
Simple Node 4 Test Script with Full Debug Output
Shows all processing steps and print statements
"""

from datetime import datetime
from app.database.mongo import fraud_classification_collection
from app.nodes.node4_fraud_detection.fraud_agent import fraud_detection

# Sample MongoDB fraud classification data (matching MongoDB schema)
test_mongodb_data = {
    "policy number": "STAR-HEALTH-2024-88997766",
    "claimer name": "Neha Prakash Verma",
    "months_as_customer": 22,
    "age": 37,
    "policy_bind_date": "01/04/2024",
    "policy_state": "Maharashtra",
    "policy_csl": "10,00,000",
    "policy_deductable": 5000,
    "policy_annual_premium": 18500,
    "umbrella_limit": 0,
    "insured_zip": "411045",
    "insured_sex": "Female",
    "insured_education_level": "Masters",
    "insured_occupation": "Software Engineer",
    "insured_hobbies": "Reading, Yoga",
    "insured_relationship": "Self",
    "incident_date": "03/02/2026",
    "incident_severity": "Minor Injury",
    "authorities_contacted": "None",
    "incident_state": "Maharashtra",
    "incident_city": "Pune",
    "incident_location": "Ruby Hall Clinic, Pune",
    "incident_hour_of_the_day": 14,
    "property_damage": "No",
    "bodily_injuries": 1,
    "witnesses": 0,
    "police_report_available": "No",
    "total_claim_amount": 92750,
    "fraud_reported": "No",
    "days_since_policy": (datetime.strptime("03/02/2026", "%d/%m/%Y") - datetime.strptime("01/04/2024", "%d/%m/%Y")).days
}

# Simulated node1_output from document extraction
node1_output = {
    "documents": [
        {
            "document_type": "bill",
            "extracted_text": "Medical Bill - Amount: $92,750 for surgical procedure at Ruby Hall Clinic",
            "structured_fields": {
                "amount": "92750",
                "claimer_name": "Neha Prakash Verma",
                "policy_number": "STAR-HEALTH-2024-88997766",
                "incident_date": "03/02/2026"
            }
        }
    ]
}

# Simulated policy from node3
policy = {
    "effectiveDate": "01/04/2024",
    "policyNumber": "STAR-HEALTH-2024-88997766"
}

print("\n" + "#" * 90)
print("# NODE 4 FRAUD DETECTION - SIMPLE TEST WITH DEBUG OUTPUT")
print("#" * 90)
print("\n1. Inserting test data into MongoDB...")

# Clear and insert test data
try:
    fraud_classification_collection.delete_many({"policy number": test_mongodb_data["policy number"]})
    result = fraud_classification_collection.insert_one(test_mongodb_data)
    print(f"   ✓ Test data inserted (ID: {result.inserted_id})")
except Exception as e:
    print(f"   ✗ Error: {e}")
    exit(1)

print("\n2. Running fraud_detection()...\n")
print("   (Watch for detailed print statements below showing each step)\n")

# Run fraud detection - this will print all the step details
try:
    node4_output = fraud_detection(node1_output, policy)
except Exception as e:
    print(f"   ✗ Error: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# Print summary
print("\n" + "#" * 90)
print("# PROCESSING COMPLETE - SUMMARY")
print("#" * 90)

print(f"""
FINAL OUTPUT:
├─ fraud_score: {node4_output.get('fraud_score')}
├─ risk_level: {node4_output.get('risk_level')}
├─ confidence: {node4_output.get('confidence')}
├─ mongodb_used: {node4_output.get('mongodb_classification')}
├─ num_indicators: {len(node4_output.get('fraud_indicators', []))}
└─ reasoning: {node4_output.get('reasoning', 'N/A')[:100]}...

FRAUD INDICATORS:
""")

for i, indicator in enumerate(node4_output.get('fraud_indicators', []), 1):
    print(f"  {i}. {indicator}")

print("\n" + "#" * 90)
print("# Cleanup: Removing test data from MongoDB")
print("#" * 90)

try:
    fraud_classification_collection.delete_many({"policy number": test_mongodb_data["policy number"]})
    print("✓ Test data cleaned up\n")
except:
    pass
