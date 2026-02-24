from datetime import datetime


def generate_explanation(node1_output, node2_output, node3_output, node4_output):
    all_reasoning = []
    
    # Node 1 Reasoning
    if node1_output and "reasoning" in node1_output:
        all_reasoning.extend(node1_output["reasoning"])
        
    # Node 2 Reasoning
    if node2_output and "reasoning" in node2_output:
        all_reasoning.extend(node2_output["reasoning"])
        
    # Node 3 Reasoning (Policy)
    if node3_output:
        all_reasoning.append({
            "node": "Policy Coverage",
            "finding": node3_output.get("reason", "Policy check completed."),
            "confidence": node3_output.get("policy_match_confidence", 0.9)
        })
    
    # Node 4 Reasoning (Fraud)
    if node4_output:
        all_reasoning.append({
            "node": "Fraud Detection",
            "finding": f"Risk level: {node4_output.get('risk_level')}. Indicators: {', '.join(node4_output.get('fraud_indicators', [])) if node4_output.get('fraud_indicators') else 'None'}",
            "confidence": 1.0 - node4_output.get("fraud_score", 0)
        })

    explanation = []
    explanation.append("SYSTEM SUMMARY:")
    if node2_output: explanation.append(f"- Consistency: {node2_output.get('status')}")
    if node3_output: explanation.append(f"- Coverage: {'Pass' if node3_output.get('is_covered') else 'Fail'}")
    if node4_output: explanation.append(f"- Fraud Risk: {node4_output.get('risk_level')}")

    return {
        "generated_at": datetime.utcnow(),
        "explanation_text": "\n".join(explanation),
        "reasoning_steps": all_reasoning
    }