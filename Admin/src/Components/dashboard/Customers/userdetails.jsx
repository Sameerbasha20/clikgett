import React, { useEffect, useMemo, useState } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import {
    FaArrowLeft, FaBirthdayCake, FaPhoneAlt, FaEnvelope, FaWallet, FaMapMarkerAlt, FaShoppingBag,
    FaShoppingCart, FaComments, FaGift, FaHistory,
} from "react-icons/fa";

/* ---------- helpers ---------- */
const rs = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const dt = (v, withTime = true) => {
    if (!v) return "—";
    const d = new Date(v);
    if (isNaN(d)) return "—";
    return d.toLocaleString("en-IN", withTime
        ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
        : { day: "2-digit", month: "short", year: "numeric" });
};
const fullName = (p) => `${p.FirstName || ""} ${p.LastName && p.LastName !== "NA" ? p.LastName : ""}`.trim() || "Customer";
const initials = (p) => fullName(p).split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

function birthdayInfo(dob) {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d)) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    if (next < today) next = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate());
    const days = Math.round((next - today) / 86400000);
    const age = now.getFullYear() - d.getFullYear() - (next.getFullYear() === now.getFullYear() && days > 0 ? 1 : 0);
    return {
        label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
        when: days === 0 ? "Birthday today" : `in ${days} day${days === 1 ? "" : "s"}`,
        age: age > 0 && age < 120 ? age : null,
    };
}

const STATUS_STYLE = {
    1: ["#dcfce7", "#166534"], 3: ["#fee2e2", "#991b1b"], 4: ["#fee2e2", "#991b1b"], 6: ["#fef3c7", "#92400e"],
};
const StatusPill = ({ status, label }) => {
    const [bg, fg] = STATUS_STYLE[status] || ["#e0f2fe", "#075985"];
    return <span style={{ background: bg, color: fg, padding: "2px 10px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>;
};
const Pill = ({ children, tone = "slate" }) => {
    const tones = { slate: ["#f1f5f9", "#334155"], green: ["#dcfce7", "#166534"], red: ["#fee2e2", "#991b1b"], amber: ["#fef3c7", "#92400e"], blue: ["#e0f2fe", "#075985"] };
    const [bg, fg] = tones[tone] || tones.slate;
    return <span style={{ background: bg, color: fg, padding: "2px 10px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap" }}>{children}</span>;
};

const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, marginBottom: 16 };
const th = { fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", padding: "10px 12px", borderBottom: "1px solid #e2e8f0", textAlign: "left", whiteSpace: "nowrap" };
const td = { padding: "10px 12px", borderBottom: "1px solid #f1f5f9", fontSize: "0.88rem", verticalAlign: "top" };

function Table({ columns, rows, empty, onRowClick }) {
    if (!rows || !rows.length) return <p style={{ color: "#94a3b8", margin: "8px 0" }}>{empty}</p>;
    return (
        <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead><tr>{columns.map((c) => <th key={c.label} style={th}>{c.label}</th>)}</tr></thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} onClick={onRowClick ? () => onRowClick(r) : undefined}
                            style={{ cursor: onRowClick ? "pointer" : "default" }}
                            onMouseEnter={(e) => onRowClick && (e.currentTarget.style.background = "#f8fafc")}
                            onMouseLeave={(e) => onRowClick && (e.currentTarget.style.background = "")}>
                            {columns.map((c) => <td key={c.label} style={td}>{c.render(r)}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const Stat = ({ label, value, sub, color = "#0f172a" }) => (
    <div style={{ ...card, marginBottom: 0, padding: 14 }}>
        <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
        <div style={{ fontSize: "1.35rem", fontWeight: 800, color, marginTop: 2 }}>{value}</div>
        {sub && <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{sub}</div>}
    </div>
);

const Field = ({ label, children }) => (
    <div style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px dashed #eef2f7" }}>
        <div style={{ width: 150, flexShrink: 0, color: "#64748b", fontSize: "0.85rem" }}>{label}</div>
        <div style={{ fontSize: "0.9rem", color: "#0f172a", wordBreak: "break-word" }}>{children}</div>
    </div>
);

/** Everything about one customer: profile, addresses, orders, carts, wallet, requests, activity. */
function UserDetails() {
    const { id } = useParams();
    const Navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("overview");
    const [orderFilter, setOrderFilter] = useState("all");
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    useEffect(() => {
        setLoading(true);
        Services.getFullCustomerDetails("GET", null, token, id)
            .then((res) => {
                setLoading(false);
                if (res && res.Status === 1) setData(res);
                else toast.error((res && res.Message) || "Could not load the customer");
            })
            .catch(() => { setLoading(false); toast.error("Could not load the customer"); });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const orders = useMemo(() => (data && data.Orders) || [], [data]);
    const shownOrders = useMemo(() => orders.filter((o) => {
        if (orderFilter === "active") return ![1, 3, 4, 6].includes(o.OrderStatus);
        if (orderFilter === "delivered") return o.OrderStatus === 1;
        if (orderFilter === "cancelled") return [3, 4].includes(o.OrderStatus);
        if (orderFilter === "returned") return o.OrderStatus === 6;
        return true;
    }), [orders, orderFilter]);

    if (loading || !data) {
        return (
            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}><SideNav isactive="customers" /></div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />
                    <div style={{ padding: 30, color: "#64748b" }}>{loading ? "Loading customer..." : "Customer not found."}</div>
                </div>
            </div>
        );
    }

    const p = data.Profile || {};
    const s = data.OrderStats || {};
    const bday = birthdayInfo(p.DateOfBirth);
    const requestsCount = (data.PhotoOrders || []).length + (data.Enquiries || []).length + (data.ProductRequests || []).length + (data.Feedback || []).length;
    const tabs = [
        ["overview", "Overview", FaMapMarkerAlt, null],
        ["orders", "Orders", FaShoppingBag, s.Total],
        ["carts", "Cart & abandoned", FaShoppingCart, (data.CurrentCart || []).length + (data.AbandonedCarts || []).length],
        ["wallet", "ClikGett Cash", FaWallet, (data.WalletLedger || []).length],
        ["requests", "Requests & feedback", FaComments, requestsCount],
        ["rewards", "Rewards & referrals", FaGift, (data.Rewards || []).length + ((data.Referrals && data.Referrals.ReferredUsers) || []).length],
        ["activity", "Activity", FaHistory, (data.RecentSearches || []).length],
    ];
    const orderColumns = [
        { label: "Order", render: (o) => <b>#{o.OrderSequence}</b> },
        { label: "Placed", render: (o) => dt(o.CreatedAt) },
        { label: "Status", render: (o) => <StatusPill status={o.OrderStatus} label={o.StatusLabel} /> },
        { label: "Items", render: (o) => o.ItemCount },
        { label: "Total", render: (o) => <><b>{rs(Number(o.GrandTotal || 0) + Number(o.WalletAmount || 0))}</b>{Number(o.WalletAmount) > 0 && <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{rs(o.WalletAmount)} from ClikGett Cash</div>}</> },
        { label: "Payment", render: (o) => o.PaymentMethod || "—" },
        { label: "Delivery", render: (o) => o.ScheduleStatus === "Scheduled" ? <Pill tone="blue">Scheduled {dt(o.ScheduledDateTime, false)}</Pill> : (o.OrderStatus === 1 ? dt(o.deliveredDateTime || o.Delivered_Cancelled_datetime) : "—") },
        { label: "Note", render: (o) => [3, 4].includes(o.OrderStatus) ? (o.CancellationReason || "—") : (o.ReceiverName ? `For ${o.ReceiverName}` : "") },
    ];

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}><SideNav isactive="customers" /></div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div style={{ padding: 20, background: "#f8fafc", minHeight: "100%" }}>
                    <button type="button" className="btn btn-sm btn-light mb-3" onClick={() => Navigate("/customers")}>
                        <FaArrowLeft size={11} /> Customers
                    </button>

                    {/* Header */}
                    <div style={{ ...card, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#0f766e)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 800 }}>
                            {initials(p)}
                        </div>
                        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                <h3 style={{ margin: 0 }}>{fullName(p)}</h3>
                                <Pill tone={p.Status === 1 ? "green" : "red"}>{p.Status === 1 ? "Active" : "Inactive"}</Pill>
                                {p.PlanName && <Pill tone="amber">{p.PlanName} member</Pill>}
                                {data.DeviceInfo && data.DeviceInfo.AppInstalled && <Pill tone="blue">App installed</Pill>}
                            </div>
                            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 6, color: "#334155", fontSize: "0.9rem" }}>
                                <span><FaPhoneAlt size={11} /> <a href={`tel:${p.MobileNumber}`}>{p.MobileNumber || "—"}</a></span>
                                <span><FaEnvelope size={11} /> {p.EmailID && p.EmailID !== "NA" ? p.EmailID : "No email"}</span>
                                <span><FaBirthdayCake size={11} /> {bday ? `${bday.label} (${bday.when}${bday.age ? `, turns ${bday.age + (bday.when === "Birthday today" ? 0 : 1)}` : ""})` : "Birthday not given"}</span>
                            </div>
                            <div style={{ color: "#64748b", fontSize: "0.8rem", marginTop: 4 }}>
                                Customer #{p.UserID} · joined {dt(p.CreatedAt, false)} · last order {dt(s.LastOrderAt, false)}
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>ClikGett Cash</div>
                            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#15803d" }}>{rs(data.WalletBalance)}</div>
                            <button type="button" className="btn btn-sm btn-success mt-1" onClick={() => Navigate(`/customers/transactions/${p.UserID}`)}>
                                Add transaction
                            </button>
                        </div>
                    </div>

                    {/* Summary */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
                        <Stat label="Orders" value={s.Total || 0} sub={s.FirstOrderAt ? `since ${dt(s.FirstOrderAt, false)}` : "no orders yet"} />
                        <Stat label="Delivered" value={s.Completed || 0} color="#15803d" />
                        <Stat label="Cancelled" value={s.Cancelled || 0} color="#b91c1c" sub={`${s.CancelledByCustomer || 0} by customer · ${s.CancelledByStore || 0} by store`} />
                        <Stat label="Active now" value={s.Pending || 0} color="#0369a1" sub={s.Scheduled ? `${s.Scheduled} scheduled` : null} />
                        <Stat label="Total spent" value={rs(s.TotalSpend)} sub="delivered orders" />
                        <Stat label="Average order" value={rs(s.AverageOrderValue)} />
                        <Stat label="Abandoned carts" value={(data.AbandonedCarts || []).length} color="#92400e" />
                    </div>

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                        {tabs.map(([key, label, Icon, count]) => (
                            <button key={key} type="button" onClick={() => setTab(key)}
                                className={`btn btn-sm ${tab === key ? "btn-primary" : "btn-outline-secondary"}`}
                                style={{ borderRadius: 999, display: "flex", alignItems: "center", gap: 6 }}>
                                <Icon size={12} /> {label}{count != null ? <span style={{ opacity: 0.75 }}>({count})</span> : null}
                            </button>
                        ))}
                    </div>

                    {tab === "overview" && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
                            <div style={card}>
                                <h5>Profile</h5>
                                <Field label="Name">{fullName(p)}</Field>
                                <Field label="Mobile">{p.MobileNumber || "—"}</Field>
                                <Field label="Email">{p.EmailID && p.EmailID !== "NA" ? p.EmailID : "—"}</Field>
                                <Field label="Birthday">{bday ? `${bday.label} · ${bday.when}` : "Not given"}</Field>
                                <Field label="Joined">{dt(p.CreatedAt)}</Field>
                                <Field label="Profile completed">{p.SignupCompleted === 1 ? "Yes" : "No"}</Field>
                                <Field label="Membership">{p.PlanName ? `${p.PlanName} (until ${dt(p.MembershipEnd, false)})` : "None"}</Field>
                                <Field label="Notifications">
                                    Order updates {p.NotifyOrderUpdates === 0 ? "off" : "on"} · offers {p.NotifyOffers === 0 ? "off" : "on"}
                                </Field>
                                <Field label="Referral code">{p.MyReferralCode || "—"}</Field>
                            </div>
                            <div style={card}>
                                <h5>Saved addresses ({(data.Addresses || []).length})</h5>
                                {(data.Addresses || []).length === 0 && <p style={{ color: "#94a3b8" }}>No saved addresses.</p>}
                                {(data.Addresses || []).map((a) => (
                                    <div key={a.AddressID} style={{ padding: "10px 0", borderBottom: "1px dashed #eef2f7" }}>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <Pill tone="blue">{a.Type || "Address"}</Pill>
                                            {a.Latitude && a.Longitude && (
                                                <a href={`https://www.google.com/maps?q=${a.Latitude},${a.Longitude}`} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem" }}>Map</a>
                                            )}
                                        </div>
                                        <div style={{ marginTop: 4, fontSize: "0.9rem" }}>
                                            {[a.FlatNo, a.Address, a.Landmark && a.Landmark !== "NA" ? `Near ${a.Landmark}` : null, a.City].filter(Boolean).join(", ")}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tab === "orders" && (
                        <div style={card}>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                                {[["all", `All (${s.Total || 0})`], ["active", `Active (${s.Pending || 0})`], ["delivered", `Delivered (${s.Completed || 0})`],
                                    ["cancelled", `Cancelled (${s.Cancelled || 0})`], ["returned", `Returned (${s.Returned || 0})`]].map(([k, l]) => (
                                    <button key={k} type="button" onClick={() => setOrderFilter(k)}
                                        className={`btn btn-sm ${orderFilter === k ? "btn-dark" : "btn-outline-secondary"}`} style={{ borderRadius: 999 }}>{l}</button>
                                ))}
                            </div>
                            <Table columns={orderColumns} rows={shownOrders} empty="No orders in this list." onRowClick={(o) => Navigate(`/orders/${o.OrderID}`)} />
                        </div>
                    )}

                    {tab === "carts" && (
                        <>
                            <div style={card}>
                                <h5>In the cart now</h5>
                                <Table rows={data.CurrentCart} empty="Cart is empty." columns={[
                                    { label: "Product", render: (c) => c.ProductName || `#${c.ProductID}` },
                                    { label: "Pack", render: (c) => `${c.metricvalue || ""} ${c.metrictype || ""}`.trim() || "—" },
                                    { label: "Qty", render: (c) => c.Quantity },
                                    { label: "Price", render: (c) => rs(c.OfferPrice) },
                                    { label: "Added", render: (c) => dt(c.UpdatedAt) },
                                ]} />
                            </div>
                            <div style={card}>
                                <h5>Abandoned carts</h5>
                                <Table rows={data.AbandonedCarts} empty="No abandoned carts." columns={[
                                    { label: "Left on", render: (a) => dt(a.CreatedAt) },
                                    { label: "Items", render: (a) => a.Items && a.Items.length ? a.Items.map((i) => `${i.ProductName} × ${i.Quantity}`).join(", ") : `${a.ItemCount || 0} items` },
                                    { label: "Value", render: (a) => rs(a.TotalAmount) },
                                    { label: "Reminders", render: (a) => a.ReminderCount ? `${a.ReminderCount} (last ${dt(a.ReminderSentAt, false)})` : "None sent" },
                                    { label: "Status", render: (a) => a.RecoveredAt ? <Pill tone="green">Recovered {dt(a.RecoveredAt, false)}</Pill> : <Pill tone="amber">{a.Status || "Open"}</Pill> },
                                ]} />
                            </div>
                        </>
                    )}

                    {tab === "wallet" && (
                        <div style={card}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <h5 style={{ margin: 0 }}>ClikGett Cash · balance {rs(data.WalletBalance)}</h5>
                                <button type="button" className="btn btn-sm btn-success" onClick={() => Navigate(`/customers/transactions/${p.UserID}`)}>Add transaction</button>
                            </div>
                            <Table rows={data.WalletLedger} empty="No transactions." columns={[
                                { label: "Date", render: (w) => dt(w.CreatedAt) },
                                { label: "Type", render: (w) => <Pill tone={w.Type === "Credit" ? "green" : "red"}>{w.Type}</Pill> },
                                { label: "Amount", render: (w) => <b style={{ color: w.Type === "Credit" ? "#15803d" : "#b91c1c" }}>{w.Type === "Credit" ? "+" : "−"}{rs(w.Amount)}</b> },
                                { label: "For", render: (w) => w.Description || (w.ContentID ? `Order #${String(w.ContentID).padStart(4, "0")}` : "—") },
                                { label: "Balance after", render: (w) => rs(w.RunningBalance) },
                                { label: "Expires", render: (w) => (w.ExpiryDate ? dt(w.ExpiryDate, false) : "—") },
                            ]} />
                        </div>
                    )}

                    {tab === "requests" && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 16 }}>
                            <div style={card}>
                                <h5>Photo orders</h5>
                                <Table rows={data.PhotoOrders} empty="No photo orders." onRowClick={(r) => Navigate(`/photo-orders/${r.RequestID}`)} columns={[
                                    { label: "Request", render: (r) => r.RequestCode || `#${r.RequestID}` },
                                    { label: "Sent", render: (r) => dt(r.CreatedAt) },
                                    { label: "Status", render: (r) => <Pill>{r.RequestStatus}</Pill> },
                                    { label: "Total", render: (r) => (r.GrandTotal ? rs(r.GrandTotal) : "—") },
                                    { label: "Order", render: (r) => (r.CreatedOrderID ? `#${String(r.CreatedOrderID).padStart(4, "0")}` : "—") },
                                ]} />
                            </div>
                            <div style={card}>
                                <h5>Feedback</h5>
                                <Table rows={data.Feedback} empty="No feedback." columns={[
                                    { label: "Order", render: (f) => `#${String(f.OrderID).padStart(4, "0")}` },
                                    { label: "Rating", render: (f) => (f.Rating ? "★".repeat(f.Rating) + "☆".repeat(Math.max(0, 5 - f.Rating)) : "—") },
                                    { label: "Message", render: (f) => f.Message || "—" },
                                    { label: "Reward", render: (f) => (f.RewardStatus ? `${f.RewardStatus}${f.RewardAmount ? ` · ${rs(f.RewardAmount)}` : ""}` : "—") },
                                    { label: "Date", render: (f) => dt(f.CreatedAt, false) },
                                ]} />
                            </div>
                            <div style={card}>
                                <h5>Support enquiries</h5>
                                <Table rows={data.Enquiries} empty="No enquiries." columns={[
                                    { label: "Subject", render: (e) => e.Subject || "—" },
                                    { label: "Category", render: (e) => e.Category || "—" },
                                    { label: "Status", render: (e) => <Pill>{e.Status}</Pill> },
                                    { label: "Date", render: (e) => dt(e.CreatedAt, false) },
                                ]} />
                            </div>
                            <div style={card}>
                                <h5>Product requests</h5>
                                <Table rows={data.ProductRequests} empty="No product requests." columns={[
                                    { label: "Product", render: (r) => [r.ProductName, r.Brand, r.SizeOrQty].filter(Boolean).join(" · ") },
                                    { label: "Status", render: (r) => <Pill>{r.Status}</Pill> },
                                    { label: "Date", render: (r) => dt(r.CreatedAt, false) },
                                ]} />
                            </div>
                        </div>
                    )}

                    {tab === "rewards" && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 16 }}>
                            <div style={card}>
                                <h5>Rewards earned</h5>
                                <Table rows={data.Rewards} empty="No rewards yet." columns={[
                                    { label: "Reward", render: (r) => r.RewardName || "—" },
                                    { label: "Value", render: (r) => (r.RewardValue ? rs(r.RewardValue) : "—") },
                                    { label: "Date", render: (r) => dt(r.CreatedAt, false) },
                                ]} />
                            </div>
                            <div style={card}>
                                <h5>Referrals</h5>
                                <Field label="Their code">{(data.Referrals && data.Referrals.MyReferralCode) || "—"}</Field>
                                <Field label="Referred by">
                                    {data.Referrals && data.Referrals.Referrer
                                        ? <a href={`/customers/${data.Referrals.Referrer.UserID}`} onClick={(e) => { e.preventDefault(); Navigate(`/customers/${data.Referrals.Referrer.UserID}`); }}>
                                            {fullName(data.Referrals.Referrer)} ({data.Referrals.Referrer.MobileNumber})</a>
                                        : "—"}
                                </Field>
                                <div style={{ marginTop: 10, fontWeight: 600 }}>Friends they referred ({((data.Referrals && data.Referrals.ReferredUsers) || []).length})</div>
                                <Table rows={(data.Referrals && data.Referrals.ReferredUsers) || []} empty="Nobody yet."
                                    onRowClick={(u) => Navigate(`/customers/${u.UserID}`)} columns={[
                                        { label: "Name", render: (u) => fullName(u) },
                                        { label: "Mobile", render: (u) => u.MobileNumber },
                                        { label: "Joined", render: (u) => dt(u.CreatedAt, false) },
                                    ]} />
                            </div>
                        </div>
                    )}

                    {tab === "activity" && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 16 }}>
                            <div style={card}>
                                <h5>Recent searches</h5>
                                <Table rows={data.RecentSearches} empty="No searches recorded." columns={[
                                    { label: "Searched for", render: (r) => <b>{r.Keyword}</b> },
                                    { label: "Results", render: (r) => (Number(r.ResultCount) === 0 ? <Pill tone="red">none</Pill> : r.ResultCount) },
                                    { label: "When", render: (r) => dt(r.CreatedAt) },
                                ]} />
                            </div>
                            <div style={card}>
                                <h5>App and account</h5>
                                <Field label="App installed (push)">{data.DeviceInfo && data.DeviceInfo.AppInstalled ? "Yes" : "No"}</Field>
                                <Field label="Last active">{dt(data.DeviceInfo && data.DeviceInfo.LastActive)}</Field>
                                <Field label="Registered">{dt(p.CreatedAt)}</Field>
                                <Field label="Account status">{p.Status === 1 ? "Active" : "Inactive"}</Field>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserDetails;
