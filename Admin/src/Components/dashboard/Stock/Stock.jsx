import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import classes from "../Dashboard/Dashboard.module.css";
import { Services } from "../../../Services";

const PAGE = 100;
const SORTS = {
    "name-asc": { label: "Name A → Z", fn: (a, b) => a.ProductName.localeCompare(b.ProductName) },
    "name-desc": { label: "Name Z → A", fn: (a, b) => b.ProductName.localeCompare(a.ProductName) },
    "qty-asc": { label: "Stock: lowest first", fn: (a, b) => a.AvailableQty - b.AvailableQty || a.ProductName.localeCompare(b.ProductName) },
    "qty-desc": { label: "Stock: highest first", fn: (a, b) => b.AvailableQty - a.AvailableQty || a.ProductName.localeCompare(b.ProductName) },
};
const FILTERS = { all: "All", OUT: "Out of stock", LOW: "Low", OK: "In stock" };
const STATE_STYLE = {
    OUT: { background: "#fee2e2", color: "#b91c1c" },
    LOW: { background: "#fef3c7", color: "#92400e" },
    OK: { background: "#dcfce7", color: "#166534" },
};

/**
 * Every product pack with how many are left: search, sort, filter, and add stock
 * from the product ID. Updates every minute.
 */
function Stock() {
    const navigate = useNavigate();
    const location = useLocation();
    const [items, setItems] = useState(null);
    const [summary, setSummary] = useState(null);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("name-asc");
    const [filter, setFilter] = useState(new URLSearchParams(location.search).get("filter") || "all");
    const [limit, setLimit] = useState(PAGE);
    const [editing, setEditing] = useState(null);
    const [addQty, setAddQty] = useState("");
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        const res = await Services.getStockLevels();
        if (res && res.Status === 1) {
            setItems(res.Stock || []);
            setSummary(res.Summary || null);
        } else if (res && /token/i.test(res.Message || "")) {
            navigate("/");
        }
    }, [navigate]);

    useEffect(() => {
        load();
        const t = setInterval(load, 60000);
        return () => clearInterval(t);
    }, [load]);

    const shown = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (items || [])
            .filter((v) => filter === "all" || (v.Active && v.StockState === filter))
            .filter((v) => !q || `${v.ProductID} ${v.ProductName} ${v.CategoryName} ${v.SubCategoryName}`.toLowerCase().includes(q))
            .sort(SORTS[sort].fn);
    }, [items, search, sort, filter]);

    const openAdd = (v) => {
        setEditing(v);
        setAddQty("");
    };

    const save = async () => {
        const qty = parseInt(addQty, 10);
        if (!(qty > 0)) {
            toast.error("Enter how many to add", { position: "top-center" });
            return;
        }
        setSaving(true);
        const res = await Services.addStock(editing.VariantID, qty);
        setSaving(false);
        if (res && res.Status === 1) {
            toast.success(`${editing.ProductName}: ${res.Message}`, { position: "top-center", autoClose: 2000 });
            if (res.Item) setItems((list) => list.map((v) => (v.VariantID === res.Item.VariantID ? res.Item : v)));
            setEditing(null);
            load();
        } else {
            toast.error((res && res.Message) || "Could not update stock", { position: "top-center" });
        }
    };

    const card = (label, value, style, onClick) => (
        <button type="button" onClick={onClick} className={classes.card}
            style={{ flex: 1, minWidth: 150, textAlign: "left", cursor: "pointer", border: "1px solid #e5e7eb", ...style }}>
            <div className={classes.muted}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{value}</div>
        </button>
    );

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="stock" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={classes.page}>
                    <div className={classes.pageHead}>
                        <div>
                            <h2>Stock {items && <span className={classes.count}>{items.length}</span>}</h2>
                            <span className={classes.muted}>Every product pack and how many are left. Click a product ID to add stock. Updates every minute.</span>
                        </div>
                    </div>

                    {summary && (
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                            {card("Live packs", summary.Packs, {}, () => setFilter("all"))}
                            {card("Out of stock", summary.OutOfStock, { color: "#b91c1c", background: "#fef2f2" }, () => setFilter("OUT"))}
                            {card(`Low (under ${summary.LowStockBelow})`, summary.LowStock, { color: "#92400e", background: "#fffbeb" }, () => setFilter("LOW"))}
                        </div>
                    )}

                    <div className={classes.card} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <input
                            type="search"
                            className="form-control"
                            style={{ maxWidth: 320 }}
                            placeholder="Search name, category or product ID"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setLimit(PAGE); }}
                        />
                        <select className="form-select" style={{ maxWidth: 220 }} value={sort} onChange={(e) => setSort(e.target.value)}>
                            {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                        </select>
                        <div className="btn-group">
                            {Object.entries(FILTERS).map(([k, label]) => (
                                <button key={k} type="button"
                                    className={`btn btn-sm ${filter === k ? "btn-success" : "btn-outline-secondary"}`}
                                    onClick={() => { setFilter(k); setLimit(PAGE); }}>
                                    {label}
                                </button>
                            ))}
                        </div>
                        <span className={classes.muted} style={{ marginLeft: "auto" }}>{shown.length} shown</span>
                    </div>

                    <div className={classes.card}>
                        {items === null ? (
                            <span className={classes.muted}>Loading…</span>
                        ) : shown.length === 0 ? (
                            <span className={classes.muted}>No products match.</span>
                        ) : (
                            <>
                                <table className={classes.table}>
                                    <thead>
                                        <tr><th>Product ID</th><th>Product</th><th>Pack</th><th>Category</th><th>Price</th><th>Left</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        {shown.slice(0, limit).map((v) => (
                                            <tr key={v.VariantID} style={v.Active ? undefined : { opacity: 0.55 }}>
                                                <td>
                                                    <button type="button" className="btn btn-link btn-sm p-0 fw-bold" title="Add stock" onClick={() => openAdd(v)}>
                                                        #{v.ProductID}
                                                    </button>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        {v.ImageUrl && <img src={v.ImageUrl} alt="" style={{ width: 34, height: 34, objectFit: "contain", borderRadius: 6, background: "#f8fafc" }} />}
                                                        <span>{v.ProductName}{!v.Active && <span className={classes.muted}> (hidden)</span>}</span>
                                                    </div>
                                                </td>
                                                <td>{v.Unit || "—"}</td>
                                                <td>{v.CategoryName || "—"}{v.SubCategoryName ? ` › ${v.SubCategoryName}` : ""}</td>
                                                <td>₹{Number(v.OfferPrice || v.Price || 0)}</td>
                                                <td>
                                                    <span style={{ ...STATE_STYLE[v.StockState], padding: "2px 10px", borderRadius: 12, fontWeight: 700 }}>
                                                        {v.StockState === "OUT" ? "Out" : v.AvailableQty}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button type="button" className="btn btn-sm btn-outline-success" onClick={() => openAdd(v)}>+ Add stock</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {shown.length > limit && (
                                    <div style={{ textAlign: "center", marginTop: 12 }}>
                                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setLimit((l) => l + PAGE)}>
                                            Show {Math.min(PAGE, shown.length - limit)} more
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {editing && (
                <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => !saving && setEditing(null)}>
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add stock · #{editing.ProductID}</h5>
                                <button type="button" className="btn-close" onClick={() => setEditing(null)} disabled={saving} />
                            </div>
                            <div className="modal-body">
                                <div style={{ fontWeight: 600 }}>{editing.ProductName}</div>
                                <div className={classes.muted} style={{ marginBottom: 12 }}>
                                    {editing.Unit} · now <b>{editing.AvailableQty}</b> in stock
                                </div>
                                <label className="form-label">How many to add</label>
                                <input
                                    type="number"
                                    min="1"
                                    autoFocus
                                    className="form-control"
                                    value={addQty}
                                    onChange={(e) => setAddQty(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && save()}
                                />
                                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                                    {[10, 25, 50, 100].map((n) => (
                                        <button key={n} type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setAddQty(String(n))}>+{n}</button>
                                    ))}
                                </div>
                                {parseInt(addQty, 10) > 0 && (
                                    <div className={classes.muted} style={{ marginTop: 10 }}>
                                        New stock: <b>{editing.AvailableQty + parseInt(addQty, 10)}</b>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
                                <button type="button" className="btn btn-success" onClick={save} disabled={saving}>{saving ? "Saving…" : "Add stock"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Stock;
