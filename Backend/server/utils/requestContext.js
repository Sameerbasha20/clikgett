'use strict';
// Per-request values that deep helpers need without threading `req` through every call
// (e.g. ProductDeals personalises member prices for the signed-in customer).
const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

module.exports = {
    /** Express middleware: gives each request its own context. */
    middleware: (req, res, next) => storage.run({}, next),
    setUserId: (userId) => {
        const store = storage.getStore();
        if (store) store.userId = userId || null;
    },
    userId: () => {
        const store = storage.getStore();
        return store ? store.userId || null : null;
    }
};
