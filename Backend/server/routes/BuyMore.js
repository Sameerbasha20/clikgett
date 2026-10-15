const express = require('express');
const router = express.Router();
const BuyMoreController = require('../controllers/BuyMore');
const util = require('../utils/utils');

router
    .get('/tiers', util.authenticate.adminAuthenticate, BuyMoreController.getTiers)
    .get('/tiers/:ProductID', util.authenticate.adminAuthenticate, (req, res, next) => {
        req.query.ProductID = req.params.ProductID;
        return BuyMoreController.getTiers(req, res);
    })
    .post('/tiers', util.authenticate.adminAuthenticate, BuyMoreController.addTier)
    .post('/save-product-tiers', util.authenticate.adminAuthenticate, BuyMoreController.saveProductTiers)
    .put('/tiers/:ID', util.authenticate.adminAuthenticate, BuyMoreController.updateTier)
    .put('/tiers/status/:ID', util.authenticate.adminAuthenticate, BuyMoreController.toggleStatus)
    .patch('/tiers/:ID/status', util.authenticate.adminAuthenticate, BuyMoreController.toggleStatus)
    .delete('/tiers/:ID', util.authenticate.adminAuthenticate, BuyMoreController.deleteTier);

module.exports = router;
