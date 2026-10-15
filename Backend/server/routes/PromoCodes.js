const PromoCodescontroller=require("../controllers/PromoCodes")
const express = require('express'); 
const router = express.Router();
const util=require("../utils/utils")
const validate = require('../utils/validations');


router

// userapis

.get('/winback/trigger', util.authenticate.cronOrAdminAuthenticate, PromoCodescontroller.triggerWinbackCoupons)
.post('/winback/trigger', util.authenticate.cronOrAdminAuthenticate, PromoCodescontroller.triggerWinbackCoupons)
.get('/active',util.authenticate.userAuthenticate,PromoCodescontroller.userallPromoCodes)
.post('/user/verify',util.authenticate.userAuthenticate,PromoCodescontroller.userapplypromoCodes)

//adminapis
.get('/admin/all',util.authenticate.adminAuthenticate,PromoCodescontroller.all_PromoCodess)
.get('/admin/detail/:PromoCodeID',util.authenticate.adminAuthenticate,PromoCodescontroller.get_PromoCodess)
.post('/admin/add',validate.user_mandatoryfields.promocode_mandatoryfields,util.authenticate.adminAuthenticate,PromoCodescontroller.add_promoCodess)
.put('/admin/update/:PromoCodeID',util.authenticate.adminAuthenticate,PromoCodescontroller.update_PromoCodes)
.delete('/admin/delete/:PromoCodeID',util.authenticate.adminAuthenticate,PromoCodescontroller.delete_PromoCodess)

module.exports=router
