const express = require('express');
const router = express.Router();
const ProductRestrictionsController = require('../controllers/ProductRestrictions');
const util = require('../utils/utils');

router
    .get('/restrictions', util.authenticate.adminAuthenticate, ProductRestrictionsController.getRestrictions)
    .post('/restrictions', util.authenticate.adminAuthenticate, ProductRestrictionsController.addRestriction)
    .put('/restrictions/:ID', util.authenticate.adminAuthenticate, ProductRestrictionsController.updateRestriction)
    .delete('/restrictions/:ID', util.authenticate.adminAuthenticate, ProductRestrictionsController.deleteRestriction)
    .post('/save-product-restrictions', util.authenticate.adminAuthenticate, ProductRestrictionsController.saveProductRestrictions)
    .post('/restrictions/save-product-restrictions', util.authenticate.adminAuthenticate, ProductRestrictionsController.saveProductRestrictions);

module.exports = router;
