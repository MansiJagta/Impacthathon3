from __future__ import annotations

import os
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile

from app.core.langgraph_builder import run_claim_workflow
from app.database.claim_repository import (
	create_claim_record,
	get_claim_by_id,
	get_claimer_stats,
	list_claims,
)
from app.models.api_schemas import (
	ClaimDetailsResponse,
	ClaimReasoningItem,
	ClaimSubmitRequest,
	ClaimSummary,
	ClaimerDashboardResponse,
	DashboardStats,
)

router = APIRouter(prefix="/api/claims", tags=["claims"])


def _make_claim_id() -> str:
	return f"CL-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"


def _badge_for_status(status: str) -> str:
	mapping = {
		"APPROVED": "Approved",
		"REJECTED": "Rejected",
		"PENDING_REVIEW": "Pending",
		"FLAGGED_FOR_REVIEW": "Flagged",
		"ESCALATED_FRAUD_REVIEW": "Flagged",
		"REQUESTED_MORE_INFO": "Pending",
	}
	return mapping.get(status, "Pending")


def _risk_score_from_fraud(fraud_score: float) -> float:
	return min(max(fraud_score, 0.0), 1.0)


def _first(value: Any) -> Any:
	if isinstance(value, list):
		return value[0] if value else None
	return value


def _infer_claim_data_from_node1(node1_output: dict[str, Any]) -> dict[str, Any]:
	entities = node1_output.get("extracted_entities", {})
	
	# Prefer entities if they exist (new structured output)
	policy_number = entities.get("policy_number")
	claim_amount = entities.get("total_amount") or entities.get("amount")
	claimer_name = entities.get("claimer_name")
	claimer_address = entities.get("address")
	claimer_phone = entities.get("phone")
	claimer_email = entities.get("email")
	aadhaar_id = entities.get("aadhaar_id")
	diagnosis = entities.get("diagnosis")
	hospital_name = entities.get("hospital_name")
	admission_date = entities.get("admission_date") or entities.get("date")

	return {
		"policy_number": policy_number,
		"claim_amount": claim_amount,
		"claimer_name": claimer_name,
		"claimer_address": claimer_address,
		"claimer_phone": claimer_phone,
		"claimer_email": claimer_email,
		"aadhaar_id": aadhaar_id,
		"diagnosis": diagnosis,
		"hospital_name": hospital_name,
		"admission_date": admission_date,
	}


def _build_submit_response(claim_id: str, final_state: dict[str, Any]) -> dict[str, Any]:
	node1 = final_state.get("node1_output", {})
	node2 = final_state.get("node2_output", {})
	node3 = final_state.get("node3_output", {})
	node4 = final_state.get("node4_output", {})
	node6 = final_state.get("node6_output", {})
	node7 = final_state.get("node7_output", {})

	status = node7.get("final_status", "PENDING_REVIEW")
	decision_reason = node7.get("reason")
	fraud_score = float(node4.get("fraud_score", 0.0) or 0.0)

	return {
		"claim_id": claim_id,
		"status": status,
		"badge": _badge_for_status(status),
		"decision_reason": decision_reason,
		"fraud_score": fraud_score,
		"covered": bool(node3.get("is_covered", False)),
		"covered_amount": node3.get("covered_amount"),
		"explanation": node6.get("explanation_text"),
		# Reliability Metadata
		"extracted_entities": node1.get("extracted_entities"),
		"field_confidence": node1.get("field_confidence"),
		"policy_match_confidence": node3.get("policy_match_confidence"),
		"document_consistency_score": node2.get("consistency_score"),
		"final_decision": status
	}


def _persist_claim(claim_payload: dict[str, Any], final_state: dict[str, Any], claim_id: str) -> None:
	node3 = final_state.get("node3_output", {})
	node4 = final_state.get("node4_output", {})
	node6 = final_state.get("node6_output", {})
	node7 = final_state.get("node7_output", {})

	status = node7.get("final_status", "PENDING_REVIEW")
	decision_reason = node7.get("reason")
	fraud_score = float(node4.get("fraud_score", 0.0) or 0.0)

	create_claim_record(
		{
			"claim_id": claim_id,
			"claim_type": claim_payload["claim_type"],
			"claim_amount": claim_payload["claim_amount"],
			"policy_number": claim_payload["policy_number"],
			"claimer": claim_payload["claimer"],
			"medical": claim_payload.get("medical", {}),
			"form_data": claim_payload.get("form_data", {}),
			"document_paths": claim_payload["document_paths"],
			"status": status,
			"decision_reason": decision_reason,
			"human_review_required": bool(node7.get("human_review_required", False)),
			"fraud_score": fraud_score,
			"risk_score": _risk_score_from_fraud(fraud_score),
			"node2_output": final_state.get("node2_output", {}),
			"node3_output": node3,
			"node4_output": node4,
			"node5_output": final_state.get("node5_output", {}),
			"node6_output": node6,
			"node7_output": node7,
			"node8_output": final_state.get("node8_output", {}),
			"processing_minutes": 0.0,
			"created_at": datetime.utcnow(),
			"updated_at": datetime.utcnow(),
		}
	)


def _to_summary(doc: dict[str, Any]) -> ClaimSummary:
	status = doc.get("status", "PENDING_REVIEW")
	fraud_score = float(doc.get("fraud_score", 0.0) or 0.0)
	return ClaimSummary(
		claim_id=doc.get("claim_id", ""),
		claim_type=doc.get("claim_type", "Unknown"),
		claim_amount=float(doc.get("claim_amount", 0.0) or 0.0),
		status=status,
		badge=_badge_for_status(status),
		fraud_score=fraud_score,
		risk_score=_risk_score_from_fraud(fraud_score),
		created_at=doc.get("created_at"),
		summary=doc.get("decision_reason") or doc.get("status"),
	)


def _build_reasoning(doc: dict[str, Any]) -> list[ClaimReasoningItem]:
	node6 = doc.get("node6_output", {})
	if "reasoning_steps" in node6:
		return [
			ClaimReasoningItem(
				node=step.get("node", "Unknown Node"),
				finding=step.get("finding", ""),
				confidence=step.get("confidence", 0.0)
			) for step in node6["reasoning_steps"]
		]

	# Fallback legacy logic
	node1 = doc.get("node1_output", {})
	node2 = doc.get("node2_output", {})
	node3 = doc.get("node3_output", {})
	node4 = doc.get("node4_output", {})
	node5 = doc.get("node5_output", {})

	items = []

	# Node 1
	n1_reasoning = node1.get("reasoning", [])
	if n1_reasoning:
		items.append(ClaimReasoningItem(
			node="Document Extraction",
			finding=n1_reasoning[0].get("finding", "Docs processed"),
			confidence=n1_reasoning[0].get("confidence", 0.95),
		))

	# Node 2
	items.append(ClaimReasoningItem(
		node="Cross Validation",
		finding=str(node2.get("finding") or node2.get("reason") or "Documents validated"),
		confidence=node2.get("consistency_score") or node2.get("confidence") or 0.5,
	))

	# Node 3
	items.append(ClaimReasoningItem(
		node="Policy Coverage",
		finding="Covered" if node3.get("is_covered") else str(node3.get("reason") or "Not covered"),
		confidence=node3.get("policy_match_confidence") or node3.get("confidence") or 0.5,
	))

	# Node 4
	fraud_finding = f"Risk level: {node4.get('risk_level', 'UNKNOWN')}. "
	fraud_finding += str(node4.get("reasoning") or (", ".join(node4.get("fraud_indicators", [])) or "No major anomaly"))
	items.append(ClaimReasoningItem(
		node="Fraud Detection",
		finding=fraud_finding,
		confidence=1.0 - node4.get("fraud_score", 0.0),
	))

	# Node 5
	items.append(ClaimReasoningItem(
		node="Predictive Analysis",
		finding=str(node5.get("summary") or "Predictive model assessed claim"),
		confidence=node5.get("confidence") or 0.8,
	))

	return items


@router.post("/submit")
def submit_claim(payload: ClaimSubmitRequest):
	if not payload.document_paths:
		raise HTTPException(status_code=400, detail="document_paths is required to run the LangGraph workflow")

	claim_id = payload.claim_id or _make_claim_id()

	try:
		final_state = run_claim_workflow(claim_id=claim_id, document_paths=payload.document_paths)
	except Exception as exc:  # noqa: BLE001
		raise HTTPException(status_code=500, detail=f"Claim workflow failed: {exc}") from exc

	_persist_claim(
		{
			"claim_type": payload.claim_type,
			"claim_amount": payload.claim_amount,
			"policy_number": payload.policy_number,
			"claimer": payload.claimer.model_dump(),
			"form_data": payload.form_data,
			"document_paths": payload.document_paths,
		},
		final_state,
		claim_id,
	)

	return _build_submit_response(claim_id, final_state)


@router.post("/submit-upload")
async def submit_claim_with_upload(
	files: list[UploadFile] = File(...),
	claim_type: str = Form(default="Health"),
	claimer_email: str = Form(default=""),
	claimer_phone: str | None = Form(default=None),
	claimer_address: str | None = Form(default=None),
	claimer_name: str | None = Form(default=None),
	claim_id: str | None = Form(default=None),
):
	if not files:
		raise HTTPException(status_code=400, detail="At least one document is required")

	allowed_claim_types = {"Health", "Motor", "Property"}
	if claim_type not in allowed_claim_types:
		raise HTTPException(status_code=400, detail="claim_type must be one of Health, Motor, Property")

	upload_root = os.path.join("temp_images", "uploads")
	os.makedirs(upload_root, exist_ok=True)

	saved_paths: list[str] = []
	for file in files:
		if not file.filename:
			continue
		safe_name = os.path.basename(file.filename)
		ext = os.path.splitext(safe_name)[1].lower()
		if ext not in {".pdf", ".png", ".jpg", ".jpeg", ".webp"}:
			raise HTTPException(status_code=400, detail=f"Unsupported file type for {safe_name}")

		unique_name = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}_{safe_name}"
		dest = os.path.join(upload_root, unique_name)
		content = await file.read()
		with open(dest, "wb") as out:
			out.write(content)
		saved_paths.append(dest)

	if not saved_paths:
		raise HTTPException(status_code=400, detail="No valid files were uploaded")

	resolved_claim_id = claim_id or _make_claim_id()
	try:
		final_state = run_claim_workflow(claim_id=resolved_claim_id, document_paths=saved_paths)

		inferred = _infer_claim_data_from_node1(final_state.get("node1_output", {}))
		final_policy_number = inferred.get("policy_number") or "UNKNOWN"
		
		# Robust float parsing
		raw_amount = inferred.get("claim_amount")
		final_claim_amount = 0.0
		if raw_amount:
			try:
				# Remove non-numeric chars except decimal
				if isinstance(raw_amount, str):
					clean_amt = "".join(c for c in raw_amount if c.isdigit() or c == ".")
					final_claim_amount = float(clean_amt) if clean_amt else 0.0
				else:
					final_claim_amount = float(raw_amount)
			except (ValueError, TypeError):
				final_claim_amount = 0.0

		# Extracted data takes precedence over login/form data as per user request
		final_claimer_name = inferred.get("claimer_name") or claimer_name or "Unknown Claimer"
		final_claimer_address = inferred.get("claimer_address") or claimer_address
		final_claimer_email = inferred.get("claimer_email") or claimer_email or "unknown@example.com"
		
		# Metadata exposure for frontend
		extraction_metadata = {
			"field_confidence": final_state.get("node1_output", {}).get("field_confidence"),
			"policy_match_confidence": final_state.get("node3_output", {}).get("policy_match_confidence"),
			"document_consistency_score": final_state.get("node2_output", {}).get("consistency_score")
		}

		# Prepare final form_data including metadata for gauges
		final_form_data = {
			"auto_extracted": True,
			"node1_output": final_state.get("node1_output", {}),
			**extraction_metadata
		}

		_persist_claim(
			{
				"claim_type": claim_type,
				"claim_amount": final_claim_amount,
				"policy_number": final_policy_number,
				"claimer": {
					"name": final_claimer_name,
					"email": final_claimer_email,
					"phone": claimer_phone or inferred.get("claimer_phone"),
					"address": final_claimer_address,
					"aadhaar_id": inferred.get("aadhaar_id"),
				},
				"medical": {
					"hospital": inferred.get("hospital_name"),
					"admission_date": inferred.get("admission_date"),
					"diagnosis": inferred.get("diagnosis"),
				},
				"form_data": final_form_data,
				"document_paths": saved_paths,
			},
			final_state,
			resolved_claim_id,
		)

		response = _build_submit_response(resolved_claim_id, final_state)
		response["extracted_claim_data"] = {
			"claim_type": claim_type,
			"claim_amount": final_claim_amount,
			"policy_number": final_policy_number,
			"claimer": {
				"name": final_claimer_name,
				"email": final_claimer_email,
				"phone": claimer_phone,
				"address": final_claimer_address,
			},
			"document_paths": saved_paths,
		}
		return response
	except Exception as exc:  # noqa: BLE001
		import traceback
		print(f"CRITICAL ERROR in submit-upload: {exc}")
		traceback.print_exc()
		raise HTTPException(status_code=500, detail=f"Claim processing error: {exc}") from exc


@router.get("/dashboard/{claimer_email}", response_model=ClaimerDashboardResponse)
def get_claimer_dashboard(claimer_email: str):
	stats = get_claimer_stats(claimer_email)
	recent = list_claims(claimer_email=claimer_email, limit=5)

	return ClaimerDashboardResponse(
		stats=DashboardStats(
			total=int(stats.get("total", 0)),
			approved=int(stats.get("approved", 0)),
			pending=int(stats.get("pending", 0)),
			flagged=int(stats.get("flagged", 0)),
		),
		recent_claims=[_to_summary(item) for item in recent],
	)


@router.get("")
def get_claims(
	claimer_email: str | None = Query(default=None),
	status: str | None = Query(default=None),
	claim_type: str | None = Query(default=None),
	search: str | None = Query(default=None),
	limit: int = Query(default=50, ge=1, le=200),
):
	rows = list_claims(
		claimer_email=claimer_email,
		status=status,
		claim_type=claim_type,
		search=search,
		limit=limit,
	)
	return {
		"count": len(rows),
		"claims": [_to_summary(row).model_dump() for row in rows],
	}


@router.get("/{claim_id}", response_model=ClaimDetailsResponse)
def get_claim_details(claim_id: str):
	doc = get_claim_by_id(claim_id)
	if not doc:
		raise HTTPException(status_code=404, detail="Claim not found")

	claimer = doc.get("claimer") or {}
	medical = doc.get("medical") or {}
	fraud_score = float(doc.get("fraud_score", 0.0) or 0.0)
	decision = doc.get("node7_output", {})

	return ClaimDetailsResponse(
		claim_id=doc.get("claim_id", ""),
		claim_type=doc.get("claim_type", "Unknown"),
		claim_amount=float(doc.get("claim_amount", 0.0) or 0.0),
		status=doc.get("status", "PENDING_REVIEW"),
		ai_decision=decision.get("final_status"),
		confidence=doc.get("node1_output", {}).get("overall_confidence", 0.95),
		fraud_score=fraud_score,
		risk_score=float(doc.get("risk_score", _risk_score_from_fraud(fraud_score))),
		policy_number=doc.get("policy_number"),
		hospital=medical.get("hospital"),
		admission_date=medical.get("admission_date"),
		discharge_date=medical.get("discharge_date"),
		diagnosis=medical.get("diagnosis"),
		claimed_amount=doc.get("claim_amount"),
		claimer={
			"name": claimer.get("name", ""),
			"email": claimer.get("email", ""),
			"phone": claimer.get("phone"),
			"address": claimer.get("address"),
			"aadhaar_id": claimer.get("aadhaar_id"),
		},
		metadata=doc.get("form_data", {}),
		reasoning=_build_reasoning(doc),
		explanation=doc.get("node6_output", {}).get("explanation_text"),
		documents=doc.get("document_paths", []),
	)

