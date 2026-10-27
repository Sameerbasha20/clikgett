import React, { useCallback, useEffect, useMemo, useState } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import classes from "../Dashboard/Dashboard.module.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { FaTrash } from "react-icons/fa";

const PAGE = 100;
const PRICE_CHIPS = [0, 1, 9, 29, 49, 99];
const CART_CHIPS = [199, 299, 499, 799, 999];
const tabLabel = (price) => (Number(price) <= 0 ? "FREE" : `₹${Number(price)}`);
const selling = (p) => Number(p.OfferPrice || p.Price || 0);
const unitOf = (r) => (r.metrictype ? `${Number(r.metricvalue)} ${r.metrictype}` : r.Unit || "");
const ok = (res) => res && (res.Status === 1 || res.status === 1);

const SORTS = {
    "name-asc": { label: "Name A → Z", fn: (a, b) => a.ProductName.localeCompare(b.ProductName) },
    "name-desc": { label: "Name Z → A", fn: (a, b) => b.ProductName.localeCompare(a.ProductName) },
    "price-asc": { label: "Price: low to high", fn: (a, b) => selling(a) - selling(b) },
    "price-desc": { label: "Price: high to low", fn: (a, b) => selling(b) - selling(a) },
    "stock-desc": { label: "Stock: most first", fn: (a, b) => b.AvailableQty - a.AvailableQty },
};

/**
 * Unlock deals: pick any products and sell them at a special price (FREE, ₹1, ₹9...).
 * Every deal opens at the same cart value ("Unlock at"), set once at the top.
 */
function ProductUnlocks() {
    const [tab, setTab] = useState("products");
    const [packs, setPacks] = useState(null);
    const [deals, setDeals] = useState([]);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("name-asc");
    const [limit, setLimit] = useState(PAGE);
    const [defaults, setDefaults] = useState({ price: "1", maxQty: "1" });
    const [threshold, setThreshold] = useState(null);
    const [thresholdInput, setThresholdInput] = useState("");
    const [savingThreshold, setSavingThreshold] = useState(false);
    const [rowEdits, setRowEdits] = useState({});
    const [busy, setBusy] = useState(null);

    const loadDeals = useCallback(() => {
        Services.getProductUnlocks("GET", null).then((res) => setDeals(ok(res) ? res.Unlocks || res.data || [] : []));
    }, []);

    useEffect(() => {
        Services.getUnlockSettings().then((res) => {
            if (ok(res)) {
                setThreshold(Number(res.ThresholdAmount));
                setThresholdInput(String(Number(res.ThresholdAmount)));
            }
        });
    }, []);

    const saveThreshold = async (value) => {
        const v = Number(value);
        if (!(v > 0)) return toast.error("Enter the cart value, e.g. 499");
        setSavingThreshold(true);
        const res = await Services.updateUnlockSettings(JSON.stringify({ ThresholdAmount: v }));
        setSavingThreshold(false);
        if (ok(res)) {
            setThreshold(v);
            setThresholdInput(String(v));
            toast.success(`All deals now unlock at ₹${v}`, { autoClose: 1800 });
            loadDeals();
        } else {
            toast.error((res && res.Message) || "Could not save the unlock value");
        }
    };

    useEffect(() => {
        loadDeals();
        Services.getStockLevels().then((res) => setPacks(res && res.Status === 1 ? (res.Stock || []).filter((p) => p.Active) : []));
    }, [loadDeals]);

    const dealByPack = useMemo(() => new Map(deals.map((d) => [d.VariantID, d])), [deals]);

    const shown = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (packs || [])
            .filter((p) => !q || `${p.ProductID} ${p.ProductName} ${p.Unit} ${p.CategoryName}`.toLowerCase().includes(q))
            .sort(SORTS[sort].fn);
    }, [packs, search, sort]);

    const shownDeals = useMemo(() => {
        const q = search.trim().toLowerCase();
        return deals
            .filter((d) => !q || `${d.ProductID} ${d.ProductName}`.toLowerCase().includes(q))
            .sort((a, b) => Number(a.UnlockPrice) - Number(b.UnlockPrice) || a.ProductName.localeCompare(b.ProductName));
    }, [deals, search]);

    const edit = (key, patch) => setRowEdits((e) => ({ ...e, [key]: { ...(e[key] || {}), ...patch } }));
    const valueOf = (key, field, fallback) => (rowEdits[key] && rowEdits[key][field] !== undefined ? rowEdits[key][field] : fallback);

    const saveDeal = async (key, body, id) => {
        setBusy(key);
        const res = id
            ? await Services.updateProductUnlock("PUT", JSON.stringify(body), undefined, id)
            : await Services.createProductUnlock("POST", JSON.stringify(body));
        setBusy(null);
        if (ok(res)) {
            toast.success(id ? "Deal updated" : `Added to deals at ${tabLabel(body.UnlockPrice)}`, { autoClose: 1500 });
            setRowEdits((e) => ({ ...e, [key]: undefined }));
            loadDeals();
            return true;
        }
        toast.error((res && (res.Message || res.message)) || "Could not save the deal");
        return false;
    };

    const addDeal = (p) => {
        const key = `p${p.VariantID}`;
        return saveDeal(key, {
            ProductID: p.ProductID,
            VariantID: p.VariantID,
            UnlockPrice: valueOf(key, "price", defaults.price),
            MaxQtyPerOrder: defaults.maxQty,
            Status: 1,
        });
    };

    const updateDeal = (d, patch) => saveDeal(`d${d.UnlockID}`, {
        ProductID: d.ProductID,
        VariantID: d.RuleVariantID || d.VariantID,
        UnlockPrice: d.UnlockPrice,
        MaxQtyPerOrder: d.MaxQtyPerOrder,
        Message: d.UnlockMessage || d.Message || "",
        StartDate: d.StartDate,
        EndDate: d.EndDate,
        Status: d.Status,
        ...patch,
    }, d.UnlockID);

    const removeDeal = async (d) => {
        if (!window.confirm(`Remove ${d.ProductName} from ${tabLabel(d.UnlockPrice)} deals?`)) return;
        const res = await Services.deleteProductUnlock("DELETE", null, undefined, d.UnlockID);
        if (ok(res)) {
            toast.success("Removed from deals", { autoClose: 1500 });
            loadDeals();
        } else {
            toast.error("Could not remove the deal");
        }
    };

    const tabCounts = useMemo(() => {
        const map = new Map();
        deals.filter((d) => Number(d.Status) === 1).forEach((d) => map.set(tabLabel(d.UnlockPrice), (map.get(tabLabel(d.UnlockPrice)) || 0) + 1));
        return [...map.entries()];
    }, [deals]);

    const chip = (active) => `btn btn-sm ${active ? "btn-success" : "btn-outline-secondary"}`;
    const small = { width: 82 };

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="product-unlocks" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={classes.page}>
                    <div className={classes.pageHead}>
                        <div>
                            <h2>Unlock deals</h2>
                            <span className={classes.muted}>
                                Pick any products and set a special price. They all unlock together once the customer's cart reaches the value below
                                {tabCounts.length > 0 && <> · live: {tabCounts.map(([l, n]) => `${l} (${n})`).join(", ")}</>}.
                            </span>
                        </div>
                    </div>

                    <div className={classes.card} style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center",
                        background: "linear-gradient(135deg, #14532d, #16a34a)", color: "#fff" }}>
                        <div style={{ minWidth: 220 }}>
                            <div style={{ fontSize: 13, opacity: 0.85 }}>Deals unlock when the cart reaches</div>
                            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>{threshold ? `₹${threshold}` : "—"}</div>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>Deal items themselves don't count towards it.</div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                            {CART_CHIPS.map((v) => (
                                <button key={v} type="button" disabled={savingThreshold}
                                    className={`btn btn-sm ${threshold === v ? "btn-light" : "btn-outline-light"}`}
                                    onClick={() => saveThreshold(v)}>₹{v}</button>
                            ))}
                            <div className="input-group input-group-sm" style={{ width: 170 }}>
                                <span className="input-group-text">₹</span>
                                <input type="number" min="1" className="form-control" value={thresholdInput}
                                    onChange={(e) => setThresholdInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && saveThreshold(thresholdInput)} />
                                <button type="button" className="btn btn-warning fw-bold" disabled={savingThreshold || Number(thresholdInput) === threshold}
                                    onClick={() => saveThreshold(thresholdInput)}>{savingThreshold ? "…" : "Save"}</button>
                            </div>
                        </div>
                    </div>

                    <div className={classes.card} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <div className="btn-group">
                            <button type="button" className={chip(tab === "products")} onClick={() => setTab("products")}>All products</button>
                            <button type="button" className={chip(tab === "deals")} onClick={() => setTab("deals")}>Live deals ({deals.length})</button>
                        </div>
                        <input type="search" className="form-control" style={{ maxWidth: 300 }} placeholder="Search name, pack or product ID"
                            value={search} onChange={(e) => { setSearch(e.target.value); setLimit(PAGE); }} />
                        {tab === "products" && (
                            <select className="form-select" style={{ maxWidth: 200 }} value={sort} onChange={(e) => setSort(e.target.value)}>
                                {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                            </select>
                        )}
                    </div>

                    {tab === "products" && (
                        <div className={classes.card} style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center", background: "#f0fdf4" }}>
                            <b>Default for “+ Add”:</b>
                            <span>Deal price{" "}
                                {PRICE_CHIPS.map((p) => (
                                    <button key={p} type="button" className={`${chip(defaults.price === String(p))} me-1`}
                                        onClick={() => setDefaults((d) => ({ ...d, price: String(p) }))}>{tabLabel(p)}</button>
                                ))}
                            </span>
                            <span>Limit/order{" "}
                                <input type="number" min="1" max="20" className="form-control form-control-sm d-inline-block" style={{ width: 64 }}
                                    value={defaults.maxQty} onChange={(e) => setDefaults((d) => ({ ...d, maxQty: e.target.value }))} />
                            </span>
                        </div>
                    )}

                    <div className={classes.card}>
                        {tab === "products" ? (
                            packs === null ? <span className={classes.muted}>Loading products…</span> : (
                                <>
                                    <table className={classes.table}>
                                        <thead>
                                            <tr><th>Product</th><th>Pack</th><th>Price</th><th>Stock</th><th>Deal price ₹</th><th></th></tr>
                                        </thead>
                                        <tbody>
                                            {shown.slice(0, limit).map((p) => {
                                                const key = `p${p.VariantID}`;
                                                const existing = dealByPack.get(p.VariantID);
                                                return (
                                                    <tr key={p.VariantID}>
                                                        <td>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                {p.ImageUrl && <img src={p.ImageUrl} alt="" style={{ width: 34, height: 34, objectFit: "contain" }} />}
                                                                <span>{p.ProductName} <span className={classes.muted}>#{p.ProductID}</span></span>
                                                            </div>
                                                        </td>
                                                        <td>{p.Unit}</td>
                                                        <td>₹{selling(p)}</td>
                                                        <td className={p.AvailableQty <= 0 ? classes.hot : ""}>{p.AvailableQty <= 0 ? "Out" : p.AvailableQty}</td>
                                                        {existing ? (
                                                            <td colSpan={2}>
                                                                <span style={{ background: "#dcfce7", color: "#166534", borderRadius: 12, padding: "3px 10px", fontWeight: 700 }}>
                                                                    In deals at {tabLabel(existing.UnlockPrice)}
                                                                </span>
                                                                <button type="button" className="btn btn-link btn-sm" onClick={() => { setTab("deals"); setSearch(p.ProductName.trim()); }}>Edit</button>
                                                            </td>
                                                        ) : (
                                                            <>
                                                                <td>
                                                                    <input type="number" min="0" className="form-control form-control-sm" style={small}
                                                                        value={valueOf(key, "price", defaults.price)} onChange={(e) => edit(key, { price: e.target.value })} />
                                                                </td>
                                                                <td>
                                                                    <button type="button" className="btn btn-sm btn-success" disabled={busy === key} onClick={() => addDeal(p)}>
                                                                        {busy === key ? "…" : "+ Add"}
                                                                    </button>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {shown.length > limit && (
                                        <div style={{ textAlign: "center", marginTop: 12 }}>
                                            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setLimit((l) => l + PAGE)}>
                                                Show {Math.min(PAGE, shown.length - limit)} more of {shown.length}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )
                        ) : shownDeals.length === 0 ? (
                            <span className={classes.muted}>No deals yet. Go to “All products” and press “+ Add” on any product.</span>
                        ) : (
                            <table className={classes.table}>
                                <thead>
                                    <tr><th>Product</th><th>Deal price ₹</th><th>Limit/order</th><th>Stock</th><th>Live</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {shownDeals.map((d) => {
                                        const key = `d${d.UnlockID}`;
                                        const price = valueOf(key, "price", String(Number(d.UnlockPrice)));
                                        const max = valueOf(key, "max", String(d.MaxQtyPerOrder || 1));
                                        const changed = price !== String(Number(d.UnlockPrice)) || max !== String(d.MaxQtyPerOrder || 1);
                                        return (
                                            <tr key={d.UnlockID}>
                                                <td><strong>{d.ProductName}</strong><div className={classes.muted}>{unitOf(d)} · normally ₹{Number(d.OfferPrice || d.Price)}</div></td>
                                                <td><input type="number" min="0" className="form-control form-control-sm" style={small} value={price} onChange={(e) => edit(key, { price: e.target.value })} /></td>
                                                <td><input type="number" min="1" max="20" className="form-control form-control-sm" style={{ width: 64 }} value={max} onChange={(e) => edit(key, { max: e.target.value })} /></td>
                                                <td className={Number(d.AvailableQty) <= 0 ? classes.hot : ""}>{Number(d.AvailableQty) <= 0 ? "Out" : d.AvailableQty}</td>
                                                <td>
                                                    <div className="form-check form-switch m-0">
                                                        <input className="form-check-input" type="checkbox" checked={Number(d.Status) === 1}
                                                            onChange={() => updateDeal(d, { Status: Number(d.Status) === 1 ? 0 : 1 })} />
                                                    </div>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    {changed && (
                                                        <button type="button" className="btn btn-sm btn-success me-1" disabled={busy === key}
                                                            onClick={() => updateDeal(d, { UnlockPrice: price, MaxQtyPerOrder: max })}>Save</button>
                                                    )}
                                                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeDeal(d)}><FaTrash /></button>
                                                </td>
                                            </tr>
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

export default ProductUnlocks;
