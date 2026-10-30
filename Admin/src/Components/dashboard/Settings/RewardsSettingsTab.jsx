import React, { useState, useEffect } from "react";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { FaGift, FaBirthdayCake, FaSave, FaPlay } from "react-icons/fa";

// Comeback cash for customers who stopped ordering, and the birthday reward.
// Both go to the customer's wallet and expire; the server checks every hour.
function RewardsSettingsTab() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [running, setRunning] = useState(false);
    const [form, setForm] = useState({
        ComebackEnabled: false,
        ComebackInactiveDays: "7",
        ComebackAmount: "25",
        ComebackValidHours: "24",
        BirthdayEnabled: false,
        BirthdayAmount: "50",
        BirthdayValidDays: "7",
    });
    const [stats, setStats] = useState(null);
    const [birthdays, setBirthdays] = useState(0);

    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    const load = () => {
        setLoading(true);
        Services.getRewardSettings("GET", null, token)
            .then((res) => {
                setLoading(false);
                if (res.Status === 1 && res.Settings) {
                    const s = res.Settings;
                    setForm({
                        ComebackEnabled: Boolean(s.ComebackEnabled),
                        ComebackInactiveDays: String(s.ComebackInactiveDays),
                        ComebackAmount: String(Number(s.ComebackAmount)),
                        ComebackValidHours: String(s.ComebackValidHours),
                        BirthdayEnabled: Boolean(s.BirthdayEnabled),
                        BirthdayAmount: String(Number(s.BirthdayAmount)),
                        BirthdayValidDays: String(s.BirthdayValidDays),
                    });
                    setStats(res.Last30Days || null);
                    setBirthdays(res.CustomersWithBirthday || 0);
                } else {
                    toast.error(res.Message || "Failed to load reward settings");
                }
            })
            .catch(() => {
                setLoading(false);
                toast.error("Failed to load reward settings");
            });
    };

    useEffect(load, []);

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

    const save = (e) => {
        e.preventDefault();
        setSaving(true);
        Services.updateRewardSettings("PUT", {
            ...form,
            ComebackEnabled: form.ComebackEnabled ? 1 : 0,
            BirthdayEnabled: form.BirthdayEnabled ? 1 : 0,
        }, token)
            .then((res) => {
                setSaving(false);
                if (res.Status === 1) {
                    toast.success("Reward settings saved");
                    load();
                } else {
                    toast.error(res.Message || "Could not save reward settings");
                }
            })
            .catch(() => {
                setSaving(false);
                toast.error("Could not save reward settings");
            });
    };

    const runNow = () => {
        setRunning(true);
        Services.runRewards("POST", {}, token)
            .then((res) => {
                setRunning(false);
                if (res.Status === 1) {
                    toast.success(`Done: ${res.Comeback} comeback, ${res.Birthday} birthday rewards given; ${res.Expired} expired`);
                    load();
                } else {
                    toast.error(res.Message || "Could not run rewards");
                }
            })
            .catch(() => {
                setRunning(false);
                toast.error("Could not run rewards");
            });
    };

    if (loading) {
        return <div className="card p-4 text-center"><p>Loading reward settings...</p></div>;
    }

    const box = { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", marginBottom: "20px" };
    const input = { width: "140px", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "6px" };
    const label = { display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "4px" };
    const hint = { fontSize: "0.78rem", color: "#64748b", marginTop: "4px" };
    const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

    return (
        <form className="card p-4" onSubmit={save}>
            <h4 style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", marginBottom: "20px" }}>
                Customer Rewards
            </h4>

            <div style={box}>
                <h5 style={{ color: "#1e40af", marginBottom: "8px" }}><FaGift /> Comeback cash for inactive customers</h5>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <input type="checkbox" checked={form.ComebackEnabled} onChange={set("ComebackEnabled")} />
                    <span>On</span>
                </label>
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                    <div>
                        <label style={label}>No order for (days)</label>
                        <input type="number" min="1" max="365" style={input} value={form.ComebackInactiveDays} onChange={set("ComebackInactiveDays")} />
                    </div>
                    <div>
                        <label style={label}>Wallet cash (₹)</label>
                        <input type="number" min="0" max="1000" step="1" style={input} value={form.ComebackAmount} onChange={set("ComebackAmount")} />
                    </div>
                    <div>
                        <label style={label}>Expires after (hours)</label>
                        <input type="number" min="1" max="720" style={input} value={form.ComebackValidHours} onChange={set("ComebackValidHours")} />
                    </div>
                </div>
                <div style={hint}>
                    Customers who ordered before but not in {form.ComebackInactiveDays || "?"} days get {rupees(form.ComebackAmount)} in their wallet with a
                    notification. Unused cash is taken back after {form.ComebackValidHours || "?"} hours (24 = one day). They get it again only
                    after their next order and another quiet spell.
                </div>
            </div>

            <div style={box}>
                <h5 style={{ color: "#1e40af", marginBottom: "8px" }}><FaBirthdayCake /> Birthday reward</h5>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <input type="checkbox" checked={form.BirthdayEnabled} onChange={set("BirthdayEnabled")} />
                    <span>On</span>
                </label>
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                    <div>
                        <label style={label}>Wallet cash (₹)</label>
                        <input type="number" min="0" max="1000" step="1" style={input} value={form.BirthdayAmount} onChange={set("BirthdayAmount")} />
                    </div>
                    <div>
                        <label style={label}>Expires after (days)</label>
                        <input type="number" min="1" max="60" style={input} value={form.BirthdayValidDays} onChange={set("BirthdayValidDays")} />
                    </div>
                </div>
                <div style={hint}>
                    Given once a year on the customer's birthday (India date). Customers add their birthday in the app
                    (Profile → Edit profile) and cannot change it afterwards. {birthdays} customer{birthdays === 1 ? " has" : "s have"} added a birthday.
                </div>
            </div>

            {stats && (
                <div style={{ ...box, background: "#fff" }}>
                    <h5 style={{ color: "#1e40af", marginBottom: "8px" }}>Last 30 days</h5>
                    <div style={{ display: "flex", gap: "32px", flexWrap: "wrap", fontSize: "0.9rem" }}>
                        <div>Comeback: <b>{Number(stats.ComebackCount) || 0}</b> customers, <b>{rupees(stats.ComebackGiven)}</b></div>
                        <div>Birthday: <b>{Number(stats.BirthdayCount) || 0}</b> customers, <b>{rupees(stats.BirthdayGiven)}</b></div>
                        <div>Expired unused: <b>{rupees(stats.Expired)}</b></div>
                    </div>
                </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-outline-primary" onClick={runNow} disabled={running}>
                    <FaPlay /> {running ? "Running..." : "Run now"}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                    <FaSave /> {saving ? "Saving..." : "Save"}
                </button>
            </div>
        </form>
    );
}

export default RewardsSettingsTab;
