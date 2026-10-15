import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import ScaleLoader from "react-spinners/ScaleLoader";
import { css } from "@emotion/react";
import {
    FaStar,
    FaCoins,
    FaCheck,
    FaTimes,
    FaEye,
    FaReply,
    FaSlidersH,
    FaCalendarAlt,
    FaMoneyBillWave,
    FaShieldAlt
} from "react-icons/fa";

function Feedback() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [rewardFilter, setRewardFilter] = useState("all");
    const [ratingFilter, setRatingFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Detail & Review Modal
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [reviewStatus, setReviewStatus] = useState("approved");
    const [reviewNotes, setReviewNotes] = useState("");
    const [adminReply, setAdminReply] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Reward Credit confirmation modal
    const [creditConfirmModal, setCreditConfirmModal] = useState(null);
    const [creditOverrideAmount, setCreditOverrideAmount] = useState("");
    const [isCrediting, setIsCrediting] = useState(false);

    // Reward Program Config
    const [rewardConfig, setRewardConfig] = useState({ amount: 20, enabled: true });
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [configAmountInput, setConfigAmountInput] = useState("20");
    const [configEnabledInput, setConfigEnabledInput] = useState(true);
    const [isSavingConfig, setIsSavingConfig] = useState(false);

    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const override = css`
        display: block;
        margin: 0 auto;
    `;

    const fetchConfig = () => {
        Services.getFeedbackRewardConfig("GET", null, token)
            .then((res) => {
                if (res && (res.status === 1 || res.Status === 1)) {
                    const amt = res.rewardAmount !== undefined ? res.rewardAmount : 20;
                    const en = res.rewardEnabled !== undefined ? res.rewardEnabled : true;
                    setRewardConfig({ amount: amt, enabled: en });
                    setConfigAmountInput(String(amt));
                    setConfigEnabledInput(en);
                }
            })
            .catch((err) => console.error("Error loading reward config:", err));
    };

    const fetchFeedbacks = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.append("status", statusFilter);
        if (rewardFilter !== "all") params.append("rewardStatus", rewardFilter);
        if (ratingFilter !== "all") params.append("rating", ratingFilter);
        if (searchQuery.trim()) params.append("search", searchQuery.trim());
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        Services.getFeedbackList("GET", null, token, params.toString())
            .then((res) => {
                setLoading(false);
                if (res && (res.status === 1 || res.Status === 1)) {
                    const list = res.data || res.Feedback || [];
                    setFeedbacks(list);
                } else {
                    toast.error((res && (res.message || res.Message)) || "Failed to load feedbacks");
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error(err);
                toast.error("Error loading feedbacks");
            });
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    useEffect(() => {
        fetchFeedbacks();
    }, [statusFilter, rewardFilter, ratingFilter, startDate, endDate]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchFeedbacks();
    };

    const handleClearFilters = () => {
        setStatusFilter("all");
        setRewardFilter("all");
        setRatingFilter("all");
        setSearchQuery("");
        setStartDate("");
        setEndDate("");
    };

    const openDetailModal = (item) => {
        setDetailLoading(true);
        setSelectedFeedback(item);
        setReviewStatus(item.Status === "rejected" ? "rejected" : "approved");
        setReviewNotes(item.ReviewNotes || "");
        setAdminReply(item.AdminReply || "");

        // Fetch fresh detail with wallet tx
        Services.getFeedbackDetail("GET", null, token, item.FeedbackID)
            .then((res) => {
                setDetailLoading(false);
                if (res && (res.status === 1 || res.Status === 1) && res.Feedback) {
                    setSelectedFeedback({
                        ...res.Feedback,
                        walletTx: res.WalletTransaction || null
                    });
                }
            })
            .catch((err) => {
                setDetailLoading(false);
                console.error("Error fetching detail:", err);
            });
    };

    const handleReviewSubmit = () => {
        if (!selectedFeedback) return;
        setIsSubmittingReview(true);

        const payload = {
            status: reviewStatus,
            reviewNotes: reviewNotes,
            adminReply: adminReply
        };

        Services.reviewFeedback("POST", JSON.stringify(payload), token, selectedFeedback.FeedbackID)
            .then((res) => {
                setIsSubmittingReview(false);
                if (res && (res.status === 1 || res.Status === 1)) {
                    toast.success(res.Message || "Review saved successfully");
                    setSelectedFeedback(null);
                    fetchFeedbacks();
                } else {
                    toast.error((res && (res.message || res.Message)) || "Failed to submit review");
                }
            })
            .catch((err) => {
                setIsSubmittingReview(false);
                console.error(err);
                toast.error("Error submitting review");
            });
    };

    const handleCreditReward = () => {
        if (!creditConfirmModal) return;
        setIsCrediting(true);

        const payload = {};
        if (creditOverrideAmount && !isNaN(parseFloat(creditOverrideAmount))) {
            payload.overrideAmount = parseFloat(creditOverrideAmount);
        }

        Services.creditFeedbackReward("POST", JSON.stringify(payload), token, creditConfirmModal.FeedbackID)
            .then((res) => {
                setIsCrediting(false);
                if (res && (res.status === 1 || res.Status === 1)) {
                    toast.success(res.Message || "Cashback successfully credited to customer wallet!");
                    setCreditConfirmModal(null);
                    if (selectedFeedback && selectedFeedback.FeedbackID === creditConfirmModal.FeedbackID) {
                        setSelectedFeedback(null);
                    }
                    fetchFeedbacks();
                } else {
                    toast.error((res && (res.message || res.Message)) || "Failed to credit cashback");
                }
            })
            .catch((err) => {
                setIsCrediting(false);
                console.error(err);
                toast.error("Error issuing wallet cashback");
            });
    };

    const handleSaveConfig = () => {
        const amt = parseFloat(configAmountInput);
        if (isNaN(amt) || amt < 0 || amt > 1000) {
            toast.error("Reward amount must be between ₹0 and ₹1,000");
            return;
        }

        setIsSavingConfig(true);
        Services.updateFeedbackRewardConfig(
            "POST",
            JSON.stringify({
                rewardAmount: amt,
                rewardEnabled: configEnabledInput
            }),
            token
        )
            .then((res) => {
                setIsSavingConfig(false);
                if (res && (res.status === 1 || res.Status === 1)) {
                    toast.success("Feedback reward configuration updated successfully!");
                    setRewardConfig({ amount: amt, enabled: configEnabledInput });
                    setShowConfigModal(false);
                } else {
                    toast.error((res && (res.message || res.Message)) || "Failed to update configuration");
                }
            })
            .catch((err) => {
                setIsSavingConfig(false);
                console.error(err);
                toast.error("Error updating configuration");
            });
    };

    const columns = [
        {
            dataField: "FeedbackID",
            text: "ID",
            sort: true,
            headerStyle: { width: "65px", textAlign: "center" },
            formatter: (cell) => <span className="font-weight-bold">#{cell}</span>,
        },
        {
            dataField: "UserName",
            text: "Customer",
            formatter: (cell, row) => (
                <div>
                    <strong>{cell || "Customer"}</strong>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>
                        {row.Mobile ? `📱 ${row.Mobile}` : `User ID: ${row.UserID}`}
                    </div>
                </div>
            ),
        },
        {
            dataField: "OrderID",
            text: "Order #",
            formatter: (cell, row) => (
                <div>
                    {cell ? (
                        <span className="badge badge-info" style={{ fontSize: "0.85rem" }}>
                            #{cell}
                        </span>
                    ) : (
                        <span className="text-muted">General</span>
                    )}
                    {row.OrderTotal ? (
                        <div style={{ fontSize: "0.75rem", color: "#555", marginTop: "2px" }}>
                            ₹{parseFloat(row.OrderTotal).toFixed(2)}
                        </div>
                    ) : null}
                </div>
            ),
        },
        {
            dataField: "Rating",
            text: "Rating",
            sort: true,
            formatter: (cell) => {
                const rating = cell || 0;
                return (
                    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                        {[...Array(5)].map((_, i) => (
                            <FaStar key={i} color={i < rating ? "#f59e0b" : "#e5e7eb"} size={13} />
                        ))}
                        <span style={{ marginLeft: "4px", fontSize: "0.85rem", fontWeight: "600", color: "#374151" }}>
                            {rating}/5
                        </span>
                    </div>
                );
            },
        },
        {
            dataField: "Message",
            text: "Feedback Message",
            formatter: (cell, row) => (
                <div style={{ maxWidth: "260px" }}>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#1f2937", overflowWrap: "break-word" }}>
                        {cell ? (cell.length > 80 ? cell.substring(0, 80) + "..." : cell) : <span className="text-muted">No comment</span>}
                    </p>
                    {row.AdminReply && (
                        <div style={{ marginTop: "4px", fontSize: "0.75rem", color: "#065f46", background: "#ecfdf5", padding: "2px 6px", borderRadius: "4px" }}>
                            Reply: {row.AdminReply}
                        </div>
                    )}
                </div>
            ),
        },
        {
            dataField: "Status",
            text: "Review Status",
            formatter: (cell) => {
                let badgeClass = "badge-warning";
                let text = cell || "pending";
                if (cell === "approved" || cell === "resolved") {
                    badgeClass = "badge-success";
                    text = "Approved";
                } else if (cell === "rejected") {
                    badgeClass = "badge-danger";
                    text = "Rejected";
                } else {
                    text = "Pending";
                }
                return (
                    <span className={`badge ${badgeClass}`} style={{ textTransform: "capitalize", fontSize: "0.8rem", padding: "5px 8px" }}>
                        {text}
                    </span>
                );
            },
        },
        {
            dataField: "RewardStatus",
            text: "Reward Status",
            formatter: (cell, row) => {
                const rewardAmt = parseFloat(row.RewardAmount || 0);
                if (cell === "credited") {
                    return (
                        <div>
                            <span className="badge badge-success" style={{ fontSize: "0.8rem", padding: "4px 8px" }}>
                                <FaCoins style={{ marginRight: "3px" }} /> Credited
                            </span>
                            <div style={{ fontSize: "0.75rem", color: "#059669", fontWeight: "600", marginTop: "2px" }}>
                                ₹{rewardAmt.toFixed(2)}
                            </div>
                        </div>
                    );
                } else if (cell === "rejected") {
                    return <span className="badge badge-secondary" style={{ fontSize: "0.8rem" }}>Rejected</span>;
                } else if (cell === "not_eligible") {
                    return <span className="badge badge-light" style={{ fontSize: "0.8rem", color: "#6b7280" }}>Not Eligible</span>;
                }
                return (
                    <div>
                        <span className="badge badge-warning" style={{ fontSize: "0.8rem", padding: "4px 8px" }}>
                            Pending
                        </span>
                        {rewardAmt > 0 && (
                            <div style={{ fontSize: "0.75rem", color: "#b45309", fontWeight: "600", marginTop: "2px" }}>
                                ₹{rewardAmt.toFixed(2)}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            dataField: "CreatedAt",
            text: "Submitted",
            formatter: (cell) => (cell ? new Date(cell).toLocaleDateString() : "-"),
        },
        {
            dataField: "actions",
            text: "Actions",
            formatter: (_, row) => (
                <div style={{ display: "flex", gap: "6px" }}>
                    <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openDetailModal(row)}
                        title="View details & review"
                        style={{ fontSize: "0.8rem", padding: "4px 8px" }}
                    >
                        <FaEye /> Review
                    </button>
                    {row.RewardStatus !== "credited" && row.Status !== "rejected" && (
                        <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => {
                                setCreditConfirmModal(row);
                                setCreditOverrideAmount(String(row.RewardAmount || rewardConfig.amount || 20));
                            }}
                            title="Credit Cashback Reward"
                            style={{ fontSize: "0.8rem", padding: "4px 8px" }}
                        >
                            <FaCoins /> Credit
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="feedback" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ padding: "24px" }}>
                    {/* Header with Title and Reward Program Banner */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                            <h3 style={{ margin: 0, fontWeight: 700, color: "#111827" }}>Customer Feedback & Rewards</h3>
                            <p style={{ margin: "4px 0 0 0", fontSize: "0.88rem", color: "#6b7280" }}>
                                Inspect verified delivery feedback, manage reviews, and issue wallet cashback rewards.
                            </p>
                        </div>
                        {/* Config Banner */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "14px",
                                background: "#f0fdf4",
                                border: "1px solid #86efac",
                                borderRadius: "8px",
                                padding: "8px 16px",
                            }}
                        >
                            <FaCoins size={22} color="#16a34a" />
                            <div>
                                <div style={{ fontSize: "0.78rem", color: "#166534", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                                    Configured Cashback
                                </div>
                                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#14532d" }}>
                                    ₹{parseFloat(rewardConfig.amount).toFixed(2)}
                                    <span style={{ fontSize: "0.8rem", fontWeight: 500, marginLeft: "6px", color: rewardConfig.enabled ? "#16a34a" : "#dc2626" }}>
                                        ({rewardConfig.enabled ? "Active" : "Disabled"})
                                    </span>
                                </div>
                            </div>
                            <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => setShowConfigModal(true)}
                                style={{ marginLeft: "8px", fontSize: "0.8rem" }}
                            >
                                <FaSlidersH style={{ marginRight: "4px" }} /> Configure
                            </button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div
                        style={{
                            background: "#ffffff",
                            padding: "16px",
                            borderRadius: "8px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                            marginBottom: "20px",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "12px",
                            alignItems: "center",
                        }}
                    >
                        {/* Search Input */}
                        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "6px", flex: "1 1 240px" }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search customer, phone, order #..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ fontSize: "0.88rem" }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ fontSize: "0.88rem", padding: "6px 14px" }}>
                                Search
                            </button>
                        </form>

                        {/* Review Status Filter */}
                        <div style={{ minWidth: "140px" }}>
                            <select
                                className="form-control"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ fontSize: "0.88rem" }}
                            >
                                <option value="all">All Reviews</option>
                                <option value="pending">Review: Pending</option>
                                <option value="approved">Review: Approved</option>
                                <option value="rejected">Review: Rejected</option>
                            </select>
                        </div>

                        {/* Reward Status Filter */}
                        <div style={{ minWidth: "150px" }}>
                            <select
                                className="form-control"
                                value={rewardFilter}
                                onChange={(e) => setRewardFilter(e.target.value)}
                                style={{ fontSize: "0.88rem" }}
                            >
                                <option value="all">All Rewards</option>
                                <option value="pending">Reward: Pending</option>
                                <option value="credited">Reward: Credited</option>
                                <option value="rejected">Reward: Rejected</option>
                                <option value="not_eligible">Reward: Not Eligible</option>
                            </select>
                        </div>

                        {/* Star Rating Filter */}
                        <div style={{ minWidth: "120px" }}>
                            <select
                                className="form-control"
                                value={ratingFilter}
                                onChange={(e) => setRatingFilter(e.target.value)}
                                style={{ fontSize: "0.88rem" }}
                            >
                                <option value="all">All Ratings</option>
                                <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                                <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                                <option value="3">⭐⭐⭐ (3 Stars)</option>
                                <option value="2">⭐⭐ (2 Stars)</option>
                                <option value="1">⭐ (1 Star)</option>
                            </select>
                        </div>

                        {/* Date Pickers */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <input
                                type="date"
                                className="form-control"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                title="Start Date"
                                style={{ fontSize: "0.85rem", width: "135px" }}
                            />
                            <span style={{ color: "#9ca3af" }}>-</span>
                            <input
                                type="date"
                                className="form-control"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                title="End Date"
                                style={{ fontSize: "0.85rem", width: "135px" }}
                            />
                        </div>

                        {(statusFilter !== "all" || rewardFilter !== "all" || ratingFilter !== "all" || searchQuery || startDate || endDate) && (
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={handleClearFilters}
                                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    {/* Table View */}
                    {loading ? (
                        <div className={dashboardclasses["loader"]}>
                            <ScaleLoader color={"#16a34a"} loading={true} css={override} size={150} />
                        </div>
                    ) : (
                        <div className="category-table" style={{ background: "#ffffff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                            <BootstrapTable
                                bootstrap4
                                keyField="FeedbackID"
                                data={feedbacks}
                                columns={columns}
                                pagination={paginationFactory({
                                    sizePerPage: 10,
                                    hideSizePerPage: false,
                                    sizePerPageList: [10, 25, 50],
                                })}
                                wrapperClasses="table-responsive"
                                noDataIndication={() => (
                                    <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
                                        No customer feedback records found matching selected filters.
                                    </div>
                                )}
                            />
                        </div>
                    )}

                    {/* ===================== DETAIL & REVIEW MODAL ===================== */}
                    {selectedFeedback && (
                        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1050 }}>
                            <div className="modal-dialog modal-lg" style={{ maxWidth: "800px" }}>
                                <div className="modal-content" style={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                                    <div className="modal-header" style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
                                        <div>
                                            <h5 className="modal-title" style={{ fontWeight: 700, margin: 0, color: "#111827" }}>
                                                Feedback #{selectedFeedback.FeedbackID} — Review & Reward Details
                                            </h5>
                                            <small style={{ color: "#6b7280" }}>
                                                Submitted on {new Date(selectedFeedback.CreatedAt).toLocaleString()}
                                            </small>
                                        </div>
                                        <button type="button" className="close" onClick={() => setSelectedFeedback(null)} style={{ outline: "none" }}>
                                            <span>&times;</span>
                                        </button>
                                    </div>

                                    <div className="modal-body" style={{ padding: "24px" }}>
                                        {/* Order & Customer Summary Cards */}
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                                            {/* Customer Card */}
                                            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                                <h6 style={{ fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", color: "#475569", marginBottom: "8px" }}>
                                                    Customer Info
                                                </h6>
                                                <div><strong>Name:</strong> {selectedFeedback.UserName || "Customer"}</div>
                                                <div><strong>Mobile:</strong> {selectedFeedback.Mobile || "N/A"}</div>
                                                {selectedFeedback.Email && <div><strong>Email:</strong> {selectedFeedback.Email}</div>}
                                                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
                                                    User ID: #{selectedFeedback.UserID}
                                                </div>
                                            </div>

                                            {/* Order Card */}
                                            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                                <h6 style={{ fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", color: "#475569", marginBottom: "8px" }}>
                                                    Order Info
                                                </h6>
                                                <div><strong>Order ID:</strong> #{selectedFeedback.OrderID || "N/A"}</div>
                                                {selectedFeedback.OrderTotal && (
                                                    <div><strong>Order Total:</strong> ₹{parseFloat(selectedFeedback.OrderTotal).toFixed(2)}</div>
                                                )}
                                                <div>
                                                    <strong>Status:</strong>{" "}
                                                    <span className="badge badge-success">Delivered (Status 1)</span>
                                                </div>
                                                {selectedFeedback.DeliveredAt && (
                                                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
                                                        Delivered At: {new Date(selectedFeedback.DeliveredAt).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Rating & Message Display */}
                                        <div style={{ background: "#fffbeb", padding: "16px", borderRadius: "8px", border: "1px solid #fde68a", marginBottom: "20px" }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    {[...Array(5)].map((_, i) => (
                                                        <FaStar key={i} color={i < (selectedFeedback.Rating || 0) ? "#f59e0b" : "#d1d5db"} size={18} />
                                                    ))}
                                                    <span style={{ fontWeight: 700, fontSize: "1rem", color: "#92400e", marginLeft: "6px" }}>
                                                        {selectedFeedback.Rating}/5 Stars
                                                    </span>
                                                </div>
                                                <span className="badge badge-warning" style={{ textTransform: "capitalize" }}>
                                                    {selectedFeedback.Category || "Order Experience"}
                                                </span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: "0.95rem", color: "#78350f", whiteSpace: "pre-wrap" }}>
                                                "{selectedFeedback.Message || "No comments written by customer."}"
                                            </p>
                                        </div>

                                        {/* Reward Processing Status */}
                                        <div style={{ marginBottom: "20px" }}>
                                            <h6 style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b", marginBottom: "10px" }}>
                                                Cashback Reward Status
                                            </h6>
                                            {selectedFeedback.RewardStatus === "credited" ? (
                                                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "14px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", color: "#166534", fontWeight: 700, fontSize: "0.95rem" }}>
                                                        <FaCheck style={{ marginRight: "8px" }} />
                                                        Cashback Credited: ₹{parseFloat(selectedFeedback.RewardAmount || 0).toFixed(2)}
                                                    </div>
                                                    <div style={{ fontSize: "0.85rem", color: "#15803d", marginTop: "4px" }}>
                                                        Wallet Transaction #{selectedFeedback.WalletTransactionID || (selectedFeedback.walletTx && selectedFeedback.walletTx.WalletID) || "Recorded"}
                                                        {selectedFeedback.ReviewedAt ? ` • Credited on ${new Date(selectedFeedback.ReviewedAt).toLocaleString()}` : ""}
                                                        {selectedFeedback.AdminID ? ` by Admin #${selectedFeedback.AdminID}` : ""}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "14px" }}>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: "#334155" }}>
                                                            Eligible Reward: ₹{parseFloat(selectedFeedback.RewardAmount || rewardConfig.amount || 20).toFixed(2)}
                                                        </div>
                                                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                                            Status: <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{selectedFeedback.RewardStatus || "pending"}</span>
                                                        </div>
                                                    </div>
                                                    {selectedFeedback.RewardStatus !== "credited" && selectedFeedback.Status !== "rejected" && (
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => {
                                                                setCreditConfirmModal(selectedFeedback);
                                                                setCreditOverrideAmount(String(selectedFeedback.RewardAmount || rewardConfig.amount || 20));
                                                            }}
                                                            style={{ fontWeight: 600 }}
                                                        >
                                                            <FaCoins style={{ marginRight: "6px" }} /> Approve & Issue Cashback
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Admin Review & Decision Form */}
                                        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                            <h6 style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b", marginBottom: "12px" }}>
                                                Admin Review & Decision
                                            </h6>
                                            <div className="form-group">
                                                <label style={{ fontWeight: 600, fontSize: "0.85rem" }}>Review Decision:</label>
                                                <div style={{ display: "flex", gap: "16px" }}>
                                                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                                        <input
                                                            type="radio"
                                                            name="decision"
                                                            value="approved"
                                                            checked={reviewStatus === "approved"}
                                                            onChange={(e) => setReviewStatus(e.target.value)}
                                                        />
                                                        <span className="text-success font-weight-bold">Approve Feedback</span>
                                                    </label>
                                                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                                        <input
                                                            type="radio"
                                                            name="decision"
                                                            value="rejected"
                                                            checked={reviewStatus === "rejected"}
                                                            onChange={(e) => setReviewStatus(e.target.value)}
                                                        />
                                                        <span className="text-danger font-weight-bold">Reject Feedback</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                                                    Internal Review Notes:
                                                </label>
                                                <textarea
                                                    className="form-control"
                                                    rows={2}
                                                    value={reviewNotes}
                                                    onChange={(e) => setReviewNotes(e.target.value)}
                                                    placeholder="Internal audit notes (e.g. feedback verified genuine, order delivered successfully)..."
                                                    style={{ fontSize: "0.88rem" }}
                                                />
                                            </div>

                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                                                    Admin Reply to Customer (Optional):
                                                </label>
                                                <textarea
                                                    className="form-control"
                                                    rows={2}
                                                    value={adminReply}
                                                    onChange={(e) => setAdminReply(e.target.value)}
                                                    placeholder="Customer-facing reply (e.g. Thank you for your feedback! We appreciate your support)..."
                                                    style={{ fontSize: "0.88rem" }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer" style={{ borderTop: "1px solid #e5e7eb", padding: "14px 24px" }}>
                                        <button className="btn btn-secondary" onClick={() => setSelectedFeedback(null)}>
                                            Close
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleReviewSubmit}
                                            disabled={isSubmittingReview}
                                        >
                                            {isSubmittingReview ? "Saving..." : "Save Review Decision"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===================== CONFIRM CASHBACK CREDIT MODAL ===================== */}
                    {creditConfirmModal && (
                        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}>
                            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "480px" }}>
                                <div className="modal-content" style={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
                                    <div className="modal-header" style={{ background: "#f0fdf4", borderBottom: "1px solid #bbf7d0" }}>
                                        <h5 className="modal-title" style={{ fontWeight: 700, color: "#166534", display: "flex", alignItems: "center", gap: "8px" }}>
                                            <FaShieldAlt color="#16a34a" /> Confirm Wallet Credit
                                        </h5>
                                        <button type="button" className="close" onClick={() => setCreditConfirmModal(null)}>
                                            <span>&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body" style={{ padding: "20px" }}>
                                        <p style={{ color: "#374151", fontSize: "0.95rem" }}>
                                            You are about to issue cashback to customer <strong>{creditConfirmModal.UserName}</strong> for Feedback #<strong>{creditConfirmModal.FeedbackID}</strong> (Order #{creditConfirmModal.OrderID}).
                                        </p>

                                        <div className="form-group">
                                            <label style={{ fontWeight: 600, fontSize: "0.85rem", color: "#374151" }}>
                                                Cashback Amount (₹):
                                            </label>
                                            <input
                                                type="number"
                                                step="1"
                                                min="1"
                                                max="1000"
                                                className="form-control"
                                                value={creditOverrideAmount}
                                                onChange={(e) => setCreditOverrideAmount(e.target.value)}
                                                style={{ fontSize: "1.1rem", fontWeight: 700, color: "#15803d" }}
                                            />
                                            <small className="form-text text-muted">
                                                This credit will be immediately posted to the customer's wallet ledger with a 30-day expiry.
                                            </small>
                                        </div>

                                        <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", fontSize: "0.82rem", color: "#64748b" }}>
                                            ⚠️ Duplicate prevention active: If this order has already received a feedback reward, duplicate transactions will be automatically rejected.
                                        </div>
                                    </div>
                                    <div className="modal-footer" style={{ borderTop: "1px solid #e5e7eb" }}>
                                        <button className="btn btn-secondary" onClick={() => setCreditConfirmModal(null)} disabled={isCrediting}>
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-success"
                                            onClick={handleCreditReward}
                                            disabled={isCrediting || !creditOverrideAmount || parseFloat(creditOverrideAmount) <= 0}
                                            style={{ fontWeight: 600 }}
                                        >
                                            {isCrediting ? "Processing..." : `Confirm & Credit ₹${parseFloat(creditOverrideAmount || 0).toFixed(2)}`}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===================== CASHBACK CONFIGURATION MODAL ===================== */}
                    {showConfigModal && (
                        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }}>
                            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "460px" }}>
                                <div className="modal-content" style={{ borderRadius: "12px", border: "none" }}>
                                    <div className="modal-header" style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                        <h5 className="modal-title" style={{ fontWeight: 700, color: "#111827" }}>
                                            <FaSlidersH style={{ marginRight: "8px" }} /> Feedback Cashback Settings
                                        </h5>
                                        <button type="button" className="close" onClick={() => setShowConfigModal(false)}>
                                            <span>&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body" style={{ padding: "20px" }}>
                                        <div className="form-group">
                                            <label style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                                                Default Feedback Reward Amount (₹):
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="1000"
                                                step="1"
                                                className="form-control"
                                                value={configAmountInput}
                                                onChange={(e) => setConfigAmountInput(e.target.value)}
                                                style={{ fontSize: "1.1rem", fontWeight: 700 }}
                                            />
                                            <small className="form-text text-muted">
                                                Amount credited to customer wallet when their in-app feedback is approved.
                                            </small>
                                        </div>

                                        <div className="form-group form-check" style={{ marginTop: "16px" }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id="rewardEnabledCheckbox"
                                                checked={configEnabledInput}
                                                onChange={(e) => setConfigEnabledInput(e.target.checked)}
                                                style={{ cursor: "pointer", width: "18px", height: "18px" }}
                                            />
                                            <label
                                                className="form-check-label"
                                                htmlFor="rewardEnabledCheckbox"
                                                style={{ marginLeft: "8px", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}
                                            >
                                                Enable Feedback Reward Program
                                            </label>
                                            <small className="form-text text-muted" style={{ display: "block", marginLeft: "8px" }}>
                                                When enabled, eligible post-delivery feedback submissions are queued for admin review and cashback reward.
                                            </small>
                                        </div>
                                    </div>
                                    <div className="modal-footer" style={{ borderTop: "1px solid #e5e7eb" }}>
                                        <button className="btn btn-secondary" onClick={() => setShowConfigModal(false)} disabled={isSavingConfig}>
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleSaveConfig}
                                            disabled={isSavingConfig}
                                        >
                                            {isSavingConfig ? "Saving..." : "Save Configuration"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Feedback;
