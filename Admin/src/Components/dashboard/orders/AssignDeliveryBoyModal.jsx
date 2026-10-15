import React, { useState, useEffect } from "react";
import { Modal, Button, Badge, Form, Spinner, Row, Col, ProgressBar } from "react-bootstrap";
import {
    FaMotorcycle,
    FaPhone,
    FaBatteryFull,
    FaBatteryThreeQuarters,
    FaBatteryHalf,
    FaBatteryQuarter,
    FaBatteryEmpty,
    FaMapMarkerAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationTriangle,
    FaSyncAlt,
    FaUserCheck,
    FaArrowRight,
    FaExchangeAlt,
    FaShieldAlt
} from "react-icons/fa";
import { toast } from "react-toastify";
import { Services } from "../../../Services";

const AssignDeliveryBoyModal = ({ show, onHide, order, onSuccess, token: tokenProp }) => {
    const getAuthHeader = () => {
        if (tokenProp && tokenProp.Authorization) return tokenProp;
        const stored = (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) ||
                       (typeof localStorage !== "undefined" && localStorage.getItem("token")) || "";
        return { Authorization: `token ${stored}` };
    };
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [drivers, setDrivers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterTab, setFilterTab] = useState("all"); // 'all', 'available', 'busy', 'offline'
    
    // Confirmation stage
    const [confirmingDriver, setConfirmingDriver] = useState(null);
    const [reassignReason, setReassignReason] = useState("");

    const isReassignment = Boolean(order?.DeliveryBoyID && order.DeliveryBoyID > 0);
    const currentDriverName = order?.DriverName || order?.DeliveryBoyName || (order?.DeliveryBoyID ? `Driver #${order.DeliveryBoyID}` : "None");

    const fetchEligibleDrivers = async () => {
        const auth = getAuthHeader();
        if (!auth?.Authorization || auth.Authorization === "token ") {
            toast.error("Admin session not found. Please log in.");
            return;
        }
        setLoading(true);
        try {
            const res = await Services.getEligibleDrivers("GET", null, auth);
            if (res && res.Status === 1 && Array.isArray(res.Drivers)) {
                setDrivers(res.Drivers);
            } else {
                toast.error(res?.Message || "Failed to load eligible delivery fleet");
            }
        } catch (err) {
            console.error("Error fetching drivers:", err);
            toast.error("Error fetching delivery fleet");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show) {
            setConfirmingDriver(null);
            setReassignReason("");
            setSearchQuery("");
            setFilterTab("all");
            fetchEligibleDrivers();
        }
    }, [show, order?.OrderID]);

    const handleSelectDriver = (driver) => {
        if (!driver.IsEligible) {
            toast.warning(driver.IneligibilityReason || "Driver is currently ineligible for assignment");
            return;
        }
        setConfirmingDriver(driver);
    };

    const handleExecuteAssignment = async () => {
        if (!confirmingDriver || !order?.OrderID) return;
        setSubmitting(true);
        try {
            const payload = {
                DeliveryBoyID: confirmingDriver.DriverID,
                NewDeliveryBoyID: confirmingDriver.DriverID,
                Reason: isReassignment ? (reassignReason.trim() || "Operational dispatcher action") : undefined
            };

            const auth = getAuthHeader();
            const res = isReassignment
                ? await Services.reassignDriver("PUT", JSON.stringify(payload), auth, order.OrderID)
                : await Services.assignDeliveryBoy("PUT", JSON.stringify(payload), auth, order.OrderID);

            if (res && res.Status === 1) {
                toast.success(res.Message || `Order #${order.OrderID} assigned to ${confirmingDriver.Name}`);
                if (onSuccess) {
                    onSuccess(res);
                }
                onHide();
            } else {
                toast.error(res?.Message || "Failed to complete driver assignment");
            }
        } catch (err) {
            console.error("Error submitting assignment:", err);
            toast.error("Network or server error updating assignment");
        } finally {
            setSubmitting(false);
        }
    };

    // Filter drivers
    const filteredDrivers = drivers.filter((d) => {
        const matchesSearch =
            d.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (d.MobileNumber && d.MobileNumber.includes(searchQuery)) ||
            (d.VehicleNumber && d.VehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        if (filterTab === "available") {
            return d.IsEligible;
        }
        if (filterTab === "busy") {
            return d.ActiveOrdersCount >= 5;
        }
        if (filterTab === "offline") {
            return d.DutyStatus === "OFFLINE" || d.DutyStatus === "ON_BREAK";
        }
        return true;
    });

    const renderBatteryIcon = (pct) => {
        if (pct === null || pct === undefined) return <span className="text-muted">N/A</span>;
        if (pct >= 80) return <span className="text-success"><FaBatteryFull className="me-1" />{pct}%</span>;
        if (pct >= 50) return <span className="text-success"><FaBatteryThreeQuarters className="me-1" />{pct}%</span>;
        if (pct >= 20) return <span className="text-warning"><FaBatteryHalf className="me-1" />{pct}%</span>;
        if (pct >= 10) return <span className="text-danger"><FaBatteryQuarter className="me-1" />{pct}%</span>;
        return <span className="text-danger"><FaBatteryEmpty className="me-1" />{pct}%</span>;
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
            <Modal.Header closeButton className="bg-light border-bottom">
                <Modal.Title className="h5 fw-bold d-flex align-items-center">
                    <FaMotorcycle className="me-2 text-primary" />
                    {confirmingDriver
                        ? (isReassignment ? "Confirm Driver Reassignment" : "Confirm Driver Assignment")
                        : (isReassignment ? `Reassign Delivery Boy — Order #${order?.OrderID}` : `Assign Delivery Boy — Order #${order?.OrderID}`)}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="p-4">
                {/* Order Summary Strip */}
                <div className="bg-light p-3 rounded mb-3 border">
                    <Row className="g-2 text-sm">
                        <Col xs={6} md={3}>
                            <span className="text-muted d-block small">Order ID</span>
                            <span className="fw-bold text-primary">#{order?.OrderID}</span>
                        </Col>
                        <Col xs={6} md={3}>
                            <span className="text-muted d-block small">Customer</span>
                            <span className="fw-bold">{order?.UserName || order?.FirstName || "Customer"}</span>
                        </Col>
                        <Col xs={12} md={3}>
                            <span className="text-muted d-block small">Current Assignment</span>
                            {isReassignment ? (
                                <Badge bg="warning" text="dark" className="px-2 py-1">
                                    <FaExchangeAlt className="me-1" />
                                    {currentDriverName}
                                </Badge>
                            ) : (
                                <Badge bg="secondary" className="px-2 py-1">UNASSIGNED</Badge>
                            )}
                        </Col>
                        <Col xs={12} md={3}>
                            <span className="text-muted d-block small">Delivery Destination</span>
                            <span className="text-truncate d-block small text-muted" title={order?.Address || "Customer address"}>
                                {order?.Address || "Address on record"}
                            </span>
                        </Col>
                    </Row>
                </div>

                {/* VIEW 1: DRIVER SELECTION */}
                {!confirmingDriver && (
                    <>
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
                            <div className="d-flex align-items-center gap-1 flex-wrap">
                                <Button
                                    size="sm"
                                    variant={filterTab === "all" ? "primary" : "outline-secondary"}
                                    onClick={() => setFilterTab("all")}
                                >
                                    All Drivers ({drivers.length})
                                </Button>
                                <Button
                                    size="sm"
                                    variant={filterTab === "available" ? "success" : "outline-secondary"}
                                    onClick={() => setFilterTab("available")}
                                >
                                    Available ({drivers.filter((d) => d.IsEligible).length})
                                </Button>
                                <Button
                                    size="sm"
                                    variant={filterTab === "busy" ? "warning" : "outline-secondary"}
                                    onClick={() => setFilterTab("busy")}
                                >
                                    Full / 5 ({drivers.filter((d) => d.ActiveOrdersCount >= 5).length})
                                </Button>
                                <Button
                                    size="sm"
                                    variant={filterTab === "offline" ? "secondary" : "outline-secondary"}
                                    onClick={() => setFilterTab("offline")}
                                >
                                    Offline ({drivers.filter((d) => d.DutyStatus === "OFFLINE" || d.DutyStatus === "ON_BREAK").length})
                                </Button>
                            </div>
                            <div className="d-flex gap-2">
                                <Form.Control
                                    type="text"
                                    size="sm"
                                    placeholder="Search driver / phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ width: "200px" }}
                                />
                                <Button size="sm" variant="outline-primary" onClick={fetchEligibleDrivers} title="Refresh fleet">
                                    <FaSyncAlt />
                                </Button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="text-muted mt-2 small">Loading fleet telematics and capacity...</p>
                            </div>
                        ) : filteredDrivers.length === 0 ? (
                            <div className="text-center py-5 border rounded bg-white">
                                <FaExclamationTriangle className="text-warning fs-2 mb-2" />
                                <h6 className="fw-bold">No Drivers Matching Filter</h6>
                                <p className="text-muted small mb-0">Try adjusting your search query or filter tabs.</p>
                            </div>
                        ) : (
                            <div style={{ maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
                                <div className="d-flex flex-column gap-2">
                                    {filteredDrivers.map((driver) => {
                                        const isCurrent = driver.DriverID === order?.DeliveryBoyID;
                                        const isOnline = driver.DutyStatus === "ONLINE" || driver.DutyStatus === "ON_DELIVERY";

                                        return (
                                            <div
                                                key={driver.DriverID}
                                                className={`p-3 rounded border transition-all ${
                                                    isCurrent
                                                        ? "border-primary bg-primary bg-opacity-10"
                                                        : driver.IsEligible
                                                        ? "bg-white border-success-subtle hover-shadow"
                                                        : "bg-light text-muted opacity-75"
                                                }`}
                                            >
                                                <Row className="align-items-center g-2">
                                                    {/* Driver Basic Info */}
                                                    <Col xs={12} md={4}>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="fw-bold text-dark fs-6">{driver.Name}</div>
                                                            {isCurrent && (
                                                                <Badge bg="primary" className="small">Current</Badge>
                                                            )}
                                                        </div>
                                                        <div className="small text-muted d-flex align-items-center gap-1 mt-1">
                                                            <FaPhone style={{ fontSize: "11px" }} />
                                                            {driver.MobileNumber}
                                                        </div>
                                                        <div className="small text-muted mt-1">
                                                            <FaMotorcycle className="me-1" />
                                                            {driver.VehicleType} ({driver.VehicleNumber})
                                                        </div>
                                                    </Col>

                                                    {/* Status & Telematics */}
                                                    <Col xs={6} md={3}>
                                                        <div>
                                                            {driver.DutyStatus === "ONLINE" && (
                                                                <Badge bg="success" className="px-2 py-1">ONLINE</Badge>
                                                            )}
                                                            {driver.DutyStatus === "ON_DELIVERY" && (
                                                                <Badge bg="primary" className="px-2 py-1">ON DELIVERY</Badge>
                                                            )}
                                                            {driver.DutyStatus === "ON_BREAK" && (
                                                                <Badge bg="warning" text="dark" className="px-2 py-1">ON BREAK</Badge>
                                                            )}
                                                            {driver.DutyStatus === "OFFLINE" && (
                                                                <Badge bg="secondary" className="px-2 py-1">OFFLINE</Badge>
                                                            )}
                                                        </div>
                                                        <div className="small mt-2">
                                                            Battery: {renderBatteryIcon(driver.BatteryLevel)}
                                                        </div>
                                                        <div className="small mt-1 text-muted">
                                                            <FaMapMarkerAlt className="me-1 text-danger" style={{ fontSize: "11px" }} />
                                                            GPS: <span className={driver.GpsStatus === "Active" ? "text-success fw-bold" : "text-muted"}>
                                                                {driver.GpsStatus}
                                                            </span> ({driver.LastGpsText})
                                                        </div>
                                                    </Col>

                                                    {/* Capacity Gauge */}
                                                    <Col xs={6} md={2}>
                                                        <div className="small text-muted">Active Orders</div>
                                                        <div className="fw-bold fs-6">
                                                            {driver.ActiveOrdersCount} / {driver.MaxCapacity}
                                                        </div>
                                                        <ProgressBar
                                                            now={(driver.ActiveOrdersCount / driver.MaxCapacity) * 100}
                                                            variant={driver.ActiveOrdersCount >= 5 ? "danger" : driver.ActiveOrdersCount >= 3 ? "warning" : "success"}
                                                            style={{ height: "6px" }}
                                                            className="mt-1"
                                                        />
                                                        <div className="small text-muted mt-1">
                                                            {driver.AvailableCapacity} available
                                                        </div>
                                                    </Col>

                                                    {/* Action Button */}
                                                    <Col xs={12} md={3} className="text-md-end">
                                                        {isCurrent ? (
                                                            <Button size="sm" variant="outline-primary" disabled>
                                                                <FaCheckCircle className="me-1" /> Currently Assigned
                                                            </Button>
                                                        ) : !isOnline ? (
                                                            <Button size="sm" variant="outline-secondary" disabled>
                                                                Disabled - Offline
                                                            </Button>
                                                        ) : driver.AccountStatus !== 1 ? (
                                                            <Button size="sm" variant="outline-danger" disabled>
                                                                Disabled - Unavailable
                                                            </Button>
                                                        ) : driver.ActiveOrdersCount >= 5 ? (
                                                            <Button size="sm" variant="outline-warning" disabled>
                                                                Disabled - Capacity Full
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant={isReassignment ? "warning" : "success"}
                                                                className="px-3 fw-bold"
                                                                onClick={() => handleSelectDriver(driver)}
                                                            >
                                                                {isReassignment ? (
                                                                    <>Reassign <FaArrowRight className="ms-1" /></>
                                                                ) : (
                                                                    <>Assign <FaArrowRight className="ms-1" /></>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </Col>
                                                </Row>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* VIEW 2: CONFIRMATION STEP */}
                {confirmingDriver && (
                    <div className="py-2">
                        <div className="alert alert-warning border-warning d-flex align-items-center mb-3">
                            <FaShieldAlt className="fs-3 text-warning me-3 flex-shrink-0" />
                            <div>
                                <h6 className="fw-bold mb-1">
                                    {isReassignment
                                        ? `Reassign Order #${order?.OrderID} from ${currentDriverName} to ${confirmingDriver.Name}?`
                                        : `Assign Order #${order?.OrderID} to ${confirmingDriver.Name}?`}
                                </h6>
                                <div className="small text-muted">
                                    Admin is Authoritative Dispatcher. Assignment updates the order lifecycle, notifies the rider, and logs audit timeline records.
                                </div>
                            </div>
                        </div>

                        <div className="card shadow-sm border-0 mb-3 bg-light">
                            <div className="card-body">
                                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Assignment Details Verification</h6>
                                <Row className="g-3">
                                    <Col xs={6}>
                                        <div className="small text-muted">Order ID</div>
                                        <div className="fw-bold text-primary">#{order?.OrderID}</div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="small text-muted">Customer Name</div>
                                        <div className="fw-bold">{order?.UserName || order?.FirstName || "Customer"}</div>
                                    </Col>
                                    <Col xs={12}>
                                        <div className="small text-muted">Delivery Address</div>
                                        <div className="fw-bold text-dark">{order?.Address || "On file"}</div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="small text-muted">Selected Delivery Boy</div>
                                        <div className="fw-bold text-success fs-6">{confirmingDriver.Name}</div>
                                        <div className="small text-muted">{confirmingDriver.MobileNumber}</div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="small text-muted">Driver Active Load</div>
                                        <div className="fw-bold">
                                            {confirmingDriver.ActiveOrdersCount} / {confirmingDriver.MaxCapacity} Orders
                                        </div>
                                        <div className="small text-muted">
                                            Battery: {confirmingDriver.BatteryLevel || "N/A"}% | GPS: {confirmingDriver.GpsStatus}
                                        </div>
                                    </Col>
                                </Row>

                                {isReassignment && (
                                    <div className="mt-3 pt-3 border-top">
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-dark">
                                                Reason for Reassignment <span className="text-muted fw-normal">(Recorded in Timeline Audit)</span>
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="e.g. Previous rider vehicle puncture, dispatcher reallocation"
                                                value={reassignReason}
                                                onChange={(e) => setReassignReason(e.target.value)}
                                            />
                                        </Form.Group>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer className="bg-light border-top">
                {confirmingDriver ? (
                    <>
                        <Button variant="secondary" onClick={() => setConfirmingDriver(null)} disabled={submitting}>
                            Back to Driver List
                        </Button>
                        <Button
                            variant={isReassignment ? "warning" : "success"}
                            onClick={handleExecuteAssignment}
                            disabled={submitting}
                            className="fw-bold"
                        >
                            {submitting ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Updating Assignment...
                                </>
                            ) : (
                                <>
                                    <FaCheckCircle className="me-1" />
                                    {isReassignment ? "Confirm Reassignment" : "Confirm Assignment"}
                                </>
                            )}
                        </Button>
                    </>
                ) : (
                    <Button variant="secondary" onClick={onHide}>
                        Close
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default AssignDeliveryBoyModal;
