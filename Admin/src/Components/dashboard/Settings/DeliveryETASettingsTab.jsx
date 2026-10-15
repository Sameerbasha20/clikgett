import React, { useState, useEffect } from "react";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { FaClock, FaRoute, FaCheckCircle, FaExclamationTriangle, FaSave, FaCalculator } from "react-icons/fa";

function DeliveryETASettingsTab() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);

    // Distance ETA Form State
    const [isEnabled, setIsEnabled] = useState(true);
    const [band1MaxKm, setBand1MaxKm] = useState("3.00");
    const [band1BaseMinutes, setBand1BaseMinutes] = useState("20");
    const [band2MinKm, setBand2MinKm] = useState("3.00");
    const [band2MaxKm, setBand2MaxKm] = useState("5.00");
    const [band2BaseMinutes, setBand2BaseMinutes] = useState("25");
    const [band3MinKm, setBand3MinKm] = useState("5.00");
    const [band3BaseMinutes, setBand3BaseMinutes] = useState("30");
    const [defaultBaseMinutes, setDefaultBaseMinutes] = useState("25");

    // Interactive Preview Calculator
    const [testDistance, setTestDistance] = useState("3.5");

    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    const fetchETARules = () => {
        setLoading(true);
        Services.getETARules("GET", null, token)
            .then((res) => {
                setLoading(false);
                if (res.Status === 1 && res.rules) {
                    const r = res.rules;
                    setIsEnabled(Boolean(r.IsEnabled));
                    setBand1MaxKm(String(r.Band1MaxKm || "3.00"));
                    setBand1BaseMinutes(String(r.Band1BaseMinutes || "20"));
                    setBand2MinKm(String(r.Band2MinKm || "3.00"));
                    setBand2MaxKm(String(r.Band2MaxKm || "5.00"));
                    setBand2BaseMinutes(String(r.Band2BaseMinutes || "25"));
                    setBand3MinKm(String(r.Band3MinKm || "5.00"));
                    setBand3BaseMinutes(String(r.Band3BaseMinutes || "30"));
                    setDefaultBaseMinutes(String(r.DefaultBaseMinutes || "25"));
                }
            })
            .catch((err) => {
                setLoading(false);
                console.error("Error fetching ETA rules:", err);
                toast.error("Failed to load distance-based delivery ETA rules");
            });
    };

    useEffect(() => {
        fetchETARules();
    }, []);

    // Keep threshold boundaries synchronized
    const handleThreshold1Change = (val) => {
        setBand1MaxKm(val);
        setBand2MinKm(val);
    };

    const handleThreshold2Change = (val) => {
        setBand2MaxKm(val);
        setBand3MinKm(val);
    };

    const validateForm = () => {
        const errs = [];
        const b1M = parseFloat(band1MaxKm);
        const b1T = parseInt(band1BaseMinutes, 10);
        const b2Min = parseFloat(band2MinKm);
        const b2Max = parseFloat(band2MaxKm);
        const b2T = parseInt(band2BaseMinutes, 10);
        const b3Min = parseFloat(band3MinKm);
        const b3T = parseInt(band3BaseMinutes, 10);
        const defT = parseInt(defaultBaseMinutes, 10);

        if (isNaN(b1M) || b1M <= 0) errs.push("Band 1 threshold must be greater than 0 km.");
        if (isNaN(b1T) || b1T <= 0) errs.push("Band 1 ETA must be greater than 0 minutes.");
        if (isNaN(b2Min) || b2Min <= 0) errs.push("Band 2 minimum distance must be greater than 0 km.");
        if (isNaN(b2Max) || b2Max <= b2Min) errs.push("Band 2 maximum distance must be greater than Band 2 minimum distance.");
        if (isNaN(b2T) || b2T <= 0) errs.push("Band 2 ETA must be greater than 0 minutes.");
        if (isNaN(b3Min) || b3Min <= 0) errs.push("Band 3 minimum distance must be greater than 0 km.");
        if (isNaN(b3T) || b3T <= 0) errs.push("Band 3 ETA must be greater than 0 minutes.");
        if (isNaN(defT) || defT <= 0) errs.push("Default fallback ETA must be greater than 0 minutes.");

        if (Math.abs(b1M - b2Min) > 0.001) {
            errs.push("Band 1 maximum distance must exactly equal Band 2 minimum distance to avoid coverage gaps.");
        }
        if (Math.abs(b2Max - b3Min) > 0.001) {
            errs.push("Band 2 maximum distance must exactly equal Band 3 minimum distance to avoid coverage gaps.");
        }

        setErrors(errs);
        return errs.length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please correct the validation errors before saving.");
            return;
        }

        setSaving(true);
        const payload = {
            IsEnabled: isEnabled ? 1 : 0,
            Band1MaxKm: parseFloat(band1MaxKm),
            Band1BaseMinutes: parseInt(band1BaseMinutes, 10),
            Band2MinKm: parseFloat(band2MinKm),
            Band2MaxKm: parseFloat(band2MaxKm),
            Band2BaseMinutes: parseInt(band2BaseMinutes, 10),
            Band3MinKm: parseFloat(band3MinKm),
            Band3BaseMinutes: parseInt(band3BaseMinutes, 10),
            DefaultBaseMinutes: parseInt(defaultBaseMinutes, 10),
        };

        Services.updateETARules("PUT", payload, token)
            .then((res) => {
                setSaving(false);
                if (res.Status === 1) {
                    toast.success("Distance-based delivery ETA rules saved successfully!");
                    fetchETARules();
                } else {
                    toast.error(res.Message || "Failed to save delivery ETA rules");
                }
            })
            .catch((err) => {
                setSaving(false);
                console.error("Save error:", err);
                toast.error("Server error saving delivery ETA rules");
            });
    };

    // Calculate test preview
    const calculatePreview = () => {
        const d = parseFloat(testDistance);
        if (isNaN(d) || d < 0) return { minutes: defaultBaseMinutes, band: "Invalid / Fallback" };
        if (!isEnabled) return { minutes: defaultBaseMinutes, band: "Policy Disabled (Default)" };

        const b1M = parseFloat(band1MaxKm);
        const b2Max = parseFloat(band2MaxKm);

        if (d < b1M) {
            return { minutes: band1BaseMinutes, band: `Band 1: Below ${b1M} km` };
        } else if (d <= b2Max) {
            return { minutes: band2BaseMinutes, band: `Band 2: Between ${band2MinKm} km and ${b2Max} km` };
        } else {
            return { minutes: band3BaseMinutes, band: `Band 3: Above ${band3MinKm} km` };
        }
    };

    const previewResult = calculatePreview();

    if (loading) {
        return (
            <div className="card p-4 text-center">
                <p>Loading delivery ETA rules...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="card p-4 shadow-sm" style={{ maxWidth: "960px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: "12px", marginBottom: "20px" }}>
                <div>
                    <h4 style={{ margin: 0, color: "#1e293b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <FaRoute color="#0e9f6e" /> Distance-Based Delivery ETA Configuration
                    </h4>
                    <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                        Configure dynamic base ETAs based on distance between fulfillment store and customer delivery location.
                    </p>
                </div>
                <div className="custom-control custom-switch">
                    <input
                        type="checkbox"
                        className="custom-control-input"
                        id="etaPolicySwitch"
                        checked={isEnabled}
                        onChange={(e) => setIsEnabled(e.target.checked)}
                    />
                    <label className="custom-control-label" htmlFor="etaPolicySwitch" style={{ fontWeight: 600, color: isEnabled ? "#0e9f6e" : "#64748b" }}>
                        {isEnabled ? "Policy Active" : "Policy Disabled"}
                    </label>
                </div>
            </div>

            {errors.length > 0 && (
                <div className="alert alert-danger" style={{ fontSize: "0.88rem" }}>
                    <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <FaExclamationTriangle /> Please resolve the following configuration issues:
                    </div>
                    <ul style={{ margin: "6px 0 0 1.2rem", padding: 0 }}>
                        {errors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Distance Bands Configuration Grid */}
            <div className="row mb-4">
                {/* Band 1: Below 3 km */}
                <div className="col-md-4 mb-3">
                    <div className="card h-100 p-3" style={{ border: "1.5px solid #bbf7d0", background: "#f0fdf4", borderRadius: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#166534", fontWeight: 700, marginBottom: "8px" }}>
                            <FaClock size={14} /> Band 1: Near Distance
                        </div>
                        <div className="form-group mb-2">
                            <label style={{ fontSize: "0.8rem", color: "#374151" }}>Distance Ceiling (km):</label>
                            <div className="input-group input-group-sm">
                                <div className="input-group-prepend"><span className="input-group-text">&lt;</span></div>
                                <input
                                    type="number"
                                    step="0.1"
                                    className="form-control"
                                    value={band1MaxKm}
                                    onChange={(e) => handleThreshold1Change(e.target.value)}
                                    required
                                />
                                <div className="input-group-append"><span className="input-group-text">km</span></div>
                            </div>
                            <small className="form-text text-muted">Initial rule: Below 3 km</small>
                        </div>
                        <div className="form-group mb-0">
                            <label style={{ fontSize: "0.8rem", color: "#374151" }}>Base Delivery ETA:</label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="number"
                                    className="form-control"
                                    value={band1BaseMinutes}
                                    onChange={(e) => setBand1BaseMinutes(e.target.value)}
                                    required
                                />
                                <div className="input-group-append"><span className="input-group-text">mins</span></div>
                            </div>
                            <small className="form-text text-muted">Initial rule: 20 minutes</small>
                        </div>
                    </div>
                </div>

                {/* Band 2: Between 3 km and 5 km */}
                <div className="col-md-4 mb-3">
                    <div className="card h-100 p-3" style={{ border: "1.5px solid #fed7aa", background: "#fff7ed", borderRadius: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#9a3412", fontWeight: 700, marginBottom: "8px" }}>
                            <FaClock size={14} /> Band 2: Mid Range
                        </div>
                        <div className="form-group mb-2">
                            <label style={{ fontSize: "0.8rem", color: "#374151" }}>Distance Range (km):</label>
                            <div className="d-flex align-items-center gap-1">
                                <div className="input-group input-group-sm">
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="form-control"
                                        value={band2MinKm}
                                        disabled
                                        title="Linked to Band 1 ceiling"
                                    />
                                    <div className="input-group-append"><span className="input-group-text">to</span></div>
                                </div>
                                <div className="input-group input-group-sm">
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="form-control"
                                        value={band2MaxKm}
                                        onChange={(e) => handleThreshold2Change(e.target.value)}
                                        required
                                    />
                                    <div className="input-group-append"><span className="input-group-text">km</span></div>
                                </div>
                            </div>
                            <small className="form-text text-muted">Initial rule: 3 km to 5 km</small>
                        </div>
                        <div className="form-group mb-0">
                            <label style={{ fontSize: "0.8rem", color: "#374151" }}>Base Delivery ETA:</label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="number"
                                    className="form-control"
                                    value={band2BaseMinutes}
                                    onChange={(e) => setBand2BaseMinutes(e.target.value)}
                                    required
                                />
                                <div className="input-group-append"><span className="input-group-text">mins</span></div>
                            </div>
                            <small className="form-text text-muted">Explicitly configured (e.g. 25 mins)</small>
                        </div>
                    </div>
                </div>

                {/* Band 3: Above 5 km */}
                <div className="col-md-4 mb-3">
                    <div className="card h-100 p-3" style={{ border: "1.5px solid #bfdbfe", background: "#eff6ff", borderRadius: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#1e40af", fontWeight: 700, marginBottom: "8px" }}>
                            <FaClock size={14} /> Band 3: Far Distance
                        </div>
                        <div className="form-group mb-2">
                            <label style={{ fontSize: "0.8rem", color: "#374151" }}>Distance Floor (km):</label>
                            <div className="input-group input-group-sm">
                                <div className="input-group-prepend"><span className="input-group-text">&gt;</span></div>
                                <input
                                    type="number"
                                    step="0.1"
                                    className="form-control"
                                    value={band3MinKm}
                                    disabled
                                    title="Linked to Band 2 ceiling"
                                />
                                <div className="input-group-append"><span className="input-group-text">km</span></div>
                            </div>
                            <small className="form-text text-muted">Initial rule: Above 5 km</small>
                        </div>
                        <div className="form-group mb-0">
                            <label style={{ fontSize: "0.8rem", color: "#374151" }}>Base Delivery ETA:</label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="number"
                                    className="form-control"
                                    value={band3BaseMinutes}
                                    onChange={(e) => setBand3BaseMinutes(e.target.value)}
                                    required
                                />
                                <div className="input-group-append"><span className="input-group-text">mins</span></div>
                            </div>
                            <small className="form-text text-muted">Initial rule: 30 minutes</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fallback default ETA */}
            <div className="card p-3 mb-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div className="row align-items-center">
                    <div className="col-md-8">
                        <strong style={{ color: "#334155" }}>Default Fallback Base ETA</strong>
                        <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "0.82rem" }}>
                            Applied if customer delivery address coordinates are missing or when the distance policy is disabled.
                        </p>
                    </div>
                    <div className="col-md-4">
                        <div className="input-group input-group-sm">
                            <input
                                type="number"
                                className="form-control"
                                value={defaultBaseMinutes}
                                onChange={(e) => setDefaultBaseMinutes(e.target.value)}
                                required
                            />
                            <div className="input-group-append"><span className="input-group-text">minutes</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive Distance Simulation Preview */}
            <div className="card p-3 mb-4" style={{ background: "#f1f5f9", border: "1px dashed #cbd5e1", borderRadius: "10px" }}>
                <h6 style={{ color: "#0f172a", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "8px" }}>
                    <FaCalculator color="#0e9f6e" /> Live Distance-to-ETA Rule Simulator
                </h6>
                <div className="row align-items-center">
                    <div className="col-md-5">
                        <label style={{ fontSize: "0.82rem", color: "#475569" }}>Test Customer Distance:</label>
                        <div className="input-group input-group-sm">
                            <input
                                type="number"
                                step="0.1"
                                className="form-control"
                                value={testDistance}
                                onChange={(e) => setTestDistance(e.target.value)}
                            />
                            <div className="input-group-append"><span className="input-group-text">km</span></div>
                        </div>
                    </div>
                    <div className="col-md-7">
                        <div style={{
                            backgroundColor: "#ffffff",
                            padding: "0.6rem 1rem",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <div>
                                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Matched Rule:</span>
                                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>{previewResult.band}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Resulting Base ETA:</span>
                                <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0e9f6e" }}>{previewResult.minutes} mins</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.8rem" }}>
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={fetchETARules}
                    disabled={saving}
                >
                    Reset Changes
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ backgroundColor: "#0e9f6e", borderColor: "#0e9f6e", display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                    <FaSave /> {saving ? "Saving Rules..." : "Save Delivery ETA Rules"}
                </button>
            </div>
        </form>
    );
}

export default DeliveryETASettingsTab;
