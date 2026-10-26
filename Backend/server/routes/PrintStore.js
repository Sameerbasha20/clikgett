const express = require('express');
const util = require('../utils/utils');
const printController = require('../controllers/PrintStore');

const router = express.Router();

router
    .get('/config', printController.config)
    .post('/upload-url', util.authenticate.userAuthenticate, printController.uploadUrl)
    .post('/files', util.authenticate.userAuthenticate, printController.addFile)
    .post('/cart', util.authenticate.userAuthenticate, printController.addToCart)
    .get('/cart', util.authenticate.userAuthenticate, printController.cart)
    .patch('/cart/:PrintJobID', util.authenticate.userAuthenticate, printController.updateCartJob)
    .delete('/cart/:PrintJobID', util.authenticate.userAuthenticate, printController.removeCartJob)
    .get('/admin/orders/:OrderID', util.authenticate.adminAuthenticate, printController.adminOrderJobs);

module.exports = router;
