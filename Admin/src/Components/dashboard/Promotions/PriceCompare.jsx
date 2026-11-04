import React, { useEffect, useRef, useState } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { FaArrowUp, FaArrowDown, FaTrash, FaPlus, FaSearch } from "react-icons/fa";

const rs = (n) => (n == null ? "" : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`);

function Thumb({ src }) {
    return (
        <div style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 8, background: "#f1f5f9", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {src
                ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                : <span style={{ fontSize: "0.6rem", color: "#94a3b8" }}>No photo</span>}
        </div>
    );
}

// The tag exactly as the app shows it under the price.
const Tag = ({ pct }) => (
    <span style={{ color: "#DC2626", fontWeight: 800, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
        <span style={{ color: "#16A34A" }}>⬭</span> Our app: {pct}% lower
    </span>
);

const SORTS = {
    display: { label: "Display order", fn: (a, b) => a.SortOrder - b.SortOrder },
    pctDesc: { label: "Percentage: high to low", fn: (a, b) => b.PercentLower - a.PercentLower },
    pctAsc: { label: "Percentage: low to high", fn: (a, b) => a.PercentLower - b.PercentLower },
    name: { label: "Name A-Z", fn: (a, b) => String(a.ProductName).localeCompare(String(b.ProductName)) },
};

function PriceCompare() {
    const token = sessionStorage.getItem("token");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState("display");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [newPct, setNewPct] = useState("30");
    const seq = useRef(0);

    const load = () => {
        Services.getPriceCompare("GET", null, token)
            .then((res) => {
                setLoading(false);
                if (res && res.Status === 1) setItems(res.Items || []);
                else toast.error((res && res.Message) || "Could not load price tags");
            })
            .catch(() => {
                setLoading(false);
                toast.error("Could not load price tags");
            });
    };
    useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Suggestions while typing.
    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) {
            setResults([]);
            return undefined;
        }
        const timer = setTimeout(() => {
            const n = ++seq.current;
            Services.searchPriceCompareProducts("GET", null, token, q)
                .then((res) => { if (n === seq.current) setResults(res && res.Status === 1 ? res.Products : []); })
                .catch(() => {});
        }, 300);
        return () => clearTimeout(timer);
    }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

    const add = (prod) => {
        Services.addPriceCompare("POST", JSON.stringify({ ProductID: prod.ProductID, PercentLower: parseInt(newPct, 10) }), token)
            .then((res) => {
                if (res && res.Status === 1) {
                    toast.success(`${prod.ProductName}: ${newPct}% lower`);
                    setResults((list) => list.map((p) => (p.ProductID === prod.ProductID ? { ...p, Tagged: true } : p)));
                    load();
                } else toast.error((res && res.Message) || "Could not add");
            })
            .catch(() => toast.error("Could not add"));
    };

    const update = (id, body, okText) => {
        Services.updatePriceCompare("PUT", JSON.stringify(body), token, id)
            .then((res) => {
                if (res && res.Status === 1) {
                    if (okText) toast.success(okText);
                    load();
                } else {
                    toast.error((res && res.Message) || "Could not update");
                    load();
                }
            })
            .catch(() => toast.error("Could not update"));
    };

    const remove = (item) => {
        if (!window.confirm(`Remove the price tag from ${item.ProductName}?`)) return;
        Services.deletePriceCompare("DELETE", null, token, item.ProductID)
            .then((res) => {
                if (res && res.Status === 1) {
                    toast.success("Removed");
                    load();
                } else toast.error((res && res.Message) || "Could not remove");
            })
            .catch(() => toast.error("Could not remove"));
    };

    const saveOrder = (list, msg = "Order saved") => {
        setItems(list.map((it, i) => ({ ...it, SortOrder: i + 1 })));
        Services.orderPriceCompare("POST", JSON.stringify({ ProductIDs: list.map((it) => it.ProductID) }), token)
            .then((res) => {
                if (res && res.Status === 1) toast.success(msg);
                else toast.error((res && res.Message) || "Could not save the order");
            })
            .catch(() => toast.error("Could not save the order"));
    };

    const shown = [...items].sort(SORTS[sort].fn);
    const move = (index, dir) => {
        const list = [...items].sort(SORTS.display.fn);
        const j = index + dir;
        if (j < 0 || j >= list.length) return;
        [list[index], list[j]] = [list[j], list[index]];
        saveOrder(list);
    };

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="price-compare" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ padding: 20 }}>
                    <h3>Price Compare</h3>
                    <p style={{ color: "#64748b", marginTop: -4 }}>
                        Shows <Tag pct={40} /> under the price on product cards, and lists these products on the home screen in the
                        display order below.
                    </p>

                    {/* Add products */}
                    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 18 }}>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                            <div style={{ position: "relative", flex: "1 1 320px" }}>
                                <FaSearch style={{ position: "absolute", left: 12, top: 12, color: "#94a3b8" }} />
                                <input
                                    className="form-control"
                                    style={{ paddingLeft: 34 }}
                                    placeholder="Search products to add (e.g. Idli, Milk, Rice)..."
                                    value={query}
                                    autoComplete="off"
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                            <label style={{ display: "flex", alignItems: "center", gap: 6, margin: 0, fontWeight: 600, fontSize: "0.85rem" }}>
                                % lower
                                <input className="form-control" type="number" min="1" max="90" style={{ width: 90 }} value={newPct} onChange={(e) => setNewPct(e.target.value)} />
                            </label>
                        </div>
                        {results.length > 0 && (
                            <div style={{ marginTop: 10, border: "1px solid #e2e8f0", borderRadius: 8, maxHeight: 320, overflowY: "auto" }}>
                                {results.map((p) => (
                                    <div key={p.ProductID} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: "1px solid #f1f5f9" }}>
                                        <Thumb src={p.Image} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.ProductName}</div>
                                            <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{p.Unit} · {rs(p.OfferPrice)} <s>{rs(p.MRP)}</s></div>
                                        </div>
                                        <button type="button" className={`btn btn-sm ${p.Tagged ? "btn-outline-secondary" : "btn-success"}`} onClick={() => add(p)}>
                                            {p.Tagged ? "Update %" : <><FaPlus size={10} /> Add</>}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tagged products */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                        <strong>{items.length} product{items.length === 1 ? "" : "s"}</strong>
                        <span style={{ marginLeft: "auto", fontSize: "0.85rem" }}>Sort by</span>
                        <select className="form-select form-select-sm" style={{ width: 220 }} value={sort} onChange={(e) => setSort(e.target.value)}>
                            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        {sort !== "display" && (
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => { saveOrder(shown, "Display order updated"); setSort("display"); }}>
                                Use this as display order
                            </button>
                        )}
                    </div>

                    {loading ? <p>Loading...</p> : items.length === 0 ? (
                        <p style={{ color: "#64748b" }}>No products yet. Search above to add one.</p>
                    ) : (
                        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflowX: "auto" }}>
                            <table className="table mb-0" style={{ minWidth: 760 }}>
                                <thead>
                                    <tr style={{ fontSize: "0.78rem", color: "#64748b" }}>
                                        <th style={{ width: 70 }}>#</th><th>Product</th><th style={{ width: 120 }}>% lower</th><th>Shows as</th><th style={{ width: 90 }}>Active</th><th style={{ width: 60 }} />
                                    </tr>
                                </thead>
                                <tbody>
                                    {shown.map((it, i) => (
                                        <tr key={it.ProductID} style={{ opacity: it.Status ? 1 : 0.55 }}>
                                            <td style={{ verticalAlign: "middle" }}>
                                                {sort === "display" ? (
                                                    <div style={{ display: "flex", gap: 4 }}>
                                                        <button type="button" className="btn btn-sm btn-light" disabled={i === 0} title="Move up" onClick={() => move(i, -1)}><FaArrowUp size={10} /></button>
                                                        <button type="button" className="btn btn-sm btn-light" disabled={i === shown.length - 1} title="Move down" onClick={() => move(i, 1)}><FaArrowDown size={10} /></button>
                                                    </div>
                                                ) : i + 1}
                                            </td>
                                            <td style={{ verticalAlign: "middle" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <Thumb src={it.Image} />
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{it.ProductName}</div>
                                                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                                                            {it.Unit} · {rs(it.OfferPrice)}{it.ProductStatus !== 1 && <span style={{ color: "#b91c1c" }}> · product inactive</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ verticalAlign: "middle" }}>
                                                <input
                                                    className="form-control form-control-sm"
                                                    type="number"
                                                    min="1"
                                                    max="90"
                                                    defaultValue={it.PercentLower}
                                                    key={`${it.ProductID}-${it.PercentLower}`}
                                                    onBlur={(e) => {
                                                        const v = parseInt(e.target.value, 10);
                                                        if (v !== it.PercentLower) update(it.ProductID, { PercentLower: v }, "Percentage saved");
                                                    }}
                                                />
                                            </td>
                                            <td style={{ verticalAlign: "middle" }}><Tag pct={it.PercentLower} /></td>
                                            <td style={{ verticalAlign: "middle" }}>
                                                <div className="form-check form-switch m-0">
                                                    <input className="form-check-input" type="checkbox" checked={!!it.Status}
                                                        onChange={(e) => update(it.ProductID, { Status: e.target.checked ? 1 : 0 })} />
                                                </div>
                                            </td>
                                            <td style={{ verticalAlign: "middle" }}>
                                                <button type="button" className="btn btn-sm btn-outline-danger" title="Remove" onClick={() => remove(it)}><FaTrash size={11} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PriceCompare;
