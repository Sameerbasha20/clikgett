import React, { useState, useEffect, useRef } from "react";
import styles from "./globalSearch.module.css";
import { Services } from "../../Services";
import { useNavigate } from "react-router-dom";
import {
    FaSearch,
    FaTimes,
    FaUser,
    FaShoppingBag,
    FaBoxOpen,
    FaQuestionCircle,
    FaClipboardList,
    FaSpinner
} from "react-icons/fa";

function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef(null);
    const navigate = useNavigate();

    // Flatten results for keyboard navigation
    const flatItems = [];
    if (results) {
        (results.customers || []).forEach((c) => flatItems.push({ id: `cust-${c.UserID}`, path: `/customers/${c.UserID}` }));
        (results.orders || []).forEach((o) => flatItems.push({ id: `order-${o.OrderID}`, path: `/orders/${o.OrderID}` }));
        (results.products || []).forEach((p) => flatItems.push({ id: `prod-${p.ProductID}`, path: `/products/details/${p.ProductID}` }));
        (results.enquiries || []).forEach((e) => flatItems.push({ id: `enq-${e.EnquiryID}`, path: `/customer-enquiries` }));
        (results.productRequests || []).forEach((pr) => flatItems.push({ id: `req-${pr.RequestID}`, path: `/product-requests` }));
    }

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close on Escape key
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Debounced search effect
    useEffect(() => {
        const trimmed = query.trim();
        setSelectedIndex(-1);
        if (trimmed.length < 2) {
            setResults(null);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);
        setIsOpen(true);

        const debounceTimer = setTimeout(() => {
            const token = sessionStorage.getItem("token") || localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }

            Services.globalSearch("GET", null, token, trimmed)
                .then((res) => {
                    setLoading(false);
                    if (res && res.Status === 1) {
                        setResults(res.results || {});
                    } else {
                        setError(res.Message || "Error fetching search results");
                    }
                })
                .catch((err) => {
                    setLoading(false);
                    setError("Failed to execute search. Please try again.");
                    console.error("Global search error:", err);
                });
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [query]);

    const handleSelectResult = (path) => {
        setIsOpen(false);
        setQuery("");
        setSelectedIndex(-1);
        navigate(path);
    };

    const handleClear = () => {
        setQuery("");
        setIsOpen(false);
        setResults(null);
        setSelectedIndex(-1);
    };

    const hasResults = results && (
        (results.customers && results.customers.length > 0) ||
        (results.orders && results.orders.length > 0) ||
        (results.products && results.products.length > 0) ||
        (results.enquiries && results.enquiries.length > 0) ||
        (results.productRequests && results.productRequests.length > 0)
    );

    const handleInputKeyDown = (e) => {
        if (!isOpen || !hasResults || flatItems.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
        } else if (e.key === "Enter") {
            if (selectedIndex >= 0 && selectedIndex < flatItems.length) {
                e.preventDefault();
                handleSelectResult(flatItems[selectedIndex].path);
            }
        }
    };

    return (
        <div className={styles.searchContainer} ref={containerRef}>
            <div className={styles.inputWrapper}>
                <FaSearch className={styles.searchIcon} size={14} />
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search customers, orders, products, enquiries..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    onFocus={() => {
                        if (query.trim().length >= 2) setIsOpen(true);
                    }}
                />
                {loading && <FaSpinner className={`${styles.searchIcon} fa-spin`} size={13} style={{ animation: "spin 1s linear infinite" }} />}
                {query && !loading && (
                    <button type="button" className={styles.clearBtn} onClick={handleClear} title="Clear search">
                        <FaTimes size={13} />
                    </button>
                )}
            </div>

            {isOpen && query.trim().length >= 2 && (
                <div className={styles.resultsDropdown}>
                    <div className={styles.dropdownHeader}>
                        <span>Search Results for "{query}"</span>
                        <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>Esc to close</span>
                    </div>

                    {loading && (
                        <div className={styles.loadingState}>
                            <p>Searching across platform...</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className={styles.errorState}>
                            <p>{error}</p>
                        </div>
                    )}

                    {!loading && !error && !hasResults && (
                        <div className={styles.emptyState}>
                            <p>No results found matching "{query}"</p>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                                Try searching by customer name, phone, order ID, product name, or enquiry
                            </span>
                        </div>
                    )}

                    {!loading && hasResults && (
                        <>
                            {/* Customers */}
                            {results.customers && results.customers.length > 0 && (
                                <div className={styles.categoryGroup}>
                                    <div className={styles.categoryTitle}>
                                        <FaUser size={11} color="#3b82f6" /> Customers ({results.customers.length})
                                    </div>
                                    {results.customers.map((c) => {
                                        const itemKey = `cust-${c.UserID}`;
                                        const isSelected = flatItems[selectedIndex]?.id === itemKey;
                                        return (
                                            <div
                                                key={itemKey}
                                                className={`${styles.resultItem} ${isSelected ? styles.resultItemActive : ''}`}
                                                onClick={() => handleSelectResult(`/customers/${c.UserID}`)}
                                            >
                                                <div className={styles.itemLeft}>
                                                    <span className={styles.itemPrimary}>
                                                        {c.FirstName} {c.LastName !== 'NA' ? c.LastName : ''}
                                                    </span>
                                                    <span className={styles.itemSecondary}>
                                                        ID: #{c.UserID} &bull; {c.MobileNumber} {c.EmailID ? `&bull; ${c.EmailID}` : ''}
                                                    </span>
                                                </div>
                                                <span className={styles.itemBadge}>
                                                    ₹{parseFloat(c.WalletAmount || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Orders */}
                            {results.orders && results.orders.length > 0 && (
                                <div className={styles.categoryGroup}>
                                    <div className={styles.categoryTitle}>
                                        <FaShoppingBag size={11} color="#10b981" /> Orders ({results.orders.length})
                                    </div>
                                    {results.orders.map((o) => {
                                        const itemKey = `order-${o.OrderID}`;
                                        const isSelected = flatItems[selectedIndex]?.id === itemKey;
                                        return (
                                            <div
                                                key={itemKey}
                                                className={`${styles.resultItem} ${isSelected ? styles.resultItemActive : ''}`}
                                                onClick={() => handleSelectResult(`/orders/${o.OrderID}`)}
                                            >
                                                <div className={styles.itemLeft}>
                                                    <span className={styles.itemPrimary}>
                                                        Order #{o.OrderID} &bull; ₹{parseFloat(o.GrandTotal || 0).toFixed(2)}
                                                    </span>
                                                    <span className={styles.itemSecondary}>
                                                        Customer: {o.FirstName || ''} ({o.MobileNumber})
                                                    </span>
                                                </div>
                                                <span className={`${styles.itemBadge} ${styles.badgeSuccess}`}>
                                                    Status: {o.OrderStatus}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Products */}
                            {results.products && results.products.length > 0 && (
                                <div className={styles.categoryGroup}>
                                    <div className={styles.categoryTitle}>
                                        <FaBoxOpen size={11} color="#f59e0b" /> Products ({results.products.length})
                                    </div>
                                    {results.products.map((p) => {
                                        const itemKey = `prod-${p.ProductID}`;
                                        const isSelected = flatItems[selectedIndex]?.id === itemKey;
                                        return (
                                            <div
                                                key={itemKey}
                                                className={`${styles.resultItem} ${isSelected ? styles.resultItemActive : ''}`}
                                                onClick={() => handleSelectResult(`/products/details/${p.ProductID}`)}
                                            >
                                                <div className={styles.itemLeft}>
                                                    <span className={styles.itemPrimary}>
                                                        {p.ProductName}
                                                    </span>
                                                    <span className={styles.itemSecondary}>
                                                        ID: #{p.ProductID} {p.CategoryName ? `&bull; ${p.CategoryName}` : ''}
                                                    </span>
                                                </div>
                                                <span className={styles.itemBadge}>
                                                    {p.Status === 1 ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Customer Enquiries */}
                            {results.enquiries && results.enquiries.length > 0 && (
                                <div className={styles.categoryGroup}>
                                    <div className={styles.categoryTitle}>
                                        <FaQuestionCircle size={11} color="#8b5cf6" /> Customer Enquiries ({results.enquiries.length})
                                    </div>
                                    {results.enquiries.map((e) => {
                                        const itemKey = `enq-${e.EnquiryID}`;
                                        const isSelected = flatItems[selectedIndex]?.id === itemKey;
                                        return (
                                            <div
                                                key={itemKey}
                                                className={`${styles.resultItem} ${isSelected ? styles.resultItemActive : ''}`}
                                                onClick={() => handleSelectResult(`/customer-enquiries`)}
                                            >
                                                <div className={styles.itemLeft}>
                                                    <span className={styles.itemPrimary}>
                                                        Enquiry #{e.EnquiryID}: {e.Subject || "General Enquiry"}
                                                    </span>
                                                    <span className={styles.itemSecondary}>
                                                        From: {e.Name} ({e.MobileNumber})
                                                    </span>
                                                </div>
                                                <span className={`${styles.itemBadge} ${styles.badgePending}`}>
                                                    {e.Status || "Pending"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Product Requests */}
                            {results.productRequests && results.productRequests.length > 0 && (
                                <div className={styles.categoryGroup}>
                                    <div className={styles.categoryTitle}>
                                        <FaClipboardList size={11} color="#ec4899" /> Product Requests ({results.productRequests.length})
                                    </div>
                                    {results.productRequests.map((pr) => {
                                        const itemKey = `req-${pr.RequestID}`;
                                        const isSelected = flatItems[selectedIndex]?.id === itemKey;
                                        return (
                                            <div
                                                key={itemKey}
                                                className={`${styles.resultItem} ${isSelected ? styles.resultItemActive : ''}`}
                                                onClick={() => handleSelectResult(`/product-requests`)}
                                            >
                                                <div className={styles.itemLeft}>
                                                    <span className={styles.itemPrimary}>
                                                        Request #{pr.RequestID}: {pr.ProductName}
                                                    </span>
                                                    <span className={styles.itemSecondary}>
                                                        By: {pr.CustomerName} ({pr.MobileNumber})
                                                    </span>
                                                </div>
                                                <span className={`${styles.itemBadge} ${styles.badgePending}`}>
                                                    {pr.Status || "Pending"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default GlobalSearch;
