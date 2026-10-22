import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaBell, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { Services } from "../../Services";
import topnavclasses from "./navbar.module.css";

const POLL_MS = 20000;
const LAST_KEY = "lastSeenOrderId";
const UNSEEN_KEY = "unseenNewOrders";
const SOUND_KEY = "orderAlertSound";

const readNumber = (storage, key) => {
    try {
        const v = parseInt(storage.getItem(key), 10);
        return Number.isFinite(v) ? v : null;
    } catch (e) {
        return null;
    }
};

/** Short two-tone chime (no audio file needed). Browsers allow it after the first click on the page. */
const playChime = () => {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        [880, 1320].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(ctx.destination);
            const start = ctx.currentTime + i * 0.22;
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
            osc.start(start);
            osc.stop(start + 0.21);
        });
        setTimeout(() => ctx.close(), 800);
    } catch (e) {
        /* sound is optional */
    }
};

/**
 * Checks for new orders every 20 seconds on every admin page: a toast that opens
 * the order, a chime, and a bell with the count of orders not yet looked at.
 */
function NewOrderAlert() {
    const navigate = useNavigate();
    const [unseen, setUnseen] = useState(() => readNumber(sessionStorage, UNSEEN_KEY) || 0);
    const [soundOn, setSoundOn] = useState(() => {
        try {
            return localStorage.getItem(SOUND_KEY) !== "off";
        } catch (e) {
            return true;
        }
    });
    const soundRef = useRef(soundOn);
    soundRef.current = soundOn;

    useEffect(() => {
        let cancelled = false;
        const check = async () => {
            const last = readNumber(sessionStorage, LAST_KEY);
            try {
                const res = await Services.getNewOrders(last);
                if (cancelled || !res || res.Status !== 1) return;
                if (last == null) {
                    // First check of the session: remember where we are, don't alert old orders.
                    sessionStorage.setItem(LAST_KEY, String(res.LatestOrderID || 0));
                    return;
                }
                const orders = res.Orders || [];
                if (!orders.length) return;
                sessionStorage.setItem(LAST_KEY, String(res.LatestOrderID));
                setUnseen((n) => {
                    const next = n + orders.length;
                    sessionStorage.setItem(UNSEEN_KEY, String(next));
                    return next;
                });
                if (soundRef.current) playChime();
                orders.forEach((o) => {
                    const amount = Math.round(parseFloat(o.GrandTotal) || 0);
                    toast.info(
                        `New order #${o.OrderSequence} · ₹${amount} · ${o.PaymentMethod || "COD"}${o.CustomerName ? ` · ${o.CustomerName}` : ""}`,
                        {
                            position: "top-right",
                            autoClose: 15000,
                            onClick: () => navigate(`/orders/${o.OrderID}`),
                        }
                    );
                });
            } catch (e) {
                /* offline or logged out; try again next tick */
            }
        };
        check();
        const timer = setInterval(check, POLL_MS);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [navigate]);

    useEffect(() => {
        const base = document.title.replace(/^\(\d+\)\s*/, "");
        document.title = unseen > 0 ? `(${unseen}) ${base}` : base;
    }, [unseen]);

    const openOrders = () => {
        setUnseen(0);
        sessionStorage.setItem(UNSEEN_KEY, "0");
        navigate("/orders");
    };

    const toggleSound = () => {
        const next = !soundOn;
        setSoundOn(next);
        try {
            localStorage.setItem(SOUND_KEY, next ? "on" : "off");
        } catch (e) {
            /* per-browser preference only */
        }
        if (next) playChime();
    };

    return (
        <div className={topnavclasses["order-alert"]}>
            <button type="button" title={soundOn ? "New-order sound on" : "New-order sound off"} onClick={toggleSound}>
                {soundOn ? <FaVolumeUp /> : <FaVolumeMute />}
            </button>
            <button type="button" title="New orders" onClick={openOrders}>
                <FaBell />
                {unseen > 0 && <span className={topnavclasses["order-alert-badge"]}>{unseen > 99 ? "99+" : unseen}</span>}
            </button>
        </div>
    );
}

export default NewOrderAlert;
