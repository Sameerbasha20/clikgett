import React, { useState } from "react";
import LoginClasses from "./login.module.css";
import LoginLogo from "../../Assets/login/login-office.jpeg";
import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router-dom";
import { Services } from "../../Services";
import { toast } from "react-toastify";
import { FaShieldAlt, FaKey, FaArrowLeft, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

function Login() {
    const Navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    // 2FA state management
    const [is2FAStep, setIs2FAStep] = useState(false);
    const [twoFactorToken, setTwoFactorToken] = useState("");
    const [demoOtp, setDemoOtp] = useState("");
    const [isSetupMode, setIsSetupMode] = useState(false);
    const [setupSecret, setSetupSecret] = useState("");
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [verificationCode, setVerificationCode] = useState("");
    const [useRecovery, setUseRecovery] = useState(false);
    const [recoveryCodeInput, setRecoveryCodeInput] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [copiedSecret, setCopiedSecret] = useState(false);
    const [copiedCodes, setCopiedCodes] = useState(false);

    const onSubmit = (data) => {
        const body = JSON.stringify(data);
        Services.login("POST", body)
            .then((response) => {
                console.log("Login primary response:", response);
                if (response.Status === 1) {
                    if (response.require2FA) {
                        // 2FA required - transition to 2FA challenge screen
                        setTwoFactorToken(response.twoFactorToken);
                        setDemoOtp(response.demoOtp || "");
                        setIsSetupMode(Boolean(response.isSetup));
                        setSetupSecret(response.secret || "");
                        setRecoveryCodes(response.recoveryCodes || []);
                        setIs2FAStep(true);
                        toast.info("Please complete Two-Factor Authentication (2FA)", {
                            position: "top-center",
                            autoClose: 2500,
                        });
                    } else if (response.token) {
                        // Fallback if 2FA was already completed
                        sessionStorage.setItem("admindata", JSON.stringify(response?.userDetails));
                        sessionStorage.setItem("token", response?.token);
                        Navigate("/orders");
                    }
                } else if (response.Status === 0) {
                    toast.error(response.Message || "Login failed", {
                        position: "top-center",
                        autoClose: 2000,
                        hideProgressBar: true,
                    });
                }
            })
            .catch((err) => {
                console.error("Login error:", err);
                toast.error("Something went wrong, please try again");
            });
    };

    const handleVerify2FA = (e) => {
        e.preventDefault();
        if (!useRecovery && (!verificationCode || verificationCode.trim().length !== 6)) {
            toast.error("Please enter a valid 6-digit verification code");
            return;
        }
        if (useRecovery && !recoveryCodeInput.trim()) {
            toast.error("Please enter your emergency recovery code");
            return;
        }

        setVerifying(true);
        const payload = {
            twoFactorToken,
            code: useRecovery ? undefined : verificationCode.trim(),
            recoveryCode: useRecovery ? recoveryCodeInput.trim() : undefined,
        };

        Services.verify2FA("POST", payload)
            .then((res) => {
                setVerifying(false);
                if (res.Status === 1 && res.token) {
                    sessionStorage.setItem("admindata", JSON.stringify(res.userDetails));
                    sessionStorage.setItem("token", res.token);
                    toast.success("Authentication successful! Welcome to Admin Portal.", {
                        position: "top-center",
                        autoClose: 1500,
                    });
                    Navigate("/orders");
                } else {
                    toast.error(res.Message || "Verification failed. Please try again.");
                }
            })
            .catch((err) => {
                setVerifying(false);
                console.error("2FA verification error:", err);
                toast.error("Error verifying code. Please try again.");
            });
    };

    const handleCopySecret = () => {
        if (setupSecret) {
            navigator.clipboard.writeText(setupSecret);
            setCopiedSecret(true);
            setTimeout(() => setCopiedSecret(false), 2000);
            toast.success("Secret key copied to clipboard!");
        }
    };

    const handleCopyRecoveryCodes = () => {
        if (recoveryCodes && recoveryCodes.length > 0) {
            navigator.clipboard.writeText(recoveryCodes.join("\n"));
            setCopiedCodes(true);
            setTimeout(() => setCopiedCodes(false), 2000);
            toast.success("Recovery codes copied to clipboard!");
        }
    };

    const resetToLogin = () => {
        setIs2FAStep(false);
        setTwoFactorToken("");
        setDemoOtp("");
        setVerificationCode("");
        setRecoveryCodeInput("");
        setUseRecovery(false);
    };

    return (
        <div className={LoginClasses["login-wrapper"]}>
            <div className={LoginClasses["login-subwrapper"]}>
                <img src={LoginLogo} alt="login-logo" />

                <div className={LoginClasses["login-form"]}>
                    {!is2FAStep ? (
                        <>
                            <h3>Admin Login</h3>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className={LoginClasses["form-control"]}>
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="admin@clikgett.com"
                                        {...register("EmailID", {
                                            required: "Email is required!",
                                        })}
                                    />
                                    {errors?.EmailID && (
                                        <p className={LoginClasses.error}>
                                            {errors?.EmailID?.message}
                                        </p>
                                    )}
                                </div>
                                <div className={LoginClasses["form-control"]}>
                                    <label htmlFor="password">Password</label>
                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        {...register("Password", {
                                            required: "Password is required!",
                                        })}
                                    />
                                    {errors?.Password && (
                                        <p className={LoginClasses.error}>
                                            {errors?.Password?.message}
                                        </p>
                                    )}
                                </div>
                                <input type="submit" value="Log In" />
                                <span className={LoginClasses.border}></span>
                            </form>

                            <div className={LoginClasses["login-links"]}>
                                <NavLink to="/forgotpassword">
                                    Forgot your Password?
                                </NavLink>
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: "0 2.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.8rem" }}>
                                <FaShieldAlt color="#0e9f6e" size={24} />
                                <h3 style={{ margin: 0, padding: 0, fontSize: "1.5rem" }}>Two-Factor Verification</h3>
                            </div>

                            {demoOtp && (
                                <div style={{
                                    backgroundColor: "#fffbeb",
                                    border: "1px solid #fde68a",
                                    borderRadius: "8px",
                                    padding: "0.8rem",
                                    marginBottom: "1rem",
                                    fontSize: "0.85rem"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                                        <span style={{ fontWeight: 700, color: "#92400e", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                            <FaExclamationTriangle color="#d97706" /> Development Demo OTP Active
                                        </span>
                                        <span style={{ fontSize: "0.68rem", backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #f59e0b", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: 700 }}>
                                            DEV ONLY
                                        </span>
                                    </div>
                                    <p style={{ margin: "0 0 0.5rem 0", color: "#78350f", fontSize: "0.8rem", lineHeight: "1.3" }}>
                                        Email delivery (SMTP/Brevo) is pending. Temporary demo OTP is enabled for local development:
                                    </p>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", backgroundColor: "#ffffff", padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid #fcd34d" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <span style={{ fontSize: "0.8rem", color: "#78350f", fontWeight: 600 }}>Demo Code:</span>
                                            <code style={{
                                                fontSize: "1.2rem",
                                                letterSpacing: "4px",
                                                fontWeight: 800,
                                                color: "#b45309"
                                            }}>
                                                {demoOtp}
                                            </code>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setVerificationCode(demoOtp)}
                                            style={{
                                                padding: "0.3rem 0.7rem",
                                                backgroundColor: "#0e9f6e",
                                                color: "#ffffff",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "0.75rem",
                                                fontWeight: 600
                                            }}
                                        >
                                            Auto-Fill
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isSetupMode && (
                                <div style={{
                                    backgroundColor: "#f0fdf4",
                                    border: "1px solid #bbf7d0",
                                    borderRadius: "8px",
                                    padding: "0.8rem",
                                    marginBottom: "1rem",
                                    fontSize: "0.85rem"
                                }}>
                                    <div style={{ fontWeight: 600, color: "#166534", marginBottom: "0.3rem" }}>
                                        🔐 Mandatory 2FA Setup
                                    </div>
                                    <p style={{ margin: "0 0 0.5rem 0", color: "#374151" }}>
                                        Add this account in your Authenticator App (Google Authenticator, Microsoft Authenticator, or Authy).
                                    </p>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                        <code style={{
                                            backgroundColor: "#ffffff",
                                            padding: "0.3rem 0.6rem",
                                            borderRadius: "4px",
                                            border: "1px solid #d1d5db",
                                            fontSize: "0.85rem",
                                            letterSpacing: "1px",
                                            fontWeight: 700
                                        }}>
                                            {setupSecret}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={handleCopySecret}
                                            style={{
                                                padding: "0.3rem 0.6rem",
                                                backgroundColor: "#0e9f6e",
                                                color: "#ffffff",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "0.75rem"
                                            }}
                                        >
                                            {copiedSecret ? "Copied!" : "Copy Key"}
                                        </button>
                                    </div>
                                    {recoveryCodes.length > 0 && (
                                        <div style={{ marginTop: "0.5rem", borderTop: "1px dashed #cbd5e1", paddingTop: "0.4rem" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ fontSize: "0.75rem", color: "#475569" }}>Emergency Recovery Codes (Save these securely):</span>
                                                <button
                                                    type="button"
                                                    onClick={handleCopyRecoveryCodes}
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "#0e9f6e",
                                                        cursor: "pointer",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    {copiedCodes ? "Copied All" : "Copy Codes"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <form onSubmit={handleVerify2FA} style={{ padding: 0, width: "100%", gap: "1rem" }}>
                                {!useRecovery ? (
                                    <div className={LoginClasses["form-control"]} style={{ width: "100%" }}>
                                        <label htmlFor="totp-code" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                                            6-Digit Authenticator Code
                                        </label>
                                        <input
                                            id="totp-code"
                                            type="text"
                                            maxLength={6}
                                            autoFocus
                                            placeholder="123456"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                                            style={{
                                                letterSpacing: "6px",
                                                fontSize: "1.3rem",
                                                textAlign: "center",
                                                fontWeight: 700
                                            }}
                                        />
                                        <span style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.2rem" }}>
                                            Enter the 6-digit code shown in your authenticator app
                                        </span>
                                    </div>
                                ) : (
                                    <div className={LoginClasses["form-control"]} style={{ width: "100%" }}>
                                        <label htmlFor="recovery-code" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                                            Emergency Recovery Code
                                        </label>
                                        <input
                                            id="recovery-code"
                                            type="text"
                                            placeholder="XXXX-XXXX"
                                            value={recoveryCodeInput}
                                            onChange={(e) => setRecoveryCodeInput(e.target.value.toUpperCase())}
                                            style={{
                                                letterSpacing: "2px",
                                                fontSize: "1.1rem",
                                                textAlign: "center",
                                                fontWeight: 600
                                            }}
                                        />
                                        <span style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.2rem" }}>
                                            Use one of your 8-character single-use emergency backup codes
                                        </span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={verifying}
                                    style={{
                                        width: "100%",
                                        height: "2.8rem",
                                        backgroundColor: "#0e9f6e",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "10px",
                                        fontSize: "1rem",
                                        fontWeight: 600,
                                        cursor: verifying ? "not-allowed" : "pointer",
                                        opacity: verifying ? 0.7 : 1,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.5rem"
                                    }}
                                >
                                    <FaKey size={14} />
                                    {verifying ? "Verifying..." : "Verify & Enter Admin Portal"}
                                </button>
                            </form>

                            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                                <button
                                    type="button"
                                    onClick={() => setUseRecovery(!useRecovery)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#0e9f6e",
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                        padding: 0
                                    }}
                                >
                                    {useRecovery ? "Use Authenticator App Code" : "Lost phone? Use Backup Code"}
                                </button>

                                <button
                                    type="button"
                                    onClick={resetToLogin}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#6b7280",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.3rem",
                                        padding: 0
                                    }}
                                >
                                    <FaArrowLeft size={11} /> Back to Login
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Login;
