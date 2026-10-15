const ordercontroller=require("../controllers/Orders")
const express = require('express'); 
const router = express.Router();
const util=require("../utils/utils")
const validate = require('../utils/validations');
const TimingController=require('../controllers/AdminTming');


router
.get('/currentorders',util.authenticate.userAuthenticate,ordercontroller.mycurrentorders)
.get('/pastorders',util.authenticate.userAuthenticate,ordercontroller.mypastorders)
.get('/myorder/:OrderID',util.authenticate.userAuthenticate,ordercontroller.myorder)
.post('/orderpayments',util.authenticate.userAuthenticate,ordercontroller.orderpayments)
.post('/createorder',util.authenticate.userAuthenticate,ordercontroller.addorder)
.put('/cancelorderuser/:OrderID',util.authenticate.userAuthenticate,ordercontroller.cancelorderuser)
.post('/reorder',util.authenticate.userAuthenticate,ordercontroller.reorder)
.get('/checktiming',TimingController.checkOrderTiming)
.get('/orderstatus/:OrderID', util.authenticate.userAuthenticate, ordercontroller.getOrderStatus)
.get('/invoice/:OrderID', util.authenticate.invoiceAuthenticate, ordercontroller.downloadInvoice);





// .get('/admin/ordersbystatus',util.authenticate.adminAuthenticate,ordercontroller.ordersbystatusadmin)


module.exports=router





