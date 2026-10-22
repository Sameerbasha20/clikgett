import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Services } from "../../../Services";
import classes from "./StoreStatusCard.module.css";

const MODES = [
    { key: "AUTO", label: "Follow timings", hint: "Open only during the store timings below" },
    { key: "OPEN", label: "Open now", hint: "Take orders even outside the timings" },
    { key: "CLOSED", label: "Close now", hint: "Stop taking orders right away" },
];

const toastOpts = { position: "top-center", autoClose: 1500, hideProgressBar: true };

const formatUntil = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    const today = new Date();
    const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).toUpperCase();
    const sameDay = d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) === today.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
    return sameDay ? time : `tomorrow ${time}`;
};

// Live open/closed state plus the Follow timings / Open now / Close now switch.
// `refreshKey` changes when the timings are edited so the state is re-read.
function StoreStatusCard({ refreshKey }) {
    const [state, setState] = useState(null);
    const [saving, setSaving] = useState(false);
    const [untilNextChange, setUntilNextChange] = useState(true);
    const token = { Authorization: `token ${sessionStorage.getItem("token")}` };

    const load = () => {
        Services.getShopStatus("GET", null, token)
            .then((res) => {
                if (res.status === 1 && res.State) setState(res.State);
            })
            .catch((err) => console.log(err));
    };

    useEffect(() => {
        load();
        const timer = setInterval(load, 60000);
        return () => clearInterval(timer);
        // eslint-disable-next-line
    }, [refreshKey]);

    const choose = (mode) => {
        if (saving || (state && state.mode === "AUTO" && mode === "AUTO")) return;
        setSaving(true);
        Services.setStoreMode("PUT", JSON.stringify({ Mode: mode, UntilNextChange: untilNextChange }), token)
            .then((res) => {
                if (res.Status === 1) {
                    setState(res.State);
                    toast.success(res.Message, toastOpts);
                } else {
                    toast.error(res.Message || "Could not change the store status", toastOpts);
                }
            })
            .catch(() => toast.error("Could not change the store status", toastOpts))
            .finally(() => setSaving(false));
    };

    if (!state) return <div className={classes.card}>Loading store status…</div>;

    const changeLine = (() => {
        if (state.mode !== "AUTO" && !state.modeUntil) {
            return state.isOpen ? "Stays open until you change it" : "Stays closed until you change it";
        }
        if (!state.changeAtPhrase) return state.hasTimings ? "" : "No store timings set";
        return `${state.isOpen ? "Closes" : "Opens"} ${state.changeAtPhrase}`;
    })();

    const modeLine = state.mode === "AUTO"
        ? "Following the store timings"
        : `Manually ${state.mode === "OPEN" ? "opened" : "closed"}${state.modeUntil ? ` · back to the timings at ${formatUntil(state.modeUntil)}` : ""}`;

    return (
        <div className={classes.card}>
            <div className={classes.top}>
                <div>
                    <span className={`${classes.badge} ${state.isOpen ? classes.open : classes.closed}`}>
                        <span className={classes.dot} />
                        {state.isOpen ? "Open now" : "Closed now"}
                    </span>
                    {changeLine && <p className={classes.change}>{changeLine}</p>}
                </div>
                <p className={classes.mode}>{modeLine}</p>
            </div>

            <div className={classes.segment} role="radiogroup" aria-label="Store status">
                {MODES.map((m) => (
                    <button
                        key={m.key}
                        type="button"
                        role="radio"
                        aria-checked={state.mode === m.key}
                        disabled={saving}
                        className={state.mode === m.key ? classes.active : ""}
                        onClick={() => choose(m.key)}
                        title={m.hint}>
                        {m.label}
                    </button>
                ))}
            </div>

            <label className={classes.until}>
                <input
                    type="checkbox"
                    checked={untilNextChange}
                    onChange={(e) => setUntilNextChange(e.target.checked)}
                />
                With Open now / Close now, go back to the timings at the next scheduled opening or closing
            </label>
        </div>
    );
}

export default StoreStatusCard;
