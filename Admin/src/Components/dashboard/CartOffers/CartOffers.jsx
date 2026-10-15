import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import ScaleLoader from "react-spinners/ScaleLoader";
import { FaPlus, FaTrash, FaEdit, FaToggleOn, FaToggleOff } from "react-icons/fa";

function CartOffers() {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);

    const [formData, setFormData] = useState({
        OfferName: "",
        ThresholdAmount: "",
        OfferType: "flat_discount",
        OfferValue: "",
        StartDate: "",
        EndDate: "",
        Status: 1
    });

    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const loadOffers = () => {
        setLoading(true);
        Services.getCartOffers("GET", null, token)
            .then((res) => {
                setLoading(false);
                if (res.Status === 1) {
                    setOffers(res.Offers || []);
                } else {
                    toast.error(res.Message || "Failed to load cart offers");
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Error loading cart offers:", err);
            });
    };

    useEffect(() => {
        loadOffers();
    }, []);

    const handleOpenCreate = () => {
        setEditingOffer(null);
        setFormData({
            OfferName: "",
            ThresholdAmount: "",
            OfferType: "flat_discount",
            OfferValue: "",
            StartDate: "",
            EndDate: "",
            Status: 1
        });
        setModal(true);
    };

    const handleOpenEdit = (offer) => {
        setEditingOffer(offer);
        setFormData({
            OfferName: offer.OfferName,
            ThresholdAmount: offer.ThresholdAmount,
            OfferType: offer.OfferType,
            OfferValue: offer.OfferValue,
            StartDate: offer.StartDate ? offer.StartDate.substring(0, 10) : "",
            EndDate: offer.EndDate ? offer.EndDate.substring(0, 10) : "",
            Status: offer.Status
        });
        setModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const threshold = parseFloat(formData.ThresholdAmount);
        const val = parseFloat(formData.OfferValue);

        if (!formData.OfferName || !formData.OfferName.trim()) {
            toast.error("Offer name is required");
            return;
        }
        if (isNaN(threshold) || threshold <= 0) {
            toast.error("Threshold amount must be greater than 0");
            return;
        }
        if (isNaN(val) || val < 0) {
            toast.error("Offer value must be a valid non-negative number");
            return;
        }

        const payload = JSON.stringify({
            ...formData,
            ThresholdAmount: threshold,
            OfferValue: val
        });

        if (editingOffer) {
            Services.updateCartOffer("PUT", payload, token, editingOffer.OfferID)
                .then((res) => {
                    if (res.Status === 1) {
                        toast.success("Cart offer updated successfully");
                        setModal(false);
                        loadOffers();
                    } else {
                        toast.error(res.Message || "Failed to update offer");
                    }
                })
                .catch((err) => toast.error("Error updating offer"));
        } else {
            Services.createCartOffer("POST", payload, token)
                .then((res) => {
                    if (res.Status === 1) {
                        toast.success("Cart offer created successfully");
                        setModal(false);
                        loadOffers();
                    } else {
                        toast.error(res.Message || "Failed to create offer");
                    }
                })
                .catch((err) => toast.error("Error creating offer"));
        }
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this cart offer?")) {
            Services.deleteCartOffer("DELETE", null, token, id)
                .then((res) => {
                    if (res.Status === 1) {
                        toast.success("Cart offer deleted successfully");
                        loadOffers();
                    } else {
                        toast.error(res.Message || "Failed to delete offer");
                    }
                })
                .catch((err) => toast.error("Error deleting offer"));
        }
    };

    const handleToggleStatus = (offer) => {
        const newStatus = offer.Status === 1 ? 0 : 1;
        const payload = JSON.stringify({ Status: newStatus });
        Services.updateCartOffer("PUT", payload, token, offer.OfferID)
            .then((res) => {
                if (res.Status === 1) {
                    toast.success(`Offer ${newStatus === 1 ? 'activated' : 'disabled'}`);
                    loadOffers();
                } else {
                    toast.error(res.Message || "Failed to update status");
                }
            })
            .catch((err) => toast.error("Error updating status"));
    };

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="cartoffers" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <div>
                            <h2 style={{ fontWeight: "700", color: "#1f2937", margin: 0 }}>Cart Threshold Offers</h2>
                            <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>Configure dynamic cart value threshold discounts and rewards</p>
                        </div>
                        <button
                            onClick={handleOpenCreate}
                            style={{
                                background: "#4f46e5",
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
                            <FaPlus /> Create Cart Offer
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "3rem" }}>
                            <ScaleLoader color="#4f46e5" />
                        </div>
                    ) : (
                        <div style={{ background: "#fff", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                <thead>
                                    <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", color: "#4b5563", fontSize: "0.875rem" }}>
                                        <th style={{ padding: "12px 16px" }}>Offer ID</th>
                                        <th style={{ padding: "12px 16px" }}>Offer Name</th>
                                        <th style={{ padding: "12px 16px" }}>Cart Threshold</th>
                                        <th style={{ padding: "12px 16px" }}>Offer Value / Type</th>
                                        <th style={{ padding: "12px 16px" }}>Status</th>
                                        <th style={{ padding: "12px 16px" }}>Validity Period</th>
                                        <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {offers.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
                                                No cart threshold offers created yet. Click "Create Cart Offer" to add one.
                                            </td>
                                        </tr>
                                    ) : (
                                        offers.map((o) => (
                                            <tr key={o.OfferID} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                                <td style={{ padding: "12px 16px", fontWeight: "600" }}>#{o.OfferID}</td>
                                                <td style={{ padding: "12px 16px", fontWeight: "600", color: "#111827" }}>{o.OfferName}</td>
                                                <td style={{ padding: "12px 16px" }}>
                                                    <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "4px 8px", borderRadius: "4px", fontWeight: "700" }}>
                                                        Min ₹{parseFloat(o.ThresholdAmount).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "12px 16px" }}>
                                                    <span style={{ fontWeight: "700", color: "#059669" }}>
                                                        {o.OfferType === "percentage_discount" ? `${o.OfferValue}% OFF` : `₹${parseFloat(o.OfferValue).toFixed(2)} OFF`}
                                                    </span>
                                                    <span style={{ fontSize: "0.75rem", color: "#6b7280", marginLeft: "6px" }}>({o.OfferType})</span>
                                                </td>
                                                <td style={{ padding: "12px 16px" }}>
                                                    <span style={{
                                                        background: o.Status === 1 ? "#d1fae5" : "#fee2e2",
                                                        color: o.Status === 1 ? "#065f46" : "#991b1b",
                                                        padding: "4px 8px",
                                                        borderRadius: "4px",
                                                        fontSize: "0.75rem",
                                                        fontWeight: "600"
                                                    }}>
                                                        {o.Status === 1 ? "Active" : "Disabled"}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#6b7280" }}>
                                                    {o.StartDate ? new Date(o.StartDate).toLocaleDateString() : "Always"} - {o.EndDate ? new Date(o.EndDate).toLocaleDateString() : "Always"}
                                                </td>
                                                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                                    <button
                                                        onClick={() => handleToggleStatus(o)}
                                                        style={{ background: "none", border: "none", cursor: "pointer", color: o.Status === 1 ? "#059669" : "#9ca3af", marginRight: "10px", fontSize: "1.2rem" }}
                                                        title="Toggle Active/Disabled"
                                                    >
                                                        {o.Status === 1 ? <FaToggleOn /> : <FaToggleOff />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEdit(o)}
                                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#4f46e5", marginRight: "10px" }}
                                                        title="Edit Offer"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(o.OfferID)}
                                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}
                                                        title="Delete Offer"
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
                                <h3 style={{ marginBottom: "1.5rem", fontWeight: "700" }}>{editingOffer ? "Edit Cart Offer" : "Create Cart Offer"}</h3>
                                <form onSubmit={handleSubmit}>
                                    <div style={{ marginBottom: "1rem" }}>
                                        <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem" }}>Offer Name *</label>
                                        <input
                                            type="text"
                                            value={formData.OfferName}
                                            onChange={(e) => setFormData({ ...formData, OfferName: e.target.value })}
                                            placeholder="e.g. Orders above ₹500 get ₹50 off"
                                            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                            required
                                        />
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                                        <div>
                                            <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem" }}>Cart Threshold (₹) *</label>
                                            <input
                                                type="number"
                                                min="1"
                                                step="0.01"
                                                value={formData.ThresholdAmount}
                                                onChange={(e) => setFormData({ ...formData, ThresholdAmount: e.target.value })}
                                                placeholder="e.g. 500"
                                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem" }}>Offer Type</label>
                                            <select
                                                value={formData.OfferType}
                                                onChange={(e) => setFormData({ ...formData, OfferType: e.target.value })}
                                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                            >
                                                <option value="flat_discount">Flat Discount (₹)</option>
                                                <option value="percentage_discount">Percentage Discount (%)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: "1rem" }}>
                                        <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem" }}>Offer Value *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.OfferValue}
                                            onChange={(e) => setFormData({ ...formData, OfferValue: e.target.value })}
                                            placeholder="e.g. 50 (or percentage)"
                                            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                            required
                                        />
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                                        <div>
                                            <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem" }}>Start Date</label>
                                            <input
                                                type="date"
                                                value={formData.StartDate}
                                                onChange={(e) => setFormData({ ...formData, StartDate: e.target.value })}
                                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem" }}>End Date</label>
                                            <input
                                                type="date"
                                                value={formData.EndDate}
                                                onChange={(e) => setFormData({ ...formData, EndDate: e.target.value })}
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
                                            style={{ padding: "8px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                                        >
                                            {editingOffer ? "Update Offer" : "Save Offer"}
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

export default CartOffers;
