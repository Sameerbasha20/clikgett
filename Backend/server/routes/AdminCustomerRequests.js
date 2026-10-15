'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/CustomerRequests');
const util = require('../utils/utils');

// Admin Customer Enquiries & Product Requests
router
    .get('/customer-enquiries', util.authenticate.adminAuthenticate, controller.adminListEnquiries)
    .put('/customer-enquiries/:id/status', util.authenticate.adminAuthenticate, controller.adminUpdateEnquiryStatus)
    .get('/customer-enquiries/image/:id', util.authenticate.adminAuthenticate, controller.getSecureEnquiryImage)

    .get('/product-requests', util.authenticate.adminAuthenticate, controller.adminListProductRequests)
    .put('/product-requests/:id/status', util.authenticate.adminAuthenticate, controller.adminUpdateProductRequestStatus)
    .post('/product-requests/:id/notify', util.authenticate.adminAuthenticate, controller.adminTriggerProductNotification)
    .get('/product-requests/image/:id', util.authenticate.adminAuthenticate, controller.getSecureProductRequestImage);

module.exports = router;
