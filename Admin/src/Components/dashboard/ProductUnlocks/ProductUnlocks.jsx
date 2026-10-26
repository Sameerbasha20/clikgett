import React, { useEffect, useMemo, useState } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import classes from "../Dashboard/Dashboard.module.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { FaEdit, FaTrash, FaPlus, FaUnlock } from "react-icons/fa";
import { localDateTimeToUtc, toDateTimeInput } from "../../../dateInputs";

const PRICE_CHIPS = [0, 1, 9, 29, 49, 99];
const CART_CHIPS = [199, 299, 499, 799, 999];
const tabLabel = (price) => (Number(price) <= 0 ? "FREE" : `₹${Number(price)}`);
const unitOf = (r) => (r.metrictype ? `${Number(r.metricvalue)} ${r.metrictype}` : r.Unit || "");

const emptyForm = {
    pack: null,
    unlockPrice: "",
    thresholdAmount: "",
    maxQty: "1",
    message: "",
    startDate: "",
    endDate: "",
    status: 1,
};

/**
 * Unlock deals: a product pack sold at a special price (FREE, ₹1, ₹9...) once the rest
 * of the cart reaches a value. The app groups deals into tabs by their price.
 */
function ProductUnlocks() {
    const [unlocks, setUnlocks] = useState(null);
    const [packs, setPacks] = useState([]);
    const [modal, setModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [packSearch, setPackSearch] = useState("");
    const [saving, setSaving] = useState(false);

    const set = (patch) => setForm((f) => ({ ...f, ...patch }));

    const fetchUnlocks = () => {
        Services.getProductUnlocks("GET", null)
            .then((res) => setUnlocks(res && (res.Status === 1 || res.status === 1) ? res.Unlocks || res.data || [] : []))
            .catch(() => {
                setUnlocks([]);
                toast.error("Error loading unlock deals");
            });
    };

    useEffect(() => {
        fetchUnlocks();
        Services.getStockLevels().then((res) => {
            if (res && res.Status === 1) setPacks((res.Stock || []).filter((p) => p.Active));
        });
    }, []);

    const packMatches = useMemo(() => {
        const q = packSearch.trim().toLowerCase();
        if (!q) return [];
        return packs
            .filter((p) => `${p.ProductID} ${p.ProductName} ${p.Unit} ${p.CategoryName}`.toLowerCase().includes(q))
            .slice(0, 30);
    }, [packs, packSearch]);

    const openAdd = () => {
        setEditId(null);
        setForm(emptyForm);
        setPackSearch("");
        setModal(true);
    };

    const openEdit = (row) => {
        const pack = packs.find((p) => p.VariantID === row.VariantID) || {
            ProductID: row.ProductID,
            VariantID: row.VariantID,
            ProductName: row.ProductName,
            Unit: unitOf(row),
            Price: Number(row.Price),
            OfferPrice: Number(row.OfferPrice),
            AvailableQty: row.AvailableQty,
        };
        setEditId(row.UnlockID);
        setForm({
            pack,
            unlockPrice: row.UnlockPrice === null || row.UnlockPrice === undefined ? "" : String(Number(row.UnlockPrice)),
            thresholdAmount: String(Number(row.ThresholdAmount)),
            maxQty: String(row.MaxQtyPerOrder || 1),
            message: row.UnlockMessage || row.Message || "",
            startDate: toDateTimeInput(row.StartDate),
            endDate: toDateTimeInput(row.EndDate),
            status: Number(row.Status) === 1 ? 1 : 0,
        });
        setPackSearch("");
        setModal(true);
    };

    const payloadOf = (f) => ({
        ProductID: f.pack && f.pack.ProductID,
        VariantID: f.pack && f.pack.VariantID,
        UnlockPrice: f.unlockPrice,
        ThresholdAmount: f.thresholdAmount,
        MaxQtyPerOrder: f.maxQty,
        Message: f.message,
        StartDate: localDateTimeToUtc(f.startDate),
        EndDate: localDateTimeToUtc(f.endDate),
        Status: f.status,
    });

    const save = async () => {
        if (!form.pack) return toast.error("Choose the product pack for this deal");
        if (form.unlockPrice === "") return toast.error("Enter the deal price (0 for free)");
        if (!(Number(form.thresholdAmount) > 0)) return toast.error("Enter the cart value that unlocks the deal");
        setSaving(true);
        const body = JSON.stringify(payloadOf(form));
        const res = editId
            ? await Services.updateProductUnlock("PUT", body, undefined, editId)
            : await Services.createProductUnlock("POST", body);
        setSaving(false);
        if (res && (res.Status === 1 || res.status === 1)) {
            toast.success(editId ? "Deal updated" : "Deal created");
            setModal(false);
            fetchUnlocks();
        } else {
            toast.error((res && (res.Message || res.message)) || "Could not save the deal");
        }
    };

    const toggle = async (row) => {
        const body = JSON.stringify({
            ProductID: row.ProductID,
            VariantID: row.RuleVariantID || row.VariantID,
            UnlockPrice: row.UnlockPrice,
            ThresholdAmount: row.ThresholdAmount,
            MaxQtyPerOrder: row.MaxQtyPerOrder,
            Message: row.UnlockMessage || row.Message || "",
            StartDate: row.StartDate,
            EndDate: row.EndDate,
            Status: Number(row.Status) === 1 ? 0 : 1,
        });
        const res = await Services.updateProductUnlock("PUT", body, undefined, row.UnlockID);
        if (res && (res.Status === 1 || res.status === 1)) fetchUnlocks();
        else toast.error((res && (res.Message || res.message)) || "Could not update");
    };

    const remove = async (row) => {
        if (!window.confirm(`Delete the ${tabLabel(row.UnlockPrice)} deal on ${row.ProductName}?`)) return;
        const res = await Services.deleteProductUnlock("DELETE", null, undefined, row.UnlockID);
        if (res && (res.Status === 1 || res.status === 1)) {
            toast.success("Deal deleted");
            fetchUnlocks();
        } else {
            toast.error("Could not delete the deal");
        }
    };

    const tabs = useMemo(() => {
        const map = new Map();
        (unlocks || []).forEach((u) => {
            const k = tabLabel(u.UnlockPrice);
            map.set(k, (map.get(k) || 0) + (Number(u.Status) === 1 ? 1 : 0));
        });
        return [...map.entries()];
    }, [unlocks]);

    const regular = form.pack ? Number(form.pack.OfferPrice || form.pack.Price || 0) : 0;
    const chip = (active) => `btn btn-sm ${active ? "btn-success" : "btn-outline-secondary"}`;

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
                            <h2>Unlock deals {unlocks && <span className={classes.count}>{unlocks.length}</span>}</h2>
                            <span className={classes.muted}>
                                A product at a special price (FREE, ₹1, ₹9…) once the rest of the cart reaches a value. The app shows them on
                                "Unlock deals", in tabs by deal price.
                            </span>
                        </div>
                        <button className="btn btn-success" onClick={openAdd}>
                            <FaPlus /> Add deal
                        </button>
                    </div>

                    {tabs.length > 0 && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                            {tabs.map(([label, live]) => (
                                <span key={label} style={{ background: "#dcfce7", color: "#166534", borderRadius: 14, padding: "4px 12px", fontWeight: 700 }}>
                                    {label} items · {live} live
                                </span>
                            ))}
                        </div>
                    )}

                    <div className={classes.card}>
                        {unlocks === null ? (
                            <span className={classes.muted}>Loading…</span>
                        ) : unlocks.length === 0 ? (
                            <span className={classes.muted}>No deals yet. Add one, e.g. a tea pack for ₹1 when the cart crosses ₹299.</span>
                        ) : (
                            <table className={classes.table}>
                                <thead>
                                    <tr><th>Product</th><th>Deal price</th><th>Unlocks at cart</th><th>Limit / order</th><th>Window</th><th>Stock</th><th>Live</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {unlocks.map((u) => (
                                        <tr key={u.UnlockID}>
                                            <td>
                                                <strong>{u.ProductName}</strong>
                                                <div className={classes.muted}>{unitOf(u)} · normally ₹{Number(u.OfferPrice || u.Price)}</div>
                                                {(u.UnlockMessage || u.Message) && <div style={{ fontSize: 12, color: "#166534" }}>{u.UnlockMessage || u.Message}</div>}
                                            </td>
                                            <td><span style={{ fontWeight: 800, color: "#15803d" }}>{tabLabel(u.UnlockPrice)}</span></td>
                                            <td><FaUnlock size={12} /> ₹{Number(u.ThresholdAmount)}</td>
                                            <td>{u.MaxQtyPerOrder || 1}</td>
                                            <td style={{ fontSize: 13 }}>
                                                {u.StartDate ? new Date(u.StartDate).toLocaleDateString("en-IN") : "Now"} – {u.EndDate ? new Date(u.EndDate).toLocaleDateString("en-IN") : "No end"}
                                            </td>
                                            <td className={Number(u.AvailableQty) <= 0 ? classes.hot : ""}>{Number(u.AvailableQty) <= 0 ? "Out" : u.AvailableQty}</td>
                                            <td>
                                                <div className="form-check form-switch m-0">
                                                    <input className="form-check-input" type="checkbox" checked={Number(u.Status) === 1} onChange={() => toggle(u)} />
                                                </div>
                                            </td>
                                            <td style={{ whiteSpace: "nowrap" }}>
                                                <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(u)}><FaEdit /></button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => remove(u)}><FaTrash /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {modal && (
                <div className="modal d-block" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => !saving && setModal(false)}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{editId ? "Edit deal" : "Add deal"}</h5>
                                <button type="button" className="btn-close" onClick={() => setModal(false)} disabled={saving} />
                            </div>
                            <div className="modal-body">
                                <div className="row g-4">
                                    <div className="col-md-7">
                                        <label className="form-label fw-bold">1. Product pack</label>
                                        {form.pack ? (
                                            <div className="d-flex align-items-center justify-content-between border rounded p-2 mb-2" style={{ background: "#f0fdf4" }}>
                                                <div>
                                                    <div className="fw-bold">{form.pack.ProductName}</div>
                                                    <div className={classes.muted}>#{form.pack.ProductID} · {form.pack.Unit} · ₹{regular} · {form.pack.AvailableQty} in stock</div>
                                                </div>
                                                <button className="btn btn-sm btn-link" onClick={() => set({ pack: null })}>Change</button>
                                            </div>
                                        ) : (
                                            <>
                                                <input
                                                    type="search"
                                                    autoFocus
                                                    className="form-control"
                                                    placeholder="Search product name, pack or product ID"
                                                    value={packSearch}
                                                    onChange={(e) => setPackSearch(e.target.value)}
                                                />
                                                <div className="border rounded mt-1" style={{ maxHeight: 220, overflowY: "auto" }}>
                                                    {packSearch.trim() === "" ? (
                                                        <div className="p-2 text-muted small">Type to find the product.</div>
                                                    ) : packMatches.length === 0 ? (
                                                        <div className="p-2 text-muted small">No product matches.</div>
                                                    ) : (
                                                        packMatches.map((p) => (
                                                            <button
                                                                key={p.VariantID}
                                                                type="button"
                                                                className="d-flex w-100 align-items-center gap-2 border-0 border-bottom bg-white text-start px-2 py-2"
                                                                onClick={() => set({ pack: p })}
                                                            >
                                                                {p.ImageUrl && <img src={p.ImageUrl} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />}
                                                                <span className="flex-grow-1">{p.ProductName} <span className="text-muted">· {p.Unit}</span></span>
                                                                <span className="text-muted small">₹{Number(p.OfferPrice || p.Price)} · {p.AvailableQty <= 0 ? "out" : `${p.AvailableQty} left`}</span>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        <label className="form-label fw-bold mt-3">2. Deal price (the app tab)</label>
                                        <div className="d-flex gap-1 flex-wrap mb-2">
                                            {PRICE_CHIPS.map((p) => (
                                                <button key={p} type="button" className={chip(form.unlockPrice === String(p))} onClick={() => set({ unlockPrice: String(p) })}>
                                                    {tabLabel(p)}
                                                </button>
                                            ))}
                                        </div>
                                        <input type="number" min="0" step="0.5" className="form-control" placeholder="Or type a price"
                                            value={form.unlockPrice} onChange={(e) => set({ unlockPrice: e.target.value })} />
                                        {form.pack && form.unlockPrice !== "" && Number(form.unlockPrice) >= regular && (
                                            <small className="text-danger">Must be below the normal price (₹{regular}).</small>
                                        )}

                                        <label className="form-label fw-bold mt-3">3. Unlocks when the cart reaches (₹)</label>
                                        <div className="d-flex gap-1 flex-wrap mb-2">
                                            {CART_CHIPS.map((v) => (
                                                <button key={v} type="button" className={chip(form.thresholdAmount === String(v))} onClick={() => set({ thresholdAmount: String(v) })}>
                                                    ₹{v}
                                                </button>
                                            ))}
                                        </div>
                                        <input type="number" min="1" className="form-control" placeholder="Or type a cart value"
                                            value={form.thresholdAmount} onChange={(e) => set({ thresholdAmount: e.target.value })} />
                                        <small className="text-muted">Other items in the cart count towards this, not the deal item itself.</small>

                                        <div className="row mt-3">
                                            <div className="col-6">
                                                <label className="form-label fw-bold">Limit per order</label>
                                                <input type="number" min="1" max="20" className="form-control" value={form.maxQty} onChange={(e) => set({ maxQty: e.target.value })} />
                                                <small className="text-muted">Extra units are charged the normal price.</small>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label fw-bold">Live</label>
                                                <select className="form-select" value={form.status} onChange={(e) => set({ status: Number(e.target.value) })}>
                                                    <option value={1}>Live</option>
                                                    <option value={0}>Paused</option>
                                                </select>
                                            </div>
                                        </div>
                                        <label className="form-label fw-bold mt-3">Message (optional)</label>
                                        <input className="form-control" maxLength={255} placeholder="e.g. Diwali special" value={form.message} onChange={(e) => set({ message: e.target.value })} />
                                        <div className="row mt-3">
                                            <div className="col-6">
                                                <label className="form-label">Starts</label>
                                                <input type="datetime-local" className="form-control" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label">Ends</label>
                                                <input type="datetime-local" className="form-control" value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-5">
                                        <label className="form-label fw-bold">Preview in the app</label>
                                        <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
                                            <div style={{ background: "linear-gradient(135deg,#14532d,#16a34a)", color: "#fff", padding: "12px 14px", fontWeight: 800 }}>
                                                {form.unlockPrice === "" ? "Deal" : tabLabel(form.unlockPrice)} Items
                                            </div>
                                            <div style={{ padding: 14 }}>
                                                <div style={{ background: "#f8fafc", borderRadius: 12, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    {form.pack && form.pack.ImageUrl ? <img src={form.pack.ImageUrl} alt="" style={{ maxHeight: 100, maxWidth: "80%" }} /> : <span className="text-muted">No product</span>}
                                                </div>
                                                <div className="text-center small mt-2" style={{ background: "#f1f5f9", borderRadius: 6 }}>{form.pack ? form.pack.Unit : "—"}</div>
                                                <div className="fw-semibold mt-2">{form.pack ? form.pack.ProductName : "Product name"}</div>
                                                <div style={{ height: 5, borderRadius: 4, background: "#dcfce7", marginTop: 10 }}>
                                                    <div style={{ width: "45%", height: 5, borderRadius: 4, background: "#16a34a" }} />
                                                </div>
                                                <div className="small fw-semibold text-muted mt-1">
                                                    Add ₹{form.thresholdAmount || "…"} worth of items to unlock
                                                </div>
                                                <div className="mt-1">
                                                    <span style={{ fontSize: 20, fontWeight: 800 }}>{form.unlockPrice === "" ? "₹…" : tabLabel(form.unlockPrice)}</span>{" "}
                                                    {form.pack && <s className="text-muted">₹{regular}</s>}
                                                </div>
                                                <div className="small text-muted">Limit {form.maxQty || 1} per order</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setModal(false)} disabled={saving}>Cancel</button>
                                <button className="btn btn-success" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save deal"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProductUnlocks;
