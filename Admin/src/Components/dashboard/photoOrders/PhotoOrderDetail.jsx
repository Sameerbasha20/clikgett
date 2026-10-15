import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import styles from "./photoOrders.module.css";
import { Services, apiUrl } from "../../../Services";
import { toast } from "react-toastify";
import Moment from "react-moment";
import {
    FaArrowLeft, FaCheckCircle, FaPaperPlane, FaTimes,
    FaPlus, FaTrash, FaUserCheck, FaSearch
} from "react-icons/fa";

function PhotoOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState(null);
    const [items, setItems] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [adminNotes, setAdminNotes] = useState("");

    // Catalog search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [imageState, setImageState] = useState("loading"); // loading | ready | error

    // The image endpoint requires the admin Authorization header, which an <img src>
    // cannot send, so download it with fetch and show it from a local blob URL.
    useEffect(() => {
        if (!request?.RequestID) return undefined;
        let objectUrl = null;
        let cancelled = false;
        setImageState("loading");
        fetch(apiUrl(`admin/photo-orders/image/${request.RequestID}`), { headers: token })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.blob();
            })
            .then((blob) => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(blob);
                setImageSrc(objectUrl);
                setImageState("ready");
            })
            .catch(() => {
                if (!cancelled) setImageState("error");
            });
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [request?.RequestID]);

    const fetchDetail = () => {
        setLoading(true);
        Services.getAdminPhotoOrderDetail("GET", null, token, id)
            .then((res) => {
                if (res.Status === 1) {
                    setRequest(res.Request);
                    setItems(res.Items || []);
                    setTimeline(res.Timeline || []);
                    setAdminNotes(res.Request.AdminNotes || "");
                } else {
                    toast.error(res.Message || "Failed to load request detail");
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                toast.error("Error loading detail");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    // Claim request
    const handleClaim = () => {
        Services.claimPhotoOrder("PUT", null, token, id)
            .then((res) => {
                if (res.Status === 1) {
                    toast.success("Request claimed for review");
                    fetchDetail();
                } else {
                    toast.error(res.Message || "Failed to claim request");
                }
            })
            .catch(() => toast.error("Error claiming request"));
    };

    // Catalog search
    const handleSearchProducts = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true);
        Services.searchAdminProducts("GET", null, token, searchQuery)
            .then((res) => {
                if (res.Status === 1) {
                    setSearchResults(res.Product || []);
                } else {
                    setSearchResults([]);
                    toast.info("No matching products found");
                }
                setSearching(false);
            })
            .catch(() => {
                setSearching(false);
                toast.error("Error searching catalog");
            });
    };

    // Add item from catalog search to proposed items
    const handleAddProductToProposal = (prod) => {
        const variant = (prod.ProductVariants && prod.ProductVariants[0]) || {
            VariantID: prod.VariantID || 0,
            Price: prod.Price || prod.OfferPrice,
            OfferPrice: prod.OfferPrice || prod.Price,
            metricvalue: prod.metricvalue || "1",
            metrictype: prod.metrictype || "Unit",
            AvailableQty: prod.AvailableQty || 10
        };

        const existingIndex = items.findIndex(
            (i) => i.ProductID === prod.ProductID && i.VariantID === variant.VariantID
        );

        if (existingIndex >= 0) {
            const updated = [...items];
            updated[existingIndex].Quantity = parseInt(updated[existingIndex].Quantity) + 1;
            setItems(updated);
        } else {
            const newItem = {
                ProductID: prod.ProductID,
                VariantID: variant.VariantID,
                ProductName: prod.ProductName,
                Quantity: 1,
                UnitPrice: parseFloat(variant.OfferPrice || variant.Price || 0),
                CurrentStock: variant.AvailableQty || 0,
                metrictype: variant.metrictype,
                metricvalue: variant.metricvalue,
                AvailabilityStatus: "AVAILABLE",
                AdminNotes: ""
            };
            setItems([...items, newItem]);
        }
        setSearchResults([]);
        setSearchQuery("");
        toast.success(`Added "${prod.ProductName}" to proposal`);
    };

    // Modify item quantity
    const handleUpdateQty = (index, delta) => {
        const updated = [...items];
        const newQty = parseInt(updated[index].Quantity) + delta;
        if (newQty <= 0) {
            updated.splice(index, 1);
        } else {
            updated[index].Quantity = newQty;
        }
        setItems(updated);
    };

    // Remove item
    const handleRemoveItem = (index) => {
        const updated = [...items];
        updated.splice(index, 1);
        setItems(updated);
    };

    // Save proposal draft
    const handleSaveDraft = () => {
        if (items.length === 0) {
            toast.warn("Add at least one product before saving proposal.");
            return;
        }
        setSaving(true);
        Services.preparePhotoOrderProposal("POST", { items, adminNotes }, token, id)
            .then((res) => {
                setSaving(false);
                if (res.Status === 1) {
                    toast.success("Proposal draft saved & recalculated successfully!");
                    fetchDetail();
                } else {
                    toast.error(res.Message || "Failed to save draft");
                }
            })
            .catch(() => {
                setSaving(false);
                toast.error("Error saving draft");
            });
    };

    // Send proposal to customer
    const handleSendProposal = () => {
        if (items.length === 0) {
            toast.warn("Cannot send an empty proposal. Add products first.");
            return;
        }
        // First ensure proposal is saved
        setSaving(true);
        Services.preparePhotoOrderProposal("POST", { items, adminNotes }, token, id)
            .then((res) => {
                if (res.Status === 1) {
                    // Send to customer
                    Services.sendPhotoOrderProposal("POST", null, token, id)
                        .then((sendRes) => {
                            setSaving(false);
                            if (sendRes.Status === 1) {
                                toast.success("Proposal sent to customer for confirmation!");
                                fetchDetail();
                            } else {
                                toast.error(sendRes.Message || "Failed to send proposal");
                            }
                        })
                        .catch(() => {
                            setSaving(false);
                            toast.error("Error sending proposal");
                        });
                } else {
                    setSaving(false);
                    toast.error(res.Message || "Error preparing proposal");
                }
            });
    };

    // Cancel request
    const handleCancel = () => {
        const reason = window.prompt("Enter reason for cancelling this photo order:");
        if (reason === null) return;
        Services.cancelPhotoOrder("POST", { cancelReason: reason }, token, id)
            .then((res) => {
                if (res.Status === 1) {
                    toast.info("Photo order cancelled");
                    fetchDetail();
                } else {
                    toast.error(res.Message || "Failed to cancel");
                }
            });
    };

    if (loading) {
        return (
            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="photoOrders" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />
                    <div className={dashboardclasses.CategoryWrapper} style={{ padding: "20px", textAlign: "center" }}>
                        Loading Request Details...
                    </div>
                </div>
            </div>
        );
    }

    if (!request) {
        return (
            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="photoOrders" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />
                    <div className={dashboardclasses.CategoryWrapper} style={{ padding: "20px" }}>
                        Request not found.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="photoOrders" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ display: "block", padding: "24px" }}>
                    {/* Header bar */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <button
                                onClick={() => navigate("/photo-orders")}
                                style={{
                                    border: "1px solid #cbd5e1",
                                    background: "#fff",
                                    borderRadius: 8,
                                    padding: "6px 10px",
                                    cursor: "pointer"
                                }}
                            >
                                <FaArrowLeft />
                            </button>
                            <div>
                                <h1 className={styles.headerTitle} style={{ margin: 0, fontSize: "1.3rem" }}>
                                    Request #{request.RequestCode}
                                </h1>
                                <span className={`${styles.statusPill} ${styles["status" + request.RequestStatus]}`}>
                                    {request.RequestStatus ? request.RequestStatus.replace(/_/g, " ") : "PENDING"}
                                </span>
                            </div>
                        </div>

                        {/* Top action buttons */}
                        <div style={{ display: "flex", gap: 10 }}>
                            {request.RequestStatus === "PENDING" && (
                                <button
                                    onClick={handleClaim}
                                    style={{
                                        background: "#0284c7",
                                        color: "#fff",
                                        padding: "8px 14px",
                                        borderRadius: 6,
                                        border: "none",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6
                                    }}
                                >
                                    <FaUserCheck /> Claim for Review
                                </button>
                            )}
                            <button
                                onClick={handleCancel}
                                style={{
                                    background: "#fff",
                                    color: "#ef4444",
                                    border: "1px solid #fca5a5",
                                    padding: "8px 14px",
                                    borderRadius: 6,
                                    fontWeight: 600,
                                    cursor: "pointer"
                                }}
                            >
                                Cancel Request
                            </button>
                        </div>
                    </div>

                    {/* Dual-Pane Studio Grid */}
                    <div className={styles.studioGrid}>
                        {/* LEFT PANE: Customer Photo & Details */}
                        <div>
                            <div className={styles.card}>
                                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12, color: "#1e293b" }}>
                                    Uploaded Photo / List
                                </h3>
                                <div className={styles.imagePreviewBox}>
                                    {imageState === "ready" && (
                                        <a href={imageSrc} target="_blank" rel="noreferrer" title="Open full size">
                                            <img src={imageSrc} alt="Customer Upload" className={styles.photoImg} />
                                        </a>
                                    )}
                                    {imageState === "loading" && (
                                        <span style={{ color: "#cbd5e1" }}>Loading photo...</span>
                                    )}
                                    {imageState === "error" && (
                                        <span style={{ color: "#fca5a5", padding: 16, textAlign: "center" }}>
                                            Photo could not be loaded. It may have been removed from the server.
                                        </span>
                                    )}
                                </div>
                                <div style={{ marginTop: 16 }}>
                                    <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                                        Customer Instructions:
                                    </h4>
                                    <p style={{ background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: "0.9rem", color: "#334155" }}>
                                        {request.CustomerNotes || "No specific instructions provided by customer."}
                                    </p>
                                </div>

                                <div style={{ marginTop: 12, fontSize: "0.85rem", color: "#64748b" }}>
                                    <div><strong>Customer:</strong> {request.CustomerName} ({request.CustomerMobile})</div>
                                    <div><strong>Submitted:</strong> <Moment format="DD MMM YYYY, hh:mm A">{request.CreatedAt}</Moment></div>
                                </div>
                            </div>

                            {/* Status Timeline */}
                            <div className={styles.card}>
                                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12, color: "#1e293b" }}>
                                    Audit History & Timeline
                                </h3>
                                <ul className={styles.timelineList}>
                                    {timeline.map((t) => (
                                        <li key={t.TimelineID} className={styles.timelineItem}>
                                            <div className={styles.timelineDot} />
                                            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#1e293b" }}>
                                                {t.NewStatus ? t.NewStatus.replace(/_/g, " ") : ""}
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                                by {t.ChangedByRole} · <Moment format="DD MMM, hh:mm A">{t.CreatedAt}</Moment>
                                            </div>
                                            {t.Notes && (
                                                <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: 2 }}>
                                                    {t.Notes}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* RIGHT PANE: Proposal Studio Builder */}
                        <div>
                            <div className={styles.card}>
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>
                                    Order Proposal Studio
                                </h3>
                                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: 16 }}>
                                    Search products in catalog, match variants, adjust quantities, and generate authoritative pricing.
                                </p>

                                {/* Catalog Search Bar */}
                                <form onSubmit={handleSearchProducts} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                                    <input
                                        type="text"
                                        className={styles.searchInput}
                                        placeholder="Search catalog by name or category (e.g. Milk, Rice)..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={searching}
                                        style={{
                                            background: "#2563eb",
                                            color: "#fff",
                                            padding: "8px 16px",
                                            borderRadius: 8,
                                            border: "none",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6
                                        }}
                                    >
                                        <FaSearch size={14} /> {searching ? "Searching..." : "Search"}
                                    </button>
                                </form>

                                {/* Search Results Dropdown */}
                                {searchResults.length > 0 && (
                                    <div
                                        style={{
                                            background: "#fff",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: 8,
                                            maxHeight: 220,
                                            overflowY: "auto",
                                            marginBottom: 16,
                                            boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
                                        }}
                                    >
                                        {searchResults.map((prod) => (
                                            <div
                                                key={prod.ProductID}
                                                style={{
                                                    padding: "10px 14px",
                                                    borderBottom: "1px solid #f1f5f9",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center"
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{prod.ProductName}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                                        Price: ₹{prod.OfferPrice || prod.Price} | Category: {prod.CategoryName || "General"}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddProductToProposal(prod)}
                                                    style={{
                                                        background: "#10b981",
                                                        color: "#fff",
                                                        border: "none",
                                                        borderRadius: 6,
                                                        padding: "4px 10px",
                                                        fontSize: "0.8rem",
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 4
                                                    }}
                                                >
                                                    <FaPlus size={10} /> Add
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Proposed Items Table */}
                                <div>
                                    <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#334155", marginBottom: 10 }}>
                                        Proposed Items ({items.length})
                                    </h4>

                                    {items.length === 0 ? (
                                        <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: 8 }}>
                                            No products added to proposal yet. Search and add items from the catalog above.
                                        </div>
                                    ) : (
                                        items.map((it, idx) => (
                                            <div key={idx} className={styles.proposalItemRow}>
                                                <div style={{ flex: 2 }}>
                                                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#0f172a" }}>
                                                        {it.ProductName}
                                                    </div>
                                                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                                        Unit: ₹{parseFloat(it.UnitPrice).toFixed(2)} | In Stock: {it.CurrentStock ?? "-"}
                                                    </div>
                                                </div>

                                                {/* Quantity Stepper */}
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "center" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateQty(idx, -1)}
                                                        style={{
                                                            width: 28, height: 28, borderRadius: 4, border: "1px solid #cbd5e1",
                                                            background: "#fff", cursor: "pointer", fontWeight: 700
                                                        }}
                                                    >
                                                        -
                                                    </button>
                                                    <span style={{ fontWeight: 600, minWidth: 20, textAlign: "center" }}>
                                                        {it.Quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateQty(idx, 1)}
                                                        style={{
                                                            width: 28, height: 28, borderRadius: 4, border: "1px solid #cbd5e1",
                                                            background: "#fff", cursor: "pointer", fontWeight: 700
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                {/* Line total & remove */}
                                                <div style={{ flex: 1, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
                                                    <div style={{ fontWeight: 700, color: "#059669" }}>
                                                        ₹{(parseFloat(it.UnitPrice) * parseInt(it.Quantity)).toFixed(2)}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(idx)}
                                                        style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Order Summary Breakdown */}
                                <div className={styles.summaryBox}>
                                    <div className={styles.summaryRow}>
                                        <span>Subtotal ({items.reduce((s, i) => s + parseInt(i.Quantity), 0)} items):</span>
                                        <span>₹{parseFloat(request.SubTotal || 0).toFixed(2)}</span>
                                    </div>
                                    <div className={styles.summaryRow}>
                                        <span>Estimated Delivery Charges:</span>
                                        <span>₹{parseFloat(request.DeliveryCharges || 0).toFixed(2)}</span>
                                    </div>
                                    <div className={styles.summaryRow}>
                                        <span>Applied Discounts:</span>
                                        <span style={{ color: "#16a34a" }}>-₹{parseFloat(request.Discount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className={styles.summaryTotal}>
                                        <span>Total Proposal Amount:</span>
                                        <span style={{ color: "#2563eb" }}>₹{parseFloat(request.GrandTotal || 0).toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Notes for customer */}
                                <div style={{ marginTop: 16 }}>
                                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>
                                        Admin Message / Notes for Customer:
                                    </label>
                                    <textarea
                                        rows={3}
                                        style={{
                                            width: "100%",
                                            borderRadius: 8,
                                            border: "1px solid #cbd5e1",
                                            padding: 10,
                                            fontSize: "0.85rem"
                                        }}
                                        placeholder="Add comments on alternatives, stock status, or size substitutions..."
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                    />
                                </div>

                                {/* Bottom action buttons */}
                                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                                    <button
                                        type="button"
                                        onClick={handleSaveDraft}
                                        disabled={saving}
                                        style={{
                                            flex: 1,
                                            padding: "10px 16px",
                                            borderRadius: 8,
                                            border: "1px solid #cbd5e1",
                                            background: "#fff",
                                            color: "#1e293b",
                                            fontWeight: 600,
                                            cursor: "pointer"
                                        }}
                                    >
                                        {saving ? "Saving..." : "Save Draft"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSendProposal}
                                        disabled={saving}
                                        style={{
                                            flex: 1.5,
                                            padding: "10px 16px",
                                            borderRadius: 8,
                                            border: "none",
                                            background: "#16a34a",
                                            color: "#fff",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 8
                                        }}
                                    >
                                        <FaPaperPlane size={14} /> Send for Customer Confirmation
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PhotoOrderDetail;
