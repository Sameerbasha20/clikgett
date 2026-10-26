import React, { useState, useEffect } from "react";
import AssignDeliveryBoyModal from "./AssignDeliveryBoyModal";
import CancelOrderModal from "./CancelOrderModal";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "../../../App.css";
import { css } from "@emotion/react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import Moment from "react-moment";
import { useNavigate, useParams } from "react-router-dom";
import empty from "../../../Assets/empty.jpg";
import Carousel from "./carousel";
import { statusOptions, isFinal } from "../../../orderStatus";
import { FaDownload } from "react-icons/fa";
// import Addshipment from "./CreateShipment";
function Products() {
    const handleAdjustSubmit = (e) => {
        e.preventDefault();
        const payload = JSON.stringify({
            OrderID: id,
            newAmount: adjustForm.newAmount ? parseFloat(adjustForm.newAmount) : undefined,
            unavailableProductAmount: adjustForm.unavailableProductAmount ? parseFloat(adjustForm.unavailableProductAmount) : undefined,
            reason: adjustForm.reason,
            resolution: adjustForm.resolution,
            refundToWallet: adjustForm.resolution === 'Wallet Credit'
        });

        Services.adjustOrder("POST", payload, token)
            .then((res) => {
                if (res.Status === 1) {
                    toast.success("Order amount adjusted successfully");
                    setAdjustModal(false);
                    setAdjustForm({ newAmount: "", unavailableProductAmount: "", reason: "", resolution: "Wallet Credit" });
                    getorders();
                    getAdjustments();
                } else {
                    toast.error(res.Message || "Failed to adjust order");
                }
            })
            .catch((err) => toast.error("Error adjusting order"));
    };

    const Navigate = useNavigate();
    // eslint-disable-next-line
    const [shipmentForm, setShipmentForm] = useState(false);
    // const [editable, setEditable] = useState(false);
    const { id } = useParams();
    let [loading, setLoading] = useState(true);
    const [deliveryboys, setDeliveryboys] = useState([]);
    const [status, setStatus] = useState();
    const [orders, setOrders] = useState([]);
    const [adjustments, setAdjustments] = useState([]);
    const [etaMinutes, setEtaMinutes] = useState("");
    const [etaReason, setEtaReason] = useState("");
    const [etaAdjustments, setEtaAdjustments] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [printJobs, setPrintJobs] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [removeModal, setRemoveModal] = useState(false);
    const [selectedItemForRemoval, setSelectedItemForRemoval] = useState(null);
    const [removalForm, setRemovalForm] = useState({
        quantity: 1,
        reason: "Out of Stock",
        description: "",
        resolution: "Wallet Credit"
    });
    const [submittingRemoval, setSubmittingRemoval] = useState(false);

    const isOrderEditable = orders && ![1, 3, 4, 6].includes(parseInt(orders.OrderStatus));

    const handleOpenRemoveModal = (item) => {
        setSelectedItemForRemoval(item);
        setRemovalForm({
            quantity: 1,
            reason: "Out of Stock",
            description: "",
            resolution: orders?.PaymentMethod === "COD" ? "COD Adjustment" : "Wallet Credit"
        });
        setRemoveModal(true);
    };

    const handleRemoveItemSubmit = (e) => {
        e.preventDefault();
        if (!selectedItemForRemoval) return;

        if (!removalForm.reason || !removalForm.reason.trim()) {
            toast.error("Please select a valid removal reason");
            return;
        }
        if (!removalForm.description || !removalForm.description.trim()) {
            toast.error("Description is mandatory for item removal");
            return;
        }
        const qty = parseInt(removalForm.quantity);
        if (isNaN(qty) || qty < 1 || qty > selectedItemForRemoval.Quantity) {
            toast.error(`Removal quantity must be between 1 and ${selectedItemForRemoval.Quantity}`);
            return;
        }

        setSubmittingRemoval(true);
        const payload = JSON.stringify({
            OrderID: id,
            OrderItemID: selectedItemForRemoval.OrderItemID,
            quantity: qty,
            reason: removalForm.reason.trim(),
            description: removalForm.description.trim(),
            resolution: removalForm.resolution,
            refundToWallet: removalForm.resolution === "Wallet Credit"
        });

        Services.removeItemFromOrder("POST", payload, token)
            .then((res) => {
                setSubmittingRemoval(false);
                if (res.Status === 1) {
                    toast.success("Item removed and order recalculated successfully");
                    setRemoveModal(false);
                    setSelectedItemForRemoval(null);
                    getorders();
                    getAdjustments();
                    getTimeline();
                } else {
                    toast.error(res.Message || "Failed to remove item");
                }
            })
            .catch((err) => {
                setSubmittingRemoval(false);
                toast.error("Error processing item removal");
                console.error(err);
            });
    };

    const getTimeline = () => {
        if (!id) return;
        Services.getOrderTimeline("GET", null, token, id)
            .then((res) => {
                if (res.Status === 1) {
                    setTimeline(res.Timeline || []);
                }
            })
            .catch(console.error);
        Services.getOrderPrintJobs("GET", null, token, id)
            .then((res) => {
                if (res.Status === 1) setPrintJobs(res.PrintJobs || []);
            })
            .catch(console.error);
    };

    const handleQuickEtaAdjust = (mins) => {
        if (!id) return;
        Services.editDeliveryTime("PUT", JSON.stringify({
            adjustmentMinutes: mins,
            reason: `Admin increased delivery time by ${mins} mins`
        }), token, id)
        .then((res) => {
            if (res.Status === 1) {
                toast.success(`Delivery time increased by ${mins} minutes`);
                getorders();
            } else {
                toast.error(res.Message || "Failed to update delivery time");
            }
        })
        .catch(console.error);
    };

    const handleCustomEtaAdjust = (e) => {
        e.preventDefault();
        const mins = parseInt(etaMinutes);
        if (isNaN(mins) || mins === 0) {
            toast.error("Please enter a valid minutes adjustment");
            return;
        }
        Services.editDeliveryTime("PUT", JSON.stringify({
            adjustmentMinutes: mins,
            reason: etaReason || "Custom operational adjustment"
        }), token, id)
        .then((res) => {
            if (res.Status === 1) {
                toast.success(`Delivery time adjusted by ${mins} minutes`);
                setEtaMinutes("");
                setEtaReason("");
                getorders();
            } else {
                toast.error(res.Message || "Failed to update delivery time");
            }
        })
        .catch(console.error);
    };
    const [adjustModal, setAdjustModal] = useState(false);
    const [adjustForm, setAdjustForm] = useState({
        newAmount: "",
        unavailableProductAmount: "",
        reason: "",
        resolution: "Wallet Credit"
    });

    const getAdjustments = () => {
        if (!id) return;
        Services.getOrderAdjustments("GET", null, token, id)
            .then((res) => {
                if (res.Status === 1) {
                    setAdjustments(res.Adjustments || []);
                }
            })
            .catch(console.error);
    };
    const [deliveryboy, setDeliveryBoy] = useState("");
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const override = css`
        display: block;
        margin: 0 auto;
        border-color: red;
    `;
    const getorders = () => {
        Services.orderbyid("GET", null, token, id)
            .then((res) => {
                console.log(res);
                setLoading(false);
                if (res.Status === 1) {
                    setOrders(res.Orders);
                    setStatus(res?.Orders?.OrderStatus);
                    setDeliveryBoy(res?.Orders?.DeliveryBoyID);
                    // setOrdersSearch(res.Orders);
                } else if (res.Status === 0) {
                    toast.error(`${res.Message}`, {
                        position: "top-center",
                        autoClose: 1000,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    if (res.Message === "Token expired") {
                        Navigate("/");
                    }
                }
            })
            .catch((err) => {
                // alert(err);
                alert("something went wrong please try again");
                console.log(err);
            });
    };
    const getcategories = () => {
        Services.getDeliveryBoy("GET", null, token)
            .then((res) => {
                setLoading(false);
                console.log(res);
                if (res.Status === 1) {
                    setDeliveryboys(res.Deliveryboys);
                } else if (res.Status === 0) {
                    toast.error(`${res.Message}`, {
                        position: "top-center",
                        autoClose: 1000,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    if (res.Message === "Token expired") {
                        Navigate("/");
                    }
                }
            })
            .catch((err) => {
                // alert(err);
                alert("something went wrong please try again");
                console.log(err);
            });
    };

    useEffect(() => {
        getorders();
        getcategories();
        getAdjustments();
        getTimeline();
        // eslint-disable-next-line
    }, []);

    const dateformatter = (cell) => {
        const date = new Date(cell);

        return (
            <p>
                <Moment format="MMMM Do YYYY hh:mm a" utc>
                    {date}
                </Moment>
            </p>
        );
    };

    const orderstatusformatter = (cell, cellcontent) => {
        const date = new Date(orders.deliveredDateTime);
        //eslint-disable-next-line
        if (cell == 1) {
            return (
                <div
                    style={{
                        display: "grid",
                        alignItems: "center",
                        justifyItems: "center",
                        justifySelf: "right",
                        gap: "0.5rem",
                    }}>
                    <div
                        className={`${
                            dashboardclasses[`order-delivered-wrapper`]
                        } ${dashboardclasses[`order-status-wrapper`]}`}>
                        <p className={dashboardclasses["order-delivered"]}>
                            Delivered
                        </p>
                    </div>
                    <Moment format="MMMM Do YYYY hh:mm a">{date}</Moment>
                </div>
            );
        }
        //eslint-disable-next-line
        if (cell == 2) {
            return (
                <div
                    className={`${dashboardclasses[`order-pending-wrapper`]} ${
                        dashboardclasses[`order-status-wrapper`]
                    }`}>
                    <p>Pending</p>
                </div>
            );
        }
        //eslint-disable-next-line
        if (cell == 3) {
            return (
                <div
                    className={`${
                        dashboardclasses[`order-delivered-wrapper`]
                    } ${dashboardclasses[`order-status-wrapper`]}`}>
                    <p>Shipment Order Created</p>
                </div>
            );
        }
        //eslint-disable-next-line
        if (cell == 7 || cell == 5) {
            return (
                <div
                    className={`${dashboardclasses[`order-returned-wrapper`]} ${
                        dashboardclasses[`order-status-wrapper`]
                    }`}>
                    <p>Cancelled</p>
                </div>
            );
        }
        //eslint-disable-next-line
        if (cell == 6) {
            return (
                <div className={dashboardclasses[`cancel-wrapper`]}>
                    <p className={dashboardclasses["cancel"]}>Returned </p>
                </div>
            );
        }
    };
    const statuschangehandler = (e) => {
        setStatus(e.target.value);
    };
    const statusHandler = (e) => {
        if (parseInt(status) === 4) {
            setShowCancelModal(true);
            return;
        }
        setLoading(true);
        let body = {
            OrderStatus: status,
            UserID: orders?.UserID,
        };
        Services.UpdateOrderDetails("PUT", JSON.stringify(body), token, id)
            .then((res) => {
                if (res.Status === 1) {
                    getorders();
                    toast.success(`${res.Message}`, {
                        position: "top-center",
                        autoClose: 1000,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    // setOrdersSearch(res.Orders);
                } else if (res.Status === 0) {
                    setLoading(false);
                    toast.error(`${res.Message}`, {
                        position: "top-center",
                        autoClose: 1000,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    if (res.Message === "Token expired") {
                        Navigate("/");
                    }
                }
            })
            .catch((err) => {
                // alert(err);
                alert("something went wrong please try again");
                console.log(err);
            });
    };
    function toOrdinal(n) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    }
    const updateDeliveryBoy = (e) => {
        setLoading(true);
        let body = {
            UserID: orders?.UserID,
            DeliveryBoyID: deliveryboy,
        };
        Services.updateDeliveryboyOrder("PUT", JSON.stringify(body), token, id)
            .then((res) => {
                if (res.Status === 1) {
                    getorders();
                    toast.success(`${res.Message}`, {
                        position: "top-center",
                        autoClose: 1000,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    // setOrdersSearch(res.Orders);
                } else if (res.Status === 0) {
                    setLoading(false);
                    toast.error(`${res.Message}`, {
                        position: "top-center",
                        autoClose: 1000,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    if (res.Message === "Token expired") {
                        Navigate("/");
                    }
                }
            })
            .catch((err) => {
                // alert(err);
                alert("something went wrong please try again");
                console.log(err);
            });
    };
    // const addshipmentHandler = () => {
    //     setShipmentForm((prev) => !prev);
    // };

    return (
        <>
            {/* {shipmentForm && (
                <Addshipment
                    setmodal={setShipmentForm}
                    editable={editable}
                    setEditable={setEditable}
                    id={id}
                    getorders={getorders}
                />
            )} */}
            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="orders" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />
                    <div className={dashboardclasses.CategoryWrapper}>
                        {loading ? (
                            <div className={dashboardclasses["loader"]}>
                                <ScaleLoader
                                    color={"black"}
                                    loading={true}
                                    css={override}
                                    size={150}
                                />
                            </div>
                        ) : (
                            <>
                                <button
                                    className={dashboardclasses["back"]}
                                    onClick={() => Navigate(-1)}>
                                    Back
                                </button>
                                <header
                                    className={
                                        dashboardclasses["order-details-header"]
                                    }>
                                    <h3>Order Details</h3>
                                    <div
                                        className={
                                            dashboardclasses[
                                                "order-header-item"
                                            ]
                                        }>
                                        <h5>ORDER ID</h5>

                                        <p>#{orders.OrderID}</p>
                                    </div>
                                    <div
                                        className={
                                            dashboardclasses[
                                                "order-header-item"
                                            ]
                                        }>
                                        <h5>ORDER DATE TIME</h5>

                                        {dateformatter(orders.CreatedAt)}
                                    </div>
                                    {orders.ScheduleStatus === "Scheduled" && orders.ScheduledDateTime && (
                                        <div
                                            className={
                                                dashboardclasses[
                                                    "order-header-item"
                                                ]
                                            }>
                                            <h5>SCHEDULED FOR</h5>
                                            <p style={{ color: "#5b21b6", fontWeight: 700 }}>
                                                📅 {new Date(orders.ScheduledDateTime).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
                                            </p>
                                        </div>
                                    )}
                                </header>
                                {(orders.OrderStatus == 4 || orders.OrderStatus == 3) && (
                                    <div className="alert alert-danger mx-3 my-2 p-3 shadow-sm" style={{ borderRadius: "8px", borderLeft: "5px solid #dc2626" }}>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 className="fw-bold mb-1 text-danger">
                                                    ⚠️ Order Cancelled {orders.OrderStatus == 3 ? "(By Store)" : "(By Customer)"}
                                                </h6>
                                                <div className="small text-dark mt-1">
                                                    <strong>Cancellation Reason:</strong> {orders.CancellationReason || "Admin Cancelled the order"}
                                                </div>
                                                {orders.Delivered_Cancelled_datetime && (
                                                    <div className="small text-muted mt-1">
                                                        <strong>Recorded At:</strong> {dateformatter(orders.Delivered_Cancelled_datetime)}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="badge bg-danger fs-6 px-3 py-2">CANCELLED</span>
                                        </div>
                                    </div>
                                )}
                                <div
                                    className={
                                        dashboardclasses[
                                            "orders-form-invoice-wrapper"
                                        ]
                                    }>
                                    <div
                                        className={
                                            dashboardclasses[
                                                "orders-form-invoice"
                                            ]
                                        }>
                                        <div
                                            className={
                                                dashboardclasses[
                                                    "invoice-detail"
                                                ]
                                            }>
                                            <div
                                                className={
                                                    dashboardclasses[
                                                        "detail-status"
                                                    ]
                                                }
                                                style={{ flexWrap: "wrap" }}>
                                                <span>status:</span>
                                                <select
                                                    defaultValue={
                                                        orders.OrderStatus
                                                    }
                                                    onChange={
                                                        statuschangehandler
                                                    }
                                                    disabled={isFinal(orders.OrderStatus)}
                                                    value={status}>
                                                    {statusOptions(orders.OrderStatus).map((o) => (
                                                        <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
                                                    ))}
                                                </select>
                                                <button onClick={statusHandler}>
                                                    Update
                                                </button>
                                                {orders.OrderStatus != 1 && orders.OrderStatus != 4 && orders.OrderStatus != 3 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCancelModal(true)}
                                                        style={{
                                                            marginLeft: "8px",
                                                            background: "#ef4444",
                                                            color: "#ffffff",
                                                            border: "none",
                                                            borderRadius: "4px",
                                                            padding: "6px 12px",
                                                            fontWeight: "600",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        Cancel Order
                                                    </button>
                                                )}
                                            </div>
                                            {orderstatusformatter(
                                                orders.orderStatus
                                            )}
                                            <div>
                                                <div
                                                    className={
                                                        dashboardclasses[
                                                            "detail-status"
                                                        ]
                                                    }
                                                    style={{
                                                        flexWrap: "wrap",
                                                    }}>
                                                    {(!orders.DeliveryBoyID || orders.DeliveryBoyID == 0 || orders.OrderStatus == 8) ? (
    <div className="d-flex align-items-center gap-2">
        <span className="badge px-2 py-1" style={{ background: "#e2e8f0", color: "#334155", fontWeight: 700, letterSpacing: "0.03em" }}>No rider yet</span>
        <button
            type="button"
            className="btn btn-sm btn-primary fw-bold px-3 shadow-sm"
            disabled={[1, 3, 4, 6].includes(Number(orders.OrderStatus))}
            onClick={() => setShowAssignModal(true)}
        >
            Assign Delivery Boy
        </button>
    </div>
) : (
    <div className="d-flex align-items-center gap-2">
        <span className="badge bg-success-subtle text-success px-2 py-1 fw-bold border">
            {orders.DriverName || (deliveryboys.find(b => b.AdminID == orders.DeliveryBoyID)?.FirstName ? `${deliveryboys.find(b => b.AdminID == orders.DeliveryBoyID)?.FirstName} ${deliveryboys.find(b => b.AdminID == orders.DeliveryBoyID)?.LastName != 'NA' ? deliveryboys.find(b => b.AdminID == orders.DeliveryBoyID)?.LastName : ''}`.trim() : `Driver #${orders.DeliveryBoyID}`)}
        </span>
        <button
            type="button"
            className="btn btn-sm btn-outline-warning fw-bold px-3"
            disabled={[1, 3, 4, 6].includes(Number(orders.OrderStatus))}
            onClick={() => setShowAssignModal(true)}
        >
            Reassign Delivery Boy
        </button>
    </div>
)}
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className={
                                                dashboardclasses["order-items"]
                                            }>
                                            <header
                                                className={
                                                    dashboardclasses[
                                                        "customer-info-header"
                                                    ]
                                                }>
                                                <h4>Customer Info</h4>
                                                {/* eslint-disable-next-line */}
                                                {/* {orders.isShipmentCreated ==
                                                    0 && (
                                                    <button
                                                        className={
                                                            dashboardclasses[
                                                                "add-shipment"
                                                            ]
                                                        }
                                                        onClick={
                                                            addshipmentHandler
                                                        }>
                                                        +Add Shipment Order
                                                    </button>
                                                )} */}
                                            </header>

                                            <div>
                                                <div
                                                    className={
                                                        dashboardclasses[
                                                            "order-item-data"
                                                        ]
                                                    }>
                                                    <div
                                                        className={
                                                            dashboardclasses[
                                                                "order-date"
                                                            ]
                                                        }>
                                                        <h5>Name</h5>
                                                        <h4>:</h4>
                                                        <p>{orders.UserName}</p>
                                                    </div>

                                                    <div
                                                        className={
                                                            dashboardclasses[
                                                                "order-date"
                                                            ]
                                                        }>
                                                        <h5>Contact Number</h5>
                                                        <h4>:</h4>
                                                        <p>
                                                            {
                                                                orders.MobileNumber
                                                            }
                                                        </p>
                                                    </div>
                                                    <div
                                                        className={
                                                            dashboardclasses[
                                                                "order-date"
                                                            ]
                                                        }>
                                                        <h5>Email Id</h5>
                                                        <h4>:</h4>
                                                        <p> {orders.EmailID}</p>
                                                    </div>

                                                    <div
                                                        className={
                                                            dashboardclasses[
                                                                "order-date"
                                                            ]
                                                        }>
                                                        <h5>Order Count</h5>
                                                        <h4>:</h4>
                                                        <p
                                                            style={{
                                                                color: "green",
                                                                fontWeight:
                                                                    "bold",
                                                                fontSize:
                                                                    "1rem",
                                                            }}>
                                                            {" "}
                                                            {typeof orders.orderCount ==
                                                            "number" ? (
                                                                <span>
                                                                    {
                                                                        orders.orderCount
                                                                    }
                                                                    <sup>
                                                                        {toOrdinal(
                                                                            orders.orderCount
                                                                        )}
                                                                    </sup>
                                                                </span>
                                                            ) : (
                                                                "NA"
                                                            )}
                                                        </p>
                                                    </div>
                                                    {(orders.OrderStatus == 4 || orders.OrderStatus == 3) && (
                                                        <div
                                                            className={
                                                                dashboardclasses[
                                                                    "order-date"
                                                                ]
                                                            }>
                                                            <h5>
                                                                Cancellation
                                                                Reason
                                                            </h5>
                                                            <h4>:</h4>
                                                            <p>
                                                                {" "}
                                                                {
                                                                    orders.CancellationReason
                                                                }
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div
                                                className={
                                                    dashboardclasses[
                                                        "order-products"
                                                    ]
                                                }>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
                                                    <h4 style={{ margin: 0 }}>Ordered items</h4>
                                                    {isOrderEditable ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsEditMode(!isEditMode)}
                                                            style={{
                                                                background: isEditMode ? "#dc2626" : "#2563eb",
                                                                color: "#fff",
                                                                border: "none",
                                                                padding: "6px 14px",
                                                                borderRadius: "6px",
                                                                fontWeight: "600",
                                                                fontSize: "0.85rem",
                                                                cursor: "pointer",
                                                                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                                                            }}
                                                        >
                                                            {isEditMode ? "Exit Edit Order" : "✎ Edit Order"}
                                                        </button>
                                                    ) : (
                                                        <span style={{
                                                            fontSize: "0.8rem",
                                                            color: "#dc2626",
                                                            background: "#fee2e2",
                                                            padding: "4px 10px",
                                                            borderRadius: "6px",
                                                            fontWeight: "600",
                                                            border: "1px solid #fecaca"
                                                        }}>
                                                            🔒 This order can no longer be modified.
                                                        </span>
                                                    )}
                                                </div>
                                                {Array.isArray(orders?.OrderItems) && orders.OrderItems.length > 0 ? (
                                                    orders.OrderItems.map(
                                                        (item) => {
                                                        return (
                                                            <div
                                                                key={item.OrderItemID || item.ProductID}
                                                                className={
                                                                    dashboardclasses[
                                                                        "items-data"
                                                                    ]
                                                                }>
                                                                {/*  <img
                                                                    src={
                                                                        item.ImageUrl ===
                                                                        "NA"
                                                                            ? empty
                                                                            : item.ImageUrl
                                                                    }
                                                                    alt="product"
                                                                /> */}
                                                                <Carousel
                                                                    images={
                                                                        item?.ProductImages
                                                                    }
                                                                />

                                                                <div
                                                                    className={
                                                                        dashboardclasses[
                                                                            "items-data-desc"
                                                                        ]
                                                                    }>
                                                                    <h2>
                                                                        {
                                                                            item.ProductName
                                                                        }
                                                                    </h2>
                                                                    <p
                                                                        className={
                                                                            dashboardclasses[
                                                                                "Ordered-items-price"
                                                                            ]
                                                                        }>
                                                                        Price :
                                                                        ₹
                                                                        {
                                                                            item.Price
                                                                        }
                                                                    </p>
                                                                    <p
                                                                        className={
                                                                            dashboardclasses[
                                                                                "Ordered-items-price"
                                                                            ]
                                                                        }>
                                                                        Offer
                                                                        Price :
                                                                        ₹
                                                                        {
                                                                            item.OfferPrice
                                                                        }
                                                                    </p>
                                                                    <p>
                                                                        {
                                                                            item.metricvalue
                                                                        }{" "}
                                                                        {
                                                                            item.metrictype
                                                                        }{" "}
                                                                        x{"   "}
                                                                        {
                                                                            item.Quantity
                                                                        }
                                                                    </p>
                                                                    {isEditMode && isOrderEditable && (
                                                                        <div style={{ marginTop: "10px" }}>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleOpenRemoveModal(item)}
                                                                                style={{
                                                                                    background: "#fee2e2",
                                                                                    color: "#b91c1c",
                                                                                    border: "1px solid #f87171",
                                                                                    borderRadius: "6px",
                                                                                    padding: "6px 12px",
                                                                                    fontWeight: "600",
                                                                                    fontSize: "0.8rem",
                                                                                    cursor: "pointer",
                                                                                    display: "inline-flex",
                                                                                    alignItems: "center",
                                                                                    gap: "6px"
                                                                                }}
                                                                            >
                                                                                🗑 Remove Item
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                )) : (
                                                    <div style={{ padding: "16px 8px", color: "#6b7280", fontStyle: "italic" }}>
                                                        No ordered items recorded for this order.
                                                    </div>
                                                )}

                                                {/* Print store files */}
                                                {printJobs.length > 0 && (
                                                    <div style={{ width: "100%", marginTop: "1.5rem", background: "#f0fdf4", padding: "1.25rem", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                                                        <div style={{ fontWeight: 700, color: "#166534", marginBottom: "0.75rem" }}>
                                                            🖨️ Print files ({printJobs.length}) · print before packing
                                                        </div>
                                                        {printJobs.map((job) => (
                                                            <div key={job.PrintJobID} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "10px 0", borderTop: "1px solid #dcfce7" }}>
                                                                <div>
                                                                    <div style={{ fontWeight: 600 }}>{job.FileName}</div>
                                                                    <div style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                                                                        {job.Pages} page{job.Pages === 1 ? "" : "s"} × {job.Copies} cop{job.Copies === 1 ? "y" : "ies"} ·{" "}
                                                                        <strong>{job.ColorMode === "COLOR" ? "Colour" : "Black & white"}</strong> ·{" "}
                                                                        {job.Orientation === "LANDSCAPE" ? "Landscape" : "Portrait"} · ₹{job.LineTotal}
                                                                    </div>
                                                                </div>
                                                                <a className="btn btn-sm btn-success" href={job.FileUrl} target="_blank" rel="noreferrer">
                                                                    <FaDownload /> Open file
                                                                </a>
                                                            </div>
                                                        ))}
                                                        <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "6px" }}>Links expire after an hour; reload the page for fresh ones.</div>
                                                    </div>
                                                )}

                                                {/* Removed Items Audit Section */}
                                                {orders?.RemovedItems && orders.RemovedItems.length > 0 && (
                                                    <div style={{ width: "100%", marginTop: "1.5rem", background: "#fef2f2", padding: "1.25rem", borderRadius: "8px", border: "1px solid #fecaca" }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                                                            <h5 style={{ fontWeight: "700", margin: 0, color: "#991b1b" }}>📋 Removed Items Audit Trail</h5>
                                                            <span style={{ fontSize: "0.75rem", background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: "4px", fontWeight: "700" }}>
                                                                {orders.RemovedItems.length} {orders.RemovedItems.length === 1 ? "Removal" : "Removals"}
                                                            </span>
                                                        </div>
                                                        <div style={{ overflowX: "auto" }}>
                                                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                                                                <thead>
                                                                    <tr style={{ background: "#fee2e2", borderBottom: "1px solid #fca5a5", color: "#7f1d1d" }}>
                                                                        <th style={{ padding: "8px 10px" }}>Product</th>
                                                                        <th style={{ padding: "8px 10px" }}>Qty</th>
                                                                        <th style={{ padding: "8px 10px" }}>Reason</th>
                                                                        <th style={{ padding: "8px 10px" }}>Description</th>
                                                                        <th style={{ padding: "8px 10px" }}>Refund Amount</th>
                                                                        <th style={{ padding: "8px 10px" }}>Refund Status</th>
                                                                        <th style={{ padding: "8px 10px" }}>Removed By</th>
                                                                        <th style={{ padding: "8px 10px" }}>Timestamp</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {orders.RemovedItems.map((rem, idx) => (
                                                                        <tr key={rem.RemovalID || idx} style={{ borderBottom: "1px solid #fee2e2", background: idx % 2 === 0 ? "#ffffff" : "#fff5f5" }}>
                                                                            <td style={{ padding: "8px 10px", fontWeight: "600", color: "#1f2937" }}>{rem.ProductName}</td>
                                                                            <td style={{ padding: "8px 10px", fontWeight: "700", color: "#b91c1c" }}>-{rem.Quantity}</td>
                                                                            <td style={{ padding: "8px 10px" }}>
                                                                                <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600" }}>
                                                                                    {rem.Reason}
                                                                                </span>
                                                                            </td>
                                                                            <td style={{ padding: "8px 10px", color: "#4b5563", maxWidth: "200px" }}>{rem.Description}</td>
                                                                            <td style={{ padding: "8px 10px", fontWeight: "600" }}>₹{parseFloat(rem.RefundAmount || 0).toFixed(2)}</td>
                                                                            <td style={{ padding: "8px 10px" }}>
                                                                                <span style={{
                                                                                    background: rem.RefundStatus === "WALLET_REFUNDED" ? "#dcfce7" : rem.RefundStatus === "COD_ADJUSTED" ? "#e0e7ff" : "#fef9c3",
                                                                                    color: rem.RefundStatus === "WALLET_REFUNDED" ? "#166534" : rem.RefundStatus === "COD_ADJUSTED" ? "#3730a3" : "#854d0e",
                                                                                    padding: "2px 6px",
                                                                                    borderRadius: "4px",
                                                                                    fontSize: "0.75rem",
                                                                                    fontWeight: "600"
                                                                                }}>
                                                                                    {rem.RefundStatus}
                                                                                </span>
                                                                            </td>
                                                                            <td style={{ padding: "8px 10px", color: "#4b5563" }}>
                                                                                {rem.AdminFirstName ? `${rem.AdminFirstName} ${rem.AdminLastName || ""}`.trim() : (rem.AdminID ? `Admin #${rem.AdminID}` : "System")}
                                                                            </td>
                                                                            <td style={{ padding: "8px 10px", color: "#6b7280", fontSize: "0.75rem" }}>
                                                                                {new Date(rem.CreatedAt).toLocaleString()}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                className={
                                                    dashboardclasses[
                                                        "order-item-data"
                                                    ]
                                                }>
                                                <h4>Shipping Details </h4>
                                                <div
                                                    className={
                                                        dashboardclasses[
                                                            "order-date"
                                                        ]
                                                    }>
                                                    <h5>
                                                        Delivery Boy Travelled
                                                        Distance
                                                    </h5>
                                                    <h4>:</h4>
                                                    <p>{orders.Distance} Km</p>
                                                </div>
                                                <div
                                                    className={
                                                        dashboardclasses[
                                                            "order-date"
                                                        ]
                                                    }>
                                                    <h5>Address</h5>
                                                    <h4>:</h4>
                                                    <p>
                                                        {orders?.FlatNo},{" "}
                                                        {orders?.LandMark}{" "}
                                                        {orders.Address}
                                                    </p>
                                                </div>

                                                {/* <div
                                                    className={
                                                        dashboardclasses[
                                                            "order-date"
                                                        ]
                                                    }>
                                                    <h5>Delivery Boy Name</h5>
                                                    <h4>:</h4>
                                                    <p>
                                                        {orders.DeliveryBoyName}
                                                    </p>
                                                </div> */}
                                                {orders.OrderStatus == 1 && (
                                                    <div
                                                        className={
                                                            dashboardclasses[
                                                                "order-date"
                                                            ]
                                                        }>
                                                        <h5>
                                                            Delivered Date Time
                                                        </h5>
                                                        <h4>:</h4>
                                                        <p>
                                                            {dateformatter(
                                                                orders.deliveredDateTime
                                                            )}
                                                        </p>
                                                    </div>
                                                )}
                                                <div
                                                    className={
                                                        dashboardclasses[
                                                            "order-date"
                                                        ]
                                                    }>
                                                    <h5>Landmark</h5>
                                                    <h4>:</h4>
                                                    <p>{orders.LandMark}</p>
                                                </div>
                                                <div
                                                    className={
                                                        dashboardclasses[
                                                            "order-date"
                                                        ]
                                                    }>
                                                    <h5>Contact Number</h5>
                                                    <h4>:</h4>
                                                    <p>{orders.MobileNumber}</p>
                                                </div>
                                                <div
                                                    className={
                                                        dashboardclasses[
                                                            "order-date"
                                                        ]
                                                    }>
                                                    <h5>Email Id</h5>
                                                    <h4>:</h4>
                                                    <p> {orders.EmailID}</p>
                                                </div>
                                                {orders.OrderStatus == 1 && (
                                                    <div
                                                        className={
                                                            dashboardclasses[
                                                                "order-date"
                                                            ]
                                                        }>
                                                        <h5>Invoice / Receipt</h5>
                                                        <h4>:</h4>
                                                        <a
                                                            href={`${process.env.REACT_APP_BASE_URL || '/api'}/adminorders/invoice/${orders.OrderID}?token=${encodeURIComponent(sessionStorage.getItem("token") || "")}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                color: '#7C3AED',
                                                                fontWeight: '600',
                                                                textDecoration: 'none',
                                                                background: 'rgba(124, 58, 237, 0.08)',
                                                                padding: '4px 10px',
                                                                borderRadius: '6px',
                                                                border: '1px solid rgba(124, 58, 237, 0.25)'
                                                            }}>
                                                            <FaDownload size={12} /> Download Receipt
                                                        </a>
                                                    </div>
                                                )}
                                                {/* <div
                                                    className={
                                                        dashboardclasses[
                                                            "order-date"
                                                        ]
                                                    }>
                                                    <h5>AWB Number</h5>
                                                    <h4>:</h4>
                                                    <p> {orders.AWBNumber}</p>
                                                </div> */}

                                                {/* {orders.isShipmentCreated ===
                                                    1 && (
                                                    <>
                                                        <div
                                                            className={
                                                                dashboardclasses[
                                                                    "order-date"
                                                                ]
                                                            }>
                                                            <h5>
                                                                Shiprocket Order
                                                                Id
                                                            </h5>
                                                            <h4>:</h4>
                                                            <p>
                                                                {" "}
                                                                {
                                                                    orders.ShiprocketOrderID
                                                                }
                                                            </p>
                                                        </div>
                                                        <div
                                                            className={
                                                                dashboardclasses[
                                                                    "order-date"
                                                                ]
                                                            }>
                                                            <h5>
                                                                Tracking URL
                                                            </h5>
                                                            <h4>:</h4>
                                                            {orders.trackingUrl !==
                                                            "NA" ? (
                                                                <a
                                                                    href={
                                                                        orders.trackingUrl
                                                                    }
                                                                    target="_blank"
                                                                    rel="noreferrer">
                                                                    {
                                                                        orders.trackingUrl
                                                                    }
                                                                </a>
                                                            ) : (
                                                                <p>-</p>
                                                            )}
                                                        </div>
                                                    </>
                                                )} */}
                                            </div>
                                            <div
                                                className={
                                                    dashboardclasses[
                                                        "order-item-data"
                                                    ]
                                                }>
                                                <h4> Payment Details </h4>
                                                <div
                                                    className={
                                                        dashboardclasses[
                                                            "order-date"
                                                        ]
                                                    }>
                                                    <h5>Payment Mode</h5>
                                                    <h4>:</h4>
                                                    {orders.PaymentMethod ===
                                                    "COD" ? (
                                                        <p> COD</p>
                                                    ) : (
                                                        <p>ONLINE</p>
                                                    )}
                                                </div>
                                                {orders.PaymentMethod ===
                                                    "Online" && (
                                                    <div
                                                        className={
                                                            dashboardclasses[
                                                                "order-date"
                                                            ]
                                                        }>
                                                        <h5>PaymentID</h5>
                                                        <h4>:</h4>
                                                        <p>
                                                            {
                                                                orders.PaymentTransactionID
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                                <div
                                                    className={
                                                        dashboardclasses[
                                                            "order-date"
                                                        ]
                                                    }>
                                                    <h5>SubTotal</h5>
                                                    <h4>:</h4>
                                                    <p> ₹ {orders.SubTotal}</p>
                                                </div>
                                                <div
                                                    className={
                                                        dashboardclasses[
                                                            "order-date"
                                                        ]
                                                    }>
                                                    <h5>Wallet</h5>
                                                    <h4>:</h4>
                                                    <p>
                                                        {" "}
                                                        ₹ {orders.WalletDebit}
                                                    </p>
                                                </div>
                                                <div
                                                    className={
                                                        dashboardclasses[
                                                            "order-date"
                                                        ]
                                                    }>
                                                    <h5>Tax Amount</h5>
                                                    <h4>:</h4>
                                                    <p>₹{orders.TaxAmount}</p>
                                                </div>
                                                <div
                                                    className={
                                                        dashboardclasses[
                                                            "order-date"
                                                        ]
                                                    }>
                                                    <h5>Discount Amount</h5>
                                                    <h4>:</h4>
                                                    <p>₹ {orders.Discount}</p>
                                                </div>

                                                <div
                                                    className={
                                                        dashboardclasses[
                                                            "order-date"
                                                        ]
                                                    }>
                                                    <h5>Coupon Code</h5>
                                                    <h4>:</h4>
                                                    <p> {orders.PromoCode}</p>
                                                </div>

                                                <div
                                                    className={
                                                        dashboardclasses[
                                                            "order-date"
                                                        ]
                                                    }>
                                                    <h5>Delivery Charges</h5>
                                                    <h4>:</h4>
                                                    <p>
                                                        {" "}
                                                        ₹{" "}
                                                        {orders.DeliverCharges}
                                                    </p>
                                                </div>
                                                <div
                                                    className={
                                                        dashboardclasses[
                                                            "order-date"
                                                        ]
                                                    }>
                                                    <h5>Tip</h5>
                                                    <h4>:</h4>
                                                    <p> ₹ {orders.TipAmount}</p>
                                                </div>

                                                <div
                                                    className={
                                                        dashboardclasses[
                                                            "order-date"
                                                        ]
                                                    }>
                                                    <h5>Grand Total</h5>
                                                    <h4>:</h4>

                                                    <p>₹ {orders.GrandTotal}</p>
                                                </div>

                                                <div style={{ marginTop: "1rem", textAlign: "right" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAdjustForm({
                                                                newAmount: orders.GrandTotal || "",
                                                                unavailableProductAmount: "",
                                                                reason: "",
                                                                resolution: "Wallet Credit"
                                                            });
                                                            setAdjustModal(true);
                                                        }}
                                                        style={{
                                                            background: "#f59e0b",
                                                            color: "#fff",
                                                            border: "none",
                                                            padding: "8px 16px",
                                                            borderRadius: "6px",
                                                            fontWeight: "600",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        Adjust Order Amount
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Delivery Time Adjustments Section */}
                                            <div style={{ width: "100%", marginTop: "1.5rem", background: "#f0fdf4", padding: "1.25rem", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                                                    <div>
                                                        <h5 style={{ fontWeight: "700", margin: 0, color: "#166534" }}>⏱ Delivery Time / ETA Management</h5>
                                                        <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#15803d" }}>
                                                            Current Expected Delivery: <strong>{orders.EstimateDateTime ? new Date(orders.EstimateDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Standard (~30 mins)"}</strong>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Dynamic ETA Breakdown Grid */}
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", background: "#ffffff", padding: "12px", borderRadius: "6px", border: "1px solid #dcfce7", marginTop: "12px" }}>
                                                    <div style={{ textAlign: "center", borderRight: "1px solid #f1f5f9" }}>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Total Items</div>
                                                        <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b" }}>{orders.TotalItemQuantity || (Array.isArray(orders.OrderItems) ? orders.OrderItems.reduce((s, i) => s + (parseInt(i.Quantity) || 1), 0) : 0)}</div>
                                                    </div>
                                                    <div style={{ textAlign: "center", borderRight: "1px solid #f1f5f9" }}>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Base Delivery</div>
                                                        <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#2563eb" }}>30 min</div>
                                                    </div>
                                                    <div style={{ textAlign: "center", borderRight: "1px solid #f1f5f9" }}>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Order Size Buffer</div>
                                                        <div style={{ fontSize: "1.1rem", fontWeight: "700", color: (orders.OrderSizeBufferMinutes > 0 ? "#ea580c" : "#16a34a") }}>
                                                            +{orders.OrderSizeBufferMinutes || 0} min
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: "center", borderRight: "1px solid #f1f5f9" }}>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Operational Delay</div>
                                                        <div style={{ fontSize: "1.1rem", fontWeight: "700", color: (orders.TotalDelayMinutes > 0 ? "#dc2626" : "#64748b") }}>
                                                            +{orders.TotalDelayMinutes || 0} min
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: "center" }}>
                                                        <div style={{ fontSize: "0.75rem", color: "#166534", textTransform: "uppercase", fontWeight: "700" }}>Final Authoritative ETA</div>
                                                        <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#166534" }}>
                                                            {orders.FinalETAMinutes ? `${orders.FinalETAMinutes} min` : `${30 + (orders.OrderSizeBufferMinutes || 0) + (orders.TotalDelayMinutes || 0)} min`}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                                                        <span style={{ fontSize: "0.85rem", color: "#166534", fontWeight: "600" }}>Quick Add:</span>
                                                        <button type="button" onClick={() => handleQuickEtaAdjust(5)} className="btn btn-sm btn-outline-success font-weight-bold">+5 Mins</button>
                                                        <button type="button" onClick={() => handleQuickEtaAdjust(10)} className="btn btn-sm btn-outline-success font-weight-bold">+10 Mins</button>
                                                        <button type="button" onClick={() => handleQuickEtaAdjust(15)} className="btn btn-sm btn-outline-success font-weight-bold">+15 Mins</button>
                                                        <form onSubmit={handleCustomEtaAdjust} style={{ display: "inline-flex", gap: "6px", marginLeft: "8px" }}>
                                                            <input
                                                                type="number"
                                                                placeholder="Mins"
                                                                value={etaMinutes}
                                                                onChange={(e) => setEtaMinutes(e.target.value)}
                                                                style={{ width: "70px", padding: "4px 8px", borderRadius: "4px", border: "1px solid #86efac", fontSize: "0.85rem" }}
                                                            />
                                                            <button type="submit" className="btn btn-sm btn-success">Adjust</button>
                                                        </form>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Delivery Stage Timestamps & Live Timeline */}
                                            <div style={{ width: "100%", marginTop: "1.5rem", background: "#fff", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                                                <h5 style={{ fontWeight: "700", marginBottom: "1rem", color: "#1f2937" }}>🚚 Delivery Stage Timestamps & Tracking</h5>
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "1rem" }}>
                                                    <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "6px", borderLeft: "4px solid #3b82f6" }}>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Order Placed</div>
                                                        <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "0.9rem" }}>
                                                            {orders.CreatedAt ? new Date(orders.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "-"}
                                                        </div>
                                                        <small style={{ color: "#94a3b8" }}>{orders.CreatedAt ? new Date(orders.CreatedAt).toLocaleDateString() : ""}</small>
                                                    </div>
                                                    <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "6px", borderLeft: "4px solid #10b981" }}>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Order Accepted</div>
                                                        <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "0.9rem" }}>
                                                            {orders.Accepted_Time ? new Date(orders.Accepted_Time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (orders.OrderStatus >= 2 ? "Accepted" : "Pending")}
                                                        </div>
                                                    </div>
                                                    <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "6px", borderLeft: "4px solid #f59e0b" }}>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Rider Assigned</div>
                                                        <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "0.9rem" }}>
                                                            {orders.Assigned_time ? new Date(orders.Assigned_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (orders.DeliveryBoyID ? "Assigned" : "Unassigned")}
                                                        </div>
                                                    </div>
                                                    <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "6px", borderLeft: "4px solid #059669" }}>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Final Delivery / Status</div>
                                                        <div style={{ fontWeight: "700", color: orders.OrderStatus === 1 ? "#059669" : orders.OrderStatus === 4 ? "#dc2626" : "#1e293b", fontSize: "0.9rem" }}>
                                                            {orders.Delivered_Cancelled_datetime ? new Date(orders.Delivered_Cancelled_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (orders.OrderStatus === 1 ? "Delivered" : "In Progress")}
                                                        </div>
                                                    </div>
                                                </div>

                                                {timeline && timeline.length > 0 && (
                                                    <div style={{ marginTop: "1rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
                                                        <h6 style={{ fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Audit Timeline Events:</h6>
                                                        <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                                                            {timeline.map((evt, idx) => (
                                                                <li key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", padding: "4px 0", color: "#334155" }}>
                                                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6", display: "inline-block" }}></span>
                                                                    <strong style={{ minWidth: "90px" }}>{new Date(evt.CreatedAt).toLocaleTimeString()}</strong>
                                                                    <span>{evt.Notes || `Status changed to ${evt.OrderStatus}`}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Adjustment History Section */}
                                            {adjustments && adjustments.length > 0 && (
                                                <div style={{ width: "100%", marginTop: "2rem", background: "#fff", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                                                    <h4 style={{ fontWeight: "700", marginBottom: "1rem", color: "#1f2937" }}>Order Amount Adjustment History</h4>
                                                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                                        <thead>
                                                            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: "0.85rem", color: "#4b5563" }}>
                                                                <th style={{ padding: "10px" }}>ID</th>
                                                                <th style={{ padding: "10px" }}>Previous Amount</th>
                                                                <th style={{ padding: "10px" }}>New Amount</th>
                                                                <th style={{ padding: "10px" }}>Difference</th>
                                                                <th style={{ padding: "10px" }}>Type</th>
                                                                <th style={{ padding: "10px" }}>Reason</th>
                                                                <th style={{ padding: "10px" }}>Admin</th>
                                                                <th style={{ padding: "10px" }}>Date</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {adjustments.map((adj) => (
                                                                <tr key={adj.AdjustmentID} style={{ borderBottom: "1px solid #f3f4f6", fontSize: "0.875rem" }}>
                                                                    <td style={{ padding: "10px", fontWeight: "600" }}>#{adj.AdjustmentID}</td>
                                                                    <td style={{ padding: "10px" }}>₹{parseFloat(adj.PreviousAmount).toFixed(2)}</td>
                                                                    <td style={{ padding: "10px", fontWeight: "700", color: "#059669" }}>₹{parseFloat(adj.NewAmount).toFixed(2)}</td>
                                                                    <td style={{ padding: "10px", color: adj.DifferenceAmount < 0 ? "#dc2626" : "#059669", fontWeight: "600" }}>
                                                                        {adj.DifferenceAmount < 0 ? "-" : "+"}₹{Math.abs(parseFloat(adj.DifferenceAmount)).toFixed(2)}
                                                                    </td>
                                                                    <td style={{ padding: "10px" }}>
                                                                        <span style={{
                                                                            background: adj.AdjustmentType === 'deduction' ? '#fee2e2' : '#e0e7ff',
                                                                            color: adj.AdjustmentType === 'deduction' ? '#991b1b' : '#3730a3',
                                                                            padding: '2px 8px',
                                                                            borderRadius: '4px',
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: '600'
                                                                        }}>
                                                                            {adj.AdjustmentType}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ padding: "10px" }}>{adj.Reason}</td>
                                                                    <td style={{ padding: "10px" }}>{adj.AdminFirstName || "Admin"}</td>
                                                                    <td style={{ padding: "10px", fontSize: "0.8rem", color: "#6b7280" }}>
                                                                        {new Date(adj.CreatedAt).toLocaleString()}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            {/* Adjust Modal */}
                                            {adjustModal && (
                                                <div style={{
                                                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                                                    background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999
                                                }}>
                                                    <div style={{ background: "#fff", padding: "2rem", borderRadius: "12px", width: "450px", maxWidth: "90%" }}>
                                                        <h3 style={{ marginBottom: "1rem", fontWeight: "700" }}>Adjust Order #{orders.OrderID}</h3>
                                                        <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1rem" }}>
                                                            Current Grand Total: <strong>₹{parseFloat(orders.GrandTotal || 0).toFixed(2)}</strong>
                                                        </p>
                                                        <form onSubmit={handleAdjustSubmit}>
                                                            <div style={{ marginBottom: "1rem" }}>
                                                                <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem" }}>New Grand Total (₹)</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={adjustForm.newAmount}
                                                                    onChange={(e) => setAdjustForm({ ...adjustForm, newAmount: e.target.value, unavailableProductAmount: "" })}
                                                                    placeholder="Enter new total"
                                                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                                                    required
                                                                />
                                                            </div>

                                                            <div style={{ marginBottom: "1rem" }}>
                                                                <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem" }}>Reason for Adjustment *</label>
                                                                <input
                                                                    type="text"
                                                                    value={adjustForm.reason}
                                                                    onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                                                                    placeholder="e.g. Out of stock item removed, price correction"
                                                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                                                    required
                                                                />
                                                            </div>

                                                            <div style={{ marginBottom: "1.5rem" }}>
                                                                <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem" }}>Resolution for Difference</label>
                                                                <select
                                                                    value={adjustForm.resolution}
                                                                    onChange={(e) => setAdjustForm({ ...adjustForm, resolution: e.target.value })}
                                                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                                                >
                                                                    <option value="Wallet Credit">Wallet Credit (Refund difference to customer wallet)</option>
                                                                    <option value="Manual Correction">Manual Correction (Bill adjustment only)</option>
                                                                </select>
                                                            </div>

                                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setAdjustModal(false)}
                                                                    style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer" }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    type="submit"
                                                                    style={{ padding: "8px 20px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                                                                >
                                                                    Save Adjustment
                                                                </button>
                                                            </div>
                                                        </form>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Remove Item Modal */}
                                            {removeModal && selectedItemForRemoval && (
                                                <div style={{
                                                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                                                    background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999
                                                }}>
                                                    <div style={{ background: "#fff", padding: "2rem", borderRadius: "12px", width: "520px", maxWidth: "92%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                                            <h3 style={{ margin: 0, fontWeight: "700", color: "#1f2937", fontSize: "1.25rem" }}>Remove Order Item</h3>
                                                            <button
                                                                type="button"
                                                                onClick={() => setRemoveModal(false)}
                                                                style={{ background: "transparent", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#6b7280" }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>

                                                        <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.25rem" }}>
                                                            <div style={{ marginBottom: "6px" }}>
                                                                <span style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Product: </span>
                                                                <strong style={{ color: "#1e293b", fontSize: "0.95rem" }}>{selectedItemForRemoval.ProductName}</strong>
                                                            </div>
                                                            <div style={{ display: "flex", gap: "20px" }}>
                                                                <div>
                                                                    <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>Available Quantity: </span>
                                                                    <strong>{selectedItemForRemoval.Quantity}</strong>
                                                                </div>
                                                                <div>
                                                                    <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>Unit Price: </span>
                                                                    <strong>₹{selectedItemForRemoval.Price || selectedItemForRemoval.OfferPrice}</strong>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <form onSubmit={handleRemoveItemSubmit}>
                                                            <div style={{ marginBottom: "1rem" }}>
                                                                <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem", color: "#374151" }}>Quantity *</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max={selectedItemForRemoval.Quantity}
                                                                    value={removalForm.quantity}
                                                                    onChange={(e) => setRemovalForm({ ...removalForm, quantity: Math.min(selectedItemForRemoval.Quantity, Math.max(1, parseInt(e.target.value) || 1)) })}
                                                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
                                                                    required
                                                                />
                                                                <small style={{ color: "#6b7280" }}>Maximum quantity to remove: {selectedItemForRemoval.Quantity}</small>
                                                            </div>

                                                            <div style={{ marginBottom: "1rem" }}>
                                                                <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem", color: "#374151" }}>Reason *</label>
                                                                <select
                                                                    value={removalForm.reason}
                                                                    onChange={(e) => setRemovalForm({ ...removalForm, reason: e.target.value })}
                                                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
                                                                    required
                                                                >
                                                                    <option value="Out of Stock">Out of Stock</option>
                                                                    <option value="Unavailable">Unavailable</option>
                                                                    <option value="Damaged">Damaged</option>
                                                                    <option value="Quality Issue">Quality Issue</option>
                                                                    <option value="Incorrect Product">Incorrect Product</option>
                                                                    <option value="Vendor/Store Issue">Vendor/Store Issue</option>
                                                                    <option value="Other">Other</option>
                                                                </select>
                                                            </div>

                                                            <div style={{ marginBottom: "1rem" }}>
                                                                <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem", color: "#374151" }}>
                                                                    Description * {removalForm.reason === "Other" && <span style={{ color: "#dc2626", fontSize: "0.8rem" }}>(Detailed explanation required for 'Other')</span>}
                                                                </label>
                                                                <textarea
                                                                    rows="3"
                                                                    value={removalForm.description}
                                                                    onChange={(e) => setRemovalForm({ ...removalForm, description: e.target.value })}
                                                                    placeholder={removalForm.reason === "Other" ? "Detailed explanation is especially important when 'Other' is selected..." : "Enter removal details..."}
                                                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
                                                                    required
                                                                />
                                                            </div>

                                                            {orders?.PaymentMethod !== "COD" ? (
                                                                <div style={{ marginBottom: "1.25rem" }}>
                                                                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem", color: "#374151" }}>Refund / Payment Resolution</label>
                                                                    <select
                                                                        value={removalForm.resolution}
                                                                        onChange={(e) => setRemovalForm({ ...removalForm, resolution: e.target.value })}
                                                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
                                                                    >
                                                                        <option value="Wallet Credit">Wallet Credit (Instant refund to customer wallet)</option>
                                                                        <option value="Pending Manual Refund">Pending Manual Refund (Record for manual payment gateway refund)</option>
                                                                    </select>
                                                                    <small style={{ color: "#6b7280", marginTop: "2px", display: "block" }}>
                                                                        Prepaid order: Amount will be credited to wallet or tracked as a pending manual refund.
                                                                    </small>
                                                                </div>
                                                            ) : (
                                                                <div style={{ marginBottom: "1.25rem", background: "#f0fdf4", padding: "8px 12px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                                                                    <small style={{ color: "#166534", fontWeight: "600" }}>
                                                                        💵 Cash on Delivery (COD): Grand total and bill amount will be reduced automatically upon delivery.
                                                                    </small>
                                                                </div>
                                                            )}

                                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setRemoveModal(false)}
                                                                    disabled={submittingRemoval}
                                                                    style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    type="submit"
                                                                    disabled={submittingRemoval}
                                                                    style={{ padding: "8px 20px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                                                                >
                                                                    {submittingRemoval ? "Removing..." : "Remove Item"}
                                                                </button>
                                                            </div>
                                                        </form>
                                                    </div>
                                                </div>
                                            )}

                                            {/* <div className="category-table">
                                            <BootstrapTable
                                            bootstrap4
                                            keyField="id"
                                            data={orders.orderitems}
                                            columns={columns}
                                            defaultSorted={defaultSorted}
                                            pagination={pagination}
                                                wrapperClasses="table-responsive"
                                                />
                                            </div> */}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                                <AssignDeliveryBoyModal
                        show={showAssignModal}
                        onHide={() => setShowAssignModal(false)}
                        order={orders}
                        token={token}
                        onSuccess={() => {
                            getorders();
                            getTimeline();
                        }}
                    />
                    <CancelOrderModal
                        show={showCancelModal}
                        onHide={() => setShowCancelModal(false)}
                        order={orders}
                        token={token}
                        onSuccess={() => {
                            getorders();
                            getTimeline();
                        }}
                    />
                </div>
        </>
    );
}

export default Products;
