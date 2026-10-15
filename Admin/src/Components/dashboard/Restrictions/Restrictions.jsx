import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import ScaleLoader from "react-spinners/ScaleLoader";
import { FaPlus, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";

function Restrictions() {
    const [restrictions, setRestrictions] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedType, setSelectedType] = useState("");
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);

    const [formData, setFormData] = useState({
        ProductID: "",
        VariantID: "",
        RestrictionType: "no_cashback",
        RestrictionValue: "",
        Status: 1
    });

    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const loadRestrictions = (type = "") => {
        setLoading(true);
        const query = type ? `?RestrictionType=${type}` : "";
        Services.getProductRestrictions("GET", null, token, query)
            .then((res) => {
                setLoading(false);
                if (res.Status === 1) {
                    setRestrictions(res.Restrictions || []);
                } else {
                    toast.error(res.Message || "Failed to load product restrictions");
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Error loading restrictions:", err);
            });
    };

    const loadProducts = () => {
        Services.getAllProducts("GET", null, token)
            .then((res) => {
                if (res.Status === 1 && res.Products) {
                    setProducts(res.Products || []);
                }
            })
            .catch((err) => console.error("Error loading products:", err));
    };

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        loadRestrictions(selectedType);
    }, [selectedType]);

    const handleOpenCreate = () => {
        setFormData({
            ProductID: products[0] ? products[0].ProductID : "",
            VariantID: "",
            RestrictionType: selectedType || "no_cashback",
            RestrictionValue: "",
            Status: 1
        });
        setModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.ProductID) {
            toast.error("Please select a product");
            return;
        }

        const payload = JSON.stringify({
            ...formData,
            ProductID: parseInt(formData.ProductID, 10),
            VariantID: formData.VariantID ? parseInt(formData.VariantID, 10) : null
        });

        Services.addProductRestriction("POST", payload, token)
            .then((res) => {
                if (res.Status === 1) {
                    toast.success("Restriction rule saved successfully");
                    setModal(false);
                    loadRestrictions(selectedType);
                } else {
                    toast.error(res.Message || "Failed to save restriction");
                }
            })
            .catch((err) => toast.error("Error saving restriction"));
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to remove this product restriction?")) {
            Services.deleteProductRestriction("DELETE", null, token, id)
                .then((res) => {
                    if (res.Status === 1) {
                        toast.success("Restriction removed successfully");
                        loadRestrictions(selectedType);
                    } else {
                        toast.error(res.Message || "Failed to remove restriction");
                    }
                })
                .catch((err) => toast.error("Error removing restriction"));
        }
    };

    const handleToggleStatus = (item) => {
        const newStatus = item.Status === 1 ? 0 : 1;
        const payload = JSON.stringify({ Status: newStatus });
        Services.updateProductRestriction("PUT", payload, token, item.ID)
            .then((res) => {
                if (res.Status === 1) {
                    toast.success(`Restriction ${newStatus === 1 ? 'activated' : 'disabled'}`);
                    loadRestrictions(selectedType);
                } else {
                    toast.error(res.Message || "Failed to update status");
                }
            })
            .catch((err) => toast.error("Error updating status"));
    };

    const getTypeName = (type) => {
        switch (type) {
            case "no_cashback":
                return "Cashback Exclusion";
            case "no_coupon":
                return "Coupon Exclusion";
            case "no_membership":
                return "Membership Price Exclusion";
            default:
                return type;
        }
    };

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="restrictions" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <div>
                            <h2 style={{ fontWeight: "700", color: "#1f2937", margin: 0 }}>Product Restrictions & Exclusions</h2>
                            <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>Manage Cashback and Coupon exclusions per product</p>
                        </div>
                        <button
                            onClick={handleOpenCreate}
                            style={{
                                background: "#dc2626",
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
                            <FaPlus /> Add Product Restriction
                        </button>
                    </div>

                    <div style={{ background: "#fff", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                        <label style={{ fontWeight: "600", color: "#374151" }}>Filter by Restriction Type:</label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", minWidth: "250px" }}
                        >
                            <option value="">-- All Restrictions --</option>
                            <option value="no_cashback">Cashback Exclusion (No Cashback)</option>
                            <option value="no_coupon">Coupon Exclusion (No Coupon)</option>
                            <option value="no_membership">Membership Pricing Exclusion</option>
                        </select>
                        <button
                            onClick={() => setSelectedType("")}
                            style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer" }}
                        >
                            Clear Filter
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "3rem" }}>
                            <ScaleLoader color="#dc2626" />
                        </div>
                    ) : (
                        <div style={{ background: "#fff", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                <thead>
                                    <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", color: "#4b5563", fontSize: "0.875rem" }}>
                                        <th style={{ padding: "12px 16px" }}>Rule ID</th>
                                        <th style={{ padding: "12px 16px" }}>Product Name</th>
                                        <th style={{ padding: "12px 16px" }}>Restriction Type</th>
                                        <th style={{ padding: "12px 16px" }}>Status</th>
                                        <th style={{ padding: "12px 16px" }}>Created Date</th>
                                        <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {restrictions.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
                                                No restrictions configured. Click "Add Product Restriction" to exclude a product.
                                            </td>
                                        </tr>
                                    ) : (
                                        restrictions.map((r) => (
                                            <tr key={r.ID} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                                <td style={{ padding: "12px 16px", fontWeight: "600" }}>#{r.ID}</td>
                                                <td style={{ padding: "12px 16px" }}>
                                                    <div style={{ fontWeight: "600", color: "#111827" }}>{r.ProductName}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Product ID: {r.ProductID}</div>
                                                </td>
                                                <td style={{ padding: "12px 16px" }}>
                                                    <span style={{
                                                        background: r.RestrictionType === "no_cashback" ? "#fef3c7" : "#fee2e2",
                                                        color: r.RestrictionType === "no_cashback" ? "#92400e" : "#991b1b",
                                                        padding: "4px 8px",
                                                        borderRadius: "4px",
                                                        fontWeight: "600",
                                                        fontSize: "0.8rem"
                                                    }}>
                                                        {getTypeName(r.RestrictionType)}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "12px 16px" }}>
                                                    <span style={{
                                                        background: r.Status === 1 ? "#d1fae5" : "#fee2e2",
                                                        color: r.Status === 1 ? "#065f46" : "#991b1b",
                                                        padding: "4px 8px",
                                                        borderRadius: "4px",
                                                        fontSize: "0.75rem",
                                                        fontWeight: "600"
                                                    }}>
                                                        {r.Status === 1 ? "Active" : "Disabled"}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#6b7280" }}>
                                                    {new Date(r.CreatedAt).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                                    <button
                                                        onClick={() => handleToggleStatus(r)}
                                                        style={{ background: "none", border: "none", cursor: "pointer", color: r.Status === 1 ? "#059669" : "#9ca3af", marginRight: "10px", fontSize: "1.2rem" }}
                                                        title="Toggle Active/Disabled"
                                                    >
                                                        {r.Status === 1 ? <FaToggleOn /> : <FaToggleOff />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(r.ID)}
                                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}
                                                        title="Delete Restriction"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
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
                            <div style={{ background: "#fff", padding: "2rem", borderRadius: "12px", width: "480px", maxWidth: "90%" }}>
                                <h3 style={{ marginBottom: "1.5rem", fontWeight: "700" }}>Add Product Restriction</h3>
                                <form onSubmit={handleSubmit}>
                                    <div style={{ marginBottom: "1rem" }}>
                                        <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem" }}>Product *</label>
                                        <select
                                            value={formData.ProductID}
                                            onChange={(e) => setFormData({ ...formData, ProductID: e.target.value })}
                                            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                            required
                                        >
                                            <option value="">-- Select Product --</option>
                                            {products.map((p) => (
                                                <option key={p.ProductID} value={p.ProductID}>
                                                    {p.ProductName} (ID: {p.ProductID})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: "1rem" }}>
                                        <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem" }}>Restriction Type *</label>
                                        <select
                                            value={formData.RestrictionType}
                                            onChange={(e) => setFormData({ ...formData, RestrictionType: e.target.value })}
                                            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                            required
                                        >
                                            <option value="no_cashback">No Cashback (Cashback Product Exclusion)</option>
                                            <option value="no_coupon">No Coupon (Coupon Product Exclusion)</option>
                                            <option value="no_membership">No Membership Pricing</option>
                                        </select>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.5rem" }}>
                                        <button
                                            type="button"
                                            onClick={() => setModal(false)}
                                            style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer" }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            style={{ padding: "8px 20px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                                        >
                                            Save Restriction
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

export default Restrictions;
