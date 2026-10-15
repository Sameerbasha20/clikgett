const productcontroller=require("../controllers/Products")
const express = require('express'); 
const router = express.Router();
const util=require("../utils/utils")



router

.get('/list',util.authenticate.userAuthenticate,productcontroller.productsbyCategory_subcategory)

.get('/weblist',util.authenticate.userAuthenticate,productcontroller.productsbyCategory_subcategory)

.get('/detail/:ProductID',util.authenticate.userAuthenticate,productcontroller.productsby_ProductID)

.get('/search/:SearchString',util.authenticate.userAuthenticate,productcontroller.searchProduct)
.get('/suggestions',util.authenticate.optionalUserAuthenticate,productcontroller.searchSuggestions)
.get('/suggestions/:query',util.authenticate.optionalUserAuthenticate,productcontroller.searchSuggestions)
.delete('/search-history',util.authenticate.optionalUserAuthenticate,productcontroller.clearSearchHistory)

.get('/kits',util.authenticate.userAuthenticate,productcontroller.kits)

.get('/allkits',util.authenticate.userAuthenticate,productcontroller.allKits)

.get('/kitdetail/:KitID',util.authenticate.userAuthenticate,productcontroller.kitdetail)

.get('/recommendedproducts',util.authenticate.userAuthenticate,productcontroller.RecommendedProducts_User)

.get('/youmaylikeit',util.authenticate.userAuthenticate,productcontroller.YouMayLikeIt_Products)

.get('/similar/:ProductID', util.authenticate.optionalUserAuthenticate, productcontroller.similarProducts)

module.exports=router





