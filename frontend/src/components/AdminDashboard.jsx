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

const AdminStat = ({ label, value, trend, trendColor }) => (
    <div style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "24px",
        flex: 1,
        minWidth: 220,
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    }}>
        <div style={{ color: C.muted, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>{label}</div>
        <div style={{ color: C.text, fontSize: 32, fontWeight: 900, marginBottom: 8 }}>{value}</div>
        {trend && (
            <div style={{ color: trendColor, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                {trend}
            </div>
        )}
    </div>
);

const TypeRow = ({ label, icon, val, color }) => (
    <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{label}</span>
            </div>
            <span style={{ color: C.accent, fontSize: 14, fontWeight: 800 }}>{val}%</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, height: 6 }}>
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

    if (loading) return <div style={{ color: C.muted, padding: 40 }}>Synchronizing global metrics...</div>;
    if (error) return <div style={{ color: C.red, padding: 40 }}>{error}</div>;

    const stats = metrics || { total_claims: 0, auto_rate: 0, avg_process_minutes: 0, fraud_accuracy: 0, fraud_flagged_pct: 0, fraud_cleared_pct: 0, claims_by_type: { Health: 0, Motor: 0, Property: 0 } };
    const byType = stats.claims_by_type || { Health: 0, Motor: 0, Property: 0 };

    const fraudChartData = [
        { name: 'Flagged', value: stats.fraud_flagged_pct, color: '#ef4444' },
        { name: 'Cleared', value: stats.fraud_cleared_pct, color: '#10b981' },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <AdminStat label="Global Claims" value={stats.total_claims} trend="Real-time" trendColor={C.green} />
                <AdminStat label="Automation STP" value={`${stats.auto_rate}%`} trend="Target 90%" trendColor={C.blue} />
                <AdminStat label="Avg Process Time" value={`${stats.avg_process_minutes}m`} trend="In-memory" trendColor={C.muted} />
                <AdminStat label="AI Precision" value={`${stats.fraud_accuracy}%`} trend="Optimized" trendColor={C.green} />
            </div>

            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {/* Main Vol Trend - Placeholder or Hidden if no data */}
                <div style={{ flex: 2, minWidth: 500, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 20, padding: 32 }}>
                    <h4 style={{ color: C.text, fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Operational Status</h4>
                    <p style={{ color: C.muted, fontSize: 13, marginBottom: 32 }}>Historical throughput analytics will populate as more claims are processed.</p>
                    <div style={{ padding: "40px 0", textAlign: "center", color: C.muted }}>
                        Analytics Engine Online. Collecting baseline data...
                    </div>
                </div>

                {/* Fraud Donut */}
                <div style={{ flex: 1, minWidth: 320, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 20, padding: 32, display: "flex", flexDirection: "column" }}>
                    <h4 style={{ color: C.text, fontSize: 18, fontWeight: 800, marginBottom: 32 }}>Risk Distribution</h4>
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
                            <div style={{ color: "#ef4444", fontSize: 24, fontWeight: 900 }}>{stats.fraud_flagged_pct}%</div>
                            <div style={{ color: C.muted, fontSize: 10, fontWeight: 700 }}>FLAGGED</div>
                        </div>
                    </div>
                    <div style={{ marginTop: 24 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                            <span style={{ color: C.muted, fontSize: 13 }}>Fraud Cleared</span>
                            <span style={{ color: C.green, fontWeight: 800 }}>{stats.fraud_cleared_pct}%</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: C.muted, fontSize: 13 }}>Flagged for Review</span>
                            <span style={{ color: "#ef4444", fontWeight: 800 }}>{stats.fraud_flagged_pct}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ gridTemplateColumns: "1fr 1.5fr", gap: 24, display: stats.total_claims > 0 ? "grid" : "none" }}>
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 20, padding: 32 }}>
                    <h4 style={{ color: C.text, fontSize: 18, fontWeight: 800, marginBottom: 32 }}>Portfolio Breakdown</h4>
                    <TypeRow label="Health Insurance" icon="🏥" val={byType.Health} color={C.blue} />
                    <TypeRow label="Motor Claims" icon="🚗" val={byType.Motor} color={C.red} />
                    <TypeRow label="Property Liability" icon="🏠" val={byType.Property} color={C.green} />
                </div>

                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 20, padding: 32 }}>
                    <h4 style={{ color: C.text, fontSize: 18, fontWeight: 800, marginBottom: 32 }}>System Status</h4>
                    <div style={{ padding: 20, color: C.muted, textAlign: "center" }}>
                        Waiting for new system events...
                    </div>
                </div>
            </div>
        </div>
    );
}
