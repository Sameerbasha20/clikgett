const express = require('express');
const router = express.Router();
const util = require('../utils/utils');
const controller = require('../controllers/CustomerAccount');

router
    .get('/config', controller.appConfig)
    .get('/referral', util.authenticate.userAuthenticate, controller.referralInfo)
    .get('/membership/plans', util.authenticate.optionalUserAuthenticate, controller.membershipPlans)
    .post('/membership/buy', util.authenticate.userAuthenticate, controller.membershipBuy)
    .post('/membership/confirm', util.authenticate.userAuthenticate, controller.membershipConfirm);

module.exports = router;
