const express = require('express');
const router = express.Router();
const CashbackAdminController = require('../controllers/CashbackAdmin');
const util = require('../utils/utils');

router
    .get('/pending', util.authenticate.adminAuthenticate, CashbackAdminController.getPendingCashback)
    .post('/approve', util.authenticate.adminAuthenticate, CashbackAdminController.approveCashback)
    .post('/reject', util.authenticate.adminAuthenticate, CashbackAdminController.rejectCashback);

module.exports = router;
