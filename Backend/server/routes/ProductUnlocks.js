const express = require('express');
const router = express.Router();
const ProductUnlocksController = require('../controllers/ProductUnlocks');
const util = require('../utils/utils');

router
    .get('/admin', util.authenticate.adminAuthenticate, ProductUnlocksController.getUnlocks)
    .post('/admin', util.authenticate.adminAuthenticate, ProductUnlocksController.createUnlock)
    .put('/admin/:UnlockID', util.authenticate.adminAuthenticate, ProductUnlocksController.updateUnlock)
    .delete('/admin/:UnlockID', util.authenticate.adminAuthenticate, ProductUnlocksController.deleteUnlock)
    .get('/unlocks', util.authenticate.adminAuthenticate, ProductUnlocksController.getUnlocks)
    .post('/unlocks', util.authenticate.adminAuthenticate, ProductUnlocksController.createUnlock)
    .put('/unlocks/:UnlockID', util.authenticate.adminAuthenticate, ProductUnlocksController.updateUnlock)
    .delete('/unlocks/:UnlockID', util.authenticate.adminAuthenticate, ProductUnlocksController.deleteUnlock)
    .get('/list', ProductUnlocksController.getUnlocks);

module.exports = router;
