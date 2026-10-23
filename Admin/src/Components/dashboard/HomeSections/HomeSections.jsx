import React, { useState, useEffect, useMemo } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import ScaleLoader from "react-spinners/ScaleLoader";
import { css } from "@emotion/react";
import {
    FaEdit,
    FaTrash,
    FaPlus,
    FaCalendarAlt,
    FaCopy,
    FaEye,
    FaArrowUp,
    FaArrowDown,
    FaSyncAlt,
    FaSearch,
    FaLayerGroup,
    FaCheckCircle,
    FaClock,
    FaTags,
    FaShoppingBag,
    FaStar,
    FaThLarge,
    FaFire,
    FaHistory,
    FaImage,
    FaTimes
} from "react-icons/fa";

const SECTION_TYPE_CONFIG = {
    selected_products: {
        label: "Selected Products",
        badgeColor: "#2E7D32",
        bgColor: "#E8F5E9",
        icon: FaShoppingBag,
        description: "Manually curate and order specific catalog products"
    },
    shop_by_category: {
        label: "Shop by Category",
        badgeColor: "#1565C0",
        bgColor: "#E3F2FD",
        icon: FaThLarge,
        description: "Grid of active product categories"
    },
    category_shelf: {
        label: "Category Product Shelf",
        badgeColor: "#00838F",
        bgColor: "#E0F7FA",
        icon: FaLayerGroup,
        description: "Products automatically queried from selected category"
    },
    subcategory_shelf: {
        label: "Subcategory Product Shelf",
        badgeColor: "#6A1B9A",
        bgColor: "#F3E5F5",
        icon: FaTags,
        description: "Products automatically queried from selected subcategory"
    },
    bestsellers: {
        label: "Bestsellers",
        badgeColor: "#D84315",
        bgColor: "#FBE9E7",
        icon: FaFire,
        description: "Top-selling and high-demand items"
    },
    recommendations: {
        label: "Recommended Products",
        badgeColor: "#F57F17",
        bgColor: "#FFFDE7",
        icon: FaStar,
        description: "Curated item recommendations for customer"
    },
    deals_and_offers: {
        label: "Deals & Flash Offers",
        badgeColor: "#C2185B",
        bgColor: "#FCE4EC",
        icon: FaTags,
        description: "Products with active discounts and offer prices"
    },
    promotional_banner: {
        label: "Promotional Banner",
        badgeColor: "#455A64",
        bgColor: "#ECEFF1",
        icon: FaImage,
        description: "Visual promotional campaign banner"
    },
    order_again: {
        label: "Order Again",
        badgeColor: "#00695C",
        bgColor: "#E0F2F1",
        icon: FaHistory,
        description: "Personalized past purchase items for logged-in customer"
    }
};

const THEME_OPTIONS = [
    { label: "Clean White", value: "white", bgHex: "#FFFFFF", textHex: "#1F2937" },
    { label: "Emerald Fresh", value: "mint", bgHex: "#E8F5E9", textHex: "#1B5E20" },
    { label: "Warm Sunset", value: "orange", bgHex: "#FFF3E0", textHex: "#E65100" },
    { label: "Soft Lavender", value: "lavender", bgHex: "#F3E5F5", textHex: "#4A148C" },
    { label: "Sky Pastel", value: "sky", bgHex: "#E1F5FE", textHex: "#01579B" }
];

function HomeSections() {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, scheduled: 0, inactive: 0 });

    // Filters and Search
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [sortBy, setSortBy] = useState("DisplayOrder");
    const [sortOrder, setSortOrder] = useState("ASC");

    // Modal State
    const [modal, setModal] = useState(false);
    const [activeTab, setActiveTab] = useState("details"); // 'details', 'content', 'preview'
    const [editItem, setEditItem] = useState(null);
    const [previewModalItem, setPreviewModalItem] = useState(null);
    const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

    // Form fields
    const [formTitle, setFormTitle] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formSectionType, setFormSectionType] = useState("selected_products");
    const [formImageUrl, setFormImageUrl] = useState("");
    const [formStartDate, setFormStartDate] = useState("");
    const [formEndDate, setFormEndDate] = useState("");
    const [formStatus, setFormStatus] = useState(1);
    const [formDisplayOrder, setFormDisplayOrder] = useState(1);
    const [formViewAllLabel, setFormViewAllLabel] = useState("See all");
    const [formViewAllLink, setFormViewAllLink] = useState("");
    const [formTheme, setFormTheme] = useState("white");

    // Content selections in form
    const [selectedProducts, setSelectedProducts] = useState([]); // Array of product objects with order
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState([]);

    // Catalog lookup options
    const [catalogCategories, setCatalogCategories] = useState([]);
    const [catalogSubCategories, setCatalogSubCategories] = useState([]);
    const [catalogProducts, setCatalogProducts] = useState([]);
    const [productSearchInput, setProductSearchInput] = useState("");
    const [productCategoryFilter, setProductCategoryFilter] = useState("all");
    const [productSearchLoading, setProductSearchLoading] = useState(false);

    const getAuthToken = () => {
        const raw = sessionStorage.getItem("token");
        if (!raw || raw === "null" || raw === "undefined") {
            return {};
        }
        return { Authorization: `token ${raw}` };
    };

    const override = css`
        display: block;
        margin: 40px auto;
    `;

    // Fetch Sections
    const fetchSections = () => {
        setLoading(true);
        const queryParams = [];
        if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
        if (statusFilter !== "all") queryParams.push(`status=${statusFilter}`);
        if (typeFilter !== "all") queryParams.push(`sectionType=${typeFilter}`);
        queryParams.push(`sortBy=${sortBy}`);
        queryParams.push(`sortOrder=${sortOrder}`);

        Services.getHomeSections("GET", null, getAuthToken(), queryParams.join("&"))
            .then((res) => {
                setLoading(false);
                if (res && (res.status === 1 || res.Status === 1)) {
                    setSections(res.data || res.Sections || []);
                    if (res.counts) setStats(res.counts);
                } else {
                    toast.error((res && (res.message || res.Message)) || "Failed to load home sections");
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error(err);
                toast.error("Error loading home sections");
            });
    };

    // Fetch Category Options
    const fetchCategoryOptions = () => {
        Services.getHomeSectionCategoryOptions("GET", null, getAuthToken())
            .then((res) => {
                if (res && (res.status === 1 || res.Status === 1)) {
                    setCatalogCategories(res.Categories || []);
                    setCatalogSubCategories(res.SubCategories || []);
                }
            })
            .catch((err) => console.error(err));
    };

    // Fetch Products for Selector
    const fetchProductOptions = (search = "", catId = "all") => {
        setProductSearchLoading(true);
        const params = [];
        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (catId && catId !== "all") params.push(`categoryId=${catId}`);
        params.push("limit=100");

        Services.getHomeSectionProductOptions("GET", null, getAuthToken(), params.join("&"))
            .then((res) => {
                setProductSearchLoading(false);
                if (res && (res.status === 1 || res.Status === 1)) {
                    setCatalogProducts(res.Products || []);
                }
            })
            .catch((err) => {
                setProductSearchLoading(false);
                console.error(err);
            });
    };

    useEffect(() => {
        fetchSections();
        fetchCategoryOptions();
        fetchProductOptions();
    }, [searchQuery, statusFilter, typeFilter, sortBy, sortOrder]);

    // Handle Open Create Modal
    const openAddModal = () => {
        setEditItem(null);
        setFormTitle("");
        setFormDescription("");
        setFormSectionType("selected_products");
        setFormImageUrl("");
        setFormStartDate("");
        setFormEndDate("");
        setFormStatus(1);
        setFormDisplayOrder((sections.length > 0 ? Math.max(...sections.map(s => s.DisplayOrder || 0)) : 0) + 1);
        setFormViewAllLabel("See all");
        setFormViewAllLink("");
        setFormTheme("white");
        setSelectedProducts([]);
        setSelectedCategoryIds([]);
        setSelectedSubCategoryIds([]);
        setActiveTab("details");
        setModal(true);
    };

    // Handle Open Edit Modal
    const openEditModal = (row) => {
        setEditItem(row);
        setFormTitle(row.Title || row.Name || "");
        setFormDescription(row.Subtitle || row.Description || "");
        setFormSectionType(row.SectionType || "selected_products");
        setFormImageUrl(row.ImageUrl || "");
        setFormStartDate(row.StartDate ? row.StartDate.slice(0, 16) : "");
        setFormEndDate(row.EndDate ? row.EndDate.slice(0, 16) : "");
        setFormStatus(row.Status !== undefined ? row.Status : 1);
        setFormDisplayOrder(row.DisplayOrder || 0);

        const config = row.Configuration || {};
        setFormViewAllLabel(config.viewAllLabel || "See all");
        setFormViewAllLink(config.viewAllLink || "");
        setFormTheme(config.theme || "white");

        setSelectedProducts((row.Products || []).map((p, idx) => ({
            ...p,
            DisplayOrder: p.ItemOrder || idx + 1
        })));
        setSelectedCategoryIds((row.Categories || []).map(c => c.CategoryID));
        setSelectedSubCategoryIds((row.Subcategories || []).map(s => s.SubCategoryID));

        setActiveTab("details");
        setModal(true);
    };

    // Reorder Section Up / Down in Table
    const handleMoveSection = (index, direction) => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sections.length) return;

        const newSections = [...sections];
        const temp = newSections[index];
        newSections[index] = newSections[targetIndex];
        newSections[targetIndex] = temp;

        // Reassign display orders
        const payloadOrders = newSections.map((sec, idx) => ({
            HomeSectionID: sec.HomeSectionID,
            DisplayOrder: idx + 1
        }));

        setSections(newSections);

        Services.reorderHomeSections("PUT", JSON.stringify({ sections: payloadOrders }), getAuthToken())
            .then((res) => {
                if (res && (res.status === 1 || res.Status === 1)) {
                    toast.success("Section reordered successfully");
                    fetchSections();
                } else {
                    toast.error("Failed to persist order");
                    fetchSections();
                }
            })
            .catch((err) => {
                console.error(err);
                toast.error("Error reordering sections");
                fetchSections();
            });
    };

    // Duplicate Section
    const handleDuplicate = (id) => {
        Services.duplicateHomeSection("POST", null, getAuthToken(), id)
            .then((res) => {
                if (res && (res.status === 1 || res.Status === 1)) {
                    toast.success("Section duplicated as draft");
                    fetchSections();
                } else {
                    toast.error((res && (res.message || res.Message)) || "Failed to duplicate");
                }
            })
            .catch((err) => {
                console.error(err);
                toast.error("Error duplicating section");
            });
    };

    // Toggle Status (Publish / Unpublish)
    const handleToggleStatus = (id, currentStatus) => {
        const nextStatus = currentStatus === 1 ? 0 : 1;
        Services.updateHomeSectionStatus("PATCH", JSON.stringify({ Status: nextStatus }), getAuthToken(), id)
            .then((res) => {
                if (res && (res.status === 1 || res.Status === 1)) {
                    toast.success(`Section ${nextStatus === 1 ? 'Published' : 'Unpublished (Draft)'}`);
                    fetchSections();
                } else {
                    toast.error("Failed to update status");
                }
            })
            .catch((err) => {
                console.error(err);
                toast.error("Error updating status");
            });
    };

    // Delete Section
    const handleDeleteConfirm = () => {
        if (!deleteConfirmItem) return;
        Services.deleteHomeSection("DELETE", null, getAuthToken(), deleteConfirmItem.HomeSectionID)
            .then((res) => {
                if (res && (res.status === 1 || res.Status === 1)) {
                    toast.success("Home section deleted successfully");
                    setDeleteConfirmItem(null);
                    fetchSections();
                } else {
                    toast.error((res && (res.message || res.Message)) || "Failed to delete");
                }
            })
            .catch((err) => {
                console.error(err);
                toast.error("Error deleting section");
            });
    };

    // Save Create / Edit
    const handleSave = () => {
        if (!formTitle.trim()) {
            toast.error("Section Title is required");
            setActiveTab("details");
            return;
        }

        const config = {
            viewAllLabel: formViewAllLabel,
            viewAllLink: formViewAllLink,
            theme: formTheme
        };

        const payload = {
            Title: formTitle.trim(),
            Subtitle: formDescription.trim(),
            SectionType: formSectionType,
            ImageUrl: formImageUrl.trim(),
            StartDate: formStartDate || null,
            EndDate: formEndDate || null,
            Status: parseInt(formStatus, 10),
            DisplayOrder: parseInt(formDisplayOrder, 10) || 0,
            ConfigurationJSON: JSON.stringify(config),
            ProductIDs: selectedProducts.map((p, idx) => ({
                ProductID: p.ProductID,
                DisplayOrder: idx + 1
            })),
            CategoryIDs: selectedCategoryIds.map((cid, idx) => ({
                CategoryID: cid,
                DisplayOrder: idx + 1
            })),
            SubCategoryIDs: selectedSubCategoryIds.map((sid, idx) => ({
                SubCategoryID: sid,
                DisplayOrder: idx + 1
            }))
        };

        if (editItem) {
            Services.updateHomeSection("PUT", JSON.stringify(payload), getAuthToken(), editItem.HomeSectionID)
                .then((res) => {
                    if (res && (res.status === 1 || res.Status === 1)) {
                        toast.success("Home section updated successfully");
                        setModal(false);
                        fetchSections();
                    } else {
                        toast.error((res && (res.message || res.Message)) || "Failed to update");
                    }
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("Error updating section");
                });
        } else {
            Services.createHomeSection("POST", JSON.stringify(payload), getAuthToken())
                .then((res) => {
                    if (res && (res.status === 1 || res.Status === 1)) {
                        toast.success("Home section created successfully");
                        setModal(false);
                        fetchSections();
                    } else {
                        toast.error((res && (res.message || res.Message)) || "Failed to create");
                    }
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("Error creating section");
                });
        }
    };

    // Product Selection Helper Handlers
    const handleToggleProduct = (product) => {
        const exists = selectedProducts.some(p => p.ProductID === product.ProductID);
        if (exists) {
            setSelectedProducts(selectedProducts.filter(p => p.ProductID !== product.ProductID));
        } else {
            setSelectedProducts([...selectedProducts, { ...product, DisplayOrder: selectedProducts.length + 1 }]);
        }
    };

    const handleMoveProduct = (index, direction) => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= selectedProducts.length) return;
        const newProducts = [...selectedProducts];
        const temp = newProducts[index];
        newProducts[index] = newProducts[targetIndex];
        newProducts[targetIndex] = temp;
        setSelectedProducts(newProducts);
    };

    const handleRemoveSelectedProduct = (productId) => {
        setSelectedProducts(selectedProducts.filter(p => p.ProductID !== productId));
    };

    // Category Selection Helper Handlers
    const handleToggleCategory = (categoryId) => {
        if (selectedCategoryIds.includes(categoryId)) {
            setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== categoryId));
        } else {
            setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
        }
    };

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="home-sections" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
                    
                    {/* Page Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                        <div>
                            <h2 style={{ fontWeight: 700, color: "#1F2937", margin: 0, fontSize: "24px" }}>
                                Dynamic Home Page Sections
                            </h2>
                            <p style={{ color: "#6B7280", margin: "6px 0 0 0", fontSize: "14px" }}>
                                Manage, schedule, and reorder dynamic storefront sections displayed on the ClikGett customer mobile app.
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={fetchSections}
                                title="Refresh"
                                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                            >
                                <FaSyncAlt /> Refresh
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={openAddModal}
                                style={{
                                    backgroundColor: "#2E7D32",
                                    borderColor: "#2E7D32",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    fontWeight: 600,
                                    padding: "8px 18px",
                                    borderRadius: "8px"
                                }}
                            >
                                <FaPlus /> Add New Section
                            </button>
                        </div>
                    </div>

                    {/* Dashboard Metric Statistics Cards */}
                    <div className="row g-3" style={{ marginBottom: "24px" }}>
                        <div className="col-md" onClick={() => setStatusFilter("all")} style={{ cursor: "pointer" }}>
                            <div style={{
                                backgroundColor: statusFilter === "all" ? "#E8F5E9" : "#FFFFFF",
                                border: statusFilter === "all" ? "2px solid #2E7D32" : "1px solid #E5E7EB",
                                borderRadius: "12px",
                                padding: "16px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Total Sections</div>
                                <div style={{ fontSize: "24px", fontWeight: 700, color: "#1F2937", marginTop: "4px" }}>{stats.total || 0}</div>
                            </div>
                        </div>
                        <div className="col-md" onClick={() => setStatusFilter("1")} style={{ cursor: "pointer" }}>
                            <div style={{
                                backgroundColor: statusFilter === "1" ? "#E8F5E9" : "#FFFFFF",
                                border: statusFilter === "1" ? "2px solid #2E7D32" : "1px solid #E5E7EB",
                                borderRadius: "12px",
                                padding: "16px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{ fontSize: "12px", fontWeight: 600, color: "#2E7D32", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#2E7D32" }} /> Published & Live
                                </div>
                                <div style={{ fontSize: "24px", fontWeight: 700, color: "#2E7D32", marginTop: "4px" }}>{stats.published || 0}</div>
                            </div>
                        </div>
                        <div className="col-md" onClick={() => setStatusFilter("0")} style={{ cursor: "pointer" }}>
                            <div style={{
                                backgroundColor: statusFilter === "0" ? "#FFF8E1" : "#FFFFFF",
                                border: statusFilter === "0" ? "2px solid #F57F17" : "1px solid #E5E7EB",
                                borderRadius: "12px",
                                padding: "16px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{ fontSize: "12px", fontWeight: 600, color: "#F57F17", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#F57F17" }} /> Drafts
                                </div>
                                <div style={{ fontSize: "24px", fontWeight: 700, color: "#F57F17", marginTop: "4px" }}>{stats.draft || 0}</div>
                            </div>
                        </div>
                        <div className="col-md" onClick={() => setStatusFilter("2")} style={{ cursor: "pointer" }}>
                            <div style={{
                                backgroundColor: statusFilter === "2" ? "#EDE7F6" : "#FFFFFF",
                                border: statusFilter === "2" ? "2px solid #5E35B1" : "1px solid #E5E7EB",
                                borderRadius: "12px",
                                padding: "16px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{ fontSize: "12px", fontWeight: 600, color: "#5E35B1", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#5E35B1" }} /> Scheduled
                                </div>
                                <div style={{ fontSize: "24px", fontWeight: 700, color: "#5E35B1", marginTop: "4px" }}>{stats.scheduled || 0}</div>
                            </div>
                        </div>
                        <div className="col-md" onClick={() => setStatusFilter("3")} style={{ cursor: "pointer" }}>
                            <div style={{
                                backgroundColor: statusFilter === "3" ? "#ECEFF1" : "#FFFFFF",
                                border: statusFilter === "3" ? "2px solid #546E7A" : "1px solid #E5E7EB",
                                borderRadius: "12px",
                                padding: "16px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{ fontSize: "12px", fontWeight: 600, color: "#546E7A", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#546E7A" }} /> Inactive / Expired
                                </div>
                                <div style={{ fontSize: "24px", fontWeight: 700, color: "#546E7A", marginTop: "4px" }}>{stats.inactive || 0}</div>
                            </div>
                        </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: "12px",
                        padding: "16px 20px",
                        marginBottom: "20px",
                        border: "1px solid #E5E7EB",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "14px",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", flex: 1 }}>
                            {/* Search */}
                            <div style={{ position: "relative", minWidth: "260px" }}>
                                <FaSearch style={{ position: "absolute", left: "12px", top: "12px", color: "#9CA3AF" }} />
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by section title..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ paddingLeft: "36px", borderRadius: "8px" }}
                                />
                            </div>

                            {/* Status Filter */}
                            <select
                                className="form-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ width: "170px", borderRadius: "8px" }}
                            >
                                <option value="all">All Statuses</option>
                                <option value="1">Published & Live</option>
                                <option value="0">Draft</option>
                                <option value="2">Scheduled</option>
                                <option value="3">Inactive / Expired</option>
                            </select>

                            {/* Section Type Filter */}
                            <select
                                className="form-select"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                style={{ width: "210px", borderRadius: "8px" }}
                            >
                                <option value="all">All Section Types</option>
                                {Object.entries(SECTION_TYPE_CONFIG).map(([key, cfg]) => (
                                    <option key={key} value={key}>{cfg.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sort Selector */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "13px", color: "#6B7280" }}>Sort by:</span>
                            <select
                                className="form-select form-select-sm"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                style={{ width: "140px", borderRadius: "6px" }}
                            >
                                <option value="DisplayOrder">Display Order</option>
                                <option value="Name">Section Title</option>
                                <option value="created_at">Date Created</option>
                                <option value="Status">Status</option>
                            </select>
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")}
                                title="Toggle Sort Order"
                            >
                                {sortOrder === "ASC" ? "▲ Asc" : "▼ Desc"}
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    {loading ? (
                        <div className={dashboardclasses["loader"]} style={{ textAlign: "center", padding: "60px 0" }}>
                            <ScaleLoader color={"#2E7D32"} loading={true} css={override} size={150} />
                            <p style={{ color: "#6B7280", marginTop: "12px" }}>Loading home sections...</p>
                        </div>
                    ) : sections.length === 0 ? (
                        <div style={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: "12px",
                            padding: "60px 20px",
                            textAlign: "center",
                            border: "1px dashed #D1D5DB"
                        }}>
                            <FaLayerGroup size={48} style={{ color: "#9CA3AF", marginBottom: "16px" }} />
                            <h4 style={{ fontWeight: 600, color: "#1F2937" }}>No Home Sections Found</h4>
                            <p style={{ color: "#6B7280", maxWidth: "460px", margin: "8px auto 20px auto" }}>
                                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                                    ? "No sections match your active filters. Try clearing filters or searching for something else."
                                    : "Get started by creating your first dynamic storefront section to engage your customers."}
                            </p>
                            <button className="btn btn-success" onClick={openAddModal} style={{ backgroundColor: "#2E7D32" }}>
                                <FaPlus /> Create First Section
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: "12px",
                            border: "1px solid #E5E7EB",
                            overflow: "hidden",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                        }}>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                                        <tr>
                                            <th style={{ width: "90px", textAlign: "center" }}>Order</th>
                                            <th style={{ minWidth: "260px" }}>Section Title & Type</th>
                                            <th style={{ minWidth: "150px" }}>Catalog Content</th>
                                            <th style={{ minWidth: "200px" }}>Campaign Window</th>
                                            <th style={{ minWidth: "130px" }}>Status</th>
                                            <th style={{ minWidth: "180px", textAlign: "right" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sections.map((row, index) => {
                                            const typeConfig = SECTION_TYPE_CONFIG[row.SectionType] || SECTION_TYPE_CONFIG.selected_products;
                                            const TypeIcon = typeConfig.icon;

                                            const now = new Date();
                                            const start = row.StartDate ? new Date(row.StartDate) : null;
                                            const end = row.EndDate ? new Date(row.EndDate) : null;
                                            const isUpcoming = start && start > now;
                                            const isExpired = end && end < now;
                                            const isLive = row.Status === 1 && (!start || start <= now) && (!end || end >= now);

                                            return (
                                                <tr key={row.HomeSectionID}>
                                                    {/* Display Order with Up / Down Controls */}
                                                    <td style={{ textAlign: "center" }}>
                                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                                            <div style={{ fontWeight: 700, fontSize: "15px", color: "#1F2937" }}>
                                                                #{row.DisplayOrder || index + 1}
                                                            </div>
                                                            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                                                                <button
                                                                    className="btn btn-sm btn-light p-1"
                                                                    onClick={() => handleMoveSection(index, "up")}
                                                                    disabled={index === 0}
                                                                    title="Move Up"
                                                                    style={{ fontSize: "10px", lineHeight: 1 }}
                                                                >
                                                                    <FaArrowUp />
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-light p-1"
                                                                    onClick={() => handleMoveSection(index, "down")}
                                                                    disabled={index === sections.length - 1}
                                                                    title="Move Down"
                                                                    style={{ fontSize: "10px", lineHeight: 1 }}
                                                                >
                                                                    <FaArrowDown />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Section Title, Subtitle, and Type */}
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                                            <div style={{
                                                                width: "36px",
                                                                height: "36px",
                                                                borderRadius: "8px",
                                                                backgroundColor: typeConfig.bgColor,
                                                                color: typeConfig.badgeColor,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                flexShrink: 0,
                                                                marginTop: "2px"
                                                            }}>
                                                                <TypeIcon size={18} />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 600, color: "#111827", fontSize: "15px" }}>
                                                                    {row.Title || row.Name}
                                                                </div>
                                                                {(row.Subtitle || row.Description) && (
                                                                    <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>
                                                                        {row.Subtitle || row.Description}
                                                                    </div>
                                                                )}
                                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", marginTop: "6px" }}>
                                                                    <div style={{
                                                                        fontSize: "11px",
                                                                        fontWeight: 600,
                                                                        padding: "2px 8px",
                                                                        borderRadius: "4px",
                                                                        backgroundColor: typeConfig.bgColor,
                                                                        color: typeConfig.badgeColor
                                                                    }}>
                                                                        {typeConfig.label}
                                                                    </div>
                                                                    {row.IsBuiltIn === 1 || row.SystemKey ? (
                                                                        <span className="badge" style={{ backgroundColor: "#1E293B", color: "#F8FAFC", fontSize: "10px", fontWeight: 600, padding: "3px 7px" }}>
                                                                            Built-in System Section
                                                                        </span>
                                                                    ) : (
                                                                        <span className="badge" style={{ backgroundColor: "#F3F4F6", color: "#4B5563", fontSize: "10px", fontWeight: 600, padding: "3px 7px", border: "1px solid #D1D5DB" }}>
                                                                            Custom Curated Shelf
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Content Count Summary */}
                                                    <td>
                                                        {row.SectionType === "selected_products" && (
                                                            <span className="badge bg-light text-dark" style={{ border: "1px solid #D1D5DB" }}>
                                                                {row.ProductCount || (row.Products ? row.Products.length : 0)} Products
                                                            </span>
                                                        )}
                                                        {row.SectionType === "category_shelf" && (
                                                            <span className="badge bg-light text-primary" style={{ border: "1px solid #90CAF9" }}>
                                                                {row.CategoryCount || (row.Categories ? row.Categories.length : 0)} Categories Selected
                                                            </span>
                                                        )}
                                                        {row.SectionType === "shop_by_category" && (
                                                            <span className="badge bg-light text-info" style={{ border: "1px solid #80DEEA" }}>
                                                                Category Grid
                                                            </span>
                                                        )}
                                                        {row.SectionType === "subcategory_shelf" && (
                                                            <span className="badge bg-light text-purple" style={{ border: "1px solid #CE93D8" }}>
                                                                Subcategory Shelf
                                                            </span>
                                                        )}
                                                        {["bestsellers", "recommendations", "deals_and_offers"].includes(row.SectionType) && (
                                                            <span className="badge bg-light text-success" style={{ border: "1px solid #A5D6A7" }}>
                                                                Dynamic Catalog Rules
                                                            </span>
                                                        )}
                                                        {row.SectionType === "order_again" && (
                                                            <span className="badge bg-light text-secondary" style={{ border: "1px solid #B0BEC5" }}>
                                                                Personalized Past Orders
                                                            </span>
                                                        )}
                                                        {row.SectionType === "promotional_banner" && (
                                                            <span className="badge bg-light text-secondary" style={{ border: "1px solid #CFD8DC" }}>
                                                                Campaign Banner
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Campaign Schedule Window */}
                                                    <td>
                                                        <div style={{ fontSize: "13px" }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#374151" }}>
                                                                <FaCalendarAlt size={12} color="#6B7280" />
                                                                {row.StartDate ? new Date(row.StartDate).toLocaleDateString() : "Always active"}
                                                                {" → "}
                                                                {row.EndDate ? new Date(row.EndDate).toLocaleDateString() : "Ongoing"}
                                                            </div>
                                                            <div style={{ marginTop: "4px" }}>
                                                                {isLive && (
                                                                    <span className="badge" style={{ backgroundColor: "#2E7D32", fontSize: "11px" }}>
                                                                        ● Live Now
                                                                    </span>
                                                                )}
                                                                {isUpcoming && (
                                                                    <span className="badge bg-warning text-dark" style={{ fontSize: "11px" }}>
                                                                        ⏱ Upcoming
                                                                    </span>
                                                                )}
                                                                {isExpired && (
                                                                    <span className="badge bg-secondary" style={{ fontSize: "11px" }}>
                                                                        Expired
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Status Badge & Quick Toggle */}
                                                    <td>
                                                        <button
                                                            onClick={() => handleToggleStatus(row.HomeSectionID, row.Status)}
                                                            title="Click to toggle status"
                                                            style={{
                                                                border: "none",
                                                                background: "none",
                                                                padding: 0,
                                                                cursor: "pointer"
                                                            }}
                                                        >
                                                            {row.Status === 1 ? (
                                                                <span className="badge bg-success" style={{ padding: "6px 10px", borderRadius: "20px" }}>
                                                                    Published
                                                                </span>
                                                            ) : row.Status === 0 ? (
                                                                <span className="badge bg-warning text-dark" style={{ padding: "6px 10px", borderRadius: "20px" }}>
                                                                    Draft
                                                                </span>
                                                            ) : (
                                                                <span className="badge bg-secondary" style={{ padding: "6px 10px", borderRadius: "20px" }}>
                                                                    Inactive
                                                                </span>
                                                            )}
                                                        </button>
                                                    </td>

                                                    {/* Action Buttons */}
                                                    <td style={{ textAlign: "right" }}>
                                                        <div style={{ display: "inline-flex", gap: "6px" }}>
                                                            {/* Preview */}
                                                            <button
                                                                className="btn btn-sm btn-outline-info"
                                                                onClick={() => setPreviewModalItem(row)}
                                                                title="Preview in Mobile View"
                                                            >
                                                                <FaEye />
                                                            </button>
                                                            {/* Edit */}
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => openEditModal(row)}
                                                                title="Edit Section"
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                            {/* Duplicate */}
                                                            <button
                                                                className="btn btn-sm btn-outline-secondary"
                                                                onClick={() => handleDuplicate(row.HomeSectionID)}
                                                                title="Duplicate as Draft"
                                                            >
                                                                <FaCopy />
                                                            </button>
                                                            {/* Delete */}
                                                            {row.IsBuiltIn === 1 || row.SystemKey ? (
                                                                <button
                                                                    className="btn btn-sm btn-outline-secondary"
                                                                    disabled
                                                                    style={{ opacity: 0.4, cursor: "not-allowed" }}
                                                                    title="Built-in system sections cannot be deleted. You can unpublish or hide them instead."
                                                                >
                                                                    <FaTrash />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => setDeleteConfirmItem(row)}
                                                                    title="Delete Section"
                                                                >
                                                                    <FaTrash />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* CREATE / EDIT SECTION MODAL */}
                    {modal && (
                        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050 }}>
                            <div className="modal-dialog modal-xl modal-dialog-scrollable">
                                <div className="modal-content" style={{ borderRadius: "16px", overflow: "hidden" }}>
                                    
                                    {/* Modal Header */}
                                    <div className="modal-header" style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB", padding: "16px 24px" }}>
                                        <div>
                                            <h5 className="modal-title" style={{ fontWeight: 700, color: "#111827" }}>
                                                {editItem ? "Edit Home Section" : "Add New Home Section"}
                                            </h5>
                                            <div style={{ fontSize: "13px", color: "#6B7280" }}>
                                                Configure display parameters, catalog content, and view live Flutter mobile preview.
                                            </div>
                                        </div>
                                        <button type="button" className="btn-close" onClick={() => setModal(false)} />
                                    </div>

                                    {/* Tabs Navigation */}
                                    <div style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E5E7EB", padding: "0 24px" }}>
                                        <ul className="nav nav-tabs" style={{ borderBottom: "none" }}>
                                            <li className="nav-item">
                                                <button
                                                    className={`nav-link ${activeTab === "details" ? "active fw-bold text-success" : "text-muted"}`}
                                                    onClick={() => setActiveTab("details")}
                                                    style={{ borderBottom: activeTab === "details" ? "3px solid #2E7D32" : "none" }}
                                                >
                                                    1. Basic Details
                                                </button>
                                            </li>
                                            <li className="nav-item">
                                                <button
                                                    className={`nav-link ${activeTab === "content" ? "active fw-bold text-success" : "text-muted"}`}
                                                    onClick={() => setActiveTab("content")}
                                                    style={{ borderBottom: activeTab === "content" ? "3px solid #2E7D32" : "none" }}
                                                >
                                                    2. Content & Items ({formSectionType === "selected_products" ? selectedProducts.length : (selectedCategoryIds.length || "Auto")})
                                                </button>
                                            </li>
                                            <li className="nav-item">
                                                <button
                                                    className={`nav-link ${activeTab === "preview" ? "active fw-bold text-success" : "text-muted"}`}
                                                    onClick={() => setActiveTab("preview")}
                                                    style={{ borderBottom: activeTab === "preview" ? "3px solid #2E7D32" : "none" }}
                                                >
                                                    3. Live Customer App Preview
                                                </button>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="modal-body" style={{ padding: "24px" }}>

                                        {/* TAB 1: BASIC DETAILS */}
                                        {activeTab === "details" && (
                                            <div className="row g-3">
                                                {editItem && (editItem.IsBuiltIn === 1 || editItem.SystemKey) && (
                                                    <div className="col-md-12">
                                                        <div className="alert alert-info d-flex align-items-center mb-1" style={{ borderRadius: "8px", fontSize: "13px" }}>
                                                            <div>
                                                                <strong>Built-in System Section:</strong> This section is an authoritative core component of the customer homepage (<code>{editItem.SystemKey}</code>). You can customize its display title, subtitle, card theme, display sequence, schedule window, and visibility. The underlying catalog data stream is managed automatically.
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="col-md-8">
                                                    <label className="form-label fw-bold">Section Title <span className="text-danger">*</span></label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="e.g. Daily Fresh Essentials, Weekend Steals"
                                                        value={formTitle}
                                                        onChange={(e) => setFormTitle(e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label fw-bold">Display Order</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={formDisplayOrder}
                                                        onChange={(e) => setFormDisplayOrder(e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-md-12">
                                                    <label className="form-label fw-bold">Subtitle / Description</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="e.g. Pure morning dairy, crisp vegetables and fresh staples"
                                                        value={formDescription}
                                                        onChange={(e) => setFormDescription(e.target.value)}
                                                    />
                                                </div>

                                                {/* Section Type Selector */}
                                                <div className="col-md-12">
                                                    <label className="form-label fw-bold">
                                                        Section Type <span className="text-danger">*</span>
                                                        {editItem && (editItem.IsBuiltIn === 1 || editItem.SystemKey) && (
                                                            <span className="badge bg-secondary ms-2" style={{ fontSize: "11px" }}>System Locked</span>
                                                        )}
                                                    </label>
                                                    <div className="row g-2">
                                                        {Object.entries(SECTION_TYPE_CONFIG).map(([typeKey, cfg]) => {
                                                            const isSelected = formSectionType === typeKey;
                                                            const Icon = cfg.icon;
                                                            const isLocked = Boolean(editItem && (editItem.IsBuiltIn === 1 || editItem.SystemKey));
                                                            return (
                                                                <div key={typeKey} className="col-md-4">
                                                                    <div
                                                                        onClick={() => {
                                                                            if (!isLocked) {
                                                                                setFormSectionType(typeKey);
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            padding: "12px",
                                                                            borderRadius: "10px",
                                                                            border: isSelected ? "2px solid #2E7D32" : "1px solid #E5E7EB",
                                                                            backgroundColor: isSelected ? "#F1F8E9" : "#FFFFFF",
                                                                            cursor: isLocked ? "not-allowed" : "pointer",
                                                                            opacity: isLocked && !isSelected ? 0.45 : 1,
                                                                            height: "100%"
                                                                        }}
                                                                    >
                                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                            <Icon color={cfg.badgeColor} size={16} />
                                                                            <span style={{ fontWeight: 600, fontSize: "14px", color: isSelected ? "#2E7D32" : "#1F2937" }}>
                                                                                {cfg.label}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>
                                                                            {cfg.description}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Schedule Dates */}
                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold">Campaign Start Date & Time (Optional)</label>
                                                    <input
                                                        type="datetime-local"
                                                        className="form-control"
                                                        value={formStartDate}
                                                        onChange={(e) => setFormStartDate(e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold">Campaign End Date & Time (Optional)</label>
                                                    <input
                                                        type="datetime-local"
                                                        className="form-control"
                                                        value={formEndDate}
                                                        onChange={(e) => setFormEndDate(e.target.value)}
                                                    />
                                                </div>

                                                {/* Status & Banner */}
                                                <div className="col-md-4">
                                                    <label className="form-label fw-bold">Publishing Status</label>
                                                    <select
                                                        className="form-select"
                                                        value={formStatus}
                                                        onChange={(e) => setFormStatus(e.target.value)}
                                                    >
                                                        <option value={1}>Published (Visible in App)</option>
                                                        <option value={0}>Draft (Hidden from App)</option>
                                                        <option value={2}>Scheduled</option>
                                                        <option value={3}>Inactive</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-8">
                                                    <label className="form-label fw-bold">Header Banner / Icon Image URL (Optional)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Image URL, e.g. /media/Sections/banner.png"
                                                        value={formImageUrl}
                                                        onChange={(e) => setFormImageUrl(e.target.value)}
                                                    />
                                                </div>

                                                {/* View All & Theme */}
                                                <div className="col-md-4">
                                                    <label className="form-label fw-bold">"View All" Button Label</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={formViewAllLabel}
                                                        onChange={(e) => setFormViewAllLabel(e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label fw-bold">Card Background Theme</label>
                                                    <select
                                                        className="form-select"
                                                        value={formTheme}
                                                        onChange={(e) => setFormTheme(e.target.value)}
                                                    >
                                                        {THEME_OPTIONS.map(t => (
                                                            <option key={t.value} value={t.value}>{t.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 2: CONTENT & ITEM SELECTION */}
                                        {activeTab === "content" && (
                                            <div>
                                                {/* SECTION TYPE: SELECTED PRODUCTS */}
                                                {formSectionType === "selected_products" && (
                                                    <div>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                                                            <div>
                                                                <h6 style={{ fontWeight: 700, margin: 0 }}>Select & Order Catalog Products</h6>
                                                                <span style={{ fontSize: "13px", color: "#6B7280" }}>
                                                                    {selectedProducts.length} product(s) currently selected for this shelf
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Selected Products Shelf Reordering Panel */}
                                                        {selectedProducts.length > 0 && (
                                                            <div style={{
                                                                backgroundColor: "#F9FAFB",
                                                                borderRadius: "10px",
                                                                padding: "14px",
                                                                marginBottom: "18px",
                                                                border: "1px solid #E5E7EB"
                                                            }}>
                                                                <div style={{ fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "10px" }}>
                                                                    Selected Order in Flutter App (Drag or use arrows to position):
                                                                </div>
                                                                <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px" }}>
                                                                    {selectedProducts.map((sp, sIdx) => (
                                                                        <div
                                                                            key={sp.ProductID}
                                                                            style={{
                                                                                width: "140px",
                                                                                backgroundColor: "#FFFFFF",
                                                                                borderRadius: "8px",
                                                                                padding: "8px",
                                                                                border: "1px solid #D1D5DB",
                                                                                flexShrink: 0,
                                                                                position: "relative"
                                                                            }}
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveSelectedProduct(sp.ProductID)}
                                                                                style={{
                                                                                    position: "absolute",
                                                                                    top: 4,
                                                                                    right: 4,
                                                                                    background: "#FEE2E2",
                                                                                    border: "none",
                                                                                    borderRadius: "50%",
                                                                                    width: 20,
                                                                                    height: 20,
                                                                                    color: "#DC2626",
                                                                                    cursor: "pointer",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    fontSize: "10px"
                                                                                }}
                                                                                title="Remove product"
                                                                            >
                                                                                <FaTimes />
                                                                            </button>
                                                                            <div style={{ height: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                                <img
                                                                                    src={sp.ImageUrl || (sp.ProductImages && sp.ProductImages[0]) || "https://placehold.co/60"}
                                                                                    alt=""
                                                                                    style={{ maxHeight: "55px", maxWidth: "90%", objectFit: "contain" }}
                                                                                />
                                                                            </div>
                                                                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#1F2937", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                                {sp.ProductName}
                                                                            </div>
                                                                            <div style={{ fontSize: "11px", color: "#2E7D32", fontWeight: 700 }}>
                                                                                ₹{sp.OfferPrice || sp.Price || 0}
                                                                            </div>
                                                                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn btn-sm btn-light p-1"
                                                                                    disabled={sIdx === 0}
                                                                                    onClick={() => handleMoveProduct(sIdx, "up")}
                                                                                    style={{ fontSize: "10px", lineHeight: 1 }}
                                                                                >
                                                                                    ◀
                                                                                </button>
                                                                                <span style={{ fontSize: "11px", color: "#6B7280", alignSelf: "center" }}>#{sIdx + 1}</span>
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn btn-sm btn-light p-1"
                                                                                    disabled={sIdx === selectedProducts.length - 1}
                                                                                    onClick={() => handleMoveProduct(sIdx, "down")}
                                                                                    style={{ fontSize: "10px", lineHeight: 1 }}
                                                                                >
                                                                                    ▶
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Catalog Search & Filters */}
                                                        <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                                                            <div style={{ position: "relative", flex: 1 }}>
                                                                <FaSearch style={{ position: "absolute", left: "10px", top: "11px", color: "#9CA3AF" }} />
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm"
                                                                    placeholder="Search catalog products by name or ID..."
                                                                    value={productSearchInput}
                                                                    onChange={(e) => {
                                                                        setProductSearchInput(e.target.value);
                                                                        fetchProductOptions(e.target.value, productCategoryFilter);
                                                                    }}
                                                                    style={{ paddingLeft: "32px" }}
                                                                />
                                                            </div>
                                                            <select
                                                                className="form-select form-select-sm"
                                                                value={productCategoryFilter}
                                                                onChange={(e) => {
                                                                    setProductCategoryFilter(e.target.value);
                                                                    fetchProductOptions(productSearchInput, e.target.value);
                                                                }}
                                                                style={{ width: "220px" }}
                                                            >
                                                                <option value="all">All Categories</option>
                                                                {catalogCategories.map(c => (
                                                                    <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Product Catalog Picker Grid */}
                                                        {productSearchLoading ? (
                                                            <div style={{ textAlign: "center", padding: "30px 0" }}>
                                                                <ScaleLoader color="#2E7D32" size={80} />
                                                            </div>
                                                        ) : (
                                                            <div style={{ maxHeight: "320px", overflowY: "auto", border: "1px solid #E5E7EB", borderRadius: "8px" }}>
                                                                <table className="table table-sm table-hover mb-0 align-middle">
                                                                    <thead style={{ backgroundColor: "#F9FAFB", position: "sticky", top: 0, zIndex: 1 }}>
                                                                        <tr>
                                                                            <th style={{ width: "40px", textAlign: "center" }}>Select</th>
                                                                            <th style={{ width: "60px" }}>Image</th>
                                                                            <th>Product Name</th>
                                                                            <th>Category</th>
                                                                            <th>Price</th>
                                                                            <th>Stock</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {catalogProducts.map(p => {
                                                                            const isChecked = selectedProducts.some(sp => sp.ProductID === p.ProductID);
                                                                            return (
                                                                                <tr
                                                                                    key={p.ProductID}
                                                                                    onClick={() => handleToggleProduct(p)}
                                                                                    style={{ cursor: "pointer", backgroundColor: isChecked ? "#F0FDF4" : "transparent" }}
                                                                                >
                                                                                    <td style={{ textAlign: "center" }}>
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={isChecked}
                                                                                            onChange={() => {}} // handled by row click
                                                                                        />
                                                                                    </td>
                                                                                    <td>
                                                                                        <img
                                                                                            src={p.ImageUrl || (p.ProductImages && p.ProductImages[0]) || "https://placehold.co/40"}
                                                                                            alt=""
                                                                                            style={{ width: "36px", height: "36px", objectFit: "contain", borderRadius: "4px" }}
                                                                                        />
                                                                                    </td>
                                                                                    <td>
                                                                                        <span style={{ fontWeight: 600, color: "#1F2937" }}>{p.ProductName}</span>
                                                                                        {p.metricvalue && p.metrictype && (
                                                                                            <span style={{ fontSize: "12px", color: "#6B7280", marginLeft: "6px" }}>
                                                                                                ({p.metricvalue} {p.metrictype})
                                                                                            </span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td style={{ fontSize: "13px", color: "#6B7280" }}>
                                                                                        {p.CategoryName || "General"}
                                                                                    </td>
                                                                                    <td style={{ fontSize: "13px", fontWeight: 600, color: "#2E7D32" }}>
                                                                                        ₹{p.OfferPrice || p.Price || 0}
                                                                                    </td>
                                                                                    <td>
                                                                                        <span className={`badge ${p.AvailableQty > 0 ? 'bg-success' : 'bg-danger'}`}>
                                                                                            {p.AvailableQty > 0 ? `${p.AvailableQty} in stock` : 'Out of stock'}
                                                                                        </span>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* SECTION TYPE: CATEGORY SHELF OR SHOP BY CATEGORY */}
                                                {(formSectionType === "category_shelf" || formSectionType === "shop_by_category") && (
                                                    <div>
                                                        <h6 style={{ fontWeight: 700, marginBottom: "8px" }}>Select Store Categories</h6>
                                                        <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "16px" }}>
                                                            {formSectionType === "category_shelf"
                                                                ? "Products belonging to the selected categories will be dynamically loaded onto this shelf."
                                                                : "Selected categories will be displayed in the 4-column quick-commerce grid on customer home page."}
                                                        </p>

                                                        <div className="row g-2">
                                                            {catalogCategories.map(cat => {
                                                                const isSelected = selectedCategoryIds.includes(cat.CategoryID);
                                                                return (
                                                                    <div key={cat.CategoryID} className="col-md-3">
                                                                        <div
                                                                            onClick={() => handleToggleCategory(cat.CategoryID)}
                                                                            style={{
                                                                                border: isSelected ? "2px solid #2E7D32" : "1px solid #E5E7EB",
                                                                                backgroundColor: isSelected ? "#F1F8E9" : "#FFFFFF",
                                                                                borderRadius: "10px",
                                                                                padding: "10px",
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                gap: "10px",
                                                                                cursor: "pointer"
                                                                            }}
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={isSelected}
                                                                                onChange={() => {}}
                                                                            />
                                                                            <img
                                                                                src={cat.CategoryImage || cat.ImageUrl || "https://placehold.co/40"}
                                                                                alt=""
                                                                                style={{ width: 36, height: 36, objectFit: "contain" }}
                                                                            />
                                                                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1F2937" }}>
                                                                                {cat.CategoryName}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* SECTION TYPE: AUTOMATED BACKEND RULE SECTIONS */}
                                                {["bestsellers", "recommendations", "deals_and_offers", "order_again", "promotional_banner"].includes(formSectionType) && (
                                                    <div style={{
                                                        backgroundColor: "#F9FAFB",
                                                        borderRadius: "12px",
                                                        padding: "30px",
                                                        textAlign: "center",
                                                        border: "1px dashed #D1D5DB"
                                                    }}>
                                                        <FaCheckCircle size={36} color="#2E7D32" style={{ marginBottom: "12px" }} />
                                                        <h5 style={{ fontWeight: 700, color: "#1F2937" }}>
                                                            Automated Dynamic Catalog Data Source
                                                        </h5>
                                                        <p style={{ color: "#6B7280", maxWidth: "540px", margin: "8px auto" }}>
                                                            {formSectionType === "bestsellers" && "This section automatically streams top-performing bestseller items based on catalog priority and stock."}
                                                            {formSectionType === "recommendations" && "This section streams recommended products algorithmically configured in RecommendedProducts."}
                                                            {formSectionType === "deals_and_offers" && "This section automatically surfaces active promotional products with highest customer savings."}
                                                            {formSectionType === "order_again" && "This section delivers personalized, customer-specific re-order products from their verified purchase history."}
                                                            {formSectionType === "promotional_banner" && "This section displays the configured marketing banner image and redirects to your destination campaign."}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-success mt-2"
                                                            onClick={() => setActiveTab("preview")}
                                                        >
                                                            <FaEye /> See Mobile Preview
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* TAB 3: LIVE MOBILE PREVIEW */}
                                        {activeTab === "preview" && (
                                            <div style={{ display: "flex", justifyContent: "center" }}>
                                                {/* Mobile Device Frame */}
                                                <div style={{
                                                    width: "360px",
                                                    backgroundColor: "#F4F5F7",
                                                    borderRadius: "28px",
                                                    border: "8px solid #1F2937",
                                                    padding: "16px 12px",
                                                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                                                }}>
                                                    {/* Phone Header Notch */}
                                                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                                                        <div style={{ width: "100px", height: "14px", backgroundColor: "#1F2937", borderRadius: "8px" }} />
                                                    </div>

                                                    {/* Section Container Card in Flutter */}
                                                    <div style={{
                                                        backgroundColor: formTheme === "white" ? "#FFFFFF" : (THEME_OPTIONS.find(t => t.value === formTheme)?.bgHex || "#FFFFFF"),
                                                        borderRadius: "16px",
                                                        padding: "12px",
                                                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                                                    }}>
                                                        {/* Section Header */}
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                                <span style={{
                                                                    backgroundColor: "#E8F5E9",
                                                                    padding: "4px",
                                                                    borderRadius: "6px",
                                                                    display: "flex",
                                                                    alignItems: "center"
                                                                }}>
                                                                    <FaLayerGroup size={12} color="#2E7D32" />
                                                                </span>
                                                                <div>
                                                                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#1F2937", lineHeight: 1.2 }}>
                                                                        {formTitle || "Section Title"}
                                                                    </div>
                                                                    {formDescription && (
                                                                        <div style={{ fontSize: "10px", color: "#6B7280" }}>
                                                                            {formDescription}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#2E7D32" }}>
                                                                {formViewAllLabel || "See all"} →
                                                            </div>
                                                        </div>

                                                        {/* Preview Content based on Section Type */}
                                                        {formSectionType === "selected_products" && (
                                                            selectedProducts.length === 0 ? (
                                                                <div style={{ textAlign: "center", padding: "20px 0", color: "#9CA3AF", fontSize: "12px" }}>
                                                                    No products selected yet. Switch to "Content & Items" tab to select items.
                                                                </div>
                                                            ) : (
                                                                <div style={{ display: "flex", gap: "8px", overflowX: "hidden" }}>
                                                                    {selectedProducts.slice(0, 3).map((p) => (
                                                                        <div
                                                                            key={p.ProductID}
                                                                            style={{
                                                                                width: "95px",
                                                                                backgroundColor: "#FFFFFF",
                                                                                borderRadius: "10px",
                                                                                padding: "6px",
                                                                                border: "1px solid #F3F4F6",
                                                                                flexShrink: 0
                                                                            }}
                                                                        >
                                                                            <div style={{ height: "55px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                                <img
                                                                                    src={p.ImageUrl || (p.ProductImages && p.ProductImages[0]) || "https://placehold.co/50"}
                                                                                    alt=""
                                                                                    style={{ maxHeight: "48px", maxWidth: "90%", objectFit: "contain" }}
                                                                                />
                                                                            </div>
                                                                            <div style={{ fontSize: "10px", fontWeight: 600, color: "#1F2937", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                                {p.ProductName}
                                                                            </div>
                                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                                                                                <span style={{ fontSize: "10px", fontWeight: 700, color: "#1F2937" }}>
                                                                                    ₹{p.OfferPrice || p.Price || 0}
                                                                                </span>
                                                                                <span style={{
                                                                                    backgroundColor: "#E8F5E9",
                                                                                    color: "#2E7D32",
                                                                                    fontSize: "9px",
                                                                                    fontWeight: 700,
                                                                                    padding: "2px 6px",
                                                                                    borderRadius: "4px",
                                                                                    border: "1px solid #A5D6A7"
                                                                                }}>
                                                                                    ADD
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )
                                                        )}

                                                        {formSectionType === "shop_by_category" && (
                                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                                                                {(selectedCategoryIds.length > 0
                                                                    ? catalogCategories.filter(c => selectedCategoryIds.includes(c.CategoryID))
                                                                    : catalogCategories.slice(0, 6)
                                                                ).map(c => (
                                                                    <div key={c.CategoryID} style={{ backgroundColor: "#F9FAFB", borderRadius: "8px", padding: "6px", textAlign: "center" }}>
                                                                        <img src={c.CategoryImage || c.ImageUrl || "https://placehold.co/30"} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />
                                                                        <div style={{ fontSize: "9px", fontWeight: 600, marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.CategoryName}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {formSectionType !== "selected_products" && formSectionType !== "shop_by_category" && (
                                                            <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
                                                                <span className="badge bg-success" style={{ fontSize: "10px" }}>Active Live Stream</span>
                                                                <p style={{ fontSize: "11px", color: "#6B7280", margin: "6px 0 0 0" }}>
                                                                    Dynamically renders catalog products based on {SECTION_TYPE_CONFIG[formSectionType]?.label}.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div style={{ textAlign: "center", marginTop: "14px", fontSize: "11px", color: "#9CA3AF" }}>
                                                        Preview matches ClikGett UserApp design tokens
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>

                                    {/* Modal Footer */}
                                    <div className="modal-footer" style={{ backgroundColor: "#F9FAFB", borderTop: "1px solid #E5E7EB", padding: "14px 24px" }}>
                                        <button className="btn btn-outline-secondary" onClick={() => setModal(false)}>
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-success"
                                            onClick={handleSave}
                                            style={{ backgroundColor: "#2E7D32", borderColor: "#2E7D32", fontWeight: 600 }}
                                        >
                                            {editItem ? "Save Changes" : "Publish Section"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DELETE CONFIRMATION MODAL */}
                    {deleteConfirmItem && (
                        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }}>
                            <div className="modal-dialog modal-dialog-centered">
                                <div className="modal-content" style={{ borderRadius: "12px" }}>
                                    <div className="modal-header">
                                        <h5 className="modal-title fw-bold text-danger">Confirm Deletion</h5>
                                        <button type="button" className="btn-close" onClick={() => setDeleteConfirmItem(null)} />
                                    </div>
                                    <div className="modal-body">
                                        <p style={{ margin: 0, color: "#374151" }}>
                                            Are you sure you want to delete the section <strong>"{deleteConfirmItem.Title || deleteConfirmItem.Name}"</strong>?
                                        </p>
                                        <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "8px", marginBottom: 0 }}>
                                            This action will safely remove the section and its associations. Customer apps will no longer display it on subsequent refreshes.
                                        </p>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-secondary" onClick={() => setDeleteConfirmItem(null)}>
                                            Cancel
                                        </button>
                                        <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                                            Delete Section
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MOBILE PREVIEW INSPECTION MODAL */}
                    {previewModalItem && (
                        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }}>
                            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "400px" }}>
                                <div className="modal-content" style={{ borderRadius: "20px", overflow: "hidden" }}>
                                    <div className="modal-header py-2 px-3 bg-light">
                                        <h6 className="modal-title fw-bold">Mobile View Inspection</h6>
                                        <button type="button" className="btn-close" onClick={() => setPreviewModalItem(null)} />
                                    </div>
                                    <div className="modal-body p-3" style={{ backgroundColor: "#F4F5F7" }}>
                                        <div style={{
                                            backgroundColor: "#FFFFFF",
                                            borderRadius: "16px",
                                            padding: "14px",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: "15px", color: "#1F2937" }}>
                                                        {previewModalItem.Title || previewModalItem.Name}
                                                    </div>
                                                    {(previewModalItem.Subtitle || previewModalItem.Description) && (
                                                        <div style={{ fontSize: "11px", color: "#6B7280" }}>
                                                            {previewModalItem.Subtitle || previewModalItem.Description}
                                                        </div>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: "12px", fontWeight: 600, color: "#2E7D32" }}>See all →</span>
                                            </div>

                                            {/* Products Carousel preview */}
                                            {previewModalItem.Products && previewModalItem.Products.length > 0 ? (
                                                <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
                                                    {previewModalItem.Products.map(p => (
                                                        <div key={p.ProductID} style={{ width: "100px", padding: "8px", borderRadius: "8px", border: "1px solid #F3F4F6", flexShrink: 0 }}>
                                                            <div style={{ height: "55px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                <img src={p.ImageUrl || (p.ProductImages && p.ProductImages[0]) || "https://placehold.co/50"} alt="" style={{ maxHeight: "50px", maxWidth: "90%", objectFit: "contain" }} />
                                                            </div>
                                                            <div style={{ fontSize: "10px", fontWeight: 600, marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                {p.ProductName}
                                                            </div>
                                                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#2E7D32", marginTop: "2px" }}>
                                                                ₹{p.OfferPrice || p.Price || 0}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ padding: "16px", textAlign: "center", fontSize: "12px", color: "#6B7280" }}>
                                                    Dynamic shelf for {SECTION_TYPE_CONFIG[previewModalItem.SectionType]?.label || previewModalItem.SectionType}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="modal-footer py-2 px-3">
                                        <button className="btn btn-sm btn-secondary" onClick={() => setPreviewModalItem(null)}>
                                            Close
                                        </button>
                                        <button className="btn btn-sm btn-success" onClick={() => {
                                            const item = previewModalItem;
                                            setPreviewModalItem(null);
                                            openEditModal(item);
                                        }}>
                                            <FaEdit /> Edit Section
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

export default HomeSections;
