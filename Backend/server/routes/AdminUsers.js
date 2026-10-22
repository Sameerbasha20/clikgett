const admincontroller = require("../controllers/AdminUsers");
const AdminAuth2FA = require("../controllers/AdminAuth2FA");
const AdminGlobalSearch = require("../controllers/AdminGlobalSearch");
const ReferralRewards = require("../controllers/ReferralRewards");
const DeliveryETA = require("../controllers/DeliveryETA");
const AdminUploads = require("../controllers/AdminUploads");
const express = require('express');
const router = express.Router();
const util = require("../utils/utils");
const validate = require('../utils/validations');

router

  // ── Two-Factor Authentication (2FA) ──────────────────────
  .post('/login', AdminAuth2FA.login)
  .post('/send-2fa-sms', AdminAuth2FA.sendSmsCode)
  .post('/verify-2fa', AdminAuth2FA.verify2FA)
  .post('/reset-2fa/:AdminID', util.authenticate.adminAuthenticate, AdminAuth2FA.reset2FA)
  .get('/2fa-status', util.authenticate.adminAuthenticate, AdminAuth2FA.get2FAStatus)

  // ── File uploads (presigned, credentials stay on the server) ──
  .post('/upload-url', util.authenticate.adminAuthenticate, AdminUploads.createUploadUrl)

  // ── Global Search ─────────────────────────────────────────
  .get('/global-search', util.authenticate.adminAuthenticate, AdminGlobalSearch.search)

  // ── Refer & Earn Configuration & Claims ───────────────────
  .get('/referrals/config', util.authenticate.adminAuthenticate, ReferralRewards.getConfig)
  .put('/referrals/config', util.authenticate.adminAuthenticate, ReferralRewards.updateConfig)
  .get('/referrals/audit-history', util.authenticate.adminAuthenticate, ReferralRewards.getAuditHistory)
  .get('/referrals/claims', util.authenticate.adminAuthenticate, ReferralRewards.getClaimsList)

  // ── Distance-Based Delivery ETA ───────────────────────────
  .get('/delivery-eta/rules', util.authenticate.adminAuthenticate, DeliveryETA.getRules)
  .put('/delivery-eta/rules', util.authenticate.adminAuthenticate, DeliveryETA.updateRules)
  .get('/delivery-eta/order/:OrderID', util.authenticate.adminAuthenticate, DeliveryETA.getOrderEffectiveETA)

  .get('/getalldeliveryboys', util.authenticate.adminAuthenticate, admincontroller.getdeliveryboys)
  .get('/getactivedeliveryboys', util.authenticate.adminAuthenticate, admincontroller.getactivedeliveryboys)
  .get('/deliveryboydetail', util.authenticate.adminAuthenticate, admincontroller.deliveryboydetail)

  .put('/updatedeliveryboy/:AdminID', util.authenticate.adminAuthenticate, admincontroller.adminupdatedeliveryboy)
  .delete('/deletedeliveryboy/:AdminID', util.authenticate.adminAuthenticate, admincontroller.admindeletedeliveryboy)
  .post('/addeliveryboy', util.authenticate.adminAuthenticate, admincontroller.addeliveryboy)

 .put('/updateuser/:UserID', util.authenticate.adminAuthenticate, admincontroller.updateuser)
 .get('/userdetail/:UserID', util.authenticate.adminAuthenticate, admincontroller.Userdetail)
  .get('/customer-full-details/:UserID', util.authenticate.adminAuthenticate, admincontroller.fullCustomerDetails)
 .get('/userslist', util.authenticate.adminAuthenticate, admincontroller.Userslist)

 .get('/feedbackdetail/:FeedbackID', util.authenticate.adminAuthenticate, admincontroller.Feedbackdetail)
 .get('/feedback/detail/:FeedbackID', util.authenticate.adminAuthenticate, admincontroller.Feedbackdetail)
 .get('/feedbacklist/', util.authenticate.adminAuthenticate, admincontroller.Feedbacklist)
 .get('/feedbacklist', util.authenticate.adminAuthenticate, admincontroller.Feedbacklist)
 .get('/feedback/list', util.authenticate.adminAuthenticate, admincontroller.Feedbacklist)
 .put('/feedback/reply/:FeedbackID', util.authenticate.adminAuthenticate, admincontroller.updateFeedbackReply)
 .post('/feedback/reply/:FeedbackID', util.authenticate.adminAuthenticate, admincontroller.updateFeedbackReply)
 .post('/feedback/review/:FeedbackID', util.authenticate.adminAuthenticate, admincontroller.reviewFeedback)
 .put('/feedback/review/:FeedbackID', util.authenticate.adminAuthenticate, admincontroller.reviewFeedback)
 .post('/feedback/credit-reward/:FeedbackID', util.authenticate.adminAuthenticate, admincontroller.creditFeedbackReward)
 .get('/feedback/reward-config', util.authenticate.adminAuthenticate, admincontroller.getFeedbackRewardConfig)
 .post('/feedback/reward-config', util.authenticate.adminAuthenticate, admincontroller.updateFeedbackRewardConfig)
 .put('/feedback/reward-config', util.authenticate.adminAuthenticate, admincontroller.updateFeedbackRewardConfig)

 .post('/sendnotifications', util.authenticate.adminAuthenticate, validate.user_mandatoryfields.adminnoftification, admincontroller.adminnotification)

 .get('/settingslist', util.authenticate.adminAuthenticate, admincontroller.settingslist)
 .get('/settingdetail/:ID', util.authenticate.adminAuthenticate, admincontroller.settingsdetail)
 .post('/addsettings', util.authenticate.adminAuthenticate, validate.user_mandatoryfields.settings, admincontroller.addsettings)
 .put('/updatesettings/:ID', util.authenticate.adminAuthenticate, admincontroller.updatesettings)
 .delete('/deletesettings/:ID', util.authenticate.adminAuthenticate, admincontroller.deletesetting)
 .get('/list', util.authenticate.adminAuthenticate, admincontroller.adminuserslist)
 .get('/adminlist', util.authenticate.adminAuthenticate, admincontroller.adminuserslist)
 .post('/addadmin', util.authenticate.adminAuthenticate, admincontroller.addadminuser)
 .get('/detail/:AdminID', util.authenticate.adminAuthenticate, admincontroller.adminuserdetail)
 .put('/updateadminuser/:AdminID', util.authenticate.adminAuthenticate, admincontroller.updateadmindata)
 .delete('/deleteadminuser/:AdminID', util.authenticate.adminAuthenticate, admincontroller.deleteadmindata)
 .put('/update/:AdminID', util.authenticate.adminAuthenticate, admincontroller.updateadmindata)

 .put('/user/update/:UserID', util.authenticate.adminAuthenticate, admincontroller.updateuser)
 .delete('/user/delete/:UserID', util.authenticate.adminAuthenticate, admincontroller.deleteUser)

 .get('/wallettransactions/:UserID', util.authenticate.adminAuthenticate, admincontroller.walletTransactions)
 .post('/creditdebitwallet', util.authenticate.adminAuthenticate, admincontroller.creditDebitWallet)
 .post('/expirecashback', util.authenticate.adminAuthenticate, admincontroller.expireCashback)

module.exports = router





