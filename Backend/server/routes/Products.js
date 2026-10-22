const productcontroller=require("../controllers/Products")
const express = require('express'); 
const router = express.Router();
const util=require("../utils/utils")



router

.get('/list',util.authenticate.optionalUserAuthenticate,productcontroller.productsbyCategory_subcategory)

.get('/weblist',util.authenticate.optionalUserAuthenticate,productcontroller.productsbyCategory_subcategory)

.get('/bulk-deals',util.authenticate.optionalUserAuthenticate,productcontroller.bulkDeals)
.get('/detail/:ProductID',util.authenticate.optionalUserAuthenticate,productcontroller.productsby_ProductID)

.get('/search/:SearchString',util.authenticate.optionalUserAuthenticate,productcontroller.searchProduct)
.get('/suggestions',util.authenticate.optionalUserAuthenticate,productcontroller.searchSuggestions)
.get('/suggestions/:query',util.authenticate.optionalUserAuthenticate,productcontroller.searchSuggestions)
.delete('/search-history',util.authenticate.optionalUserAuthenticate,productcontroller.clearSearchHistory)




.get('/recommendedproducts',util.authenticate.optionalUserAuthenticate,productcontroller.RecommendedProducts_User)

.get('/youmaylikeit',util.authenticate.optionalUserAuthenticate,productcontroller.YouMayLikeIt_Products)

.get('/similar/:ProductID', util.authenticate.optionalUserAuthenticate, productcontroller.similarProducts)

module.exports=router





