import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import classes from "../Dashboard/Dashboard.module.css";
import { Services } from "../../../Services";

const REFRESH_MS = 60000;
const fmt = (v) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—");
const pack = (v) => (v.metricvalue ? `${Number(v.metricvalue)} ${v.metrictype || ""}`.trim() : "—");

/**
 * Every active pack with no stock. The list is live: a pack leaves it as soon
 * as it has stock again, from here or anywhere else.
 */
function OutOfStock() {
    const navigate = useNavigate();
    const [items, setItems] = useState(null);
    const [search, setSearch] = useState("");
    const [qty, setQty] = useState({});
    const [saving, setSaving] = useState(null);

    const load = useCallback(async () => {
        const res = await Services.getOutOfStock();
        if (res && res.Status === 1) setItems(res.Items || []);
        else if (res && /token/i.test(res.Message || "")) navigate("/");
    }, [navigate]);

    useEffect(() => {
        load();
        const t = setInterval(load, REFRESH_MS);
        return () => clearInterval(t);
    }, [load]);

    const restock = async (v) => {
        const value = parseInt(qty[v.VariantID], 10);
        if (!(value > 0)) {
            toast.error("Enter how many are in stock", { position: "top-center" });
            return;
        }
        setSaving(v.VariantID);
        const res = await Services.restockVariant(v.VariantID, value);
        setSaving(null);
        if (res && res.Status === 1) {
            toast.success(`${v.ProductName} is back in stock`, { position: "top-center", autoClose: 1500 });
            setQty((q) => ({ ...q, [v.VariantID]: "" }));
            load();
        } else {
            toast.error((res && res.Message) || "Could not update stock", { position: "top-center" });
        }
    };

    const q = search.trim().toLowerCase();
    const shown = (items || []).filter((v) => !q || `${v.ProductName} ${v.CategoryName} ${v.SubCategoryName}`.toLowerCase().includes(q));
    const waiting = (items || []).filter((v) => v.InCarts > 0).length;

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="out-of-stock" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={classes.page}>
                    <div className={classes.pageHead}>
                        <div>
                            <h2>Out of stock {items && <span className={classes.count}>{items.length}</span>}</h2>
                            <span className={classes.muted}>
                                Packs customers can't buy right now. They leave this list as soon as they're back in stock. Updates every minute.
                            </span>
                        </div>
                        <input
                            className="form-control"
                            style={{ maxWidth: 260 }}
                            placeholder="Search product or category"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {waiting > 0 && (
                        <div className={classes.error} style={{ background: "#fffbeb", color: "#92400e" }}>
                            {waiting} out-of-stock {waiting === 1 ? "pack is" : "packs are"} sitting in customers' carts. Restock those first (they're at the top).
                        </div>
                    )}

                    <div className={classes.card}>
                        {items === null ? (
                            <span className={classes.muted}>Loading…</span>
                        ) : shown.length === 0 ? (
                            <span className={classes.muted}>{items.length === 0 ? "Everything is in stock." : "No match for your search."}</span>
                        ) : (
                            <table className={classes.table}>
                                <thead>
                                    <tr>
                                        <th>Product</th><th>Pack</th><th>Category</th><th>Price</th>
                                        <th title="Customers who have it in their cart">In carts</th><th>Last sold</th><th>Restock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shown.map((v) => (
                                        <tr key={v.VariantID}>
                                            <td>
                                                <button type="button" className={classes.linkBtn} style={{ padding: 0, textAlign: "left", color: "#0f172a" }}
                                                    onClick={() => navigate(`/products/details/${v.ProductID}`)}>
                                                    {v.ProductName}
                                                </button>
                                            </td>
                                            <td>{pack(v)}</td>
                                            <td>{v.CategoryName || "—"}{v.SubCategoryName ? ` › ${v.SubCategoryName}` : ""}</td>
                                            <td>₹{Number(v.OfferPrice || v.Price || 0)}</td>
                                            <td className={v.InCarts > 0 ? classes.hot : ""}>{v.InCarts}</td>
                                            <td>{fmt(v.LastSoldAt)}</td>
                                            <td style={{ whiteSpace: "nowrap" }}>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="form-control form-control-sm d-inline-block"
                                                    style={{ width: 80, marginRight: 6 }}
                                                    placeholder="Qty"
                                                    value={qty[v.VariantID] || ""}
                                                    onChange={(e) => setQty((s) => ({ ...s, [v.VariantID]: e.target.value }))}
                                                    onKeyDown={(e) => e.key === "Enter" && restock(v)}
                                                />
                                                <button type="button" className="btn btn-sm btn-success" disabled={saving === v.VariantID} onClick={() => restock(v)}>
                                                    {saving === v.VariantID ? "…" : "Restock"}
                                                </button>
                                            </td>
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

export default OutOfStock;
