// Whether the store takes orders right now.
//
// The weekly timings (OrderTimings, IST) are the schedule. The admin can
// override it from the Store Timings page:
//   AUTO   - follow the timings (default)
//   OPEN   - open now, whatever the timings say
//   CLOSED - closed now, whatever the timings say
// An override can carry StoreModeUntil (UTC); once that passes the store is
// back on the timings. Nothing needs to run at that moment: it is checked on
// every read.
const pool = require('../utils/db');

const IST_OFFSET_MIN = 330;
const DAY_MIN = 24 * 60;
const MODES = ['AUTO', 'OPEN', 'CLOSED'];

const query = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

// Accepts "HH:MM:SS" and "HH:MM" (the admin timings page saves the latter).
const toMinutes = (time) => {
    const [h = 0, m = 0, s = 0] = String(time).split(':').map((x) => parseInt(x, 10) || 0);
    return h * 60 + m + s / 60;
};

// Minutes since IST midnight for a Date.
const istMinutes = (date) => {
    const utcMin = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
    return (utcMin + IST_OFFSET_MIN) % DAY_MIN;
};

// A slot whose end is before its start runs past midnight (22:00-02:00).
const inSlot = (min, slot) => (slot.start <= slot.end
    ? min >= slot.start && min <= slot.end
    : min >= slot.start || min <= slot.end);

const openBySchedule = (slots, min) => slots.some((slot) => inSlot(min, slot));

// The next moment the schedule flips between open and closed, or null when it never does.
const nextScheduleChange = (slots, now) => {
    if (!slots.length) return null;
    const min = istMinutes(now);
    const current = openBySchedule(slots, min);
    const deltas = [...new Set(slots.flatMap((s) => [s.start, s.end + 1 / 60]))]
        .map((b) => ((b - min) % DAY_MIN + DAY_MIN) % DAY_MIN)
        .filter((d) => d > 0)
        .sort((a, b) => a - b);
    for (const d of deltas) {
        if (openBySchedule(slots, (min + d) % DAY_MIN) !== current) {
            return new Date(now.getTime() + Math.round(d * 60) * 1000);
        }
    }
    return null;
};

// "8:00 AM", or "tomorrow 8:00 AM" when it is not today in IST.
const formatIst = (date, now) => {
    if (!date) return null;
    const ist = new Date(date.getTime() + IST_OFFSET_MIN * 60000);
    const istNow = new Date(now.getTime() + IST_OFFSET_MIN * 60000);
    let h = ist.getUTCHours();
    const m = String(ist.getUTCMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const sameDay = ist.getUTCDate() === istNow.getUTCDate();
    return `${sameDay ? '' : 'tomorrow '}${h}:${m} ${ampm}`;
};

// "at 8:00 AM" / "tomorrow at 8:00 AM", for sentences like "Opens tomorrow at 8:00 AM".
const atPhrase = (label) => (!label ? null
    : label.startsWith('tomorrow ') ? `tomorrow at ${label.slice(9)}` : `at ${label}`);

async function getState(now = new Date()) {
    const [settings] = await query('SELECT SettingID, ShopStatus, StoreMode, StoreModeUntil FROM AdminShopToggleSettings LIMIT 1');
    const timings = await query('SELECT TimingID, StartTime, EndTime FROM OrderTimings WHERE Status = 1 ORDER BY StartTime');
    const slots = timings.map((t) => ({ start: toMinutes(t.StartTime), end: toMinutes(t.EndTime) }));

    let mode = MODES.includes(settings && settings.StoreMode) ? settings.StoreMode : 'AUTO';
    let until = settings && settings.StoreModeUntil ? new Date(settings.StoreModeUntil) : null;
    if (mode !== 'AUTO' && until && until <= now) {
        mode = 'AUTO';
        until = null;
    }

    const scheduleOpen = openBySchedule(slots, istMinutes(now));
    const isOpen = mode === 'OPEN' ? true : mode === 'CLOSED' ? false : scheduleOpen;

    // When the open/closed state will next change, as far as we know.
    let changeAt;
    if (mode === 'AUTO') {
        changeAt = nextScheduleChange(slots, now);
    } else if (until) {
        const backOnSchedule = openBySchedule(slots, istMinutes(until));
        changeAt = backOnSchedule === isOpen ? nextScheduleChange(slots, until) : until;
    } else {
        changeAt = null;
    }

    return {
        isOpen,
        mode,
        modeUntil: until,
        scheduleOpen,
        hasTimings: slots.length > 0,
        changeAt,
        changeAtLabel: formatIst(changeAt, now),
        changeAtPhrase: atPhrase(formatIst(changeAt, now)),
        timings,
        settingId: settings ? settings.SettingID : 1,
    };
}

// Customer-facing wording, shared by the app banner and order placement.
const customerMessage = (state) => {
    if (state.isOpen) return "We're available now";
    return "We're closed now";
};

const opensAtText = (state) => (state.isOpen || !state.changeAtPhrase ? null : `We open ${state.changeAtPhrase}`);

// mode: AUTO | OPEN | CLOSED. untilNextChange: switch back to the timings at
// the next scheduled opening/closing instead of staying until changed.
async function setMode(mode, untilNextChange, now = new Date()) {
    if (!MODES.includes(mode)) throw new Error('Mode must be AUTO, OPEN or CLOSED');
    let until = null;
    if (mode !== 'AUTO' && untilNextChange) {
        const timings = await query('SELECT StartTime, EndTime FROM OrderTimings WHERE Status = 1');
        until = nextScheduleChange(timings.map((t) => ({ start: toMinutes(t.StartTime), end: toMinutes(t.EndTime) })), now);
    }
    await query('UPDATE AdminShopToggleSettings SET StoreMode = ?, StoreModeUntil = ?, ShopStatus = ?',
        [mode, until, mode === 'CLOSED' ? 0 : 1]);
    return getState(now);
}

module.exports = { getState, setMode, customerMessage, opensAtText, nextScheduleChange, openBySchedule, MODES };
