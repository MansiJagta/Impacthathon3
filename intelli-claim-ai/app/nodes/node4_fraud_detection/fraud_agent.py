from datetime import datetime
from .fraud_rules import round_amount_check
from .benford import benford_score
from .watchlist_scan import watchlist_match
from .anomaly_models import anomaly_score
from .mongodb_fraud_classifier import classify_fraud_mongodb


def _parse_date(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.replace(tzinfo=None)
    if isinstance(value, str):
        for date_format in ("%d/%m/%Y", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S"):
            try:
                return datetime.strptime(value, date_format)
            except ValueError:
                continue
    return None


def _first_field_value(fields, key, default):
    value = fields.get(key, default)
    if isinstance(value, list):
        return value[0] if value else default
    return value


def extract_context(node1_output, policy):

    claim_amount = 0
    claimant_name = ""
    incident_date = None
    policy_number = ""

    # ========================================
    # 1. TRY TOP-LEVEL EXTRACTED ENTITIES FIRST
    # ========================================
    extracted_entities = node1_output.get("extracted_entities", {})
    if extracted_entities:
        claimant_name = extracted_entities.get("claimer_name", "")
        if not policy_number:
            policy_number = extracted_entities.get("policy_number", "")
        if not claim_amount:
            claim_amount = extracted_entities.get("total_amount") or extracted_entities.get("amount", 0)
        if not incident_date:
            incident_date = extracted_entities.get("admission_date") or extracted_entities.get("incident_date")

    # ========================================
    # 2. FALLBACK TO DOCUMENT-LEVEL FIELDS
    # ========================================
    for doc in node1_output.get("documents", []):
        fields = doc.get("structured_fields", {})
        dtype = doc.get("document_type")

        if dtype == "bill":
            raw_amount = _first_field_value(fields, "amount", 0)
            try:
                if isinstance(raw_amount, str):
                    clean_amt = "".join(c for c in raw_amount if c.isdigit() or c == ".")
                    claim_amount = float(clean_amt) if clean_amt else 0.0
                else:
                    claim_amount = float(raw_amount or 0)
            except (TypeError, ValueError):
                claim_amount = 0.0

        # Prefer richer LLM extraction
        if not claimant_name:
            temp = fields.get("claimer_name") or _first_field_value(fields, "holder_name", "")
            claimant_name = temp[0] if isinstance(temp, list) else str(temp or "")

        # Extract policy number
        if not policy_number:
            temp = fields.get("policy_number") or _first_field_value(fields, "policy_number", "")
            policy_number = temp[0] if isinstance(temp, list) else str(temp or "")

        if not incident_date:
            res = fields.get("incident_date")
            incident_date = res[0] if isinstance(res, list) and res else res

    incident_date = _parse_date(incident_date)

    policy_start = _parse_date(policy.get("effectiveDate"))
    days_since_policy = 0
    if incident_date and policy_start:
        days_since_policy = (incident_date - policy_start).days

    return claim_amount, claimant_name, days_since_policy, policy_number


def fraud_detection(node1_output, policy):

    print("\n" + "="*80)
    print("NODE 4: FRAUD DETECTION PROCESSING")
    print("="*80)

    amount, name, days_since_policy, policy_number = extract_context(node1_output, policy)
    
    print(f"\n[CONTEXT EXTRACTION]")
    print(f"  ✓ Claim Amount: ${amount:.2f}")
    print(f"  ✓ Claimant Name: {name if name else 'N/A'}")
    print(f"  ✓ Policy Number: {policy_number if policy_number else 'N/A'}")
    print(f"  ✓ Days Since Policy Start: {days_since_policy}")

    indicators = []
    score = 0

    # ========================================
    # 0. MONGODB LIGHTGBM CLASSIFICATION (PRIMARY DATA-DRIVEN CHECK)
    # ========================================
    print(f"\n[STEP 0] MongoDB LightGBM Classification (PRIMARY CHECK)")
    mongodb_result = None
    lookup_key = None
    
    if name:
        print(f"  → Searching by claimer name: {name}")
        mongodb_result = classify_fraud_mongodb(claimer_name=name)
        lookup_key = "claimer_name"
    elif policy_number:
        print(f"  → Searching by policy number: {policy_number}")
        mongodb_result = classify_fraud_mongodb(policy_number=policy_number)
        lookup_key = "policy_number"
    else:
        print(f"  → No policy number or claimer name available for MongoDB lookup")
    
    if mongodb_result:
        print(f"  ✓ MongoDB record found")
        if mongodb_result['prediction'] == 1:
            # Positive fraud indicator (prediction = fraud)
            print(f"    └─ Prediction: FRAUD")
            print(f"    └─ Probability: {mongodb_result['probability']:.4f}")
            print(f"    └─ Confidence: {mongodb_result['confidence']:.2%}")
            indicators.append(f"MongoDB LightGBM prediction: FRAUD (confidence: {mongodb_result['confidence']:.2%})")
            # Add significant weight based on model's probability
            score_delta = 0.4 + (0.3 * mongodb_result['probability'])  # 0.4 to 0.7
            print(f"    └─ Score Impact: +{score_delta:.2f}")
            score += score_delta
        else:
            # Negative fraud indicator (prediction = no fraud)
            print(f"    └─ Prediction: NOT FRAUD (Legitimate)")
            print(f"    └─ Probability: {mongodb_result['probability']:.4f}")
            print(f"    └─ Confidence: {mongodb_result['confidence']:.2%}")
            indicators.append(f"MongoDB LightGBM prediction: LEGITIMATE (confidence: {mongodb_result['confidence']:.2%})")
            # Reduce score based on model's confidence
            score_delta = min(0.2 * mongodb_result['confidence'], 0.15)  # Reduce by up to 0.15 if high confidence
            print(f"    └─ Score Impact: -{score_delta:.2f}")
            score -= score_delta
    else:
        print(f"  ✗ No MongoDB record found (proceeding with AI + rules)")
    
    print(f"  Current Score: {score:.2f}")

    # ========================================
    # 1. QUALITATIVE AI ANALYSIS
    # ========================================
    print(f"\n[STEP 1] Qualitative AI Analysis (LLM)")
    from app.services.llm_service import llm_service
    # Combine all document texts for context
    context_text = "\n\n".join([
        f"Doc: {doc.get('document_type')}\nText: {doc.get('extracted_text', '')[:1000]}"
        for doc in node1_output.get("documents", [])
    ])
    ai_analysis = llm_service.analyze_claim_context(context_text)
    
    if ai_analysis:
        ai_risk_level = ai_analysis.get("risk_level", "LOW")
        print(f"  ✓ AI Analysis completed")
        print(f"    └─ Risk Level: {ai_risk_level}")
        indicators.extend(ai_analysis.get("fraud_indicators", []))
        # Initial score from AI
        ai_risk_map = {"LOW": 0.1, "MEDIUM": 0.3, "HIGH": 0.6, "CRITICAL": 0.9}
        score_delta = ai_risk_map.get(ai_risk_level, 0.1)
        print(f"    └─ Score Impact: +{score_delta:.2f}")
        score += score_delta
        print(f"    └─ Indicators: {len(ai_analysis.get('fraud_indicators', []))} found")
    else:
        print(f"  ✗ AI analysis failed")
    
    print(f"  Current Score: {score:.2f}")

    # 2. Programmatic Rules (Supplemental)
    print(f"\n[STEP 2] Programmatic Rules Check")
    rules_triggered = []
    
    # round amount rule
    if round_amount_check(amount):
        if "round number claim amount" not in indicators:
            indicators.append("round number claim amount")
        score += 0.05
        rules_triggered.append(f"Round amount (${amount:.0f}) [{+0.05}]")

    # timing fraud
    if days_since_policy < 7:
        if "claim too soon after policy start" not in indicators:
            indicators.append("claim too soon after policy start")
        score += 0.1
        rules_triggered.append(f"Early claim ({days_since_policy} days) [{+0.1}]")

    # benford
    b_score = benford_score(amount)
    if b_score > 0.2:
        if "benford distribution anomaly" not in indicators:
            indicators.append("benford distribution anomaly")
        score += 0.1
        rules_triggered.append(f"Benford anomaly (score: {b_score:.3f}) [{+0.1}]")

    # watchlist
    matched, name_hit = watchlist_match(name)
    if matched:
        indicators.append(f"watchlist match: {name_hit}")
        score += 0.3
        rules_triggered.append(f"Watchlist match ({name_hit}) [{+0.3}]")

    if rules_triggered:
        for rule in rules_triggered:
            print(f"  ✓ {rule}")
    else:
        print(f"  ✓ No rules triggered")
    
    print(f"  Current Score: {score:.2f}")

    # 3. ML Anomaly Detection
    print(f"\n[STEP 3] ML Anomaly Detection")
    if anomaly_score(amount, days_since_policy):
        if "ml anomaly detected" not in indicators:
            indicators.append("ml anomaly detected")
        score += 0.2
        print(f"  ✓ Anomaly detected in amount/timing profile [{+0.2}]")
    else:
        print(f"  ✓ No anomalies detected")
    
    print(f"  Current Score: {score:.2f}")

    # Normalize score
    score = min(score, 1.0)
    print(f"\n[NORMALIZATION] Score capped at: {score:.2f}")

    # risk level (Recalculate based on total score)
    if score < 0.3:
        risk = "LOW"
    elif score < 0.6:
        risk = "MEDIUM"
    elif score < 0.85:
        risk = "HIGH"
    else:
        risk = "CRITICAL"

    print(f"\n[FINAL RESULT]")
    print(f"  ✓ Fraud Score: {score:.2f}")
    print(f"  ✓ Risk Level: {risk}")
    print(f"  ✓ Total Indicators: {len(indicators)}")
    print(f"  ✓ MongoDB Used: {mongodb_result is not None}")
    print("="*80 + "\n")

    return {
        "fraud_score": round(score, 2),
        "fraud_indicators": indicators,
        "risk_level": risk,
        "reasoning": ai_analysis.get("reasoning", "No qualitative analysis available"),
        "confidence": ai_analysis.get("extraction_confidence", 0.8),
        "mongodb_classification": mongodb_result is not None,
        "mongodb_data": mongodb_result
    }