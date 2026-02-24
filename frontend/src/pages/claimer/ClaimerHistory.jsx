import { useState, useEffect } from "react";
import { C } from "../../constants/theme";
import { Badge } from "../../components/Badge";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function ClaimerHistory() {
    const navigate = useNavigate();
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchHistory() {
            setLoading(true);
            try {
                const userEmail = localStorage.getItem("userEmail") || "demo@example.com";
                const response = await api.listClaims({ claimer_email: userEmail, search });
                setClaims(response.claims || []);
            } catch (err) {
                console.error("History fetch error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, [search]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const stats = claims.reduce((acc, c) => {
        acc.total++;
        if (c.badge === "Approved") acc.approved++;
        if (c.badge === "Pending" || c.badge === "Flagged") acc.pending++;
        if (c.badge === "Rejected") acc.rejected++;
        return acc;
    }, { total: 0, approved: 0, pending: 0, rejected: 0 });

    return (
        <div>
            <div style={{
                background: "#FFFFFF",
                border: `1px solid #E2E8F0`,
                borderRadius: 8,
                padding: "16px 24px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 32
            }}>
                <span style={{ fontSize: 20 }}>🔍</span>
                <input
                    type="text"
                    placeholder="Search by claim ID or type..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        color: "#0F172A",
                        outline: "none",
                        fontSize: 14
                    }}
                />
            </div>

            <div style={{
                background: "#FFFFFF",
                border: `1px solid #E2E8F0`,
                borderRadius: 12,
                overflow: "hidden"
            }}>
                <div style={{ padding: "20px 24px", borderBottom: `1px solid #E2E8F0`, background: "#F8FAFC" }}>
                    <h3 style={{ color: "#64748B", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
                        All My Claims ({claims.length} Results)
                    </h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {loading ? (
                        <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>Loading history...</div>
                    ) : claims.length === 0 ? (
                        <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>No claims found.</div>
                    ) : (
                        claims.map((c, i) => (
                            <div
                                key={i}
                                onClick={() => navigate(`/claim-details/${c.claim_id}`)}
                                style={{
                                    padding: "24px",
                                    borderBottom: i === claims.length - 1 ? "none" : `1px solid #E2E8F0`,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12,
                                    cursor: "pointer",
                                    transition: "background 0.2s ease"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                        <span style={{ color: "#2563EB", fontWeight: 800, fontSize: 14 }}>{c.claim_id}</span>
                                        <span style={{ background: "#F1F5F9", color: "#0F172A", padding: "4px 12px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{c.claim_type}</span>
                                        <span style={{ color: "#0F172A", fontWeight: 800, fontSize: 16 }}>₹{c.claim_amount.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                        <Badge status={c.badge} />
                                        <span style={{ color: "#64748B", fontSize: 12 }}>{formatDate(c.created_at)}</span>
                                    </div>
                                </div>
                                <p style={{ color: "#64748B", fontSize: 13 }}>{c.summary}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {!loading && (
                <div style={{ marginTop: 24, textAlign: "center", color: "#64748B", fontSize: 12 }}>
                    Summary: {stats.total} Total • {stats.approved} Approved • {stats.pending} Pending • {stats.rejected} Rejected
                </div>
            )}
        </div>
    );
}
