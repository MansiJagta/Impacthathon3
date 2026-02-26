import { useState, useEffect } from "react";
import { C } from "../../constants/theme";
import { GaugeBar } from "../../components/GaugeBar";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const FRAUD_THRESHOLD = 0.6;

export default function ReviewQueue() {
    const navigate = useNavigate();
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notes, setNotes] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(null); // claimId being submitted
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [sentMessage, setSentMessage] = useState(false);

    useEffect(() => {
        async function fetchQueue() {
            setLoading(true);
            try {
                const response = await api.getReviewerQueue(FRAUD_THRESHOLD);
                setClaims(response.claims || []);
            } catch (err) {
                console.error("Queue fetch error:", err);
                setClaims([]);
                setError("Failed to fetch reviewer queue.");
            } finally {
                setLoading(false);
            }
        }
        fetchQueue();
    }, []);

    const handleAction = async (claimId, decision) => {
        const note = notes[claimId] || "";
        if (decision === "send_for_relearning" && !note.trim()) {
            alert("Please add a note explaining why this claim is being sent for relearning.");
            return;
        }

        setIsSubmitting(claimId);
        try {
            const userRole = localStorage.getItem("userRole") || "reviewer";
            const userEmail = localStorage.getItem("userEmail") || "reviewer@example.com";

            await api.submitReviewDecision(claimId, {
                decision,
                note,
                reviewer_name: userRole,
                reviewer_email: userEmail
            });

            const actionLabel = {
                approve: "approved",
                reject: "rejected",
                request_more_info: "marked for more info",
                send_for_relearning: "sent for relearning"
            };
            alert(`Claim ${actionLabel[decision] || decision} successfully!`);
            setClaims(prev => prev.filter(c => c.claim_id !== claimId));
        } catch (err) {
            alert(`Failed to save decision: ${err.message}`);
        } finally {
            setIsSubmitting(null);
        }
    };

    const handleNoteChange = (claimId, val) => {
        setNotes(prev => ({ ...prev, [claimId]: val }));
    };

    const handleReviewClick = () => {
        setShowConfirmation(true);
    };

    const handleReviewConfirm = (confirmed) => {
        if (confirmed) {
            setSentMessage(true);
            setTimeout(() => {
                setSentMessage(false);
            }, 3000);
        }
        setShowConfirmation(false);
    };

    if (loading) return <div style={{ padding: 40, color: "#64748B" }}>Loading reviewer queue...</div>;
    if (error) return <div style={{ padding: 40, color: "#ef4444" }}>Error: {error}</div>;

    return (
        <div>

            {/* If no high fraud claims */}
            {claims.length === 0 && (
                <div style={{
                    background: "#FFFFFF",
                    border: `1px solid #E2E8F0`,
                    padding: 40,
                    borderRadius: 12,
                    textAlign: "center",
                    color: "#64748B"
                }}>
                    No high-risk claims for manual review.
                </div>
            )}

            {claims.map((claim) => (
                <div
                    key={claim.claim_id}
                    style={{
                        background: "#FFFFFF",
                        border: `1px solid #E2E8F0`,
                        borderRadius: 12,
                        padding: 32,
                        marginBottom: 40
                    }}
                >

                    {/* Header */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 32
                    }}>
                        <h2 style={{
                            color: "#0F172A",
                            fontSize: 20,
                            fontWeight: 800
                        }}>
                            Claim {claim.claim_id}
                        </h2>

                        <span style={{
                            background: claim.fraud_score >= FRAUD_THRESHOLD ? "#FEF3C7" : "#DCFCE7",
                            color: claim.fraud_score >= FRAUD_THRESHOLD ? "#CA8A04" : "#22c55e",
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 800
                        }}>
                            {claim.fraud_score >= FRAUD_THRESHOLD ? "⚠ High Fraud Risk" : "✓ Verification Required"}
                        </span>
                    </div>

                    {/* Layout */}
                    <div style={{ display: "flex", gap: 48 }}>

                        {/* LEFT: Claim Details */}
                        <div style={{ flex: 1 }}>
                            <h4 style={{
                                color: "#64748B",
                                fontSize: 11,
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: 1,
                                marginBottom: 24,
                                paddingBottom: 12,
                                borderBottom: `1px solid #E2E8F0`
                            }}>
                                Claim Details
                            </h4>

                            {[
                                { label: "Type", value: claim.claim_type },
                                { label: "Amount", value: `₹${claim.claim_amount.toLocaleString()}` },
                                { label: "Created", value: new Date(claim.created_at).toLocaleDateString() },
                                { label: "Summary", value: claim.summary },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: 20
                                    }}
                                >
                                    <span style={{ color: "#64748B", fontSize: 13 }}>
                                        {item.label}
                                    </span>
                                    <span style={{ color: "#0F172A", fontSize: 13, fontWeight: 700 }}>
                                        {item.value}
                                    </span>
                                </div>
                            ))}

                            <textarea
                                placeholder="Add reviewer note (required for relearning)…"
                                value={notes[claim.claim_id] || ""}
                                onChange={(e) => handleNoteChange(claim.claim_id, e.target.value)}
                                style={{
                                    width: "100%",
                                    background: "#F8FAFC",
                                    border: `1px solid #E2E8F0`,
                                    color: "#0F172A",
                                    borderRadius: 8,
                                    padding: "10px",
                                    fontSize: 12,
                                    resize: "vertical",
                                    minHeight: 70,
                                    outline: "none",
                                    boxSizing: "border-box",
                                    marginTop: 20
                                }}
                            />
                        </div>

                        {/* RIGHT: AI Analysis */}
                        <div style={{ flex: 1 }}>
                            <h4 style={{
                                color: "#64748B",
                                fontSize: 11,
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: 1,
                                marginBottom: 24,
                                paddingBottom: 12,
                                borderBottom: `1px solid #E2E8F0`
                            }}>
                                AI Analysis
                            </h4>

                            <div style={{ marginBottom: 24 }}>
                                <GaugeBar label="Risk Score" val={claim.risk_score} />
                                <GaugeBar label="Fraud Score" val={claim.fraud_score} />
                            </div>

                            {claim.fraud_score >= FRAUD_THRESHOLD && (
                                <div style={{
                                    background: "#FEE2E2",
                                    border: "1px solid #FECACA",
                                    padding: "12px",
                                    borderRadius: 8,
                                    color: "#dc2626",
                                    fontSize: 12
                                }}>
                                    ⚠ This claim exceeded fraud threshold ({FRAUD_THRESHOLD})
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Decision Buttons */}
                    <div style={{
                        marginTop: 40,
                        paddingTop: 40,
                        borderTop: `1px solid #E2E8F0`,
                        display: "flex",
                        gap: 16
                    }}>
                        <button
                            onClick={() => handleAction(claim.claim_id, "approve")}
                            disabled={isSubmitting === claim.claim_id}
                            style={{
                                flex: 2,
                                background: "#22c55e",
                                color: "#fff",
                                border: "none",
                                padding: "16px",
                                borderRadius: 8,
                                fontWeight: 800,
                                cursor: isSubmitting === claim.claim_id ? "not-allowed" : "pointer",
                                opacity: isSubmitting === claim.claim_id ? 0.7 : 1
                            }}
                        >
                            Approve Claim
                        </button>

                        <button
                            onClick={() => handleAction(claim.claim_id, "reject")}
                            disabled={isSubmitting === claim.claim_id}
                            style={{
                                flex: 2,
                                background: "#ef4444",
                                color: "#fff",
                                border: "none",
                                padding: "16px",
                                borderRadius: 8,
                                fontWeight: 800,
                                cursor: isSubmitting === claim.claim_id ? "not-allowed" : "pointer",
                                opacity: isSubmitting === claim.claim_id ? 0.7 : 1
                            }}
                        >
                            Reject & Flag
                        </button>

                        <button
                            onClick={() => handleAction(claim.claim_id, "send_for_relearning")}
                            disabled={isSubmitting === claim.claim_id}
                            style={{
                                flex: 2,
                                background: C.yellow,
                                color: C.bg,
                                border: "none",
                                padding: "16px",
                                borderRadius: 8,
                                fontWeight: 800,
                                cursor: isSubmitting === claim.claim_id ? "not-allowed" : "pointer",
                                opacity: isSubmitting === claim.claim_id ? 0.7 : 1
                            }}
                        >
                            Send for Relearning
                        </button>

                        <button
                            onClick={() => navigate(`/claim-details/${claim.claim_id}`)}
                            style={{
                                flex: 1,
                                background: "#FFFFFF",
                                color: "#0F172A",
                                border: `1px solid #E2E8F0`,
                                padding: "16px",
                                borderRadius: 8,
                                fontWeight: 800,
                                cursor: "pointer"
                            }}
                        >
                            Full Details →
                        </button>
                    </div>

                </div>
            ))}

            {/* Review Action Card */}
            <div style={{
                background: "#FFFFFF",
                border: `1px solid #E2E8F0`,
                borderRadius: 12,
                padding: 40,
                marginBottom: 40,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20
            }}>
                <div style={{ textAlign: "center" }}>
                    <h3 style={{
                        color: "#0F172A",
                        fontSize: 18,
                        fontWeight: 800,
                        marginBottom: 8
                    }}>
                        Ready to Submit Reviews
                    </h3>
                    <p style={{
                        color: "#64748B",
                        fontSize: 14,
                        margin: 0
                    }}>
                        Submit all claims for final review
                    </p>
                </div>

                <button
                    onClick={handleReviewClick}
                    style={{
                        background: "#3B82F6",
                        color: "#fff",
                        border: "none",
                        padding: "14px 40px",
                        borderRadius: 8,
                        fontWeight: 800,
                        fontSize: 14,
                        cursor: "pointer",
                        marginTop: 8,
                        transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = "#2563EB";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = "#3B82F6";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                    }}
                >
                    Submit Review
                </button>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmation && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        background: "#FFFFFF",
                        border: `1px solid #E2E8F0`,
                        borderRadius: 12,
                        padding: 40,
                        textAlign: "center",
                        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                        maxWidth: 400
                    }}>
                        <h3 style={{
                            color: "#0F172A",
                            fontSize: 18,
                            fontWeight: 800,
                            marginBottom: 12
                        }}>
                            Confirm Submission
                        </h3>

                        <p style={{
                            color: "#64748B",
                            fontSize: 14,
                            marginBottom: 32,
                            margin: "12px 0 32px 0"
                        }}>
                            Are you sure you want to send these reviews for processing?
                        </p>

                        <div style={{
                            display: "flex",
                            gap: 12
                        }}>
                            <button
                                onClick={() => handleReviewConfirm(false)}
                                style={{
                                    flex: 1,
                                    background: "#F1F5F9",
                                    color: "#0F172A",
                                    border: `1px solid #E2E8F0`,
                                    padding: "12px",
                                    borderRadius: 8,
                                    fontWeight: 800,
                                    cursor: "pointer",
                                    fontSize: 13
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={() => handleReviewConfirm(true)}
                                style={{
                                    flex: 1,
                                    background: "#3B82F6",
                                    color: "#fff",
                                    border: "none",
                                    padding: "12px",
                                    borderRadius: 8,
                                    fontWeight: 800,
                                    cursor: "pointer",
                                    fontSize: 13
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sent Message */}
            {sentMessage && (
                <div style={{
                    position: "fixed",
                    top: 20,
                    right: 20,
                    background: "#22c55e",
                    color: "#fff",
                    padding: "16px 24px",
                    borderRadius: 8,
                    fontWeight: 800,
                    fontSize: 14,
                    boxShadow: "0 10px 25px rgba(34, 197, 94, 0.3)",
                    zIndex: 1001
                }}>
                    ✓ Reviews submitted successfully
                </div>
            )}
        </div>
    );
}


