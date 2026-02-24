import React from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../constants/theme";

const RoleCard = ({ title, desc, icon, onClick }) => {
    return (
        <div
            onClick={onClick}
            style={{
                background: "#FFFFFF",
                backdropFilter: "blur(8px)",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: "36px 28px",
                flex: "1 1 280px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 18,
                textAlign: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow =
                    "0 12px 30px rgba(37, 99, 235, 0.15)";
                e.currentTarget.style.border =
                    "1px solid #2563EB";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                    "0 1px 3px rgba(0,0,0,0.08)";
                e.currentTarget.style.border =
                    "1px solid #E2E8F0";
            }}
        >
            <div style={{ fontSize: 48 }}>{icon}</div>

            <h3
                style={{
                    color: "#0F172A",
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: 0.5,
                }}
            >
                {title}
            </h3>

            <p
                style={{
                    color: "#64748B",
                    fontSize: 14,
                    lineHeight: 1.6,
                    maxWidth: 240,
                }}
            >
                {desc}
            </p>
        </div>
    );
};

export default function RoleSelect() {
    const navigate = useNavigate();

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundImage: `
      linear-gradient(to bottom right, rgba(248,250,252,0.75), rgba(255,255,255,0.75)),
      url("https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2070&auto=format&fit=crop")
    `,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
                backgroundRepeat: "no-repeat",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 24px",
            }}
        >
            <div style={{ maxWidth: 1000, width: "100%" }}>
                <div style={{ textAlign: "center", marginBottom: 56 }}>
                    <h2
                        style={{
                            color: "#0F172A",
                            fontSize: 48,          // bigger
                            fontWeight: 900,
                            marginBottom: 8,
                            letterSpacing: 0.5,
                            lineHeight: 1.1,
                        }}
                    >
                        Welcome Back
                    </h2>

                    <p
                        style={{
                            color: "#64748B",
                            fontSize: 16,
                        }}
                    >
                        Select your portal to continue
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: 28,
                        flexWrap: "wrap",
                        justifyContent: "center",
                    }}
                >
                    <RoleCard
                        title="Claimer"
                        desc="Submit new claims and track your payout status."
                        icon="🛡️"
                        onClick={() => navigate("/login/claimer")}
                    />

                    <RoleCard
                        title="Reviewer"
                        desc="Analyze claims with AI assistance and approve or flag documents."
                        icon="🔍"
                        onClick={() => navigate("/login/reviewer")}
                    />

                    <RoleCard
                        title="Administrator"
                        desc="Access global analytics and system configuration."
                        icon="⚙️"
                        onClick={() => navigate("/login/admin")}
                    />
                </div>
            </div>
        </div>
    );
}