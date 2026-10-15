import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../App.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import ScaleLoader from "react-spinners/ScaleLoader";
import { css } from "@emotion/react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";

function Transactions() {
    const { id } = useParams();
    const Navigate = useNavigate();
    const override = css`
        display: block;
        margin: 0 auto;
        border-color: red;
    `;
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };
    let [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [balance, setBalance] = useState(0);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm();

    const selectedType = watch("type");

    const loadTransactions = () => {
        setLoading(true);
        Services.getWalletTransactions("GET", null, token, id)
            .then((res) => {
                setLoading(false);
                if (res.Status === 1) {
                    setTransactions(res.Transactions || []);
                    setBalance(res.Balance || 0);
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Error loading wallet transactions:", err);
            });
    };

    useEffect(() => {
        loadTransactions();
    }, [id]);

    const onSubmit = (data) => {
        const payload = JSON.stringify({
            UserID: id,
            Amount: parseFloat(data.amount),
            Credited_Debited: parseInt(data.type, 10),
            Description: data.Description,
            ExpiryDays: data.expiryDays ? parseInt(data.expiryDays, 10) : undefined
        });

        Services.creditDebitWallet("POST", payload, token)
            .then((res) => {
                if (res.Status === 1) {
                    toast.success(res.Message || "Wallet transaction successful");
                    reset();
                    loadTransactions();
                } else {
                    toast.error(res.Message || "Transaction failed");
                }
            })
            .catch((err) => toast.error("Error performing wallet transaction"));
    };

    const handleExpireCashback = () => {
        if (window.confirm("Run cashback expiry process now? This will expire all past-due credits.")) {
            Services.expireCashback("POST", {}, token)
                .then((res) => {
                    if (res.Status === 1) {
                        toast.success(res.Message);
                        loadTransactions();
                    } else {
                        toast.error(res.Message || "Failed to process cashback expiry");
                    }
                })
                .catch((err) => toast.error("Error processing expiry"));
        }
    };

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="customers" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ padding: "2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <div>
                            <h2 style={{ fontWeight: "700", color: "#1f2937", margin: 0 }}>Wallet Management & Transactions</h2>
                            <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>User ID: #{id} | Current Wallet Balance: <strong style={{ color: "#059669", fontSize: "1.1rem" }}>₹{balance.toFixed(2)}</strong></p>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                onClick={handleExpireCashback}
                                style={{ background: "#f59e0b", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                            >
                                Process Cashback Expiry
                            </button>
                            <button
                                onClick={() => Navigate(-1)}
                                style={{ background: "#f3f4f6", border: "1px solid #d1d5db", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}
                            >
                                Back
                            </button>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "2rem" }}>
                        {/* Transaction Form */}
                        <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", height: "fit-content" }}>
                            <h4 style={{ fontWeight: "700", marginBottom: "1rem", color: "#111827" }}>Add Credit / Debit</h4>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem" }}>Transaction Type *</label>
                                    <select
                                        {...register("type", { required: "Type is required" })}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                    >
                                        <option value="1">Credit (Add Money / Cashback)</option>
                                        <option value="2">Debit (Deduct Money)</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: "1rem" }}>
                                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem" }}>Amount (₹) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        {...register("amount", { required: "Amount is required" })}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                        placeholder="e.g. 100.00"
                                    />
                                    {errors?.amount && <p style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "2px" }}>{errors.amount.message}</p>}
                                </div>

                                {selectedType !== "2" && (
                                    <div style={{ marginBottom: "1rem" }}>
                                        <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem" }}>Cashback Expiry (Days)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            {...register("expiryDays")}
                                            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                            placeholder="e.g. 30 (leave empty for no expiry)"
                                        />
                                    </div>
                                )}

                                <div style={{ marginBottom: "1.5rem" }}>
                                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.875rem" }}>Reason / Description *</label>
                                    <textarea
                                        rows="3"
                                        {...register("Description", { required: "Description is required" })}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                        placeholder="e.g. Promo cashback reward, order refund correction"
                                    />
                                    {errors?.Description && <p style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "2px" }}>{errors.Description.message}</p>}
                                </div>

                                <button
                                    type="submit"
                                    style={{ width: "100%", padding: "10px", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                                >
                                    Submit Transaction
                                </button>
                            </form>
                        </div>

                        {/* Transaction History */}
                        <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                            <h4 style={{ fontWeight: "700", marginBottom: "1rem", color: "#111827" }}>Transaction History</h4>
                            {loading ? (
                                <div style={{ textAlign: "center", padding: "2rem" }}>
                                    <ScaleLoader color="#059669" />
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                        <thead>
                                            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontSize: "0.8rem", color: "#4b5563" }}>
                                                <th style={{ padding: "8px" }}>ID</th>
                                                <th style={{ padding: "8px" }}>Type</th>
                                                <th style={{ padding: "8px" }}>Amount</th>
                                                <th style={{ padding: "8px" }}>Description</th>
                                                <th style={{ padding: "8px" }}>Expiry</th>
                                                <th style={{ padding: "8px" }}>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No transactions found for this user.</td>
                                                </tr>
                                            ) : (
                                                transactions.map((tx) => (
                                                    <tr key={tx.WalletID || tx.ID} style={{ borderBottom: "1px solid #f3f4f6", fontSize: "0.85rem" }}>
                                                        <td style={{ padding: "8px", fontWeight: "600" }}>#{tx.WalletID || tx.ID}</td>
                                                        <td style={{ padding: "8px" }}>
                                                            <span style={{
                                                                background: tx.Credited_Debited === 1 ? "#d1fae5" : "#fee2e2",
                                                                color: tx.Credited_Debited === 1 ? "#065f46" : "#991b1b",
                                                                padding: "2px 6px",
                                                                borderRadius: "4px",
                                                                fontSize: "0.75rem",
                                                                fontWeight: "600"
                                                            }}>
                                                                {tx.Credited_Debited === 1 ? "Credit" : "Debit"}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "8px", fontWeight: "700", color: tx.Credited_Debited === 1 ? "#059669" : "#dc2626" }}>
                                                            {tx.Credited_Debited === 1 ? "+" : "-"}₹{parseFloat(tx.Amount).toFixed(2)}
                                                        </td>
                                                        <td style={{ padding: "8px", maxWidth: "200px" }}>{tx.Description}</td>
                                                        <td style={{ padding: "8px", fontSize: "0.75rem", color: "#6b7280" }}>
                                                            {tx.ExpiryDate ? (
                                                                <span style={{ color: tx.IsExpired ? "#dc2626" : "#4b5563" }}>
                                                                    {new Date(tx.ExpiryDate).toLocaleDateString()} {tx.IsExpired ? "(Expired)" : ""}
                                                                </span>
                                                            ) : "-"}
                                                        </td>
                                                        <td style={{ padding: "8px", fontSize: "0.75rem", color: "#6b7280" }}>
                                                            {new Date(tx.CreatedAt).toLocaleDateString()}
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
                </div>
            </div>
        </div>
    );
}

export default Transactions;
