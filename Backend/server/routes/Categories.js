const categorycontroller=require("../controllers/Categories")
const express = require('express'); 
const router = express.Router();
const util=require("../utils/utils")
const validate = require('../utils/validations');


router

.get('/subcategories_by_category/:CategoryID',util.authenticate.optionalUserAuthenticate,categorycontroller.categories_subcategories)
.get('/allcategoriesuser',util.authenticate.optionalUserAuthenticate,categorycontroller.categories)
.get('/websubcategories',categorycontroller.categories_subcategories)
.get('/subcategorydetail/:SubCategoryID',util.authenticate.optionalUserAuthenticate,categorycontroller.SubcategoryDetail)

.get('/allcategoriesadmin',util.authenticate.adminAuthenticate,categorycontroller.getallCategoriesforadmin)
.get('/detail/:CategoryID',util.authenticate.adminAuthenticate,categorycontroller.categorydetail)
.post('/addcategory',validate.user_mandatoryfields.category_mandatoryfields,util.authenticate.adminAuthenticate,categorycontroller.addcategory)
.put('/updatecategory/:CategoryID',util.authenticate.adminAuthenticate,categorycontroller.updatecategory)
.delete('/deletecategory/:CategoryID',util.authenticate.adminAuthenticate,categorycontroller.deletecategory)


// .post('/addproduct',productcontroller.addproduct)


module.exports=router





