const usercontroller = require("../controllers/Users")
const express = require('express');
const router = express.Router();
const util = require("../utils/utils")

router

 // .post('/signup/sendotp',usercontroller.VerifyMobileNo)

 // .post('/signup/verifyotp',usercontroller.VerifyMobileNoOTP)

 .post('/signup/sendotp', usercontroller.Sendotp_Signup)
 .post('/login/sendotp', usercontroller.Sendotp_Login)


 .post('/login/verifyotp', usercontroller.loginwithotp, util.authenticate.generateUserAuthToken)

 .post('/signup', util.authenticate.userAuthenticate, usercontroller.Signup, util.authenticate.generateUserAuthToken)

 .get('/homepage', usercontroller.homepage)

 .get('/homepagesectionproducts', util.authenticate.userAuthenticate, usercontroller.HomepageSection_Products)

 .get('/homepagesectionproducts_all/:HomeSectionId', util.authenticate.userAuthenticate, usercontroller.HomepageSection_Products_all)

 .get('/webhomepage', usercontroller.homepage)

 .put('/update', util.authenticate.userAuthenticate, usercontroller.updateuser)

 .get('/detail', util.authenticate.userAuthenticate, usercontroller.Userdetail)

 .post('/addfeedback/', util.authenticate.userAuthenticate, usercontroller.addFeedback)
 .post('/addfeedback', util.authenticate.userAuthenticate, usercontroller.addFeedback)
 .get('/feedback/order-status/:orderId', util.authenticate.userAuthenticate, usercontroller.checkFeedbackEligibility)
 .get('/feedback/eligibility/:orderId', util.authenticate.userAuthenticate, usercontroller.checkFeedbackEligibility)

 .get('/notifications', util.authenticate.userAuthenticate, usercontroller.notifications)

 .put('/updatenotifications/:NotificationID', util.authenticate.userAuthenticate, usercontroller.UserNotification_Update)

 .get('/settings', usercontroller.getSettings)

 .get('/user_wallets', util.authenticate.userAuthenticate, usercontroller.Wallets)

 .post('/add_wallet_money', util.authenticate.userAuthenticate, usercontroller.Add_Wallet_Money)

 .delete('/deleteuser', util.authenticate.userAuthenticate, usercontroller.deleteAccount)

 .get('/datatransfer', util.authenticate.adminAuthenticate, usercontroller.products_transfer)

 .get('/updateproducts', util.authenticate.adminAuthenticate, usercontroller.updateproducts)


module.exports = router





