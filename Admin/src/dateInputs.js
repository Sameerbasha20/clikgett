// Date pickers in the admin show the browser's local time (IST); the server stores UTC.
// These convert between the two so a "from 24 Oct" offer starts at IST midnight.

const pad = (n) => String(n).padStart(2, "0");

/** "2026-10-24" (IST day) -> UTC instant at the start of that day. */
export const dayStartToUtc = (day) => (day ? new Date(`${day}T00:00:00`).toISOString() : null);

/** "2026-10-24" (IST day) -> UTC instant at the end of that day. */
export const dayEndToUtc = (day) => (day ? new Date(`${day}T23:59:59`).toISOString() : null);

/** "2026-10-24T10:00" from a datetime-local input -> UTC instant. */
export const localDateTimeToUtc = (value) => (value ? new Date(value).toISOString() : null);

/** Server time -> "2026-10-24" for a date input, in local time. */
export const toDateInput = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Server time -> "2026-10-24T10:00" for a datetime-local input, in local time. */
export const toDateTimeInput = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return `${toDateInput(value)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
