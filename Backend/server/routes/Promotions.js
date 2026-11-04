const express = require('express');
const router = express.Router();
const Promotions = require('../controllers/Promotions');
const util = require('../utils/utils');

const admin = util.authenticate.adminAuthenticate;

router
    .get('/welcome', util.authenticate.optionalUserAuthenticate, Promotions.welcome)
    .get('/price-compare', util.authenticate.optionalUserAuthenticate, Promotions.priceCompareProducts)
    .get('/admin/welcome', admin, Promotions.adminWelcome)
    .put('/admin/welcome', admin, Promotions.adminSaveWelcome)
    .get('/admin/products', admin, Promotions.adminProductSearch)
    .get('/admin/price-compare', admin, Promotions.adminPriceCompare)
    .post('/admin/price-compare', admin, Promotions.adminAddPriceCompare)
    .post('/admin/price-compare/order', admin, Promotions.adminOrderPriceCompare)
    .put('/admin/price-compare/:id', admin, Promotions.adminUpdatePriceCompare)
    .delete('/admin/price-compare/:id', admin, Promotions.adminDeletePriceCompare);

module.exports = router;
