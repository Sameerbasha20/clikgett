import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaAward, FaPlus, FaRegEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import ScaleLoader from "react-spinners/ScaleLoader";
import { useNavigate } from "react-router-dom";

function Milestones() {
    const navigate = useNavigate();
    const [rewardsList, setRewardsList] = useState([]);
    const [userProgress, setUserProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    // Form State
    const [rewardId, setRewardId] = useState(null);
    const [rewardName, setRewardName] = useState("");
    const [rewardType, setRewardType] = useState("wallet_credit");
    const [triggerType, setTriggerType] = useState("order_count");
    const [triggerValue, setTriggerValue] = useState("");
    const [rewardValue, setRewardValue] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState(1);

    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const loadData = () => {
        setLoading(true);
        Promise.all([
            Services.getAllRewards("GET", null, token),
            Services.getMilestoneProgress("GET", null, token)
        ])
            .then(([rewardsRes, progressRes]) => {
                setLoading(false);
                if (rewardsRes.Status === 1) {
                    setRewardsList(rewardsRes.Rewards || []);
                } else if (rewardsRes.Message === "Token expired") {
                    navigate("/");
                }
                if (progressRes.Status === 1) {
                    setUserProgress(progressRes.Progress || []);
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Error loading milestones:", err);
            });
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setRewardId(null);
        setRewardName("");
        setRewardType("wallet_credit");
        setTriggerType("order_count");
        setTriggerValue("");
        setRewardValue("");
        setDescription("");
        setStatus(1);
    };

    const handleOpenEdit = (reward) => {
        setRewardId(reward.RewardID);
        setRewardName(reward.RewardName);
        setRewardType(reward.RewardType);
        setTriggerType(reward.TriggerType);
        setTriggerValue(reward.TriggerValue);
        setRewardValue(reward.RewardValue);
        setDescription(reward.Description || "");
        setStatus(reward.Status);
        setModalOpen(true);
    };

    const handleSaveReward = (e) => {
        e.preventDefault();
        if (!rewardName || triggerValue === "" || rewardValue === "") {
            toast.warning("Please fill all required fields");
            return;
        }

        const payload = {
            RewardID: rewardId,
            RewardName: rewardName,
            RewardType: rewardType,
            TriggerType: triggerType,
            TriggerValue: parseFloat(triggerValue),
            RewardValue: parseFloat(rewardValue),
            Description: description,
            Status: status
        };

        const apiCall = rewardId
            ? Services.updateMilestone("POST", JSON.stringify(payload), token)
            : Services.createMilestone("POST", JSON.stringify(payload), token);

        apiCall.then((res) => {
            if (res.Status === 1) {
                toast.success(rewardId ? "Milestone updated!" : "Milestone created!");
                setModalOpen(false);
                resetForm();
                loadData();
            } else {
                toast.error(res.Message || "Error saving milestone");
            }
        }).catch((err) => toast.error("Something went wrong"));
    };

    const handleDeleteReward = (id) => {
        if (window.confirm("Are you sure you want to delete this milestone reward?")) {
            Services.deleteMilestone("POST", JSON.stringify({ RewardID: id }), token)
                .then((res) => {
                    if (res.Status === 1) {
                        toast.success("Milestone deleted");
                        loadData();
                    } else {
                        toast.error(res.Message || "Failed to delete");
                    }
                });
        }
    };

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="milestones" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ padding: "20px" }}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h3 style={{ fontWeight: "700", color: "#2c3e50" }}>Customer Milestone Rewards</h3>
                            <p className="text-muted mb-0">Configure automated order thresholds (10, 50, 100 orders) and customer incentives</p>
                        </div>
                        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => { resetForm(); setModalOpen(true); }}>
                            <FaPlus /> Add Milestone Rule
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <ScaleLoader color="#2680eb" loading={true} />
                        </div>
                    ) : (
                        <>
                            {/* Standard Milestone Tiers (10, 50, 100 orders) */}
                            <div className="row g-3 mb-4">
                                <div className="col-md-4">
                                    <div className="card border-primary h-100 shadow-sm">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h5 className="card-title text-primary mb-0">Tier 1: Bronze</h5>
                                                <FaAward className="text-primary fs-4" />
                                            </div>
                                            <p className="card-text text-muted">Threshold: <strong>10 Completed Orders</strong></p>
                                            <div className="alert alert-light border mb-0">
                                                Reward: <strong>₹50 Wallet Credit</strong> on reaching 10 orders
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card border-info h-100 shadow-sm">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h5 className="card-title text-info mb-0">Tier 2: Silver</h5>
                                                <FaAward className="text-info fs-4" />
                                            </div>
                                            <p className="card-text text-muted">Threshold: <strong>50 Completed Orders</strong></p>
                                            <div className="alert alert-light border mb-0">
                                                Reward: <strong>₹250 Wallet Credit</strong> on reaching 50 orders
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card border-warning h-100 shadow-sm">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h5 className="card-title text-warning mb-0">Tier 3: Gold</h5>
                                                <FaAward className="text-warning fs-4" />
                                            </div>
                                            <p className="card-text text-muted">Threshold: <strong>100 Completed Orders</strong></p>
                                            <div className="alert alert-light border mb-0">
                                                Reward: <strong>₹500 Wallet Credit</strong> on reaching 100 orders
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Active Rules Table */}
                            <div className="bg-white rounded shadow-sm p-3 mb-4">
                                <h5 style={{ fontWeight: 600 }} className="mb-3">Configured Milestone Rules</h5>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Milestone Name</th>
                                                <th>Trigger</th>
                                                <th>Reward</th>
                                                <th>Description</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rewardsList.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="text-center py-4 text-muted">
                                                        No custom milestone rules configured yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                rewardsList.map((r) => (
                                                    <tr key={r.RewardID}>
                                                        <td><strong>#{r.RewardID}</strong></td>
                                                        <td><strong>{r.RewardName}</strong></td>
                                                        <td>
                                                            <span className="badge bg-light text-dark border">
                                                                {r.TriggerType === 'order_count' ? `${r.TriggerValue} Orders` : `${r.TriggerType}: ${r.TriggerValue}`}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-success">
                                                                {r.RewardType === 'wallet_credit' ? `₹${r.RewardValue} Wallet` : `${r.RewardType}: ${r.RewardValue}`}
                                                            </span>
                                                        </td>
                                                        <td><small className="text-muted">{r.Description || "N/A"}</small></td>
                                                        <td>
                                                            {r.Status === 1 ? (
                                                                <span className="badge bg-success">Active</span>
                                                            ) : (
                                                                <span className="badge bg-secondary">Disabled</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <button 
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    onClick={() => handleOpenEdit(r)}
                                                                >
                                                                    <FaRegEdit />
                                                                </button>
                                                                <button 
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => handleDeleteReward(r.RewardID)}
                                                                >
                                                                    <MdDelete />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Create / Edit Modal */}
            {modalOpen && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{rewardId ? "Edit Milestone Rule" : "Create Milestone Rule"}</h5>
                                <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                            </div>
                            <form onSubmit={handleSaveReward}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Milestone Name *</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            required 
                                            value={rewardName} 
                                            onChange={(e) => setRewardName(e.target.value)} 
                                            placeholder="e.g. 10th Order Bonus"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Trigger Condition</label>
                                        <select 
                                            className="form-select" 
                                            value={triggerType} 
                                            onChange={(e) => setTriggerType(e.target.value)}
                                        >
                                            <option value="order_count">Delivered Order Count</option>
                                            <option value="total_spend">Total Lifetime Spend (₹)</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Threshold Value *</label>
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            required 
                                            value={triggerValue} 
                                            onChange={(e) => setTriggerValue(e.target.value)} 
                                            placeholder="e.g. 10"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Reward Type</label>
                                        <select 
                                            className="form-select" 
                                            value={rewardType} 
                                            onChange={(e) => setRewardType(e.target.value)}
                                        >
                                            <option value="wallet_credit">Wallet Credit (₹)</option>
                                            <option value="coupon">Discount Coupon</option>
                                            <option value="badge">Loyalty Badge</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Reward Amount / Value *</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            className="form-control" 
                                            required 
                                            value={rewardValue} 
                                            onChange={(e) => setRewardValue(e.target.value)} 
                                            placeholder="e.g. 50"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Description</label>
                                        <textarea 
                                            className="form-control" 
                                            rows="2" 
                                            value={description} 
                                            onChange={(e) => setDescription(e.target.value)} 
                                            placeholder="Customer-facing description of the reward"
                                        ></textarea>
                                    </div>
                                    <div className="mb-3 form-check form-switch">
                                        <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            checked={status === 1} 
                                            onChange={(e) => setStatus(e.target.checked ? 1 : 0)} 
                                            id="statusSwitch"
                                        />
                                        <label className="form-check-label" htmlFor="statusSwitch">Active Status</label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Milestone</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Milestones;
