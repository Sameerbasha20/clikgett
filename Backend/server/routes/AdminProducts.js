const adminproductscontroller=require("../controllers/AdminProducts")
const { requireStoredImages } = require('../utils/productImageCheck');
const adminStock=require("../controllers/AdminStock")
const express = require('express'); 
const router = express.Router();
const util=require("../utils/utils")
const validate = require('../utils/validations');

router


.get('/bycategory',util.authenticate.adminAuthenticate,adminproductscontroller.getproductsbycategoryID)
.get('/search/:SearchString',util.authenticate.adminAuthenticate,adminproductscontroller.searchProduct)

.get('/productdetail/:ProductID',util.authenticate.adminAuthenticate,adminproductscontroller.getproductsbyproductid)

.post('/addproduct',util.authenticate.adminAuthenticate,validate.user_mandatoryfields.product_mandatoryfields,requireStoredImages,adminproductscontroller.addproduct)
.post('/addvariant',util.authenticate.adminAuthenticate,validate.user_mandatoryfields.variant_mandatoryfields,adminproductscontroller.addvariant)
.put('/updateproduct/:ProductID',util.authenticate.adminAuthenticate,requireStoredImages,adminproductscontroller.updateproduct)
.get('/out-of-stock',util.authenticate.adminAuthenticate,adminStock.outOfStock)
.put('/restock/:VariantID',util.authenticate.adminAuthenticate,adminStock.restock)
.put('/updateproductvariant/:VariantID',util.authenticate.adminAuthenticate,adminproductscontroller.updateproductvariant)
.delete('/deleteproduct/:ProductID',util.authenticate.adminAuthenticate,adminproductscontroller.deleteproduct)
.delete('/deletevariant/:VariantID',util.authenticate.adminAuthenticate,adminproductscontroller.deletingvariant)





// Buy 1 / Buy 2 / Buy More product offers



module.exports=router





