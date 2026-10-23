import React from "react";
import { NavLink } from "react-router-dom";

// "Customer Requests" in the side menu: product requests and support enquiries are two
// tabs of one section (a product request is never shown as an enquiry).
const tabs = [
    { to: "/product-requests", label: "Product requests" },
    { to: "/customer-enquiries", label: "Support enquiries" },
];

export default function RequestTabs() {
    return (
        <div role="tablist" style={{ display: "flex", gap: "6px", borderBottom: "1px solid #e2e8f0", marginBottom: "1.25rem" }}>
            {tabs.map((t) => (
                <NavLink
                    key={t.to}
                    to={t.to}
                    role="tab"
                    style={({ isActive }) => ({
                        padding: "8px 16px",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        textDecoration: "none",
                        color: isActive ? "#0e9f6e" : "#64748b",
                        borderBottom: isActive ? "3px solid #0e9f6e" : "3px solid transparent",
                        marginBottom: "-1px",
                    })}
                >
                    {t.label}
                </NavLink>
            ))}
        </div>
    );
}
