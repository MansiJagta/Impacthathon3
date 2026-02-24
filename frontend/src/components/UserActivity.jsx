import { useState, useEffect } from "react";
import { C } from "../constants/theme";
import api from "../services/api";

export default function UserActivity() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchActivity() {
            setLoading(true);
            try {
                const response = await api.getUserActivity();
                // API returns { count, users: [...] }
                setActivities(response.users || []);
            } catch (err) {
                console.error("Error fetching user activity:", err);
                setError("Failed to load global activity.");
            } finally {
                setLoading(false);
            }
        }
        fetchActivity();
    }, []);

    if (loading) return <div style={{ color: C.muted, padding: 24 }}>Loading activity...</div>;
    if (error) return <div style={{ color: C.red, padding: 24 }}>Error: {error}</div>;

    return (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "24px", borderBottom: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)" }}>
                <h3 style={{ color: C.muted, fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
                    User Activity Overview
                </h3>
            </div>

            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ textAlign: "left" }}>
                            <th style={thStyle}>User</th>
                            <th style={thStyle}>Role</th>
                            <th style={thStyle}>Claims</th>
                            <th style={thStyle}>Approval %</th>
                            <th style={thStyle}>Last Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activities.length > 0 ? activities.map((u, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                                <td style={tdStyle}>{u.user || u.email}</td>
                                <td style={tdStyle}>{u.role === 'Claimer' ? '👤 Claimer' : '⚖ Reviewer'}</td>
                                <td style={tdStyle}>{u.claims}</td>
                                <td style={{ ...tdStyle, color: u.approval_rate > 70 ? C.green : C.yellow, fontWeight: 800 }}>{u.approval_rate}%</td>
                                <td style={{ ...tdStyle, color: C.muted }}>{u.last_active ? new Date(u.last_active).toLocaleString() : 'N/A'}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" style={{ padding: 40, textAlign: "center", color: C.muted }}>No user activity recorded.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const thStyle = {
    padding: "12px 24px",
    color: "#64748b",
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
};

const tdStyle = {
    padding: "20px 24px",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600
};
