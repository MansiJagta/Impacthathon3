from collections import Counter
from app.nodes.node2_cross_validation.fuzzy_match import is_match

def resolve_entities(documents_data):
    """
    documents_data: List of dicts where each dict is a document's extracted fields.
    """
    if not documents_data:
        return {}

    resolved = {
        "claimer_name": "",
        "aadhaar_id": "",
        "policy_number": "",
        "hospital_name": "",
        "total_amount": 0.0,
        "amount": 0.0,
        "admission_date": "",
        "date": "",
        "discharge_date": "",
        "diagnosis": "",
        "dob": "",
        "email": "",
        "phone": "",
        "address": ""
    }
    
    for key in resolved.keys():
        values = [doc.get(key) for doc in documents_data if doc.get(key)]
        
        # Cross-mapping for legacy support
        if not values:
            if key == "amount":
                values = [doc.get("total_amount") for doc in documents_data if doc.get("total_amount")]
            elif key == "total_amount":
                values = [doc.get("amount") for doc in documents_data if doc.get("amount")]
            elif key == "date":
                values = [doc.get("admission_date") for doc in documents_data if doc.get("admission_date")]
            elif key == "admission_date":
                values = [doc.get("date") for doc in documents_data if doc.get("date")]
        
        if not values:
            continue
            
        if "amount" in key:
            # Pick the highest numeric value (usually the total bill)
            resolved[key] = max(values)
        elif key == "claimer_name":
            # Pick the most frequent or longest name
            counts = Counter(values)
            resolved[key] = counts.most_common(1)[0][0]
        else:
            # Most frequent
            counts = Counter(values)
            resolved[key] = counts.most_common(1)[0][0]

    return resolved
