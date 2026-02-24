import { C } from "../constants/theme";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const FeatureCard = ({ title, desc, icon }) => (
    <div
        style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 24,
            padding: "40px",
            flex: 1,
            minWidth: 280,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            transition: "all 0.3s ease",
            cursor: "default",
            backdropFilter: "blur(6px)",
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px)";
            e.currentTarget.style.borderColor = C.accent;
            e.currentTarget.style.boxShadow = `0 12px 30px ${C.accent}22`;
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.boxShadow = "none";
        }}
    >
        <div
            style={{
                fontSize: 40,
                background: `${C.accent}11`,
                width: 80,
                height: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 20,
            }}
        >
            {icon}
        </div>

        <h3 style={{ color: C.text, fontSize: 24, fontWeight: 800 }}>
            {title}
        </h3>

        <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.6 }}>
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
                backgroundImage:
                    "linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.85)), url('https://images.unsplash.com/photo-1559526324-593bc073d938')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
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
                        background: `${C.accent}22`,
                        border: `1px solid ${C.accent}44`,
                        padding: "8px 20px",
                        borderRadius: 30,
                        color: C.accent,
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
                        color: "#fff",
                        fontSize: 84,
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
                            color: C.accent,
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
                        color: C.muted,
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
                    }}
                >
                    <button
                        onClick={() => navigate("/role-select")}
                        style={{
                            background: C.accent,
                            color: "#000",
                            border: "none",
                            padding: "20px 48px",
                            borderRadius: 14,
                            fontSize: 20,
                            fontWeight: 900,
                            cursor: "pointer",
                            boxShadow: `0 10px 30px ${C.accent}44`,
                            transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) =>
                        (e.currentTarget.style.transform =
                            "translateY(-4px) scale(1.04)")
                        }
                        onMouseLeave={(e) =>
                        (e.currentTarget.style.transform =
                            "translateY(0) scale(1)")
                        }
                    >
                        Get Started →
                    </button>

                    <button
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            color: "#fff",
                            border: `1px solid ${C.border}`,
                            padding: "20px 40px",
                            borderRadius: 12,
                            fontSize: 20,
                            fontWeight: 700,
                            cursor: "pointer",
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
                    borderTop: `1px solid ${C.border}`,
                    borderBottom: `1px solid ${C.border}`,
                }}
            >
                <div
                    style={{
                        maxWidth: 1200,
                        margin: "0 auto",
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
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
                <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
                    <h2
                        style={{
                            color: "#fff",
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
                            justifyContent: "space-between",
                            gap: 32,
                            flexWrap: "wrap",
                        }}
                    >
                        {["Health & Life", "Motor & Auto", "Home & Property"].map(
                            (industry) => (
                                <div
                                    key={industry}
                                    style={{
                                        flex: 1,
                                        padding: "40px 24px",
                                        background: C.panel,
                                        border: `1px solid ${C.border}`,
                                        borderRadius: 20,
                                        fontWeight: 800,
                                        color: "#fff",
                                        minWidth: 200,
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