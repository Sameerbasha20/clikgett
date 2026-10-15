const express = require('express');
const router = express.Router();
const AdminCostOverviewController = require('../controllers/AdminCostOverview');
const util = require('../utils/utils');

router.get('/cost-overview', util.authenticate.adminAuthenticate, AdminCostOverviewController.getCostOverview);

module.exports = router;
