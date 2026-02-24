import { C } from "../constants/theme";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const FeatureCard = ({ title, desc, icon }) => (
    <div
        style={{
            background: "#FFFFFF",
            border: `1px solid #E2E8F0`,
            borderRadius: 12,
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            transition: "all 0.3s ease",
            cursor: "default",
            backdropFilter: "blur(6px)",
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px)";
            e.currentTarget.style.borderColor = "#2563EB";
            e.currentTarget.style.boxShadow =
                "0 12px 30px rgba(37, 99, 235, 0.1)";
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "#E2E8F0";
            e.currentTarget.style.boxShadow = "none";
        }}
    >
        <div
            style={{
                fontSize: 40,
                background: "#EFF6FF",
                width: 80,
                height: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
            }}
        >
            {icon}
        </div>

        <h3 style={{ color: "#0F172A", fontSize: 24, fontWeight: 800 }}>
            {title}
        </h3>

        <p style={{ color: "#64748B", fontSize: 16, lineHeight: 1.6 }}>
            {desc}
        </p>
    </div>
);

export default function Home() {
    const navigate = useNavigate();
    const [showTitle, setShowTitle] = useState(false);

    useEffect(() => {
        setTimeout(() => setShowTitle(true), 200);
    }, []);

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
            }}
        >
            {/* HERO */}
            <section
                style={{
                    padding: "160px 24px 100px",
                    maxWidth: 1200,
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 32,
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        background: "#EFF6FF",
                        border: `1px solid #DBEAFE`,
                        padding: "8px 20px",
                        borderRadius: 30,
                        color: "#2563EB",
                        fontSize: 13,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                        alignSelf: "flex-start",
                    }}
                >
                    🛡️ AI-Powered Insurance Validation
                </div>

                <h1
                    style={{
                        color: "#0F172A",
                        fontSize: "clamp(48px, 8vw, 84px)",
                        fontWeight: 900,
                        lineHeight: 1,
                        letterSpacing: -2,
                        overflow: "hidden",
                    }}
                >
                    <span
                        style={{
                            display: "block",
                            transform: showTitle
                                ? "translateY(0)"
                                : "translateY(60px)",
                            opacity: showTitle ? 1 : 0,
                            transition: "all 0.8s ease",
                        }}
                    >
                        Process Claims in
                    </span>

                    <span
                        style={{
                            display: "block",
                            color: "#2563EB",
                            transform: showTitle
                                ? "translateY(0)"
                                : "translateY(80px)",
                            opacity: showTitle ? 1 : 0,
                            transition: "all 1s ease",
                            transitionDelay: "0.2s",
                        }}
                    >
                        Minutes, Not Months
                    </span>
                </h1>

                <p
                    style={{
                        color: "#475569",
                        fontSize: 22,
                        maxWidth: 650,
                        lineHeight: 1.6,
                    }}
                >
                    Intelligent automation with fraud detection, policy validation &
                    instant approvals for trusted insurance providers.
                </p>

                <div
                    style={{
                        display: "flex",
                        gap: 20,
                        marginTop: 20,
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        onClick={() => navigate("/role-select")}
                        style={{
                            background: "#2563EB",
                            color: "#FFFFFF",
                            border: "none",
                            padding: "20px 48px",
                            borderRadius: 8,
                            fontSize: 20,
                            fontWeight: 900,
                            cursor: "pointer",
                            boxShadow:
                                "0px 4px 12px rgba(37, 99, 235, 0.15)",
                            transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) =>
                        (e.currentTarget.style.transform =
                            "translateY(-2px)")
                        }
                        onMouseLeave={(e) =>
                        (e.currentTarget.style.transform =
                            "translateY(0)")
                        }
                    >
                        Get Started →
                    </button>

                    <button
                        style={{
                            background: "#EFF6FF",
                            color: "#2563EB",
                            border: "1px solid #DBEAFE",
                            padding: "20px 40px",
                            borderRadius: 8,
                            fontSize: 20,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#DBEAFE";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#EFF6FF";
                        }}
                    >
                        Watch Demo
                    </button>
                </div>
            </section>

            {/* FEATURES */}
            <section
                style={{
                    padding: "120px 24px",
                    borderTop: `1px solid #E2E8F0`,
                    borderBottom: `1px solid #E2E8F0`,
                }}
            >
                <div
                    style={{
                        maxWidth: 1200,
                        margin: "0 auto",
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: 32,
                    }}
                >
                    <FeatureCard
                        title="Claims Processing"
                        desc="Resolve most claims automatically in real time."
                        icon="🏥"
                    />
                    <FeatureCard
                        title="Fraud Detection"
                        desc="Identify anomalies and intercept fraud instantly."
                        icon="🔍"
                    />
                    <FeatureCard
                        title="Policy Validation"
                        desc="Verify coverage and limits instantly."
                        icon="🛡️"
                    />
                    <FeatureCard
                        title="Instant Approvals"
                        desc="Low-risk claims approved immediately."
                        icon="⚡"
                    />
                </div>
            </section>

            {/* INDUSTRIES */}
            <section style={{ padding: "100px 24px" }}>
                <div
                    style={{
                        maxWidth: 1200,
                        margin: "0 auto",
                        textAlign: "center",
                    }}
                >
                    <h2
                        style={{
                            color: "#0F172A",
                            fontSize: 40,
                            fontWeight: 900,
                            marginBottom: 60,
                        }}
                    >
                        Supported Industries
                    </h2>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 32,
                            flexWrap: "wrap",
                        }}
                    >
                        {["Health & Life", "Motor & Auto", "Home & Property"].map(
                            (industry) => (
                                <div
                                    key={industry}
                                    style={{
                                        padding: "40px 60px",
                                        background: "#FFFFFF",
                                        border: `1px solid #E2E8F0`,
                                        borderRadius: 12,
                                        fontWeight: 800,
                                        color: "#0F172A",
                                        backdropFilter: "blur(6px)",
                                    }}
                                >
                                    {industry}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}