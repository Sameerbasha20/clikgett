const csvcontroller=require("../controllers/Productcsv")
const express = require('express'); 
const router = express.Router();
const util=require("../utils/utils")
const validate = require('../utils/validations');

router

.use(util.authenticate.adminAuthenticate)
.put('/update/:filename',csvcontroller.updateproduct_csv)
.get('/pendingproductscsv',csvcontroller.pendingorders_csv)
.get('/orderdetails',csvcontroller.orderdetails)
.get('/productdetails',csvcontroller.productdetails)
module.exports=router





