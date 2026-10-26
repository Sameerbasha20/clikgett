const express = require('express');
const util = require('../utils/utils');
const stockLevels = require('../controllers/StockLevels');

const router = express.Router();

// Admin Stock page (controllers/StockLevels.js).
router
    .use(util.authenticate.adminAuthenticate)
    .get('/', stockLevels.list)
    .get('/alerts', stockLevels.alerts)
    .post('/:VariantID/add', stockLevels.add);

module.exports = router;
