import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaRegEdit, FaPlus, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import ScaleLoader from "react-spinners/ScaleLoader";
import { useNavigate } from "react-router-dom";

function Sales() {
    const navigate = useNavigate();
    const [salesList, setSalesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [detailsModal, setDetailsModal] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [saleItems, setSaleItems] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);

    // Form state
    const [saleId, setSaleId] = useState(null);
    const [saleName, setSaleName] = useState("");
    const [description, setDescription] = useState("");
    const [discountType, setDiscountType] = useState("percentage");
    const [discountValue, setDiscountValue] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [productSearch, setProductSearch] = useState("");

    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const loadSales = () => {
        setLoading(true);
        Services.getSales("GET", null, token)
            .then((res) => {
                setLoading(false);
                if (res.Status === 1) {
                    setSalesList(res.Sales || []);
                } else {
                    if (res.Message === "Token expired") {
                        navigate("/");
                    }
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Error loading sales:", err);
            });
    };

    const loadProducts = () => {
        Services.getAllProducts("GET", null, token)
            .then((res) => {
                if (res.Status === 1 && res.Products) {
                    setAvailableProducts(res.Products);
                }
            })
            .catch((err) => console.error(err));
    };

    useEffect(() => {
        loadSales();
        loadProducts();
    }, []);

    const resetForm = () => {
        setSaleId(null);
        setSaleName("");
        setDescription("");
        setDiscountType("percentage");
        setDiscountValue("");
        setStartDate("");
        setEndDate("");
        setSelectedProductIds([]);
        setProductSearch("");
    };

    const handleOpenCreate = () => {
        resetForm();
        setModalOpen(true);
    };

    const handleSaveSale = (e) => {
        e.preventDefault();
        if (!saleName || !discountValue || !startDate || !endDate) {
            toast.warning("Please fill all required fields");
            return;
        }

        const payload = {
            SaleID: saleId,
            SaleName: saleName,
            Description: description,
            DiscountType: discountType,
            DiscountValue: parseFloat(discountValue),
            // The picker shows IST; send the exact instant (UTC) so the server stores it correctly.
            StartDate: startDate ? new Date(startDate).toISOString() : startDate,
            EndDate: endDate ? new Date(endDate).toISOString() : endDate,
            ProductIDs: selectedProductIds,
            Status: 1
        };

        const apiCall = saleId 
            ? Services.updateSale("POST", JSON.stringify(payload), token)
            : Services.createSale("POST", JSON.stringify(payload), token);

        apiCall.then((res) => {
            if (res.Status === 1) {
                toast.success(saleId ? "Sale updated!" : "Sale created!");
                setModalOpen(false);
                resetForm();
                loadSales();
            } else {
                toast.error(res.Message || "Error saving sale");
            }
        }).catch((err) => {
            toast.error("Something went wrong");
        });
    };

    const handleDeleteSale = (id) => {
        if (window.confirm("Are you sure you want to delete this sale?")) {
            Services.deleteSale("POST", JSON.stringify({ SaleID: id }), token)
                .then((res) => {
                    if (res.Status === 1) {
                        toast.success("Sale deleted");
                        loadSales();
                    } else {
                        toast.error(res.Message || "Error deleting sale");
                    }
                });
        }
    };

    const handleViewDetails = (sale) => {
        setSelectedSale(sale);
        Services.getSaleDetails("GET", null, token, sale.SaleID)
            .then((res) => {
                if (res.Status === 1) {
                    setSaleItems(res.Items || []);
                    setDetailsModal(true);
                }
            });
    };

    const getSaleStatusBadge = (start, end, status) => {
        if (status === 0) return <span className="badge bg-secondary">Disabled</span>;
        const now = new Date();
        const s = new Date(start);
        const e = new Date(end);
        if (now < s) return <span className="badge bg-info">Upcoming</span>;
        if (now > e) return <span className="badge bg-danger">Expired</span>;
        return <span className="badge bg-success">Active Now</span>;
    };

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="sales" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ padding: "20px" }}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h3 style={{ fontWeight: "700", color: "#2c3e50" }}>Flash Sales & Promotions</h3>
                            <p className="text-muted mb-0">Create and manage limited-time flash discount events</p>
                        </div>
                        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenCreate}>
                            <FaPlus /> Create Flash Sale
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <ScaleLoader color="#2680eb" loading={true} />
                        </div>
                    ) : (
                        <div className="table-responsive bg-white rounded shadow-sm p-3">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Sale Name</th>
                                        <th>Discount</th>
                                        <th>Duration</th>
                                        <th>Status</th>
                                        <th>Products</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesList.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4 text-muted">
                                                No flash sales found. Click "Create Flash Sale" to start.
                                            </td>
                                        </tr>
                                    ) : (
                                        salesList.map((sale) => (
                                            <tr key={sale.SaleID}>
                                                <td><strong>#{sale.SaleID}</strong></td>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{sale.SaleName}</div>
                                                    <small className="text-muted">{sale.Description || "No description"}</small>
                                                </td>
                                                <td>
                                                    <span className="badge bg-primary">
                                                        {sale.DiscountType === "percentage" ? `${sale.DiscountValue}% OFF` : `₹${sale.DiscountValue} OFF`}
                                                    </span>
                                                </td>
                                                <td>
                                                    <small>
                                                        <strong>Start:</strong> {new Date(sale.StartDate).toLocaleString()}<br />
                                                        <strong>End:</strong> {new Date(sale.EndDate).toLocaleString()}
                                                    </small>
                                                </td>
                                                <td>{getSaleStatusBadge(sale.StartDate, sale.EndDate, sale.Status)}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline-info" onClick={() => handleViewDetails(sale)}>
                                                        {sale.ItemCount || 0} Products
                                                    </button>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <button 
                                                            className="btn btn-sm btn-outline-danger" 
                                                            onClick={() => handleDeleteSale(sale.SaleID)}
                                                            title="Delete Sale"
                                                        >
                                                            <MdDelete />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create / Edit Modal */}
            {modalOpen && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{saleId ? "Edit Flash Sale" : "Create New Flash Sale"}</h5>
                                <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                            </div>
                            <form onSubmit={handleSaveSale}>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-12">
                                            <label className="form-label">Sale Name *</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                required 
                                                value={saleName} 
                                                onChange={(e) => setSaleName(e.target.value)} 
                                                placeholder="e.g. Weekend Mega Sale"
                                            />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label">Description</label>
                                            <textarea 
                                                className="form-control" 
                                                rows="2" 
                                                value={description} 
                                                onChange={(e) => setDescription(e.target.value)} 
                                                placeholder="Brief promotional description"
                                            ></textarea>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Discount Type *</label>
                                            <select 
                                                className="form-select" 
                                                value={discountType} 
                                                onChange={(e) => setDiscountType(e.target.value)}
                                            >
                                                <option value="percentage">Percentage (%)</option>
                                                <option value="flat">Flat Amount (₹)</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Discount Value *</label>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                className="form-control" 
                                                required 
                                                value={discountValue} 
                                                onChange={(e) => setDiscountValue(e.target.value)} 
                                                placeholder={discountType === "percentage" ? "e.g. 15" : "e.g. 50"}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Start Date & Time *</label>
                                            <input 
                                                type="datetime-local" 
                                                className="form-control" 
                                                required 
                                                value={startDate} 
                                                onChange={(e) => setStartDate(e.target.value)} 
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">End Date & Time *</label>
                                            <input 
                                                type="datetime-local" 
                                                className="form-control" 
                                                required 
                                                value={endDate} 
                                                onChange={(e) => setEndDate(e.target.value)} 
                                            />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label">Assign Eligible Products</label>
                                            <input
                                                type="search"
                                                className="form-control mb-2"
                                                placeholder="Search products by name or SKU"
                                                value={productSearch}
                                                onChange={(e) => setProductSearch(e.target.value)}
                                            />
                                            {selectedProductIds.length > 0 && (
                                                <div className="d-flex flex-wrap gap-1 mb-2">
                                                    {selectedProductIds.map((id) => {
                                                        const prod = availableProducts.find((p) => p.ProductID === id);
                                                        return (
                                                            <span key={id} className="badge bg-success d-inline-flex align-items-center" style={{ fontSize: "0.8rem" }}>
                                                                {prod ? prod.ProductName : `#${id}`}
                                                                <button
                                                                    type="button"
                                                                    className="btn-close btn-close-white ms-1"
                                                                    style={{ fontSize: "0.55rem" }}
                                                                    aria-label="Remove"
                                                                    onClick={() => setSelectedProductIds(selectedProductIds.filter((x) => x !== id))}
                                                                />
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            <div className="border rounded" style={{ maxHeight: "220px", overflowY: "auto" }}>
                                                {(() => {
                                                    const q = productSearch.trim().toLowerCase();
                                                    const matches = availableProducts.filter((prod) => !q ||
                                                        String(prod.ProductName || "").toLowerCase().includes(q) ||
                                                        String(prod.SKU || prod.ProductID).toLowerCase().includes(q));
                                                    if (!matches.length) return <div className="p-3 text-muted small">No products match "{productSearch}"</div>;
                                                    return matches.slice(0, 200).map((prod) => {
                                                        const checked = selectedProductIds.includes(prod.ProductID);
                                                        return (
                                                            <label key={prod.ProductID} className={`d-flex align-items-center gap-2 px-3 py-2 m-0 border-bottom ${checked ? "bg-light" : ""}`} style={{ cursor: "pointer" }}>
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input m-0"
                                                                    checked={checked}
                                                                    onChange={() => setSelectedProductIds(checked
                                                                        ? selectedProductIds.filter((x) => x !== prod.ProductID)
                                                                        : [...selectedProductIds, prod.ProductID])}
                                                                />
                                                                <span>{prod.ProductName} <span className="text-muted">(SKU: {prod.SKU || prod.ProductID})</span></span>
                                                            </label>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                            <small className="text-muted">{selectedProductIds.length} product{selectedProductIds.length === 1 ? "" : "s"} selected. Search, then tick the products to include.</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Flash Sale</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {detailsModal && selectedSale && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-md">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Products in "{selectedSale.SaleName}"</h5>
                                <button type="button" className="btn-close" onClick={() => setDetailsModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {saleItems.length === 0 ? (
                                    <p className="text-muted text-center my-3">No products assigned to this sale yet.</p>
                                ) : (
                                    <ul className="list-group">
                                        {saleItems.map((item) => (
                                            <li key={item.SaleItemID} className="list-group-item d-flex justify-content-between align-items-center">
                                                <div>
                                                    <strong>{item.ProductName || `Product #${item.ProductID}`}</strong>
                                                    <div className="text-muted small">ID: {item.ProductID}</div>
                                                </div>
                                                <button 
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => {
                                                        Services.removeSaleProduct("POST", JSON.stringify({ SaleItemID: item.SaleItemID }), token)
                                                            .then(() => handleViewDetails(selectedSale));
                                                    }}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setDetailsModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Sales;
