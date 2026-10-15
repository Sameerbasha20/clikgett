const express = require('express');
const router = express.Router();
const MembershipController = require('../controllers/Membership');
const util = require('../utils/utils');

router
    .get('/plans', util.authenticate.adminAuthenticate, MembershipController.getPlans)
    .get('/product/:productId', util.authenticate.adminAuthenticate, MembershipController.getProductPricing)
    .post('/product/save', util.authenticate.adminAuthenticate, MembershipController.saveProductPricing)
    .post('/save-product-pricing', util.authenticate.adminAuthenticate, MembershipController.saveProductPricing)
    .post('/product/delete', util.authenticate.adminAuthenticate, MembershipController.deleteProductPricing)
    .delete('/product/:productId/:planId', util.authenticate.adminAuthenticate, MembershipController.deleteProductPricing);

module.exports = router;
