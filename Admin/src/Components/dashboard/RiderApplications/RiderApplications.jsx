import React, { useEffect, useState } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import { apiUrl } from "../../../Services";
import { toast } from "react-toastify";
import { FaIdCard, FaCheck, FaTimes, FaPhoneAlt } from "react-icons/fa";

const authHeader = () => ({ Authorization: `token ${sessionStorage.getItem("token")}` });
const DOCS = [
    ["selfie", "Selfie"],
    ["aadhaar", "Aadhaar card"],
    ["licence", "Driving licence"],
];
const TABS = [
    ["pending", "Waiting for review"],
    ["approved", "Approved"],
    ["rejected", "Rejected"],
];
const VEHICLE = { bike: "🛵 Bike", auto: "🛺 Auto" };
const when = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");

/** One private document, fetched with the admin login (it is never a public URL). */
function DocImage({ id, doc, label, onOpen, deleted }) {
    const [src, setSrc] = useState(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        let url = null;
        let alive = true;
        if (deleted) return undefined;
        fetch(apiUrl(`admin/rider-applications/${id}/document/${doc}`), { headers: authHeader() })
            .then((r) => {
                if (!r.ok) throw new Error(String(r.status));
                return r.blob();
            })
            .then((b) => {
                url = URL.createObjectURL(b);
                if (alive) setSrc(url);
            })
            .catch(() => alive && setFailed(true));
        return () => {
            alive = false;
            if (url) URL.revokeObjectURL(url);
        };
    }, [id, doc, deleted]);
    return (
        <button type="button" onClick={() => src && onOpen(src, label)} style={styles.docTile} title={`Open ${label}`}>
            <div style={styles.docImgBox}>
                {src ? <img src={src} alt={label} style={styles.docImg} /> : <span style={{ color: "#94a3b8", fontSize: 12 }}>{deleted ? "Deleted" : failed ? "Could not load" : "Loading…"}</span>}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#334155", marginTop: 6 }}>{label}</div>
        </button>
    );
}

export default function RiderApplications() {
    const [tab, setTab] = useState("pending");
    const [rows, setRows] = useState([]);
    const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(null);
    const [viewer, setViewer] = useState(null);
    const [rejecting, setRejecting] = useState(null);
    const [reason, setReason] = useState("");
    const [reasonError, setReasonError] = useState("");

    const load = () => {
        setLoading(true);
        fetch(apiUrl(`admin/rider-applications?status=${tab}`), { headers: authHeader() })
            .then((r) => r.json())
            .then((j) => {
                if (j.Status !== 1) throw new Error(j.Message || "Could not load applications");
                setRows(j.Applications || []);
                setCounts(j.Counts || {});
            })
            .catch((e) => toast.error(e.message))
            .finally(() => setLoading(false));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(load, [tab]);

    const post = async (path, body) => {
        const r = await fetch(apiUrl(path), {
            method: "POST",
            headers: { ...authHeader(), "Content-Type": "application/json" },
            body: JSON.stringify(body || {}),
        });
        return r.json();
    };

    const approve = async (a) => {
        if (!window.confirm(`Approve ${a.FullName} (${a.MobileNumber}) as a delivery partner? They can log in to the rider app right away.`)) return;
        setBusy(a.ApplicationID);
        const j = await post(`admin/rider-applications/${a.ApplicationID}/approve`).catch(() => ({ Message: "Network error" }));
        setBusy(null);
        if (j.Status === 1) {
            toast.success(j.Message);
            load();
        } else toast.error(j.Message || "Could not approve");
    };

    const reject = async () => {
        const text = reason.trim();
        if (text.length < 3) return setReasonError("Please give a reason (at least 3 characters)");
        if (text.length > 255) return setReasonError("Keep the reason under 255 characters");
        setBusy(rejecting.ApplicationID);
        const j = await post(`admin/rider-applications/${rejecting.ApplicationID}/reject`, { Reason: text }).catch(() => ({ Message: "Network error" }));
        setBusy(null);
        if (j.Status === 1) {
            toast.success("Application rejected");
            setRejecting(null);
            load();
        } else setReasonError(j.Message || "Could not reject");
    };

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="riderApplications" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ display: "block", padding: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <FaIdCard size={24} color="#16a34a" />
                        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Rider applications</h1>
                    </div>
                    <p style={{ color: "#64748b", margin: "4px 0 18px" }}>
                        People who signed up in the rider app. Check the selfie matches the Aadhaar and licence photos, then approve to create their login.
                    </p>

                    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                        {TABS.map(([key, label]) => (
                            <button key={key} type="button" onClick={() => setTab(key)} style={tab === key ? styles.tabOn : styles.tab}>
                                {label} <span style={tab === key ? styles.countOn : styles.count}>{counts[key] || 0}</span>
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div style={styles.empty}>Loading…</div>
                    ) : rows.length === 0 ? (
                        <div style={styles.empty}>{tab === "pending" ? "No applications waiting. 🎉" : "Nothing here yet."}</div>
                    ) : (
                        <div style={{ display: "grid", gap: 14 }}>
                            {rows.map((a) => (
                                <div key={a.ApplicationID} style={styles.card}>
                                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
                                        <div style={{ minWidth: 220, flex: "1 1 220px" }}>
                                            <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>{a.FullName}</div>
                                            <a href={`tel:${a.MobileNumber}`} style={{ color: "#16a34a", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                                <FaPhoneAlt size={12} /> +91 {a.MobileNumber}
                                            </a>
                                            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                <span style={styles.pill}>{VEHICLE[a.VehicleType] || a.VehicleType}</span>
                                                <span style={{ ...styles.pill, background: "#f1f5f9", color: "#475569" }}>Applied {when(a.CreatedAt)}</span>
                                            </div>
                                            {a.Status !== "pending" && (
                                                <div style={{ marginTop: 8, fontSize: 13, color: a.Status === "approved" ? "#15803d" : "#b91c1c" }}>
                                                    {a.Status === "approved" ? "Approved" : `Rejected: ${a.RejectReason || ""}`}
                                                    {a.ReviewedByName ? ` by ${a.ReviewedByName}` : ""} · {when(a.ReviewedAt)}
                                                </div>
                                            )}
                                            {a.Status === "rejected" && (
                                                <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
                                                    🔒 {a.DocumentsDeletedAt
                                                        ? `Documents deleted on ${when(a.DocumentsDeletedAt)}`
                                                        : `Documents will be deleted automatically on ${when(a.DocumentsDeleteOn)}`}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                            {DOCS.map(([doc, label]) => (
                                                <DocImage key={doc} id={a.ApplicationID} doc={doc} label={label} deleted={!!a.DocumentsDeletedAt} onOpen={(src, l) => setViewer({ src, label: `${a.FullName} · ${l}` })} />
                                            ))}
                                        </div>
                                    </div>
                                    {a.Status === "pending" && (
                                        <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
                                            <button type="button" disabled={busy === a.ApplicationID} onClick={() => { setRejecting(a); setReason(""); setReasonError(""); }} style={styles.rejectBtn}>
                                                <FaTimes /> Reject
                                            </button>
                                            <button type="button" disabled={busy === a.ApplicationID} onClick={() => approve(a)} style={styles.approveBtn}>
                                                <FaCheck /> {busy === a.ApplicationID ? "Approving…" : "Approve & create login"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {viewer && (
                <div style={styles.overlay} onClick={() => setViewer(null)}>
                    <div style={{ color: "#fff", fontWeight: 600, marginBottom: 10 }}>{viewer.label} · click anywhere to close</div>
                    <img src={viewer.src} alt={viewer.label} style={{ maxWidth: "92vw", maxHeight: "82vh", borderRadius: 10 }} />
                </div>
            )}

            {rejecting && (
                <div style={styles.overlay}>
                    <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>Reject {rejecting.FullName}?</h3>
                        <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: 13 }}>The applicant sees this reason when they try to log in, and can apply again. Their Aadhaar, licence and selfie photos are deleted automatically 30 days after rejection.</p>
                        <textarea
                            value={reason}
                            onChange={(e) => { setReason(e.target.value); setReasonError(""); }}
                            rows={3}
                            maxLength={255}
                            placeholder="e.g. Licence photo is blurred, please upload a clear one"
                            style={{ width: "100%", borderRadius: 10, border: `1px solid ${reasonError ? "#dc2626" : "#cbd5e1"}`, padding: 10, fontSize: 14, boxSizing: "border-box" }}
                        />
                        {reasonError && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{reasonError}</div>}
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
                            <button type="button" onClick={() => setRejecting(null)} style={styles.cancelBtn}>Cancel</button>
                            <button type="button" disabled={busy === rejecting.ApplicationID} onClick={reject} style={styles.rejectSolid}>Reject application</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, boxShadow: "0 1px 3px rgba(15,23,42,0.05)" },
    empty: { background: "#fff", border: "1px dashed #cbd5e1", borderRadius: 14, padding: 40, textAlign: "center", color: "#64748b" },
    tab: { padding: "8px 14px", borderRadius: 999, border: "1px solid #e2e8f0", background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer" },
    tabOn: { padding: "8px 14px", borderRadius: 999, border: "1px solid #16a34a", background: "#dcfce7", color: "#14532d", fontWeight: 700, cursor: "pointer" },
    count: { marginLeft: 6, background: "#f1f5f9", borderRadius: 999, padding: "1px 8px", fontSize: 12 },
    countOn: { marginLeft: 6, background: "#16a34a", color: "#fff", borderRadius: 999, padding: "1px 8px", fontSize: 12 },
    pill: { background: "#dcfce7", color: "#14532d", borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 600 },
    docTile: { border: "1px solid #e2e8f0", borderRadius: 12, padding: 8, background: "#f8fafc", cursor: "zoom-in", width: 140 },
    docImgBox: { width: 122, height: 96, borderRadius: 8, overflow: "hidden", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" },
    docImg: { width: "100%", height: "100%", objectFit: "cover" },
    approveBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontWeight: 700, cursor: "pointer" },
    rejectBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, border: "1px solid #fecaca", background: "#fff", color: "#b91c1c", fontWeight: 700, cursor: "pointer" },
    rejectSolid: { padding: "10px 16px", borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, cursor: "pointer" },
    cancelBtn: { padding: "10px 16px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer" },
    overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.75)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 },
    dialog: { background: "#fff", borderRadius: 16, padding: 20, width: "min(460px, 100%)" },
};
