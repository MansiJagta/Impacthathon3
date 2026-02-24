import uuid
import json
from pathlib import Path
from datetime import datetime

# -----------------------------
# DATABASE IMPORTS
# -----------------------------
from app.database.claim_repository import create_claim_record
from app.database.mongo import policies_collection

# -----------------------------
# NODE IMPORTS
# -----------------------------
from app.nodes.node1_extraction.extractor import process_documents
from app.nodes.node2_cross_validation.validator import cross_validate
from app.nodes.node3_policy_coverage.policy_agent import verify_policy_coverage
from app.nodes.node3_policy_coverage.policy_fetcher import fetch_policy
from app.nodes.node4_fraud_detection.fraud_agent import fraud_detection
from app.nodes.node5_predictive.predictive_agent import predictive_analysis
from app.nodes.node6_explanation.explanation_generator import generate_explanation
from app.nodes.node7_decision.decision_agent import make_claim_decision
from app.nodes.node8_subrogation.subrogation_agent import analyze_subrogation

# HITL service
from app.services.hitl_service import store_high_risk_claim

# ======================================================
# CONFIGURATION
# ======================================================
PREDICTED_COST_THRESHOLD = 50000  # Node 5 threshold

# ======================================================
# STEP 1 — LOAD CLAIM DOCUMENTS
# ======================================================
sample_dir = Path("sample_docs")
if not sample_dir.exists():
    sample_dir.mkdir(exist_ok=True)
    # Create a small dummy file if none exist
    with open(sample_dir / "test_doc.txt", "w") as f:
        f.write("Policy Number: POL12345\nHolder: John Doe\nAmount: Rs 15000\nDiagnosis: Viral Fever")

files = []
for candidate in sample_dir.glob("*"):
    if candidate.is_file() and candidate.stat().st_size > 0:
        files.append(str(candidate).replace("\\", "/"))

if not files:
    raise FileNotFoundError("No usable input files found in sample_docs.")

print("\n========== END-TO-END PIPELINE VERIFICATION STARTED ==========\n")
claim_id = f"TEST-CLM-{uuid.uuid4().hex[:8].upper()}"
print(f"Assigning Claim ID: {claim_id}")

# ======================================================
# STEP 2 — NODE 1 EXTRACTION (Reliability Upgrade)
# ======================================================
node1_output = process_documents(claim_id, files)
print("NODE 1 COMPLETE — EXTRACTED ENTITIES & CONFIDENCE SCORES")
print(f"Extracted Entities: {json.dumps(node1_output.get('extracted_entities'), indent=2)}")

# ======================================================
# STEP 3 — NODE 2 VALIDATION
# ======================================================
node2_output = cross_validate(node1_output)
print("NODE 2 COMPLETE — CONSISTENCY SCORE: ", node2_output.get("consistency_score"))

# ======================================================
# STEP 4 — NODE 3 POLICY COVERAGE (Normalized Lookup)
# ======================================================
node3_output = verify_policy_coverage(node1_output)
print("NODE 3 COMPLETE — COVERAGE STATUS: ", node3_output.get("coverage_status"))

# Use seeded policy for Node 4
seeded_p_no = node1_output.get("extracted_entities", {}).get("policy_number", "POL12345")
policy = fetch_policy(seeded_p_no) or {}

# ======================================================
# STEP 5 — NODE 4 FRAUD DETECTION
# ======================================================
node4_output = fraud_detection(node1_output, policy)
print("NODE 4 COMPLETE — FRAUD SCORE: ", node4_output.get("fraud_score"))

# ======================================================
# STEP 6 — NODE 5 PREDICTIVE ANALYSIS
# ======================================================
node5_output = predictive_analysis(
    node1_output,
    node2_output,
    node3_output,
    node4_output
)
print("NODE 5 COMPLETE — PREDICTIVE ANALYSIS FINISHED")

# ======================================================
# STEP 7 — NODE 6 EXPLANATION (XAI)
# ======================================================
node6_output = generate_explanation(
    node2_output,
    node3_output,
    node4_output
)
print("NODE 6 COMPLETE — AI EXPLANATION GENERATED")

# ======================================================
# STEP 8 — NODE 7 FINAL DECISION (Safety Guards)
# ======================================================
node7_output = make_claim_decision(node3_output, node4_output)
print("NODE 7 COMPLETE — FINAL DECISION: ", node7_output.get("final_status"))

# ======================================================
# STEP 9 — NODE 8 SUBROGATION ANALYSIS
# ======================================================
node8_output = analyze_subrogation(node1_output)
print("NODE 8 COMPLETE — SUBROGATION CHECKED")

# ======================================================
# STEP 10 — DATABASE PERSISTENCE
# ======================================================

# 1. Main Claims Database
claim_record = {
    "claim_id": claim_id,
    "claim_type": "Medical",
    "claim_amount": node1_output.get("extracted_entities", {}).get("amount", 0.0),
    "policy_number": node1_output.get("extracted_entities", {}).get("policy_number", "UNKNOWN"),
    "claimer": {
        "name": node1_output.get("extracted_entities", {}).get("claimer_name", "Unknown"),
        "email": node1_output.get("extracted_entities", {}).get("email", "unknown@example.com")
    },
    "document_paths": files,
    "status": node7_output.get("final_status"),
    "decision_reason": node7_output.get("reason"),
    "human_review_required": node7_output.get("human_review_required", False),
    "fraud_score": node4_output.get("fraud_score", 0.0),
    "node1_output": node1_output,
    "node2_output": node2_output,
    "node3_output": node3_output,
    "node4_output": node4_output,
    "node5_output": node5_output,
    "node6_output": node6_output,
    "node7_output": node7_output,
    "created_at": datetime.utcnow()
}
db_id = create_claim_record(claim_record)
print(f"\nSUCCESS: Claim record persisted to insurance_db.claims (ID: {db_id})")

# 2. HITL Database (if applicable)
if node7_output.get("human_review_required") or node4_output.get("fraud_score", 0) > 0.7:
    store_high_risk_claim(
        claim_id,
        node1_output,
        node2_output,
        node3_output,
        node4_output,
        node6_output
    )
    print("SUCCESS: Claim escalated and stored in hitl_db.high_risk_claims")

# ======================================================
# FINAL SUMMARY
# ======================================================
print("\n========== PIPELINE VERIFICATION COMPLETE ==========")
print(f"Final Decision: {node7_output.get('final_status')}")
print(f"Decision Reason: {node7_output.get('reason')}")
print(f"Extraction Confidence: {node1_output.get('overall_confidence')}")
print("====================================================")