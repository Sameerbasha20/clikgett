const addresscontroller=require("../controllers/Address")
const express = require('express'); 
const router = express.Router();
const util=require("../utils/utils")
const validate = require('../utils/validations');


// .get('/:userId', util.authenticate.userAuthenticate, usersController.getbyUserId)
router
.get('/myaddress', util.authenticate.userAuthenticate,addresscontroller.gettaddressbyuserid)
.post('/check-serviceability', addresscontroller.checkServiceability)
.post('/addaddress',util.authenticate.userAuthenticate,validate.user_mandatoryfields.address_mandatoryfields,addresscontroller.addaddress)
.put('/:AddressID',util.authenticate.userAuthenticate,addresscontroller.updateaddress)
.delete('/:AddressID',util.authenticate.userAuthenticate,addresscontroller.deleteaddress)


module.exports=router





