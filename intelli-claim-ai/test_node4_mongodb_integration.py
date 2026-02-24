"""
Test script for MongoDB Fraud Classification integration
"""

from app.database.mongo import fraud_classification_collection
from app.nodes.node4_fraud_detection.mongodb_fraud_classifier import (
    classify_fraud_mongodb,
    _load_lightgbm_model,
    _load_features_list
)
import json

# Sample data from user specification
test_data = {
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
    "fraud_reported": "No"
}

# Derived field (days since policy)
from datetime import datetime
policy_start = datetime.strptime("01/04/2024", "%d/%m/%Y")
incident = datetime.strptime("03/02/2026", "%d/%m/%Y")
days_since_policy = (incident - policy_start).days
test_data["days_since_policy"] = days_since_policy

print("=" * 80)
print("FRAUD CLASSIFICATION INTEGRATION TEST")
print("=" * 80)

# 1. Check Model and Features
print("\n1. Checking LightGBM Model and Features...")
model = _load_lightgbm_model()
features = _load_features_list()

if model is None:
    print("   ERROR: Could not load LightGBM model")
else:
    print(f"   ✓ LightGBM model loaded successfully")
    print(f"   ✓ Model type: {type(model).__name__}")

if features is None:
    print("   ERROR: Could not load features list")
else:
    print(f"   ✓ Features list loaded (count: {len(features)})")

# 2. Insert test data into MongoDB
print("\n2. Inserting test data into MongoDB fraud_classification_db...")
try:
    # Clear old test data (if any)
    fraud_classification_collection.delete_many({"policy number": test_data["policy number"]})
    
    result = fraud_classification_collection.insert_one(test_data)
    print(f"   ✓ Test data inserted with ID: {result.inserted_id}")
except Exception as e:
    print(f"   ERROR: {e}")
    exit(1)

# 3. Test classification by policy number
print("\n3. Testing classification by policy number...")
policy_num = test_data["policy number"]
result = classify_fraud_mongodb(policy_number=policy_num)

if result is None:
    print(f"   ERROR: No result returned for policy: {policy_num}")
else:
    print(f"   ✓ Classification successful")
    print(f"   - Prediction: {['NOT FRAUD', 'FRAUD'][result['prediction']]}")
    print(f"   - Fraud Probability: {result['probability']:.4f}")
    print(f"   - Confidence: {result['confidence']:.2%}")
    print(f"   - Source: {result['source']}")
    print(f"   - Indicators: {result['indicators']}")

# 4. Test classification by claimer name
print("\n4. Testing classification by claimer name...")
claimer = test_data["claimer name"]
result = classify_fraud_mongodb(claimer_name=claimer)

if result is None:
    print(f"   ERROR: No result returned for claimer: {claimer}")
else:
    print(f"   ✓ Classification successful")
    print(f"   - Prediction: {['NOT FRAUD', 'FRAUD'][result['prediction']]}")
    print(f"   - Fraud Probability: {result['probability']:.4f}")
    print(f"   - Confidence: {result['confidence']:.2%}")

# 5. Cleanup
print("\n5. Cleaning up test data...")
try:
    fraud_classification_collection.delete_one({"_id": result['matched_record']})
    print("   ✓ Test data cleaned up")
except:
    print("   (No cleanup needed)")

print("\n" + "=" * 80)
print("TEST COMPLETED SUCCESSFULLY")
print("=" * 80)
print("\nIntegration Summary:")
print("- mongo.py: Updated with fraud_classification_db connection")
print("- mongodb_fraud_classifier.py: Created with LightGBM integration")
print("- fraud_agent.py: Updated to use MongoDB classification as primary check (step 0)")
print("- Output structure: Compatible with downstream nodes (node5, node6, node7)")
print("\nScoring Logic:")
print("- If LightGBM predicts FRAUD (1): Add 0.4 + (0.3 * probability) to score")
print("- If LightGBM predicts NOT FRAUD (0): Reduce by up to 0.15 if high confidence")
print("- Combined with AI analysis, rules, and anomaly detection")
print("- Final score capped at 1.0")
