const express = require('express'); 
const router = express.Router();
const util=require("../utils/utils")
const validate = require('../utils/validations');
const TimingController=require('../controllers/AdminTming.js')

router
.post('/add', util.authenticate.adminAuthenticate, TimingController.addTiming)
.put('/update/:TimingID', util.authenticate.adminAuthenticate,TimingController.updateTiming)
.get('/', util.authenticate.adminAuthenticate, TimingController.getTiming)
.get('/shopstatus', util.authenticate.adminAuthenticate, TimingController.getShopStatus)
.put('/toggle', util.authenticate.adminAuthenticate,TimingController.toggleShopStatus)
.put('/store-mode', util.authenticate.adminAuthenticate, TimingController.setStoreMode)
.delete('/delete/:TimingID', util.authenticate.adminAuthenticate, TimingController.deleteTiming)

.put('/updatesettings/:SettingID', util.authenticate.adminAuthenticate, TimingController.updateBanner)


module.exports=router





