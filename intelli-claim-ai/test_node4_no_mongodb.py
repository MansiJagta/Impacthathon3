"""
Node 4 Test - Case without MongoDB Match
Shows what happens when data isn't in MongoDB
"""

from app.nodes.node4_fraud_detection.fraud_agent import fraud_detection

# Test case: Document WITHOUT corresponding MongoDB record
node1_output = {
    "documents": [
        {
            "document_type": "bill",
            "extracted_text": "Auto Insurance Claim - Amount: $5000 for vehicle repair",
            "structured_fields": {
                "amount": "5000",
                "claimer_name": "John Doe",
                "policy_number": "AUTO-12345999",  # This won't be in MongoDB
                "incident_date": "23/02/2026"
            }
        }
    ]
}

policy = {
    "effectiveDate": "01/01/2025",
    "policyNumber": "AUTO-12345999"
}

print("\n" + "#" * 90)
print("# NODE 4 TEST - WITHOUT MONGODB MATCH")
print("# (Shows fallback to AI + Rules when MongoDB has no data)")
print("#" * 90)

print("\nRunning fraud_detection()...\n")

try:
    node4_output = fraud_detection(node1_output, policy)
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# Print summary
print("\n" + "#" * 90)
print("# RESULT")
print("#" * 90)

print(f"""
FINAL OUTPUT:
├─ fraud_score: {node4_output.get('fraud_score')}
├─ risk_level: {node4_output.get('risk_level')}
├─ confidence: {node4_output.get('confidence')}
├─ mongodb_used: {node4_output.get('mongodb_classification')}
├─ num_indicators: {len(node4_output.get('fraud_indicators', []))}
└─ reasoning: {node4_output.get('reasoning', 'N/A')[:100]}...

STATUS: Processing completed with fallback to AI + Rules analysis
(MongoDB lookup returned no match, so LLM analysis took over)
""")
