import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-bootstrap-table-next/dist/react-bootstrap-table2.css";
import "react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import ScaleLoader from "react-spinners/ScaleLoader";
import { css } from "@emotion/react";
import { Modal, Button, Form, Badge } from "react-bootstrap";
import { FaEdit, FaSearch, FaFilter, FaCamera, FaBell, FaCheckCircle } from "react-icons/fa";

function ProductRequests() {
    const override = css`
        display: block;
        margin: 0 auto;
        border-color: red;
    `;
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("All");

    // Modal state for updating request
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [updateStatus, setUpdateStatus] = useState("Pending");
    const [linkedProductId, setLinkedProductId] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const [updating, setUpdating] = useState(false);

    // Modal state for photo preview
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [previewPhotoUrl, setPreviewPhotoUrl] = useState("");
    const [loadingPhoto, setLoadingPhoto] = useState(false);

    // Search catalog products for linking
    const [catalogSearch, setCatalogSearch] = useState("");
    const [catalogResults, setCatalogResults] = useState([]);
    const [searchingCatalog, setSearchingCatalog] = useState(false);

    const fetchRequests = () => {
        setLoading(true);
        Services.getProductRequests("GET", null, token)
            .then((res) => {
                setLoading(false);
                if (res.Status === 1) {
                    setRequests(res.Requests || []);
                    applyFilters(res.Requests || [], searchTerm, selectedStatus);
                } else {
                    toast.error(res.Message || "Failed to fetch product requests");
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Error fetching product requests:", err);
                toast.error("Error loading product requests");
            });
    };

    useEffect(() => {
        fetchRequests();
        // eslint-disable-next-line
    }, []);

    const applyFilters = (data, search, status) => {
        let filtered = [...data];
        if (status && status !== "All") {
            filtered = filtered.filter(
                (item) => (item.Status || "").toLowerCase() === status.toLowerCase()
            );
        }
        if (search && search.trim()) {
            const lower = search.toLowerCase().trim();
            filtered = filtered.filter(
                (item) =>
                    (item.ProductName && item.ProductName.toLowerCase().includes(lower)) ||
                    (item.Brand && item.Brand.toLowerCase().includes(lower)) ||
                    (item.CustomerName && item.CustomerName.toLowerCase().includes(lower)) ||
                    (item.MobileNumber && item.MobileNumber.toLowerCase().includes(lower)) ||
                    (item.RequestID && String(item.RequestID).includes(lower))
            );
        }
        setFilteredRequests(filtered);
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        applyFilters(requests, val, selectedStatus);
    };

    const handleStatusFilterChange = (e) => {
        const val = e.target.value;
        setSelectedStatus(val);
        applyFilters(requests, searchTerm, val);
    };

    const openPhotoPreview = async (request) => {
        setSelectedRequest(request);
        setShowPhotoModal(true);
        setLoadingPhoto(true);

        try {
            const rawToken = sessionStorage.getItem("token");
            const response = await fetch(`/api/admin/product-requests/image/${request.RequestID}`, {
                headers: {
                    Authorization: `Bearer ${rawToken}`,
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                setPreviewPhotoUrl(objectUrl);
            } else {
                toast.error("Unable to load image from server");
                setPreviewPhotoUrl("");
            }
        } catch (err) {
            console.error("Error fetching photo blob:", err);
            toast.error("Failed to fetch photo");
            setPreviewPhotoUrl("");
        } finally {
            setLoadingPhoto(false);
        }
    };

    const openUpdateModal = (reqItem) => {
        setSelectedRequest(reqItem);
        setUpdateStatus(reqItem.Status || "Pending");
        setLinkedProductId(reqItem.LinkedProductID || "");
        setAdminNotes(reqItem.AdminNotes || "");
        setCatalogSearch("");
        setCatalogResults([]);
        setShowUpdateModal(true);
    };

    const searchCatalog = (term) => {
        setCatalogSearch(term);
        if (!term || term.trim().length < 2) {
            setCatalogResults([]);
            return;
        }
        setSearchingCatalog(true);
        Services.searchAdminProducts("GET", null, token, term.trim())
            .then((res) => {
                setSearchingCatalog(false);
                if (res.Status === 1 && res.data) {
                    setCatalogResults(res.data.slice(0, 5));
                }
            })
            .catch(() => setSearchingCatalog(false));
    };

    const handleSaveStatus = () => {
        if (!selectedRequest) return;
        setUpdating(true);
        const body = {
            status: updateStatus,
            linkedProductID: linkedProductId ? parseInt(linkedProductId, 10) : null,
            adminNotes: adminNotes,
        };

        Services.updateProductRequestStatus("PUT", body, token, selectedRequest.RequestID)
            .then((res) => {
                setUpdating(false);
                if (res.Status === 1) {
                    toast.success(res.Message || "Product request updated successfully");
                    setShowUpdateModal(false);
                    fetchRequests();
                } else {
                    toast.error(res.Message || "Failed to update product request");
                }
            })
            .catch((err) => {
                setUpdating(false);
                console.error("Error updating product request:", err);
                toast.error("Server error while updating request");
            });
    };

    const handleTriggerNotification = (requestId, prodId) => {
        if (!window.confirm("Send back-in-stock / availability push notification to this customer now?")) {
            return;
        }
        Services.notifyProductRequest("POST", { linkedProductID: prodId || null }, token, requestId)
            .then((res) => {
                if (res.Status === 1) {
                    toast.success(res.Message || "Push notification sent to customer!");
                    fetchRequests();
                } else {
                    toast.error(res.Message || "Failed to trigger notification");
                }
            })
            .catch((err) => {
                console.error("Error triggering notification:", err);
                toast.error("Server error sending notification");
            });
    };

    const statusBadge = (status) => {
        const st = (status || "").toLowerCase();
        let bg = "warning";
        if (st === "in progress") bg = "info";
        else if (st === "available") bg = "success";
        else if (st === "fulfilled") bg = "primary";
        else if (st === "rejected") bg = "danger";
        return <Badge bg={bg} style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}>{status || "Pending"}</Badge>;
    };

    const columns = [
        {
            dataField: "RequestID",
            text: "ID",
            sort: true,
            headerStyle: { width: "60px", color: "#707275", fontWeight: 700 },
        },
        {
            dataField: "ProductName",
            text: "Product Requested",
            sort: true,
            headerStyle: { color: "#707275", fontWeight: 700 },
            formatter: (cell, row) => (
                <div>
                    <strong style={{ fontSize: "0.95rem", color: "#1a252f" }}>{cell}</strong>
                    {row.Brand && <div style={{ fontSize: "0.82rem", color: "#2980b9" }}>Brand: {row.Brand}</div>}
                    {row.SizeOrQty && <div style={{ fontSize: "0.8rem", color: "#7f8c8d" }}>Size/Qty: {row.SizeOrQty}</div>}
                    {row.LinkedCatalogProductName && (
                        <div style={{ fontSize: "0.8rem", color: "#27ae60", marginTop: "3px" }}>
                            <FaCheckCircle style={{ marginRight: "4px" }} /> Linked: {row.LinkedCatalogProductName} (#{row.LinkedProductID})
                        </div>
                    )}
                </div>
            ),
        },
        {
            dataField: "ImagePath",
            text: "Photo",
            headerStyle: { width: "90px", color: "#707275", fontWeight: 700, textAlign: "center" },
            formatter: (cell, row) => (
                <div style={{ textAlign: "center" }}>
                    {cell ? (
                        <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => openPhotoPreview(row)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                            <FaCamera /> View
                        </Button>
                    ) : (
                        <span style={{ color: "#aaa", fontSize: "0.8rem" }}>None</span>
                    )}
                </div>
            ),
        },
        {
            dataField: "CustomerName",
            text: "Customer",
            sort: true,
            headerStyle: { color: "#707275", fontWeight: 700 },
            formatter: (cell, row) => (
                <div>
                    <strong>{row.CustomerName || "Valued Customer"}</strong>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>
                        Tel: {row.MobileNumber || row.UserAccountMobile || "N/A"}
                    </div>
                </div>
            ),
        },
        {
            dataField: "Description",
            text: "Customer Notes",
            headerStyle: { width: "25%", color: "#707275", fontWeight: 700 },
            formatter: (cell, row) => (
                <div style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
                    <p style={{ margin: 0 }}>{cell || <span style={{ color: "#aaa" }}>No extra details</span>}</p>
                    {row.AdminNotes && (
                        <div style={{ marginTop: "4px", fontSize: "0.78rem", color: "#0066cc", backgroundColor: "#f0f7ff", padding: "4px 8px", borderRadius: "4px" }}>
                            <strong>Admin:</strong> {row.AdminNotes}
                        </div>
                    )}
                </div>
            ),
        },
        {
            dataField: "CreatedAt",
            text: "Requested Date",
            sort: true,
            headerStyle: { color: "#707275", fontWeight: 700 },
            formatter: (cell) => {
                if (!cell) return "-";
                const d = new Date(cell);
                return (
                    <span style={{ fontSize: "0.85rem" }}>
                        {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                );
            },
        },
        {
            dataField: "Status",
            text: "Status",
            sort: true,
            headerStyle: { color: "#707275", fontWeight: 700 },
            formatter: (cell, row) => (
                <div>
                    {statusBadge(cell)}
                    {row.NotifiedAt && (
                        <div style={{ fontSize: "0.75rem", color: "#27ae60", marginTop: "4px", display: "flex", alignItems: "center", gap: "3px" }}>
                            <FaBell /> Notified {new Date(row.NotifiedAt).toLocaleDateString()}
                        </div>
                    )}
                </div>
            ),
        },
        {
            dataField: "actions",
            text: "Actions",
            headerStyle: { width: "160px", color: "#707275", fontWeight: 700 },
            formatter: (cell, row) => (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => openUpdateModal(row)}
                        style={{ display: "flex", alignItems: "center", gap: "4px" }}
                    >
                        <FaEdit /> Edit
                    </Button>
                    <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleTriggerNotification(row.RequestID, row.LinkedProductID)}
                        title="Send back-in-stock push notification"
                        style={{ display: "flex", alignItems: "center", gap: "4px" }}
                    >
                        <FaBell /> Alert
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="productRequests" />
            </div>

            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />

                <div
                    className={dashboardclasses.CategoryWrapper}
                    style={{
                        padding: "20px 24px",
                        minWidth: 0,
                        width: "100%",
                        boxSizing: "border-box",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                            <h3 style={{ margin: 0, fontWeight: 700, color: "#2c3e50" }}>Unavailable Product Requests</h3>
                            <p style={{ margin: 0, color: "#7f8c8d", fontSize: "0.9rem" }}>
                                Track customer search requests, sourcing status, photo attachments, and send arrival notifications
                            </p>
                        </div>
                        <Button variant="success" onClick={fetchRequests} size="sm">
                            Refresh
                        </Button>
                    </div>

                    {/* Search and Filters */}
                    <div style={{ display: "flex", gap: "15px", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
                            <Form.Control
                                type="text"
                                placeholder="Search by product name, brand, customer, phone..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                style={{ paddingLeft: "35px" }}
                            />
                            <FaSearch style={{ position: "absolute", left: "12px", top: "11px", color: "#888" }} />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <FaFilter style={{ color: "#666" }} />
                            <Form.Select
                                value={selectedStatus}
                                onChange={handleStatusFilterChange}
                                style={{ width: "170px" }}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Available">Available</option>
                                <option value="Fulfilled">Fulfilled</option>
                                <option value="Rejected">Rejected</option>
                            </Form.Select>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "4rem" }}>
                            <ScaleLoader color="#2ecc71" loading={loading} css={override} size={60} />
                            <p style={{ marginTop: "1rem", color: "#888" }}>Loading product requests...</p>
                        </div>
                    ) : (
                        <div
                            style={{
                                backgroundColor: "#fff",
                                padding: "1.2rem",
                                borderRadius: "10px",
                                border: "1px solid #e2e8f0",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                                minWidth: 0,
                                width: "100%",
                                boxSizing: "border-box",
                            }}
                        >
                            <div className="table-responsive" style={{ minWidth: 0, overflowX: "auto" }}>
                                <BootstrapTable
                                    keyField="RequestID"
                                    data={filteredRequests}
                                    columns={columns}
                                    striped
                                    hover
                                    condensed
                                    pagination={paginationFactory({
                                        sizePerPage: 10,
                                        sizePerPageList: [10, 20, 50],
                                    })}
                                    noDataIndication="No product requests found"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Photo Preview Modal */}
            <Modal show={showPhotoModal} onHide={() => setShowPhotoModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize: "1.2rem", fontWeight: 600 }}>
                        Photo Attachment for Request #{selectedRequest?.RequestID} - {selectedRequest?.ProductName}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ textAlign: "center", padding: "1.5rem" }}>
                    {loadingPhoto ? (
                        <div style={{ padding: "3rem" }}>
                            <ScaleLoader color="#2ecc71" loading={loadingPhoto} css={override} size={40} />
                            <p style={{ marginTop: "1rem", color: "#666" }}>Fetching photo securely...</p>
                        </div>
                    ) : previewPhotoUrl ? (
                        <div>
                            <img
                                src={previewPhotoUrl}
                                alt="Product Request"
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "500px",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                }}
                            />
                            {selectedRequest?.Description && (
                                <div style={{ marginTop: "1rem", textAlign: "left", backgroundColor: "#f8f9fa", padding: "12px", borderRadius: "6px" }}>
                                    <strong>Customer Notes:</strong> {selectedRequest.Description}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p style={{ color: "#888" }}>No image available</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPhotoModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Update Status & Catalog Link Modal */}
            <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize: "1.2rem", fontWeight: 600 }}>
                        Update Product Request #{selectedRequest?.RequestID}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedRequest && (
                        <div>
                            <div style={{ marginBottom: "1rem", backgroundColor: "#f8f9fa", padding: "12px", borderRadius: "6px" }}>
                                <div><strong>Requested Item:</strong> {selectedRequest.ProductName}</div>
                                {selectedRequest.Brand && <div><strong>Brand:</strong> {selectedRequest.Brand}</div>}
                                {selectedRequest.SizeOrQty && <div><strong>Size/Qty:</strong> {selectedRequest.SizeOrQty}</div>}
                                <div><strong>Customer:</strong> {selectedRequest.CustomerName} ({selectedRequest.MobileNumber || "N/A"})</div>
                                {selectedRequest.Description && (
                                    <div style={{ marginTop: "4px", fontSize: "0.85rem", color: "#555" }}>
                                        <strong>Notes:</strong> {selectedRequest.Description}
                                    </div>
                                )}
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label><strong>Status</strong></Form.Label>
                                <Form.Select
                                    value={updateStatus}
                                    onChange={(e) => setUpdateStatus(e.target.value)}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress (Sourcing)</option>
                                    <option value="Available">Available (Sends Push Notification)</option>
                                    <option value="Fulfilled">Fulfilled</option>
                                    <option value="Rejected">Rejected</option>
                                </Form.Select>
                                {updateStatus === "Available" && !selectedRequest.NotifiedAt && (
                                    <Form.Text style={{ color: "#27ae60", fontWeight: 500 }}>
                                        💡 Marking as 'Available' will automatically send a push notification to this customer.
                                    </Form.Text>
                                )}
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label><strong>Link to Catalog Product ID (Optional)</strong></Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="Enter ProductID (e.g., 1042)"
                                    value={linkedProductId}
                                    onChange={(e) => setLinkedProductId(e.target.value)}
                                />
                                <div style={{ marginTop: "6px" }}>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search catalog to find Product ID..."
                                        value={catalogSearch}
                                        onChange={(e) => searchCatalog(e.target.value)}
                                        size="sm"
                                    />
                                    {searchingCatalog && <span style={{ fontSize: "0.75rem", color: "#888" }}>Searching catalog...</span>}
                                    {catalogResults.length > 0 && (
                                        <div style={{ border: "1px solid #ddd", borderRadius: "4px", marginTop: "4px", maxHeight: "120px", overflowY: "auto" }}>
                                            {catalogResults.map((p) => (
                                                <div
                                                    key={p.ProductID}
                                                    onClick={() => {
                                                        setLinkedProductId(p.ProductID);
                                                        setCatalogSearch(p.ProductName);
                                                        setCatalogResults([]);
                                                    }}
                                                    style={{ padding: "6px 10px", cursor: "pointer", borderBottom: "1px solid #eee", fontSize: "0.85rem" }}
                                                >
                                                    #{p.ProductID} - {p.ProductName}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label><strong>Admin Notes</strong></Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Procurement notes, vendor details, or reasons..."
                                />
                            </Form.Group>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowUpdateModal(false)} disabled={updating}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveStatus} disabled={updating}>
                        {updating ? "Saving..." : "Save Changes"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default ProductRequests;
