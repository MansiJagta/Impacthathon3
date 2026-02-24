import { useState } from "react";
import { C } from "../../constants/theme";
import { Badge } from "../../components/Badge";
import api from "../../services/api";

const UserStat = ({ label, value }) => (
    <div style={{ flex: 1, textAlign: "center" }}>
        <div style={{ color: "#2563EB", fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{value}</div>
        <div style={{ color: "#64748B", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
    </div>
);

export default function UserSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const data = await api.searchUsers(query);
            setResults(data.claims || []);
            setStats(data.stats || null);
        } catch (err) {
            console.error("Search error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter user email or name..."
                    style={{
                        flex: 1,
                        background: "#FFFFFF",
                        border: `1px solid #E2E8F0`,
                        padding: "16px 24px",
                        borderRadius: 8,
                        color: "#0F172A",
                        fontSize: 16,
                        outline: "none"
                    }}
                />
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    style={{
                        background: "#2563EB",
                        color: "#fff",
                        border: "none",
                        padding: "0 32px",
                        borderRadius: 8,
                        fontWeight: 800,
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? "Searching..." : "Search"}
                </button>
            </div>

            {error && <p style={{ color: "#ef4444", marginBottom: 20 }}>{error}</p>}

            {results.length > 0 && (
                <>
                    <p style={{ color: "#64748B", fontSize: 12, marginBottom: 24 }}>Results for "{query}" ({results.length} claims)</p>

                    <div style={{
                        background: "#FFFFFF",
                        border: `1px solid #E2E8F0`,
                        borderRadius: 12,
                        overflow: "hidden",
                        marginBottom: 32
                    }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {results.map((c, i) => (
                                <div key={i} style={{
                                    padding: "24px",
                                    borderBottom: i === results.length - 1 ? "none" : `1px solid #E2E8F0`
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <span style={{ color: "#2563EB", fontWeight: 800, fontSize: 14 }}>{c.claim_id}</span>
                                            <span style={{ background: "#F1F5F9", color: "#0F172A", padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{c.claim_type}</span>
                                            <span style={{ color: "#0F172A", fontWeight: 800, fontSize: 16 }}>₹{c.claim_amount.toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                            <Badge status={c.status} />
                                            <span style={{ color: "#64748B", fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <p style={{ color: "#64748B", fontSize: 12 }}>{c.summary}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {stats && (
                <div style={{
                    background: "#FFFFFF",
                    border: `1px solid #E2E8F0`,
                    borderRadius: 12,
                    padding: "24px 24px"
                }}>
                    <h4 style={{ color: "#64748B", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 25 }}>
                        User Stats
                    </h4>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <UserStat label="Total Claims" value={stats.total_claims} />
                        <UserStat label="Approval Rate" value={`${stats.approval_rate}%`} />
                        <UserStat label="Avg Amount" value={`₹${(stats.avg_amount / 1000).toFixed(1)}k`} />
                        <UserStat label="Last Claim" value={new Date(stats.last_claim).toLocaleDateString()} />
                    </div>
                </div>
            )}

            {!loading && results.length === 0 && query && !error && (
                <p style={{ color: "#64748B", textAlign: "center", padding: 40 }}>No results found for "{query}".</p>
            )}
        </div>
    );
}
