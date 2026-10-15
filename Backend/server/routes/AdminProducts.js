const adminproductscontroller=require("../controllers/AdminProducts")
const express = require('express'); 
const router = express.Router();
const util=require("../utils/utils")
const validate = require('../utils/validations');

router


.get('/bycategory',util.authenticate.adminAuthenticate,adminproductscontroller.getproductsbycategoryID)
.get('/bysubcategory',util.authenticate.adminAuthenticate,adminproductscontroller.productsbysubcategory_admin)
.get('/kits',util.authenticate.adminAuthenticate,adminproductscontroller.Kits)
.get('/search/:SearchString',util.authenticate.adminAuthenticate,adminproductscontroller.searchProduct)

.get('/productdetail/:ProductID',util.authenticate.adminAuthenticate,adminproductscontroller.getproductsbyproductid)

.post('/addproduct',validate.user_mandatoryfields.product_mandatoryfields,util.authenticate.adminAuthenticate,adminproductscontroller.addproduct)
.post('/addvariant',validate.user_mandatoryfields.variant_mandatoryfields,util.authenticate.adminAuthenticate,adminproductscontroller.addvariant)
.put('/updateproduct/:ProductID',util.authenticate.adminAuthenticate,adminproductscontroller.updateproduct)
.put('/updateproductvariant/:VariantID',util.authenticate.adminAuthenticate,adminproductscontroller.updateproductvariant)
.delete('/deleteproduct/:ProductID',util.authenticate.adminAuthenticate,adminproductscontroller.deleteproduct)
.delete('/deletevariant/:VariantID',util.authenticate.adminAuthenticate,adminproductscontroller.deletingvariant)

.get('/allkits',util.authenticate.adminAuthenticate,adminproductscontroller.allKits)
.get('/kitdetail/:KitID',util.authenticate.adminAuthenticate, adminproductscontroller.kitdetail)
.post('/addkit',util.authenticate.adminAuthenticate, validate.user_mandatoryfields.kit,adminproductscontroller.addkit)
.post('/addkititem',util.authenticate.adminAuthenticate, validate.user_mandatoryfields.kititem,adminproductscontroller.addkititem)

.put('/updatekit/:KitID',util.authenticate.adminAuthenticate,adminproductscontroller.updatekit)
.put('/updatekititem/:KitItemID',util.authenticate.adminAuthenticate,adminproductscontroller.updatekititems)
.delete('/deletekit/:KitID',util.authenticate.adminAuthenticate,adminproductscontroller.deletekit)
.delete('/deletekititem/:KitItemID',util.authenticate.adminAuthenticate,adminproductscontroller.deletekititem)


.get('/recommendedproducts',util.authenticate.adminAuthenticate,adminproductscontroller.RecommendedProducts)
.post('/addrecommendedproduct',util.authenticate.adminAuthenticate,adminproductscontroller.addRecommendedProducts)
.delete('/deleterecommendedproducts/:RecProductID',util.authenticate.adminAuthenticate,adminproductscontroller.delete_RecommendedProducts)

// Buy 1 / Buy 2 / Buy More product offers
.get('/buy-more-config',util.authenticate.adminAuthenticate,adminproductscontroller.buyMoreConfig)
.put('/buy-more-config/:ConfigID',util.authenticate.adminAuthenticate,adminproductscontroller.updateBuyMoreConfig)
.delete('/buy-more-config/:ConfigID',util.authenticate.adminAuthenticate,adminproductscontroller.deleteBuyMoreConfig)



module.exports=router





