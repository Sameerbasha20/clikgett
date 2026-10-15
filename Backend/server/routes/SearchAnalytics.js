const express = require('express');
const router = express.Router();
const SearchAnalyticsController = require('../controllers/SearchAnalytics');
const util = require('../utils/utils');

router.get('/admin', util.authenticate.adminAuthenticate, SearchAnalyticsController.getAnalytics);
router.get('/keywords', util.authenticate.adminAuthenticate, SearchAnalyticsController.getAnalytics);
router.get('/keyword-users', util.authenticate.adminAuthenticate, SearchAnalyticsController.getKeywordUsers);

module.exports = router;
