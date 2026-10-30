const express = require('express');
const router = express.Router();
const util = require('../utils/utils');
const controller = require('../controllers/CustomerAccount');

router
    .get('/config', controller.appConfig)
    .get('/referral', util.authenticate.userAuthenticate, controller.referralInfo)
    .get('/membership/plans', util.authenticate.optionalUserAuthenticate, controller.membershipPlans)
    .post('/membership/buy', util.authenticate.userAuthenticate, controller.membershipBuy)
    .post('/membership/confirm', util.authenticate.userAuthenticate, controller.membershipConfirm)
    .get('/summary', util.authenticate.userAuthenticate, controller.summary)
    .post('/birthday', util.authenticate.userAuthenticate, controller.setBirthday)
    .get('/rewards/settings', util.authenticate.adminAuthenticate, controller.rewardSettings)
    .put('/rewards/settings', util.authenticate.adminAuthenticate, controller.updateRewardSettings)
    .post('/rewards/run', util.authenticate.adminAuthenticate, controller.runRewards);

module.exports = router;
