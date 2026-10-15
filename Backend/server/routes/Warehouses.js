const express = require('express');
const router = express.Router();
const WarehouseController = require('../controllers/Warehouses');
const util = require('../utils/utils');

router
    .get('/', util.authenticate.adminAuthenticate, WarehouseController.allWarehouses)
    .get('/all', util.authenticate.adminAuthenticate, WarehouseController.allWarehouses)
    .get('/detail/:id', util.authenticate.adminAuthenticate, WarehouseController.warehouseDetail)
    .get('/:id', util.authenticate.adminAuthenticate, WarehouseController.warehouseDetail)
    .post('/add', util.authenticate.adminAuthenticate, WarehouseController.addWarehouse)
    .post('/', util.authenticate.adminAuthenticate, WarehouseController.addWarehouse)
    .put('/update/:id', util.authenticate.adminAuthenticate, WarehouseController.updateWarehouse)
    .put('/:id', util.authenticate.adminAuthenticate, WarehouseController.updateWarehouse)
    .delete('/delete/:id', util.authenticate.adminAuthenticate, WarehouseController.deleteWarehouse)
    .delete('/:id', util.authenticate.adminAuthenticate, WarehouseController.deleteWarehouse);

module.exports = router;
