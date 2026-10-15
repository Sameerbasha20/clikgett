const cartcontroller=require("../controllers/Carts")
const express = require('express'); 
const router = express.Router();
const util=require("../utils/utils")
const validate = require('../utils/validations');

router

.post('/validate_cart',util.authenticate.userAuthenticate,cartcontroller.ValidateCart)

.post('/mycart',util.authenticate.userAuthenticate,cartcontroller.getcartbyyserid)

.post('/addcart', util.authenticate.userAuthenticate, validate.user_mandatoryfields.cart_mandatoryfields,cartcontroller.addcart)

.delete('/deletecartitem/:ProductID/:VariantID/:Type',util.authenticate.userAuthenticate,cartcontroller.deletecartitem_variant)

.delete('/deletekit/:KitID/:Type',util.authenticate.userAuthenticate,cartcontroller.deletekit)


.delete('/deletecart/:CartID',util.authenticate.userAuthenticate,cartcontroller.deletecart)
.get('/abandoned/trigger-notifications', util.authenticate.cronOrAdminAuthenticate, cartcontroller.triggerAbandonedCartNotifications)
.post('/abandoned/trigger-notifications', util.authenticate.cronOrAdminAuthenticate, cartcontroller.triggerAbandonedCartNotifications)
.get('/abandoned/list', util.authenticate.adminAuthenticate, cartcontroller.getAbandonedCarts)
.get('/abandoned', util.authenticate.adminAuthenticate, cartcontroller.getAbandonedCarts)
.get('/abandoned/:id', util.authenticate.adminAuthenticate, cartcontroller.getAbandonedCartDetails)
.post('/abandoned/status', util.authenticate.adminAuthenticate, cartcontroller.updateAbandonedCartStatus)
.post('/abandoned/details', util.authenticate.adminAuthenticate, cartcontroller.getAbandonedCartDetails)

module.exports=router





