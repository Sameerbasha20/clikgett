import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Services } from "../../../Services";
import ScaleLoader from "react-spinners/ScaleLoader";
import { css } from "@emotion/react";
import { FaAws, FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaDollarSign } from "react-icons/fa";

function CostOverview() {
    const [billingData, setBillingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const override = css`
        display: block;
        margin: 0 auto;
    `;

    useEffect(() => {
        setLoading(true);
        Services.getAwsBilling("GET", null, token)
            .then((res) => {
                setLoading(false);
                setBillingData(res);
            })
            .catch((err) => {
                setLoading(false);
                console.error(err);
                setBillingData({
                    status: 0,
                    configured: false,
                    message: "Failed to connect to AWS billing diagnostic service",
                });
            });
    }, []);

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="aws-billing" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <FaAws size={36} color="#ff9900" />
                            <div>
                                <h3 style={{ margin: 0 }}>AWS Billing & Cost Overview</h3>
                                <p style={{ color: "#666", margin: 0 }}>Secure backend-integrated AWS Cost Explorer reporting</p>
                            </div>
                        </div>
                        <span className="badge badge-secondary p-2">
                            <FaShieldAlt /> Backend Secure Isolated
                        </span>
                    </div>

                    {loading ? (
                        <div className={dashboardclasses["loader"]}>
                            <ScaleLoader color={"black"} loading={true} css={override} size={150} />
                        </div>
                    ) : billingData && billingData.status === 1 ? (
                        <div>
                            <div className="row mb-4">
                                <div className="col-md-4">
                                    <div className="card p-3 shadow-sm" style={{ borderLeft: "4px solid #ff9900" }}>
                                        <div style={{ color: "#666", fontSize: "0.85rem" }}>Billing Period</div>
                                        <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{billingData.billingPeriod || "Current Month"}</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card p-3 shadow-sm" style={{ borderLeft: "4px solid #28a745" }}>
                                        <div style={{ color: "#666", fontSize: "0.85rem" }}>Estimated Cost (MTD)</div>
                                        <div style={{ fontWeight: "bold", fontSize: "1.6rem", color: "#28a745" }}>
                                            <FaDollarSign size={20} />{billingData.estimatedCost || "0.00"} {billingData.currency || "USD"}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card p-3 shadow-sm" style={{ borderLeft: "4px solid #17a2b8" }}>
                                        <div style={{ color: "#666", fontSize: "0.85rem" }}>Previous Period Cost</div>
                                        <div style={{ fontWeight: "bold", fontSize: "1.6rem", color: "#17a2b8" }}>
                                            <FaDollarSign size={20} />{billingData.previousPeriodCost || "0.00"} {billingData.currency || "USD"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {billingData.serviceCosts && billingData.serviceCosts.length > 0 && (
                                <div className="card p-4 shadow-sm mb-4">
                                    <h5 className="mb-3">Service-Wise Cost Breakdown</h5>
                                    <table className="table table-bordered">
                                        <thead className="thead-light">
                                            <tr>
                                                <th>AWS Service</th>
                                                <th>Estimated Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {billingData.serviceCosts.map((s, idx) => (
                                                <tr key={idx}>
                                                    <td>{s.service}</td>
                                                    <td><strong>${s.amount} {billingData.currency || "USD"}</strong></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="card p-4 shadow-sm" style={{ borderTop: "4px solid #f59e0b", background: "#fffdfa" }}>
                            <div style={{ display: "flex", gap: "15px", alignItems: "flex-start" }}>
                                <FaExclamationTriangle size={32} color="#f59e0b" style={{ flexShrink: 0, marginTop: "4px" }} />
                                <div>
                                    <h5 style={{ color: "#b45309" }}>AWS Cost Explorer Integration Status</h5>
                                    <p style={{ color: "#4b5563" }}>
                                        {billingData?.message || "AWS Cost Explorer credentials or IAM permissions are required to fetch live billing data."}
                                    </p>
                                    
                                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "6px", marginTop: "16px" }}>
                                        <h6 style={{ color: "#1e293b", fontWeight: 600 }}>Required AWS IAM Permission:</h6>
                                        <pre style={{ background: "#0f172a", color: "#38bdf8", padding: "12px", borderRadius: "4px", fontSize: "0.85rem", margin: "10px 0" }}>
{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast"
      ],
      "Resource": "*"
    }
  ]
}`}
                                        </pre>
                                        <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                                            Per strict safety guidelines, private AWS secret keys are never exposed in the frontend. The backend makes secure server-to-server calls to AWS SDK and returns safely filtered data.
                                        </p>
                                    </div>

                                    {billingData?.diagnostics && (
                                        <div style={{ marginTop: "16px", fontSize: "0.85rem", color: "#64748b" }}>
                                            <strong>Backend Diagnostic Details:</strong> {billingData.diagnostics}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CostOverview;
