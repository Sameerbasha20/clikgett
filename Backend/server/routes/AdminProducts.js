const adminproductscontroller=require("../controllers/AdminProducts")
const adminStock=require("../controllers/AdminStock")
const express = require('express'); 
const router = express.Router();
const util=require("../utils/utils")
const validate = require('../utils/validations');

router


.get('/bycategory',util.authenticate.adminAuthenticate,adminproductscontroller.getproductsbycategoryID)
.get('/bysubcategory',util.authenticate.adminAuthenticate,adminproductscontroller.productsbysubcategory_admin)
.get('/search/:SearchString',util.authenticate.adminAuthenticate,adminproductscontroller.searchProduct)

.get('/productdetail/:ProductID',util.authenticate.adminAuthenticate,adminproductscontroller.getproductsbyproductid)

.post('/addproduct',validate.user_mandatoryfields.product_mandatoryfields,util.authenticate.adminAuthenticate,adminproductscontroller.addproduct)
.post('/addvariant',validate.user_mandatoryfields.variant_mandatoryfields,util.authenticate.adminAuthenticate,adminproductscontroller.addvariant)
.put('/updateproduct/:ProductID',util.authenticate.adminAuthenticate,adminproductscontroller.updateproduct)
.get('/out-of-stock',util.authenticate.adminAuthenticate,adminStock.outOfStock)
.put('/restock/:VariantID',util.authenticate.adminAuthenticate,adminStock.restock)
.put('/updateproductvariant/:VariantID',util.authenticate.adminAuthenticate,adminproductscontroller.updateproductvariant)
.delete('/deleteproduct/:ProductID',util.authenticate.adminAuthenticate,adminproductscontroller.deleteproduct)
.delete('/deletevariant/:VariantID',util.authenticate.adminAuthenticate,adminproductscontroller.deletingvariant)





// Buy 1 / Buy 2 / Buy More product offers
.get('/buy-more-config',util.authenticate.adminAuthenticate,adminproductscontroller.buyMoreConfig)
.put('/buy-more-config/:ConfigID',util.authenticate.adminAuthenticate,adminproductscontroller.updateBuyMoreConfig)
.delete('/buy-more-config/:ConfigID',util.authenticate.adminAuthenticate,adminproductscontroller.deleteBuyMoreConfig)



module.exports=router





