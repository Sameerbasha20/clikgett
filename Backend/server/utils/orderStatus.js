// Single source of truth for order status codes. The admin panel, the customer
// app and the delivery app mirror these values; existing codes are unchanged so
// historical orders keep their meaning.
const ORDER_STATUS = {
    DELIVERED: 1,
    ASSIGNED: 2,
    CANCELLED_BY_STORE: 3,
    CANCELLED_BY_CUSTOMER: 4,
    OUT_FOR_DELIVERY: 5,
    RETURNED: 6,
    ARRIVED: 7,
    RECEIVED: 8,
    PACKING: 9,
};

const STATUS_LABELS = {
    1: 'Delivered',
    2: 'Rider assigned',
    3: 'Cancelled by store',
    4: 'Cancelled by customer',
    5: 'Out for delivery',
    6: 'Returned',
    7: 'Rider arrived',
    8: 'Order received',
    9: 'Packing',
};

const FINAL_STATUSES = [1, 3, 4, 6];
// Statuses during which an order is with (or waiting for) a rider.
const RIDER_ACTIVE_STATUSES = [2, 5, 7];

// Allowed next statuses for each current status. Assignment (-> 2) goes through
// the assign/reassign endpoints, which use the same lifecycle service.
const TRANSITIONS = {
    8: [9, 2, 3, 4],
    9: [2, 3, 4],
    2: [5, 2, 3],
    5: [7, 2, 3, 6],
    7: [1, 2, 3, 6],
};

const canTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);
const isFinal = (status) => FINAL_STATUSES.includes(Number(status));

module.exports = { ORDER_STATUS, STATUS_LABELS, FINAL_STATUSES, RIDER_ACTIVE_STATUSES, TRANSITIONS, canTransition, isFinal };
