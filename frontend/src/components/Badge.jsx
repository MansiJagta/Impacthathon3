import { C } from "../constants/theme";

export function Badge({ status }) {
    const map = {
        Approved: { bg: "#DCFCE7", color: "#22c55e", dot: "#22c55e", label: "Approved" },
        Pending: { bg: "#FEF3C7", color: "#CA8A04", dot: "#CA8A04", label: "Pending" },
        Rejected: { bg: "#FEE2E2", color: "#ef4444", dot: "#ef4444", label: "Rejected" },
        Flagged: { bg: "#FFEDD5", color: "#f97316", dot: "#f97316", label: "Flagged" },
        "Auto-approved": { bg: "#DCFCE7", color: "#22c55e", dot: "#22c55e", label: "Auto" },
    };
    const s = map[status] || map.Pending;
    return (
        <span style={{
            background: s.bg, color: s.color, borderRadius: 20,
            padding: "2px 10px", fontSize: 11, fontWeight: 700,
            display: "inline-flex", alignItems: "center", gap: 5,
        }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
            {s.label}
        </span>
    );
}