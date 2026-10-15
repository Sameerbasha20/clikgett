const express = require('express');
const router = express.Router();
const SalesController = require('../controllers/Sales');
const util = require('../utils/utils');

router
    .get('/getsales', SalesController.getActiveSales)
    .get('/all', util.authenticate.adminAuthenticate, SalesController.getAllSales)
    .get('/', util.authenticate.adminAuthenticate, SalesController.getAllSales)
    .get('/details/:id', util.authenticate.adminAuthenticate, SalesController.getSaleDetails)
    .post('/create', util.authenticate.adminAuthenticate, SalesController.createSale)
    .post('/update', util.authenticate.adminAuthenticate, SalesController.updateSale)
    .put('/:id', util.authenticate.adminAuthenticate, SalesController.updateSale)
    .post('/delete', util.authenticate.adminAuthenticate, SalesController.deleteSale)
    .delete('/:id', util.authenticate.adminAuthenticate, SalesController.deleteSale)
    .post('/additems', util.authenticate.adminAuthenticate, SalesController.addSaleItems)
    .post('/removeitem', util.authenticate.adminAuthenticate, SalesController.removeSaleItem)
    .get('/product/:productId', util.authenticate.adminAuthenticate, SalesController.getProductSale)
    .post('/assign-product', util.authenticate.adminAuthenticate, SalesController.assignProductToSale)
    .post('/remove-product', util.authenticate.adminAuthenticate, SalesController.removeProductFromSale);

module.exports = router;
