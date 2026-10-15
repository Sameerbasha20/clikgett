const bannercontroller=require("../controllers/Banners")
const express = require('express'); 
const router = express.Router();
const util=require("../utils/utils")


router
.get('/',util.authenticate.adminAuthenticate,bannercontroller.getallbanners)
.get('/detail/:BannerID',util.authenticate.adminAuthenticate,bannercontroller.bannersdetail)
.post('/addbanner',util.authenticate.adminAuthenticate,bannercontroller.addbanner)
.put('/updatebanner/:BannerID',util.authenticate.adminAuthenticate,bannercontroller.updateBanner)
.delete('/deletebanner/:BannerID',util.authenticate.adminAuthenticate,bannercontroller.deleteBanner)
module.exports=router





