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
import { FaEdit, FaTrash, FaPlus, FaLock, FaUnlock } from "react-icons/fa";
import { localDateTimeToUtc, toDateTimeInput } from "../../../dateInputs";

function ProductUnlocks() {
    const [unlocks, setUnlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [allProducts, setAllProducts] = useState([]);

    const [thresholdAmount, setThresholdAmount] = useState("");
    const [selectedProductId, setSelectedProductId] = useState("");
    const [unlockPrice, setUnlockPrice] = useState("");
    const [unlockMessage, setUnlockMessage] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState(1);

    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const override = css`
        display: block;
        margin: 0 auto;
    `;

    const fetchUnlocks = () => {
        setLoading(true);
        Services.getProductUnlocks("GET", null, token)
            .then((res) => {
                setLoading(false);
                if (res && (res.status === 1 || res.Status === 1)) {
                    setUnlocks(res.data || res.Unlocks || []);
                } else {
                    toast.error((res && (res.message || res.Message)) || "Failed to load product unlocks");
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error(err);
                toast.error("Error loading product unlocks");
            });
    };

    const fetchProducts = () => {
        Services.getAllProducts("GET", null, token)
            .then((res) => {
                if (res && (res.status === 1 || res.Status === 1)) {
                    setAllProducts(res.Products || res.data || []);
                }
            })
            .catch((err) => console.error(err));
    };

    useEffect(() => {
        fetchUnlocks();
        fetchProducts();
    }, []);

    const openAddModal = () => {
        setEditItem(null);
        setThresholdAmount("");
        setSelectedProductId(allProducts.length > 0 ? allProducts[0].ProductID : "");
        setUnlockPrice("");
        setUnlockMessage("");
        setStartDate("");
        setEndDate("");
        setStatus(1);
        setModal(true);
    };

    const openEditModal = (row) => {
        setEditItem(row);
        setThresholdAmount(row.ThresholdAmount);
        setSelectedProductId(row.ProductID);
        setUnlockPrice(row.UnlockPrice !== null && row.UnlockPrice !== undefined ? row.UnlockPrice : "");
        setUnlockMessage(row.UnlockMessage || "");
        setStartDate(toDateTimeInput(row.StartDate));
        setEndDate(toDateTimeInput(row.EndDate));
        setStatus(row.Status);
        setModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this Unlock Rule?")) {
            Services.deleteProductUnlock("DELETE", null, token, id)
                .then((res) => {
                    if (res && (res.status === 1 || res.Status === 1)) {
                        toast.success("Rule deleted");
                        fetchUnlocks();
                    } else {
                        toast.error((res && (res.message || res.Message)) || "Failed to delete");
                    }
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("Error deleting rule");
                });
        }
    };

    const handleSave = () => {
        if (!thresholdAmount || isNaN(thresholdAmount) || parseFloat(thresholdAmount) <= 0) {
            toast.error("Valid threshold amount is required");
            return;
        }
        if (!selectedProductId) {
            toast.error("Please select a product");
            return;
        }

        const payload = {
            ThresholdAmount: parseFloat(thresholdAmount),
            ProductID: parseInt(selectedProductId),
            UnlockPrice: unlockPrice !== "" && !isNaN(unlockPrice) ? parseFloat(unlockPrice) : null,
            UnlockMessage: unlockMessage,
            StartDate: localDateTimeToUtc(startDate),
            EndDate: localDateTimeToUtc(endDate),
            Status: parseInt(status),
        };

        if (editItem) {
            Services.updateProductUnlock("PUT", JSON.stringify(payload), token, editItem.UnlockID)
                .then((res) => {
                    if (res && (res.status === 1 || res.Status === 1)) {
                        toast.success("Product unlock rule updated");
                        setModal(false);
                        fetchUnlocks();
                    } else {
                        toast.error((res && (res.message || res.Message)) || "Failed to update");
                    }
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("Error updating rule");
                });
        } else {
            Services.createProductUnlock("POST", JSON.stringify(payload), token)
                .then((res) => {
                    if (res && (res.status === 1 || res.Status === 1)) {
                        toast.success("Product unlock rule created");
                        setModal(false);
                        fetchUnlocks();
                    } else {
                        toast.error((res && (res.message || res.Message)) || "Failed to create");
                    }
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("Error creating rule");
                });
        }
    };

    const columns = [
        {
            dataField: "ThresholdAmount",
            text: "Cart Threshold",
            sort: true,
            formatter: (cell) => (
                <div style={{ fontWeight: "bold", color: "#2563eb", display: "flex", alignItems: "center", gap: "6px" }}>
                    <FaUnlock size={14} /> ₹{cell}
                </div>
            ),
        },
        {
            dataField: "ProductName",
            text: "Unlocked Product",
            sort: true,
            formatter: (cell, row) => (
                <div>
                    <strong>{cell}</strong>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>Standard Price: ₹{row.Price}</div>
                </div>
            ),
        },
        {
            dataField: "UnlockPrice",
            text: "Unlock Price",
            sort: true,
            formatter: (cell) => (
                <span style={{ fontWeight: "700", color: "#16a34a" }}>
                    {cell !== null && cell !== undefined ? `₹${cell}` : "Standard Offer"}
                </span>
            ),
        },
        {
            dataField: "UnlockMessage",
            text: "Promo Message",
            formatter: (cell) => cell || <span className="text-muted">Unlocked on cart reach</span>,
        },
        {
            dataField: "StartDate",
            text: "Window",
            formatter: (_, row) => (
                <div style={{ fontSize: "0.85rem" }}>
                    {row.StartDate ? new Date(row.StartDate).toLocaleDateString() : "Always"} - {row.EndDate ? new Date(row.EndDate).toLocaleDateString() : "Ongoing"}
                </div>
            ),
        },
        {
            dataField: "Status",
            text: "Status",
            formatter: (cell) => (
                <span className={`badge ${cell === 1 ? "badge-success" : "badge-danger"}`}>
                    {cell === 1 ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            dataField: "actions",
            text: "Actions",
            formatter: (_, row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => openEditModal(row)}>
                        <FaEdit />
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(row.UnlockID)}>
                        <FaTrash />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="product-unlocks" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <h3>Cart Value → Product Unlocking Rules</h3>
                            <p style={{ color: "#666", margin: 0 }}>Configure dynamic thresholds (e.g. ₹500 unlocks Item A, ₹1000 unlocks Item B)</p>
                        </div>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            <FaPlus /> Add Unlock Rule
                        </button>
                    </div>

                    {loading ? (
                        <div className={dashboardclasses["loader"]}>
                            <ScaleLoader color={"black"} loading={true} css={override} size={150} />
                        </div>
                    ) : (
                        <div className="category-table">
                            <BootstrapTable
                                bootstrap4
                                keyField="UnlockID"
                                data={unlocks}
                                columns={columns}
                                pagination={paginationFactory({ sizePerPage: 10, hideSizePerPage: true })}
                                wrapperClasses="table-responsive"
                            />
                        </div>
                    )}

                    {modal && (
                        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                            <div className="modal-dialog">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">{editItem ? "Edit Unlock Rule" : "Add Unlock Rule"}</h5>
                                        <button type="button" className="close" onClick={() => setModal(false)}>
                                            <span>&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="form-group">
                                            <label><strong>Minimum Cart Value (₹):</strong></label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={thresholdAmount}
                                                onChange={(e) => setThresholdAmount(e.target.value)}
                                                placeholder="e.g. 500"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label><strong>Product to Unlock:</strong></label>
                                            <select
                                                className="form-control"
                                                value={selectedProductId}
                                                onChange={(e) => setSelectedProductId(e.target.value)}
                                            >
                                                <option value="">Select a Product</option>
                                                {allProducts.map((p) => (
                                                    <option key={p.ProductID} value={p.ProductID}>
                                                        {p.ProductName} (₹{p.Price})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label><strong>Discounted Unlock Price (₹):</strong></label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={unlockPrice}
                                                onChange={(e) => setUnlockPrice(e.target.value)}
                                                placeholder="e.g. 1 or 59 (leave blank for standard offer price)"
                                                step="0.01"
                                                min="0"
                                            />
                                            <small className="form-text text-muted">Configured discounted price charged to user when unlocked (e.g. ₹1 or ₹59)</small>
                                        </div>
                                        <div className="form-group">
                                            <label><strong>Custom Notification / Banner Message:</strong></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={unlockMessage}
                                                onChange={(e) => setUnlockMessage(e.target.value)}
                                                placeholder="e.g. Special festive gift unlocked!"
                                            />
                                        </div>
                                        <div className="row">
                                            <div className="col-md-6 form-group">
                                                <label><strong>Start Date & Time:</strong></label>
                                                <input
                                                    type="datetime-local"
                                                    className="form-control"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                />
                                            </div>
                                            <div className="col-md-6 form-group">
                                                <label><strong>End Date & Time:</strong></label>
                                                <input
                                                    type="datetime-local"
                                                    className="form-control"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label><strong>Status:</strong></label>
                                            <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                                                <option value={1}>Active</option>
                                                <option value={0}>Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                                        <button className="btn btn-primary" onClick={handleSave}>Save Rule</button>
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

export default ProductUnlocks;
