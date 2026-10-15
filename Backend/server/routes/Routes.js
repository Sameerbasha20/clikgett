const Routecontroller=require("../controllers/Routes")
const express = require('express'); 
const router = express.Router();
const util=require("../utils/utils")
const validate = require('../utils/validations');
const TimingController=require('../controllers/AdminTming.js')

router
.get('/admin/bystatus',util.authenticate.adminAuthenticate,Routecontroller.routesbystatus)
.get('/admin/detail/:RouteID',util.authenticate.adminAuthenticate,Routecontroller.Routesdetail)
.post('/admin/add',validate.user_mandatoryfields.route_mandatoryfields,util.authenticate.adminAuthenticate,Routecontroller.addRoute)
.put('/admin/update/:RouteID',util.authenticate.adminAuthenticate,Routecontroller.updateRoute)
.delete('/admin/delete/:RouteID',util.authenticate.adminAuthenticate,Routecontroller.deleteRoute)


.get('/deliveryboy/',util.authenticate.deliveryboyAuthenticate,Routecontroller.routesbydeliveryboyID)
.get('/deliveryboy/detail/:RouteID',util.authenticate.deliveryboyAuthenticate,Routecontroller.Routesdetail)

.post('/admin/timing/add', util.authenticate.adminAuthenticate, TimingController.addTiming)
.put('/admin/timing/update/:TimingID', util.authenticate.adminAuthenticate, TimingController.updateTiming)
.get('/admin/timing/', util.authenticate.adminAuthenticate, TimingController.getTiming)
.delete('/admin/timing/delete/:TimingID', util.authenticate.adminAuthenticate, TimingController.deleteTiming)


module.exports=router





