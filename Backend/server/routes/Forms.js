const express = require('express');
const router = express.Router();
const formsController = require('../controllers/Forms');
const util = require('../utils/utils');

router
    // Callback forms
    .get('/callback', util.authenticate.adminAuthenticate, formsController.getCallbackForms)
    .get('/callbackforms', util.authenticate.adminAuthenticate, formsController.getCallbackForms)
    .get('/callback/:id', util.authenticate.adminAuthenticate, formsController.getCallbackById)
    .post('/callback/status', util.authenticate.adminAuthenticate, formsController.updateCallbackStatus)
    .put('/callback/:id', util.authenticate.adminAuthenticate, formsController.updateCallbackStatus)
    .put('/callbackforms/:id', util.authenticate.adminAuthenticate, formsController.updateCallbackStatus)
    .put('/updatecallback/:id', util.authenticate.adminAuthenticate, formsController.updateCallbackStatus)

    // Franchise enquiry forms
    .get('/franchise', util.authenticate.adminAuthenticate, formsController.getFranchiseForms)
    .get('/franchiseEnquiryforms', util.authenticate.adminAuthenticate, formsController.getFranchiseForms)
    .get('/franchise/:id', util.authenticate.adminAuthenticate, formsController.getFranchiseById)
    .post('/franchise/status', util.authenticate.adminAuthenticate, formsController.updateFranchiseStatus)
    .put('/franchise/:id', util.authenticate.adminAuthenticate, formsController.updateFranchiseStatus)
    .put('/franchiseEnquiryforms/:id', util.authenticate.adminAuthenticate, formsController.updateFranchiseStatus)
    .put('/updatefranchise/:id', util.authenticate.adminAuthenticate, formsController.updateFranchiseStatus)

    // Availability forms
    .get('/availability', util.authenticate.adminAuthenticate, formsController.getAvailabilityForms)
    .get('/availabilityforms', util.authenticate.adminAuthenticate, formsController.getAvailabilityForms)
    .get('/availability/:id', util.authenticate.adminAuthenticate, formsController.getAvailabilityById)
    .post('/availability/status', util.authenticate.adminAuthenticate, formsController.updateAvailabilityStatus)
    .put('/availability/:id', util.authenticate.adminAuthenticate, formsController.updateAvailabilityStatus)
    .put('/availabilityforms/:id', util.authenticate.adminAuthenticate, formsController.updateAvailabilityStatus)
    .put('/updateavailability/:id', util.authenticate.adminAuthenticate, formsController.updateAvailabilityStatus);

module.exports = router;
