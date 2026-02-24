from datetime import datetime
import re
from .policy_fetcher import fetch_policy
from .coverage_checker import is_policy_active, calculate_covered_amount, parse_date
from .exclusions_engine import check_exclusions


# --------------------------------
# extract claim context from node1 output
# --------------------------------

def extract_claim_context(node1_output):

    policy_number = None
    claim_amount = 0
    incident_date = None
    description = ""

    for doc in node1_output["documents"]:

        fields = doc.get("structured_fields", {})
        dtype = doc.get("document_type")

        # Prioritize richer fields
        if not policy_number:
            res = fields.get("policy_number")
            policy_number = res[0] if isinstance(res, list) and res else res
            
        if not incident_date:
            res = fields.get("incident_date")
            incident_date = res[0] if isinstance(res, list) and res else res

        if not description:
            description = fields.get("summary") or fields.get("description", "")

        if dtype == "bill" and claim_amount == 0:
            res = fields.get("amount")
            amt = res[0] if isinstance(res, list) and res else res
            try:
                claim_amount = float(amt or 0)
            except (TypeError, ValueError):
                pass

    incident_date = parse_date(incident_date)

    return {
        "policy_number": policy_number,
        "claim_amount": claim_amount,
        "incident_date": incident_date,
        "description": description,
        "incident_type": "accident"
    }


# --------------------------------
# NODE 3 MAIN FUNCTION
# --------------------------------

def normalize_policy_number(p_no: str) -> str:
    if not p_no: return ""
    # Uppercase, remove spaces/special chars
    clean = re.sub(r"[^A-Z0-9]", "", p_no.upper())
    return clean

def verify_policy_coverage(node1_output):
    entities = node1_output.get("extracted_entities", {})
    raw_p_no = entities.get("policy_number")
    normalized_p_no = normalize_policy_number(raw_p_no)
    
    claim_amount = entities.get("amount", 0.0)
    incident_date_str = entities.get("date")
    
    policy = fetch_policy(normalized_p_no)
    
    match_status = "EXACT"
    if not policy and normalized_p_no:
        # Try a substring match or prefix match as fallback for messy OCR
        # (Assuming fetch_policy can handle logic or we fetch all and filter)
        # For simplicity in this mock, we'll stick to exact, but mark as missing.
        pass

    if not policy:
        return {
            "is_covered": False,
            "coverage_status": "NOT_FOUND",
            "reason": "policy not found",
            "policy_match_confidence": node1_output["field_confidence"].get("policy_number", 0.1)
        }

    # date parse
    incident_date = None
    incident_date = parse_date(incident_date_str)

    # policy active?
    active = is_policy_active(policy, incident_date)
    if not active:
        return {
            "is_covered": False,
            "coverage_status": "EXPIRED",
            "reason": "policy not active on incident date"
        }

    # exclusions
    context = {
        "claim_amount": claim_amount,
        "description": entities.get("diagnosis", ""),
        "incident_type": "medical" # Default for this schema
    }
    exclusions_triggered = check_exclusions(policy, context)

    if exclusions_triggered:
        return {
            "is_covered": False,
            "reason": "policy exclusion triggered",
            "exclusions": exclusions_triggered
        }

    # payout
    covered_amount, deductible = calculate_covered_amount(policy, claim_amount)

    return {
        "is_covered": True,
        "coverage_status": "LIKELY_FOUND" if node1_output["field_confidence"].get("policy_number", 1.0) < 0.8 else "VERIFIED",
        "covered_amount": covered_amount,
        "deductible": deductible,
        "policy_limit": policy.get("sumInsured"),
        "policy_match_confidence": node1_output["field_confidence"].get("policy_number", 0.9),
        "confidence": 0.95
    }
