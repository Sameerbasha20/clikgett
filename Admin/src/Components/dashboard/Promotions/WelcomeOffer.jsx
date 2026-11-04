import React, { useEffect, useState } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { FaPlus, FaTrash, FaGift } from "react-icons/fa";

const MAX_STEPS = 10;
const rs = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const ordinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// Same look as the card in the app (deep green with gold), so admins see what customers see.
function Preview({ title, steps, min }) {
    return (
        <div style={{ background: "linear-gradient(135deg, #064E3B, #0F766E)", borderRadius: 18, padding: "16px 16px 12px", color: "#fff", maxWidth: 420 }}>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#FDE68A", marginBottom: 10 }}>{title || "Welcome offer for you!"}</div>
            <div style={{ background: "#ECFDF5", borderRadius: 12, padding: "12px 10px", display: "flex", alignItems: "flex-start", position: "relative" }}>
                <div style={{ position: "absolute", left: 40, right: 40, top: 46, height: 5, background: "#FCD34D", borderRadius: 4 }} />
                {steps.map((amt, i) => (
                    <div key={i} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                        <div style={{ fontSize: "0.72rem", color: "#065F46", marginBottom: 4 }}>{ordinal(i + 1)} order</div>
                        <div style={{
                            width: 34, height: 34, margin: "0 auto", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                            background: i === 0 ? "#047857" : "#FDE68A", color: i === 0 ? "#FDE68A" : "#92400E", fontWeight: 800, fontSize: "0.8rem",
                            border: "2px solid #F59E0B"
                        }}>%</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#065F46", marginTop: 4 }}>{rs(amt)} Off</div>
                    </div>
                ))}
            </div>
            <div style={{ textAlign: "center", fontSize: "0.85rem", marginTop: 8, fontWeight: 600 }}>Shop for {rs(min)} or more • T&amp;C</div>
        </div>
    );
}

function WelcomeOffer() {
    const token = sessionStorage.getItem("token");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const [title, setTitle] = useState("Welcome offer for you!");
    const [minOrder, setMinOrder] = useState("299");
    const [steps, setSteps] = useState(["50", "50", "50"]);
    const [stats, setStats] = useState({ Steps: [], TotalOrders: 0, TotalAmount: 0 });

    const load = () => {
        setLoading(true);
        Services.getWelcomeOffer("GET", null, token)
            .then((res) => {
                setLoading(false);
                if (res && res.Status === 1) {
                    setEnabled(!!res.Offer.Enabled);
                    setTitle(res.Offer.Title);
                    setMinOrder(String(res.Offer.MinOrderValue));
                    setSteps(res.Offer.Steps.length ? res.Offer.Steps.map(String) : ["50"]);
                    setStats(res.Stats || { Steps: [], TotalOrders: 0, TotalAmount: 0 });
                } else {
                    toast.error((res && res.Message) || "Could not load the welcome offer");
                }
            })
            .catch(() => {
                setLoading(false);
                toast.error("Could not load the welcome offer");
            });
    };
    useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

    const save = () => {
        setSaving(true);
        Services.saveWelcomeOffer("PUT", JSON.stringify({
            Enabled: enabled,
            Title: title,
            MinOrderValue: parseFloat(minOrder),
            Steps: steps.map((s) => parseFloat(s)),
        }), token)
            .then((res) => {
                setSaving(false);
                if (res && res.Status === 1) {
                    toast.success("Welcome offer saved");
                    load();
                } else {
                    toast.error((res && res.Message) || "Could not save");
                }
            })
            .catch(() => {
                setSaving(false);
                toast.error("Could not save");
            });
    };

    const setStep = (i, v) => setSteps((list) => list.map((s, j) => (j === i ? v : s)));
    const statFor = (n) => stats.Steps.find((s) => s.Step === n) || { Orders: 0, Amount: 0, Customers: 0 };
    const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 };

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="welcome-offer" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ padding: 20 }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><FaGift color="#047857" /> Welcome Offer</h3>
                    <p style={{ color: "#64748b", marginTop: -4 }}>
                        A rupee discount on each of a new customer's first orders. It applies by itself at checkout when the items total
                        reaches the minimum. Cancelled orders don't count, so the customer gets that step again.
                    </p>

                    {loading ? <p>Loading...</p> : (
                        <>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
                                <div style={card}>
                                    <div style={{ color: "#64748b", fontSize: "0.8rem" }}>Status</div>
                                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: enabled ? "#047857" : "#b91c1c" }}>{enabled ? "Live" : "Off"}</div>
                                </div>
                                <div style={card}>
                                    <div style={{ color: "#64748b", fontSize: "0.8rem" }}>Orders that used it</div>
                                    <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>{stats.TotalOrders}</div>
                                </div>
                                <div style={card}>
                                    <div style={{ color: "#64748b", fontSize: "0.8rem" }}>Total discount given</div>
                                    <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>{rs(stats.TotalAmount)}</div>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1.2fr) minmax(300px, 1fr)", gap: 16, alignItems: "start" }}>
                                <div style={card}>
                                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, marginBottom: 12, cursor: "pointer" }}>
                                        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} style={{ width: 18, height: 18 }} />
                                        Offer is live in the app
                                    </label>
                                    <div className="mb-3">
                                        <label style={{ fontWeight: 600, fontSize: "0.85rem" }}>Card title</label>
                                        <input className="form-control" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
                                    </div>
                                    <div className="mb-3">
                                        <label style={{ fontWeight: 600, fontSize: "0.85rem" }}>Minimum items total (₹)</label>
                                        <input className="form-control" type="number" min="0" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
                                    </div>

                                    <label style={{ fontWeight: 600, fontSize: "0.85rem" }}>Discount per order</label>
                                    <table className="table table-sm" style={{ marginBottom: 8 }}>
                                        <thead>
                                            <tr style={{ fontSize: "0.78rem", color: "#64748b" }}>
                                                <th>Order</th><th>Discount (₹)</th><th>Orders used</th><th>Amount given</th><th />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {steps.map((s, i) => {
                                                const st = statFor(i + 1);
                                                return (
                                                    <tr key={i}>
                                                        <td style={{ verticalAlign: "middle", fontWeight: 600 }}>{ordinal(i + 1)} order</td>
                                                        <td style={{ width: 120 }}>
                                                            <input className="form-control form-control-sm" type="number" min="1" value={s} onChange={(e) => setStep(i, e.target.value)} />
                                                        </td>
                                                        <td style={{ verticalAlign: "middle" }}>{st.Orders}</td>
                                                        <td style={{ verticalAlign: "middle" }}>{rs(st.Amount)}</td>
                                                        <td style={{ verticalAlign: "middle", textAlign: "right" }}>
                                                            {steps.length > 1 && (
                                                                <button type="button" className="btn btn-sm btn-outline-danger" title="Remove"
                                                                    onClick={() => setSteps((list) => list.filter((_, j) => j !== i))}>
                                                                    <FaTrash size={11} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {steps.length < MAX_STEPS && (
                                        <button type="button" className="btn btn-sm btn-outline-success mb-3"
                                            onClick={() => setSteps((list) => [...list, list[list.length - 1] || "50"])}>
                                            <FaPlus size={10} /> Add {ordinal(steps.length + 1)} order
                                        </button>
                                    )}
                                    <div>
                                        <button type="button" className="btn btn-primary" disabled={saving} onClick={save}>
                                            {saving ? "Saving..." : "Save"}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 8 }}>Preview (as shown in the app)</div>
                                    <Preview title={title} steps={steps.map((s) => parseFloat(s) || 0)} min={parseFloat(minOrder) || 0} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default WelcomeOffer;
