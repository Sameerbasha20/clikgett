'use strict';

const express = require('express');
const router = express.Router();
const photoOrdersController = require('../controllers/PhotoOrders');
const util = require('../utils/utils');

// Admin Photo Orders Endpoints
router
    .get('/list', util.authenticate.adminAuthenticate, photoOrdersController.adminListRequests)
    .get('/detail/:id', util.authenticate.adminAuthenticate, photoOrdersController.getRequestDetail)
    .get('/image/:id', util.authenticate.adminAuthenticate, photoOrdersController.getSecureImage)
    .put('/claim/:id', util.authenticate.adminAuthenticate, photoOrdersController.adminClaimRequest)
    .post('/prepare-proposal/:id', util.authenticate.adminAuthenticate, photoOrdersController.adminPrepareProposal)
    .post('/send-proposal/:id', util.authenticate.adminAuthenticate, photoOrdersController.adminSendProposal)
    .post('/cancel/:id', util.authenticate.adminAuthenticate, photoOrdersController.adminCancelRequest);

module.exports = router;
