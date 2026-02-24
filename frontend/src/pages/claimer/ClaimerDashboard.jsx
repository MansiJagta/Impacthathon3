import { useState, useEffect } from "react";
import { C } from "../../constants/theme";
import { Badge } from "../../components/Badge";
import api from "../../services/api";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const trendData = [
    { name: 'Jan', amount: 45000 },
    { name: 'Feb', amount: 52000 },
    { name: 'Mar', amount: 38000 },
    { name: 'Apr', amount: 65000 },
    { name: 'May', amount: 48000 },
    { name: 'Jun', amount: 72000 },
];

const categoryData = [
    { name: 'Health', value: 45, color: '#3b82f6' },
    { name: 'Motor', value: 30, color: '#10b981' },
    { name: 'Property', value: 25, color: '#f59e0b' },
];

const StatCard = ({ label, value, color }) => (
    <div style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "24px",
        flex: 1,
        textAlign: "center"
    }}>
        <div style={{ color: color, fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{value}</div>
        <div style={{ color: C.muted, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
    </div>
);

export default function ClaimerDashboard({ onNew, onHistory }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchDashboard() {
            setLoading(true);
            try {
                const userEmail = localStorage.getItem("userEmail");
                if (!userEmail) {
                    setError("No user email found. Please login.");
                    return;
                }
                const dashboardData = await api.getClaimerDashboard(userEmail);
                setData(dashboardData);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError("Failed to fetch dashboard data.");
            } finally {
                setLoading(false);
            }
        }
        fetchDashboard();
    }, []);

    if (loading) return <div style={{ color: C.muted, padding: 40 }}>Loading dashboard analytics...</div>;
    if (error) return <div style={{ color: C.red, padding: 40 }}>{error}</div>;

    const { stats, recent_claims } = data || { stats: { total: 0, approved: 0, pending: 0, flagged: 0 }, recent_claims: [] };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        return date.toLocaleDateString();
    };

    return (
        <div>
            {/* Stats Row */}
            <div style={{ display: "flex", gap: 20, marginBottom: 32 }}>
                <StatCard label="Total Claims" value={stats.total} color={C.blue} />
                <StatCard label="Approved" value={stats.approved} color={C.green} />
                <StatCard label="Pending" value={stats.pending} color={C.yellow} />
                <StatCard label="Flagged" value={stats.flagged} color={C.red} />
            </div>

            {/* Graphs Row */}
            <div style={{ display: "flex", gap: 20, marginBottom: 32 }}>
                {/* Trend Chart */}
                <div style={{
                    flex: 2,
                    background: C.panel,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    padding: 24
                }}>
                    <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Claim Volume Trend (Monthly)</h3>
                    <div style={{ width: "100%", height: 250 }}>
                        <ResponsiveContainer>
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={C.blue} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                                <XAxis dataKey="name" stroke={C.muted} fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke={C.muted} fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ background: "#1e293b", border: `1px solid ${C.border}`, borderRadius: 8 }}
                                    itemStyle={{ color: C.blue }}
                                />
                                <Area type="monotone" dataKey="amount" stroke={C.blue} fillOpacity={1} fill="url(#colorAmt)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div style={{
                    flex: 1,
                    background: C.panel,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    padding: 24
                }}>
                    <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Claims by Category</h3>
                    <div style={{ width: "100%", height: 250 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: "#1e293b", border: `1px solid ${C.border}`, borderRadius: 8 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
                <button
                    onClick={onNew}
                    style={{
                        background: C.blue,
                        color: "#fff",
                        border: "none",
                        padding: "14px 28px",
                        borderRadius: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: `0 4px 14px ${C.blue}44`
                    }}
                >
                    📄 New Claim Submission
                </button>
                <button
                    onClick={onHistory}
                    style={{
                        background: "transparent",
                        color: C.text,
                        border: `1px solid ${C.border}`,
                        padding: "14px 28px",
                        borderRadius: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                    }}
                    onMouseEnter={(e) => e.target.style.background = C.panel}
                    onMouseLeave={(e) => e.target.style.background = "transparent"}
                >
                    📜 Full History View
                </button>
            </div>

            <div style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                overflow: "hidden"
            }}>
                <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)" }}>
                    <h3 style={{ color: C.muted, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
                        Recent Claims Tracking
                    </h3>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                        {recent_claims.map((c, i) => (
                            <tr key={i} style={{ borderBottom: i === recent_claims.length - 1 ? "none" : `1px solid ${C.border}` }}>
                                <td style={{ padding: "20px 24px", color: C.accent, fontWeight: 700, fontSize: 13 }}>{c.claim_id}</td>
                                <td style={{ padding: "20px 24px" }}>
                                    <span style={{ background: C.dim, color: C.text, padding: "4px 12px", borderRadius: 4, fontSize: 10, fontWeight: 800 }}>{c.claim_type}</span>
                                </td>
                                <td style={{ padding: "20px 24px", color: C.text, fontWeight: 800 }}>₹{c.claim_amount.toLocaleString()}</td>
                                <td style={{ padding: "20px 24px", color: C.muted, fontSize: 12 }}>{c.summary}</td>
                                <td style={{ padding: "20px 24px" }}><Badge status={c.badge} /></td>
                                <td style={{ padding: "20px 24px", color: C.muted, fontSize: 11, textAlign: "right" }}>{formatDate(c.created_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

