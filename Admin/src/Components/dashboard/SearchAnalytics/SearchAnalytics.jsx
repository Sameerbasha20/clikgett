import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import ScaleLoader from "react-spinners/ScaleLoader";
import { useNavigate } from "react-router-dom";
import { 
    FaSearch, 
    FaUsers, 
    FaExclamationTriangle, 
    FaFire, 
    FaPlus, 
    FaEye, 
    FaClock, 
    FaCheckCircle,
    FaSyncAlt
} from "react-icons/fa";

function SearchAnalytics() {
    const navigate = useNavigate();
    const [keywords, setKeywords] = useState([]);
    const [filteredKeywords, setFilteredKeywords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("frequent"); // 'frequent', 'zero_results', 'recent', 'all'
    
    // Customer search details modal
    const [detailModal, setDetailModal] = useState(false);
    const [modalKeyword, setModalKeyword] = useState("");
    const [customerSearches, setCustomerSearches] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const fetchAnalytics = (tab = activeTab) => {
        setLoading(true);
        let filterParam = "";
        if (tab === "zero_results") filterParam = "filter=zero_results";
        else if (tab === "recent") filterParam = "filter=recent";
        else if (tab === "frequent") filterParam = "filter=frequent";

        Services.getSearchAnalytics("GET", null, token, filterParam)
            .then((res) => {
                setLoading(false);
                if (res && (res.status === 1 || res.Status === 1)) {
                    const list = res.data || res.Keywords || res.keywords || [];
                    setKeywords(list);
                    applySearchFilter(list, searchQuery);
                } else {
                    toast.error((res && (res.message || res.Message)) || "Failed to load search analytics");
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error(err);
                toast.error("Error loading search analytics");
            });
    };

    useEffect(() => {
        fetchAnalytics(activeTab);
    }, [activeTab]);

    const applySearchFilter = (list, query) => {
        if (!query.trim()) {
            setFilteredKeywords(list);
        } else {
            const q = query.toLowerCase();
            setFilteredKeywords(
                list.filter((item) => {
                    const term = (item.SearchTerm || item.Keyword || "").toLowerCase();
                    return term.includes(q);
                })
            );
        }
    };

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        applySearchFilter(keywords, val);
    };

    const handleViewCustomers = (keyword) => {
        setModalKeyword(keyword);
        setDetailModal(true);
        setModalLoading(true);
        Services.getKeywordUsers("GET", null, token, keyword)
            .then((res) => {
                setModalLoading(false);
                if (res && res.Status === 1) {
                    setCustomerSearches(res.Searches || []);
                } else {
                    setCustomerSearches([]);
                }
            })
            .catch((err) => {
                setModalLoading(false);
                console.error(err);
                toast.error("Failed to load customer searches");
            });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "-";
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }) + ", " + d.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    };

    // Aggregate metrics
    const totalSearchVolume = keywords.reduce((sum, item) => sum + (parseInt(item.SearchCount, 10) || 0), 0);
    const zeroResultsCount = keywords.filter((item) => (parseInt(item.AvgResultCount, 10) || 0) === 0).length;
    const topSearchedKeyword = keywords.length > 0 ? (keywords[0].SearchTerm || keywords[0].Keyword) : "None";
    const topSearchCount = keywords.length > 0 ? keywords[0].SearchCount : 0;
    const uniqueCustomersCount = new Set(keywords.map(k => k.UniqueUsers)).size > 0 
        ? keywords.reduce((max, k) => Math.max(max, parseInt(k.UniqueUsers, 10) || 0), 0) 
        : 0;

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="search-analytics" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]} style={{ minWidth: 0, width: "100%", overflowX: "hidden" }}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
                    
                    {/* Header */}
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                        <div>
                            <h3 style={{ fontWeight: 700, color: "#1f2937", margin: 0, fontSize: "1.5rem" }}>
                                Search Analytics & Product Demand
                            </h3>
                            <p className="text-muted mb-0" style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                                Discover what customers search for most frequently and identify missing products to stock
                            </p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Filter keywords..."
                                value={searchQuery}
                                onChange={handleSearch}
                                style={{ width: "220px", height: "36px" }}
                            />
                            <button
                                className="btn btn-outline-primary btn-sm px-3 d-inline-flex align-items-center gap-2"
                                onClick={() => fetchAnalytics(activeTab)}
                                style={{ fontWeight: 600, height: "36px" }}
                            >
                                <FaSyncAlt size={12} /> Refresh
                            </button>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="row g-3 mb-4">
                        <div className="col-md-3 col-sm-6">
                            <div className="card shadow-sm border-0 rounded-3 h-100 p-3" style={{ borderLeft: "4px solid #2563eb" }}>
                                <div className="text-muted small fw-semibold">Total Searches</div>
                                <div className="fs-3 fw-bold text-dark mt-1">{totalSearchVolume}</div>
                                <small className="text-muted">Total queries submitted by users</small>
                            </div>
                        </div>
                        <div className="col-md-3 col-sm-6">
                            <div className="card shadow-sm border-0 rounded-3 h-100 p-3" style={{ borderLeft: "4px solid #ea580c" }}>
                                <div className="text-muted small fw-semibold d-flex align-items-center gap-1">
                                    <FaFire color="#ea580c" /> Most Frequent Search
                                </div>
                                <div className="fs-3 fw-bold text-dark mt-1 text-truncate" title={topSearchedKeyword}>
                                    {topSearchedKeyword}
                                </div>
                                <small className="text-muted">{topSearchCount} total customer searches</small>
                            </div>
                        </div>
                        <div className="col-md-3 col-sm-6">
                            <div className="card shadow-sm border-0 rounded-3 h-100 p-3" style={{ borderLeft: "4px solid #dc2626" }}>
                                <div className="text-muted small fw-semibold d-flex align-items-center gap-1">
                                    <FaExclamationTriangle color="#dc2626" /> Missing Products (0 Results)
                                </div>
                                <div className="fs-3 fw-bold text-danger mt-1">{zeroResultsCount}</div>
                                <small className="text-danger fw-semibold">Unmet demand: Items to add to catalog</small>
                            </div>
                        </div>
                        <div className="col-md-3 col-sm-6">
                            <div className="card shadow-sm border-0 rounded-3 h-100 p-3" style={{ borderLeft: "4px solid #16a34a" }}>
                                <div className="text-muted small fw-semibold d-flex align-items-center gap-1">
                                    <FaUsers color="#16a34a" /> Unique Customers
                                </div>
                                <div className="fs-3 fw-bold text-success mt-1">{keywords.length}</div>
                                <small className="text-muted">Distinct search terms analyzed</small>
                            </div>
                        </div>
                    </div>

                    {/* Filter Navigation Tabs */}
                    <div className="d-flex flex-wrap gap-2 mb-3">
                        <button
                            className={`btn btn-sm ${activeTab === 'frequent' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setActiveTab('frequent')}
                            style={{ fontWeight: 600 }}
                        >
                            <FaFire className="me-1" /> Most Frequent (High Demand)
                        </button>
                        <button
                            className={`btn btn-sm ${activeTab === 'zero_results' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={() => setActiveTab('zero_results')}
                            style={{ fontWeight: 600 }}
                        >
                            <FaExclamationTriangle className="me-1" /> Unmet Demand ({zeroResultsCount} Missing Products)
                        </button>
                        <button
                            className={`btn btn-sm ${activeTab === 'recent' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setActiveTab('recent')}
                            style={{ fontWeight: 600 }}
                        >
                            <FaClock className="me-1" /> Recently Searched
                        </button>
                        <button
                            className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setActiveTab('all')}
                            style={{ fontWeight: 600 }}
                        >
                            All Keywords ({keywords.length})
                        </button>
                    </div>

                    {/* Main Analytics Table */}
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
                                            <th style={{ width: "70px", paddingLeft: "16px" }}>Rank</th>
                                            <th style={{ width: "220px" }}>Search Keyword</th>
                                            <th style={{ width: "120px", textAlign: "center" }}>Search Frequency</th>
                                            <th style={{ width: "110px", textAlign: "center" }}>Customers</th>
                                            <th style={{ width: "160px" }}>Catalog Status</th>
                                            <th style={{ width: "180px" }}>Last Searched</th>
                                            <th style={{ width: "170px", textAlign: "right", paddingRight: "16px" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredKeywords.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-5 text-muted">
                                                    <div className="py-3">
                                                        <FaSearch size={32} className="text-muted mb-2 opacity-50" />
                                                        <div className="fw-semibold">No Search Records Found</div>
                                                        <small>No customer search queries match the selected filter.</small>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredKeywords.map((item, index) => {
                                                const keywordStr = item.SearchTerm || item.Keyword || "N/A";
                                                const searchCount = parseInt(item.SearchCount, 10) || 0;
                                                const avgRes = Math.round(parseFloat(item.AvgResultCount || 0));
                                                const isZeroResult = avgRes === 0;

                                                return (
                                                    <tr key={index}>
                                                        <td style={{ paddingLeft: "16px" }}>
                                                            <span className="badge bg-light text-secondary border">
                                                                #{item.Rank || index + 1}
                                                            </span>
                                                        </td>
                                                        <td style={{ overflow: "hidden" }}>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <FaSearch color={isZeroResult ? "#dc2626" : "#2563eb"} size={13} />
                                                                <strong 
                                                                    className="text-dark text-truncate" 
                                                                    style={{ maxWidth: "180px", cursor: "pointer" }}
                                                                    title={keywordStr}
                                                                    onClick={() => handleViewCustomers(keywordStr)}
                                                                >
                                                                    {keywordStr}
                                                                </strong>
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: "center" }}>
                                                            <span className={`badge px-2 py-1 ${searchCount >= 5 ? 'bg-danger text-white' : (searchCount >= 2 ? 'bg-primary text-white' : 'bg-light text-dark border')}`}>
                                                                {searchCount} {searchCount === 1 ? 'search' : 'searches'}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: "center" }}>
                                                            <span className="d-inline-flex align-items-center gap-1 text-muted fw-semibold">
                                                                <FaUsers size={12} />
                                                                {item.UniqueUsers || 1}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {isZeroResult ? (
                                                                <div>
                                                                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                                                                        0 Results Found
                                                                    </span>
                                                                    <small className="d-block text-danger fw-semibold" style={{ fontSize: "0.72rem" }}>
                                                                        ⚠️ Missing from store
                                                                    </small>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1">
                                                                        <FaCheckCircle size={10} /> {avgRes} Results
                                                                    </span>
                                                                    <small className="d-block text-muted" style={{ fontSize: "0.72rem" }}>
                                                                        Available in Catalog
                                                                    </small>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="text-dark fw-medium text-truncate" style={{ fontSize: "0.85rem", maxWidth: "170px" }}>
                                                                {formatDate(item.LastSearched)}
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: "right", paddingRight: "16px" }}>
                                                            <div className="d-inline-flex gap-1">
                                                                <button
                                                                    className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                                                                    onClick={() => handleViewCustomers(keywordStr)}
                                                                    style={{ fontSize: "0.78rem", padding: "4px 8px" }}
                                                                    title="View customers who searched this"
                                                                >
                                                                    <FaEye /> Users
                                                                </button>
                                                                {isZeroResult && (
                                                                    <button
                                                                        className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                                                                        onClick={() => navigate('/products')}
                                                                        style={{ fontSize: "0.78rem", padding: "4px 8px" }}
                                                                        title="Add this product to store inventory"
                                                                    >
                                                                        <FaPlus /> Add
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Customer Search Breakdown Modal */}
            {detailModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content shadow border-0 rounded-3">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold text-truncate" style={{ maxWidth: "85%" }}>
                                    Customer Searches for "{modalKeyword}"
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setDetailModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <p className="text-muted mb-0 small">
                                        List of customer search attempts for this keyword so you know who is asking for it.
                                    </p>
                                    <button 
                                        className="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
                                        onClick={() => {
                                            setDetailModal(false);
                                            navigate('/products');
                                        }}
                                    >
                                        <FaPlus /> Add Product to Catalog
                                    </button>
                                </div>

                                {modalLoading ? (
                                    <div className="text-center py-4">
                                        <ScaleLoader color="#2680eb" loading={true} />
                                    </div>
                                ) : customerSearches.length === 0 ? (
                                    <div className="text-center py-4 text-muted">
                                        No individual customer logs found for this keyword.
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-sm table-bordered align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Customer Name</th>
                                                    <th>Phone Number</th>
                                                    <th>Email</th>
                                                    <th>Results Found</th>
                                                    <th>Searched At</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {customerSearches.map((s, idx) => (
                                                    <tr key={idx}>
                                                        <td>
                                                            <strong>{s.FirstName} {s.LastName}</strong>
                                                            {s.UserID && <small className="text-muted d-block">ID: #{s.UserID}</small>}
                                                        </td>
                                                        <td>
                                                            <a href={`tel:${s.MobileNumber}`} className="text-decoration-none">
                                                                {s.MobileNumber}
                                                            </a>
                                                        </td>
                                                        <td><small className="text-muted">{s.EmailID}</small></td>
                                                        <td>
                                                            {s.ResultCount === 0 ? (
                                                                <span className="badge bg-danger">0 (Missing)</span>
                                                            ) : (
                                                                <span className="badge bg-success">{s.ResultCount} items</span>
                                                            )}
                                                        </td>
                                                        <td><small>{formatDate(s.CreatedAt)}</small></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setDetailModal(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchAnalytics;
