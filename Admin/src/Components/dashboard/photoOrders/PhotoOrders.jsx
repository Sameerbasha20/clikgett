import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import styles from "./photoOrders.module.css";
import { Services } from "../../../Services";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Moment from "react-moment";
import { FaEye, FaSearch, FaCameraRetro } from "react-icons/fa";

function PhotoOrders() {
    const navigate = useNavigate();
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [total, setTotal] = useState(0);
    const [selectedStatus, setSelectedStatus] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [page, setPage] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);

    const statusTabs = [
        { label: "All Requests", value: "ALL" },
        { label: "Pending", value: "PENDING" },
        { label: "Under Review", value: "UNDER_REVIEW" },
        { label: "Proposal Draft", value: "PROPOSAL_DRAFT" },
        { label: "Awaiting Confirmation", value: "AWAITING_CUSTOMER_CONFIRMATION" },
        { label: "Order Created", value: "ORDER_CREATED" },
        { label: "Rejected", value: "CUSTOMER_REJECTED" },
        { label: "Cancelled", value: "CANCELLED" }
    ];

    const fetchRequests = () => {
        setLoading(true);
        let queryParams = `page=${page}&limit=20`;
        if (selectedStatus !== "ALL") queryParams += `&status=${selectedStatus}`;
        if (searchTerm) queryParams += `&search=${encodeURIComponent(searchTerm)}`;
        if (startDate) queryParams += `&startDate=${startDate}`;
        if (endDate) queryParams += `&endDate=${endDate}`;

        Services.getAdminPhotoOrders("GET", null, token, queryParams)
            .then((res) => {
                if (res.Status === 1) {
                    setRequests(res.Requests || []);
                    setTotal(res.Total || 0);
                } else {
                    toast.error(res.Message || "Failed to load requests");
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                toast.error("Error connecting to server");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedStatus, page, reloadKey]);

    const hasFilters = selectedStatus !== "ALL" || searchTerm || startDate || endDate;
    const clearFilters = () => {
        setSelectedStatus("ALL");
        setSearchTerm("");
        setStartDate("");
        setEndDate("");
        setPage(1);
        setReloadKey((k) => k + 1);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchRequests();
    };

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="photoOrders" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ display: "block", padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <FaCameraRetro size={24} color="#2563eb" />
                        <h1 className={styles.headerTitle} style={{ margin: 0 }}>Photo Order Requests</h1>
                    </div>
                    <p className={styles.headerSubtitle}>
                        Review uploaded customer photos, prepare priced catalog proposals, and track confirmations.
                    </p>

                    {/* Search & Date Filter Bar */}
                    <form className={styles.filterBar} onSubmit={handleSearch}>
                        <select
                            className={styles.searchInput}
                            style={{ flex: "none", width: 200 }}
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                setPage(1);
                            }}
                            aria-label="Status"
                        >
                            {statusTabs.map((tab) => (
                                <option key={tab.value} value={tab.value}>{tab.label}</option>
                            ))}
                        </select>
                        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                            <input
                                type="search"
                                className={styles.searchInput}
                                style={{ width: "100%" }}
                                title="Search by request code, mobile number or customer name"
                                placeholder="Code, mobile or customer name"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <input
                            type="date"
                            className={styles.searchInput}
                            style={{ flex: "none", width: 160 }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <input
                            type="date"
                            className={styles.searchInput}
                            style={{ flex: "none", width: 160 }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                        <button
                            type="submit"
                            style={{
                                padding: "8px 18px",
                                borderRadius: 8,
                                background: "#2563eb",
                                color: "#fff",
                                border: "none",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 6
                            }}
                        >
                            <FaSearch size={14} /> Filter
                        </button>
                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                style={{ padding: "8px 14px", borderRadius: 8, background: "#fff", color: "#334155", border: "1px solid #cbd5e1", fontWeight: 600, cursor: "pointer" }}
                            >
                                Clear filters
                            </button>
                        )}
                    </form>

                    {/* Table View */}
                    <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", minWidth: 960, borderCollapse: "collapse", textAlign: "left" }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                        <th style={{ padding: "14px 16px", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", whiteSpace: "nowrap" }}>Request Code</th>
                                        <th style={{ padding: "14px 16px", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", whiteSpace: "nowrap" }}>Customer</th>
                                        <th style={{ padding: "14px 16px", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", whiteSpace: "nowrap" }}>Submission Time</th>
                                        <th style={{ padding: "14px 16px", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", whiteSpace: "nowrap" }}>Items Matched</th>
                                        <th style={{ padding: "14px 16px", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", whiteSpace: "nowrap" }}>Proposed Total</th>
                                        <th style={{ padding: "14px 16px", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", whiteSpace: "nowrap" }}>Status</th>
                                        <th style={{ padding: "14px 16px", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", whiteSpace: "nowrap" }}>Reviewer</th>
                                        <th style={{ padding: "14px 16px", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", whiteSpace: "nowrap" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
                                                Loading requests...
                                            </td>
                                        </tr>
                                    ) : requests.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
                                                No photo order requests found matching the filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        requests.map((r) => (
                                            <tr key={r.RequestID} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap" }}>
                                                    {r.RequestCode}
                                                </td>
                                                <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                                                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{r.CustomerName || "Customer"}</div>
                                                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{r.CustomerMobile || "N/A"}</div>
                                                </td>
                                                <td style={{ padding: "14px 16px", fontSize: "0.85rem", color: "#475569", whiteSpace: "nowrap" }}>
                                                    <Moment format="DD MMM YYYY, hh:mm A">{r.CreatedAt}</Moment>
                                                </td>
                                                <td style={{ padding: "14px 16px", fontSize: "0.85rem", color: "#475569", whiteSpace: "nowrap" }}>
                                                    {r.ItemCount || 0} items
                                                </td>
                                                <td style={{ padding: "14px 16px", fontWeight: 600, color: "#059669", whiteSpace: "nowrap" }}>
                                                    {parseFloat(r.GrandTotal) > 0 ? `₹${parseFloat(r.GrandTotal).toFixed(2)}` : "-"}
                                                </td>
                                                <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                                                    <span className={`${styles.statusPill} ${styles["status" + r.RequestStatus]}`}>
                                                        {r.RequestStatus ? r.RequestStatus.replace(/_/g, " ") : "PENDING"}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "14px 16px", fontSize: "0.85rem", color: "#64748b", whiteSpace: "nowrap" }}>
                                                    {r.ReviewerName || "Unassigned"}
                                                </td>
                                                <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                                                    <button
                                                        onClick={() => navigate(`/photo-orders/${r.RequestID}`)}
                                                        style={{
                                                            padding: "6px 12px",
                                                            borderRadius: 6,
                                                            border: "1px solid #cbd5e1",
                                                            background: "#ffffff",
                                                            color: "#1e293b",
                                                            fontSize: "0.8rem",
                                                            fontWeight: 600,
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 5
                                                        }}
                                                    >
                                                        <FaEye /> Review Studio
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PhotoOrders;
