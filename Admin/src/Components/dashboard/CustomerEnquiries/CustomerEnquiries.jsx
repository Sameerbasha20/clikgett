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
import { FaEdit, FaSearch, FaFilter } from "react-icons/fa";

function CustomerEnquiries() {
    const override = css`
        display: block;
        margin: 0 auto;
        border-color: red;
    `;
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const [loading, setLoading] = useState(true);
    const [enquiries, setEnquiries] = useState([]);
    const [filteredEnquiries, setFilteredEnquiries] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("All");

    // Modal state for updating enquiry
    const [showModal, setShowModal] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [updateStatus, setUpdateStatus] = useState("Pending");
    const [adminNotes, setAdminNotes] = useState("");
    const [updating, setUpdating] = useState(false);

    // Modal state for photo preview
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [previewPhotoUrl, setPreviewPhotoUrl] = useState("");
    const [loadingPhoto, setLoadingPhoto] = useState(false);

    const openPhotoPreview = async (enquiry) => {
        setSelectedEnquiry(enquiry);
        setShowPhotoModal(true);
        setLoadingPhoto(true);

        try {
            const rawToken = sessionStorage.getItem("token");
            const response = await fetch(`/api/admin/customer-enquiries/image/${enquiry.EnquiryID}`, {
                headers: {
                    Authorization: `token ${rawToken}`,
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

    const fetchEnquiries = () => {
        setLoading(true);
        Services.getCustomerEnquiries("GET", null, token)
            .then((res) => {
                setLoading(false);
                if (res.Status === 1) {
                    setEnquiries(res.Enquiries || []);
                    applyFilters(res.Enquiries || [], searchTerm, selectedStatus);
                } else {
                    toast.error(res.Message || "Failed to fetch enquiries");
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Error fetching enquiries:", err);
                toast.error("Error loading enquiries");
            });
    };

    useEffect(() => {
        fetchEnquiries();
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
                    (item.Name && item.Name.toLowerCase().includes(lower)) ||
                    (item.MobileNumber && item.MobileNumber.toLowerCase().includes(lower)) ||
                    (item.Subject && item.Subject.toLowerCase().includes(lower)) ||
                    (item.Description && item.Description.toLowerCase().includes(lower)) ||
                    (item.EnquiryID && String(item.EnquiryID).includes(lower))
            );
        }
        setFilteredEnquiries(filtered);
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        applyFilters(enquiries, val, selectedStatus);
    };

    const handleStatusFilterChange = (e) => {
        const val = e.target.value;
        setSelectedStatus(val);
        applyFilters(enquiries, searchTerm, val);
    };

    const openUpdateModal = (enquiry) => {
        setSelectedEnquiry(enquiry);
        setUpdateStatus(enquiry.Status || "Pending");
        setAdminNotes(enquiry.AdminNotes || "");
        setShowModal(true);
    };

    const handleSaveStatus = () => {
        if (!selectedEnquiry) return;
        setUpdating(true);
        const body = {
            status: updateStatus,
            adminNotes: adminNotes,
        };

        Services.updateCustomerEnquiryStatus("PUT", body, token, selectedEnquiry.EnquiryID)
            .then((res) => {
                setUpdating(false);
                if (res.Status === 1) {
                    toast.success(res.Message || "Enquiry updated successfully");
                    setShowModal(false);
                    fetchEnquiries();
                } else {
                    toast.error(res.Message || "Failed to update enquiry");
                }
            })
            .catch((err) => {
                setUpdating(false);
                console.error("Error updating enquiry:", err);
                toast.error("Server error while updating enquiry");
            });
    };

    const statusBadge = (status) => {
        const st = (status || "").toLowerCase();
        let bg = "warning";
        if (st === "in progress") bg = "primary";
        else if (st === "under review") bg = "info";
        else if (st === "fulfilled" || st === "resolved") bg = "success";
        else if (st === "rejected") bg = "danger";
        else if (st === "closed") bg = "secondary";
        return (
            <Badge
                bg={bg}
                style={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    padding: "0.45rem 0.65rem",
                    borderRadius: "6px",
                    display: "inline-block",
                }}
            >
                {status || "Pending"}
            </Badge>
        );
    };

    const columns = [
        {
            dataField: "EnquiryID",
            text: "ID",
            sort: true,
            headerStyle: {
                width: "75px",
                minWidth: "65px",
                color: "#707275",
                fontWeight: 700,
                textAlign: "center",
                verticalAlign: "middle",
            },
            style: {
                textAlign: "center",
                fontWeight: 600,
                verticalAlign: "middle",
            },
        },
        {
            dataField: "Name",
            text: "Customer",
            sort: true,
            headerStyle: {
                width: "200px",
                minWidth: "160px",
                color: "#707275",
                fontWeight: 700,
                verticalAlign: "middle",
            },
            style: {
                verticalAlign: "middle",
            },
            formatter: (cell, row) => (
                <div>
                    <div style={{ fontWeight: 600, color: "#2c3e50" }}>{row.Name || "Valued Customer"}</div>
                    <div style={{ fontSize: "0.82rem", color: "#666", marginTop: "2px" }}>
                        Tel: {row.MobileNumber || row.UserAccountMobile || "N/A"}
                    </div>
                </div>
            ),
        },
        {
            dataField: "Subject",
            text: "Subject / Type",
            sort: true,
            headerStyle: {
                width: "200px",
                minWidth: "160px",
                color: "#707275",
                fontWeight: 700,
                verticalAlign: "middle",
            },
            style: {
                verticalAlign: "middle",
                fontWeight: 500,
                color: "#34495e",
            },
            formatter: (cell, row) => {
                const isProductReq = row.Category === "Product Request" || (cell && cell.includes("[Product Request]"));
                return (
                    <div>
                        {isProductReq ? (
                            <Badge bg="warning" text="dark" style={{ fontSize: "0.75rem", marginBottom: "4px", display: "inline-block" }}>
                                🛍️ Product Request
                            </Badge>
                        ) : row.Category ? (
                            <Badge bg="light" text="dark" style={{ fontSize: "0.75rem", marginBottom: "4px", border: "1px solid #ddd", display: "inline-block" }}>
                                {row.Category}
                            </Badge>
                        ) : null}
                        <div>{cell || "Support Enquiry"}</div>
                    </div>
                );
            },
        },
        {
            dataField: "Description",
            text: "Enquiry Details",
            headerStyle: {
                minWidth: "280px",
                color: "#707275",
                fontWeight: 700,
                verticalAlign: "middle",
            },
            style: {
                verticalAlign: "middle",
            },
            formatter: (cell, row) => (
                <div
                    style={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        fontSize: "0.9rem",
                        lineHeight: "1.45",
                        wordBreak: "break-word",
                        whiteSpace: "normal",
                    }}
                >
                    {row.ProductName && (
                        <div style={{ fontWeight: 600, color: "#198754", marginBottom: "4px" }}>
                            📦 <strong>Product:</strong> {row.ProductName}
                        </div>
                    )}
                    <p style={{ margin: 0, color: "#2d3748" }}>{cell}</p>
                    {row.ImagePath && (
                        <div style={{ marginTop: "6px" }}>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                style={{ fontSize: "0.78rem", padding: "3px 10px", borderRadius: "14px" }}
                                onClick={() => openPhotoPreview(row)}
                            >
                                📷 View Attached Photo
                            </Button>
                        </div>
                    )}
                    {row.AdminNotes && (
                        <div
                            style={{
                                marginTop: "6px",
                                fontSize: "0.8rem",
                                color: "#0066cc",
                                backgroundColor: "#f0f7ff",
                                borderLeft: "3px solid #0066cc",
                                padding: "4px 8px",
                                borderRadius: "4px",
                            }}
                        >
                            <strong>Admin Note:</strong> {row.AdminNotes}
                        </div>
                    )}
                </div>
            ),
        },
        {
            dataField: "CreatedAt",
            text: "Submitted At",
            sort: true,
            headerStyle: {
                width: "170px",
                minWidth: "150px",
                color: "#707275",
                fontWeight: 700,
                verticalAlign: "middle",
            },
            style: {
                verticalAlign: "middle",
                whiteSpace: "nowrap",
            },
            formatter: (cell) => {
                if (!cell) return "-";
                const d = new Date(cell);
                return (
                    <div style={{ fontSize: "0.85rem", color: "#4a5568" }}>
                        <div>{d.toLocaleDateString()}</div>
                        <div style={{ color: "#718096", fontSize: "0.78rem" }}>
                            {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                    </div>
                );
            },
        },
        {
            dataField: "Status",
            text: "Status",
            sort: true,
            headerStyle: {
                width: "130px",
                minWidth: "110px",
                color: "#707275",
                fontWeight: 700,
                textAlign: "center",
                verticalAlign: "middle",
            },
            style: {
                textAlign: "center",
                verticalAlign: "middle",
            },
            formatter: (cell) => statusBadge(cell),
        },
        {
            dataField: "actions",
            text: "Action",
            headerStyle: {
                width: "110px",
                minWidth: "100px",
                color: "#707275",
                fontWeight: 700,
                textAlign: "center",
                verticalAlign: "middle",
            },
            style: {
                textAlign: "center",
                verticalAlign: "middle",
            },
            formatter: (cell, row) => (
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => openUpdateModal(row)}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "0.8rem",
                        padding: "5px 10px",
                        borderRadius: "6px",
                    }}
                >
                    <FaEdit /> Update
                </Button>
            ),
        },
    ];

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="customerEnquiries" />
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
                    {/* Header: Title, Description & Refresh Action */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "1.2rem",
                            flexWrap: "wrap",
                            gap: "12px",
                        }}
                    >
                        <div>
                            <h3 style={{ margin: "0 0 6px 0", fontWeight: 700, color: "#2c3e50", fontSize: "1.6rem" }}>
                                Customer Enquiries
                            </h3>
                            <p style={{ margin: 0, color: "#7f8c8d", fontSize: "0.95rem" }}>
                                Review customer support messages, enquiries, and update resolution statuses
                            </p>
                        </div>
                        <Button
                            variant="success"
                            onClick={fetchEnquiries}
                            size="sm"
                            style={{
                                padding: "7px 16px",
                                fontWeight: 600,
                                fontSize: "0.88rem",
                                borderRadius: "6px",
                            }}
                        >
                            Refresh
                        </Button>
                    </div>

                    {/* Search and Filters Bar */}
                    <div
                        style={{
                            display: "flex",
                            gap: "14px",
                            marginBottom: "1.5rem",
                            flexWrap: "wrap",
                            alignItems: "center",
                            backgroundColor: "#ffffff",
                            padding: "1rem 1.2rem",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }}
                    >
                        <div style={{ position: "relative", flex: "1 1 300px", minWidth: "240px" }}>
                            <Form.Control
                                type="text"
                                placeholder="Search by customer name, phone, enquiry details..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                style={{
                                    paddingLeft: "38px",
                                    height: "42px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e0",
                                    fontSize: "0.92rem",
                                }}
                            />
                            <FaSearch
                                style={{
                                    position: "absolute",
                                    left: "14px",
                                    top: "14px",
                                    color: "#a0aec0",
                                    fontSize: "0.9rem",
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "0 0 auto" }}>
                            <FaFilter style={{ color: "#718096" }} />
                            <Form.Select
                                value={selectedStatus}
                                onChange={handleStatusFilterChange}
                                style={{
                                    width: "180px",
                                    height: "42px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e0",
                                    fontSize: "0.92rem",
                                    backgroundColor: "#fff",
                                }}
                            >
                                <option value="All">All Statuses ({enquiries.length})</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                            </Form.Select>
                        </div>
                    </div>

                    {/* Table View */}
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "4rem" }}>
                            <ScaleLoader color="#2ecc71" loading={loading} css={override} size={60} />
                            <p style={{ marginTop: "1rem", color: "#888" }}>Loading enquiries...</p>
                        </div>
                    ) : (
                        <div
                            style={{
                                backgroundColor: "#ffffff",
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
                                    keyField="EnquiryID"
                                    data={filteredEnquiries}
                                    columns={columns}
                                    striped
                                    hover
                                    bordered={false}
                                    pagination={paginationFactory({
                                        sizePerPage: 10,
                                        sizePerPageList: [10, 20, 50],
                                        showTotal: true,
                                        paginationTotalRenderer: (from, to, size) => (
                                            <span style={{ fontSize: "0.85rem", color: "#718096", marginLeft: "8px" }}>
                                                Showing {from} to {to} of {size} enquiries
                                            </span>
                                        ),
                                    })}
                                    noDataIndication="No customer enquiries found matching criteria"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Update Status Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize: "1.2rem", fontWeight: 600 }}>
                        Update Enquiry #{selectedEnquiry?.EnquiryID}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedEnquiry && (
                        <div>
                            <div
                                style={{
                                    marginBottom: "1rem",
                                    backgroundColor: "#f8f9fa",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid #edf2f7",
                                }}
                            >
                                <div>
                                    <strong>Customer:</strong> {selectedEnquiry.Name || "Customer"} (
                                    {selectedEnquiry.MobileNumber || "N/A"})
                                </div>
                                <div style={{ marginTop: "4px" }}>
                                    <strong>Subject:</strong> {selectedEnquiry.Subject || "Enquiry"}
                                </div>
                                <div style={{ marginTop: "8px" }}>
                                    <strong>Description:</strong>
                                </div>
                                <div
                                    style={{
                                        fontSize: "0.9rem",
                                        color: "#2d3748",
                                        maxHeight: "110px",
                                        overflowY: "auto",
                                        marginTop: "4px",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {selectedEnquiry.Description}
                                </div>
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label>
                                    <strong>Status</strong>
                                </Form.Label>
                                <Form.Select
                                    value={updateStatus}
                                    onChange={(e) => setUpdateStatus(e.target.value)}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Under Review">Under Review</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Fulfilled">Fulfilled</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Rejected">Rejected</option>
                                    <option value="Closed">Closed</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>
                                    <strong>Admin Notes / Resolution Details</strong>
                                </Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Enter internal notes, customer call notes, or resolution..."
                                />
                            </Form.Group>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)} disabled={updating}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveStatus} disabled={updating}>
                        {updating ? "Saving..." : "Save Changes"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal for viewing photo attachment */}
            <Modal show={showPhotoModal} onHide={() => setShowPhotoModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize: "1.15rem", fontWeight: 600 }}>
                        📷 Attached Photo {selectedEnquiry?.ProductName ? `— ${selectedEnquiry.ProductName}` : ""}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center p-4">
                    {loadingPhoto ? (
                        <div style={{ padding: "40px" }}>
                            <ScaleLoader color="#1c6758" loading={true} />
                            <p style={{ marginTop: "12px", color: "#666" }}>Loading image securely...</p>
                        </div>
                    ) : previewPhotoUrl ? (
                        <div>
                            <img
                                src={previewPhotoUrl}
                                alt="Customer Attached Product Request"
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "70vh",
                                    objectFit: "contain",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                }}
                            />
                        </div>
                    ) : (
                        <p className="text-muted">No preview available</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPhotoModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default CustomerEnquiries;
