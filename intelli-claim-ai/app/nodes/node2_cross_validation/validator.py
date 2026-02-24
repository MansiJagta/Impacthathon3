from datetime import datetime
import logging
from .fuzzy_match import similarity_score, is_match
from .duplicate_detector import detect_duplicates

logger = logging.getLogger(__name__)

# -----------------------------
# Helper extractors
# -----------------------------

def get_first(lst):
    return lst[0] if lst else None


def extract_all_fields(documents):
    names = []
    addresses = []
    policy_numbers = []
    bill_amounts = []
    incident_dates = []
    dob_dates = []

    for doc in documents:
        fields = doc.get("fields", {}) or doc.get("structured_fields", {})
        
        # Name
        name = fields.get("claimer_name") or fields.get("name")
        if isinstance(name, list) and name: name = name[0]
        if name: names.append(name)

        # Policy
        policy = fields.get("policy_number")
        if isinstance(policy, list) and policy: policy = policy[0]
        # Ignore placeholders
        if policy and str(policy).upper() not in ["N/A", "NOT FOUND", "UNKNOWN", "NONE"]:
            policy_numbers.append(policy)

        # Amount
        amt = fields.get("total_amount") or fields.get("amount")
        if isinstance(amt, list) and amt: amt = amt[0]
        if amt: bill_amounts.append(amt)

        # Address
        addr = fields.get("address")
        if isinstance(addr, list) and addr: addr = addr[0]
        if addr: addresses.append(addr)

        # Dates: Separate DOB from Incident Dates
        dob = fields.get("dob")
        if isinstance(dob, list) and dob: dob = dob[0]
        if dob: dob_dates.append(dob)

        inc_date = fields.get("admission_date") or fields.get("date") or fields.get("incident_date")
        if isinstance(inc_date, list) and inc_date: inc_date = inc_date[0]
        if inc_date and inc_date != dob: # Avoid adding DOB to incident dates if misclassified
            incident_dates.append(inc_date)

    return {
        "names": list(filter(None, names)),
        "addresses": list(filter(None, addresses)),
        "policy_numbers": list(filter(None, policy_numbers)),
        "bill_amounts": list(filter(None, bill_amounts)),
        "dates": list(filter(None, incident_dates)),
        "dob": list(filter(None, dob_dates))
    }


# -----------------------------
# VALIDATION FUNCTIONS
# -----------------------------

def validate_names(names):
    if len(names) < 2:
        return 1.0, []

    mismatches = []
    scores = []

    # Cross-compare all unique pairs for global consistency
    unique_names = list(set(names))
    if len(unique_names) < 2:
        return 1.0, []

    for i in range(len(unique_names)):
        for j in range(i + 1, len(unique_names)):
            s = similarity_score(unique_names[i], unique_names[j])
            scores.append(s)
            if s < 0.85:
                mismatches.append(f"Name mismatch: '{unique_names[i]}' vs '{unique_names[j]}' (Score: {s:.2f})")

    avg_score = sum(scores)/len(scores) if scores else 1.0
    return avg_score, list(set(mismatches))


def validate_policy_numbers(policy_numbers):
    if not policy_numbers or len(set(policy_numbers)) <= 1:
        return 1.0, []
    unique = list(set(policy_numbers))
    return 0.0, [f"Policy number mismatch detected: {unique}"]


def validate_amounts(amounts):
    if len(amounts) < 2:
        return 1.0, []

    try:
        # Convert to float, handling potential string cleaning
        clean_amounts = []
        for a in amounts:
            if not a: continue
            if isinstance(a, str):
                clean_val = "".join(c for c in a if c.isdigit() or c == ".")
                if clean_val: clean_amounts.append(float(clean_val))
            else:
                clean_amounts.append(float(a))
    except (ValueError, TypeError):
        return 0.5, ["Malformed amount data encountered during cross-validation"]
        
    if len(clean_amounts) < 2: return 1.0, []
    
    max_amt = max(clean_amounts)
    min_amt = min(clean_amounts)

    if max_amt == 0:
        return 1.0, []

    diff_ratio = (max_amt - min_amt) / max_amt

    # 20% tolerance for taxes/discounts/minor errors
    if diff_ratio > 0.2:
        return 0.5, [f"Significant amount discrepancy: {min_amt} vs {max_amt}"]

    return 1.0, []


def validate_dates(dates):
    if len(dates) < 2:
        return 1.0, []

    parsed = []
    formats = ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%m/%d/%Y"]
    
    for d in dates:
        if not d: continue
        success = False
        # Normalize: take only the date part if it has time
        date_str = str(d).split()[0].replace(",", "").strip()
        for fmt in formats:
            try:
                parsed.append(datetime.strptime(date_str, fmt))
                success = True
                break
            except:
                continue
        if not success:
            logger.warning(f"Validation: Could not parse date format for '{d}'")

    if len(parsed) < 2:
        return 1.0, []

    # Consistency check: Dates should be within a reasonable window (e.g. same year for a single claim)
    parsed.sort()
    delta = parsed[-1] - parsed[0]
    if delta.days > 90: # 3-month window for a single claim event is usually plenty
        return 0.7, [f"Date range inconsistency: {parsed[0].date()} to {parsed[-1].date()}"]

    return 1.0, []


# -----------------------------
# CONSISTENCY SCORE
# -----------------------------

def compute_consistency_score(scores):
    if not scores:
        return 1.0
    return sum(scores)/len(scores)


# -----------------------------
# MAIN NODE FUNCTION
# -----------------------------

def cross_validate(node1_output):
    documents = node1_output.get("documents", [])
    if not documents:
        return {
            "consistency_score": 1.0,
            "status": "PASS",
            "mismatches": [],
            "reasoning": [{"node": "Cross Validation", "finding": "No documents to validate.", "confidence": 1.0}]
        }

    # duplicate detection
    duplicate_docs = detect_duplicates(documents)

    extracted = extract_all_fields(documents)

    scores = []
    mismatches = []

    # Perform all validations
    validations = [
        (validate_names, "names"),
        (validate_policy_numbers, "policy_numbers"),
        (validate_amounts, "bill_amounts"),
        (validate_dates, "dates")
    ]

    for validator_func, field_key in validations:
        s, m = validator_func(extracted[field_key])
        scores.append(s)
        mismatches.extend(m)

    # duplicate check
    if duplicate_docs:
        mismatches.append(f"Duplicate documents detected: {list(set(duplicate_docs))}")
        scores.append(0.0)

    consistency_score = compute_consistency_score(scores)

    status = "PASS" if consistency_score >= 0.75 else "FAIL"

    finding = "Consistency check PASSED. Multi-document evidence is aligned." if status == "PASS" else f"Consistency check FAILED. Discrepancies found: {'; '.join(mismatches)}"

    return {
        "consistency_score": round(consistency_score, 2),
        "status": status,
        "mismatches": mismatches,
        "duplicate_documents": duplicate_docs,
        "reasoning": [
            {
                "node": "Cross Validation",
                "finding": finding,
                "confidence": round(consistency_score, 2)
            }
        ]
    }