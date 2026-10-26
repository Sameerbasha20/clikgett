import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MdOutlineRemoveShoppingCart } from "react-icons/md";
import { Services } from "../../Services";

const POLL_MS = 120000;
const KNOWN_KEY = "knownOutOfStock";

/** Packs already reported this session; null on the session's first check. */
const readKnown = () => {
    try {
        const stored = sessionStorage.getItem(KNOWN_KEY);
        return stored === null ? null : new Set(JSON.parse(stored) || []);
    } catch (e) {
        return null;
    }
};
const saveKnown = (ids) => {
    try {
        sessionStorage.setItem(KNOWN_KEY, JSON.stringify([...ids]));
    } catch (e) { /* private mode: reminders still show in the pill */ }
};

/**
 * Out-of-stock reminder in the top bar: a red count on every admin page, and a
 * toast when a product runs out (once per session for what was already out).
 */
function StockAlert() {
    const navigate = useNavigate();
    const [count, setCount] = useState(0);

    useEffect(() => {
        let stopped = false;
        const check = async () => {
            const res = await Services.getStockAlerts();
            if (stopped || !res || res.Status !== 1) return;
            setCount(res.OutOfStock || 0);
            const ids = new Set(res.VariantIDs || (res.Items || []).map((i) => i.VariantID));
            const known = readKnown();
            const goToStock = () => navigate("/stock?filter=OUT");
            if (known === null) {
                // First check this session: one summary for what is already out.
                if (res.OutOfStock > 0) {
                    toast.warn(`${res.OutOfStock} product pack${res.OutOfStock === 1 ? " is" : "s are"} out of stock. Tap to restock.`,
                        { position: "top-right", autoClose: 8000, onClick: goToStock, toastId: "stock-summary" });
                }
            } else {
                const freshIds = [...ids].filter((id) => !known.has(id));
                if (freshIds.length) {
                    const named = (res.Items || []).filter((i) => freshIds.includes(i.VariantID)).slice(0, 3);
                    const label = (i) => (i.Unit ? `${i.ProductName} (${i.Unit})` : i.ProductName);
                    const names = named.length ? named.map(label).join(", ") : `${freshIds.length} pack${freshIds.length === 1 ? "" : "s"}`;
                    const more = freshIds.length > named.length && named.length ? ` and ${freshIds.length - named.length} more` : "";
                    toast.error(`Just ran out: ${names}${more}. Tap to restock.`,
                        { position: "top-right", autoClose: false, onClick: goToStock });
                }
            }
            saveKnown(ids);
        };
        check();
        const t = setInterval(check, POLL_MS);
        return () => {
            stopped = true;
            clearInterval(t);
        };
    }, [navigate]);

    if (!count) return null;
    return (
        <button
            type="button"
            title="Products out of stock"
            onClick={() => navigate("/stock?filter=OUT")}
            style={{
                display: "flex", alignItems: "center", gap: 6, border: "none", borderRadius: 20,
                padding: "6px 12px", marginRight: 12, background: "#fee2e2", color: "#b91c1c", fontWeight: 700, cursor: "pointer",
            }}
        >
            <MdOutlineRemoveShoppingCart size={18} />
            {count} out of stock
        </button>
    );
}

export default StockAlert;
