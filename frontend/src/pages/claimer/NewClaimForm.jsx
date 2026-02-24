// import { useState, useEffect, useRef } from "react";
// import { C } from "../../constants/theme";
// import FileUploader from "../../components/FileUploader";
// import api from "../../services/api";
// import { useNavigate } from "react-router-dom";

// export default function NewClaimForm() {
//     const navigate = useNavigate();
//     const [type, setType] = useState("Motor");
//     const [formData, setFormData] = useState({});
//     const [documents, setDocuments] = useState({
//         policy: [],
//         id_proof: [],
//         bill: [],
//         summary: [],
//         other: []
//     });
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const commentRef = useRef(null);

//     // Keyboard shortcut handler
//     useEffect(() => {
//         const handleKeyDown = (e) => {
//             if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'm') {
//                 e.preventDefault();
//                 commentRef.current?.focus();
//             }
//         };
//         window.addEventListener('keydown', handleKeyDown);
//         return () => window.removeEventListener('keydown', handleKeyDown);
//     }, []);

//     const types = [
//         { id: "Motor", icon: "🚗" },
//         { id: "Health", icon: "🏥" },
//         { id: "Property", icon: "🏠" },
//     ];

//     const insuranceConfig = {
//         Motor: {
//             fields: ["Policy Number", "Vehicle Number", "Accident Date", "Garage Name", "Claim Amount (₹)"],
//             docs: [
//                 { id: "policy", name: "Policy Document", icon: "📄" },
//                 { id: "id_proof", name: "Driving License", icon: "🆔" },
//                 { id: "bill", name: "Repair Estimate", icon: "🛠️" },
//                 { id: "summary", name: "Accident Images", icon: "📸" },
//             ]
//         },
//         Health: {
//             fields: ["Policy Number", "Patient Name", "Hospital Name", "Admission Date", "Discharge Date", "Claim Amount (₹)"],
//             docs: [
//                 { id: "policy", name: "Policy Document", icon: "📄" },
//                 { id: "id_proof", name: "Patient ID Proof", icon: "🆔" },
//                 { id: "bill", name: "Hospital Bill", icon: "🏥" },
//                 { id: "summary", name: "Discharge Summary", icon: "📄" },
//             ]
//         },
//         Property: {
//             fields: ["Policy Number", "Property Address", "Damage Date", "Estimated Loss (₹)"],
//             docs: [
//                 { id: "policy", name: "Policy Document", icon: "📄" },
//                 { id: "id_proof", name: "Property Ownership Proof", icon: "🏠" },
//                 { id: "bill", name: "Damage Assessment", icon: "📊" },
//                 { id: "summary", name: "Photos of Damage", icon: "📸" },
//             ]
//         }
//     };

//     const handleFieldChange = (field, value) => {
//         setFormData(prev => ({ ...prev, [field]: value }));
//     };

//     const handleFilesChange = (docId, files) => {
//         setDocuments(prev => ({ ...prev, [docId]: files }));
//     };

//     const handleSubmit = async () => {
//         if (Object.values(documents).flat().length === 0) {
//             alert("Please upload at least one document.");
//             return;
//         }

//         setIsSubmitting(true);
//         try {
//             const userEmail = localStorage.getItem("userEmail") || "demo@example.com";
//             const data = new FormData();
//             data.append("claim_type", type);
//             data.append("claimer_email", userEmail);

//             // Map form data fields
//             Object.entries(formData).forEach(([key, value]) => {
//                 data.append(key, value);
//             });

//             // Append all files with their document types if possible
//             // The backend expects 'files' as a list of UploadFile
//             Object.values(documents).flat().forEach(file => {
//                 data.append("files", file);
//             });

//             const result = await api.submitClaim(data);
//             alert("Claim submitted successfully! ID: " + result.claim_id);
//             navigate(`/claim-details/${result.claim_id}`); // Show details immediately
//         } catch (error) {
//             console.error("Submission error:", error);
//             alert("Failed to submit claim: " + error.message);
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     const currentConfig = insuranceConfig[type];

//     return (
//         <div>
//             <div style={{ marginBottom: 40 }}>
//                 <p style={{ color: C.muted, fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginBottom: 16 }}>
//                     Step 1: SELECT INSURANCE TYPE
//                 </p>
//                 <div style={{ display: "flex", gap: 12 }}>
//                     {types.map(t => (
//                         <button
//                             key={t.id}
//                             onClick={() => {
//                                 setType(t.id);
//                                 setFormData({});
//                                 setDocuments({
//                                     policy: [],
//                                     id_proof: [],
//                                     bill: [],
//                                     summary: [],
//                                     other: []
//                                 });
//                             }}
//                             style={{
//                                 background: type === t.id ? C.blue + "22" : C.panel,
//                                 color: type === t.id ? C.blue : C.muted,
//                                 border: `1px solid ${type === t.id ? C.blue : C.border}`,
//                                 padding: "12px 24px",
//                                 borderRadius: 8,
//                                 cursor: "pointer",
//                                 fontWeight: 700,
//                                 display: "flex",
//                                 alignItems: "center",
//                                 gap: 8,
//                                 flex: 1,
//                                 transition: "all 0.2s ease"
//                             }}
//                         >
//                             <span>{t.icon}</span> {t.id}
//                         </button>
//                     ))}
//                 </div>
//             </div>

//             <div style={{ display: "flex", gap: 40 }}>
//                 <div style={{ flex: 1.5 }}>
//                     <h3 style={{ color: C.text, display: "flex", alignItems: "center", gap: 12, marginBottom: 24, fontSize: 18 }}>
//                         <span>{types.find(t => t.id === type).icon}</span> {type.toUpperCase()} INSURANCE CLAIM FORM
//                     </h3>
//                     <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//                         {currentConfig.fields.map(field => (
//                             <div key={field}>
//                                 <label style={{ display: "block", color: C.muted, fontSize: 11, fontWeight: 800, marginBottom: 8, textTransform: "uppercase" }}>{field}</label>
//                                 <input
//                                     type="text"
//                                     placeholder={field}
//                                     value={formData[field] || ""}
//                                     onChange={(e) => handleFieldChange(field, e.target.value)}
//                                     style={{
//                                         width: "100%",
//                                         background: C.panel,
//                                         border: `1px solid ${C.border}`,
//                                         padding: "12px",
//                                         borderRadius: 6,
//                                         color: C.text,
//                                         outline: "none",
//                                         boxSizing: "border-box"
//                                     }}
//                                 />
//                             </div>
//                         ))}

//                         <div>
//                             <label style={{ display: "block", color: C.muted, fontSize: 11, fontWeight: 800, marginBottom: 8, textTransform: "uppercase" }}>
//                                 Comments (Press Ctrl+Alt+M to focus)
//                             </label>
//                             <textarea
//                                 ref={commentRef}
//                                 placeholder="Add any additional details or notes here..."
//                                 value={formData.comments || ""}
//                                 onChange={(e) => handleFieldChange("comments", e.target.value)}
//                                 style={{
//                                     width: "100%",
//                                     background: C.panel,
//                                     border: `1px solid ${C.border}`,
//                                     padding: "12px",
//                                     borderRadius: 6,
//                                     color: C.text,
//                                     outline: "none",
//                                     boxSizing: "border-box",
//                                     minHeight: "100px",
//                                     resize: "vertical"
//                                 }}
//                             />
//                         </div>
//                     </div>
//                 </div>

//                 <div style={{ flex: 1 }}>
//                     <h3 style={{ color: C.text, display: "flex", alignItems: "center", gap: 12, marginBottom: 24, fontSize: 18 }}>
//                         <span>📎</span> Required Documents
//                     </h3>
//                     <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
//                         {currentConfig.docs.map((doc) => (
//                             <FileUploader
//                                 key={doc.id}
//                                 label={doc.name}
//                                 icon={doc.icon}
//                                 files={documents[doc.id]}
//                                 onFilesChange={(files) => handleFilesChange(doc.id, files)}
//                             />
//                         ))}
//                         <FileUploader
//                             label="Additional Documents"
//                             icon="📂"
//                             files={documents.other}
//                             onFilesChange={(files) => handleFilesChange("other", files)}
//                         />
//                     </div>
//                     <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//                         <button
//                             onClick={handleSubmit}
//                             disabled={isSubmitting}
//                             style={{
//                                 flex: 1,
//                                 background: C.blue,
//                                 color: "#fff",
//                                 border: "none",
//                                 padding: "16px",
//                                 borderRadius: 8,
//                                 fontWeight: 800,
//                                 cursor: isSubmitting ? "not-allowed" : "pointer",
//                                 opacity: isSubmitting ? 0.7 : 1,
//                                 boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
//                             }}
//                         >
//                             {isSubmitting ? "Processing Claim..." : "🚀 Submit Claim for AI Review"}
//                         </button>
//                         <button style={{
//                             flex: 1,
//                             background: C.panel,
//                             color: C.text,
//                             border: `1px solid ${C.border}`,
//                             padding: "16px",
//                             borderRadius: 8,
//                             fontWeight: 800,
//                             cursor: "pointer"
//                         }}>Save Draft</button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }





import { useState, useEffect, useRef } from "react";
import { C } from "../../constants/theme";
import FileUploader from "../../components/FileUploader";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function NewClaimForm() {
    const navigate = useNavigate();
    const [type, setType] = useState("Motor");
    const [formData, setFormData] = useState({});
    const [documents, setDocuments] = useState({
        policy: [],
        id_proof: [],
        bill: [],
        summary: [],
        other: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const commentRef = useRef(null);

    // Keyboard shortcut handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                commentRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const types = [
        { id: "Motor", icon: "🚗" },
        { id: "Health", icon: "🏥" },
        { id: "Property", icon: "🏠" },
    ];

    const insuranceConfig = {
        Motor: {
            fields: ["Policy Number", "Vehicle Number", "Accident Date", "Garage Name", "Claim Amount (₹)"],
            docs: [
                { id: "policy", name: "Policy Document", icon: "📄" },
                { id: "id_proof", name: "Driving License", icon: "🆔" },
                { id: "bill", name: "Repair Estimate", icon: "🛠️" },
                { id: "summary", name: "Accident Images", icon: "📸" },
            ]
        },
        Health: {
            fields: ["Policy Number", "Patient Name", "Hospital Name", "Admission Date", "Discharge Date", "Claim Amount (₹)"],
            docs: [
                { id: "policy", name: "Policy Document", icon: "📄" },
                { id: "id_proof", name: "Patient ID Proof", icon: "🆔" },
                { id: "bill", name: "Hospital Bill", icon: "🏥" },
                { id: "summary", name: "Discharge Summary", icon: "📄" },
            ]
        },
        Property: {
            fields: ["Policy Number", "Property Address", "Damage Date", "Estimated Loss (₹)"],
            docs: [
                { id: "policy", name: "Policy Document", icon: "📄" },
                { id: "id_proof", name: "Property Ownership Proof", icon: "🏠" },
                { id: "bill", name: "Damage Assessment", icon: "📊" },
                { id: "summary", name: "Photos of Damage", icon: "📸" },
            ]
        }
    };

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFilesChange = (docId, files) => {
        setDocuments(prev => ({ ...prev, [docId]: files }));
    };

    const handleSubmit = async () => {
        if (Object.values(documents).flat().length === 0) {
            alert("Please upload at least one document.");
            return;
        }

        setIsSubmitting(true);
        try {
            const userEmail = localStorage.getItem("userEmail") || "demo@example.com";
            const data = new FormData();
            data.append("claim_type", type);
            data.append("claimer_email", userEmail);

            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value);
            });

            Object.values(documents).flat().forEach(file => {
                data.append("files", file);
            });

            const result = await api.submitClaim(data);
            alert("Claim submitted successfully! ID: " + result.claim_id);
            navigate(`/claim-details/${result.claim_id}`);
        } catch (error) {
            console.error("Submission error:", error);
            alert("Failed to submit claim: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentConfig = insuranceConfig[type];

    return (
        <div>

            {/* STEP 1 TYPE SELECT */}
            <div style={{ marginBottom: 40 }}>
                <p style={{ color: C.muted, fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginBottom: 16 }}>
                    Step 1: SELECT INSURANCE TYPE
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                    {types.map(t => (
                        <button
                            key={t.id}
                            onClick={() => {
                                setType(t.id);
                                setFormData({});
                                setDocuments({ policy: [], id_proof: [], bill: [], summary: [], other: [] });
                            }}
                            style={{
                                background: type === t.id ? C.blue + "22" : C.panel,
                                color: type === t.id ? C.blue : C.muted,
                                border: `1px solid ${type === t.id ? C.blue : C.border}`,
                                padding: "12px 24px",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontWeight: 700,
                                flex: 1
                            }}
                        >
                            {t.icon} {t.id}
                        </button>
                    ))}
                </div>
            </div>

            {/* FORM + UPLOAD */}
            <div style={{ display: "flex", gap: 40 }}>

                {/* FORM */}
                <div style={{ flex: 1.5 }}>
                    <h3 style={{ color: C.text, marginBottom: 24 }}>
                        {types.find(t => t.id === type).icon} {type.toUpperCase()} INSURANCE CLAIM FORM
                    </h3>

                    {currentConfig.fields.map(field => (
                        <div key={field} style={{ marginBottom: 16 }}>
                            <label style={{ color: C.muted, fontSize: 11, fontWeight: 800 }}>{field}</label>
                            <input
                                type="text"
                                value={formData[field] || ""}
                                onChange={(e) => handleFieldChange(field, e.target.value)}
                                style={{ width: "100%", padding: 12, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text }}
                            />
                        </div>
                    ))}

                    <textarea
                        ref={commentRef}
                        placeholder="Additional comments..."
                        value={formData.comments || ""}
                        onChange={(e) => handleFieldChange("comments", e.target.value)}
                        style={{ width: "100%", minHeight: 100, padding: 12, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text }}
                    />
                </div>

                {/* DOCUMENTS */}
                <div style={{ flex: 1 }}>
                    {currentConfig.docs.map(doc => (
                        <FileUploader
                            key={doc.id}
                            label={doc.name}
                            icon={doc.icon}
                            files={documents[doc.id]}
                            onFilesChange={(files) => handleFilesChange(doc.id, files)}
                        />
                    ))}

                    <FileUploader
                        label="Additional Documents"
                        icon="📂"
                        files={documents.other}
                        onFilesChange={(files) => handleFilesChange("other", files)}
                    />

                    <button onClick={handleSubmit} disabled={isSubmitting} style={{ marginTop: 20, padding: 16, background: C.blue, color: "#fff", borderRadius: 8 }}>
                        {isSubmitting ? "Processing..." : "🚀 Submit Claim"}
                    </button>
                </div>
            </div>

            {/* ============================= */}
            {/* THIRD PARTY INTEGRATIONS */}
            {/* ============================= */}

            <div style={{ marginTop: 60 }}>
                <p style={{ color: C.muted, fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginBottom: 16 }}>
                    Step 3: External Verification & Integrations
                </p>

                <div style={{
                    background: C.panel,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: 20
                }}>
                    <p style={{ color: C.text, fontWeight: 700, marginBottom: 16 }}>
                        🔗 Claim data may be verified with:
                    </p>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 12
                    }}>
                        {[
                            { name: "Hospitals", icon: "🏥" },
                            { name: "Diagnostic Labs", icon: "🧪" },
                            { name: "Police Records", icon: "🚓" },
                            { name: "Insurance Partners", icon: "🛡" },
                            { name: "Payment Gateways", icon: "💳" },
                            { name: "Government Databases", icon: "🏛" },
                            { name: "Investigation Agencies", icon: "🕵" }
                        ].map(item => (
                            <div key={item.name} style={{
                                background: C.bg,
                                border: `1px solid ${C.border}`,
                                borderRadius: 8,
                                padding: "14px 16px",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                fontWeight: 600,
                                color: C.text
                            }}>
                                <span style={{ fontSize: 18 }}>{item.icon}</span>
                                {item.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}