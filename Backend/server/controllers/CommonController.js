let CommonController = function () { };
const mysql = require('mysql');
const axios = require('axios')
const fs = require('fs')
const path = require("path")
require('dotenv').config()
require('dotenv').config()
const createCsvWriter = require("csv-writer")
var moment = require('moment');

const pool = require('../utils/db');

const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const { resume } = require('pdfkit');

// Firebase service account for customer push notifications: the git-ignored file
// utils/clikgett.json locally, or FIREBASE_SERVICE_ACCOUNT_JSON (the file's contents)
// on hosts like Render. Without either the backend still runs; pushes are skipped.
const loadServiceAccount = () => {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    try {
        return require('../utils/clikgett.json');
    } catch (e) {
        return null;
    }
};
const serviceAccount = loadServiceAccount();
if (serviceAccount) {
    initializeApp({ credential: cert(serviceAccount) });
} else {
    console.warn('[Firebase] No service account configured; push notifications are disabled.');
}

const s3 = require('../utils/s3');
const media = require('../utils/media');
const category_s3 = "http://clikgett-media.local/Categories/"
const Products_s3 = "http://clikgett-media.local/Products/"

CommonController.settings = () => {
    try {

        return new Promise(function (resolve, reject) {

            var query = "select \
            (select SettingValue from Settings  where SettingKey='MinOrderValue') as MinOrderValue,\
            (select SettingValue from Settings  where SettingKey='warehouselong') as Longitude,\
            (select SettingValue from Settings  where SettingKey='deliveryCoverageKm') as Radius"
            // console.log(query)
            pool.query(query, function (err, results, fields) {
                if (err) {
                    // console.log("Error in checking ID from DB :" + err);
                    reject(-1);
                }
                else {
                    resolve(results)
                }
            });
        });
    }
    catch (err) {
        console.log("exception in checking settingslist", err);
        reject(-1);
    }
}

CommonController.currentdate = () => {
    let CreatedAt, createdAt, issuedate; // per-request (were implicit globals)
    try {

        return new Promise(function (resolve, reject) {

            createdAt = new Date()
            createdAt.setHours(createdAt.getHours() + 5)
            createdAt.setMinutes(createdAt.getMinutes() + 30)
            createdAt = new Date(createdAt);
            CreatedAt = moment(createdAt, 'yyyy-MM-dd’T’HH:mm:ss.SSSZ').format('YYYY-MM-DD HH:mm:ss');
            issuedate = moment(createdAt, 'yyyy-MM-dd’T’HH:mm:ss.SSSZ').format('YYYY-MM-DD');
            resolve(issuedate)
        });
    }
    catch (err) {
        console.log("exception in checking warehouses", err);
        reject(-1);
    }
}

CommonController.Send_Notification = (Body, UserID, Type) => {
    return new Promise(async (resolve, reject) => {
        try {


            await CommonController.send_push_notifications(Body, UserID)


            let Insert_Notifications = {
                Title: Body.Title,
                Message: Body.Message,
                UserID: UserID,
                Type: 1,

            }

            console.log('Insert_Notifications', Insert_Notifications)
            let sql = "INSERT INTO UserNotifications  set ?";

            pool.query(sql, Insert_Notifications, (err, results) => {
                if (err) {
                    console.log('Error adding UserNotifications:', err.sqlMessage || err);
                    return resolve(-1);
                }
                if (results && results.affectedRows === 1) {
                    return resolve(results.insertId);
                } else {
                    return resolve(-1);
                }
            });

        }
        catch (err) {
            console.log("exception in marking student Attendance", err);
            reject({ "Status": 0, "Message": "Something went wrong" })
        }
    });
}

CommonController.send_push_notifications = (Body, UserID) => {
    return new Promise(async function (resolve, reject) {
        try {
            let Get_Fcm = "Select FCMToken from Users where UserID=" + UserID;
            let ResultFcm = await CommonController.commonget(Get_Fcm);
            if (!ResultFcm || ResultFcm.length === 0 || !ResultFcm[0]['FCMToken']) {
                console.log('No user or FCM token found for UserID:', UserID);
                return resolve(0);
            }

            const message = {
                data: {
                    title: String(Body.Title || 'ClikGett Notification'),
                    body: String(Body.Message || ''),
                },
                apns: {
                    payload: {
                        aps: {
                            contentAvailable: true,
                        },
                    },
                    headers: {
                        "apns-push-type": "background",
                        "apns-priority": "5",
                        "apns-topic": "io.flutter.plugins.firebase.messaging",
                    },
                },
                token: ResultFcm[0]['FCMToken'],
            };
            console.log(message, 'notification_message body');

            {
                getMessaging().send(message)
                    .then((response) => {
                        console.log('Successfully sent message:❤️❤️❤️', response);
                        resolve(1);
                    })
                    .catch((error) => {
                        console.error('Error sending notificationmessage:❤️❤️❤️', error);
                        // Clean up dead/unregistered FCM token from database
                        if (error && (error.code === 'messaging/registration-token-not-registered' || error.errorInfo?.code === 'messaging/registration-token-not-registered' || (error.message && error.message.includes('NotRegistered')))) {
                            console.log(`[FCM] Token for UserID ${UserID} is expired/unregistered. Clearing invalid FCMToken.`);
                            pool.query("UPDATE Users SET FCMToken = NULL WHERE UserID = ?", [UserID], (dbErr) => {
                                if (dbErr) console.error("Error clearing stale FCM token:", dbErr);
                            });
                        }
                        resolve(0);
                    });
            }
        } catch (err) {
            console.log("exception in getting FCMToken", err);
            resolve(0);
        }
    });
}


CommonController.getproducts = (query, params) => {
    let variants; // per-request (were implicit globals)
    try {
        // console.log(query,'***************************************************************************')
        return new Promise(function (resolve, reject) {
            const queryCallback = async (err, results) => {
                if (err) {
                    console.log("exception in retrieving Products", err);
                    return reject(-1);
                }
                else {
                    console.log("retrieved Products : ", results.length);
                    if (results.length > 0) {
                        // All variants in one query (one query per product took seconds on a remote DB).
                        let variantsByProduct = new Map();
                        try {
                            variantsByProduct = await CommonController.getvariantsForProducts(results.map((r) => r.ProductID));
                        } catch (e) {
                            console.error('loading product variants failed', e.message);
                        }
                        for (var j = 0; j < results.length; j++) {
                            variants = variantsByProduct.get(results[j].ProductID) || [];
                            results[j].ProductVariants = variants;

                            if (results[j].ImageUrl && results[j].ImageUrl !== "NA" && !results[j].ImageUrl.startsWith("http")) {
                                results[j].ImageUrl = Products_s3 + results[j].ImageUrl;
                            }

                            // Ensure ProductImages is parsed as an array
                            try {
                                results[j].ProductImages = typeof results[j].ProductImages === 'string'
                                    ? JSON.parse(results[j].ProductImages)
                                    : (results[j].ProductImages || []);
                            } catch (e) {
                                results[j].ProductImages = []; // Fallback in case JSON parsing fails
                            }

                            // Update each ProductImage URL with the S3 prefix
                            for (var i = 0; i < results[j].ProductImages.length; i++) {
                                if (results[j].ProductImages[i] && !results[j].ProductImages[i].startsWith("http")) {
                                    results[j].ProductImages[i] = Products_s3 + results[j].ProductImages[i];
                                }
                            }
                        }
                        // Category / subcategory names (the app tags cold drinks "Chilled" from them).
                        try {
                            const catIds = [...new Set(results.map((r) => r.CategoryID).filter(Boolean))];
                            const subIds = [...new Set(results.map((r) => r.SubCategoryID).filter(Boolean))];
                            const [cats, subs] = await Promise.all([
                                catIds.length ? CommonController.commonget('SELECT CategoryID, CategoryName FROM Categories WHERE CategoryID IN (?)', [catIds]) : [],
                                subIds.length ? CommonController.commonget('SELECT SubCategoryID, SubCategoryName FROM SubCategories WHERE SubCategoryID IN (?)', [subIds]) : [],
                            ]);
                            const catName = new Map(cats.map((c) => [c.CategoryID, c.CategoryName]));
                            const subName = new Map(subs.map((s) => [s.SubCategoryID, s.SubCategoryName]));
                            results.forEach((r) => {
                                r.CategoryName = catName.get(r.CategoryID) || r.CategoryName || null;
                                r.SubCategoryName = subName.get(r.SubCategoryID) || r.SubCategoryName || null;
                            });
                        } catch (e) {
                            console.log('attaching category names failed', e.message);
                        }
                        // Flash-sale prices and bulk tiers, so cards match the cart.
                        try {
                            await require('../services/ProductDeals').attachDeals(results);
                        } catch (e) {
                            console.log('attaching deals failed', e.message);
                        }
                        resolve(results);
                    }
                    else {
                        resolve(results);
                    }
                }
            };

            if (params !== undefined) {
                pool.query(query, params, queryCallback);
            } else {
                pool.query(query, queryCallback);
            }
        });
    }
    catch (err) {
        console.log("exception in checking settingslist", err);
        reject(-1);
    }
}

CommonController.Get_Order_Complete_Detail = (query) => {
    try {
        return new Promise(async function (resolve, reject) {
            let OrderResults = await CommonController.commonget(query)

            for (var j = 0; j < OrderResults.length; j++) {

                OrderResults[j].DeliveryInstructions = JSON.parse(OrderResults[j].DeliveryInstructions)
                let cartitems = await getorderitems(OrderResults[j].OrderID)
                OrderResults[j].orderitems = cartitems

                let GetUserDetails = "select FirstName from Users where UserID=" + OrderResults[j]['UserID']
                let UserResults = await CommonController.commonget(GetUserDetails)
                if (UserResults.length > 0) {
                    OrderResults[j].UserName = UserResults[0]['FirstName']
                }
                else {
                    OrderResults[j].UserName = "NA"
                }
                console.log(OrderResults[j].deliveredDateTime, 'deliveredDateTime')
                OrderResults[j].InvoiceFile = media.urlFor("orderinvoice/" + OrderResults[j].InvoiceFile)

                // Created_At=new Date(OrderResults[j].deliveredDateTime)                    
                // Created_At.setHours( Created_At.getHours() + 5 )
                // Created_At.setMinutes(Created_At.getMinutes() + 30)
                // Created_At=new Date(Created_At);                        
                // OrderResults[j].deliveredDateTime = moment(Created_At, 'yyyy-MM-dd’T’HH:mm:ss.SSSZ').format('YYYY-MM-DD HH:mm:ss');

                if (OrderResults[j].EstimateDateTime && OrderResults[j].EstimateDateTime !== 0 && OrderResults[j].EstimateDateTime !== '0') {
                    OrderResults[j].EstimateDateTime = moment(OrderResults[j].EstimateDateTime).format('YYYY-MM-DD HH:mm:ss');
                } else {
                    OrderResults[j].EstimateDateTime = null;
                }

                // Attach latest driver delay details if reported
                try {
                    let delayQuery = "SELECT Reason, RequestedMinutes, ApprovedMinutes, Remarks, CreatedAt FROM OrderDelays WHERE OrderID = " + OrderResults[j].OrderID + " ORDER BY DelayID DESC LIMIT 1";
                    let delayRows = await CommonController.commonget(delayQuery);
                    if (delayRows && delayRows.length > 0) {
                        const d = delayRows[0];
                        OrderResults[j].LatestDelayReason = d.Reason;
                        OrderResults[j].LatestDelayRemarks = d.Remarks || '';
                        OrderResults[j].LatestDelayMinutes = d.ApprovedMinutes || d.RequestedMinutes || 0;
                        OrderResults[j].DelayUpdatedAt = moment(d.CreatedAt).format('YYYY-MM-DD HH:mm:ss');

                        const friendlyReasons = {
                            'HEAVY_TRAFFIC': 'heavy traffic',
                            'WEATHER_CONDITIONS': 'weather conditions',
                            'HEAVY_RAIN': 'weather conditions',
                            'STORE_PREPARATION_DELAY': 'store preparation delay',
                            'RESTAURANT_DELAY': 'store preparation delay',
                            'ORDER_NOT_READY': 'order not ready for pickup',
                            'ORDER_ISSUE': 'order not ready for pickup',
                            'DIFFICULTY_LOCATING_CUSTOMER': 'difficulty locating your address',
                            'CUSTOMER_LOCATION_ISSUE': 'difficulty locating your address',
                            'VEHICLE_ISSUE': 'delivery vehicle issue',
                            'ROAD_BLOCK': 'road block / diversion',
                            'APP_NETWORK_ISSUE': 'network connectivity issue',
                            'OTHER': (d.Remarks && d.Remarks.trim().length > 0) ? d.Remarks.trim() : 'operational delay'
                        };
                        OrderResults[j].LatestDelayReasonText = friendlyReasons[d.Reason] || d.Reason.replace(/_/g, ' ').toLowerCase();
                    }
                } catch (delErr) {
                    console.error("Error fetching latest delay details for order:", delErr);
                }

            }
            resolve(OrderResults)

        });

    }
    catch (err) {
        console.log("exception in checking settingslist", err);
        reject(-1);
    }
}

CommonController.products = (query) => {
    try {
        console.log(query)
        return new Promise(function (resolve, reject) {
            pool.query(query, async (err, results) => {
                if (err) {
                    console.log("exception in retrieving Products", err);
                    return reject(-1);
                }
                else {
                    console.log("retrived Products : ", results.length);
                    if (results.length > 0) {
                        for (var j = 0; j < results.length; j++) {
                            if (results[j].ImageUrl !== "NA") {
                                results[j].ImageUrl = Products_s3 + results[j].ImageUrl;
                            }

                            // Ensure ProductImages is parsed as an array
                            try {
                                results[j].ProductImages = JSON.parse(results[j].ProductImages) || [];
                            } catch (e) {
                                results[j].ProductImages = []; // Fallback in case JSON parsing fails
                            }

                            // Update each ProductImage URL with the S3 prefix
                            for (var i = 0; i < results[j].ProductImages.length; i++) {
                                results[j].ProductImages[i] = Products_s3 + results[j].ProductImages[i];
                            }
                        }
                        resolve(results)
                    }
                    else {
                        resolve(results)
                    }

                }


            });
        });

    }
    catch (err) {
        console.log("exception in checking settingslist", err);
        reject(-1);
    }
}

CommonController.GetReferredDetails = (UserID, OrderID) => {
    let RefferedUserID; // per-request (were implicit globals)
    try {
        return new Promise(async function (resolve, reject) {
            let GetUsers = `select * from Users where UserID=?`
            console.log(GetUsers)
            let UserResults = await CommonController.commonget(GetUsers, [UserID])
            console.log(UserResults)
            if (UserResults.length > 0) {
                if (UserResults[0]['ReferredBy'] != null && UserResults[0]['ReferredBy'] != "NA") {

                    let GetReferral = `select * from Users where MyReferralCode=${pool.escape(UserResults[0]['ReferredBy'].toUpperCase())}`;
                    console.log(GetReferral, 'GetReferral')
                    let ResultReferral = await CommonController.commonget(GetReferral)
                    if (ResultReferral.length > 0) {
                        RefferedUserID = ResultReferral[0]['UserID']
                        // RefferedUserID = UserResults[0]['ReferredBy']

                        // Earlier delivered orders only: this order is already marked delivered.
                        let GetOrders = `select OrderID from Orders where UserID = ? and OrderStatus in (1) and OrderID <> ?`;
                        let ResultOrders = await CommonController.commonget(GetOrders, [UserID, OrderID]);
                        console.log('referral amount resultorder', ResultOrders);
                        if (ResultOrders.length == 0) {
                            let referralRewardCredited = false;
                            try {
                                const ReferralRewards = require('./ReferralRewards');
                                const outcome = await ReferralRewards.processReward({
                                    referredUserId: UserID,
                                    triggerEvent: 'first_order',
                                    orderId: OrderID
                                });
                                if (outcome && outcome.success) {
                                    referralRewardCredited = true;
                                }
                            } catch (refErr) {
                                console.error("Error in ReferralRewards.processReward:", refErr);
                            }
                            if (!referralRewardCredited) {
                                await CommonController.Referred_Amount_Details(RefferedUserID, UserID, OrderID, "Order");
                            }
                            let referredUserNotification = {
                                Title: `ClikGett - Referral Amount Added`,
                                Message: "You've Received a Referral Bonus!"
                            };
                            await CommonController.send_push_notifications(referredUserNotification, RefferedUserID);
                            await CommonController.Send_Notification(referredUserNotification, RefferedUserID);
                            referredUserNotification = {
                                Title: `ClikGett - Cashback Earned on Your First Order`,
                                Message: "You've earned cashback for completing your first order delivery!"
                            };
                            await CommonController.send_push_notifications(referredUserNotification, UserID);
                            await CommonController.Send_Notification(referredUserNotification, UserID);
                            resolve(1);
                        } else {
                            console.log("not a first order");
                            resolve(1);
                        }
                    } else {
                        console.log("refreed user not exists");
                        resolve(1);
                    }
                } else {
                    console.log("no one reffered");
                    resolve(1);
                }
            } else {
                console.log("No one reffered this user");
                resolve(1);
            }
        });

    }
    catch (err) {
        console.log("exception in checking settingslist", err);
        reject(-1);
    }
}

CommonController.Referred_Amount_Details = (RefferedUserID, UserID, OrderID, Type) => {
    let Amount, ContentID, ContentType; // per-request (were implicit globals)
    try {
        return new Promise(async function (resolve, reject) {
            let newUser_viaReferralCode_bonus_amount = 0;
            if (Type == "Order") {
                ContentType = 2
                ContentID = OrderID;
                let GetConfig = await CommonController.Get_Configuration()
                var newArray = GetConfig.filter(function (el) {
                    if (el.SettingKey == 'Referral_firstorderBonus') {
                        Amount = el.SettingValue
                    }
                    if (el.SettingKey == 'ReferAmount') {
                        newUser_viaReferralCode_bonus_amount = el.SettingValue;
                    }
                });
            }
            else {
                ContentType = 1
                ContentID = UserID
                let GetConfig = await CommonController.Get_Configuration()
                var newArray = GetConfig.filter(function (el) {
                    if (el.SettingKey == 'Refferal_SignupBonus') {
                        Amount = el.SettingValue
                    }
                });
            }
            if (Type == 'Order'){
              await CommonController.Add_To_Wallet(RefferedUserID, ContentType, ContentID, Amount)
              await CommonController.Add_To_Wallet(UserID, 1, ContentID, newUser_viaReferralCode_bonus_amount);
              await CommonController.save_to_users_wallets(RefferedUserID, Amount);
              await CommonController.save_to_users_wallets(UserID, newUser_viaReferralCode_bonus_amount);
            }
            else
              await CommonController.save_to_users_wallets(RefferedUserID, Amount);
            resolve(1);
        })
    }
    catch (err) {
        console.log("exception in checking Wallets", err);
        reject(-1);
    }
}


CommonController.Add_To_Wallet = (RefferedUserID, ContentType, ContentID, Amount,Description) => {
    try {
        return new Promise(async function (resolve, reject) {

            let Insert_Notifications = {
                UserID: RefferedUserID,
                Amount: Amount,
                Credited_Debited: 1,
                ContentType: ContentType,
                ContentID: ContentID,
                Description: Description || 'NA'
            }

            console.log('Insert_Notifications', Insert_Notifications)
            let sql = "INSERT INTO Wallets  set ?";

            pool.query(sql, Insert_Notifications, (err, results) => {
                if (!err && results && results.affectedRows === 1) {
                    return resolve(results.insertId)
                }
                else {
                    console.log("error in adding Walletss", err);
                    return reject(-1)
                }
            })
        })
    }
    catch (err) {
        console.log("exception in checking Wallets", err);
        reject(-1);
    }
}


CommonController.Add_To_Wallet_Debit = (RefferedUserID, ContentType, ContentID, Amount,Description) => {
    try {
        return new Promise(async function (resolve, reject) {
	    if (ContentType == 3)
                Description = "Amount debited for Order ID: " + ContentID || ''
            let Insert_Notifications = {
                UserID: RefferedUserID,
                Amount: Amount,
                Credited_Debited: 2,
                ContentType: ContentType,
                ContentID: ContentID,
                Description: Description || 'NA'
            }

            console.log('Insert_Notifications', Insert_Notifications)
            let sql = "INSERT INTO Wallets  set ?";

            pool.query(sql, Insert_Notifications, (err, results) => {
                if (!err && results && results.affectedRows === 1) {
                    return resolve(results.insertId)
                }
                else {
                    console.log("error in adding Walletss", err);
                    return reject(-1)
                }
            })
        })
    }
    catch (err) {
        console.log("exception in checking Wallets", err);
        reject(-1);
    }
}

CommonController.save_to_users_wallets = (RefferedUserID, Amount) => {
    try {
        return new Promise(async function (resolve, reject) {

            let UpdateUsers = `update Users set WalletAmount = WalletAmount+${parseFloat(Amount)} where UserID=${RefferedUserID}`
            console.log(UpdateUsers, 'update user wallet')
            await CommonController.commonget(UpdateUsers)
            resolve(1)

        })
    }
    catch (err) {
        console.log("exception in checking Wallets", err);
        reject(-1);
    }
}


CommonController.Get_Configuration = () => {
    return new Promise(async function (resolve, reject) {
        let GetSettings = "select * from Settings"
        let ResultSettings = await CommonController.commonget(GetSettings)
        resolve(ResultSettings)
    })
}



/** Active variants for many products at once: Map(ProductID -> variants[]). */
CommonController.getvariantsForProducts = async (productIds) => {
    const ids = [...new Set(productIds.filter(Boolean))];
    const map = new Map();
    if (!ids.length) return map;
    const rows = await new Promise((resolve, reject) => pool.query(
        "select * from ProductVariants where ProductID in (?) and status=1 order by ProductID, VariantID", [ids],
        (err, results) => (err ? reject(err) : resolve(results || []))));
    for (const row of rows) {
        if (!map.has(row.ProductID)) map.set(row.ProductID, []);
        map.get(row.ProductID).push(row);
    }
    return map;
};

CommonController.getproductvariants = (ProductID) => {
    return new Promise(function (resolve, reject) {
        pool.query("select * from ProductVariants where ProductID=? and status=1", [ProductID], (err, results) => {
            if (err) {
                console.error("Database error retrieving product variants for ProductID:", ProductID, err);
                return reject(err);
            }
            resolve(results || []);
        });
    });
};

CommonController.kitsanditems = (query, key) => {
    let items; // per-request (were implicit globals)
    try {
        console.log(query, '***************************************************************************')
        return new Promise(function (resolve, reject) {
            pool.query(query, async (err, results) => {
                if (err) {
                    console.log("exception in retrieving kits", err);
                    return reject(-1);
                }
                else {
                    console.log("retrived kits : ", results.length);
                    if (results.length > 0) {
                        for (var j = 0; j < results.length; j++) {

                            items = await CommonController.getkititems(results[j]['KitID'], key)
                            results[j].KitItems = items
                            console.log(results[j].ImageUrl)
                            if (results[j].ImageUrl != "NA" && results[j].ImageUrl != "")
                                results[j].ImageUrl = Products_s3 + results[j].ImageUrl


                        }

                    }
                    resolve(results)

                }


            });
        });

    }
    catch (err) {
        console.log("exception in checking kits", err);
        reject(-1);
    }
}

CommonController.getkititems = (KitID, key) => {
    let query; // per-request (were implicit globals)
    // Plain products carry KitID 0 and have no kit items; skip the query.
    if (!KitID || Number(KitID) === 0) return Promise.resolve([]);
    try {
        return new Promise(function (resolve, reject) {
            if (key == 'user')
                query = "select KI.*,P.ProductName,V.metrictype,V.metricvalue,P.ImageUrl,V.Price,V.OfferPrice,V.AvailableQty from KitItems KI inner join Products P on \
                    P.ProductID=KI.ProductID inner join ProductVariants V on V.VariantID=KI.VariantID \
                    where KI.KitID="+ KitID
            else
                query = "select KI.*,P.ProductName,V.metrictype,V.metricvalue,P.ImageUrl,V.Price,V.OfferPrice,V.AvailableQty from KitItems KI inner join Products P on \
                    P.ProductID=KI.ProductID inner join ProductVariants V on V.VariantID=KI.VariantID \
                    where KI.KitID="+ KitID
            console.log(query, 'getkititems')
            pool.query(query, async (err, results) => {

                if (err) {
                    console.log("exception in retrieving KitItems", err);
                    return reject(-1)
                }

                else {
                    for (var j = 0; j < results.length; j++) {
                        if (results[j].ImageUrl != "NA" && results[j].ImageUrl != "")
                            results[j].ImageUrl = Products_s3 + results[j].ImageUrl
                    }
                    resolve(results)
                }

            });
        });

    }
    catch (err) {
        console.log("exception in checking KitItems", err);
        reject(-1);
    }
}

CommonController.getuserdetail = (UserID) => {
    try {

        return new Promise(function (resolve, reject) {

            var query = "select *,FirstName as UserName from Users where UserID=" + UserID
            console.log(query)
            pool.query(query, function (err, results, fields) {
                if (err) {
                    // console.log("Error in checking ID from DB :" + err);
                    reject(-1);
                }
                else {
                    if (results.length == 0) {
                        results.push({ "EmailID": "NA", "MobileNumber": "NA" })
                    }
                    //console.log(results)
                    resolve(results)
                }
            });
        });
    }
    catch (err) {
        console.log("exception in checking settingslist", err);
        reject(-1);
    }
}

// Runs a query. Pass request-derived values as `inputs` (an array, one entry per ?)
// instead of interpolating them into the SQL string.
CommonController.commonget = (query, inputs) => {
    try {

        return new Promise(function (resolve, reject) {
            const params = inputs === undefined ? [] : (Array.isArray(inputs) ? inputs : [inputs]);
            pool.query(query, params, function (err, results, fields) {
                if (err) {
                    console.log("Error in checking ID from DB :" + err);
                    reject(-1);
                }
                else {
                    resolve(results)
                }
            });
        });
    }
    catch (err) {
        console.log("exception in getting results", err);
        reject(-1);
    }
}

CommonController.Update_NotificationLastSeen = (Query) => {
    return new Promise(async (resolve, reject) => {
        try {
            let CurrentTime = await CommonController.CurrentUTC_DateTime()
            pool.query(Query, [CurrentTime], function (err, result, fields) {
                if (err) {
                    console.log("Error in updating the AdminUser:" + err);
                    reject({ "Status": 0, "Message": "Error in updating AdminUser" })
                }
                else {
                    console.log("update affectedRows:" + result.affectedRows);
                    resolve(result.affectedRows > 0 ? 1 : 2);

                }
            })

        }
        catch (err) {
            console.log("exception in adding Documents", err);
            reject({ "Status": 0, "Message": "Something went wrong" })
        }
    });
}

CommonController.CurrentUTC_DateTime = () => {
    let currentdatetime; // per-request (were implicit globals)
    return new Promise(async (resolve, reject) => {
        try {
            var datetimenow = new Date(Date.now());
            currentdatetime = moment(datetimenow).format('yyyy-MM-DD HH:mm:ss');
            resolve(currentdatetime)


        } catch (error) {
            reject({ "Status": 0, "Message": "Something went wrong" })
        }
    });
}

CommonController.convertdate = (CreatedAtDate) => {
    let Created_At, converteddate; // per-request (were implicit globals)
    try {

        return new Promise(function (resolve, reject) {
            // console.log(CreatedAtDate,'date conversion common controller')
            Created_At = new Date(CreatedAtDate)
            Created_At.setHours(Created_At.getHours() + 5)
            Created_At.setMinutes(Created_At.getMinutes() + 30)
            Created_At = new Date(Created_At);
            converteddate = moment(Created_At).add(5, "hours").add(30, "minutes").format('YYYY-MM-DD HH:mm:ss');

            resolve(converteddate)
        });
    }
    catch (err) {
        console.log("exception in checking warehouses", err);
        reject(-1);
    }
}

CommonController.getcategories = (query) => {
    try {
        console.log(query, 'common category controller')
        return new Promise(function (resolve, reject) {
            pool.query(query, async (err, results) => {
                if (err) {
                    console.log("exception in retrieving categories", err);
                    return reject(-1);
                }
                else {
                    console.log("retrived categories : ", results.length);
                    if (results.length > 0) {
                        for (var j = 0; j < results.length; j++) {

                            if (results[j].ImageUrl && results[j].ImageUrl != "NA") {
                                if (!results[j].ImageUrl.startsWith("http://") && !results[j].ImageUrl.startsWith("https://")) {
                                    results[j].ImageUrl = category_s3 + results[j].ImageUrl;
                                }
                            }


                        }
                        resolve(results)
                    }
                    else {
                        resolve(results)
                    }

                }


            });
        });

    }
    catch (err) {
        console.log("exception in checking settingslist", err);
        reject(-1);
    }
}

CommonController.commondelete = (query) => {
    try {

        return new Promise(function (resolve, reject) {

            console.log(query, 'common controller')
            pool.query(query, function (err, results, fields) {
                if (err) {
                    // console.log("Error in checking ID from DB :" + err);
                    reject(-1);
                }
                else {

                    resolve(results)

                }
            });
        });
    }
    catch (err) {
        console.log("exception in getting results", err);
        reject(-1);
    }
}

CommonController.CommonUpdate_Function = (queryString, params = []) => {
    try {
        return new Promise(function (resolve, reject) {
            pool.query(queryString, params, function (err, result, fields) {
                if (err) {
                    console.log("Error in updating the DB:" + err);
                    reject(-1)
                }
                else {
                    if (result.affectedRows > 0) {
                        resolve(1)
                    }
                    else {
                        resolve(2)
                    }
                }
            });
        });
    }
    catch (err) {
        console.log("exception in getting results", err);
        reject(-1);
    }
}

function getorderitems(OrderID) {
    var queryString = "";

    queryString = "select oi.*,p.ProductImages  from OrderItems oi inner join Products p on p.ProductID=oi.ProductID\
     where oi.OrderID=?";

    return new Promise(function (resolve, reject) {
        pool.query(queryString, [OrderID], function (err, results, fields) {
            if (err) {
                console.log("Error in checking OrderID from DB :" + err);
                reject(0);
            }
            else {
                if (results.length > 0) {
                    for (var j = 0; j < results.length; j++) {


                        // Ensure ProductImages is parsed as an array
                        try {
                            results[j].ProductImages = JSON.parse(results[j].ProductImages) || [];
                        } catch (e) {
                            results[j].ProductImages = []; // Fallback in case JSON parsing fails
                        }
                        // Update each ProductImage URL with the S3 prefix
                        for (var i = 0; i < results[j].ProductImages.length; i++) {
                            results[j].ProductImages[i] = Products_s3 + results[j].ProductImages[i];
                        }
                        console.log(results[j].ProductImages)
                    }
                    for (let iterator of results) {
                        iterator['KitItems'] = JSON.parse(iterator['KitItems'])
                    }
                    resolve(results);
                }
                else {
                    resolve([]);
                }
            }
        });
    });
}

CommonController.generateCsv = async (results) => {

    if (results.length == 0) return
    const headers = Object.keys(results[0]).map(key => ({
        id: key,
        title: key.charAt(0).toUpperCase() + key.slice(1)
    }));


    const fileName = `${new Date().getTime()}`

    //const filePath = path.join(__dirname, fileName);
    const filePath = path.join(fileName)

    // Create CSV writer
    const csvWriter = createCsvWriter.createObjectCsvWriter({
        path: filePath,
        header: headers
    });


    // Write CSV to file
    await csvWriter.writeRecords(results);
    console.log('CSV file generated successfully');

    // Read the generated CSV file
    const fileContent = fs.readFileSync(filePath);


    const params = {
        Bucket: process.env.bucketname,
        Key: "csv/" + fileName, // File name you want to save as in S3
        Body: fileContent,
        ContentType: "text/csv",
        ACL: "public-read",
    };
    // Uploading files to the bucket

    let fileUrl = media.urlFor("csv/" + fileName);
    try {
        const uploadpdf = await s3.upload(params).promise();
        fileUrl = uploadpdf.Location || fileUrl;
    } catch (s3Err) {
        console.warn('S3 upload warning (using fallback URL):', s3Err.message);
    }
    try { fs.unlinkSync(filePath); } catch (e) { console.warn('Temp CSV unlink deferred:', e.message); }
    console.log('Local CSV file deleted');
    return fileUrl;

}

CommonController.getCategoryPriority = (query) => {
    try {

        return new Promise(function (resolve, reject) {

            console.log(query, 'common controller')
            pool.query(query, function (err, results, fields) {
                if (err) {
                    // console.log("Error in checking ID from DB :" + err);
                    reject(-1);
                }
                else {

                    resolve(results)

                }
            });
        });
    }
    catch (err) {
        console.log("exception in getting results", err);
        reject(-1);
    }
}

CommonController.updateCategoryPriority = (query) => {
    try {

        return new Promise(function (resolve, reject) {

            console.log(query, 'common controller')
            pool.query(query, function (err, results, fields) {
                if (err) {
                    // console.log("Error in checking ID from DB :" + err);
                    reject(-1);
                }
                else {

                    resolve(1)

                }
            });
        });
    }
    catch (err) {
        console.log("exception in getting results", err);
        reject(-1);
    }
}

CommonController.getWalletTransactions = (query) => {
    try {

        return new Promise(function (resolve, reject) {

            console.log(query, 'common controller')
            pool.query(query, function (err, results, fields) {
                if (err) {
                    // console.log("Error in checking ID from DB :" + err);
                    reject(-1);
                }
                else {

                    resolve(results)

                }
            });
        });
    }
    catch (err) {
        console.log("exception in getting results", err);
        reject(-1);
    }
}

CommonController.updateWalletAmount = (query) => {
    try {

        return new Promise(function (resolve, reject) {

            console.log(query, 'common controller')
            pool.query(query, function (err, results, fields) {
                if (err) {
                    // console.log("Error in checking ID from DB :" + err);
                    reject(-1);
                }
                else {

                    resolve(1)

                }
            });
        });
    }
    catch (err) {
        console.log("exception in getting results", err);
        reject(-1);
    }
}

CommonController.sendSms = async (number, otp) => {
    const message = encodeURIComponent(
        `welcome to Clikgett .Your Clikgett OTP to create your account is ${otp}. It is valid for 10 minutes. Never share this OTP with anyone.https://apps.apple.com/in/app/clikgett/id6746932740`
    );

    const url1 = `https://sms.textspeed.in/vb/apikey.php?apikey=${process.env.TEXTSPEED_APIKEY}&senderid=CLKGET&templateid=1777178973707336049&number=${number}&message=${message}`

    const response = await axios.post(url1);
    console.log("balance", response.data?.description, "status", response.data?.status);
    const sent = response.data?.status == "Success";
    if (sent)
       await updateOTPs_sent()
    return sent;
};

CommonController.sendSmsForNewOrder = async (orderId) => {
    // Store owner's number for new-order alerts. Local development sends none unless configured.
    const alertNumber = process.env.ADMIN_ALERT_MOBILE || (process.env.NODE_ENV === 'production' ? '9133446636' : '');
    if (!/^[6-9][0-9]{9}$/.test(alertNumber)) return;
    const message = encodeURIComponent(
        `Hi Srikar, you've received a new order ${orderId} on your store. Please check your dashboard for details. from mTouch Labs`
    );

    const url1 = `https://sms.textspeed.in/vb/apikey.php?apikey=${process.env.TEXTSPEED_APIKEY}&senderid=CLKGET&templateid=1777179228622362064&number=${alertNumber}&message=${message}`

    const response = await axios.post(url1);
    console.log("balance", response.data?.description, "status", response.data?.status);
    if(response.data?.status=="Success")
       await updateOTPs_sent()

};

CommonController.notificationMessages = async (status, id) => {

    const orderStatusMessages = [
        //{
        //    status: 1,
        //    Title: `Order Delivered #${id}`,
        //    Message: "Your order has been successfully delivered. Thank you for shopping with us!"
        //},
        //{
        //    status: 2,
        //    Title: `Order is Being Packed #${id}`,
        //    Message: "We're currently packing your order to ensure everything arrives safely and promptly."
        //},
        //{
        //    status: 3,
        //    Title: `Shipment Order Created #${id}`,
        //    Message: "We've created your shipment order. We'll keep you updated on the next steps!"
        //},
        //{
        //    status: 4,
        //    Title: `Order Cancelled #${id}`,
        //    Message: "Your order has been cancelled as per your request. Please let us know if you need help."
        //},
        {
            status: 5,
            Title: `🛵 Order Picked Up`,
            Message: "Your order is on the way and will reach you shortly."
        },
        //{
        //    status: 6,
        //    Title: `Order Returned #${id}`,
        //    Message: "We've received your returned order. Let us know if you'd like to reorder or need assistance."
        //},

        {
            status: 8,
            Title: `✅ Order Received`,
            Message: "We’re getting ready to pack your items."
        },

        {
            status: 7,
            Title: `📍 Arrived at Location`,
            Message: "Your order has reached your location and will be handed over to you soon."
        }
    ];


    return orderStatusMessages.find(item => item.status === status);
}

function updateOTPs_sent() {
    return new Promise((resolve, reject) => {
        let updateOTPcount = `update AdminUsers set OTPSent=OTPSent + 1 where AdminID=1;`;
        pool.query(updateOTPcount, async function (err, results) {
            if (err) {
                console.log("Error in updating OTPsCount: ", err);
                reject(0);
            }
            else {
                console.log("OTPsCount updated:", results.affectedRows);
                resolve(1);
            }
        });

    })
}
module.exports = CommonController;





CommonController.ProcessOrderCashback = async (OrderID, UserID) => {
    try {
        if (!OrderID || !UserID) return 0;
        const PricingEngine = require('../services/PricingEngine');

        // Check if cashback was already credited for this order
        const existingTx = await new Promise(r => pool.query(
            "SELECT * FROM Wallets WHERE ContentID = ? AND ContentType = 4", 
            [OrderID], 
            (e, rows) => r(rows || [])
        ));
        if (existingTx.length > 0) {
            console.log(`Cashback already processed for Order #${OrderID}`);
            return 0;
        }

        // Fetch OrderItems
        const orderItems = await new Promise(r => pool.query(
            "SELECT OI.ProductID, OI.VariantID, OI.Quantity, OI.Price, OI.OfferPrice, PV.Buy2Price FROM OrderItems OI LEFT JOIN ProductVariants PV ON OI.VariantID = PV.VariantID WHERE OI.OrderID = ?",
            [OrderID],
            (e, rows) => r(rows || [])
        ));

        if (!orderItems.length) return 0;

        const calculation = await PricingEngine.calculateCart(orderItems, null, UserID);
        const earnedCashback = calculation.CashbackEarned;

        if (earnedCashback > 0) {
            // Check CashbackMode setting
            let cashbackMode = 'automatic';
            try {
                const settingRows = await new Promise(r => pool.query("SELECT CashbackMode FROM AdminShopToggleSettings LIMIT 1", (e, rows) => r(rows || [])));
                if (settingRows && settingRows.length > 0 && settingRows[0].CashbackMode) {
                    cashbackMode = settingRows[0].CashbackMode.toLowerCase();
                }
            } catch (err) {
                console.error("Error reading CashbackMode:", err);
            }

            if (cashbackMode === 'disabled') {
                console.log(`Cashback processing disabled by AdminShopToggleSettings for Order #${OrderID}`);
                return 0;
            }

            if (cashbackMode === 'manual') {
                // Route to CashbackPending table for manual admin review (once per order)
                const queued = await new Promise(r => pool.query(
                    "SELECT 1 FROM CashbackPending WHERE OrderID = ? LIMIT 1", [OrderID], (e, rows) => r(rows || [])
                ));
                if (queued.length) {
                    console.log(`Cashback for Order #${OrderID} is already in the review queue`);
                    return 0;
                }
                await new Promise(r => pool.query(
                    "INSERT INTO CashbackPending (OrderID, UserID, CashbackAmount, Status, CreatedAt) VALUES (?, ?, ?, 'pending', NOW())",
                    [OrderID, UserID, earnedCashback],
                    (e, res) => r(res)
                ));
                console.log(`Cashback ₹${earnedCashback} queued for manual admin approval for Order #${OrderID}`);
                return earnedCashback;
            }

            const expiryDays = calculation.CashbackExpiryDays || 30;
            const insertWalletSql = `
                INSERT INTO Wallets (UserID, Amount, Credited_Debited, ContentType, ContentID, Description, ExpiryDate, IsExpired, CreatedAt)
                VALUES (?, ?, 1, 4, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), 0, NOW())
            `;
            await new Promise(r => pool.query(
                insertWalletSql, 
                [UserID, earnedCashback, OrderID, `Cashback earned on Order #${OrderID}`, expiryDays],
                (e, res) => r(res)
            ));

            // Update user's wallet balance
            await new Promise(r => pool.query(
                "UPDATE Users SET WalletAmount = WalletAmount + ? WHERE UserID = ?",
                [earnedCashback, UserID],
                (e, res) => r(res)
            ));

            // Notify user
            const note = {
                Title: "Cashback Credited!",
                Message: `Congratulations! ₹${earnedCashback.toFixed(2)} cashback has been credited to your wallet for Order #${OrderID}.`
            };
            await CommonController.Send_Notification(note, UserID);
            console.log(`Successfully credited ₹${earnedCashback} cashback for Order #${OrderID}`);
            return earnedCashback;
        }
        return 0;
    } catch (e) {
        console.error("Error in ProcessOrderCashback:", e);
        return 0;
    }
};
