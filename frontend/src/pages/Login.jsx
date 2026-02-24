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
                padding: "40px 20px",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 420,
                    padding: "40px",
                    background: "#FFFFFF",
                    border: `1px solid #E2E8F0`,
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    textAlign: "center"
                }}
            >

                {/* Back Button */}
                <button
                    onClick={() => navigate("/role-select")}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "#64748B",
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

                <h2 style={{ color: "#0F172A", fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
                    {config.title}
                </h2>

                <p style={{ color: "#64748B", fontSize: 14, marginBottom: 40 }}>
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
                        background: "#F8FAFC",
                        border: `1px solid #E2E8F0`,
                        padding: "16px",
                        borderRadius: 8,
                        color: "#0F172A",
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
                        background: "#F8FAFC",
                        border: `1px solid #E2E8F0`,
                        padding: "16px",
                        borderRadius: 8,
                        color: "#0F172A",
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
                        background: "#2563EB",
                        color: "#FFFFFF",
                        border: "none",
                        padding: "18px",
                        borderRadius: 8,
                        fontWeight: 900,
                        fontSize: 16,
                        cursor: "pointer",
                        boxShadow: `0 4px 12px rgba(37, 99, 235, 0.15)`,
                        transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = `0 6px 18px rgba(37, 99, 235, 0.25)`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = `0 4px 12px rgba(37, 99, 235, 0.15)`;
                    }}
                    onMouseDown={(e) => {
                        e.currentTarget.style.transform = "translateY(2px)";
                    }}
                    onMouseUp={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                >
                    Login to Portal
                </button>

                <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid #E2E8F0` }}>
                    <span style={{ color: "#64748B", fontSize: 13 }}>
                        Need access? Contact your administrator.
                    </span>
                </div>

            </div>
        </div>
    );
}
