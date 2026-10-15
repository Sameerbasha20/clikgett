import React, { useState, useEffect } from "react";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import {
    FaGift,
    FaUsers,
    FaHistory,
    FaSave,
    FaCheckCircle,
    FaExclamationCircle,
    FaMoneyBillWave,
    FaShieldAlt
} from "react-icons/fa";

function ReferralSettingsTab() {
    const [subTab, setSubTab] = useState("config"); // 'config' | 'audit' | 'claims'
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Config state
    const [isEnabled, setIsEnabled] = useState(true);
    const [referrerReward, setReferrerReward] = useState("50.00");
    const [referredReward, setReferredReward] = useState("50.00");
    const [triggerEvent, setTriggerEvent] = useState("first_order");
    const [minOrderValue, setMinOrderValue] = useState("149.00");
    const [maxReferrals, setMaxReferrals] = useState("50");
    const [stats, setStats] = useState({});

    // Audit logs & Claims state
    const [auditLogs, setAuditLogs] = useState([]);
    const [claims, setClaims] = useState([]);

    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    const fetchConfig = () => {
        setLoading(true);
        Services.getReferralConfig("GET", null, token)
            .then((res) => {
                setLoading(false);
                if (res.Status === 1 && res.config) {
                    const c = res.config;
                    setIsEnabled(Boolean(c.IsEnabled));
                    setReferrerReward(String(c.ReferrerReward || "50.00"));
                    setReferredReward(String(c.ReferredReward || "50.00"));
                    setTriggerEvent(c.TriggerEvent || "first_order");
                    setMinOrderValue(String(c.MinOrderValue || "149.00"));
                    setMaxReferrals(String(c.MaxReferralsPerUser || "50"));
                    setStats(res.stats || {});
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Error fetching referral config:", err);
                toast.error("Failed to load referral program settings");
            });
    };

    const fetchAuditLogs = () => {
        Services.getReferralAuditHistory("GET", null, token)
            .then((res) => {
                if (res.Status === 1) {
                    setAuditLogs(res.logs || []);
                }
            })
            .catch((err) => console.error("Error fetching audit logs:", err));
    };

    const fetchClaims = () => {
        Services.getReferralClaims("GET", null, token)
            .then((res) => {
                if (res.Status === 1) {
                    setClaims(res.claims || []);
                }
            })
            .catch((err) => console.error("Error fetching claims:", err));
    };

    useEffect(() => {
        fetchConfig();
        fetchAuditLogs();
        fetchClaims();
    }, []);

    const handleSaveConfig = (e) => {
        e.preventDefault();
        const refAmt = parseFloat(referrerReward);
        const newAmt = parseFloat(referredReward);
        const minVal = parseFloat(minOrderValue);
        const maxRef = parseInt(maxReferrals, 10);

        if (isNaN(refAmt) || refAmt < 0) {
            toast.error("Referrer reward must be 0 or higher");
            return;
        }
        if (isNaN(newAmt) || newAmt < 0) {
            toast.error("Referred customer reward must be 0 or higher");
            return;
        }
        if (isNaN(minVal) || minVal < 0) {
            toast.error("Minimum order value must be 0 or higher");
            return;
        }
        if (isNaN(maxRef) || maxRef <= 0) {
            toast.error("Max referrals per user must be a positive number");
            return;
        }

        setSaving(true);
        const payload = {
            IsEnabled: isEnabled ? 1 : 0,
            ReferrerReward: refAmt,
            ReferredReward: newAmt,
            TriggerEvent: triggerEvent,
            MinOrderValue: minVal,
            MaxReferralsPerUser: maxRef,
        };

        Services.updateReferralConfig("PUT", payload, token)
            .then((res) => {
                setSaving(false);
                if (res.Status === 1) {
                    toast.success("Refer & Earn settings updated successfully!");
                    fetchConfig();
                    fetchAuditLogs();
                } else {
                    toast.error(res.Message || "Failed to update referral configuration");
                }
            })
            .catch((err) => {
                setSaving(false);
                console.error("Save error:", err);
                toast.error("Server error updating referral settings");
            });
    };

    if (loading) {
        return (
            <div className="card p-4 text-center">
                <p>Loading referral configuration...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "1000px" }}>
            {/* Top Stats Overview */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card p-3 shadow-sm border-0" style={{ background: "#f0fdf4", borderLeft: "4px solid #10b981" }}>
                        <span style={{ fontSize: "0.8rem", color: "#065f46", fontWeight: 600 }}>Total Referrals Registered</span>
                        <h4 style={{ margin: "4px 0 0 0", color: "#047857", fontWeight: 700 }}>{stats.totalReferrals || 0}</h4>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card p-3 shadow-sm border-0" style={{ background: "#eff6ff", borderLeft: "4px solid #3b82f6" }}>
                        <span style={{ fontSize: "0.8rem", color: "#1e40af", fontWeight: 600 }}>Successful Credited Claims</span>
                        <h4 style={{ margin: "4px 0 0 0", color: "#1d4ed8", fontWeight: 700 }}>{stats.successfulClaims || 0}</h4>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card p-3 shadow-sm border-0" style={{ background: "#fefce8", borderLeft: "4px solid #eab308" }}>
                        <span style={{ fontSize: "0.8rem", color: "#854d0e", fontWeight: 600 }}>Pending First-Order Claims</span>
                        <h4 style={{ margin: "4px 0 0 0", color: "#a16207", fontWeight: 700 }}>{stats.pendingClaims || 0}</h4>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card p-3 shadow-sm border-0" style={{ background: "#fdf2f8", borderLeft: "4px solid #ec4899" }}>
                        <span style={{ fontSize: "0.8rem", color: "#9d174d", fontWeight: 600 }}>Total Wallet Rewards Given</span>
                        <h4 style={{ margin: "4px 0 0 0", color: "#be185d", fontWeight: 700 }}>₹{parseFloat(stats.totalRewardsDistributed || 0).toFixed(2)}</h4>
                    </div>
                </div>
            </div>

            {/* Sub-tab Navigation */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.2rem" }}>
                <button
                    type="button"
                    className={`btn btn-sm ${subTab === "config" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setSubTab("config")}
                    style={subTab === "config" ? { backgroundColor: "#0e9f6e", borderColor: "#0e9f6e" } : {}}
                >
                    <FaGift className="mr-1" /> Reward Settings
                </button>
                <button
                    type="button"
                    className={`btn btn-sm ${subTab === "audit" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => { setSubTab("audit"); fetchAuditLogs(); }}
                    style={subTab === "audit" ? { backgroundColor: "#0e9f6e", borderColor: "#0e9f6e" } : {}}
                >
                    <FaHistory className="mr-1" /> Audit Change History ({auditLogs.length})
                </button>
                <button
                    type="button"
                    className={`btn btn-sm ${subTab === "claims" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => { setSubTab("claims"); fetchClaims(); }}
                    style={subTab === "claims" ? { backgroundColor: "#0e9f6e", borderColor: "#0e9f6e" } : {}}
                >
                    <FaUsers className="mr-1" /> Claims Ledger ({claims.length})
                </button>
            </div>

            {/* TAB 1: Reward Settings Form */}
            {subTab === "config" && (
                <form onSubmit={handleSaveConfig} className="card p-4 shadow-sm border-0">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: "12px", marginBottom: "20px" }}>
                        <div>
                            <h4 style={{ margin: 0, color: "#1e293b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <FaGift color="#0e9f6e" /> Refer & Earn Rewards Program
                            </h4>
                            <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                                Configure referral amounts, qualification triggers, and fraud prevention conditions.
                            </p>
                        </div>
                        <div className="custom-control custom-switch">
                            <input
                                type="checkbox"
                                className="custom-control-input"
                                id="referralEnabledSwitch"
                                checked={isEnabled}
                                onChange={(e) => setIsEnabled(e.target.checked)}
                            />
                            <label className="custom-control-label" htmlFor="referralEnabledSwitch" style={{ fontWeight: 600, color: isEnabled ? "#0e9f6e" : "#64748b" }}>
                                {isEnabled ? "Program Active" : "Program Disabled"}
                            </label>
                        </div>
                    </div>

                    <div className="row">
                        {/* Referrer Reward Amount */}
                        <div className="col-md-6 mb-3">
                            <div className="card p-3 h-100" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                <label style={{ fontWeight: 600, color: "#1e293b" }}>
                                    Referrer Reward Amount (₹)
                                </label>
                                <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "8px" }}>
                                    Amount credited to the existing customer who shared their referral code.
                                </p>
                                <div className="input-group">
                                    <div className="input-group-prepend"><span className="input-group-text">₹</span></div>
                                    <input
                                        type="number"
                                        step="1"
                                        className="form-control"
                                        value={referrerReward}
                                        onChange={(e) => setReferrerReward(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Referred User Reward Amount */}
                        <div className="col-md-6 mb-3">
                            <div className="card p-3 h-100" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                <label style={{ fontWeight: 600, color: "#1e293b" }}>
                                    Referred Customer Reward Amount (₹)
                                </label>
                                <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "8px" }}>
                                    Welcome bonus amount credited to the newly joined customer's wallet.
                                </p>
                                <div className="input-group">
                                    <div className="input-group-prepend"><span className="input-group-text">₹</span></div>
                                    <input
                                        type="number"
                                        step="1"
                                        className="form-control"
                                        value={referredReward}
                                        onChange={(e) => setReferredReward(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Reward Qualification Trigger */}
                        <div className="col-md-6 mb-3">
                            <div className="card p-3 h-100" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                <label style={{ fontWeight: 600, color: "#1e293b" }}>
                                    Reward Trigger Event
                                </label>
                                <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "8px" }}>
                                    When the wallet rewards should be officially credited.
                                </p>
                                <select
                                    className="form-control"
                                    value={triggerEvent}
                                    onChange={(e) => setTriggerEvent(e.target.value)}
                                >
                                    <option value="first_order">First Qualifying Order Completion (Recommended)</option>
                                    <option value="registration">Immediate on Account Registration</option>
                                </select>
                            </div>
                        </div>

                        {/* Minimum Order Value (if trigger is first order) */}
                        <div className="col-md-6 mb-3">
                            <div className="card p-3 h-100" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                <label style={{ fontWeight: 600, color: "#1e293b" }}>
                                    Minimum Order Value for Reward (₹)
                                </label>
                                <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "8px" }}>
                                    Order total must reach this value to trigger the referral reward.
                                </p>
                                <div className="input-group">
                                    <div className="input-group-prepend"><span className="input-group-text">₹</span></div>
                                    <input
                                        type="number"
                                        step="1"
                                        className="form-control"
                                        value={minOrderValue}
                                        onChange={(e) => setMinOrderValue(e.target.value)}
                                        disabled={triggerEvent === "registration"}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Fraud Prevention: Max Referrals Limit */}
                        <div className="col-md-12 mb-3">
                            <div className="card p-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#0e9f6e", fontWeight: 600, marginBottom: "4px" }}>
                                    <FaShieldAlt /> Financial & Anti-Fraud Safeguards
                                </div>
                                <div className="row align-items-center">
                                    <div className="col-md-8">
                                        <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                                            Prevents self-referrals, duplicate claims via unique database constraints, and limits maximum successful referral rewards per referrer.
                                        </p>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="input-group input-group-sm">
                                            <div className="input-group-prepend"><span className="input-group-text">Max Referrals:</span></div>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={maxReferrals}
                                                onChange={(e) => setMaxReferrals(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.8rem", marginTop: "1rem" }}>
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={fetchConfig}
                            disabled={saving}
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                            style={{ backgroundColor: "#0e9f6e", borderColor: "#0e9f6e", display: "flex", alignItems: "center", gap: "0.4rem" }}
                        >
                            <FaSave /> {saving ? "Saving..." : "Save Referral Settings"}
                        </button>
                    </div>
                </form>
            )}

            {/* TAB 2: Audit History */}
            {subTab === "audit" && (
                <div className="card p-4 shadow-sm border-0">
                    <h5 style={{ color: "#1e293b", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <FaHistory color="#3b82f6" /> Settings Audit Log
                    </h5>
                    {auditLogs.length === 0 ? (
                        <p style={{ color: "#64748b", fontStyle: "italic" }}>No configuration changes recorded yet.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-bordered table-hover" style={{ fontSize: "0.85rem" }}>
                                <thead className="thead-light">
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>Admin</th>
                                        <th>Action</th>
                                        <th>Configured Amounts</th>
                                        <th>Trigger Event</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map((log) => {
                                        let newCfg = {};
                                        try { newCfg = JSON.parse(log.NewConfig || "{}"); } catch (e) {}
                                        return (
                                            <tr key={log.AuditID}>
                                                <td>{new Date(log.CreatedAt).toLocaleString()}</td>
                                                <td><strong>{log.AdminName || `Admin #${log.AdminID}`}</strong> ({log.AdminEmail || 'Admin'})</td>
                                                <td><span className="badge badge-info">{log.Action}</span></td>
                                                <td>
                                                    Referrer: <strong>₹{newCfg.ReferrerReward || 0}</strong> &bull; Referred: <strong>₹{newCfg.ReferredReward || 0}</strong>
                                                </td>
                                                <td>{newCfg.TriggerEvent === "first_order" ? "First Order (₹" + (newCfg.MinOrderValue || 0) + " min)" : "Signup Registration"}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: Claims Ledger */}
            {subTab === "claims" && (
                <div className="card p-4 shadow-sm border-0">
                    <h5 style={{ color: "#1e293b", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <FaUsers color="#10b981" /> Referral Claims Ledger
                    </h5>
                    {claims.length === 0 ? (
                        <p style={{ color: "#64748b", fontStyle: "italic" }}>No referral claims recorded yet.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-bordered table-hover" style={{ fontSize: "0.85rem" }}>
                                <thead className="thead-light">
                                    <tr>
                                        <th>Claim ID</th>
                                        <th>Referrer Customer</th>
                                        <th>Referred Customer</th>
                                        <th>Referral Code</th>
                                        <th>Trigger</th>
                                        <th>Reward Status</th>
                                        <th>Credited Amounts</th>
                                        <th>Credited Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {claims.map((c) => (
                                        <tr key={c.ClaimID}>
                                            <td>#{c.ClaimID}</td>
                                            <td>
                                                <strong>{c.ReferrerFirstName} {c.ReferrerLastName}</strong>
                                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{c.ReferrerMobile} (ID #{c.ReferrerUserID})</div>
                                            </td>
                                            <td>
                                                <strong>{c.ReferredFirstName} {c.ReferredLastName}</strong>
                                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{c.ReferredMobile} (ID #{c.ReferredUserID})</div>
                                            </td>
                                            <td><code>{c.ReferralCode}</code></td>
                                            <td>{c.TriggerEvent === 'first_order' ? `Order #${c.OrderID || '-'}` : 'Registration'}</td>
                                            <td>
                                                <span className={`badge ${c.Status === 'credited' ? 'badge-success' : 'badge-warning'}`}>
                                                    {c.Status}
                                                </span>
                                            </td>
                                            <td>
                                                Referrer: <strong>₹{parseFloat(c.ReferrerRewardAmount || 0).toFixed(2)}</strong><br />
                                                Referred: <strong>₹{parseFloat(c.ReferredRewardAmount || 0).toFixed(2)}</strong>
                                            </td>
                                            <td>{c.CreditedAt ? new Date(c.CreditedAt).toLocaleDateString() : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ReferralSettingsTab;
