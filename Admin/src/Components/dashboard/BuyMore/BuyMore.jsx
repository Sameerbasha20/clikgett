import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import ScaleLoader from "react-spinners/ScaleLoader";
import { FaPlus, FaTrash, FaEdit, FaToggleOn, FaToggleOff } from "react-icons/fa";

function BuyMore() {
    const [tiers, setTiers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editingTier, setEditingTier] = useState(null);

    // Form State for Quantity-Specific Pricing
    const [selectedModalProduct, setSelectedModalProduct] = useState("");
    const [quantityTiers, setQuantityTiers] = useState([
        { Quantity: "2", Price: "" },
        { Quantity: "5", Price: "" }
    ]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState(1);

    const [productsLoading, setProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState("");

    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const loadTiers = (prodId = "") => {
        setLoading(true);
        Services.getBuyMoreTiers("GET", null, token, prodId)
            .then((res) => {
                setLoading(false);
                if (res.Status === 1) {
                    setTiers(res.Tiers || []);
                } else {
                    toast.error(res.Message || "Failed to load pricing tiers");
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Error loading tiers:", err);
            });
    };

    const loadProducts = () => {
        setProductsLoading(true);
        setProductsError("");
        Services.getAllProducts("GET", null, token)
            .then((res) => {
                setProductsLoading(false);
                if (res.Status === 1 && res.Products) {
                    setProducts(res.Products || []);
                } else {
                    setProductsError(res.Message || "Failed to load products");
                }
            })
            .catch((err) => {
                setProductsLoading(false);
                setProductsError("Error loading products");
                console.error("Error loading products:", err);
            });
    };

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        loadTiers(selectedProduct);
    }, [selectedProduct]);

    const handleOpenCreate = () => {
        setEditingTier(null);
        setSelectedModalProduct(selectedProduct || (products[0] ? String(products[0].ProductID) : ""));
        setQuantityTiers([
            { Quantity: "2", Price: "" },
            { Quantity: "5", Price: "" }
        ]);
        setStartDate("");
        setEndDate("");
        setStatus(1);
        setModal(true);
    };

    const handleOpenEdit = (tier) => {
        setEditingTier(tier);
        setSelectedModalProduct(String(tier.ProductID));
        setQuantityTiers([
            { Quantity: String(tier.MinQuantity || tier.Quantity || "1"), Price: String(tier.Price) }
        ]);
        setStartDate(tier.StartDate ? tier.StartDate.substring(0, 10) : "");
        setEndDate(tier.EndDate ? tier.EndDate.substring(0, 10) : "");
        setStatus(tier.Status);
        setModal(true);
    };

    const handleAddTierRow = () => {
        setQuantityTiers([...quantityTiers, { Quantity: "", Price: "" }]);
    };

    const handleRemoveTierRow = (index) => {
        if (quantityTiers.length > 1) {
            setQuantityTiers(quantityTiers.filter((_, i) => i !== index));
        } else {
            toast.warning("At least one quantity price point is required");
        }
    };

    const handleTierChange = (index, field, value) => {
        const updated = [...quantityTiers];
        updated[index][field] = value;
        setQuantityTiers(updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!selectedModalProduct) {
            toast.error("Please select a product");
            return;
        }

        const seenQuantities = new Set();
        const parsedTiers = [];

        for (let i = 0; i < quantityTiers.length; i++) {
            const row = quantityTiers[i];
            const q = parseInt(row.Quantity, 10);
            const p = parseFloat(row.Price);

            if (isNaN(q) || q < 1) {
                toast.error(`Row ${i + 1}: Quantity must be at least 1`);
                return;
            }
            if (seenQuantities.has(q)) {
                toast.error(`Duplicate Quantity ${q} in configuration. Each quantity must be unique.`);
                return;
            }
            seenQuantities.add(q);

            if (isNaN(p) || p < 0) {
                toast.error(`Row ${i + 1}: Offer Price must be a valid non-negative number`);
                return;
            }

            parsedTiers.push({ Quantity: q, Price: p });
        }

        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
            toast.error("End Date cannot be before Start Date");
            return;
        }

        if (editingTier) {
            // Update single tier
            const payload = JSON.stringify({
                ProductID: parseInt(selectedModalProduct, 10),
                Quantity: parsedTiers[0].Quantity,
                Price: parsedTiers[0].Price,
                Status: status,
                StartDate: startDate || null,
                EndDate: endDate || null
            });

            Services.updateBuyMoreTier("PUT", payload, token, editingTier.ID)
                .then((res) => {
                    if (res.Status === 1) {
                        toast.success("Buy More pricing tier updated successfully");
                        setModal(false);
                        loadTiers(selectedProduct);
                    } else {
                        toast.error(res.Message || "Failed to update tier");
                    }
                })
                .catch((err) => toast.error("Error updating tier"));
        } else {
            // Bulk save all quantity-price points for the product
            const payload = JSON.stringify({
                ProductID: parseInt(selectedModalProduct, 10),
                items: parsedTiers,
                StartDate: startDate || null,
                EndDate: endDate || null,
                Status: status
            });

            Services.saveProductTiers("POST", payload, token)
                .then((res) => {
                    if (res.Status === 1) {
                        toast.success(res.Message || "Buy More pricing saved successfully");
                        setModal(false);
                        loadTiers(selectedProduct);
                    } else {
                        toast.error(res.Message || "Failed to save pricing");
                    }
                })
                .catch((err) => toast.error("Error saving pricing"));
        }
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this pricing tier?")) {
            Services.deleteBuyMoreTier("DELETE", null, token, id)
                .then((res) => {
                    if (res.Status === 1) {
                        toast.success("Tier deleted successfully");
                        loadTiers(selectedProduct);
                    } else {
                        toast.error(res.Message || "Failed to delete tier");
                    }
                })
                .catch((err) => toast.error("Error deleting tier"));
        }
    };

    const handleToggleStatus = (tier) => {
        const newStatus = tier.Status === 1 ? 0 : 1;
        const payload = JSON.stringify({ Status: newStatus });
        Services.updateBuyMoreTier("PUT", payload, token, tier.ID)
            .then((res) => {
                if (res.Status === 1) {
                    toast.success(`Tier ${newStatus === 1 ? 'activated' : 'disabled'}`);
                    loadTiers(selectedProduct);
                } else {
                    toast.error(res.Message || "Failed to update status");
                }
            })
            .catch((err) => toast.error("Error updating status"));
    };

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="buymore" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <div>
                            <h2 style={{ fontWeight: "700", color: "#1f2937", margin: 0 }}>Buy More Pricing</h2>
                            <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>Configure quantity-specific offer prices for bulk and bundle purchases</p>
                        </div>
                        <button
                            onClick={handleOpenCreate}
                            style={{
                                background: "#059669",
                                color: "#fff",
                                border: "none",
                                padding: "10px 20px",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                cursor: "pointer",
                                fontWeight: "600"
                            }}
                        >
                            <FaPlus /> Add Buy More Pricing
                        </button>
                    </div>

                    <div style={{ background: "#fff", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                        <label style={{ fontWeight: "600", color: "#374151" }}>Filter by Product:</label>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", minWidth: "250px" }}
                            disabled={productsLoading}
                        >
                            <option value="">-- All Products --</option>
                            {products.map((p) => (
                                <option key={p.ProductID} value={p.ProductID}>
                                    {p.ProductName} (ID: {p.ProductID})
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => setSelectedProduct("")}
                            style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer" }}
                        >
                            Clear Filter
                        </button>
                        {productsLoading && <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Loading products...</span>}
                        {productsError && <span style={{ fontSize: "0.85rem", color: "#ef4444" }}>{productsError}</span>}
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "3rem" }}>
                            <ScaleLoader color="#059669" />
                        </div>
                    ) : (
                        <div style={{ background: "#fff", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                <thead>
                                    <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", color: "#4b5563", fontSize: "0.875rem" }}>
                                        <th style={{ padding: "12px 16px" }}>Tier ID</th>
                                        <th style={{ padding: "12px 16px" }}>Product</th>
                                        <th style={{ padding: "12px 16px" }}>Quantity</th>
                                        <th style={{ padding: "12px 16px" }}>Offer Price (₹)</th>
                                        <th style={{ padding: "12px 16px" }}>Effective Unit Price</th>
                                        <th style={{ padding: "12px 16px" }}>Status</th>
                                        <th style={{ padding: "12px 16px" }}>Validity</th>
                                        <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tiers.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
                                                No Buy More pricing tiers found. Click "Add Buy More Pricing" to configure quantity pricing.
                                            </td>
                                        </tr>
                                    ) : (
                                        tiers.map((t) => {
                                            const qty = t.MinQuantity || t.Quantity || 1;
                                            const price = parseFloat(t.Price || 0);
                                            const unitRate = qty > 0 ? (price / qty).toFixed(2) : price.toFixed(2);
                                            return (
                                                <tr key={t.ID} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                                    <td style={{ padding: "12px 16px", fontWeight: "600" }}>#{t.ID}</td>
                                                    <td style={{ padding: "12px 16px" }}>
                                                        <div style={{ fontWeight: "600", color: "#111827" }}>{t.ProductName || `Product #${t.ProductID}`}</div>
                                                        {t.metricvalue && (
                                                            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{t.metricvalue} {t.metrictype}</div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: "12px 16px" }}>
                                                        <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "4px 10px", borderRadius: "4px", fontWeight: "700" }}>
                                                            Quantity {qty}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "12px 16px", fontWeight: "700", color: "#059669", fontSize: "1rem" }}>
                                                        ₹{price.toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: "12px 16px", color: "#4b5563", fontSize: "0.875rem" }}>
                                                        ₹{unitRate} / unit
                                                    </td>
                                                    <td style={{ padding: "12px 16px" }}>
                                                        <span style={{
                                                            background: t.Status === 1 ? "#d1fae5" : "#fee2e2",
                                                            color: t.Status === 1 ? "#065f46" : "#991b1b",
                                                            padding: "4px 8px",
                                                            borderRadius: "4px",
                                                            fontSize: "0.75rem",
                                                            fontWeight: "600"
                                                        }}>
                                                            {t.Status === 1 ? "Active" : "Disabled"}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#6b7280" }}>
                                                        {t.StartDate ? new Date(t.StartDate).toLocaleDateString() : "Anytime"} - {t.EndDate ? new Date(t.EndDate).toLocaleDateString() : "Never"}
                                                    </td>
                                                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                                        <button
                                                            onClick={() => handleToggleStatus(t)}
                                                            style={{ background: "none", border: "none", cursor: "pointer", color: t.Status === 1 ? "#059669" : "#9ca3af", marginRight: "10px", fontSize: "1.2rem" }}
                                                            title="Toggle Active/Disabled"
                                                        >
                                                            {t.Status === 1 ? <FaToggleOn /> : <FaToggleOff />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenEdit(t)}
                                                            style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", marginRight: "10px" }}
                                                            title="Edit Tier"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(t.ID)}
                                                            style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}
                                                            title="Delete Tier"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Modal */}
                    {modal && (
                        <div style={{
                            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                            background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999
                        }}>
                            <div style={{ background: "#fff", padding: "2rem", borderRadius: "12px", width: "520px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" }}>
                                <h3 style={{ marginBottom: "1.5rem", fontWeight: "700" }}>{editingTier ? "Edit Quantity Pricing" : "Add Buy More Pricing"}</h3>
                                <form onSubmit={handleSubmit}>
                                    <div style={{ marginBottom: "1.25rem" }}>
                                        <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "0.875rem" }}>Product</label>
                                        <select
                                            disabled={!!editingTier}
                                            value={selectedModalProduct}
                                            onChange={(e) => setSelectedModalProduct(e.target.value)}
                                            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                            required
                                        >
                                            <option value="">{productsLoading ? "Loading products..." : "-- Select Product --"}</option>
                                            {products.map((p) => (
                                                <option key={p.ProductID} value={p.ProductID}>
                                                    {p.ProductName} (ID: {p.ProductID})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: "1.25rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                            <label style={{ fontWeight: "600", fontSize: "0.875rem", margin: 0 }}>Quantity Pricing</label>
                                            {!editingTier && (
                                                <button
                                                    type="button"
                                                    onClick={handleAddTierRow}
                                                    style={{
                                                        background: "#eff6ff",
                                                        color: "#2563eb",
                                                        border: "1px solid #bfdbfe",
                                                        borderRadius: "4px",
                                                        padding: "4px 8px",
                                                        fontSize: "0.75rem",
                                                        fontWeight: "600",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "4px"
                                                    }}
                                                >
                                                    <FaPlus size={10} /> Add Quantity Price
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ background: "#f9fafb", padding: "12px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: "8px", marginBottom: "6px", fontSize: "0.75rem", fontWeight: "600", color: "#4b5563" }}>
                                                <span>Quantity</span>
                                                <span>Offer Price (₹)</span>
                                                <span></span>
                                            </div>

                                            {quantityTiers.map((row, idx) => (
                                                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={row.Quantity}
                                                        onChange={(e) => handleTierChange(idx, "Quantity", e.target.value)}
                                                        placeholder="e.g. 2"
                                                        style={{ width: "100%", padding: "6px 10px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "0.875rem" }}
                                                        required
                                                    />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={row.Price}
                                                        onChange={(e) => handleTierChange(idx, "Price", e.target.value)}
                                                        placeholder="e.g. 30.00"
                                                        style={{ width: "100%", padding: "6px 10px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "0.875rem" }}
                                                        required
                                                    />
                                                    {!editingTier && quantityTiers.length > 1 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveTierRow(idx)}
                                                            style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                                                            title="Remove row"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    ) : <div></div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                                        <div>
                                            <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem" }}>Start Date</label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem" }}>End Date</label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                        <button
                                            type="button"
                                            onClick={() => setModal(false)}
                                            style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer" }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            style={{ padding: "8px 20px", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                                        >
                                            {editingTier ? "Update Pricing" : "Save Pricing"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BuyMore;
