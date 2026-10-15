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
import { FaCheck, FaTimes, FaCoins } from "react-icons/fa";

function CashbackReview() {
    const [pendingItems, setPendingItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const override = css`
        display: block;
        margin: 0 auto;
    `;

    const fetchPendingCashback = () => {
        setLoading(true);
        Services.getPendingCashback("GET", null, token)
            .then((res) => {
                setLoading(false);
                if (res && (res.status === 1 || res.Status === 1)) {
                    setPendingItems(res.data || res.Pending || []);
                } else {
                    toast.error((res && (res.message || res.Message)) || "Failed to load pending cashbacks");
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error(err);
                toast.error("Error loading pending cashbacks");
            });
    };

    useEffect(() => {
        fetchPendingCashback();
    }, []);

    const handleApprove = (item) => {
        if (window.confirm(`Approve cashback of ₹${item.Amount} for Customer ${item.UserName} (Order #${item.OrderID})? This will credit their wallet with ledger tracking.`)) {
            Services.approveCashback("POST", JSON.stringify({ PendingID: item.PendingID }), token)
                .then((res) => {
                    if (res && (res.status === 1 || res.Status === 1)) {
                        toast.success((res && (res.message || res.Message)) || "Cashback approved and credited to wallet");
                        fetchPendingCashback();
                    } else {
                        toast.error((res && (res.message || res.Message)) || "Approval failed");
                    }
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("Error approving cashback");
                });
        }
    };

    const handleReject = (item) => {
        const reason = prompt("Enter reason for rejecting this cashback:", "Order modified / terms not met");
        if (reason !== null) {
            Services.rejectCashback("POST", JSON.stringify({ PendingID: item.PendingID, Reason: reason }), token)
                .then((res) => {
                    if (res && (res.status === 1 || res.Status === 1)) {
                        toast.info("Cashback rejected");
                        fetchPendingCashback();
                    } else {
                        toast.error((res && (res.message || res.Message)) || "Rejection failed");
                    }
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("Error rejecting cashback");
                });
        }
    };

    const columns = [
        {
            dataField: "PendingID",
            text: "ID",
            sort: true,
            headerStyle: { width: "60px" },
        },
        {
            dataField: "UserName",
            text: "Customer",
            formatter: (cell, row) => (
                <div>
                    <strong>{cell || "Customer"}</strong>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>{row.Mobile}</div>
                </div>
            ),
        },
        {
            dataField: "OrderID",
            text: "Order ID",
            formatter: (cell) => <span className="badge badge-info">#{cell}</span>,
        },
        {
            dataField: "Amount",
            text: "Cashback Amount",
            sort: true,
            formatter: (cell) => (
                <div style={{ fontWeight: "bold", color: "#16a34a", display: "flex", alignItems: "center", gap: "5px" }}>
                    <FaCoins color="#f59e0b" /> ₹{cell}
                </div>
            ),
        },
        {
            dataField: "Reason",
            text: "Trigger Reason",
            formatter: (cell) => cell || "Order completion promotional cashback",
        },
        {
            dataField: "CreatedAt",
            text: "Requested Date",
            sort: true,
            formatter: (cell) => (cell ? new Date(cell).toLocaleString() : "-"),
        },
        {
            dataField: "Status",
            text: "Status",
            formatter: (cell) => <span className="badge badge-warning" style={{ textTransform: "capitalize" }}>{cell}</span>,
        },
        {
            dataField: "actions",
            text: "Actions",
            formatter: (_, row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-sm btn-success" onClick={() => handleApprove(row)} title="Approve & Credit Wallet">
                        <FaCheck /> Approve
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleReject(row)} title="Reject">
                        <FaTimes /> Reject
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="cashback-review" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <h3>Manual Cashback Review Queue</h3>
                            <p style={{ color: "#666", margin: 0 }}>Review eligible cashbacks when Cashback Mode is set to Manual in Settings</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className={dashboardclasses["loader"]}>
                            <ScaleLoader color={"black"} loading={true} css={override} size={150} />
                        </div>
                    ) : pendingItems.length === 0 ? (
                        <div className="alert alert-info text-center p-4">
                            <h5>No Pending Cashbacks for Review</h5>
                            <p className="mb-0">All cashbacks have been processed, or Cashback Mode is configured as Automatic.</p>
                        </div>
                    ) : (
                        <div className="category-table">
                            <BootstrapTable
                                bootstrap4
                                keyField="PendingID"
                                data={pendingItems}
                                columns={columns}
                                pagination={paginationFactory({ sizePerPage: 10, hideSizePerPage: true })}
                                wrapperClasses="table-responsive"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CashbackReview;
