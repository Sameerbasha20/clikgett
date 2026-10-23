'use strict';
const moment = require('moment');

// Timestamps are stored as UTC "YYYY-MM-DD HH:mm:ss". The admin sends exact instants
// ("2026-10-23T18:30:00.000Z" = 24 Oct, 00:00 IST); MySQL won't take the "Z" form.
// Values without a zone are read as UTC, as before.
const toDbTime = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const m = moment.utc(value);
    return m.isValid() ? m.format('YYYY-MM-DD HH:mm:ss') : null;
};

module.exports = { toDbTime };
