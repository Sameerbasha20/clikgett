import React, { useState, useEffect, useRef } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import ScaleLoader from "react-spinners/ScaleLoader";
import { css } from "@emotion/react";
import { 
    FaMotorcycle, 
    FaExclamationTriangle, 
    FaCheckCircle, 
    FaSyncAlt, 
    FaMapMarkerAlt, 
    FaBatteryThreeQuarters, 
    FaPhone,
    FaCloudRain,
    FaTrafficLight,
    FaTools,
    FaUtensils
} from "react-icons/fa";
import { Modal, Button, Form, Badge, Tabs, Tab } from "react-bootstrap";
import AssignDeliveryBoyModal from "../orders/AssignDeliveryBoyModal";
import moment from "moment";
import { Link } from "react-router-dom";

function LiveOperations() {
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({
        activeDeliveries: 0,
        onTimeCount: 0,
        atRiskCount: 0,
        delayedCount: 0,
        onlineDrivers: 0,
        offlineDrivers: 0,
        unassignedOrders: 0
    });
    const [activeDeliveries, setActiveDeliveries] = useState([]);
    const [fleetDrivers, setFleetDrivers] = useState([]);
    const [delays, setDelays] = useState([]);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [activeTab, setActiveTab] = useState("deliveries");

    // Modal state for driver reassignment
    const [reassignModal, setReassignModal] = useState(false);
    const [selectedOrderForReassign, setSelectedOrderForReassign] = useState(null);
    const [showAssignDeliveryModal, setShowAssignDeliveryModal] = useState(false);
    const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);
    const [selectedNewDriverId, setSelectedNewDriverId] = useState("");
    const [reassignReason, setReassignReason] = useState("");

    // Modal state for Delay Review Adjustment
    const [adjustDelayModal, setAdjustDelayModal] = useState(false);
    const [selectedDelayForAdjust, setSelectedDelayForAdjust] = useState(null);
    const [customAdjustMinutes, setCustomAdjustMinutes] = useState(10);
    const [adminReviewNote, setAdminReviewNote] = useState("");

    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const refreshTimerRef = useRef(null);

    const override = css`
        display: block;
        margin: 0 auto;
    `;

    const fetchData = async () => {
        try {
            const opsRes = await Services.getLiveOperations("GET", null, token);
            if (opsRes && opsRes.Status === 1) {
                setKpis(opsRes.KPIs || {});
                setActiveDeliveries(opsRes.ActiveDeliveries || []);
                setFleetDrivers(opsRes.FleetDrivers || []);
            }

            const delaysRes = await Services.getDelayQueue("GET", null, token);
            if (delaysRes && delaysRes.Status === 1) {
                setDelays(delaysRes.Delays || []);
            }
        } catch (err) {
            console.error("Error fetching live operations data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        if (autoRefresh) {
            refreshTimerRef.current = setInterval(() => {
                fetchData();
            }, 15000); // Poll every 15s
        }

        return () => {
            if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoRefresh]);

    // Fast inline ETA modification
    const handleQuickEtaAdjust = async (orderId, minutes) => {
        try {
            const body = JSON.stringify({
                adjustmentMinutes: minutes,
                reason: `Ops dispatcher quick buffer (+${minutes}m)`
            });
            const res = await Services.editDeliveryTime("PUT", body, token, orderId);
            if (res && res.Status === 1) {
                toast.success(`ETA updated for Order #${orderId} (+${minutes}m)`);
                fetchData();
            } else {
                toast.error(res?.Message || "Failed to update ETA");
            }
        } catch (err) {
            toast.error("Error updating ETA");
        }
    };

    // Review Driver Delay (Approve / Reject)
    const handleReviewDelay = async (delayId, action, minutes = 0, note = "") => {
        try {
            const body = JSON.stringify({
                action: action,
                approvedMinutes: minutes,
                adminReason: note || (action === "APPROVE" ? "Approved by operations dispatcher" : "Rejected by operations")
            });
            const res = await Services.reviewDelay("POST", body, token, delayId);
            if (res && res.Status === 1) {
                toast.success(`Delay request ${action.toLowerCase()}d successfully`);
                fetchData();
            } else {
                toast.error(res?.Message || "Failed to review delay request");
            }
        } catch (err) {
            toast.error("Error submitting delay review");
        }
    };

    // Execute Reassign Driver
    const handleExecuteReassign = async () => {
        if (!selectedOrderForReassign || !selectedNewDriverId) {
            toast.warn("Please select a new driver");
            return;
        }
        try {
            const body = JSON.stringify({
                NewDeliveryBoyID: parseInt(selectedNewDriverId, 10),
                Reason: reassignReason || "Dispatcher live reassignment"
            });
            const res = await Services.reassignDriver("PUT", body, token, selectedOrderForReassign.OrderID);
            if (res && res.Status === 1) {
                toast.success(`Order #${selectedOrderForReassign.OrderID} successfully reassigned!`);
                setReassignModal(false);
                fetchData();
            } else {
                toast.error(res?.Message || "Failed to reassign driver");
            }
        } catch (err) {
            toast.error("Error reassigning driver");
        }
    };

    // Format Reason Icon
    const renderReasonBadge = (reason) => {
        switch (reason) {
            case "HEAVY_RAIN":
                return <Badge bg="primary"><FaCloudRain className="me-1" /> Rain Delay</Badge>;
            case "HEAVY_TRAFFIC":
                return <Badge bg="warning" text="dark"><FaTrafficLight className="me-1" /> Traffic Jam</Badge>;
            case "VEHICLE_ISSUE":
                return <Badge bg="danger"><FaTools className="me-1" /> Bike / Vehicle</Badge>;
            case "RESTAURANT_DELAY":
                return <Badge bg="info"><FaUtensils className="me-1" /> Store Pickup</Badge>;
            default:
                return <Badge bg="secondary">{reason?.replace("_", " ") || "Delay"}</Badge>;
        }
    };

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="LiveOperations" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ minHeight: "100vh", backgroundColor: "#F8FAFC" }}>
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h3 className="fw-bold mb-1" style={{ color: "#1E293B" }}>
                                <FaMotorcycle className="me-2 text-primary" /> Live Delivery Operations
                            </h3>
                            <p className="text-muted mb-0 small">
                                Real-time dispatch radar, live driver telematics, dynamic ETA tracking, and delay approvals.
                            </p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <Form.Check 
                                type="switch"
                                id="auto-refresh-switch"
                                label="Live Polling (15s)"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="me-2"
                            />
                            <Button 
                                variant="outline-primary" 
                                size="sm" 
                                onClick={fetchData} 
                                className="d-flex align-items-center gap-1"
                            >
                                <FaSyncAlt /> Refresh
                            </Button>
                        </div>
                    </div>

                    {/* KPI Cards Row */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-sm-6 col-xl">
                            <div className="card shadow-sm border-0 border-start border-primary border-4 p-3">
                                <div className="text-muted small fw-bold">ACTIVE DELIVERIES</div>
                                <div className="h3 fw-bold mb-0 text-primary">{kpis.activeDeliveries}</div>
                                <div className="small text-muted mt-1">In progress on road</div>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6 col-xl">
                            <div className="card shadow-sm border-0 border-start border-success border-4 p-3">
                                <div className="text-muted small fw-bold">ON TIME</div>
                                <div className="h3 fw-bold mb-0 text-success">{kpis.onTimeCount}</div>
                                <div className="small text-muted mt-1">&gt; 5m buffer</div>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6 col-xl">
                            <div className="card shadow-sm border-0 border-start border-warning border-4 p-3">
                                <div className="text-muted small fw-bold">AT RISK</div>
                                <div className="h3 fw-bold mb-0 text-warning">{kpis.atRiskCount}</div>
                                <div className="small text-muted mt-1">&lt; 5m remaining</div>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6 col-xl">
                            <div className="card shadow-sm border-0 border-start border-danger border-4 p-3">
                                <div className="text-muted small fw-bold">DELAYED (BREACHED)</div>
                                <div className="h3 fw-bold mb-0 text-danger">{kpis.delayedCount}</div>
                                <div className="small text-muted mt-1">Past promised ETA</div>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6 col-xl">
                            <div className="card shadow-sm border-0 border-start border-info border-4 p-3">
                                <div className="text-muted small fw-bold">ONLINE FLEET</div>
                                <div className="h3 fw-bold mb-0 text-info">{kpis.onlineDrivers} <span className="small text-muted fs-6">/ {fleetDrivers.length}</span></div>
                                <div className="small text-muted mt-1">{kpis.offlineDrivers} offline riders</div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <ScaleLoader color="#26A860" css={override} size={60} />
                            <p className="mt-3 text-muted">Synchronizing live operations telemetry...</p>
                        </div>
                    ) : (
                        <Tabs 
                            activeKey={activeTab} 
                            onSelect={(k) => setActiveTab(k)} 
                            className="mb-3 custom-ops-tabs"
                        >
                            {/* TAB 1: ACTIVE DELIVERIES RADAR */}
                            <Tab eventKey="deliveries" title={`Active Radar (${activeDeliveries.length})`}>
                                <div className="card shadow-sm border-0">
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr className="small text-uppercase">
                                                    <th>Order #</th>
                                                    <th>Customer & Drop Location</th>
                                                    <th>Assigned Rider</th>
                                                    <th>Distance</th>
                                                    <th>Authoritative ETA</th>
                                                    <th>SLA Status</th>
                                                    <th>Delay State</th>
                                                    <th className="text-end">Operational Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {activeDeliveries.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="8" className="text-center py-5 text-muted">
                                                            <FaCheckCircle className="fs-1 text-success mb-2 d-block" />
                                                            No active deliveries currently in progress. All clear!
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    activeDeliveries.map((order) => (
                                                        <tr key={order.OrderID}>
                                                            <td>
                                                                <Link to={`/orders/${order.OrderID}`} className="fw-bold text-decoration-none text-primary">
                                                                    #{order.OrderID}
                                                                </Link>
                                                                <div className="small text-muted">₹{order.GrandTotal}</div>
                                                            </td>
                                                            <td style={{ maxWidth: "260px" }}>
                                                                <div className="fw-bold text-truncate" title={order.Address}>
                                                                    {order.Address}
                                                                </div>
                                                                <div className="small text-muted">User #{order.UserID}</div>
                                                            </td>
                                                            <td>
                                                                {(order.DriverName === 'UNASSIGNED' || !order.DeliveryBoyID || order.DeliveryBoyID === 0) ? (
    <span className="badge bg-secondary px-2 py-1">UNASSIGNED</span>
) : (
    <div className="fw-bold">{order.DriverName}</div>
)}
                                                                <div className="small text-muted d-flex align-items-center gap-1">
                                                                    <FaPhone className="text-secondary" style={{ fontSize: "10px" }} />
                                                                    {order.DriverMobile || "--"}
                                                                    {order.BatteryLevel !== null && (
                                                                        <span className="badge bg-light text-dark ms-1">
                                                                            <FaBatteryThreeQuarters /> {order.BatteryLevel}%
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {order.LiveDistanceMeters !== null ? (
                                                                    <span className="badge bg-light text-dark border">
                                                                        <FaMapMarkerAlt className="text-danger me-1" />
                                                                        {order.LiveDistanceMeters > 1000 
                                                                            ? `${(order.LiveDistanceMeters / 1000).toFixed(1)} km` 
                                                                            : `${order.LiveDistanceMeters} m`}
                                                                    </span>
                                                                ) : (
                                                                    <span className="small text-muted">{order.Distance ? `${order.Distance} km` : "Pending GPS"}</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div className="fw-bold">
                                                                    {order.EstimateDateTime ? moment(order.EstimateDateTime).format("hh:mm A") : "Not set"}
                                                                </div>
                                                                <div className="small text-muted">
                                                                    {order.RemainingMinutes > 0 
                                                                        ? `${order.RemainingMinutes} mins left` 
                                                                        : `${Math.abs(order.RemainingMinutes)} mins overdue`}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {order.SlaStatus === "ON_TIME" && (
                                                                    <Badge bg="success" className="px-2 py-1">ON TIME</Badge>
                                                                )}
                                                                {order.SlaStatus === "AT_RISK" && (
                                                                    <Badge bg="warning" text="dark" className="px-2 py-1">AT RISK</Badge>
                                                                )}
                                                                {order.SlaStatus === "DELAYED" && (
                                                                    <Badge bg="danger" className="px-2 py-1">DELAYED</Badge>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {order.DelayStatus === "PENDING" ? (
                                                                    <Badge bg="warning" text="dark" className="animate-pulse">
                                                                        PENDING APPROVAL
                                                                    </Badge>
                                                                ) : order.DelayStatus === "APPROVED" ? (
                                                                    <Badge bg="info">
                                                                        +{order.TotalDelayMinutes}m APPROVED
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-muted small">None</span>
                                                                )}
                                                            </td>
                                                            <td className="text-end">
                                                                <div className="btn-group btn-group-sm">
                                                                    <Button 
                                                                        variant="outline-secondary" 
                                                                        size="sm"
                                                                        title="Add +5m buffer"
                                                                        onClick={() => handleQuickEtaAdjust(order.OrderID, 5)}
                                                                    >
                                                                        +5m
                                                                    </Button>
                                                                    <Button 
                                                                        variant="outline-secondary" 
                                                                        size="sm"
                                                                        title="Add +10m buffer"
                                                                        onClick={() => handleQuickEtaAdjust(order.OrderID, 10)}
                                                                    >
                                                                        +10m
                                                                    </Button>
                                                                    {(order.DriverName === 'UNASSIGNED' || !order.DeliveryBoyID || order.DeliveryBoyID === 0) ? (
    <Button 
        variant="primary" 
        size="sm"
        className="fw-bold"
        onClick={() => {
            setSelectedOrderForModal(order);
            setShowAssignDeliveryModal(true);
        }}
    >
        Assign Driver
    </Button>
) : (
    <Button 
        variant="outline-primary" 
        size="sm"
        onClick={() => {
            setSelectedOrderForModal(order);
            setShowAssignDeliveryModal(true);
        }}
    >
        Reassign
    </Button>
)}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </Tab>

                            {/* TAB 2: DELAY REVIEW QUEUE */}
                            <Tab eventKey="delays" title={`Delay Review Queue (${delays.filter(d => d.Status === 'PENDING').length})`}>
                                <div className="card shadow-sm border-0">
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr className="small text-uppercase">
                                                    <th>Delay ID</th>
                                                    <th>Order #</th>
                                                    <th>Rider</th>
                                                    <th>Reason</th>
                                                    <th>Requested Buffer</th>
                                                    <th>Current ETA</th>
                                                    <th>Driver Remarks</th>
                                                    <th>Submitted At</th>
                                                    <th>Status</th>
                                                    <th className="text-end">Review Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {delays.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="10" className="text-center py-5 text-muted">
                                                            No rider delays reported.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    delays.map((d) => (
                                                        <tr key={d.DelayID} className={d.Status === 'PENDING' ? 'table-warning' : ''}>
                                                            <td>#{d.DelayID}</td>
                                                            <td>
                                                                <Link to={`/orders/${d.OrderID}`} className="fw-bold text-decoration-none">
                                                                    #{d.OrderID}
                                                                </Link>
                                                            </td>
                                                            <td>
                                                                <div className="fw-bold">{d.DriverName || `Driver #${d.DriverID}`}</div>
                                                                <div className="small text-muted">{d.DriverMobile}</div>
                                                            </td>
                                                            <td>{renderReasonBadge(d.Reason)}</td>
                                                            <td>
                                                                <span className="badge bg-danger fs-6">+{d.RequestedMinutes} min</span>
                                                            </td>
                                                            <td>
                                                                {d.EstimateDateTime ? moment(d.EstimateDateTime).format("hh:mm A") : "--"}
                                                            </td>
                                                            <td style={{ maxWidth: "200px" }} className="small text-muted text-truncate" title={d.Remarks}>
                                                                {d.Remarks || "No remarks"}
                                                            </td>
                                                            <td className="small text-muted">
                                                                {moment(d.CreatedAt).fromNow()}
                                                            </td>
                                                            <td>
                                                                <Badge bg={d.Status === 'PENDING' ? 'warning' : d.Status === 'APPROVED' ? 'success' : 'secondary'}>
                                                                    {d.Status}
                                                                </Badge>
                                                            </td>
                                                            <td className="text-end">
                                                                {d.Status === 'PENDING' ? (
                                                                    <div className="d-flex justify-content-end gap-1">
                                                                        <Button 
                                                                            variant="success" 
                                                                            size="sm"
                                                                            onClick={() => handleReviewDelay(d.DelayID, 'APPROVE', d.RequestedMinutes, "Approved by ops")}
                                                                        >
                                                                            Approve (+{d.RequestedMinutes}m)
                                                                        </Button>
                                                                        <Button 
                                                                            variant="outline-warning" 
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setSelectedDelayForAdjust(d);
                                                                                setCustomAdjustMinutes(d.RequestedMinutes);
                                                                                setAdjustDelayModal(true);
                                                                            }}
                                                                        >
                                                                            Adjust
                                                                        </Button>
                                                                        <Button 
                                                                            variant="outline-danger" 
                                                                            size="sm"
                                                                            onClick={() => handleReviewDelay(d.DelayID, 'REJECT', 0, "Rejected by ops dispatcher")}
                                                                        >
                                                                            Reject
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="small text-muted">Reviewed</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </Tab>

                            {/* TAB 3: FLEET DRIVERS MONITOR */}
                            <Tab eventKey="fleet" title={`Fleet Capacity (${fleetDrivers.length})`}>
                                <div className="card shadow-sm border-0">
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr className="small text-uppercase">
                                                    <th>Driver ID</th>
                                                    <th>Partner Name</th>
                                                    <th>Mobile Number</th>
                                                    <th>Duty Status</th>
                                                    <th>Battery</th>
                                                    <th>Active Loads</th>
                                                    <th>Last GPS Ping</th>
                                                    <th>Telematics Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {fleetDrivers.map((driver) => (
                                                    <tr key={driver.DriverID}>
                                                        <td>#{driver.DriverID}</td>
                                                        <td className="fw-bold">{driver.Name}</td>
                                                        <td>{driver.MobileNumber}</td>
                                                        <td>
                                                            {driver.DutyStatus === 'ONLINE' && <Badge bg="success">ONLINE</Badge>}
                                                            {driver.DutyStatus === 'ON_DELIVERY' && <Badge bg="primary">ON DELIVERY</Badge>}
                                                            {driver.DutyStatus === 'ON_BREAK' && <Badge bg="warning" text="dark">ON BREAK</Badge>}
                                                            {driver.DutyStatus === 'OFFLINE' && <Badge bg="secondary">OFFLINE</Badge>}
                                                        </td>
                                                        <td>
                                                            {driver.BatteryLevel !== null ? (
                                                                <span className={driver.BatteryLevel < 20 ? "text-danger fw-bold" : ""}>
                                                                    <FaBatteryThreeQuarters className="me-1" />
                                                                    {driver.BatteryLevel}%
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted">--</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-light text-dark border">
                                                                {driver.ActiveOrdersCount} orders
                                                            </span>
                                                        </td>
                                                        <td className="small text-muted">
                                                            {driver.LastLocationUpdatedAt 
                                                                ? moment(driver.LastLocationUpdatedAt).fromNow() 
                                                                : "Never"}
                                                        </td>
                                                        <td>
                                                            {driver.IsStale ? (
                                                                <span className="badge bg-warning text-dark">
                                                                    <FaExclamationTriangle className="me-1" /> STALE GPS
                                                                </span>
                                                            ) : driver.DutyStatus === 'ONLINE' || driver.DutyStatus === 'ON_DELIVERY' ? (
                                                                <span className="badge bg-success">
                                                                    <FaCheckCircle className="me-1" /> LIVE
                                                                </span>
                                                            ) : (
                                                                <span className="badge bg-light text-muted">STANDBY</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </Tab>
                        </Tabs>
                    )}

                    {/* MODAL: Reassign Driver */}
                    <Modal show={reassignModal} onHide={() => setReassignModal(false)} centered>
                        <Modal.Header closeButton>
                            <Modal.Title className="h5">
                                Reassign Order #{selectedOrderForReassign?.OrderID}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Select Active Delivery Partner</Form.Label>
                                <Form.Select 
                                    value={selectedNewDriverId} 
                                    onChange={(e) => setSelectedNewDriverId(e.target.value)}
                                >
                                    <option value="">-- Choose Online Driver --</option>
                                    {fleetDrivers
                                        .filter(d => d.DutyStatus === 'ONLINE' || d.DutyStatus === 'ON_DELIVERY')
                                        .map(d => (
                                            <option key={d.DriverID} value={d.DriverID}>
                                                {d.Name} ({d.MobileNumber}) - {d.ActiveOrdersCount} active orders
                                            </option>
                                        ))
                                    }
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Reason for Reassignment</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="e.g. Previous driver vehicle breakdown"
                                    value={reassignReason}
                                    onChange={(e) => setReassignReason(e.target.value)}
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setReassignModal(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleExecuteReassign}>Confirm Reassignment</Button>
                        </Modal.Footer>
                    </Modal>

                    {/* MODAL: Unified Assign / Reassign Delivery Boy */}
                    <AssignDeliveryBoyModal
                        show={showAssignDeliveryModal}
                        onHide={() => setShowAssignDeliveryModal(false)}
                        order={selectedOrderForModal}
                        token={token}
                        onSuccess={() => fetchData()}
                    />

                    {/* MODAL: Custom Adjust Delay */}
                    <Modal show={adjustDelayModal} onHide={() => setAdjustDelayModal(false)} centered>
                        <Modal.Header closeButton>
                            <Modal.Title className="h5">
                                Adjust Driver Delay Request #{selectedDelayForAdjust?.DelayID}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <p className="small text-muted">
                                Rider requested <strong>+{selectedDelayForAdjust?.RequestedMinutes} mins</strong> for {selectedDelayForAdjust?.Reason}.
                            </p>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Approved Additional Buffer (Minutes)</Form.Label>
                                <Form.Select 
                                    value={customAdjustMinutes} 
                                    onChange={(e) => setCustomAdjustMinutes(parseInt(e.target.value, 10))}
                                >
                                    <option value={5}>+5 Minutes</option>
                                    <option value={10}>+10 Minutes</option>
                                    <option value={15}>+15 Minutes</option>
                                    <option value={20}>+20 Minutes</option>
                                    <option value={30}>+30 Minutes</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Ops Review Note</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="Reason for adjustment"
                                    value={adminReviewNote}
                                    onChange={(e) => setAdminReviewNote(e.target.value)}
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setAdjustDelayModal(false)}>Cancel</Button>
                            <Button 
                                variant="warning" 
                                onClick={() => {
                                    handleReviewDelay(selectedDelayForAdjust.DelayID, 'ADJUST', customAdjustMinutes, adminReviewNote);
                                    setAdjustDelayModal(false);
                                }}
                            >
                                Apply +{customAdjustMinutes}m Buffer
                            </Button>
                        </Modal.Footer>
                    </Modal>

                </div>
            </div>
        </div>
    );
}

export default LiveOperations;
