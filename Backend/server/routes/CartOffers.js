const express = require('express');
const router = express.Router();
const CartOffersController = require('../controllers/CartOffers');
const util = require('../utils/utils');

router
    .get('/offers', util.authenticate.adminAuthenticate, CartOffersController.getOffers)
    .post('/offers', util.authenticate.adminAuthenticate, CartOffersController.createOffer)
    .put('/offers/:OfferID', util.authenticate.adminAuthenticate, CartOffersController.updateOffer)
    .put('/offers/status/:OfferID', util.authenticate.adminAuthenticate, CartOffersController.toggleStatus)
    .delete('/offers/:OfferID', util.authenticate.adminAuthenticate, CartOffersController.deleteOffer);

module.exports = router;
