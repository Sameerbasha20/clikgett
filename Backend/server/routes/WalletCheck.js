'use strict';

const express = require('express');
const router = express.Router();
const util = require('../utils/utils');
const WalletCheck = require('../services/WalletCheck');

// Admin dashboard, or an external daily scheduler with the x-cron-secret header.
router.get('/', util.authenticate.cronOrAdminAuthenticate, async (req, resp) => {
    try {
        return resp.json(await WalletCheck.run(req.query.days));
    } catch (err) {
        console.error('Wallet check failed:', err);
        return resp.status(500).json({ Status: 0, Message: 'Wallet check failed' });
    }
});

module.exports = router;
