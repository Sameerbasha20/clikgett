'use strict';

const express = require('express');
const router = express.Router();
const photoOrdersController = require('../controllers/PhotoOrders');
const util = require('../utils/utils');

// Customer Photo Orders Endpoints
router
    .post('/submit', util.authenticate.userAuthenticate, photoOrdersController.submitRequest)
    .get('/my-requests', util.authenticate.userAuthenticate, photoOrdersController.getMyRequests)
    .get('/request/:id', util.authenticate.userAuthenticate, photoOrdersController.getRequestDetail)
    .get('/image/:id', util.authenticate.userAuthenticate, photoOrdersController.getSecureImage)
    .post('/request/:id/confirm', util.authenticate.userAuthenticate, photoOrdersController.confirmProposal)
    .post('/request/:id/reject', util.authenticate.userAuthenticate, photoOrdersController.rejectProposal);

module.exports = router;
