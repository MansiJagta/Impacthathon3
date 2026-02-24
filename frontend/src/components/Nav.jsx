import { C } from "../constants/theme";
import { useNavigate } from "react-router-dom";

export default function Nav() {

    const navigate = useNavigate();
    const role = localStorage.getItem("userRole");

    const handleLogout = () => {
        localStorage.removeItem("userRole");
        navigate("/");
    };

    return (
        <nav style={{
            background: "#FFFFFF",
            borderBottom: `1px solid #E2E8F0`,
            padding: "12px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 100
        }}>

            {/* Logo */}
            <div
                onClick={() => navigate("/")}
                style={{
                    color: "#0F172A",
                    fontWeight: 700,
                    fontSize: 18,
                    letterSpacing: 1,
                    cursor: "pointer"
                }}
            >
                IntelliClaim
            </div>

            {/* Right Side */}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                {role ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

                        {/* Role Badge */}
                        <div style={{
                            background: "#EFF6FF",
                            color: "#2563EB",
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                        }}>
                            👤 {role.charAt(0).toUpperCase() + role.slice(1)}
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            style={{
                                background: "transparent",
                                border: `1px solid #E2E8F0`,
                                color: "#0F172A",
                                padding: "4px 12px",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontSize: 12
                            }}
                        >
                            Logout
                        </button>

                    </div>
                ) : (
                    <div style={{ display: "flex", gap: 20 }}>

                        <button
                            onClick={() => navigate("/role-select")}
                            style={{
                                background: "transparent",
                                color: "#0F172A",
                                border: "none",
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: "pointer",
                                position: "relative",
                                transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.color = "#2563EB";
                                e.target.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.color = "#0F172A";
                                e.target.style.transform = "translateY(0)";
                            }}
                        >
                            Login
                        </button>

                        <button
                            onClick={() => navigate("/role-select")}
                            style={{
                                background: "#2563EB",
                                color: "#FFFFFF",
                                border: "none",
                                padding: "8px 18px",
                                borderRadius: 6,
                                fontSize: 16,
                                fontWeight: 800,
                                cursor: "pointer",
                                boxShadow: `0 4px 12px rgba(37, 99, 235, 0.15)`,
                                transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = "translateY(-2px)";
                                e.target.style.boxShadow = `0 6px 18px rgba(37, 99, 235, 0.25)`;
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = `0 4px 12px rgba(37, 99, 235, 0.15)`;
                            }}
                        >
                            Get Started
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
