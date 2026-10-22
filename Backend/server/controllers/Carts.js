const PricingEngine = require('../services/PricingEngine');
const express = require('express');
const mysql = require('mysql');
require('dotenv').config()
var moment = require('moment');
const https = require('https');
const querystring = require('querystring');
const CommonController = require("../controllers/CommonController");
const RetentionEngine = require('../services/RetentionEngine');
const CheckoutBill = require('../services/CheckoutBill');

const pool = require('../utils/db');
// products_s3="https://d3g1psimbpucs1.cloudfront.net/"


const categories_s3 = "https://d3c9kvg5gaqz48.cloudfront.net/Categories/"

const Products_s3 = "https://d3c9kvg5gaqz48.cloudfront.net/Products/"

const subcategories_s3 = "https://d3c9kvg5gaqz48.cloudfront.net/SubCategories/"



const cartcontroller = {

    // getcartbyyserid : async (req, resp, next) => {
    //     try {

    //                 console.log(req.body,'car body-----------------------------------------')
    //                 cart=await getcurrentcart(req.UserID)
    //                 if (cart==0){
    //                         return resp.status(200).json({"Status":1,"Cart":{}}) }

    //                 else{
    //                     console.log(cart[0]['CartId'],'cartid')
    //                     cartitems=await getcartitems(cart[0]['CartID'])
    //                     console.log(cartitems)
    //                     cart[0]['CartItems']=cartitems
    //                     for (var j = 0; j < cart[0]['CartItems'].length; j++){
    //                                 if(cart[0]['CartItems'][j].ImageUrl!="NA"){
    //                                     cart[0]['CartItems'][j].ImageUrl = Products_s3+cart[0]['CartItems'][j].ImageUrl} 

    //                     }

    //                     let getshop = `select * from AdminShopToggleSettings limit 0,1`
    //                     let settingslist = await CommonController.commonget(getshop);
    //                     console.log(settingslist,'settingslist')

    //                     storelatitude = settingslist[0]['Latitude']
    //                     storeLongitude = settingslist[0]['Longitude']
    //                     getradiusresult =await getradius(storelatitude,storeLongitude,req.body)
    //                     console.log(getradiusresult,'getradiusresult',getradiusresult[0]['distance'],settingslist[0]['PricePerKm'])
    //                     let DeliveryCharges = parseFloat(getradiusresult[0]['distance']) * parseFloat(settingslist[0]['PricePerKm'])
    //                     cart[0].DeliveryCharges = DeliveryCharges
    //                     console.log('delivercharges----------',DeliveryCharges)
    //                     resp.status(200).json({"Status":1,"Cart":cart[0]})}

    //     }
    //     catch (err) {
    //         console.log("exception in getting cart", err);
    //         return resp.status(500).json({ "Status": 0, "Message": "Error in getting cart" });
    //     }
    // },

    //NewCode
    // getcartbyyserid : async (req, resp, next) => {
    //     try {
    //         console.log(req.body, 'cart body-----------------------------------------');

    //         // Fetch the current cart for the user
    //         let cart = await getcurrentcart(req.UserID);

    //         if (cart == 0) {
    //             return resp.status(200).json({ "Status": 1, "Cart": {} });
    //         } else {
    //             console.log(cart[0]['CartId'], 'cartid');

    //             // Fetch cart items
    //             let cartitems = await getcartitems(cart[0]['CartID']);
    //             console.log(cartitems);
    //             cart[0]['CartItems'] = cartitems;

    //             // Update ImageUrl if available
    //             for (let j = 0; j < cart[0]['CartItems'].length; j++) {
    //                 if (cart[0]['CartItems'][j].ImageUrl != "NA") {
    //                     cart[0]['CartItems'][j].ImageUrl = Products_s3 + cart[0]['CartItems'][j].ImageUrl;
    //                 }
    //             }

    //             // Fetch store settings for latitude, longitude, and delivery pricing
    //             let getshop = `select * from AdminShopToggleSettings limit 0,1`;
    //             let settingslist = await CommonController.commonget(getshop);
    //             console.log(settingslist, 'settingslist');

    //             let storelatitude = settingslist[0]['Latitude'];
    //             let storeLongitude = settingslist[0]['Longitude'];

    //             // Get the radius (distance) between user location and store
    //             let getradiusresult = await getradius(storelatitude, storeLongitude, req.body);
    //             console.log(getradiusresult, 'getradiusresult', getradiusresult[0]['distance'], settingslist[0]['PricePerKm']);

    //             // Distance calculation
    //             let distance = parseFloat(getradiusresult[0]['distance']);
    //             let pricePerKm = parseFloat(settingslist[0]['PricePerKm']);

    //             // // If the distance exceeds 20 km, block the delivery
    //             // if (distance > 20) {
    //             //     return resp.status(200).json({
    //             //         "Status": 0,
    //             //         "Message": "Delivery not possible due to distance. The delivery radius is limited to 20 km."
    //             //     });
    //             // }

    //             // If the total price is 499 or more, offer free delivery
    //             let DeliveryCharges = 0;
    //             if (body.TotalAmount < 499) {
    //                 DeliveryCharges = distance * pricePerKm; // Calculate delivery charge based on distance
    //             }

    //             // Add delivery charges to the cart
    //             cart[0].DeliveryCharges = DeliveryCharges;
    //             console.log('Delivery Charges:', DeliveryCharges);

    //             // Respond with the updated cart details including delivery charges
    //             resp.status(200).json({ "Status": 1, "Cart": cart[0] });
    //         }
    //     } catch (err) {
    //         console.log("Exception in getting cart", err);
    //         return resp.status(500).json({ "Status": 0, "Message": "Error in getting cart" });
    //     }
    // },

    //newCOde
    getcartbyyserid: async (req, resp, next) => {
        try {
            console.log(req.body, 'cart body-----------------------------------------');

            // Fetch the current cart for the user
            let cart = await getcurrentcart(req.UserID);

            if (cart == 0) {
                return resp.status(200).json({ "Status": 1, "Cart": {} });
            } else {
                console.log(cart[0]['CartId'], 'cartid');

                // Fetch cart items
                let cartitems = await getcartitems(cart[0]['CartID']);
                
                // Run Central Pricing & Restriction Engine
                const body = req.body || {};
                const calculation = await PricingEngine.calculateCart(
                    cartitems,
                    body.PromoCode,
                    req.UserID,
                    { latitude: body.latitude || body.Latitude, longitude: body.longitude || body.Longitude }
                );

                cart[0]['CartItems'] = calculation.Items;
                cart[0].SubTotal = calculation.SubTotal;
                cart[0].OriginalSubTotal = calculation.OriginalSubTotal;
                cart[0].TotalSavings = calculation.TotalSavings;
                cart[0].CouponEligibleSubTotal = calculation.CouponEligibleSubTotal;
                cart[0].CashbackEligibleSubTotal = calculation.CashbackEligibleSubTotal;
                cart[0].CouponDiscount = calculation.CouponDiscount;
                cart[0].AppliedCartOffer = calculation.AppliedCartOffer;
                cart[0].CartOfferDiscount = calculation.CartOfferDiscount;
                cart[0].DeliveryCharges = calculation.DeliveryCharges;
                cart[0].LongDistanceFee = calculation.LongDistanceFee || 0;
                cart[0].IsLongDistance = calculation.IsLongDistance || false;
                cart[0].AdditionalDeliveryMinutes = calculation.AdditionalDeliveryMinutes || 0;
                cart[0].LargeCartNotice = calculation.LargeCartNotice || null;
                cart[0].SuggestedCoupons = calculation.SuggestedCoupons || [];
                cart[0].ProductUnlocks = calculation.ProductUnlocks || [];
                cart[0].UserMembership = calculation.UserMembership || null;
                cart[0].FreeDeliveryApplied = calculation.FreeDeliveryApplied;
                cart[0].CashbackEarned = calculation.CashbackEarned;
                cart[0].GrandTotal = calculation.GrandTotal;
                cart[0].Distance = calculation.Distance || 1;

                // Respond with the server-calculated cart details
                return resp.status(200).json({ "Status": 1, "Cart": cart[0] });
            }
        } catch (err) {
            console.log("Exception in getting cart", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in getting cart" });
        }
    },


    // Checkout bill: the exact amounts the order will be charged (see services/CheckoutBill.js).
    checkoutBill: async (req, resp) => {
        try {
            const body = req.body || {};
            const bill = await CheckoutBill.computeBill({
                userId: req.UserID,
                promoCode: body.PromoCode,
                latitude: body.Latitude,
                longitude: body.Longitude,
                tip: body.Tip,
                useWallet: body.UseWallet === true || body.UseWallet === 1 || body.UseWallet === '1' || body.UseWallet === 'true',
            });
            return resp.json({ Status: 1, Bill: bill });
        } catch (err) {
            console.log('checkout bill failed', err);
            return resp.status(500).json({ Status: 0, Message: 'Could not calculate your bill' });
        }
    },

    ValidateCart: async (req, resp, next) => {
        try {
            body = req.body || {};
            if (!body.OrderItems || !Array.isArray(body.OrderItems)) {
                return resp.status(400).json({ "Status": 0, "Message": "OrderItems array is required" });
            }
            let GetWalletAmount = `select * from Users where UserID=${req.UserID}`
            let WalletAmount = await CommonController.commonget(GetWalletAmount)
            console.log(GetWalletAmount, WalletAmount)
            if (WalletAmount.length > 0) {
                let UserWalletAmount = WalletAmount[0]['WalletAmount']
                if (body.WalletAmount && UserWalletAmount < body.WalletAmount) {
                    return resp.json({ "Status": 0, "Message": "Insufficient Wallet balance" })
                }

                for (let iterator of body.OrderItems) {
                    getproduct_availablestock = await getproductstock(iterator.VariantID, iterator.ProductID)
                    console.log('getproduct_availablestock**********', getproduct_availablestock, iterator.Quantity)
                    console.log('getproduct_availablestock**********', getproduct_availablestock, iterator.Quantity)

                    console.log(body.Quantity > getproduct_availablestock)
                    if (parseInt(iterator.Quantity) > parseInt(getproduct_availablestock)) {
                        console.log({ 'Status': 0, "Message": iterator.ProductName + ", you cant add more than " + getproduct_availablestock + " of this item" })
                        return resp.json({ 'Status': 0, "Message": iterator.ProductName + ", you cant add more than " + getproduct_availablestock + " of this item" })
                    }
                }
                console.log({ "Status": 1, "Message": "User can place order" })
                return resp.json({ "Status": 1, "Message": "User can place order" })
            }
            else {
                return resp.json({ "Status": 0, "Message": "User doesnot exists" })
            }




        }
        catch (err) {
            console.log("exception in adding cart ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in adding cart" });
        }
    },

    touchCartActivity: async (CartID) => {
        if (!CartID) return;
        try {
            await new Promise((resolve) => {
                pool.query("UPDATE Carts SET UpdatedAt = NOW() WHERE CartID = ?", [CartID], (err) => {
                    if (err) console.error("Error updating cart activity timestamp:", err);
                    resolve();
                });
            });
            // Mark any active abandoned cart log as recovered because customer resumed cart activity
            await new Promise((resolve) => {
                pool.query(
                    "UPDATE AbandonedCartLogs SET Status = 'recovered', RecoveredAt = NOW(), UpdatedAt = NOW() WHERE CartID = ? AND Status = 'active'",
                    [CartID],
                    (err) => {
                        if (err) console.error("Error updating abandoned cart log status:", err);
                        resolve();
                    }
                );
            });
        } catch (e) {
            console.error("Exception in touchCartActivity:", e);
        }
    },

    addcart: async (req, resp, next) => {
        try {
            body = req.body
            if (body.Quantity <= 0) {
                return resp.json({ 'Status': 0, "Message": "Quantity need to be greater that 0" })
            }


            getproduct_availablestock = await getproductstock(body.VariantID, body.ProductID)
            console.log('getproduct_availablestock**********', getproduct_availablestock, body.Quantity)
            if (body.Quantity > getproduct_availablestock) {
                return resp.json({ 'Status': 0, "Message": "limited Quantity available, you cant add more than " + getproduct_availablestock + " of this item" })
            }

            cartexists = await getcurrentcart(req.UserID)

            if (cartexists == 0) {
                console.log('cart doesnot exists')
                while (true) {
                    CartID = Math.floor((Math.random() * 1999999) + 1000000);
                    console.log(CartID, 'id generated'); // mostly demostrative
                    result = await checkID(CartID)
                    if (parseInt(result) === 1) break
                } // condition to determine when should the loop stop 


                Cart = await createcart(CartID, req.UserID)

                Cartitem = await createCartItems(body, CartID)

                return resp.status(200).json({ 'Status': 1, "Message": "Cart Added Successfully" })
            }


            else {
                console.log('cart exists')
                console.log('checking CartItems exists or not')
                Cartitemexists = await getcartitem(body, cartexists[0]['CartID'])

                if (Cartitemexists.length == 1) {
                    console.log(' cartitem exists')
                    updatecartitem = await updateexistingitem(body, cartexists[0]['CartID'])
                    if (updatecartitem == 0) {
                        return resp.status(400).json({ 'Status': 0, "Message": "error in adding Cartitem" })
                    }
                }
                else if (Cartitemexists.length == 0) {
                    console.log('cartitem doesnot exists')
                    Cartitem = await createCartItems(body, cartexists[0]['CartID'])
                }

                // Update cart activity timestamp & clear stale abandoned log
                await cartcontroller.touchCartActivity(cartexists[0]['CartID'])

                return resp.status(200).json({ 'Status': 1, "Message": "Cart Added Successfully" })
            }

        }
        catch (err) {
            console.log("exception in adding cart ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in adding cart" });
        }
    },

    deletecartitem_variant: async (req, resp, next) => {
        try {


            query = "SELECT * FROM Carts C inner join CartItems I on C.CartID=I.CartID where \
                C.UserID="+ pool.escape(req.UserID) + " and C.IsOrderLinked=1 and ProductID=" + pool.escape(req.params.ProductID) + " and VariantID=" + pool.escape(req.params.VariantID)

            getexicartitem = await getcartitem_variant(query)
            if (getexicartitem == 0) {
                return resp.status(400).json({ "Status": 0, "Message": "Item doesnot exists" });
            }
            id = getexicartitem[0]['CartItemID']
            const targetCartId = getexicartitem[0]['CartID']

            deletecartitem = await cartitemdelete(id)

            if (deletecartitem == 1) {
                // Refresh cart activity timestamp
                await cartcontroller.touchCartActivity(targetCartId)
                return resp.status(200).json({ "Status": 1, "Message": "CartItem deleted Successfully" })
            }
            else {
                return resp.status(400).json({ "Status": 0, "Message": "Error in deleting CartItem" })
            }






        }
        catch (err) {
            console.log("exception in deleting CartItem ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in deleting CartItem" });
        }
    },

    deletekit: async (req, resp, next) => {
        try {


            query = "SELECT * FROM Carts C inner join CartItems I on C.CartID=I.CartID where \
            C.UserID="+ pool.escape(req.UserID) + " and C.IsOrderLinked=1 and I.Type=2 and I.ProductID=" + pool.escape(req.params.KitID)

            getexicartitem = await getcartitem_variant(query)
            if (getexicartitem == 0) {
                return resp.status(400).json({ "Status": 0, "Message": "Item doesnot exists" });
            }
            id = getexicartitem[0]['CartItemID']
            const targetCartId = getexicartitem[0]['CartID']

            deletecartitem = await cartitemdelete(id)

            if (deletecartitem == 1) {
                // Refresh cart activity timestamp
                await cartcontroller.touchCartActivity(targetCartId)
                return resp.status(200).json({ "Status": 1, "Message": "CartItem deleted Successfully" })
            }
            else {
                return resp.status(400).json({ "Status": 0, "Message": "Error in deleting CartItem" })
            }






        }
        catch (err) {
            console.log("exception in deleting CartItem ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in deleting CartItem" });
        }
    },

    deletecart: async (req, resp, next) => {
        try {
            // Users may only delete their own cart.
            const owned = await new Promise((resolve, reject) => pool.query(
                "select CartID from Carts where CartID = ? and UserID = ?", [req.params.CartID, req.UserID],
                (err, rows) => (err ? reject(err) : resolve(rows))));
            if (!owned.length) {
                return resp.status(404).json({ "Status": 0, "Message": "Cart not found" });
            }
            const cartitems = await getcartitems(req.params.CartID)
            if (cartitems.length > 0) {
                await cartitems_delete(req.params.CartID)
            }
            await cartdelete(req.params.CartID)
            // Mark any active abandoned cart log as expired
            pool.query(
                "UPDATE AbandonedCartLogs SET Status = 'expired', UpdatedAt = NOW() WHERE CartID = ? AND Status = 'active'",
                [req.params.CartID],
                () => {}
            );
            return resp.json({ "Status": 1, "Message": "Cart cleared" });

        }
        catch (err) {
            console.log("exception in deleting CartItem ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in deleting CartItem" });
        }
    },
}



function getcurrentcart(UserID) {

    return new Promise(function (resolve, reject) {
        pool.query("select * from Carts where UserID = ? and IsOrderLinked=1", [UserID], function (err, results, fields) {
            if (err) {
                console.log("Error in checking CartID from DB :" + err);
                return reject(-1);
            }
            else {
                console.log(results.length, 'cart length')
                if (results.length == 1) {
                    resolve(results);
                }
                else {
                    resolve(0);
                }
            }
        });
    });
}

function getcartitem(body, CartId) {
    try {
        return new Promise(function (resolve, reject) {
            let query, params;
            if (body.Type == 2) {
                query = "select * from CartItems where CartId = ? and ProductID = ?"
                params = [CartId, body.KitID]
            }
            else {
                query = "select * from CartItems where CartId = ? and ProductID = ? and VariantID = ?"
                params = [CartId, body.ProductID, body.VariantID]
            }
            pool.query(query, params, function (err, results, fields) {
                if (err) {
                    console.log("Error in checking CartId from DB :" + err);
                    return reject(-1);
                }
                else {
                    console.log(parseInt(results.length), 'cart item length')
                    resolve(results);
                }
            });
        });
    }
    catch (err) {
        console.log("Error in checking CartId from DB :" + err);
        return reject(-1);
    }
}

function createcart(CartID, UserID) {
    try {
        return new Promise(function (resolve, reject) {

            let InsertCarts = { CartID: CartID, UserID: UserID, isOrderLinked: 1 }
            let sql = "INSERT INTO Carts set ?";
            pool.query(sql, InsertCarts, (err, results) => {
                if (err) console.log('db error', err.sqlMessage || err.message); results = results || { affectedRows: 0 };  // never crash on a failed query
                console.log('post method', results, err)
                if (results.affectedRows === 1) {
                    resolve(1)
                }
                else {
                    console.log("error in insert Product to Cart table ", results.affectedRows);
                    reject(-1)
                }
            })
        });
    }
    catch (err) {
        console.log("error in insert Product to Cart table ", err);
        reject(-1)
    }
}

function createCartItems(body, CartID) {
    try {
        return new Promise(function (resolve, reject) {

            if (body.ProductID == null || body.ProductID == undefined)
                body.ProductID = 'NA'

            if (body.VariantID == null || body.VariantID == undefined)
                body.VariantID = 'NA'

            if (body.Type == null || body.Type == undefined)
                body.Type = 'NA'

            if (body.Type == 2) {
                body.ProductID = body.KitID
            }

            let InsertCartItems = { CartID: CartID, ProductID: body.ProductID, Quantity: body.Quantity, VariantID: body.VariantID, Type: body.Type }
            let sql = "INSERT INTO CartItems set ?";
            pool.query(sql, InsertCartItems, (err, results) => {
                if (err) console.log('db error', err.sqlMessage || err.message); results = results || { affectedRows: 0 };  // never crash on a failed query
                console.log('post method', results, err)
                if (results.affectedRows === 1) {
                    resolve(1)
                }
                else {
                    console.log("error in insert CartItems to table ", results.affectedRows);
                    reject(-1)
                }
            })
        });
    }
    catch (err) {
        console.log("error in insert CartItems to table ", err);
        reject(-1)
    }
}

function updateexistingitem(body, CartId) {

    return new Promise(function (resolve, reject) {
        const Quantity = parseInt(body.Quantity, 10) || 0;
        let query, params;
        if (body.Type == 2) {
            query = "update CartItems set Quantity = ? where CartId = ? and ProductID = ?"
            params = [Quantity, CartId, body.KitID]
        }
        else {
            query = "update CartItems set Quantity = ? where CartId = ? and ProductID = ? and VariantID = ?"
            params = [Quantity, CartId, body.ProductID, body.VariantID]
        }
        pool.query(query, params, function (err, results, fields) {
            if (err) {
                console.log("Error in checking CartId from DB :" + err);
                reject(-1);
            }
            else {
                if (results.affectedRows === 1) {
                    console.log("cartitem updated: ");
                    resolve(1);
                }
                else {
                    console.log("cartitem update failed");
                    resolve(0);
                }
            }
        });
    });
}

function checkID(CartID) {

    return new Promise(function (resolve, reject) {
        pool.query("select * from Carts where CartID = ?", [CartID], function (err, results, fields) {
            if (err) {
                console.log("Error in checking CartID from DB :" + err);
                reject(0);
            }
            else {
                console.log(parseInt(results.length), 'id length')
                if (parseInt(results.length) === 1) {
                    console.log("ID already useD : " + CartID);
                    resolve(0);
                }
                else {
                    console.log("ID not in used :" + CartID);
                    resolve(1);
                }
            }
        });
    });
}

function getproductstock(VariantID, ProductID) {
    try {
        return new Promise(function (resolve, reject) {

            query = `select pv.* from Products p inner join ProductVariants pv on pv.ProductID=p.ProductID and
                pv.VariantID=? and  p.ProductID=? and p.status=1`
            console.log(query, VariantID, ProductID)
            console.log(query)
            pool.query(query, [VariantID, ProductID], function (err, results, fields) {
                if (err) {
                    console.log("Error in checking ProductID from DB :" + err);
                    reject(-1);
                }
                else {
                    console.log(parseInt(results.length), 'product length')
                    if (results.length > 0) {
                        resolve(results[0]['AvailableQty']);
                    }
                    else {
                        resolve(0)
                    }
                }
            });
        });
    }
    catch (err) {
        reject(-1);
    }
}

function getcartitems(CartID) {
    try {
        return new Promise(function (resolve, reject) {

            const query = "select CI.ProductID,CI.Type,P.ProductName,P.Description,P.ImageUrl,P.ProductImages,V.AvailableQty\
                    ,CI.VariantID,CI.Quantity,V.metricvalue,V.metrictype,V.Price,V.OfferPrice,V.Buy2Price,0 as KitID,P.CategoryID,P.SubCategoryID,V.maxQty from CartItems CI inner join \
                    Products P on P.ProductID=CI.ProductID inner join ProductVariants V on V.VariantID=CI.VariantID where \
                    P.Status=1 and V.AvailableQty>0 and CI.CartID = ?"
            pool.query(query, [CartID], async function (err, results, fields) {
                if (err) {
                    console.log("Error in checking CartId from DB :" + err);
                    reject(-1);
                }
                else {
                    console.log(parseInt(results.length), 'cart length')
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
                        console.log(results[j].ProductImages, '--------------------')
                        items = await CommonController.getkititems(results[j]['KitID'], "user")
                        results[j].KitItems = items
                    }
                    resolve(results);
                }
            });
        });
    }
    catch (err) {
        reject(-1);
    }
}

function getcartitem_variant(query) {

    return new Promise(function (resolve, reject) {
        // query="SELECT * FROM Carts C inner join CartItems I on C.CartID=I.CartID where \
        // C.UserID="+UserID+" and C.IsOrderLinked=1 and ProductID="+ProductID+" and VariantID="+VariantID
        console.log(query, 'cartitem variant*******************')
        pool.query(query, function (err, results, fields) {
            if (err) {
                console.log("Error in checking CartId from DB :" + err);
                reject(0);
            }
            else {
                console.log(results.length === 1, 'cartitem affected rows')
                if (results.length == 1) {
                    resolve(results);
                }
                else {
                    console.log("cart doesnot exists :");
                    resolve(0);
                }
            }
        });
    });
}

function cartitemdelete(CartItemID) {

    return new Promise(function (resolve, reject) {
        pool.query("delete from CartItems where CartItemID=?", [CartItemID], function (err, results, fields) {
            if (err) {
                console.log("Error in checking CartId from DB :" + err);
                reject(0);
            }
            else {
                console.log(results.affectedRows === 1, 'cartitem affected rows')
                if (results.affectedRows == 1) {
                    resolve(1);
                }
                else {
                    console.log("cart doesnot exists :");
                    resolve(0);
                }
            }
        });
    });
}

function cartdelete(CartID) {

    return new Promise(function (resolve, reject) {
        pool.query("delete from Carts where CartID=?", [CartID], function (err, results, fields) {
            if (err) {
                console.log("Error in checking CartID from DB :" + err);
                reject(0);
            }
            else {

                console.log(results.affectedRows, 'cart delete affected rows')
                if (results.affectedRows === 1) {
                    console.log("cart exists: ");
                    resolve(1);
                }
                else {
                    console.log("error in cart delete");
                    reject(0);
                }
            }
        });
    });
}

function cartitems_delete(CartID) {

    return new Promise(function (resolve, reject) {
        pool.query("delete from CartItems where CartID=?", [CartID], function (err, results, fields) {
            if (err) {
                console.log("Error in checking CartID from DB :" + err);
                reject(0);
            }
            else {

                console.log(results.affectedRows, 'cartitems delete affected rows')
                if (results.affectedRows > 0) {
                    console.log("cart exists: ");
                    resolve(1);
                }
                else {
                    console.log("No items to delete");
                    resolve(1);
                }
            }
        });
    });
}

function getradius(storelatitude, storeLongitude, body) {

    return new Promise(function (resolve, reject) {
        try {
            query = "SELECT ROUND(6371 * acos (cos ( radians(" + (Number(body.Latitude) || 0) + ") ) * cos( radians( " + (Number(storelatitude) || 0) + " ) ) * \
                cos( radians( " + (Number(storeLongitude) || 0) + " ) - radians(" + (Number(body.Longitude) || 0) + ") ) + \
                sin ( radians(" + (Number(body.Latitude) || 0) + ") ) * sin( radians( " + (Number(storelatitude) || 0) + " ) ))) AS distance"
            console.log(query)
            pool.query(query, function (err, results, fields) {
                if (err) {
                    console.log("Error in checking delivery boy :" + err);
                    return resolve(-1)
                }
                else {
                    resolve(results);
                }
            });
        }
        catch (err) {
            return resolve(-1)
        }

    });
}

function getDistance_googleAPIDistanceMatrix(storelatitude, storeLongitude, body) {
    return new Promise((resolve, reject) => {
        if ((body.Latitude != undefined && body.Longitude != undefined) && (body.Latitude > 0 && body.Longitude > 0)) {
            const params = querystring.stringify(
                {
                    origins: `${storelatitude},${storeLongitude}`,
                    destinations: `${body.Latitude},${body.Longitude}`,
                    mode: "driving",
                    key: process.env.GOOGLE_APIKEY
                });
            const options =
            {
                hostname: 'maps.googleapis.com',
                path: `/maps/api/distancematrix/json?${params}`,
                method: 'GET'
            };
            https.request(options, (response) => {
                let data = '';
                response.on('data', (chunk) => { data += chunk; });
                response.on('end', () => {
                    console.log("Google Distance Matrix API response: ", process.env.GOOGLE_APIKEY, JSON.parse(data));
                    console.log("Google Distance Matrix API response: ", (JSON.parse(data).rows[0].elements[0].distance.text));
                    let distanceinKMs = (JSON.parse(data).rows[0].elements[0].distance.text).split(" ")[0];
                    resolve(distanceinKMs);
                });
            }).on('error', (error) => { console.error('Error:', error); }).end();
        }
        else {
            console.log("Latitude and Longitude values are invalid: ", body);
            resolve(0);
        }
    })
}

cartcontroller.getAbandonedCarts = async (req, resp) => {
    try {
        // Run background sync runner for notifications and logs
        RetentionEngine.processAbandonedCarts(8).catch(e => console.error('[RetentionEngine] Background sync notice:', e.message));

        const query = `
            SELECT 
                COALESCE(acl.LogID, c.CartID) AS LogID,
                c.CartID,
                c.UserID,
                u.FirstName, u.LastName, u.MobileNumber, u.EmailID,
                COALESCE(acl.Status, 'active') AS Status,
                COALESCE(NULLIF(acl.TotalAmount, 0), cart_calc.CalculatedTotal, 0) AS TotalAmount,
                cart_calc.ItemCount,
                acl.CartSnapshot,
                acl.ReminderSentAt,
                acl.ReminderCount,
                cart_calc.LastActivity,
                ROUND(TIMESTAMPDIFF(SECOND, cart_calc.LastActivity, NOW()) / 3600.0, 1) AS HoursSinceActivity,
                DATE_ADD(cart_calc.LastActivity, INTERVAL 8 HOUR) AS AbandonedAt
            FROM Carts c
            JOIN (
                SELECT 
                    ci.CartID,
                    COUNT(ci.CartItemID) AS ItemCount,
                    COALESCE(SUM(ci.Quantity * COALESCE(NULLIF(pv.OfferPrice, 0), pv.Price, ci.Price, 0)), 0) AS CalculatedTotal,
                    GREATEST(COALESCE(c_sub.UpdatedAt, c_sub.created_at), COALESCE(MAX(ci.UpdatedAt), c_sub.UpdatedAt, c_sub.created_at)) AS LastActivity
                FROM Carts c_sub
                JOIN CartItems ci ON c_sub.CartID = ci.CartID
                LEFT JOIN ProductVariants pv ON ci.VariantID = pv.VariantID
                WHERE c_sub.isOrderLinked = 1
                GROUP BY ci.CartID, c_sub.UpdatedAt, c_sub.created_at
                HAVING ItemCount > 0
                   AND LastActivity < DATE_SUB(NOW(), INTERVAL 8 HOUR)
            ) cart_calc ON c.CartID = cart_calc.CartID
            LEFT JOIN AbandonedCartLogs acl ON c.CartID = acl.CartID AND acl.Status = 'active'
            LEFT JOIN Users u ON c.UserID = u.UserID
            WHERE c.isOrderLinked = 1
            ORDER BY cart_calc.LastActivity DESC
            LIMIT 200
        `;
        pool.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching abandoned carts:', err);
                return resp.status(500).json({ Status: 0, Message: 'Error fetching abandoned carts' });
            }
            return resp.json({ Status: 1, AbandonedCarts: results });
        });
    } catch (err) {
        console.error('Error during abandoned cart list processing:', err);
        return resp.status(500).json({ Status: 0, Message: 'Error fetching abandoned carts' });
    }
};

cartcontroller.updateAbandonedCartStatus = (req, resp) => {
    const { LogID, Status, CartID } = req.body;
    if ((!LogID && !CartID) || !Status) {
        return resp.status(400).json({ Status: 0, Message: 'LogID or CartID and Status are required' });
    }
    const targetId = LogID || CartID;
    const updateQuery = `
        UPDATE AbandonedCartLogs 
        SET Status = ?, 
            RecoveredAt = IF(? = 'recovered', NOW(), RecoveredAt),
            UpdatedAt = NOW() 
        WHERE LogID = ? OR CartID = ?
    `;
    pool.query(updateQuery, [Status, Status, targetId, targetId], (err, result) => {
        if (err) {
            console.error('Error updating abandoned cart status:', err);
            return resp.status(500).json({ Status: 0, Message: 'Error updating status' });
        }
        return resp.json({ Status: 1, Message: 'Status updated successfully' });
    });
};

cartcontroller.getAbandonedCartDetails = (req, resp) => {
    const id = req.params.id || req.body.LogID || req.body.CartID;
    if (!id) {
        return resp.status(400).json({ Status: 0, Message: 'LogID or CartID is required' });
    }
    const query = `
        SELECT 
            COALESCE(acl.LogID, c.CartID) AS LogID,
            c.CartID,
            c.UserID,
            u.FirstName, u.LastName, u.MobileNumber, u.EmailID,
            COALESCE(acl.Status, 'active') AS Status,
            COALESCE(NULLIF(acl.TotalAmount, 0), cart_calc.CalculatedTotal, 0) AS TotalAmount,
            cart_calc.ItemCount,
            acl.CartSnapshot,
            acl.ReminderSentAt,
            acl.ReminderCount,
            cart_calc.LastActivity,
            ROUND(TIMESTAMPDIFF(SECOND, cart_calc.LastActivity, NOW()) / 3600.0, 1) AS HoursSinceActivity,
            DATE_ADD(cart_calc.LastActivity, INTERVAL 8 HOUR) AS AbandonedAt
        FROM Carts c
        JOIN (
            SELECT 
                ci.CartID,
                COUNT(ci.CartItemID) AS ItemCount,
                COALESCE(SUM(ci.Quantity * COALESCE(NULLIF(pv.OfferPrice, 0), pv.Price, ci.Price, 0)), 0) AS CalculatedTotal,
                GREATEST(COALESCE(c_sub.UpdatedAt, c_sub.created_at), COALESCE(MAX(ci.UpdatedAt), c_sub.UpdatedAt, c_sub.created_at)) AS LastActivity
            FROM Carts c_sub
            JOIN CartItems ci ON c_sub.CartID = ci.CartID
            LEFT JOIN ProductVariants pv ON ci.VariantID = pv.VariantID
            WHERE c_sub.isOrderLinked = 1
            GROUP BY ci.CartID, c_sub.UpdatedAt, c_sub.created_at
            HAVING ItemCount > 0
        ) cart_calc ON c.CartID = cart_calc.CartID
        LEFT JOIN AbandonedCartLogs acl ON c.CartID = acl.CartID
        LEFT JOIN Users u ON c.UserID = u.UserID
        WHERE acl.LogID = ? OR c.CartID = ?
        LIMIT 1
    `;
    pool.query(query, [id, id], async (err, results) => {
        if (err) {
            console.error('Error fetching abandoned cart details:', err);
            return resp.status(500).json({ Status: 0, Message: 'Error fetching details' });
        }
        if (results.length === 0) {
            return resp.status(404).json({ Status: 0, Message: 'Record not found' });
        }
        const cartRecord = results[0];
        try {
            let parsed = [];
            if (typeof cartRecord.CartSnapshot === 'string') {
                parsed = JSON.parse(cartRecord.CartSnapshot);
            } else if (Array.isArray(cartRecord.CartSnapshot)) {
                parsed = cartRecord.CartSnapshot;
            }
            if (!Array.isArray(parsed) || parsed.length === 0) {
                const liveItems = await RetentionEngine.getCartItemSnapshot(cartRecord.CartID);
                cartRecord.CartSnapshot = liveItems;
            }
        } catch (e) {
            const liveItems = await RetentionEngine.getCartItemSnapshot(cartRecord.CartID);
            cartRecord.CartSnapshot = liveItems;
        }
        return resp.json({ Status: 1, AbandonedCart: cartRecord });
    });
};

cartcontroller.triggerAbandonedCartNotifications = async (req, resp) => {
    try {
        const thresholdHours = (req.query && req.query.hours) || (req.body && req.body.hours) || 8;
        const result = await RetentionEngine.processAbandonedCarts(parseInt(thresholdHours, 10));
        return resp.json({ Status: 1, ...result });
    } catch (err) {
        console.error('Error triggering abandoned cart notifications:', err);
        return resp.status(500).json({ Status: 0, Message: 'Error triggering notifications' });
    }
};

module.exports = cartcontroller;

