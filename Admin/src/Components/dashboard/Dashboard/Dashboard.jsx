import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiRefreshCw } from "react-icons/fi";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import classes from "./Dashboard.module.css";
import { Services } from "../../../Services";

const REFRESH_MS = 60000;

const rupees = (v) => `₹${Math.round(Number(v) || 0).toLocaleString("en-IN")}`;
const dayLabel = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });

function Tile({ label, value, hint, onClick, tone }) {
    return (
        <button
            type="button"
            className={`${classes.tile} ${tone ? classes[`tile-${tone}`] : ""}`}
            onClick={onClick}
            disabled={!onClick}>
            <span className={classes.tileLabel}>{label}</span>
            <span className={classes.tileValue}>{value}</span>
            {hint && <span className={classes.tileHint}>{hint}</span>}
        </button>
    );
}

/** Orders per day for the last 7 days (revenue in the tooltip and table). */
function WeekChart({ days }) {
    const [hover, setHover] = useState(null);
    const [showTable, setShowTable] = useState(false);
    const max = Math.max(1, ...days.map((d) => d.Orders));
    const best = days.reduce((a, d, i) => (d.Orders > days[a].Orders ? i : a), 0);
    return (
        <div className={classes.card}>
            <div className={classes.cardHead}>
                <h3>Orders, last 7 days</h3>
                <button type="button" className={classes.linkBtn} onClick={() => setShowTable((v) => !v)}>
                    {showTable ? "Show chart" : "Show table"}
                </button>
            </div>
            {showTable ? (
                <table className={classes.table}>
                    <thead>
                        <tr><th>Day</th><th>Orders</th><th>Revenue</th></tr>
                    </thead>
                    <tbody>
                        {days.map((d) => (
                            <tr key={d.Day}><td>{dayLabel(d.Day)}</td><td>{d.Orders}</td><td>{rupees(d.Revenue)}</td></tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className={classes.chart} role="img" aria-label={days.map((d) => `${dayLabel(d.Day)}: ${d.Orders} orders`).join(", ")}>
                    {days.map((d, i) => {
                        const isToday = i === days.length - 1;
                        const labelled = isToday || i === best;
                        return (
                            <div
                                key={d.Day}
                                className={classes.barSlot}
                                onMouseEnter={() => setHover(i)}
                                onMouseLeave={() => setHover(null)}>
                                {hover === i && (
                                    <div className={classes.tooltip}>
                                        <strong>{dayLabel(d.Day)}</strong>
                                        <span>{d.Orders} orders</span>
                                        <span>{rupees(d.Revenue)} revenue</span>
                                    </div>
                                )}
                                <span className={classes.barValue}>{labelled ? d.Orders : ""}</span>
                                <div
                                    className={`${classes.bar} ${hover === i ? classes.barHover : ""}`}
                                    style={{ height: `${Math.max(d.Orders ? 4 : 0, (d.Orders / max) * 100)}%` }}
                                />
                                <span className={`${classes.barLabel} ${isToday ? classes.barLabelToday : ""}`}>
                                    {isToday ? "Today" : dayLabel(d.Day)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function Dashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [updatedAt, setUpdatedAt] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await Services.getDashboard();
            if (res && res.Status === 1) {
                setData(res);
                setError("");
                setUpdatedAt(new Date());
            } else {
                setError((res && res.Message) || "Could not load the dashboard");
                if (res && /token/i.test(res.Message || "")) navigate("/");
            }
        } catch (e) {
            setError("Could not reach the server");
        }
        setLoading(false);
    }, [navigate]);

    useEffect(() => {
        load();
        const t = setInterval(load, REFRESH_MS);
        return () => clearInterval(t);
    }, [load]);

    const t = data && data.Today;
    const p = data && data.Pipeline;
    const r = data && data.Riders;
    const pending = data && data.Pending;
    const inProgress = p ? p.Received + p.Packing + p.Assigned + p.OutForDelivery + p.Arrived : 0;

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="dashboard" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={classes.page}>
                    <div className={classes.pageHead}>
                        <div>
                            <h2>Today</h2>
                            {updatedAt && <span className={classes.muted}>Updated {updatedAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} · refreshes every minute</span>}
                        </div>
                        <button type="button" className={classes.refresh} onClick={load} disabled={loading}>
                            <FiRefreshCw className={loading ? classes.spin : ""} /> Refresh
                        </button>
                    </div>

                    {error && <div className={classes.error}>{error}</div>}
                    {!data && !error && <div className={classes.muted}>Loading…</div>}

                    {data && (
                        <>
                            <div className={classes.tiles}>
                                <Tile label="Orders today" value={t.Orders} hint={`${t.Delivered} delivered · ${t.Cancelled} cancelled`} onClick={() => navigate("/orders")} />
                                <Tile label="Revenue today" value={rupees(t.Revenue)} hint={`Avg order ${rupees(t.AvgOrderValue)}`} />
                                <Tile label="Avg delivery time" value={t.AvgDeliveryMinutes ? `${t.AvgDeliveryMinutes} min` : "—"} hint="Placed to delivered, today" />
                                <Tile label="Riders online" value={`${r.Online} / ${r.Total}`} hint={`${r.OnDelivery} on a delivery`} onClick={() => navigate("/live-operations")} tone={r.Online === 0 && inProgress > 0 ? "alert" : null} />
                            </div>

                            <div className={classes.card}>
                                <div className={classes.cardHead}>
                                    <h3>Orders in progress <span className={classes.count}>{inProgress}</span></h3>
                                    <button type="button" className={classes.linkBtn} onClick={() => navigate("/orders")}>Open orders</button>
                                </div>
                                <div className={classes.pipeline}>
                                    {[
                                        ["New", p.Received, p.Received > 0 ? "alert" : null, "Accept and start packing"],
                                        ["Packing", p.Packing, null, "Assign a rider when packed"],
                                        ["Rider assigned", p.Assigned, null, "Waiting for pickup"],
                                        ["Out for delivery", p.OutForDelivery, null, "On the way"],
                                        ["At customer", p.Arrived, null, "Collecting OTP"],
                                    ].map(([label, n, tone, hint]) => (
                                        <Tile key={label} label={label} value={n} hint={hint} tone={tone} onClick={() => navigate("/orders")} />
                                    ))}
                                </div>
                            </div>

                            <div className={classes.twoCol}>
                                <WeekChart days={data.Last7Days} />

                                <div className={classes.card}>
                                    <div className={classes.cardHead}><h3>Needs attention</h3></div>
                                    <ul className={classes.attention}>
                                        <li onClick={() => navigate("/photo-orders")}><span>Photo orders to review</span><b className={pending.PhotoOrders ? classes.hot : ""}>{pending.PhotoOrders}</b></li>
                                        <li onClick={() => navigate("/product-requests")}><span>Product requests</span><b className={pending.ProductRequests ? classes.hot : ""}>{pending.ProductRequests}</b></li>
                                        <li onClick={() => navigate("/customer-enquiries")}><span>Open customer enquiries</span><b className={pending.Enquiries ? classes.hot : ""}>{pending.Enquiries}</b></li>
                                        <li onClick={() => navigate("/orders")}><span>Online refunds that failed (refund in Razorpay)</span><b className={pending.FailedRefunds ? classes.hot : ""}>{pending.FailedRefunds}</b></li>
                                        <li onClick={() => navigate("/out-of-stock")}><span>Out of stock or low (5 or fewer)</span><b className={data.LowStock.length ? classes.hot : ""}>{data.LowStock.length}{data.LowStock.length === 50 ? "+" : ""}</b></li>
                                    </ul>
                                </div>
                            </div>

                            {data.LowStock.length > 0 && (
                                <div className={classes.card}>
                                    <div className={classes.cardHead}>
                                        <h3>Low stock</h3>
                                        <button type="button" className={classes.linkBtn} onClick={() => navigate("/out-of-stock")}>See all out of stock</button>
                                    </div>
                                    <table className={classes.table}>
                                        <thead><tr><th>Product</th><th>Pack</th><th>In stock</th></tr></thead>
                                        <tbody>
                                            {data.LowStock.slice(0, 15).map((v) => (
                                                <tr key={v.VariantID} onClick={() => navigate(`/products/details/${v.ProductID}`)} className={classes.clickRow}>
                                                    <td>{v.ProductName}</td>
                                                    <td>{v.metricvalue ? `${Number(v.metricvalue)} ${v.metrictype || ""}` : "—"}</td>
                                                    <td className={v.AvailableQty <= 0 ? classes.hot : ""}>{v.AvailableQty <= 0 ? "Out of stock" : v.AvailableQty}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
