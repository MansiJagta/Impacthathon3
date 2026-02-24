from datetime import datetime
from app.database.mongo import high_risk_claims_collection


def store_high_risk_claim(
    claim_id,
    node1_output,
    node2_output,
    node3_output,
    node4_output,
    explanation_output
):

    doc = {
        "claim_id": claim_id,
        "risk_level": node4_output.get("risk_level"),
        "fraud_score": node4_output.get("fraud_score"),

        "coverage_decision": node3_output,
        "validation_result": node2_output,
        
        # New Metadata Tracking
        "extracted_entities": node1_output.get("extracted_entities"),
        "field_confidence": node1_output.get("field_confidence"),
        "overall_confidence": node1_output.get("overall_confidence"),

        "ai_explanation": explanation_output.get("explanation_text", ""),

        "created_at": datetime.utcnow(),

        "status": "PENDING_HUMAN_REVIEW"
    }

    high_risk_claims_collection.insert_one(doc)
    print(f"Stored claim {claim_id} in HITL database with reliability scores.")
