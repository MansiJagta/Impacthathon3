import re
from rapidfuzz import fuzz, process
from app.database.mongo import policies_collection

def normalize_number(p_no: str) -> str:
    if not p_no: return ""
    return re.sub(r"[^A-Z0-9]", "", str(p_no).upper())

def fetch_policy(policy_number: str):
    """
    Fetches a policy from MongoDB with a fallback to fuzzy matching for robust OCR handling.
    """
    if not policy_number:
        return None

    normalized_input = normalize_number(policy_number)
    
    # 1. Try Exact Match First (on normalized field if possible, but here we query by key)
    # We normalized our seeded data, so an exact match on normalized input should work.
    policy = policies_collection.find_one({"policyNumber": normalized_input})
    if policy:
        return policy

    # 2. Try partial match in DB (normalized)
    policy = policies_collection.find_one({"policyNumber": {"$regex": f"^{normalized_input}"}})
    if policy:
        return policy

    # 3. Fuzzy Matching Fallback
    # Fetch all policy numbers (or a reasonable subset) and find the closest match
    all_policies = list(policies_collection.find({}, {"policyNumber": 1}))
    if not all_policies:
        return None

    policy_numbers = [p["policyNumber"] for p in all_policies]
    
    # Use process.extractOne to find the best match
    best_match = process.extractOne(normalized_input, policy_numbers, scorer=fuzz.token_set_ratio)
    
    if best_match and best_match[1] >= 85: # 85% confidence threshold for OCR errors
        matched_no = best_match[0]
        return policies_collection.find_one({"policyNumber": matched_no})

    return None