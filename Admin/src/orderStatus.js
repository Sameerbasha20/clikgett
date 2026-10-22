// Order status codes (Backend utils/orderStatus.js) and the steps an admin may take.
export const STATUS = {
    RECEIVED: 8,
    PACKING: 9,
    ASSIGNED: 2,
    OUT_FOR_DELIVERY: 5,
    ARRIVED: 7,
    DELIVERED: 1,
    CANCELLED_BY_STORE: 3,
    CANCELLED_BY_CUSTOMER: 4,
    RETURNED: 6,
};

export const STATUS_LABEL = {
    8: "Received",
    9: "Packing",
    2: "Rider assigned",
    5: "Out for delivery",
    7: "Arrived",
    1: "Delivered",
    3: "Cancelled by store",
    4: "Cancelled by customer",
    6: "Returned",
};

export const FINAL_STATUSES = [1, 3, 4, 6];
export const isFinal = (s) => FINAL_STATUSES.includes(Number(s));

/**
 * Next steps the server accepts from an admin. Assigning a rider has its own
 * control; once a rider has the order, admin can complete rider steps on their
 * behalf (e.g. the rider's phone died).
 */
export const adminNextSteps = (status) => {
    switch (Number(status)) {
        case 8: return [9, 3];
        case 9: return [3];
        case 2: return [5, 7, 1, 3];
        case 5: return [7, 1, 6, 3];
        case 7: return [1, 6, 3];
        default: return [];
    }
};

const ACTION_LABEL = { 9: "Start packing", 5: "Mark picked up", 7: "Mark arrived", 1: "Mark delivered", 6: "Mark returned", 3: "Cancel order" };

/** <option>s for a status <select>: the current status, then only the valid next steps. */
export const statusOptions = (status) => {
    const current = Number(status);
    return [
        { value: current, label: STATUS_LABEL[current] || `Status ${current}`, disabled: true },
        ...adminNextSteps(current).map((s) => ({ value: s, label: ACTION_LABEL[s], disabled: false })),
    ];
};
