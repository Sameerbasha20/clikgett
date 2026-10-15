const subcategorycontroller=require("../controllers/SubCategories")
const express = require('express'); 
const router = express.Router();
const util=require("../utils/utils")
const validate = require('../utils/validations');

router


// .get('/bycategoryID/:CategoryID',util.authenticate.userAuthenticate,subcategorycontroller.subcategoriesbycategory_user)


.get('/',util.authenticate.adminAuthenticate,subcategorycontroller.subcategories_admin)

.get('/bycategory/:CategoryID',util.authenticate.adminAuthenticate,subcategorycontroller.subcategoriesbycategory_admin)

.get('/detail/:SubCategoryID',util.authenticate.adminAuthenticate,subcategorycontroller.subcategorydetail_admin)

.post('/add',validate.user_mandatoryfields.subcategory_mandatoryfields,util.authenticate.adminAuthenticate,subcategorycontroller.addsubcategory)
.put('/update/:SubCategoryID',util.authenticate.adminAuthenticate,subcategorycontroller.updatesubcategory)
.delete('/delete/:SubCategoryID',util.authenticate.adminAuthenticate,subcategorycontroller.deletesubcategory)


router.put('/admin/reorder', util.authenticate.adminAuthenticate, subcategorycontroller.reordersubcategories);
router.put('/reorder', util.authenticate.adminAuthenticate, subcategorycontroller.reordersubcategories);
router.post('/admin/reorder', util.authenticate.adminAuthenticate, subcategorycontroller.reordersubcategories);
router.post('/reorder', util.authenticate.adminAuthenticate, subcategorycontroller.reordersubcategories);

module.exports=router





