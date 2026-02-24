import { useState, useEffect } from "react";
import { C } from "../constants/theme";
import api from "../services/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const dummyTrends = [
    { name: 'W1', volume: 45, auto: 38 },
    { name: 'W2', volume: 52, auto: 42 },
    { name: 'W3', volume: 48, auto: 45 },
    { name: 'W4', volume: 70, auto: 63 },
    { name: 'W5', volume: 65, auto: 58 },
];

const dummyFraud = [
    { name: 'Flagged', value: 15, color: '#ef4444' },
    { name: 'Cleared', value: 85, color: '#10b981' },
];

const AdminStat = ({ label, value, color }) => {
    const [hover, setHover] = useState(false);

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                background: "#FFFFFF",
                border: `1px solid ${hover ? color : "#E2E8F0"}`,
                borderRadius: 12,
                padding: "28px",
                flex: 1,
                minWidth: 200,
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
                transform: hover ? "translateY(-6px)" : "translateY(0)",
                boxShadow: hover ? `0 12px 30px ${color}15` : "none"
            }}
        >
            {/* Top Accent Line */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: 3,
                background: color,
                opacity: 0.8
            }} />

            <div style={{
                color: color,
                fontSize: 42,
                fontWeight: 900,
                marginBottom: 10
            }}>
                {value}
            </div>

            <div style={{
                color: "#64748B",
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

const TypeRow = ({ label, icon, val, color }) => (
    <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ color: "#0F172A", fontSize: 14, fontWeight: 700 }}>{label}</span>
            </div>
            <span style={{ color: "#2563EB", fontSize: 14, fontWeight: 800 }}>{val}%</span>
        </div>
        <div style={{ background: "#F1F5F9", borderRadius: 10, height: 6 }}>
            <div style={{
                width: `${val}%`,
                height: 6,
                borderRadius: 10,
                background: `linear-gradient(90deg, ${color}cc, ${color})`,
                boxShadow: `0 0 12px ${color}33`
            }} />
        </div>
    </div>
);

export default function AdminDashboard() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchMetrics() {
            setLoading(true);
            try {
                const data = await api.getAdminDashboard();
                setMetrics(data);
            } catch (err) {
                console.error("Error fetching admin dashboard:", err);
                setError("Failed to fetch admin metrics.");
            } finally {
                setLoading(false);
            }
        }
        fetchMetrics();
    }, []);


    if (loading) return <div style={{ color: "#64748B" }}>Loading dashboard metrics...</div>;
    if (error) return <div style={{ color: "#ef4444" }}>Error: {error}</div>;
    if (!metrics) return null;
    const byType = metrics.claims_by_type || { Health: 0, Motor: 0, Property: 0 };

    const fraudChartData = [
        { name: 'Flagged', value: metrics.fraud_flagged_pct, color: '#ef4444' },
        { name: 'Cleared', value: metrics.fraud_cleared_pct, color: '#10b981' },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div
                style={{
                    display: "flex",
                    gap: 20,
                    flexWrap: "wrap",
                    padding: 20,
                    borderRadius: 12,
                    background: "linear-gradient(to right, #EFF6FF, transparent)",
                    marginBottom: 8
                }}
            >
                <AdminStat label="Total Claims" value={metrics.total_claims || 0} color="#2563EB" />
                <AdminStat label="Auto Rate" value={`${metrics.auto_rate || 0}%`} color="#22c55e" />
                <AdminStat label="Avg Process Time" value={metrics.avg_time || "N/A"} color="#CA8A04" />
                <AdminStat label="Fraud Accuracy" value={`${metrics.fraud_accuracy || 0}%`} color="#ef4444" />
            </div>

            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {/* Main Vol Trend - Placeholder or Hidden if no data */}
                <div style={{ flex: 2, minWidth: 500, background: "#FFFFFF", border: `1px solid #E2E8F0`, borderRadius: 12, padding: 32 }}>
                    <h4 style={{ color: "#0F172A", fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Operational Status</h4>
                    <p style={{ color: "#64748B", fontSize: 13, marginBottom: 32 }}>Historical throughput analytics will populate as more claims are processed.</p>
                    <div style={{ padding: "40px 0", textAlign: "center", color: "#64748B" }}>
                        Analytics Engine Online. Collecting baseline data...
                    </div>
                </div>

                {/* Fraud Donut */}
                <div style={{ flex: 1, minWidth: 320, background: "#FFFFFF", border: `1px solid #E2E8F0`, borderRadius: 12, padding: 32, display: "flex", flexDirection: "column" }}>
                    <h4 style={{ color: "#0F172A", fontSize: 18, fontWeight: 800, marginBottom: 32 }}>Risk Distribution</h4>
                    <div style={{ flex: 1, position: "relative" }}>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={fraudChartData}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {fraudChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                            <div style={{ color: "#ef4444", fontSize: 24, fontWeight: 900 }}>{metrics.fraud_flagged_pct}%</div>
                            <div style={{ color: "#64748B", fontSize: 10, fontWeight: 700 }}>FLAGGED</div>
                        </div>
                    </div>
                    <div style={{ marginTop: 24 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                            <span style={{ color: "#64748B", fontSize: 13 }}>Fraud Cleared</span>
                            <span style={{ color: "#22c55e", fontWeight: 800 }}>{metrics.fraud_cleared_pct}%</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748B", fontSize: 13 }}>Flagged for Review</span>
                            <span style={{ color: "#ef4444", fontWeight: 800 }}>{metrics.fraud_flagged_pct}%</span>
                        </div>

                    </div>
                </div>
            </div>
            <div style={{ gridTemplateColumns: "1fr 1.5fr", gap: 24, display: metrics.total_claims > 0 ? "grid" : "none" }}>
                <div style={{ background: "#FFFFFF", border: `1px solid #E2E8F0`, borderRadius: 12, padding: 32 }}>
                    <h4 style={{ color: "#0F172A", fontSize: 18, fontWeight: 800, marginBottom: 32 }}>Portfolio Breakdown</h4>
                    <TypeRow label="Health Insurance" icon="🏥" val={byType.Health} color="#2563EB" />
                    <TypeRow label="Motor Claims" icon="🚗" val={byType.Motor} color="#ef4444" />
                    <TypeRow label="Property Liability" icon="🏠" val={byType.Property} color="#22c55e" />
                </div>

                <div style={{ background: "#FFFFFF", border: `1px solid #E2E8F0`, borderRadius: 12, padding: 32 }}>
                    <h4 style={{ color: "#0F172A", fontSize: 18, fontWeight: 800, marginBottom: 32 }}>System Status</h4>
                    <div style={{ padding: 20, color: "#64748B", textAlign: "center" }}>
                        Waiting for new system events...
                    </div>
                </div>
            </div>
        </div>
    );
}
