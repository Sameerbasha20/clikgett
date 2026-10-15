'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/CustomerRequests');
const util = require('../utils/utils');

// Customer Enquiries
router
    .post('/enquiries', util.authenticate.userAuthenticate, controller.submitEnquiry)
    .get('/enquiries/my', util.authenticate.userAuthenticate, controller.getMyEnquiries)
    .get('/enquiries/image/:id', util.authenticate.userAuthenticate, controller.getSecureEnquiryImage)

// Customer Product Requests (Unavailable products with optional photo)
    .post('/product-requests', util.authenticate.userAuthenticate, controller.submitProductRequest)
    .get('/product-requests/my', util.authenticate.userAuthenticate, controller.getMyProductRequests)
    .get('/product-requests/image/:id', util.authenticate.userAuthenticate, controller.getSecureProductRequestImage);

module.exports = router;
