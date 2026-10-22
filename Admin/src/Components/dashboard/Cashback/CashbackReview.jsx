import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import classes from "./CashbackReview.module.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { FaCheck, FaTimes } from "react-icons/fa";

const TABS = [
    { key: "pending", label: "Waiting for review" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
];

const QUICK_REASONS = ["Order was returned", "Customer complaint / refund given", "Suspected misuse", "Test order"];

const toastOpts = { position: "top-center", autoClose: 1800, hideProgressBar: true };

const rupees = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const when = (iso) =>
    iso
        ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })
        : "—";

const ORDER_STATUS = { 1: "Delivered", 3: "Cancelled", 4: "Cancelled", 6: "Returned" };

// Cashback that waits for an admin when Cashback Mode is "Manual" in Settings.
function CashbackReview() {
    const [tab, setTab] = useState("pending");
    const [items, setItems] = useState([]);
    const [counts, setCounts] = useState({ Pending: 0, Approved: 0, Rejected: 0, PendingAmount: 0 });
    const [mode, setMode] = useState("");
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [rejecting, setRejecting] = useState(null); // PendingID with the reason box open
    const [reason, setReason] = useState("");
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const load = (which = tab) => {
        setLoading(true);
        Services.getPendingCashback("GET", null, token, which)
            .then((res) => {
                if (res && res.Status === 1) {
                    setItems(res.data || []);
                    setCounts(res.Counts || counts);
                    setMode(res.CashbackMode || "");
                } else {
                    toast.error((res && res.Message) || "Could not load cashbacks", toastOpts);
                }
            })
            .catch(() => toast.error("Could not load cashbacks", toastOpts))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load(tab);
        setRejecting(null);
        // eslint-disable-next-line
    }, [tab]);

    const approve = (item) => {
        setBusyId(item.PendingID);
        Services.approveCashback("POST", JSON.stringify({ PendingID: item.PendingID }), token)
            .then((res) => {
                if (res && res.Status === 1) {
                    toast.success(res.Message, toastOpts);
                    load();
                } else {
                    toast.error((res && res.Message) || "Could not approve", toastOpts);
                    load();
                }
            })
            .catch(() => toast.error("Could not approve", toastOpts))
            .finally(() => setBusyId(null));
    };

    const reject = (item) => {
        if (reason.trim().length < 3) {
            toast.error("Please write a short reason", toastOpts);
            return;
        }
        setBusyId(item.PendingID);
        Services.rejectCashback("POST", JSON.stringify({ PendingID: item.PendingID, Reason: reason.trim() }), token)
            .then((res) => {
                if (res && res.Status === 1) {
                    toast.info(res.Message, toastOpts);
                    setRejecting(null);
                    setReason("");
                    load();
                } else {
                    toast.error((res && res.Message) || "Could not reject", toastOpts);
                }
            })
            .catch(() => toast.error("Could not reject", toastOpts))
            .finally(() => setBusyId(null));
    };

    const emptyText = {
        pending: mode === "manual" ? "Nothing to review. New cashbacks appear here when orders are delivered." : "Nothing to review.",
        approved: "No approved cashbacks yet.",
        rejected: "No rejected cashbacks.",
    }[tab];

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="cashback-review" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={classes.page}>
                    <div className={classes.header}>
                        <div>
                            <h1>Cashback review</h1>
                            <p>Approve or reject order cashback before it reaches the customer's wallet.</p>
                        </div>
                    </div>

                    {mode && mode !== "manual" && (
                        <div className={classes.notice}>
                            Cashback Mode is <strong>{mode}</strong>, so cashback {mode === "disabled" ? "is not given" : "is credited automatically"} and nothing
                            new will wait here. To review each cashback first, set Cashback Mode to <strong>Manual</strong> in{" "}
                            <Link to="/settings">Settings</Link>.
                        </div>
                    )}

                    <div className={classes.stats}>
                        <div className={classes.stat}>
                            <span>Waiting</span>
                            <strong>{counts.Pending}</strong>
                        </div>
                        <div className={classes.stat}>
                            <span>Waiting amount</span>
                            <strong>{rupees(counts.PendingAmount)}</strong>
                        </div>
                        <div className={classes.stat}>
                            <span>Approved</span>
                            <strong>{counts.Approved}</strong>
                        </div>
                        <div className={classes.stat}>
                            <span>Rejected</span>
                            <strong>{counts.Rejected}</strong>
                        </div>
                    </div>

                    <div className={classes.tabs} role="tablist">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                role="tab"
                                aria-selected={tab === t.key}
                                className={tab === t.key ? classes.tabActive : ""}
                                onClick={() => setTab(t.key)}>
                                {t.label}
                                {t.key === "pending" && counts.Pending > 0 && <span className={classes.badge}>{counts.Pending}</span>}
                            </button>
                        ))}
                    </div>

                    <div className={classes.card}>
                        {loading ? (
                            <p className={classes.empty}>Loading…</p>
                        ) : items.length === 0 ? (
                            <p className={classes.empty}>{emptyText}</p>
                        ) : (
                            <table className={classes.table}>
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Order</th>
                                        <th className={classes.num}>Order total</th>
                                        <th className={classes.num}>Cashback</th>
                                        <th>{tab === "pending" ? "Delivered" : "Reviewed"}</th>
                                        <th className={classes.actionsCol}>{tab === "pending" ? "" : tab === "rejected" ? "Reason" : "By"}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => {
                                        const orderGone = Number(item.OrderStatus) !== 1;
                                        return (
                                            <React.Fragment key={item.PendingID}>
                                                <tr>
                                                    <td>
                                                        <strong>{item.UserName || "Customer"}</strong>
                                                        <div className={classes.muted}>{item.Mobile}</div>
                                                    </td>
                                                    <td>
                                                        <Link to={`/orders/${item.OrderID}`}>#{item.OrderID}</Link>
                                                        {orderGone && (
                                                            <div className={classes.warn}>{ORDER_STATUS[item.OrderStatus] || "Not delivered"}</div>
                                                        )}
                                                    </td>
                                                    <td className={classes.num}>{rupees(item.OrderTotal)}</td>
                                                    <td className={`${classes.num} ${classes.amount}`}>{rupees(item.Amount)}</td>
                                                    <td>{when(tab === "pending" ? item.DeliveredAt || item.CreatedAt : item.ReviewedAt)}</td>
                                                    <td className={classes.actionsCol}>
                                                        {tab === "pending" ? (
                                                            <div className={classes.actions}>
                                                                <button
                                                                    type="button"
                                                                    className={classes.approve}
                                                                    disabled={busyId === item.PendingID || orderGone}
                                                                    title={orderGone ? "The order is no longer delivered" : "Credit the customer's wallet"}
                                                                    onClick={() => approve(item)}>
                                                                    <FaCheck /> Approve
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className={classes.reject}
                                                                    disabled={busyId === item.PendingID}
                                                                    onClick={() => {
                                                                        setRejecting(rejecting === item.PendingID ? null : item.PendingID);
                                                                        setReason(orderGone ? "Order was returned" : "");
                                                                    }}>
                                                                    <FaTimes /> Reject
                                                                </button>
                                                            </div>
                                                        ) : tab === "rejected" ? (
                                                            <span className={classes.muted}>{item.Reason || "—"}</span>
                                                        ) : (
                                                            <span className={classes.muted}>{item.ReviewedBy || "Admin"}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                                {rejecting === item.PendingID && (
                                                    <tr className={classes.rejectRow}>
                                                        <td colSpan={6}>
                                                            <div className={classes.rejectBox}>
                                                                <label htmlFor={`reason-${item.PendingID}`}>Why are you rejecting {rupees(item.Amount)} for order #{item.OrderID}?</label>
                                                                <div className={classes.chips}>
                                                                    {QUICK_REASONS.map((r) => (
                                                                        <button type="button" key={r} onClick={() => setReason(r)}>
                                                                            {r}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                <div className={classes.rejectInput}>
                                                                    <input
                                                                        id={`reason-${item.PendingID}`}
                                                                        value={reason}
                                                                        maxLength={255}
                                                                        placeholder="Reason (kept for your records)"
                                                                        onChange={(e) => setReason(e.target.value)}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        className={classes.rejectConfirm}
                                                                        disabled={busyId === item.PendingID}
                                                                        onClick={() => reject(item)}>
                                                                        Reject cashback
                                                                    </button>
                                                                    <button type="button" className={classes.cancel} onClick={() => setRejecting(null)}>
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CashbackReview;
