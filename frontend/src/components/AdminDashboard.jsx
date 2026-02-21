import { useState, useEffect } from "react";
import { C } from "../constants/theme";
import api from "../services/api";

const AdminStat = ({ label, value, trend, trendColor }) => (
    <div style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "24px",
        flex: 1,
        minWidth: 200
    }}>
        <div style={{ color: C.muted, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>{label}</div>
        <div style={{ color: C.text, fontSize: 32, fontWeight: 900, marginBottom: 4 }}>{value}</div>
        {trend && (
            <div style={{ color: trendColor, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                {trend}
            </div>
        )}
    </div>
);

const TypeRow = ({ label, icon, val, color }) => (
    <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>{icon}</span>
                <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{label}</span>
            </div>
            <span style={{ color: C.accent, fontSize: 13, fontWeight: 700 }}>{val}%</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, height: 4 }}>
            <div style={{ width: `${val}%`, height: 4, borderRadius: 10, background: color, boxShadow: `0 0 10px ${color}44` }} />
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
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchMetrics();
    }, []);

    if (loading) return <div style={{ color: C.muted }}>Loading dashboard metrics...</div>;
    if (error) return <div style={{ color: C.red }}>Error: {error}</div>;
    if (!metrics) return null;

    const stats = metrics.stats || {};
    const trends = metrics.automation_trends || [];
    const fraud = metrics.fraud_breakdown || { flagged: 0, cleared: 100 };
    const byType = metrics.claims_by_type || { Health: 0, Motor: 0, Property: 0 };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <AdminStat label="Total Claims" value={stats.total_claims || 0} trend="▲ +12%" trendColor={C.green} />
                <AdminStat label="Auto Rate" value={`${stats.auto_rate || 0}%`} trend="▲ +5%" trendColor={C.green} />
                <AdminStat label="Avg Process Time" value={stats.avg_time || "N/A"} trend="▼ -2 min" trendColor={C.green} />
                <AdminStat label="Fraud Accuracy" value={`${stats.fraud_accuracy || 0}%`} trend="▲ +2%" trendColor={C.green} />
            </div>

            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div style={{ flex: 1.5, minWidth: 400, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32 }}>
                    <h4 style={{ color: C.text, fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Claims Volume & Automation Trend</h4>
                    <p style={{ color: C.muted, fontSize: 12, marginBottom: 32 }}>Recent weekly breakdown</p>

                    <div style={{ display: "flex", alignItems: "flex-end", gap: 20, height: 160, marginBottom: 32 }}>
                        {trends.length > 0 ? trends.map((h, i) => (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                                <div style={{
                                    width: "100%",
                                    height: `${h * 1.5}px`,
                                    background: `linear-gradient(0deg, ${C.accent}22, ${C.accent})`,
                                    borderRadius: 4,
                                    boxShadow: `0 0 15px ${C.accent}33`
                                }}></div>
                                <span style={{ color: C.muted, fontSize: 10, fontWeight: 700 }}>P{i + 1}</span>
                            </div>
                        )) : (
                            <div style={{ flex: 1, textAlign: "center", color: C.muted }}>No trend data available.</div>
                        )}
                        <span style={{ color: C.accent, fontWeight: 800 }}>83%</span>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, minWidth: 300, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <h4 style={{ color: C.text, fontSize: 16, fontWeight: 800, marginBottom: 32, width: "100%" }}>Fraud Breakdown</h4>

                <div style={{ position: "relative", width: 140, height: 140, marginBottom: 32 }}>
                    <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                        <circle cx="18" cy="18" r="16" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="16" fill="transparent" stroke={C.green} strokeWidth="3" strokeDasharray={`${fraud.cleared}, 100`} />
                        <circle cx="18" cy="18" r="16" fill="transparent" stroke={C.red} strokeWidth="3" strokeDasharray={`${fraud.flagged}, 100`} strokeDashoffset={`-${fraud.cleared}`} />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                        <span style={{ color: C.text, fontSize: 24, fontWeight: 900 }}>{fraud.flagged}%</span>
                    </div>
                </div>

                <div style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ color: C.muted, fontSize: 12 }}>Flagged</span>
                        <span style={{ color: C.red, fontWeight: 800, fontSize: 12 }}>{fraud.flagged}%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: C.muted, fontSize: 12 }}>Cleared</span>
                        <span style={{ color: C.green, fontWeight: 800, fontSize: 12 }}>{fraud.cleared}%</span>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, minWidth: 300, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32 }}>
                <h4 style={{ color: C.text, fontSize: 16, fontWeight: 800, marginBottom: 32 }}>Claims by Type</h4>
                <TypeRow label="Health" icon="🏥" val={byType.Health || 0} color={C.blue} />
                <TypeRow label="Motor" icon="🚗" val={byType.Motor || 0} color={C.red} />
                <TypeRow label="Property" icon="🏠" val={byType.Property || 0} color={C.green} />
            </div>
        </div>
    );
}
