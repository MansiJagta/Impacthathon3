import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { C } from "../../constants/theme";
import { GaugeBar } from "../../components/GaugeBar";
import api from "../../services/api";

function Section({ title, children }) {
    return (
        <div style={{ marginBottom: 40 }}>
            <h4 style={{
                color: C.muted,
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 16
            }}>
                {title}
            </h4>
            {children}
        </div>
    );
}

function Info({ label, value }) {
    return (
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 18
        }}>
            <span style={{ color: C.muted }}>{label}</span>
            <span style={{ color: C.text, fontWeight: 700 }}>{value || "N/A"}</span>
        </div>
    );
}

const DocItem = ({ name, status }) => (
    <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px",
        background: "rgba(255,255,255,0.03)",
        borderRadius: 8,
        marginBottom: 12,
        border: `1px solid ${C.border}`
    }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>📄</span>
            <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{name}</span>
        </div>
        <span style={{ color: C.green, fontSize: 11, fontWeight: 800 }}>{status}</span>
    </div>
);

const ReasoningNode = ({ title, result, detail }) => (
    <div style={{ marginBottom: 24, paddingLeft: 16, borderLeft: `2px solid ${result === 'PASS' ? C.green : C.blue}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: C.text, fontWeight: 800, fontSize: 12 }}>{title}</span>
            <span style={{ color: result === 'PASS' ? C.green : C.blue, fontWeight: 900, fontSize: 10 }}>{result}</span>
        </div>
        <p style={{ color: C.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{detail}</p>
    </div>
);

const ActionButton = ({ label, color, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        style={{
            background: color,
            border: "none",
            color: "white",
            padding: "12px 24px",
            borderRadius: 8,
            fontWeight: 700,
            cursor: disabled ? "not-allowed" : "pointer",
            flex: 1,
            opacity: disabled ? 0.7 : 1
        }}
    >
        {label}
    </button>
);

export default function ClaimDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [claim, setClaim] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReasoning, setShowReasoning] = useState(true);
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function fetchDetails() {
            setLoading(true);
            try {
                const data = await api.getClaimDetails(id);
                setClaim(data);
            } catch (err) {
                console.error("Error fetching claim details:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchDetails();
    }, [id]);

    const handleAction = async (decision) => {
        setIsSubmitting(true);
        try {
            const userRole = localStorage.getItem("userRole") || "admin";
            const userEmail = localStorage.getItem("userEmail") || "admin@example.com";

            await api.submitReviewDecision(id, {
                decision,
                note,
                reviewer_name: userRole,
                reviewer_email: userEmail
            });

            alert(`Claim ${decision}ed successfully!`);
            navigate(-1);
        } catch (err) {
            alert(`Failed to save decision: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div style={{ padding: 40, color: C.text }}>Loading claim details...</div>;
    if (error && !claim) return <div style={{ padding: 40, color: C.red }}>Error: {error}</div>;
    if (!claim) return <div style={{ padding: 40, color: C.text }}>Claim not found.</div>;

    // Helper to get nested value
    const getVal = (path, fallback = "N/A") => {
        try {
            const parts = path.split('.');
            let obj = claim;
            for (const part of parts) {
                if (!obj) return fallback;
                obj = obj[part];
            }
            return obj || fallback;
        } catch (e) { return fallback; }
    };

    return (
        <div style={{ padding: 40, backgroundColor: "#0b0f1a", minHeight: "100vh" }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    marginBottom: 32,
                    background: C.panel,
                    border: `1px solid ${C.border}`,
                    color: C.text,
                    padding: "10px 16px",
                    borderRadius: 8,
                    cursor: "pointer"
                }}
            >
                ← Back to Dashboard
            </button>

            <div style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: 32,
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
            }}>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
                    <div>
                        <h2 style={{ color: C.text, fontWeight: 800, margin: 0 }}>
                            Claim Details – {claim.claim_id}
                        </h2>
                        <p style={{ color: C.muted, marginTop: 4 }}>Processed via Intelligent Agentic Workflow</p>
                    </div>

                    <div style={{
                        background: "#6366f111",
                        border: "1px solid #6366f144",
                        padding: "12px 24px",
                        borderRadius: 12,
                        color: "#818cf8",
                        fontWeight: 700,
                        height: "fit-content"
                    }}>
                        STATUS: {claim.status}
                    </div>
                </div>

                <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
                    <div style={{
                        background: (claim.fraud_score || 0) < 0.3 ? "#22c55e11" : "#ef444411",
                        border: `1px solid ${(claim.fraud_score || 0) < 0.3 ? "#22c55e44" : "#ef444444"}`,
                        padding: "10px 18px",
                        borderRadius: 8,
                        color: (claim.fraud_score || 0) < 0.3 ? "#4ade80" : "#f87171",
                        fontWeight: 700
                    }}>
                        Fraud Score: {((claim.fraud_score || 0) * 100).toFixed(0)}% ({(claim.fraud_score || 0) < 0.3 ? "Low Risk" : "High Risk"})
                    </div>

                    <div style={{
                        background: (claim.risk_score || 0) < 0.3 ? "#22c55e11" : "#ef444411",
                        border: `1px solid ${(claim.risk_score || 0) < 0.3 ? "#22c55e44" : "#ef444444"}`,
                        padding: "10px 18px",
                        borderRadius: 8,
                        color: (claim.risk_score || 0) < 0.3 ? "#4ade80" : "#f87171",
                        fontWeight: 700
                    }}>
                        Risk Score: {((claim.risk_score || 0) * 100).toFixed(0)}% ({(claim.risk_score || 0) < 0.3 ? "Valid" : "Critical"})
                    </div>
                </div>

                <div style={{
                    background: "#1e293b",
                    padding: 24,
                    borderRadius: 12,
                    marginBottom: 32,
                    borderLeft: `6px solid ${C.blue}`
                }}>
                    <div style={{ color: C.blue, fontSize: 12, fontWeight: 800, marginBottom: 8, letterSpacing: 1 }}>
                        AGENCY AI RECOMMENDATION
                    </div>
                    <div style={{ color: C.text, fontWeight: 800, fontSize: 22 }}>
                        {claim.ai_decision || "PROCESSING..."}
                    </div>
                    <div style={{ color: C.muted, marginBottom: 12 }}>
                        System Confidence: {((claim.confidence || 0) * 100).toFixed(0)}%
                    </div>
                    <div style={{ color: C.text, fontSize: 15, lineHeight: 1.6, backgroundColor: "#0f172a", padding: 16, borderRadius: 8 }}>
                        "{claim.explanation || "No explanation provided."}"
                    </div>
                </div>

                <div style={{ display: "flex", gap: 60 }}>
                    <div style={{ flex: 1 }}>
                        <Section title="Claimer Information">
                            <Info label="Patient Name" value={getVal('claimer.name')} />
                            <Info label="Policy Number" value={claim.policy_number} />
                            <Info label="Aadhaar ID" value={getVal('claimer.aadhaar_id')} />
                            <Info label="Email" value={getVal('claimer.email')} />
                            <Info label="Phone" value={getVal('claimer.phone')} />
                            <Info label="Address" value={getVal('claimer.address')} />
                        </Section>

                        <Section title="Hospital & Medical">
                            <Info label="Provider" value={claim.hospital} />
                            <Info label="Admission Date" value={claim.admission_date} />
                            <Info label="Diagnosis" value={claim.diagnosis} />
                            <Info label="Claim Amount" value={claim.claimed_amount || claim.claim_amount ? `₹${(claim.claimed_amount || claim.claim_amount).toLocaleString()}` : "N/A"} />
                        </Section>
                    </div>

                    <div style={{ flex: 1 }}>
                        <Section title="Node Performance">
                            <GaugeBar label="Policy Coverage Match" val={getVal('metadata.policy_match_confidence', 0.5)} />
                            <GaugeBar label="Cross-Doc Consistency" val={getVal('metadata.document_consistency_score', 0.5)} />
                            <GaugeBar label="AI Extraction Quality" val={claim.confidence || 0.5} />
                        </Section>

                        <Section title="Verified Documents">
                            {claim.documents && claim.documents.length > 0 ? (
                                claim.documents.map((doc, idx) => (
                                    <DocItem key={idx} name={doc.split(/[\\/]/).pop()} status="Verified" />
                                ))
                            ) : (
                                <div style={{ color: C.muted, fontSize: 12 }}>No document files found.</div>
                            )}
                        </Section>
                    </div>
                </div>

                <div style={{ marginTop: 20 }}>
                    <button
                        onClick={() => setShowReasoning(!showReasoning)}
                        style={{ background: "transparent", border: "none", color: "#60a5fa", cursor: "pointer", fontWeight: 700 }}
                    >
                        {showReasoning ? "Hide Agent Reasoning ▲" : "View Agent Reasoning ▼"}
                    </button>

                    {showReasoning && (
                        <div style={{ marginTop: 16, padding: 24, background: "#0f172a", borderRadius: 12, border: `1px solid ${C.border}` }}>
                            {claim.reasoning && claim.reasoning.length > 0 ? (
                                claim.reasoning.map((step, idx) => (
                                    <ReasoningNode
                                        key={idx}
                                        title={step.node}
                                        result={step.confidence > 0.8 ? "PASS" : "INFO"}
                                        detail={step.finding}
                                    />
                                ))
                            ) : claim.node6_output?.reasoning_steps?.length > 0 ? (
                                claim.node6_output.reasoning_steps.map((step, idx) => (
                                    <ReasoningNode
                                        key={idx}
                                        title={step.node}
                                        result={step.confidence > 0.8 ? "PASS" : "INFO"}
                                        detail={step.finding}
                                    />
                                ))
                            ) : (
                                <div style={{ color: C.muted, fontSize: 13 }}>Reasoning data currently unavailable for this claim.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Footer */}
                <div style={{ marginTop: 40, borderTop: `1px solid ${C.border}`, paddingTop: 30 }}>
                    <h4 style={{ color: C.muted, marginBottom: 16 }}>Reviewer Final Decision</h4>
                    <textarea
                        placeholder="Add internal notes for the audit trail..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        style={{ width: "100%", height: 80, background: "#0f172a", border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, color: C.text, marginBottom: 20 }}
                    />
                </div>
            </div>
        </div>
    );
}
