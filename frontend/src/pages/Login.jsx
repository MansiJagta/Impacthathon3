import { useState } from "react";
import { C } from "../constants/theme";
import { useParams, useNavigate } from "react-router-dom";

export default function Login() {

    const { role } = useParams();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");

    const roleMap = {
        claimer: {
            title: "Customer Login",
            desc: "Access your claims and policy details",
            icon: "🛡️",
            portalPath: "/portal/claimer",
        },
        reviewer: {
            title: "Reviewer Login",
            desc: "Access internal claims processing environment",
            icon: "🔍",
            portalPath: "/portal/reviewer",
        },
        admin: {
            title: "Admin Login",
            desc: "Secure system administration access",
            icon: "⚙️",
            portalPath: "/portal/admin",
        }
    };

    const config = roleMap[role];

    if (!config) {
        return <div style={{ padding: 40 }}>Invalid role.</div>;
    }

    const handleLogin = () => {
        if (!email || !pass) {
            alert("Please enter email and password.");
            return;
        }

        localStorage.setItem("userRole", role);
        localStorage.setItem("userEmail", email);

        navigate(config.portalPath);
    };

    const getButtonColor = () => {
        if (role === "admin") return "#a855f7";
        if (role === "reviewer") return "#a855f7";
        if (role === "claimer") return "#a855f7";
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px"
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 420,
                    padding: "40px",
                    background: C.panel,
                    border: `1px solid ${C.border}`,
                    borderRadius: 24,
                    boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                    textAlign: "center"
                }}
            >

                {/* Back Button */}
                <button
                    onClick={() => navigate("/role-select")}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: C.muted,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        marginBottom: 32
                    }}
                >
                    ← Back to Selection
                </button>

                <div style={{ fontSize: 64, marginBottom: 20 }}>
                    {config.icon}
                </div>

                <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
                    {config.title}
                </h2>

                <p style={{ color: C.muted, fontSize: 14, marginBottom: 40 }}>
                    {config.desc}
                </p>

                {/* Email Input */}
                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.05)",
                        border: `1px solid ${C.border}`,
                        padding: "16px",
                        borderRadius: 12,
                        color: "#fff",
                        fontSize: 14,
                        outline: "none",
                        marginBottom: 16
                    }}
                />

                {/* Password Input */}
                <input
                    type="password"
                    placeholder="Password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.05)",
                        border: `1px solid ${C.border}`,
                        padding: "16px",
                        borderRadius: 12,
                        color: "#fff",
                        fontSize: 14,
                        outline: "none",
                        marginBottom: 20
                    }}
                />

                {/* Animated Login Button */}
                <button
                    onClick={handleLogin}
                    style={{
                        width: "100%",
                        background: getButtonColor(),
                        color: "#000",
                        border: "none",
                        padding: "18px",
                        borderRadius: 12,
                        fontWeight: 900,
                        fontSize: 16,
                        cursor: "pointer",
                        boxShadow: `0 8px 20px ${getButtonColor()}44`,
                        transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-3px) scale(1.03)";
                        e.currentTarget.style.boxShadow = `0 12px 30px ${getButtonColor()}66`;
                        e.currentTarget.style.filter = "brightness(1.05)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow = `0 8px 20px ${getButtonColor()}44`;
                        e.currentTarget.style.filter = "brightness(1)";
                    }}
                    onMouseDown={(e) => {
                        e.currentTarget.style.transform = "translateY(1px) scale(0.98)";
                    }}
                    onMouseUp={(e) => {
                        e.currentTarget.style.transform = "translateY(-3px) scale(1.03)";
                    }}
                >
                    Login to Portal
                </button>

                <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
                    <span style={{ color: C.muted, fontSize: 13 }}>
                        Need access? Contact your administrator.
                    </span>
                </div>

            </div>
        </div>
    );
}