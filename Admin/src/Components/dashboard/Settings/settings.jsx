import React, { useState, useEffect } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-bootstrap-table-next/dist/react-bootstrap-table2.css";
import "react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
import { FaRegEdit, FaSave, FaSlidersH, FaTable, FaRoute, FaGift } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import "../../../App.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import AddCategory from "./addsettings";
import DeliveryETASettingsTab from "./DeliveryETASettingsTab";
import ReferralSettingsTab from "./ReferralSettingsTab";
import { css } from "@emotion/react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { useNavigate, useLocation } from "react-router-dom";

function SettingsPage() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get("tab") || "operational";
    const [activeTab, setActiveTab] = useState(initialTab); // 'operational' | 'delivery-eta' | 'referrals' | 'system'

    useEffect(() => {
        const tab = new URLSearchParams(location.search).get("tab");
        if (tab && ["operational", "delivery-eta", "referrals", "system"].includes(tab)) {
            setActiveTab(tab);
        }
    }, [location.search]);
    const [category, setCategory] = useState(false);
    const Navigate = useNavigate();
    const [id, setid] = useState();
    const [editable, setEditable] = useState(false);
    const [categoryItems, setCategoryItems] = useState([]);
    const [categorysearchItems, setCategorySearchItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingToggles, setSavingToggles] = useState(false);

    // Operational business & delivery settings
    const [shopSettingId, setShopSettingId] = useState(1);
    const [minWalletOrderValue, setMinWalletOrderValue] = useState("399");
    const [cashbackMode, setCashbackMode] = useState("automatic");
    const [longDistanceEnabled, setLongDistanceEnabled] = useState(false);
    const [longDistanceThreshold, setLongDistanceThreshold] = useState("8.00");
    const [longDistanceFee, setLongDistanceFee] = useState("40.00");
    const [largeCartThreshold1Items, setLargeCartThreshold1Items] = useState("10");
    const [largeCartThreshold1Minutes, setLargeCartThreshold1Minutes] = useState("5");
    const [largeCartThreshold2Items, setLargeCartThreshold2Items] = useState("20");
    const [largeCartThreshold2Minutes, setLargeCartThreshold2Minutes] = useState("10");
    const [deliveryAddressVisibility, setDeliveryAddressVisibility] = useState(true);
    const [deliveryProductListVisibility, setDeliveryProductListVisibility] = useState(true);

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

    const fetchAllSettings = () => {
        setLoading(true);
        // 1. Fetch system key-value settings
        Services.getsettings("GET", null, token)
            .then((res) => {
                if (res.status === 1) {
                    setCategoryItems(res.Settings || []);
                    setCategorySearchItems(res.Settings || []);
                    const walletSetting = (res.Settings || []).find((s) => s.SettingKey === "Minordervalue_wallet");
                    if (walletSetting) {
                        setMinWalletOrderValue(walletSetting.SettingValue || "399");
                    }
                }
            })
            .catch((err) => console.error(err));

        // 2. Fetch operational shop toggle settings
        Services.getShopStatus("GET", null, token)
            .then((res) => {
                setLoading(false);
                if (res.status === 1 && res.Shop) {
                    const s = res.Shop;
                    setShopSettingId(s.SettingID || 1);
                    setCashbackMode(s.CashbackMode || "automatic");
                    setLongDistanceEnabled(Boolean(s.LongDistanceFeeEnabled));
                    setLongDistanceThreshold(s.LongDistanceThresholdKm ? String(s.LongDistanceThresholdKm) : "8.00");
                    setLongDistanceFee(s.LongDistanceFee ? String(s.LongDistanceFee) : "40.00");
                    setLargeCartThreshold1Items(s.LargeCartThreshold1Items ? String(s.LargeCartThreshold1Items) : "10");
                    setLargeCartThreshold1Minutes(s.LargeCartThreshold1Minutes ? String(s.LargeCartThreshold1Minutes) : "5");
                    setLargeCartThreshold2Items(s.LargeCartThreshold2Items ? String(s.LargeCartThreshold2Items) : "20");
                    setLargeCartThreshold2Minutes(s.LargeCartThreshold2Minutes ? String(s.LargeCartThreshold2Minutes) : "10");
                    setDeliveryAddressVisibility(s.DeliveryAddressVisibility !== 0);
                    setDeliveryProductListVisibility(s.DeliveryProductListVisibility !== 0);
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error(err);
            });
    };

    useEffect(() => {
        fetchAllSettings();
    }, []);

    const saveOperationalSettings = (e) => {
        e.preventDefault();
        setSavingToggles(true);

        const togglePayload = {
            CashbackMode: cashbackMode,
            LongDistanceFeeEnabled: longDistanceEnabled ? 1 : 0,
            LongDistanceThresholdKm: parseFloat(longDistanceThreshold) || 8.00,
            LongDistanceFee: parseFloat(longDistanceFee) || 40.00,
            LargeCartThreshold1Items: parseInt(largeCartThreshold1Items) || 10,
            LargeCartThreshold1Minutes: parseInt(largeCartThreshold1Minutes) || 5,
            LargeCartThreshold2Items: parseInt(largeCartThreshold2Items) || 20,
            LargeCartThreshold2Minutes: parseInt(largeCartThreshold2Minutes) || 10,
            DeliveryAddressVisibility: deliveryAddressVisibility ? 1 : 0,
            DeliveryProductListVisibility: deliveryProductListVisibility ? 1 : 0,
        };

        // 1. Save toggle settings
        Services.updateStoreData("PUT", JSON.stringify(togglePayload), token, shopSettingId)
            .then((res) => {
                // 2. Also update Minordervalue_wallet in Settings table if changed
                const walletSetting = categoryItems.find((s) => s.SettingKey === "Minordervalue_wallet");
                if (walletSetting && walletSetting.SettingValue !== minWalletOrderValue) {
                    Services.updatesettings("PUT", JSON.stringify({
                        SettingKey: "Minordervalue_wallet",
                        SettingValue: minWalletOrderValue
                    }), token, walletSetting.ID).then(() => {
                        toast.success("All operational & wallet threshold settings updated successfully!");
                        setSavingToggles(false);
                        fetchAllSettings();
                    });
                } else {
                    toast.success("Operational settings updated successfully!");
                    setSavingToggles(false);
                }
            })
            .catch((err) => {
                setSavingToggles(false);
                console.error(err);
                toast.error("Failed to update operational settings");
            });
    };

    const edithandler = (e) => {
        setid(e.currentTarget.getAttribute("id"));
        setEditable(true);
        setCategory(true);
    };

    const deleteHandler = (e) => {
        if (window.confirm("Are you sure you want to delete this setting?")) {
            Services.deletesettings("DELETE", null, token, e.currentTarget.getAttribute("id"))
                .then((res) => {
                    if (res.status === 1) {
                        fetchAllSettings();
                        toast.success(res.Message);
                    }
                })
                .catch((err) => console.error(err));
        }
    };

    const ActionFormatter = (cell, cellcontent) => (
        <div className={dashboardclasses.tablebtns}>
            <button onClick={edithandler} id={cellcontent.ID}>
                <FaRegEdit size={18} />
            </button>
            <button onClick={deleteHandler} id={cellcontent.ID}>
                <MdDelete size={18} />
            </button>
        </div>
    );

    const columns = [
        { dataField: "ID", text: "ID", sort: true, headerStyle: { width: "60px" } },
        { dataField: "SettingKey", text: "Setting Key", sort: true },
        { dataField: "SettingValue", text: "Setting Value", sort: true },
        {
            dataField: "CreatedAt",
            text: "Created At",
            formatter: (cell) => (cell ? new Date(cell).toLocaleDateString() : "-"),
        },
        {
            dataField: "ACTIONS",
            text: "Actions",
            formatter: ActionFormatter,
            headerStyle: { width: "100px" },
        },
    ];

    const searchHandler = (e) => {
        const q = e.target.value.toLowerCase();
        setCategorySearchItems(
            categoryItems.filter((item) =>
                item.SettingKey.toLowerCase().includes(q)
            )
        );
    };

    return (
        <>
            {category && (
                <AddCategory
                    setmodal={setCategory}
                    editable={editable}
                    id={id}
                    setEditable={setEditable}
                    getCategories={fetchAllSettings}
                />
            )}

            <div className={dashboardclasses["dashboard-wrapper"]}>
                <div className={dashboardclasses["dashboard-leftside"]}>
                    <SideNav isactive="settings" />
                </div>
                <div className={dashboardclasses["dashboard-rightside"]}>
                    <TopNav />

                    <div className={dashboardclasses.CategoryWrapper} style={{ padding: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3>Admin Configuration & System Settings</h3>
                            <div className="btn-group flex-wrap">
                                <button
                                    className={`btn ${activeTab === "operational" ? "btn-primary" : "btn-outline-primary"}`}
                                    onClick={() => setActiveTab("operational")}
                                >
                                    <FaSlidersH className="mr-1" /> Business & Delivery Rules
                                </button>
                                <button
                                    className={`btn ${activeTab === "delivery-eta" ? "btn-primary" : "btn-outline-primary"}`}
                                    onClick={() => setActiveTab("delivery-eta")}
                                >
                                    <FaRoute className="mr-1" /> Distance Delivery ETA
                                </button>
                                <button
                                    className={`btn ${activeTab === "referrals" ? "btn-primary" : "btn-outline-primary"}`}
                                    onClick={() => setActiveTab("referrals")}
                                >
                                    <FaGift className="mr-1" /> Refer & Earn Rewards
                                </button>
                                <button
                                    className={`btn ${activeTab === "system" ? "btn-primary" : "btn-outline-primary"}`}
                                    onClick={() => setActiveTab("system")}
                                >
                                    <FaTable className="mr-1" /> All System Variables
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className={dashboardclasses["loader"]}>
                                <ScaleLoader color={"black"} loading={true} css={override} size={150} />
                            </div>
                        ) : activeTab === "operational" ? (
                            <form onSubmit={saveOperationalSettings} className="card p-4 shadow-sm" style={{ maxWidth: "900px" }}>
                                <h4 style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", marginBottom: "20px" }}>
                                    Operational Business & Delivery Rules
                                </h4>

                                {/* 1. Wallet Minimum Order */}
                                <div className="card p-3 mb-4" style={{ background: "#f8fafc" }}>
                                    <h5 style={{ color: "#1e40af", marginBottom: "8px" }}>Wallet Usage Minimum Order Threshold</h5>
                                    <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "12px" }}>
                                        Customers can apply their wallet balance only when their cart total is at or above this threshold. (Requirement: ₹399)
                                    </p>
                                    <div className="row align-items-center">
                                        <div className="col-md-6 form-group mb-0">
                                            <label><strong>Minimum Order Value (₹):</strong></label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={minWalletOrderValue}
                                                onChange={(e) => setMinWalletOrderValue(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Cashback Mode */}
                                <div className="card p-3 mb-4" style={{ background: "#f8fafc" }}>
                                    <h5 style={{ color: "#1e40af", marginBottom: "8px" }}>Cashback Credit Mode</h5>
                                    <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "12px" }}>
                                        Choose whether order completion promotional cashback credits automatically or queues for Admin review.
                                    </p>
                                    <div className="row">
                                        <div className="col-md-6 form-group mb-0">
                                            <label><strong>Cashback Processing:</strong></label>
                                            <select
                                                className="form-control"
                                                value={cashbackMode}
                                                onChange={(e) => setCashbackMode(e.target.value)}
                                            >
                                                <option value="automatic">Automatic (Instant credit on order completion)</option>
                                                <option value="manual">Manual (Admin must review in Cashback Review queue)</option>
                                                <option value="disabled">Disabled</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Long Distance Delivery Fee */}
                                <div className="card p-3 mb-4" style={{ background: "#f8fafc" }}>
                                    <h5 style={{ color: "#1e40af", marginBottom: "8px" }}>Long-Distance Extra Delivery Charge</h5>
                                    <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "12px" }}>
                                        Automatically adds an extra delivery charge to the order when customer delivery distance exceeds threshold.
                                    </p>
                                    <div className="form-check mb-3">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="longDistanceCheck"
                                            checked={longDistanceEnabled}
                                            onChange={(e) => setLongDistanceEnabled(e.target.checked)}
                                        />
                                        <label className="form-check-label font-weight-bold" htmlFor="longDistanceCheck">
                                            Enable Long-Distance Extra Delivery Charge
                                        </label>
                                    </div>
                                    {longDistanceEnabled && (
                                        <div className="row">
                                            <div className="col-md-6 form-group">
                                                <label><strong>Distance Threshold (Kilometers):</strong></label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    className="form-control"
                                                    value={longDistanceThreshold}
                                                    onChange={(e) => setLongDistanceThreshold(e.target.value)}
                                                    placeholder="e.g. 8"
                                                />
                                            </div>
                                            <div className="col-md-6 form-group">
                                                <label><strong>Extra Long-Distance Fee (₹):</strong></label>
                                                <input
                                                    type="number"
                                                    step="1"
                                                    className="form-control"
                                                    value={longDistanceFee}
                                                    onChange={(e) => setLongDistanceFee(e.target.value)}
                                                    placeholder="e.g. 40"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 4. Large Cart Extra Delivery Time */}
                                <div className="card p-3 mb-4" style={{ background: "#f8fafc" }}>
                                    <h5 style={{ color: "#1e40af", marginBottom: "8px" }}>Large Cart Delivery Time Buffers</h5>
                                    <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "12px" }}>
                                        Dynamically adjusts estimated delivery time for large customer carts (e.g. 10 items +5 mins, 20 items +10 mins).
                                    </p>
                                    <div className="row">
                                        <div className="col-md-3 form-group">
                                            <label>Tier 1 Item Count:</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={largeCartThreshold1Items}
                                                onChange={(e) => setLargeCartThreshold1Items(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-3 form-group">
                                            <label>Tier 1 Extra Mins:</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={largeCartThreshold1Minutes}
                                                onChange={(e) => setLargeCartThreshold1Minutes(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-3 form-group">
                                            <label>Tier 2 Item Count:</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={largeCartThreshold2Items}
                                                onChange={(e) => setLargeCartThreshold2Items(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-3 form-group">
                                            <label>Tier 2 Extra Mins:</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={largeCartThreshold2Minutes}
                                                onChange={(e) => setLargeCartThreshold2Minutes(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 5. Delivery App Visibility Controls */}
                                <div className="card p-3 mb-4" style={{ background: "#f8fafc" }}>
                                    <h5 style={{ color: "#1e40af", marginBottom: "8px" }}>Delivery App Data Visibility Controls</h5>
                                    <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "12px" }}>
                                        Control whether delivery personnel can view sensitive customer address and full item lists. Enforced server-side.
                                    </p>
                                    <div className="row">
                                        <div className="col-md-6 form-group">
                                            <div className="form-check">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="addressVisibilityCheck"
                                                    checked={deliveryAddressVisibility}
                                                    onChange={(e) => setDeliveryAddressVisibility(e.target.checked)}
                                                />
                                                <label className="form-check-label font-weight-bold" htmlFor="addressVisibilityCheck">
                                                    Customer Address Visible in Delivery App
                                                </label>
                                            </div>
                                            <small className="text-muted">If unchecked, delivery address is withheld by backend.</small>
                                        </div>
                                        <div className="col-md-6 form-group">
                                            <div className="form-check">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="productVisibilityCheck"
                                                    checked={deliveryProductListVisibility}
                                                    onChange={(e) => setDeliveryProductListVisibility(e.target.checked)}
                                                />
                                                <label className="form-check-label font-weight-bold" htmlFor="productVisibilityCheck">
                                                    Product List Visible in Delivery App
                                                </label>
                                            </div>
                                            <small className="text-muted">If unchecked, order product contents are withheld by backend.</small>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    disabled={savingToggles}
                                    style={{ alignSelf: "flex-start", minWidth: "220px" }}
                                >
                                    <FaSave className="mr-2" /> {savingToggles ? "Saving Settings..." : "Save All Business Rules"}
                                </button>
                            </form>
                        ) : activeTab === "delivery-eta" ? (
                            <DeliveryETASettingsTab />
                        ) : activeTab === "referrals" ? (
                            <ReferralSettingsTab />
                        ) : (
                            <>
                                <div className={dashboardclasses["customer-form"]} style={{ marginBottom: "15px" }}>
                                    <input
                                        type="text"
                                        placeholder="Search by Key..."
                                        onChange={searchHandler}
                                    />
                                </div>
                                <div className="category-table">
                                    <BootstrapTable
                                        bootstrap4
                                        keyField="ID"
                                        data={categorysearchItems}
                                        columns={columns}
                                        pagination={paginationFactory({ sizePerPage: 10, hideSizePerPage: true })}
                                        wrapperClasses="table-responsive"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default SettingsPage;
