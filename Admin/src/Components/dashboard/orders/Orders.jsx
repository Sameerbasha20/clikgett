import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-bootstrap-table-next/dist/react-bootstrap-table2.css";
import "react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
import "../../../App.css";
import { css } from "@emotion/react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import Moment from "react-moment";
import { useNavigate } from "react-router-dom";
import { GrFormView } from "react-icons/gr";
import TimePicker from "rc-time-picker";
import "rc-time-picker/assets/index.css";
import { FaDownload, FaBan } from "react-icons/fa";
import AssignDeliveryBoyModal from "./AssignDeliveryBoyModal";
import { statusOptions, isFinal } from "../../../orderStatus";
import CancelOrderModal from "./CancelOrderModal";

function Products() {
    const Navigate = useNavigate();
    let [loading, setLoading] = useState(true);
    const [Navactive, setNavactive] = useState(
        localStorage.getItem("active") || "1"
    );
    const [deliveryboys, setDeliveryboys] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedOrderForCancel, setSelectedOrderForCancel] = useState(null);
    const [selectedOrderForAssignment, setSelectedOrderForAssignment] = useState(null);

    const [orders, setOrders] = useState([]);
    const [ordersSearch, setOrdersSearch] = useState([]);
    const [filterMobile, setFilterMobile] = useState("");
    const [filterUsername, setFilterUsername] = useState("");
    const [filterOrderId, setFilterOrderId] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterSort, setFilterSort] = useState("latest");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const headerstyles = {
        color: "#707275",
        fontWeight: 700,
        fontSize: "0.8rem",
    };
    const override = css`
        display: block;
        margin: 0 auto;
        border-color: red;
    `;
    const getcategories = () => {
        Services.getDeliveryBoy("GET", null, token)
            .then((res) => {
                if (res.Status === 1) {
                    getorders(Navactive);
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
    const getorders = (status, query = "") => {
        let api = Services.getAllCurrentOrders("GET", null, token);
        if (status === "2") {
            api = Services.getAllPastOrders("GET", null, token, query);
        }
        api.then((res) => {
            console.log(res);
            setLoading(false);
            // setTabloader(false);
            if (res.Status === 1) {
                setOrders(res.Orders);
                // console.log(typeof res.Orders[0].orderStatus);
                setOrdersSearch(res.Orders);
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
        }).catch((err) => {
            // alert(err);
            alert("something went wrong please try again");
            console.log(err);
        });
    };
    useEffect(() => {
        getcategories();
        // eslint-disable-next-line
    }, []);

    const Idformatter = (cell, cellcontent, index, formatExtraData) => {
        const orderId = cellcontent?.OrderID || cell;
        return (
            <div
                style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                onClick={(e) => {
                    e.stopPropagation();
                    Navigate(`/orders/${orderId}`);
                }}
                title={`View details for Order #${orderId}`}
            >
                <span
                    className={dashboardclasses["idformatter"]}
                    style={{
                        color: "#2563EB",
                        textDecoration: "underline",
                        textUnderlineOffset: "3px",
                        cursor: "pointer",
                        fontWeight: 700,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#1D4ED8";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#2563EB";
                    }}
                >
                    {cell}
                </span>
            </div>
        );
    };
    const dateformatter = (cell, cellcontent) => {
        const date = new Date(cell);

        return (
            <Moment format="MMM Do , hh:mm a" utc>
                {date}
            </Moment>
        );
    };
    const viewOrderDetails = (e) => {
        const id = e.currentTarget.getAttribute("orderid");
        Navigate(`/orders/${id}`);
    };
    const ActionFormatter = (cell, cellcontent) => {
        const invoiceUrl = `${process.env.REACT_APP_BASE_URL || 'http://localhost:5000/api'}/adminorders/invoice/${cellcontent?.OrderID}?token=${encodeURIComponent(sessionStorage.getItem("token") || "")}`;
        const isCompleted = cellcontent?.OrderStatus == 1; // Delivered
        const isPastOrdersTab = Navactive === "2";
        const canCancel = cellcontent?.OrderStatus != 1 && cellcontent?.OrderStatus != 4 && cellcontent?.OrderStatus != 3;

        return (
            <div className={dashboardclasses.view}>
                {isPastOrdersTab && isCompleted && (
                    <button
                        title="Download Transaction Receipt"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(invoiceUrl, "_blank");
                        }}
                        style={{
                            marginRight: canCancel ? "8px" : "0",
                            background: "rgba(124, 58, 237, 0.08)",
                            border: "1px solid rgba(124, 58, 237, 0.2)",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center"
                        }}>
                        <FaDownload
                            size={14}
                            color="#7C3AED"
                            id={cellcontent?.OrderID}
                        />
                    </button>
                )}
                {canCancel && (
                    <button
                        title="Cancel Order with Reason"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderForCancel(cellcontent);
                            setShowCancelModal(true);
                        }}
                        style={{
                            background: "rgba(239, 68, 68, 0.08)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center"
                        }}>
                        <FaBan size={14} color="#EF4444" />
                    </button>
                )}
                {!canCancel && !(isPastOrdersTab && isCompleted) && (
                    <span className="text-muted small">-</span>
                )}
            </div>
        );
    };
    const getStatusDetails = (statusCode) => {
        switch (statusCode) {
            case 1:
                return { color: "green", statusName: "DELIVERED" };
            case 2:
                return { color: "orange", statusName: "RIDER ASSIGNED" };
            case 9:
                return { color: "orange", statusName: "PACKING" };
            case 3:
                return { color: "red", statusName: "CANCELLED (STORE)" };
            case 4:
                return { color: "red", statusName: "CANCELLED (CUSTOMER)" };
            case 5:
                return {
                    color: "yellow",
                    statusName: "Picked Up",
                };
            case 6:
                return {
                    color: "yellow",
                    statusName: "RETURNED",
                };
            case 7:
                return {
                    color: "GREEN",
                    statusName: "ARRIVED",
                };
            case 8:
                return {
                    color: "GREEN",
                    statusName: "RECEIVED",
                };

            default:
                return { color: "black", statusName: "Unknown status" };
        }
    };

    const priceFormatter = (cell) => {
        //className={dashboardclasses["priceformatter"]}
        return (
            <div className={dashboardclasses["price-wrapper"]}>
                <p>₹ {cell}</p>
            </div>
        );
    };
    const StatusFormatter = (cell, row) => {
        const scheduledFor = row?.ScheduleStatus === "Scheduled" && row?.ScheduledDateTime
            ? new Date(row.ScheduledDateTime).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
            : null;
        return (
            <>
            <p
                className={dashboardclasses["order_status"]}
                style={{
                    backgroundColor: getStatusDetails(cell).color,
                    color:
                        getStatusDetails(cell).statusName == "PROCESSING" ||
                        getStatusDetails(cell).statusName == "PACKING" ||
                        getStatusDetails(cell).statusName == "Picked Up"
                            ? "black"
                            : "white",
                }}>
                {" "}
                {getStatusDetails(cell).statusName}
            </p>
            {scheduledFor && (
                <span
                    title="Customer chose Schedule Later: deliver on this day"
                    style={{
                        display: "inline-block",
                        marginTop: "6px",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        backgroundColor: "#ede9fe",
                        color: "#5b21b6",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                    }}
                >
                    📅 Scheduled · {scheduledFor}
                </span>
            )}
            </>
        );
    };
    const statusHandler = (e, cellContent) => {
        setLoading(true);
        let body = {
            OrderStatus: e.target.value,
            UserID: cellContent?.UserID,
        };
        Services.UpdateOrderDetails(
            "PUT",
            JSON.stringify(body),
            token,
            cellContent?.OrderID
        )
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
    const updateDeliveryBoy = (e, userId, OrderId) => {
        const selectedBoyId = e.target.value;
        if (!selectedBoyId || selectedBoyId === "0" || selectedBoyId === "") return;
        setLoading(true);
        let body = {
            UserID: userId,
            DeliveryBoyID: selectedBoyId,
            ForceAssign: true,
        };
        Services.updateDeliveryboyOrder(
            "PUT",
            JSON.stringify(body),
            token,
            OrderId
        )
            .then((res) => {
                if (res.Status === 1) {
                    getorders(Navactive);
                    toast.success(`${res.Message || "Delivery boy assigned successfully"}`, {
                        position: "top-center",
                        autoClose: 1000,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
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
                setLoading(false);
                alert("something went wrong please try again");
                console.log(err);
            });
    };
    const StatusHandler = (cell, cellContent) => {
        return (
            <div className={dashboardclasses["order_status"]}>
                <select
                    key={`${cellContent.OrderID}-${cell}`}
                    defaultValue={cell}
                    disabled={isFinal(cell)}
                    onChange={(e) => statusHandler(e, cellContent)}>
                    {statusOptions(cell).map((o) => (
                        <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
                    ))}
                </select>
            </div>
        );
    };
    const UpdaetDelivery = (cell, cellContent) => {
        const isCompleted = cellContent.OrderStatus == 1 || cellContent.OrderStatus == 4;
        const currentBoyId = cellContent.DeliveryBoyID || cell || 0;
        
        let driverName = "";
        if (currentBoyId && currentBoyId != 0) {
            const matched = deliveryboys.find(b => b.AdminID == currentBoyId);
            if (matched) {
                driverName = `${matched.FirstName || ''} ${matched.LastName && matched.LastName !== 'NA' ? matched.LastName : ''}`.trim();
            } else {
                driverName = `Driver #${currentBoyId}`;
            }
        }

        if (isCompleted) {
            return (
                <div className="d-flex flex-column align-items-center">
                    {driverName ? (
                        <span className="fw-semibold text-muted small">{driverName}</span>
                    ) : (
                        <span className="badge bg-light text-muted border">UNASSIGNED</span>
                    )}
                </div>
            );
        }

        return (
            <div className="d-flex flex-column align-items-center gap-1" style={{ minWidth: "160px" }}>
                {driverName ? (
                    <span className="fw-bold text-dark small" title={`Currently assigned: ${driverName}`}>
                        {driverName}
                    </span>
                ) : (
                    <span className="badge bg-secondary px-2 py-1" style={{ fontSize: "10px" }}>
                        UNASSIGNED
                    </span>
                )}
                <div className={dashboardclasses["order_status"]} style={{ width: "100%" }}>
                    <select
                        value={currentBoyId || ""}
                        onChange={(e) => updateDeliveryBoy(e, cellContent.UserID, cellContent.OrderID)}
                        style={{
                            width: "100%",
                            padding: "4px 8px",
                            fontSize: "12px",
                            borderRadius: "6px",
                            border: "1px solid #ced4da",
                            backgroundColor: currentBoyId ? "#f8fafc" : "#ffffff",
                            cursor: "pointer",
                            fontWeight: 500
                        }}
                    >
                        <option value="" disabled={Boolean(currentBoyId)}>
                            {currentBoyId ? "-- Change Delivery Boy --" : "-- Select Delivery Boy --"}
                        </option>
                        {deliveryboys && deliveryboys.length > 0 ? (
                            deliveryboys.map((item) => {
                                const name = `${item.FirstName || ''} ${item.LastName && item.LastName !== 'NA' ? item.LastName : ''}`.trim();
                                return (
                                    <option key={item.AdminID} value={item.AdminID}>
                                        {name || `Driver #${item.AdminID}`}
                                    </option>
                                );
                            })
                        ) : (
                            <option disabled>No drivers available</option>
                        )}
                    </select>
                </div>
            </div>
        );
    };

    const columns = [
        {
            dataField: "OrderID",
            text: "ORDER ID",
            sort: false,
            // cell: (row, index) => index + 1,
            formatter: Idformatter,
            headerStyle: (colum, colIndex) => {
                return {
                    ...headerstyles,
                };
            },
        },
        /*    {
            dataField: "CartID",
            text: "Cart ID",
            sort: false,
            formatter: Idformatter,
            // cell: (row, index) => index + 1,
            headerStyle: (colum, colIndex) => {
                return {
                    ...headerstyles,
                };
            },
        }, */
        /*   {
            dataField: "MobileNumber",
            text: "MOBILE NUMBER",
            sort: false,

            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        }, */
        {
            dataField: "CreatedAt",
            text: "ORDER DATE TIME",
            sort: false,
            formatter: dateformatter,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },

        {
            dataField: "GrandTotal",
            text: "AMOUNT",
            sort: false,
            formatter: priceFormatter,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles };
            },
        },
        {
            dataField: "OrderStatus",
            text: "ORDER STATUS",
            sort: false,
            formatter: StatusFormatter,
            tdStyle: () => {
                return {
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                };
            }, // Center-align text for this column

            headerStyle: (colum, colIndex) => {
                return { ...headerstyles, textAlign: "center" };
            },
        },

        {
            dataField: "DeliveryBoyID",
            text: "DELIVERY BOY",
            sort: false,
            formatter: UpdaetDelivery,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles, "textAlign": "center" };
            },
        },
        {
            dataField: "OrderStatusAction",
            text: "STATUS",
            sort: false,
            formatter: StatusHandler,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles, "textAlign": "center" };
            },
        },
        {
            dataField: "ACTIONS",
            text: "ORDER DETAILS",
            sort: false,
            formatter: ActionFormatter,
            headerStyle: (colum, colIndex) => {
                return { ...headerstyles, "textAlign": "center" };
            },
        },
    ];
    const pagination = paginationFactory({
        page: 1,
        sizePerPage: 8,
        lastPageText: ">>",
        firstPageText: "<<",
        nextPageText: ">",
        prePageText: "<",
        hideSizePerPage: true,
        showTotal: true,
        alwaysShowAllBtns: true,
        onPageChange: function (page, sizePerPage) {
            console.log("page", page);
            console.log("sizePerPage", sizePerPage);
        },
        onSizePerPageChange: function (page, sizePerPage) {
            console.log("page", page);
            console.log("sizePerPage", sizePerPage);
        },
    });
    const defaultSorted = [
        {
            dataField: "name",
            order: "desc",
        },
    ];
    const searchHandler = (e) => {
        const search = orders.filter((item) =>
            String(item.OrderID).includes(e.target.value)
        );
        setOrdersSearch(search);
    };

    
    const buildQuery = () => {
        const params = new URLSearchParams();
        if (filterMobile) params.append("mobile", filterMobile);
        if (filterUsername) params.append("username", filterUsername);
        if (filterOrderId) params.append("orderId", filterOrderId);
        if (filterStatus) params.append("status", filterStatus);
        if (filterSort) params.append("sort", filterSort);
        if (filterStartDate) params.append("startDate", filterStartDate);
        if (filterEndDate) params.append("endDate", filterEndDate);
        const q = params.toString();
        return q ? "?" + q : "";
    };

    const handleApplyFilters = (e) => {
        e.preventDefault();
        setLoading(true);
        getorders(Navactive, buildQuery());
    };

    const handleResetFilters = () => {
        setFilterMobile("");
        setFilterUsername("");
        setFilterOrderId("");
        setFilterStatus("");
        setFilterSort("latest");
        setFilterStartDate("");
        setFilterEndDate("");
        setLoading(true);
        getorders(Navactive, "");
    };

    const navactivehandler = (e) => {
        setLoading(true);
        let status = e.currentTarget.getAttribute("id");
        setNavactive(status);
        localStorage.setItem("active", status);
        getorders(status);
    };
    return (
        <>
            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="orders" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />
                    <div className={dashboardclasses.CategoryWrapper}>
                        <h3>Orders</h3>
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
                                <div
                                    className={
                                        dashboardclasses["customer-form"]
                                    }>
                                    <input
                                        type={"text"}
                                        placeholder="Search by Orderid"
                                        onChange={searchHandler}
                                    />
                                </div>
                                <div
                                    className={
                                        dashboardclasses["orders-navbar"]
                                    }>
                                    <button
                                        id="1"
                                        className={
                                            Navactive === "1" ? dashboardclasses["order-active"] : undefined
                                        }
                                        onClick={navactivehandler}>
                                        Current
                                    </button>
                                    <button
                                        id="2"
                                        className={
                                            Navactive === "2" ? dashboardclasses["order-active"] : undefined
                                        }
                                        onClick={navactivehandler}>
                                        Past
                                    </button>
                                </div>

                                
                                <div className="card p-3 mb-3 bg-light border">
                                    <form onSubmit={handleApplyFilters} className="row g-2 align-items-end">
                                        <div className="col-md-2 form-group mb-2">
                                            <label className="small font-weight-bold">Mobile # (DB Query):</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="e.g. 9876543210"
                                                value={filterMobile}
                                                onChange={(e) => setFilterMobile(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-2 form-group mb-2">
                                            <label className="small font-weight-bold">Customer Name:</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Name..."
                                                value={filterUsername}
                                                onChange={(e) => setFilterUsername(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-1 form-group mb-2">
                                            <label className="small font-weight-bold">Order ID:</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="ID"
                                                value={filterOrderId}
                                                onChange={(e) => setFilterOrderId(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-2 form-group mb-2">
                                            <label className="small font-weight-bold">Sort By:</label>
                                            <select
                                                className="form-control form-control-sm"
                                                value={filterSort}
                                                onChange={(e) => setFilterSort(e.target.value)}
                                            >
                                                <option value="latest">Latest First</option>
                                                <option value="oldest">Oldest First</option>
                                                <option value="highest_value">Highest Value</option>
                                                <option value="lowest_value">Lowest Value</option>
                                                <option value="status">Status</option>
                                                <option value="scheduled_date">Scheduled Date</option>
                                                <option value="delivery_date">Delivery Date</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2 form-group mb-2">
                                            <label className="small font-weight-bold">Status:</label>
                                            <select
                                                className="form-control form-control-sm"
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="DELIVERED">Delivered</option>
                                                <option value="CANCELLED">Cancelled</option>
                                                <option value="PACKING">Packing</option>
                                                <option value="ARRIVED">Arrived</option>
                                                <option value="RECEIVED">Received</option>
                                            </select>
                                        </div>
                                        <div className="col-md-3 form-group mb-2 d-flex gap-2">
                                            <button type="submit" className="btn btn-sm btn-primary flex-grow-1">
                                                Apply Query
                                            </button>
                                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleResetFilters}>
                                                Reset
                                            </button>
                                        </div>
                                    </form>
                                </div>
                                <div className="category-table table_order">
                                    <BootstrapTable
                                        bootstrap4
                                        keyField="OrderID"
                                        data={ordersSearch}
                                        columns={columns}
                                        defaultSorted={defaultSorted}
                                        pagination={pagination}
                                        wrapperClasses="table-responsive"
                                    />
                                </div>
                                <AssignDeliveryBoyModal
                                    show={showAssignModal}
                                    onHide={() => setShowAssignModal(false)}
                                    order={selectedOrderForAssignment}
                                    token={token}
                                    onSuccess={() => getorders()}
                                />
                                <CancelOrderModal
                                    show={showCancelModal}
                                    onHide={() => {
                                        setShowCancelModal(false);
                                        setSelectedOrderForCancel(null);
                                    }}
                                    order={selectedOrderForCancel}
                                    token={token}
                                    onSuccess={() => getorders()}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Products;
