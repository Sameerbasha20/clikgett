import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import classes from "../Dashboard/Dashboard.module.css";
import { Services } from "../../../Services";

const empty = { PlanID: null, PlanName: "", Price: "", DurationDays: 30, FreeDelivery: true, ExtraCashbackPercentage: 0, Status: 1 };
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

/**
 * Membership plans customers can buy in the app (paid online). A plan gives free
 * delivery and/or extra cashback on top of the store's normal cashback.
 */
function Membership() {
    const [plans, setPlans] = useState([]);
    const [members, setMembers] = useState([]);
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        const [p, m] = await Promise.all([Services.getMembershipPlans(), Services.getMembers()]);
        if (p && p.Status === 1) setPlans(p.Plans || []);
        if (m && m.Status === 1) setMembers(m.Members || []);
    };

    useEffect(() => {
        load();
    }, []);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await Services.saveMembershipPlan({
            ...form,
            Price: parseFloat(form.Price),
            DurationDays: parseInt(form.DurationDays, 10),
            ExtraCashbackPercentage: parseFloat(form.ExtraCashbackPercentage || 0),
        });
        setSaving(false);
        if (res && res.Status === 1) {
            toast.success(res.Message, { position: "top-center", autoClose: 1500 });
            setForm(null);
            load();
        } else {
            toast.error((res && res.Message) || "Could not save the plan", { position: "top-center" });
        }
    };

    const memberCount = (planId) => members.filter((m) => m.PlanID === planId).length;
    const field = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="membership" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={classes.page}>
                    <div className={classes.pageHead}>
                        <div>
                            <h2>Membership</h2>
                            <span className={classes.muted}>Customers buy these in the app (Profile → Membership). Buying again while active adds the days.</span>
                        </div>
                        <button type="button" className={classes.refresh} onClick={() => setForm({ ...empty })}>+ New plan</button>
                    </div>

                    {form && (
                        <form className={classes.card} onSubmit={save}>
                            <div className={classes.cardHead}><h3>{form.PlanID ? "Edit plan" : "New plan"}</h3></div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                                <label>Plan name
                                    <input className="form-control" value={form.PlanName} onChange={(e) => field("PlanName", e.target.value)} required />
                                </label>
                                <label>Price (₹)
                                    <input className="form-control" type="number" min="1" step="1" value={form.Price} onChange={(e) => field("Price", e.target.value)} required />
                                </label>
                                <label>Duration (days)
                                    <input className="form-control" type="number" min="1" value={form.DurationDays} onChange={(e) => field("DurationDays", e.target.value)} required />
                                </label>
                                <label>Extra cashback (%)
                                    <input className="form-control" type="number" min="0" max="50" step="0.5" value={form.ExtraCashbackPercentage} onChange={(e) => field("ExtraCashbackPercentage", e.target.value)} />
                                </label>
                            </div>
                            <div style={{ display: "flex", gap: 24, margin: "14px 0" }}>
                                <label><input type="checkbox" checked={!!form.FreeDelivery} onChange={(e) => field("FreeDelivery", e.target.checked)} /> Free delivery (long-distance fee still applies)</label>
                                <label><input type="checkbox" checked={form.Status === 1} onChange={(e) => field("Status", e.target.checked ? 1 : 0)} /> Available to buy</label>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button type="submit" className="btn btn-success" disabled={saving}>{saving ? "Saving…" : "Save plan"}</button>
                                <button type="button" className="btn btn-outline-secondary" onClick={() => setForm(null)}>Cancel</button>
                            </div>
                        </form>
                    )}

                    <div className={classes.card}>
                        <div className={classes.cardHead}><h3>Plans</h3></div>
                        {plans.length === 0 ? (
                            <span className={classes.muted}>No plans yet.</span>
                        ) : (
                            <table className={classes.table}>
                                <thead>
                                    <tr><th>Plan</th><th className={classes.num}>Price</th><th className={classes.num}>Days</th><th>Benefits</th><th className={classes.num}>Active members</th><th>Status</th><th className={classes.actions}>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {plans.map((p) => (
                                        <tr key={p.PlanID}>
                                            <td><b>{p.PlanName}</b></td>
                                            <td className={classes.num}>₹{Number(p.Price)}</td>
                                            <td className={classes.num}>{p.DurationDays}</td>
                                            <td>
                                                {[p.FreeDelivery ? "Free delivery" : null, Number(p.ExtraCashbackPercentage) > 0 ? `+${Number(p.ExtraCashbackPercentage)}% cashback` : null]
                                                    .filter(Boolean).join(" · ") || "—"}
                                            </td>
                                            <td className={classes.num}>{memberCount(p.PlanID)}</td>
                                            <td>{p.Status === 1 ? "On sale" : "Hidden"}</td>
                                            <td className={classes.actions}>
                                                <button type="button" className={classes.linkBtn} onClick={() => setForm({
                                                    PlanID: p.PlanID, PlanName: p.PlanName, Price: Number(p.Price), DurationDays: p.DurationDays,
                                                    FreeDelivery: p.FreeDelivery === 1, ExtraCashbackPercentage: Number(p.ExtraCashbackPercentage), Status: p.Status === 1 ? 1 : 0,
                                                })}>Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className={classes.card}>
                        <div className={classes.cardHead}><h3>Active members <span className={classes.count}>{members.length}</span></h3></div>
                        {members.length === 0 ? (
                            <span className={classes.muted}>Nobody has an active membership yet.</span>
                        ) : (
                            <table className={classes.table}>
                                <thead><tr><th>Customer</th><th>Mobile</th><th>Plan</th><th className={classes.num}>Paid</th><th>Since</th><th>Until</th></tr></thead>
                                <tbody>
                                    {members.map((m) => (
                                        <tr key={m.UserMembershipID}>
                                            <td>{m.CustomerName || `User ${m.UserID}`}</td>
                                            <td>{m.MobileNumber || "—"}</td>
                                            <td>{m.PlanName}</td>
                                            <td className={classes.num}>₹{Number(m.Price)}</td>
                                            <td>{fmtDate(m.StartDate)}</td>
                                            <td>{fmtDate(m.EndDate)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Membership;
