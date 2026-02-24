import { useState, useEffect } from "react";
import { C } from "../../constants/theme";
import { Badge } from "../../components/Badge";
import api from "../../services/api";

const StatCard = ({ label, value, color }) => {
    const [hover, setHover] = useState(false);

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                background: C.panel,
                border: `1px solid ${hover ? color : C.border}`,
                borderRadius: 16,
                padding: "28px",
                flex: 1,
                textAlign: "center",
                transition: "all 0.3s ease",
                transform: hover ? "translateY(-6px)" : "translateY(0)",
                boxShadow: hover ? `0 12px 30px ${color}33` : "none",
                position: "relative",
                overflow: "hidden"
            }}
        >
            {/* top accent line */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: 3,
                background: color,
                opacity: 0.7
            }} />

            <div style={{
                color: color,
                fontSize: 40,
                fontWeight: 900,
                marginBottom: 10
            }}>
                {value}
            </div>

            <div style={{
                color: C.muted,
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 1
            }}>
                {label}
            </div>
        </div>
    );
};

export default function ClaimerDashboard({ onNew, onHistory }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchDashboard() {
            setLoading(true);
            try {
                const userEmail = localStorage.getItem("userEmail") || "demo@example.com";
                const dashboardData = await api.getClaimerDashboard(userEmail);
                setData(dashboardData);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchDashboard();
    }, []);

    if (loading) return <div style={{ color: C.muted, padding: 40 }}>Loading dashboard analytics...</div>;
    if (error) return <div style={{ color: C.red, padding: 40 }}>Error: {error}</div>;

    const { stats, recent_claims } = data || { stats: { total: 0, approved: 0, pending: 0, flagged: 0 }, recent_claims: [] };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    return (
        <div style={{ minHeight: "100vh" }}>
            <div
                style={{
                    display: "flex",
                    gap: 20,
                    marginBottom: 32,
                    padding: 20,
                    background: "rgba(99,102,241,0.05)",
                    borderRadius: 20
                }}
            >
                <StatCard label="Total" value={stats.total} color={C.blue} />
                <StatCard label="Approved" value={2} color={C.green} />
                <StatCard label="Pending" value={2} color={C.yellow} />
                <StatCard label="Flagged" value={1} color={C.red} />
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
                <button
                    onClick={onNew}
                    style={{
                        background: C.blue,
                        color: "#fff",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: 8,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "all 0.3s ease",
                        boxShadow: `0 6px 18px ${C.blue}44`,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-3px)";
                        e.currentTarget.style.boxShadow = `0 14px 30px ${C.blue}66`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = `0 6px 18px ${C.blue}44`;
                    }}
                >
                    📄 New Claim →
                </button>
                <button
                    onClick={onHistory}
                    style={{
                        background: "transparent",
                        color: C.text,
                        border: `1px solid ${C.border}`,
                        padding: "12px 24px",
                        borderRadius: 8,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                    }}
                    onMouseEnter={(e) => e.target.style.background = C.panel}
                    onMouseLeave={(e) => e.target.style.background = "transparent"}
                >
                    📜 My History →
                </button>
            </div>

            <div style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                overflow: "hidden"
            }}>
                <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)" }}>
                    <h3 style={{ color: C.muted, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
                        My Recent Claims
                    </h3>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                        {recent_claims.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: "40px", textAlign: "center", color: C.muted }}>
                                    No claims found.
                                </td>
                            </tr>
                        ) : (
                            recent_claims.map((c, i) => (
                                <tr
                                    key={i}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "transparent";
                                    }}
                                    style={{
                                        transition: "background 0.2s ease",
                                        borderBottom: i === recent_claims.length - 1 ? "none" : `1px solid ${C.border}`
                                    }}
                                >
                                    <td style={{ padding: "20px 24px", color: C.accent, fontWeight: 700, fontSize: 13 }}>{c.claim_id}</td>
                                    <td style={{ padding: "20px 24px" }}>
                                        <span style={{ background: C.dim, color: C.text, padding: "4px 12px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{c.claim_type}</span>
                                    </td>
                                    <td style={{ padding: "20px 24px", color: C.text, fontWeight: 800 }}>₹{c.claim_amount.toLocaleString()}</td>
                                    <td style={{ padding: "20px 24px", color: C.muted, fontSize: 12 }}>{c.summary}</td>
                                    <td style={{ padding: "20px 24px" }}><Badge status={c.badge} /></td>
                                    <td style={{ padding: "20px 24px", color: C.muted, fontSize: 11, textAlign: "right" }}>{formatDate(c.created_at)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

