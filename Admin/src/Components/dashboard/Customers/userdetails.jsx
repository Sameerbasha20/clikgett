import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "../../../App.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import ScaleLoader from "react-spinners/ScaleLoader";
import { css } from "@emotion/react";
import { useParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
import { FaWallet, FaUser, FaMapMarkerAlt, FaShoppingBag, FaTrophy, FaShareAlt, FaMobileAlt } from "react-icons/fa";

function UserDetails() {
    const { id } = useParams();
    const Navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("profile"); // profile | orders | wallet | rewards | referrals | device
    const [customerData, setCustomerData] = useState(null);
    const [loading, setLoading] = useState(true);

    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    const override = css`
        display: block;
        margin: 0 auto;
    `;

    const fetchFullDetails = () => {
        setLoading(true);
        Services.getFullCustomerDetails("GET", null, token, id)
            .then((res) => {
                setLoading(false);
                const isSuccess = res && (res.Status === 1 || res.status === 1);
                if (isSuccess) {
                    const raw = res.data || res;
                    const p = raw.Profile || raw.profile || {};
                    const oStats = raw.OrderStats || raw.orderStats || raw.ordersSummary || {};
                    const ordersList = raw.Orders || raw.orders || [];
                    const wBal = raw.WalletBalance !== undefined ? raw.WalletBalance : (raw.wallet?.Balance !== undefined ? raw.wallet.Balance : p.WalletAmount || 0);
                    const wLedger = raw.WalletLedger || raw.walletLedger || raw.ledger || [];
                    const rList = raw.Rewards || raw.rewards || [];
                    const refData = raw.Referrals || raw.referrals || {};
                    const devData = raw.DeviceInfo || raw.deviceInfo || raw.device || {};
                    const addrList = raw.Addresses || raw.addresses || [];

                    setCustomerData({
                        profile: {
                            ...p,
                            UserName: p.UserName || `${p.FirstName || ""} ${p.LastName || ""}`.trim() || p.MobileNumber || `Customer #${id}`,
                            Mobile: p.Mobile || p.MobileNumber || "-",
                            Email: p.Email || p.EmailID || "-",
                            Status: p.Status,
                            CreatedAt: p.CreatedAt,
                            IsMember: p.PlanID || p.IsMember || false
                        },
                        ordersSummary: {
                            Total: oStats.Total !== undefined ? oStats.Total : ordersList.length,
                            Completed: oStats.Completed !== undefined ? oStats.Completed : 0,
                            Cancelled: oStats.Cancelled !== undefined ? oStats.Cancelled : 0,
                            Pending: oStats.Pending !== undefined ? oStats.Pending : 0,
                            Scheduled: oStats.Scheduled !== undefined ? oStats.Scheduled : 0,
                            TotalSpent: oStats.TotalSpend !== undefined ? oStats.TotalSpend : (oStats.TotalSpent || 0)
                        },
                        orders: ordersList,
                        wallet: {
                            Balance: parseFloat(wBal || 0).toFixed(2)
                        },
                        ledger: wLedger.map((tx, idx) => ({
                            TransactionID: tx.TransactionID || tx.WalletID || (idx + 1),
                            TransactionType: tx.TransactionType || (tx.Credited_Debited === 1 ? "credit" : "debit"),
                            Amount: tx.Amount,
                            RunningBalance: tx.RunningBalance,
                            OrderID: tx.OrderID || (tx.ContentType === 4 ? tx.ContentID : null),
                            Description: tx.Description,
                            ExpiryDate: tx.ExpiryDate,
                            CreatedAt: tx.CreatedAt
                        })),
                        rewards: rList.map(r => ({
                            Title: r.RewardName || r.Title || "Milestone Reward",
                            RequiredOrders: r.TriggerValue || r.RequiredOrders || 1,
                            RewardAmount: r.RewardValue || r.RewardAmount || 0,
                            ...r
                        })),
                        referrals: {
                            ReferralCode: refData.MyReferralCode || p.MyReferralCode || ("CLIK" + id),
                            ReferredUsers: (refData.ReferredUsers || []).map(u => ({
                                UserName: `${u.FirstName || ""} ${u.LastName || ""}`.trim() || u.MobileNumber,
                                Mobile: u.MobileNumber || u.Mobile,
                                Status: "Registered",
                                RewardAmount: refData.ReferralReward || 50,
                                CreatedAt: u.CreatedAt
                            }))
                        },
                        device: {
                            LastSeen: devData.LastActive || p.NotificationLastSeen || p.UpdatedAt || p.CreatedAt,
                            LastLogin: p.UpdatedAt || p.CreatedAt,
                            Platform: "Android (User App)",
                            AppVersion: "v1.0.4",
                            ...devData
                        },
                        addresses: addrList
                    });
                } else {
                    toast.error(res?.Message || res?.message || "Failed to load customer details");
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error(err);
                toast.error("Error loading customer details");
            });
    };

    useEffect(() => {
        fetchFullDetails();
    }, [id]);

    const walletColumns = [
        { dataField: "TransactionID", text: "Txn ID", sort: true, headerStyle: { width: "80px" } },
        {
            dataField: "TransactionType",
            text: "Type",
            formatter: (cell) => {
                const isCredit = cell === "credit" || cell === "cashback";
                return <span className={`badge ${isCredit ? "badge-success" : "badge-danger"}`}>{cell?.toUpperCase()}</span>;
            },
        },
        {
            dataField: "Amount",
            text: "Amount",
            sort: true,
            formatter: (cell, row) => {
                const isCredit = row.TransactionType === "credit" || row.TransactionType === "cashback";
                return (
                    <strong style={{ color: isCredit ? "#16a34a" : "#dc2626" }}>
                        {isCredit ? "+" : "-"}₹{cell}
                    </strong>
                );
            },
        },
        {
            dataField: "RunningBalance",
            text: "Running Balance",
            formatter: (cell) => <strong>₹{cell !== undefined ? cell : "-"}</strong>,
        },
        {
            dataField: "OrderID",
            text: "Order Ref",
            formatter: (cell) => (cell ? <span className="badge badge-info">#{cell}</span> : <span className="text-muted">-</span>),
        },
        {
            dataField: "Description",
            text: "Description / Reason",
            formatter: (cell) => cell || "-",
        },
        {
            dataField: "ExpiryDate",
            text: "Cashback Expiry",
            formatter: (cell) => (cell ? new Date(cell).toLocaleDateString() : "-"),
        },
        {
            dataField: "CreatedAt",
            text: "Timestamp",
            sort: true,
            formatter: (cell) => (cell ? new Date(cell).toLocaleString() : "-"),
        },
    ];

    const orderColumns = [
        {
            dataField: "OrderID",
            text: "Order #",
            sort: true,
            formatter: (cell) => <strong>#{cell}</strong>,
        },
        {
            dataField: "GrandTotal",
            text: "Total Amount",
            sort: true,
            formatter: (cell) => <strong>₹{cell}</strong>,
        },
        {
            dataField: "OrderStatus",
            text: "Status",
            formatter: (cell) => {
                const isDelivered = cell === "DELIVERED" || cell === 1;
                const isCancelled = cell === "CANCELLED" || cell === 4;
                const color = isDelivered ? "badge-success" : isCancelled ? "badge-danger" : "badge-warning";
                const label = cell === 1 ? "DELIVERED" : cell === 4 ? "CANCELLED" : cell === 2 ? "ACCEPTED" : cell === 5 ? "OUT FOR DELIVERY" : (cell || "PENDING");
                return <span className={`badge ${color}`}>{label}</span>;
            },
        },
        {
            dataField: "CreatedAt",
            text: "Order Date",
            sort: true,
            formatter: (cell) => (cell ? new Date(cell).toLocaleString() : "-"),
        },
        {
            dataField: "actions",
            text: "Action",
            formatter: (_, row) => (
                <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => Navigate(`/orders/${row.OrderID}`)}
                >
                    View Order
                </button>
            ),
        },
    ];

    const referralColumns = [
        { dataField: "UserName", text: "Referred Customer", formatter: (cell, row) => <strong>{cell || row.Mobile}</strong> },
        { dataField: "Mobile", text: "Mobile Number" },
        {
            dataField: "Status",
            text: "Referral Status",
            formatter: (cell) => <span className="badge badge-info">{cell || "Registered"}</span>,
        },
        {
            dataField: "RewardAmount",
            text: "Reward Credited",
            formatter: (cell) => (cell ? <strong style={{ color: "#16a34a" }}>₹{cell}</strong> : <span className="text-muted">Pending First Order</span>),
        },
        {
            dataField: "CreatedAt",
            text: "Date Joined",
            formatter: (cell) => (cell ? new Date(cell).toLocaleDateString() : "-"),
        },
    ];

    const profile = customerData?.profile || {};
    const ordersSummary = customerData?.ordersSummary || {};

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="customers" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <h3>Customer Profile & Ledger: {profile.UserName || "Customer #" + id}</h3>
                            <div style={{ color: "#666", fontSize: "0.9rem" }}>
                                Mobile: <strong>{profile.Mobile || "-"}</strong> | Email: <strong>{profile.Email || "-"}</strong>
                            </div>
                        </div>
                        <div className="card p-2 px-3 shadow-sm" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                            <div style={{ fontSize: "0.8rem", color: "#1e40af" }}>Wallet Balance</div>
                            <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#1e3a8a" }}>
                                ₹{customerData?.wallet?.Balance || "0.00"}
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="btn-group mb-4" style={{ flexWrap: "wrap", gap: "4px" }}>
                        <button
                            className={`btn ${activeTab === "profile" ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => setActiveTab("profile")}
                        >
                            <FaUser className="mr-1" /> Profile & Addresses
                        </button>
                        <button
                            className={`btn ${activeTab === "orders" ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => setActiveTab("orders")}
                        >
                            <FaShoppingBag className="mr-1" /> Orders ({ordersSummary.Total || 0})
                        </button>
                        <button
                            className={`btn ${activeTab === "wallet" ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => setActiveTab("wallet")}
                        >
                            <FaWallet className="mr-1" /> Detailed Wallet Ledger
                        </button>
                        <button
                            className={`btn ${activeTab === "rewards" ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => setActiveTab("rewards")}
                        >
                            <FaTrophy className="mr-1" /> Milestone Rewards
                        </button>
                        <button
                            className={`btn ${activeTab === "referrals" ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => setActiveTab("referrals")}
                        >
                            <FaShareAlt className="mr-1" /> Referral Campaign
                        </button>
                        <button
                            className={`btn ${activeTab === "device" ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => setActiveTab("device")}
                        >
                            <FaMobileAlt className="mr-1" /> Device & App Activity
                        </button>
                    </div>

                    {loading ? (
                        <div className={dashboardclasses["loader"]}>
                            <ScaleLoader color={"black"} loading={true} css={override} size={150} />
                        </div>
                    ) : (
                        <>
                            {/* TAB 1: Profile & Addresses */}
                            {activeTab === "profile" && (
                                <div className="row">
                                    <div className="col-md-6 mb-4">
                                        <div className="card p-3 shadow-sm h-100">
                                            <h5 style={{ borderBottom: "1px solid #eee", paddingBottom: "8px" }}>General Profile</h5>
                                            <table className="table table-sm table-borderless mt-2">
                                                <tbody>
                                                    <tr><td><strong>Full Name:</strong></td><td>{profile.UserName || "-"}</td></tr>
                                                    <tr><td><strong>Mobile:</strong></td><td>{profile.Mobile || "-"}</td></tr>
                                                    <tr><td><strong>Email ID:</strong></td><td>{profile.Email || "-"}</td></tr>
                                                    <tr><td><strong>Registration Date:</strong></td><td>{profile.CreatedAt ? new Date(profile.CreatedAt).toLocaleString() : "-"}</td></tr>
                                                    <tr>
                                                        <td><strong>Account Status:</strong></td>
                                                        <td>
                                                            <span className={`badge ${profile.Status === 1 ? "badge-success" : "badge-danger"}`}>
                                                                {profile.Status === 1 ? "Active" : "Inactive / Blocked"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Membership:</strong></td>
                                                        <td>
                                                            {profile.IsMember ? (
                                                                <span className="badge badge-warning" style={{ color: "#000" }}>Active Member</span>
                                                            ) : (
                                                                <span className="badge badge-secondary">Standard Customer</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="col-md-6 mb-4">
                                        <div className="card p-3 shadow-sm h-100">
                                            <h5 style={{ borderBottom: "1px solid #eee", paddingBottom: "8px" }}>Saved Delivery Addresses</h5>
                                            {customerData?.addresses && customerData.addresses.length > 0 ? (
                                                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                                                    {customerData.addresses.map((addr, idx) => (
                                                        <div key={idx} className="p-2 mb-2 border rounded" style={{ background: addr.IsDefault ? "#f0fdf4" : "#f8fafc" }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                                <strong><FaMapMarkerAlt /> {addr.AddressType || "Home"}</strong>
                                                                {addr.IsDefault ? <span className="badge badge-success">Default</span> : null}
                                                            </div>
                                                            <p className="mb-1" style={{ fontSize: "0.85rem" }}>{addr.Address || addr.Landmark}</p>
                                                            <small className="text-muted">{addr.City} - {addr.PostalCode}</small>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-muted mt-3">No saved addresses on file.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: Orders Summary & Breakdown */}
                            {activeTab === "orders" && (
                                <div>
                                    <div className="row mb-4">
                                        <div className="col-md-2 col-6 mb-2">
                                            <div className="card p-2 text-center shadow-sm">
                                                <div className="text-muted" style={{ fontSize: "0.8rem" }}>Total</div>
                                                <h4 className="mb-0">{ordersSummary.Total || 0}</h4>
                                            </div>
                                        </div>
                                        <div className="col-md-2 col-6 mb-2">
                                            <div className="card p-2 text-center shadow-sm" style={{ borderLeft: "4px solid #28a745" }}>
                                                <div className="text-muted" style={{ fontSize: "0.8rem" }}>Completed</div>
                                                <h4 className="mb-0 text-success">{ordersSummary.Completed || 0}</h4>
                                            </div>
                                        </div>
                                        <div className="col-md-2 col-6 mb-2">
                                            <div className="card p-2 text-center shadow-sm" style={{ borderLeft: "4px solid #dc3545" }}>
                                                <div className="text-muted" style={{ fontSize: "0.8rem" }}>Cancelled</div>
                                                <h4 className="mb-0 text-danger">{ordersSummary.Cancelled || 0}</h4>
                                            </div>
                                        </div>
                                        <div className="col-md-2 col-6 mb-2">
                                            <div className="card p-2 text-center shadow-sm" style={{ borderLeft: "4px solid #ffc107" }}>
                                                <div className="text-muted" style={{ fontSize: "0.8rem" }}>Pending</div>
                                                <h4 className="mb-0 text-warning">{ordersSummary.Pending || 0}</h4>
                                            </div>
                                        </div>
                                        <div className="col-md-2 col-6 mb-2">
                                            <div className="card p-2 text-center shadow-sm" style={{ borderLeft: "4px solid #17a2b8" }}>
                                                <div className="text-muted" style={{ fontSize: "0.8rem" }}>Scheduled</div>
                                                <h4 className="mb-0 text-info">{ordersSummary.Scheduled || 0}</h4>
                                            </div>
                                        </div>
                                        <div className="col-md-2 col-6 mb-2">
                                            <div className="card p-2 text-center shadow-sm">
                                                <div className="text-muted" style={{ fontSize: "0.8rem" }}>Total Spend</div>
                                                <h4 className="mb-0 text-primary">₹{ordersSummary.TotalSpent || 0}</h4>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="category-table">
                                        <BootstrapTable
                                            bootstrap4
                                            keyField="OrderID"
                                            data={customerData?.orders || []}
                                            columns={orderColumns}
                                            pagination={paginationFactory({ sizePerPage: 10, hideSizePerPage: true })}
                                            wrapperClasses="table-responsive"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: Detailed Wallet Ledger & Running Balance */}
                            {activeTab === "wallet" && (
                                <div>
                                    <div className="card p-3 shadow-sm mb-4" style={{ background: "#f8fafc" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <h5 className="mb-1">Authoritative Wallet Ledger</h5>
                                                <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
                                                    Includes credits, debits, cashbacks, manual adjustments, reversals, and real-time running balance.
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div style={{ fontSize: "0.8rem", color: "#666" }}>Current Balance</div>
                                                <h3 className="mb-0 text-success">₹{customerData?.wallet?.Balance || "0.00"}</h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="category-table">
                                        <BootstrapTable
                                            bootstrap4
                                            keyField="TransactionID"
                                            data={customerData?.ledger || []}
                                            columns={walletColumns}
                                            pagination={paginationFactory({ sizePerPage: 15, hideSizePerPage: true })}
                                            wrapperClasses="table-responsive"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: Milestone Rewards */}
                            {activeTab === "rewards" && (
                                <div className="card p-4 shadow-sm">
                                    <h5 className="mb-3">Milestone Progress & Rewards</h5>
                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <div className="card p-3 bg-light">
                                                <div className="text-muted">Completed Qualifying Orders</div>
                                                <h2 className="mb-0 text-primary">{ordersSummary.Completed || 0}</h2>
                                            </div>
                                        </div>
                                    </div>
                                    {customerData?.rewards && customerData.rewards.length > 0 ? (
                                        <table className="table table-bordered">
                                            <thead className="thead-light">
                                                <tr>
                                                    <th>Milestone Title</th>
                                                    <th>Target Orders</th>
                                                    <th>Current Progress</th>
                                                    <th>Reward Amount</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {customerData.rewards.map((m, idx) => (
                                                    <tr key={idx}>
                                                        <td><strong>{m.Title}</strong></td>
                                                        <td>{m.RequiredOrders} Orders</td>
                                                        <td>
                                                            <div className="progress" style={{ height: "18px" }}>
                                                                <div
                                                                    className="progress-bar bg-success"
                                                                    style={{ width: `${Math.min(100, Math.round(((ordersSummary.Completed || 0) / m.RequiredOrders) * 100))}%` }}
                                                                >
                                                                    {ordersSummary.Completed || 0}/{m.RequiredOrders}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td><strong>₹{m.RewardAmount}</strong></td>
                                                        <td>
                                                            {(ordersSummary.Completed || 0) >= m.RequiredOrders ? (
                                                                <span className="badge badge-success">Unlocked / Credited</span>
                                                            ) : (
                                                                <span className="badge badge-secondary">
                                                                    {m.RequiredOrders - (ordersSummary.Completed || 0)} orders remaining
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p className="text-muted">No active milestones configured in the system.</p>
                                    )}
                                </div>
                            )}

                            {/* TAB 5: Referral Campaign */}
                            {activeTab === "referrals" && (
                                <div className="card p-4 shadow-sm">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                        <div>
                                            <h5 className="mb-1">Customer Referral Campaign</h5>
                                            <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
                                                Referred users, qualification status, and wallet credits awarded.
                                            </p>
                                        </div>
                                        <div>
                                            <span className="badge badge-primary p-2" style={{ fontSize: "0.95rem" }}>
                                                Referral Code: {customerData?.referrals?.ReferralCode || "CLIK" + id}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="category-table">
                                        <BootstrapTable
                                            bootstrap4
                                            keyField="Mobile"
                                            data={customerData?.referrals?.ReferredUsers || []}
                                            columns={referralColumns}
                                            pagination={paginationFactory({ sizePerPage: 10, hideSizePerPage: true })}
                                            wrapperClasses="table-responsive"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB 6: Device Activity & App Status */}
                            {activeTab === "device" && (
                                <div className="card p-4 shadow-sm">
                                    <h5 className="mb-3">Device & App Activity Signal</h5>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <table className="table table-bordered">
                                                <tbody>
                                                    <tr>
                                                        <td><strong>Last Active / Seen:</strong></td>
                                                        <td>
                                                            {customerData?.device?.LastSeen ? (
                                                                <span className="text-success font-weight-bold">
                                                                    {new Date(customerData.device.LastSeen).toLocaleString()}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted">Not recorded</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Last Login Date:</strong></td>
                                                        <td>{customerData?.device?.LastLogin ? new Date(customerData.device.LastLogin).toLocaleString() : "-"}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Device Platform:</strong></td>
                                                        <td>{customerData?.device?.Platform || "Android (User App)"}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>App Version:</strong></td>
                                                        <td>{customerData?.device?.AppVersion || "v1.0.4"}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Heartbeat Status:</strong></td>
                                                        <td>
                                                            <span className="badge badge-success">Active Registered Device</span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserDetails;
