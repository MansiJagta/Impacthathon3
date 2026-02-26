import { useState, useEffect } from "react";
import { C } from "../../constants/theme";
import { Badge } from "../../components/Badge";
import api from "../../services/api";

export default function ReviewerHistory() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchHistory() {
            setLoading(true);
            try {
                const response = await api.listClaims({});
                setClaims(response.claims || []);
            } catch (err) {
                console.error("Error fetching history:", err);
                setError("Failed to fetch claim history.");
                setClaims([]);
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, []);

    if (loading) return <div style={{ color: "#64748B", padding: 24 }}>Loading history...</div>;
    if (error) return <div style={{ color: "#ef4444", padding: 24 }}>Error: {error}</div>;

    return (
        <div style={{ background: "#FFFFFF", border: `1px solid #E2E8F0`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "24px", borderBottom: `1px solid #E2E8F0`, background: "#F8FAFC" }}>
                <h3 style={{ color: "#64748B", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
                    All Processed Claims ({claims.length} Total)
                </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
                {claims.length > 0 ? claims.map((c, i) => (
                    <div key={i} style={{
                        padding: "24px",
                        borderBottom: i === claims.length - 1 ? "none" : `1px solid #E2E8F0`,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ color: "#2563EB", fontWeight: 800, fontSize: 14 }}>{c.claim_id}</span>
                                <span style={{ background: "#F1F5F9", color: "#0F172A", padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{c.claimer?.name || "Unknown"}</span>
                                <span style={{ background: "#F1F5F9", color: "#0F172A", padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{c.claim_type}</span>
                                <span style={{ color: "#0F172A", fontWeight: 800, fontSize: 16 }}>₹{(c.claim_amount || 0).toLocaleString()}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                <Badge status={c.status} />
                                <span style={{ color: "#64748B", fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <p style={{ color: "#64748B", fontSize: 13 }}>
                            AI Recommendation: <span style={{ color: "#2563EB", fontWeight: 600 }}>{c.ai_decision || 'N/A'}</span> · {c.summary}
                        </p>
                        {c.review_note && (
                            <div style={{
                                background: "rgba(245, 158, 11, 0.10)",
                                border: "1px solid rgba(245, 158, 11, 0.30)",
                                borderRadius: 8,
                                padding: "10px 12px",
                                color: C.text,
                                fontSize: 12
                            }}>
                                <span style={{ color: C.yellow, fontWeight: 800 }}>
                                    {c.status === "SENT_FOR_RELEARNING" ? "Relearning Reason:" : "Reviewer Note:"}
                                </span>{" "}
                                {c.review_note}
                            </div>
                        )}
                    </div>
                )) : (
                    <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>No claims found.</div>
                )}
            </div>
        </div>
    );
}
