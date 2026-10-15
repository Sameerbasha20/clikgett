import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { Services } from "../../../Services";

const PRESET_REASONS = [
    "Item out of stock / unavailable",
    "Store temporarily closed / kitchen overload",
    "Delivery partner unavailable in your area",
    "Customer requested order cancellation",
    "Address unserviceable or customer unreachable",
    "Pricing or product catalog discrepancy",
    "Other (Custom Reason)"
];

function CancelOrderModal({ show, onHide, order, token, onSuccess }) {
    const [selectedPreset, setSelectedPreset] = useState(PRESET_REASONS[0]);
    const [customReason, setCustomReason] = useState(PRESET_REASONS[0]);
    const [loading, setLoading] = useState(false);

    const handlePresetChange = (e) => {
        const val = e.target.value;
        setSelectedPreset(val);
        if (val !== "Other (Custom Reason)") {
            setCustomReason(val);
        } else {
            setCustomReason("");
        }
    };

    const handleConfirmCancel = () => {
        const finalReason = customReason ? customReason.trim() : "";
        if (!finalReason) {
            toast.error("Please provide a cancellation reason");
            return;
        }

        const orderId = order?.OrderID || order?.id;
        if (!orderId) {
            toast.error("Invalid Order ID");
            return;
        }

        setLoading(true);
        const payload = {
            OrderStatus: 3,
            UserID: order?.UserID,
            CancellationReason: finalReason
        };

        Services.UpdateOrderDetails("PUT", JSON.stringify(payload), token, orderId)
            .then((res) => {
                setLoading(false);
                if (res.Status === 1) {
                    toast.success(`Order #${orderId} cancelled. Reason recorded & notification sent to customer.`);
                    onHide();
                    if (onSuccess) onSuccess();
                } else {
                    toast.error(res.Message || "Failed to cancel order");
                }
            })
            .catch((err) => {
                setLoading(false);
                toast.error("Error cancelling order");
                console.error(err);
            });
    };

    const displayId = order?.OrderSequence || order?.OrderID || "";

    return (
        <Modal show={show} onHide={onHide} centered backdrop="static">
            <Modal.Header closeButton style={{ background: "#fee2e2", borderBottom: "1px solid #fecaca" }}>
                <Modal.Title style={{ color: "#b91c1c", fontWeight: "700", fontSize: "1.1rem" }}>
                    ⚠️ Cancel Order #{displayId}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: "1.5rem" }}>
                <div className="alert alert-warning py-2 px-3 small mb-3" style={{ borderRadius: "8px" }}>
                    <strong>Notice:</strong> Cancelling this order will restore item stocks, refund any debited wallet balance, and send a notification with your stated reason directly to the customer.
                </div>

                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small text-secondary">
                        Select Standard Cancellation Reason:
                    </Form.Label>
                    <Form.Select
                        value={selectedPreset}
                        onChange={handlePresetChange}
                        style={{ fontSize: "0.9rem" }}
                    >
                        {PRESET_REASONS.map((r, idx) => (
                            <option key={idx} value={r}>
                                {r}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small text-secondary">
                        Cancellation Reason (Dispatched to Customer Notification):
                    </Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Type detailed reason for customer..."
                        style={{ fontSize: "0.9rem" }}
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                <Button variant="secondary" size="sm" onClick={onHide} disabled={loading}>
                    Keep Order Active
                </Button>
                <Button
                    variant="danger"
                    size="sm"
                    className="fw-bold px-3"
                    onClick={handleConfirmCancel}
                    disabled={loading}
                >
                    {loading ? "Cancelling..." : "Confirm & Cancel Order"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default CancelOrderModal;
