import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaEye, FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import ScaleLoader from "react-spinners/ScaleLoader";
import { useNavigate } from "react-router-dom";

function AbandonedCarts() {
    const navigate = useNavigate();
    const [cartLogs, setCartLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailModal, setDetailModal] = useState(false);
    const [selectedCart, setSelectedCart] = useState(null);
    const [parsedItems, setParsedItems] = useState([]);

    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const [sending, setSending] = useState(false);
    // Push reminders now to customers whose carts have been idle 8+ hours
    // (the server also does this automatically every hour).
    const sendReminders = async () => {
        setSending(true);
        try {
            const res = await Services.sendAbandonedCartReminders(token);
            if (res && res.Status === 1) {
                toast.success(`Checked ${res.ScannedCarts || 0} carts, sent ${res.NotificationsSent || 0} reminders`, { position: "top-center" });
                loadAbandonedCarts();
            } else {
                toast.error((res && res.Message) || "Could not send reminders", { position: "top-center" });
            }
        } catch (e) {
            toast.error("Could not reach the server", { position: "top-center" });
        }
        setSending(false);
    };

    const loadAbandonedCarts = () => {
        setLoading(true);
        Services.getAbandonedCarts("GET", null, token)
            .then((res) => {
                setLoading(false);
                if (res.Status === 1) {
                    setCartLogs(res.AbandonedCarts || []);
                } else {
                    if (res.Message === "Token expired") {
                        navigate("/");
                    }
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error(err);
            });
    };

    useEffect(() => {
        loadAbandonedCarts();
    }, []);

    const handleViewCart = (cart) => {
        setSelectedCart(cart);
        let items = [];
        try {
            if (typeof cart.CartSnapshot === "string") {
                items = JSON.parse(cart.CartSnapshot);
            } else if (Array.isArray(cart.CartSnapshot)) {
                items = cart.CartSnapshot;
            }
        } catch (e) {
            console.error("Failed to parse cart snapshot", e);
        }
        setParsedItems(Array.isArray(items) ? items : []);
        setDetailModal(true);
    };

    const handleUpdateStatus = (logId, newStatus) => {
        Services.updateAbandonedCartStatus("POST", JSON.stringify({ LogID: logId, Status: newStatus }), token)
            .then((res) => {
                if (res.Status === 1) {
                    toast.success(`Cart marked as ${newStatus}`);
                    loadAbandonedCarts();
                    if (selectedCart && selectedCart.LogID === logId) {
                        setSelectedCart({ ...selectedCart, Status: newStatus });
                    }
                } else {
                    toast.error(res.Message || "Failed to update status");
                }
            })
            .catch((err) => toast.error("Error updating cart status"));
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "recovered":
                return <span className="badge bg-success d-inline-flex align-items-center gap-1"><FaCheckCircle /> Recovered</span>;
            case "expired":
                return <span className="badge bg-secondary d-inline-flex align-items-center gap-1"><FaTimesCircle /> Expired</span>;
            default:
                return <span className="badge bg-warning text-dark d-inline-flex align-items-center gap-1"><FaClock /> Active</span>;
        }
    };

    const formatCustomerName = (log) => {
        if (!log.FirstName) return `User #${log.UserID}`;
        const lastName = log.LastName && log.LastName !== "NA" && log.LastName !== "null" ? ` ${log.LastName}` : "";
        return `${log.FirstName}${lastName}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "N/A";
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }) + ", " + d.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="abandoned-carts" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]} style={{ minWidth: 0, width: "100%", overflowX: "hidden" }}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
                    {/* Header */}
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                        <div>
                            <h3 style={{ fontWeight: "700", color: "#1f2937", margin: 0, fontSize: "1.5rem" }}>
                                Abandoned Carts
                            </h3>
                            <p className="text-muted mb-0" style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                                Track and recover customer shopping carts inactive for more than 8 hours
                            </p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <button
                                className="btn btn-success btn-sm px-3"
                                disabled={sending}
                                onClick={sendReminders}
                                title="Reminders also go out automatically every hour"
                                style={{ fontWeight: 600, height: "36px" }}
                            >
                                {sending ? "Sending…" : "Send reminders now"}
                            </button>
                            <button 
                                className="btn btn-outline-primary btn-sm px-3 d-inline-flex align-items-center gap-2"
                                onClick={loadAbandonedCarts}
                                style={{ fontWeight: 600, height: "36px" }}
                            >
                                Refresh List
                            </button>
                        </div>
                    </div>

                    {/* Policy Banner */}
                    <div className="d-flex flex-wrap align-items-center justify-content-between p-3 mb-3 rounded-3" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <div className="d-flex flex-wrap align-items-center gap-2" style={{ fontSize: "0.85rem" }}>
                            <span className="fw-semibold text-secondary">Timing Policy:</span>
                            <span className="badge bg-success-subtle text-success border border-success-subtle">Active: 0–6h</span>
                            <span className="text-muted">&rarr;</span>
                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">Grace: 6–8h</span>
                            <span className="text-muted">&rarr;</span>
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold">Abandoned: &gt;8h</span>
                        </div>
                        <div style={{ fontSize: "0.85rem" }}>
                            <span className="text-muted">Total Inactive Carts: </span>
                            <strong className="text-dark">{cartLogs.length}</strong>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <ScaleLoader color="#2680eb" loading={true} />
                        </div>
                    ) : (
                        <div className="bg-white rounded shadow-sm border" style={{ overflow: "hidden", minWidth: 0, width: "100%" }}>
                            <div className="table-responsive" style={{ overflowX: "auto", width: "100%", margin: 0 }}>
                                <table className="table table-hover align-middle mb-0" style={{ width: "100%", tableLayout: "fixed" }}>
                                    <thead className="table-light text-uppercase" style={{ fontSize: "0.78rem", letterSpacing: "0.5px" }}>
                                        <tr>
                                            <th style={{ width: "80px", paddingLeft: "16px" }}>Log ID</th>
                                            <th style={{ width: "230px" }}>Customer</th>
                                            <th style={{ width: "95px", textAlign: "center" }}>Items</th>
                                            <th style={{ width: "115px" }}>Cart Total</th>
                                            <th style={{ width: "180px" }}>Last Activity</th>
                                            <th style={{ width: "110px", textAlign: "center" }}>Status</th>
                                            <th style={{ width: "100px", textAlign: "right", paddingRight: "16px" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cartLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-5 text-muted">
                                                    <div className="py-3">
                                                        <FaClock size={32} className="text-muted mb-2 opacity-50" />
                                                        <div className="fw-semibold">No Abandoned Carts Found</div>
                                                        <small>No carts currently inactive beyond the 8-hour threshold.</small>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            cartLogs.map((log) => (
                                                <tr key={log.LogID}>
                                                    <td style={{ paddingLeft: "16px" }}>
                                                        <span className="fw-bold text-dark">#{log.LogID}</span>
                                                    </td>
                                                    <td style={{ overflow: "hidden" }}>
                                                        <div 
                                                            className="fw-semibold text-dark text-truncate" 
                                                            style={{ maxWidth: "215px" }}
                                                            title={formatCustomerName(log)}
                                                        >
                                                            {formatCustomerName(log)}
                                                        </div>
                                                        <small 
                                                            className="text-muted d-block text-truncate" 
                                                            style={{ maxWidth: "215px" }}
                                                            title={`${log.MobileNumber || "No phone"}${log.EmailID ? ` • ${log.EmailID}` : ""}`}
                                                        >
                                                            {log.MobileNumber || "No phone"}
                                                            {log.EmailID ? ` • ${log.EmailID}` : ""}
                                                        </small>
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        <span className="badge bg-light text-dark border px-2 py-1">
                                                            {log.ItemCount || 0} items
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <strong style={{ color: "#16a34a", fontSize: "0.95rem" }}>
                                                            ₹{parseFloat(log.TotalAmount || 0).toFixed(2)}
                                                        </strong>
                                                    </td>
                                                    <td>
                                                        <div className="text-dark fw-medium text-truncate" style={{ fontSize: "0.85rem", maxWidth: "170px" }}>
                                                            {formatDate(log.LastActivity || log.UpdatedAt)}
                                                        </div>
                                                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle mt-1" style={{ fontSize: "0.72rem" }}>
                                                            {log.HoursSinceActivity ? `${log.HoursSinceActivity}h inactive` : ">8h inactive"}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        {getStatusBadge(log.Status)}
                                                    </td>
                                                    <td style={{ textAlign: "right", paddingRight: "16px" }}>
                                                        <button 
                                                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                                                            onClick={() => handleViewCart(log)}
                                                            style={{ fontSize: "0.8rem", padding: "4px 10px" }}
                                                        >
                                                            <FaEye /> View Cart
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Details Modal */}
            {detailModal && selectedCart && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content shadow border-0 rounded-3">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold text-truncate" style={{ maxWidth: "85%" }} title={`Abandoned Cart Details — #${selectedCart.LogID} (${formatCustomerName(selectedCart)})`}>
                                    Abandoned Cart Details — #{selectedCart.LogID} ({formatCustomerName(selectedCart)})
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setDetailModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="row g-3 mb-4 bg-light p-3 rounded-3 mx-0">
                                    <div className="col-md-3">
                                        <small className="text-muted d-block">Customer Phone</small>
                                        <strong>{selectedCart.MobileNumber || 'N/A'}</strong>
                                    </div>
                                    <div className="col-md-3">
                                        <small className="text-muted d-block">Estimated Cart Total</small>
                                        <strong className="text-success fs-5">₹{parseFloat(selectedCart.TotalAmount || 0).toFixed(2)}</strong>
                                    </div>
                                    <div className="col-md-3">
                                        <small className="text-muted d-block">Last Meaningful Activity</small>
                                        <small className="fw-semibold d-block text-dark">
                                            {selectedCart.LastActivity ? new Date(selectedCart.LastActivity).toLocaleString() : 'N/A'}
                                        </small>
                                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle mt-1" style={{ fontSize: "0.72rem" }}>
                                            {selectedCart.HoursSinceActivity ? `${selectedCart.HoursSinceActivity}h inactive` : '>8h inactive'}
                                        </span>
                                    </div>
                                    <div className="col-md-3">
                                        <small className="text-muted d-block">Current Status</small>
                                        <div className="mt-1">{getStatusBadge(selectedCart.Status)}</div>
                                    </div>
                                </div>

                                <h6 className="mb-2" style={{ fontWeight: 600 }}>Cart Products:</h6>
                                {parsedItems.length === 0 ? (
                                    <p className="text-muted">No item breakdown in snapshot.</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-sm table-bordered align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Qty</th>
                                                    <th>Price</th>
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedItems.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>
                                                            <strong>{item.ProductName || `Item #${item.ProductID || idx + 1}`}</strong>
                                                            {item.metricvalue && (
                                                                <small className="text-muted d-block">{item.metricvalue} {item.metrictype}</small>
                                                            )}
                                                        </td>
                                                        <td>{item.Quantity || 1}</td>
                                                        <td>₹{item.Price || item.OfferPrice || 0}</td>
                                                        <td><strong>₹{(item.Quantity || 1) * (item.Price || item.OfferPrice || 0)}</strong></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div className="mt-4 p-3 border rounded">
                                    <h6 style={{ fontWeight: 600 }}>Update Recovery Status:</h6>
                                    <div className="d-flex gap-2 mt-2">
                                        <button 
                                            className="btn btn-sm btn-success"
                                            onClick={() => handleUpdateStatus(selectedCart.LogID, "recovered")}
                                        >
                                            Mark as Recovered
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-warning"
                                            onClick={() => handleUpdateStatus(selectedCart.LogID, "active")}
                                        >
                                            Mark as Active
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => handleUpdateStatus(selectedCart.LogID, "expired")}
                                        >
                                            Mark as Expired
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setDetailModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AbandonedCarts;
