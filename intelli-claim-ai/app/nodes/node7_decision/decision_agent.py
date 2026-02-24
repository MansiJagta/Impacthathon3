def make_claim_decision(node3_output, node4_output):

    fraud_score = node4_output.get("fraud_score", 0)
    risk_level = node4_output.get("risk_level", "LOW")
    is_covered = node3_output.get("is_covered", False)
    
    # NEW: Safety Guard
    p_confidence = node3_output.get("policy_match_confidence", 1.0)
    
    if not is_covered:
        if p_confidence < 0.7:
            return {
                "final_status": "NEEDS_MANUAL_REVIEW",
                "reason": "Policy lookup unsuccessful, but extraction confidence is low (uncertainty guard)",
                "human_review_required": True
            }
        
        return {
            "final_status": "REJECTED",
            "reason": node3_output.get("reason", "Policy does not cover claim"),
            "human_review_required": False
        }

    if fraud_score >= 0.8:
        return {
            "final_status": "ESCALATED_FRAUD_REVIEW",
            "reason": "Very high fraud risk",
            "human_review_required": True
        }

    if fraud_score < 0.3:
        return {
            "final_status": "APPROVED",
            "reason": "Low fraud risk and covered",
            "human_review_required": False
        }

    if fraud_score < 0.6:
        return {
            "final_status": "FLAGGED_FOR_REVIEW",
            "reason": "Moderate fraud risk",
            "human_review_required": True
        }

    return {
        "final_status": "REJECTED",
        "reason": "High risk claim",
        "human_review_required": True
    }
