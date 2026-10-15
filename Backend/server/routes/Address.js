const addresscontroller=require("../controllers/Address")
const express = require('express'); 
const router = express.Router();
const util=require("../utils/utils")
const validate = require('../utils/validations');


// .get('/:userId', util.authenticate.userAuthenticate, usersController.getbyUserId)
router
.get('/myaddress', util.authenticate.userAuthenticate,addresscontroller.gettaddressbyuserid)
.get('/byaddressid/:AddressID',util.authenticate.userAuthenticate,addresscontroller.getaddressbyaddressid)
.post('/check-serviceability', addresscontroller.checkServiceability)
.post('/checkserviceability', addresscontroller.checkServiceability)
.post('/addaddress',validate.user_mandatoryfields.address_mandatoryfields,util.authenticate.userAuthenticate,addresscontroller.addaddress)
.put('/:AddressID',util.authenticate.userAuthenticate,addresscontroller.updateaddress)
.delete('/:AddressID',util.authenticate.userAuthenticate,addresscontroller.deleteaddress)


module.exports=router





