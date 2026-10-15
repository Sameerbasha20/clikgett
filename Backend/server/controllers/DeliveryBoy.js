const express = require('express');
const mysql = require('mysql');
const AWS = require('aws-sdk');
require('dotenv').config()
var fs = require('fs')
var moment = require('moment');
// const accesstoken=require("../controllers/utils")
const CommonController = require("../controllers/CommonController");


const pool = require('../utils/db');
const s3 = require('../utils/s3');

deliveryboy_s3 = "https://clikgett.s3.ap-south-1.amazonaws.com/deliveryboys/"

const deliveryboycontroller = {

    getdeliveryboydetail: async (req, resp, next) => {
        try {

            AdminID = req.AdminID
            pool.query("select * from Adminusers where AdminID=? and Role=2", [AdminID], (err, results) => {
                console.log('connecting')
                if (err) {

                    return resp.json({ "Status": 0, "Message": err.sqlMessage });
                }

                if (results.length > 0) {
                    for (var j = 0; j < results.length; j++) {
                        if (results[j].profilePic != "NA") {
                            results[j].profilePic = deliveryboy_s3 + results[j].profilePic
                        }

                    }
                    resp.json({ "Status": 1, "DeliveryBoy": results[0] })
                }
                else {
                    resp.json({ "Status": 1, "DeliveryBoy": [] })
                }

            });




        }
        catch (e) {


            console.log(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },

    SendotpLogin: async (req, resp, next) => {
        try {
            // const keys = Object.keys(req.body);
            var userData = await getuserbymobilenum(req.body.MobileNumber)
            console.log(JSON.stringify(userData), 'deliverboy data send otp')
            var OTP = Math.floor((Math.random() * 8999) + 1000)
            // OTP = 1234
            if (userData.length === 1) {
                if (userData[0]['Status'] == 0) {
                    return resp.status(200).json({ "Status": 0, "Message": "Your account has been deleted. Please reach out to the administrator" });
                }
                if (userData[0]['Status'] == 2) {
                    return resp.status(200).json({ "Status": 0, "Message": "Your account has been deactivated. Please reach out to the administrator" });
                }
                if (req.body.MobileNumber != '9999999999') {
                    await CommonController.sendSms(req.body.MobileNumber, OTP)
                    pool.query("update AdminUsers set OTP=? where MobileNumber=?", [OTP, req.body.MobileNumber], function (err, results) {
                        if (err) { return resp.status(400).json({ "Status": 0, "Message": "error in updating otp" }) }
                    })
                }
                return resp.status(200).json({ "Status": 1, "Message": "OTP sent successfully" });
            }

            else {
                return resp.status(200).json({ "Status": 0, "Message": "Account doesnot exists" });
            }

        }
        catch (err) {
            console.log("exception in user login with MobileNumber ", err);
            return resp.status(200).json({ "Status": 0, "Message": "Error in login with mobile number" });
        }
    },

    deliveryboylogin: async (req, resp, next) => {
        try {
            console.log(`deliveryboy login : ${JSON.stringify(req.body)}`)
            emaildata = await Verifyemail(req.body)
            console.log(`deliveryboy data : ${JSON.stringify(emaildata)}`)
            if (emaildata == 0) {
                return resp.status(200).json({ "Status": 0, "Message": "Email doesnot exists" });
            }
            var userData = await Verifylogin(req.body)
            console.log(`userData : ${JSON.stringify(userData)}`)
            if (typeof (userData) === 'object') {
                if (userData['Status'] == 0) {
                    return resp.status(200).json({ "Status": 0, "Message": "Your account has been deleted. Please reach out to the administrator" });
                }
                if (userData['Status'] == 2) {
                    return resp.status(200).json({ "Status": 0, "Message": "Your account has been deactivated. Please reach out to the administrator" });
                }
                req.userData = userData
                console.log(req.userData)
                next();
            }
            else if (userData == 2) {
                return resp.status(200).json({ "Status": 0, "Message": "Incorrect password" });
            }
            else {
                return resp.status(200).json({ "Status": 0, "Message": "Login failed" });
            }
        }
        catch (err) {
            console.log("exception in user login with MobileNumber ", err);
            return resp.status(200).json({ "Status": 0, "Message": "Error in login with mobile number" });
        }
    },


    Sendotp_Orders: async (req, resp, next) => {
        try {
            let OrderID = parseInt(req.body.OrderID, 10);
            if (isNaN(OrderID)) {
                return resp.status(400).json({ "Status": 0, "Message": "Invalid OrderID" });
            }
            pool.query("SELECT * FROM Orders WHERE OrderID = ?", [OrderID], async (err, ResultOrders) => {
                if (err) {
                    console.log("exception in querying order for otp ", err);
                    return resp.status(500).json({ "Status": 0, "Message": "Error querying order" });
                }
                if (!ResultOrders || ResultOrders.length == 0) {
                    return resp.json({ "Status": 0, "Message": "Order doesnot exists" });
                }
                var OTP = Math.floor((Math.random() * 8999) + 1000);
                pool.query("UPDATE Orders SET OTP = ? WHERE OrderID = ?", [OTP, OrderID], (updateErr) => {
                    if (updateErr) {
                        console.log("exception in updating otp ", updateErr);
                        return resp.status(500).json({ "Status": 0, "Message": "Error in updating otp" });
                    }
                    return resp.status(200).json({ "Status": 1, "Message": "OTP sent successfully" });
                });
            });
        }
        catch (err) {
            console.log("exception in sending otp to user ", err);
            return resp.status(200).json({ "Status": 0, "Message": "Error in sending otp" });
        }
    },

    Orders_VerifyOTP: async (req, resp, next) => {
        try {
            let Body = req.body;
            let OrderID = parseInt(Body.OrderID, 10);
            let OTP = Body.OTP ? Body.OTP.toString().trim() : '';
            if (isNaN(OrderID) || !OTP) {
                return resp.status(400).json({ "Status": 0, "Message": "OrderID and OTP required" });
            }
            pool.query("SELECT * FROM Orders WHERE OrderID = ? AND OTP = ?", [OrderID, OTP], (err, ResultOrders) => {
                if (err) {
                    console.log("exception in verifying otp ", err);
                    return resp.status(500).json({ "Status": 0, "Message": "Error in verify otpuser" });
                }
                if (!ResultOrders || ResultOrders.length == 0) {
                    return resp.json({ "Status": 0, "Message": "Invalid OTP" });
                }

                return resp.status(200).json({ "Status": 1, "Message": "OTP verified successfully" });
            });
        }
        catch (err) {
            console.log("exception in verify otp userorder ", err);
            return resp.status(200).json({ "Status": 0, "Message": "Error in verify otpuser" });
        }
    },


    // deliveryboylogin : async (req, resp, next) => {
    //     try {
    //         emaildata = await Verifyemail(req.body)
    //         if(emaildata==0){
    //                 return resp.status(400).json({ "Status": 0, "Message": "Email doesnot exists" });
    //             }
    //         var userData = await Verifylogin(req.body)

    //         if (typeof (userData) === 'object') {
    //             req.userData=userData                
    //             console.log(req.userData)
    //             next();

    //             }
    //         else if(userData==2){
    //             return resp.status(400).json({ "Status": 0, "Message": "Incorrect password" });
    //         }            
    //         else {
    //             return resp.status(400).json({ "Status": 0, "Message": "Login failed" });
    //         }
    //     }
    //     catch (err) {
    //         console.log("exception in user login with MobileNumber ", err);
    //         return resp.status(500).json({ "Status": 0, "Message": "Error in login with mobile number" });
    //     }
    // },

    get_routes: async (req, resp, next) => {
        try {
            results = await getroutes(req.AdminID, req.query.Type)
            if (req.query.Type == "pending") {
                var GetOrders = `select o.*,u.FirstName as UserName,LPAD(OrderID, 4, '0') AS OrderSequence from Orders o inner join Users u on 
                 u.UserID=o.UserID where o.OrderStatus not in (1,4,3,6) and o.DeliveryBoyID=${req.AdminID}`
            }
            else {
                var GetOrders = `select o.*,u.FirstName as UserName,LPAD(OrderID, 4, '0') AS OrderSequence from Orders o inner join Users u on 
                 u.UserID=o.UserID where o.OrderStatus in (1,3,4,6) and o.DeliveryBoyID=${req.AdminID}`
            }
            console.log(GetOrders, " : GetOrders")
            let OrdersResult = await CommonController.commonget(GetOrders)


            console.log(OrdersResult, " : get routes order result")
            // if(results.length>0){
            //     for (var j = 0; j < results.length; j++){                        
            //         results[j].NoOfOrders = JSON.parse(results[j].OrderIDs).length
            //         }
            //     }
            for (let iterator of OrdersResult) {
                iterator.SubTotal = formatToSingleDecimal(parseFloat(iterator.SubTotal));
                iterator.GrandTotal = formatToSingleDecimal(parseFloat(iterator.GrandTotal));
                iterator.PromoAmount = formatToSingleDecimal(parseFloat(iterator.PromoAmount));
                iterator.Discount = formatToSingleDecimal(parseFloat(iterator.Discount));

            }

            resp.json({ "Status": 1, "Orders": OrdersResult })
        }
        catch (e) {
            console.log(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },

    ordersbyroute: async (req, resp, next) => {
        try {
            results = await getroutes(req.query.RouteID, 'byid')
            console.log(results, req.query.RouteID)
            if (results.length > 0) {
                results[0].OrderIDs = JSON.parse(results[0].OrderIDs);
                console.log(results[0].OrderIDs)
                orders = []
                for (var j = 0; j < results[0].OrderIDs.length; j++) {
                    console.log(results[0].OrderIDs, results[0].OrderIDs[j])
                    orderresult = await getorder(results[0].OrderIDs[j])
                    orders.push(orderresult)
                }
                results[0]['Orders'] = orders
                resp.json({ "Status": 1, "Orders": results })
            }
            else {
                resp.json({ "Status": 1, "Orders": [] })
            }
        }
        catch (e) {
            console.log(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },

    myorder: async (req, resp, next) => {
        try {
            myorder = await getorder(req.query.OrderID)
            console.log(myorder.length)
            if (myorder != {}) {
                // Check Admin visibility configuration for Delivery personnel
                const toggleSettings = await new Promise(r => pool.query("SELECT DeliveryAddressVisibility, DeliveryProductListVisibility FROM AdminShopToggleSettings LIMIT 1", (e, rows) => r(rows && rows.length > 0 ? rows[0] : null)));
                const addressVisible = toggleSettings ? toggleSettings.DeliveryAddressVisibility == 1 : true;
                const productsVisible = toggleSettings ? toggleSettings.DeliveryProductListVisibility == 1 : true;

                myorder.DeliveryAddressVisibility = addressVisible ? 1 : 0;
                myorder.DeliveryProductListVisibility = productsVisible ? 1 : 0;

                if (productsVisible) {
                    cartitems = await getorderitems(myorder.OrderID)
                    if (cartitems == 0) {
                        orderitems = []
                    }
                    myorder.orderitems = cartitems
                } else {
                    myorder.orderitems = []
                }

                if (!addressVisible) {
                    myorder.Address = "Delivery Address visibility disabled by Admin";
                    myorder.FlatNo = "";
                    myorder.LandMark = "";
                    myorder.Latitude = null;
                    myorder.Longitude = null;
                }

                myorder.CreatedAt = moment(myorder.CreatedAt).add(5, 'hours').add(30, 'minutes').format('DD-MM-YYYY hh:mm:ss A');
                myorder.Delivered_Cancelled_datetime = moment(myorder.Delivered_Cancelled_datetime).format('DD-MM-YYYY hh:mm:ss A');
                myorder.deliveredDateTime = moment(myorder.deliveredDateTime).format('DD-MM-YYYY hh:mm:ss A');
                myorder.OrderArrivedDateTime = moment(myorder.OrderArrivedDateTime).format('DD-MM-YYYY hh:mm:ss A');
                console.log('here')
                resp.json({ "Status": 1, "Orders": myorder })
            }
            else {
                resp.json({ "Status": 1, "Orders": {} })
            }
        }
        catch (err) {
            console.log("exception in getting orders", err);
            return resp.json({ "Status": 0, "Message": "Error in getting orders" });
        }
    },

        updatestatus: async (req, resp, next) => {
        try {
            const Body = req.body;
            const OrderID = parseInt(req.params.OrderID, 10);
            const driverId = req.AdminID;

            if (isNaN(OrderID)) {
                return resp.status(400).json({ "Status": 0, "Message": "Invalid OrderID" });
            }

            const order = await getorderbyorderid(OrderID);
            if (!order || order.length == 0) {
                return resp.json({ "Status": 0, "Message": "order not found" });
            }

            const currentStatus = order[0].OrderStatus;
            const targetStatus = parseInt(Body.OrderStatus, 10);

            if (isNaN(targetStatus)) {
                return resp.status(400).json({ "Status": 0, "Message": "Valid numeric OrderStatus is required" });
            }

            if (currentStatus == 1 && targetStatus == 4) {
                return resp.json({ "Status": 0, "Message": "Order delivered cannot be canceled" });
            }
            if (currentStatus == 1) {
                return resp.json({ "Status": 0, "Message": "Order delivered cannot be updated to any other status" });
            }

            // Status transition state machine validation
            // 2 (Assigned/Packed) -> 5 (Picked Up / Out for Delivery)
            // 5 (Picked Up) -> 7 (Arrived at Door)
            // 7 (Arrived) -> 1 (Delivered via OTP verification)
            if (targetStatus === 1 && currentStatus !== 7 && !Body.adminBypass) {
                return resp.status(400).json({ 
                    "Status": 0, 
                    "Message": "Cannot mark order delivered before arriving at customer door." 
                });
            }
            if (targetStatus === 7 && currentStatus !== 5 && !Body.adminBypass) {
                return resp.status(400).json({ 
                    "Status": 0, 
                    "Message": "Cannot mark arrived before picking up the order from store." 
                });
            }

            // Geofence Proximity Validation for Arrived at Door (Status 7)
            if (targetStatus === 7) {
                const driverLat = parseFloat(Body.Latitude);
                const driverLng = parseFloat(Body.Longitude);
                const customerLat = parseFloat(order[0].Latitude);
                const customerLng = parseFloat(order[0].Longitude);

                if (!isNaN(driverLat) && !isNaN(driverLng) && !isNaN(customerLat) && !isNaN(customerLng)) {
                    // Haversine distance calculation in meters
                    const R = 6371e3;
                    const phi1 = (driverLat * Math.PI) / 180;
                    const phi2 = (customerLat * Math.PI) / 180;
                    const deltaPhi = ((customerLat - driverLat) * Math.PI) / 180;
                    const deltaLambda = ((customerLng - driverLng) * Math.PI) / 180;
                    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                              Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const distanceMeters = Math.round(R * c);

                    const GEOFENCE_RADIUS_METERS = 250;
                    if (distanceMeters > GEOFENCE_RADIUS_METERS && !Body.manualOverride) {
                        return resp.json({
                            "Status": 0,
                            "RequiresOverride": true,
                            "DistanceMeters": distanceMeters,
                            "Message": `You are ${distanceMeters}m away from customer destination. Please move closer or confirm manual arrival.`
                        });
                    }

                    if (Body.manualOverride) {
                        const overrideReason = Body.overrideReason || "Driver confirmed manual arrival override (GPS/Address pin discrepancy)";
                        pool.query(
                            "INSERT INTO OrderStatusTimeline (OrderID, OrderStatus, Notes, CreatedAt) VALUES (?, 7, ?, NOW())",
                            [OrderID, `Manual arrival override (${distanceMeters}m away). Reason: ${overrideReason}`]
                        );
                    }
                }
            }

            var datetimenow = new Date(Date.now());
            let currentdatetime = moment(datetimenow).add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
            let deliveredDateTimeVal = (targetStatus === 1) ? currentdatetime : null;
            let orderArrivedDateTimeVal = (targetStatus === 7) ? currentdatetime : null;
            let pickedUpAtVal = (targetStatus === 5) ? currentdatetime : null;
            let currentLegVal = (targetStatus === 5) ? 'OUT_FOR_DELIVERY' : ((targetStatus === 7) ? 'ARRIVED_DOOR' : ((targetStatus === 1) ? 'DELIVERED' : 'ASSIGNED'));

            const updateSql = `
                UPDATE Orders 
                SET OrderStatus = ?, 
                    DeliveryBoyID = COALESCE(?, DeliveryBoyID), 
                    deliveredDateTime = COALESCE(?, deliveredDateTime), 
                    Delivered_Cancelled_datetime = COALESCE(?, Delivered_Cancelled_datetime),
                    OrderArrivedDateTime = COALESCE(?, OrderArrivedDateTime),
                    PickedUpAt = COALESCE(?, PickedUpAt),
                    CurrentLeg = ?,
                    UpdatedAt = NOW()
                WHERE OrderID = ?
            `;

            pool.query(updateSql, [
                targetStatus, 
                driverId, 
                deliveredDateTimeVal, 
                deliveredDateTimeVal, 
                orderArrivedDateTimeVal, 
                pickedUpAtVal, 
                currentLegVal, 
                OrderID
            ], async (err, result) => {
                if (err) {
                    console.error("Error updating order status in DB: ", err);
                    return resp.status(500).json({ "Status": 0, "Message": "Error updating database" });
                }

                // Push notifications
                if (targetStatus == 5 || targetStatus == 8 || targetStatus == 7) {
                    try {
                        const notificationBody = await CommonController.notificationMessages(targetStatus, OrderID);
                        if (req.body.UserID || order[0].UserID) {
                            await CommonController.Send_Notification(notificationBody, req.body.UserID || order[0].UserID);
                        }
                    } catch (notifErr) {
                        console.warn("Notification error: ", notifErr.message);
                    }
                }

                // Log timeline event
                const statusNames = { 2: "Assigned", 5: "Picked Up / Out for Delivery", 7: "Arrived at Door", 1: "Delivered", 4: "Cancelled" };
                const noteText = `Order transitioned to ${statusNames[targetStatus] || targetStatus} by driver #${driverId}`;
                pool.query(
                    "INSERT INTO OrderStatusTimeline (OrderID, OrderStatus, Notes, CreatedAt) VALUES (?, ?, ?, NOW())",
                    [OrderID, targetStatus, noteText]
                );

                return resp.status(200).json({ "Status": 1, "Message": "Order Update Successful", "OrderStatus": targetStatus });
            });
        }
        catch (err) {
            console.log("exception in updating Orders ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in updating Orders" });
        }
    },

    updatedeliveryboy: async (req, resp, next) => {
        try {
            const Body = req.body || {}
            const AdminID = req.AdminID

            if (Body.profilePic != null || Body.profilePic != undefined) {
                await convertimage(AdminID, Body.profilePic)
            }

            const sets = [];
            const params = [];
            if (Body.firstName != null || Body.firstName != undefined) { sets.push('firstName = ?'); params.push(Body.firstName); }
            if (Body.lastName != null || Body.lastName != undefined) { sets.push('lastName = ?'); params.push(Body.lastName); }
            if (sets.length === 0) {
                if (Body.profilePic != null || Body.profilePic != undefined) {
                    return resp.json({ "Status": 1, "Message": "Delivery boy Updated Successfully" });
                }
                return resp.json({ "Status": 0, "Message": "No changes to update" });
            }
            const queryString = "UPDATE AdminUsers SET " + sets.join(', ') + " WHERE AdminID = ?";
            params.push(AdminID);
            return new Promise(function (resolve, reject) {
                pool.query(queryString, params, function (err, result, fields) {
                    if (err) {

                        resp.json({ "Status": 0, "Message": "Error in updating the DB" });
                        console.log("Error in updating the DB:" + err);

                    }
                    else {
                        console.log("update :" + result.affectedRows);
                        if (result.affectedRows > 0) {
                            console.log('update successful')
                            resp.json({ "Status": 1, "Message": "Delivery boy Updated Successfully" });
                        }
                        else {
                            console.log("Deliveryboy update failed", err, queryString);
                            resp.json({ "Status": 0, "Message": "No changes to update" });

                        }

                    }
                });
            });
        }
        catch (err) {
            console.log("exception in updating Products ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in updating Products" });
        }
    },

    orderstatus: async (req, resp, next) => {
        try {
            results = await getdeliveredstatus(req.AdminID)
            resp.json({ "Status": 1, "OrdersStatus": results })
        }
        catch (e) {
            console.log(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },
}

function Verifyemail(inputs) {
    return new Promise(function (resolve, reject) {
        var myQuery = "select * from AdminUsers where Status=1 and Role=2 and MobileNumber = ?";
        pool.query(myQuery, [String((inputs && inputs.MobileNumber) || '')], function (err, results) {
            if (err) {
                console.log("error checking verify MobileNumber table: ", err);
                return reject(0)
            }

            if (results.length > 0) {

                resolve(1)
            }
            else {

                resolve(0);
            }

        });
    });
}

function Verifylogin(inputs) {
    return new Promise(function (resolve, reject) {
        if (!inputs || !inputs.MobileNumber || inputs.OTP === undefined || inputs.OTP === null || inputs.OTP === '') {
            return resolve(2);
        }
        var myQuery = "select * from AdminUsers where Status=1 and Role=2 and MobileNumber = ? and OTP = ?";
        pool.query(myQuery, [String(inputs.MobileNumber), String(inputs.OTP)], function (err, results) {
            if (err) {
                console.log("error checking verify MobileNumber table: ", err);
                return reject(0)
            }

            if (results.length > 0) {
                var data = {
                    "Status": results[0]['Status'], "AdminID": results[0]['AdminID'], "FirstName": results[0]['FirstName'], "LastName": results[0]['LastName'], "ProfilePic": "https://d3c9kvg5gaqz48.cloudfront.net/deliveryboys/" + results[0]['ProfilePic'], "Role": results[0]['Role']
                }
                resolve(data)
            }
            else {
                console.log("Entered incorrect password");
                resolve(2);
            }

        });
    });
}

function getcurrentorders(DeliveryBoyID) {
    try {
        return new Promise(function (resolve, reject) {
            query = "select * from Orders where  OrderStatus in (2,5) and DeliveryBoyID=? order by CreatedAt desc;"
            console.log(query, DeliveryBoyID)
            pool.query(query, [DeliveryBoyID], function (err, results, fields) {
                if (err) {
                    console.log("Error in checking orderid from DB :" + err);
                    return reject(-1);
                }
                else {
                    resolve(results);
                }
            });
        });
    }
    catch (err) {
        console.log("exception in getting orders ", err);
        return reject(-1)
    }
}


function getpastorders(DeliveryBoyID) {
    try {
        return new Promise(function (resolve, reject) {
            query = "select * from Orders where  OrderStatus in (1,3,4,6) and DeliveryBoyID=? order by CreatedAt desc;"
            console.log(query, DeliveryBoyID)
            pool.query(query, [DeliveryBoyID], function (err, results, fields) {
                if (err) {
                    console.log("Error in checking orderid from DB :" + err);
                    return reject(-1)
                }
                else {
                    return resolve(results);
                }
            });
        });
    }
    catch (err) {
        console.log("exception in getting orders ", err);
        return reject(-1)
    }
}


function getorderbyorderid(OrderID) {

    return new Promise(function (resolve, reject) {
        query = "select * from Orders where OrderID=?"
        console.log(query)
        pool.query(query, [OrderID], function (err, results, fields) {
            if (err) {
                console.log("Error in checking orderid from DB :" + err);
                reject(-1);
            }
            else {
                resolve(results);
            }
        });
    });
}

// function getorderitems(OrderID) {
//     var queryString = "";

//     queryString = "select *  from OrderItems where OrderID=?";

//     return new Promise(function (resolve, reject) {
//         pool.query(queryString,[OrderID], function (err, results, fields) {
//             if (err) {                
//                 console.log("Error in checking OrderID from DB :" + err);
//                 reject(0);
//             }
//             else {                
//                 if (results.length > 0) {                   
//                     resolve(results);
//                 }
//                 else {                    
//                     resolve(0);
//                 }
//             }
//         });
//     });
// }

//NEWCODE


function getorderitems(OrderID) {
    Products_s3 = "https://clikgett.s3.amazonaws.com/Products/"
    var queryString = `
        SELECT oi.*, p.ProductImages
        FROM OrderItems oi
        JOIN Products p ON oi.ProductID = p.ProductID
        WHERE oi.OrderID = ?`;

    return new Promise(function (resolve, reject) {
        pool.query(queryString, [OrderID], function (err, results, fields) {
            if (err) {
                console.log("Error in checking OrderID from DB: " + err);
                reject(0);
            } else {
                if (results.length > 0) {
                    // Loop through the results and process ProductImages
                    for (let iterator of results) {
                        try {
                            // Parse the ProductImages JSON string
                            iterator.ProductImages = JSON.parse(iterator.ProductImages) || [];
                        } catch (e) {
                            // If parsing fails, set it to an empty array
                            iterator.ProductImages = [];
                        }

                        // Add S3 prefix to each image URL
                        for (let i = 0; i < iterator.ProductImages.length; i++) {
                            iterator.ProductImages[i] = Products_s3 + iterator.ProductImages[i];
                        }
                    }
                    resolve(results);
                } else {
                    resolve(0);
                }
            }
        });
    });
}

function convertimage(AdminID, ProfilePic) {
    try {
        return new Promise(function (resolve, reject) {




            let base64String = 'data:image/png;base64,' + ProfilePic; // Not a real image 
            let base64Image = base64String.split(';base64,').pop();
            var imagename = Date.now() + "_" + AdminID + '.png'
            console.log(imagename, 'imagename')
            image = "ProfilePic=" + pool.escape(imagename) + "";
            fs.writeFile("images/" + imagename, base64Image, { encoding: 'base64' }, function (err) {

                const fileContent = fs.readFileSync("images/" + imagename);
                const params = {
                    Bucket: process.env.bucketname, Key: 'deliveryboys/' + imagename,
                    Body: fileContent,
                    ACL: 'public-read'
                };
                console.log(params)
                s3.upload(params, function (err, data) {
                    if (err) {
                        console.log(err)
                        return resolve(-1)
                    }
                    console.log("UPDATE AdminUsers SET " + image + " WHERE AdminID=" + AdminID)
                    pool.query("UPDATE AdminUsers SET " + image + " WHERE AdminID=" + AdminID + ";", function (err, results, fields) { })

                    console.log(`File uploaded successfully. ${data.Location}`);



                });
            });

            return resolve(1)
        });
    }
    catch (err) {
        console.log(err)
        resolve(-1)
    }
}

function getusername(UserID) {
    try {
        return new Promise(function (resolve, reject) {
            query = "select *,concat(FirstName,' ',LastName) as Name from Users where UserID=?"
            pool.query(query, [UserID], function (err, results, fields) {
                if (err) {
                    console.log("Error in checking orderid from DB :" + err);
                    return resolve({ "UserName": "NA", "EmailID": "NA" })
                }
                else {
                    if (results.length > 0) {
                        return resolve({ "UserName": results[0]['Name'], "EmailID": results[0]['EmailID'] })
                    }
                    else {
                        return resolve({ "UserName": "NA", "EmailID": "NA" })
                    }
                }
            });
        });
    }
    catch (err) {
        console.log("exception in getting users ", err);
        return resolve({ "UserName": "NA", "EmailID": "NA" })
    }
}

function getroutes(DeliveryBoyID, Type) {
    try {
        return new Promise(function (resolve, reject) {
            let query;
            if (Type == 'pending') {
                query = "select * from Routes where Status=1 and DeliveryBoyID = ?"
            }
            else if (Type == 'past') {
                query = "select * from Routes where Status=2 and DeliveryBoyID = ?"
            }
            else if (Type == 'byid') {
                query = "select * from Routes where RouteID = ?"
            }
            else {
                return reject(-1)
            }
            pool.query(query, [DeliveryBoyID], async (err, results) => {

                if (err) {
                    console.log(err)
                    return reject(-1);
                }

                else {

                    console.log("retrived Routes : ", results.length);

                    resolve(results)
                }

            });
        });
    }
    catch (err) {
        console.log("error in retrieving Products");
        return reject(-1);
    }
}

function getorder(OrderID) {
    try {
        return new Promise(function (resolve, reject) {
            console.log("select * from Orders where OrderID=?", OrderID)
            pool.query("select *,LPAD(OrderID, 4, '0') AS OrderSequence from Orders where OrderID=?", [OrderID], async (err, results) => {

                if (err) {
                    return reject(-1);
                }

                else {

                    console.log("retrived orders : ", results.length);
                    if (results.length == 1) {

                        //Created_At = new Date(results[0].CreatedAt)
                        //Created_At.setHours(Created_At.getHours() + 5)
                        //Created_At.setMinutes(Created_At.getMinutes() + 30)
                        //Created_At = new Date(Created_At);
                        //results[0].CreatedAt = moment(Created_At, 'yyyy-MM-dd’T’HH:mm:ss.SSSZ').format('YYYY-MM-DD HH:mm:ss');


                        let userresults = await CommonController.getuserdetail(results[0]['UserID']);
                        results[0]['UserName'] = userresults[0]['UserName']
                        results[0]['EmailID'] = userresults[0]['EmailID']
                        resolve(results[0])
                    }
                    else {
                        resolve({})
                    }
                }

            });
        });
    }
    catch (err) {
        console.log("error in retrieving orders");
        return reject(-1);
    }
}


function getdeliveredstatus(DeliveryBoyID) {
    try {
        return new Promise(function (resolve, reject) {
            const query = `
                SELECT 
                    (SELECT COUNT(*) FROM Orders WHERE OrderStatus = 1 AND DeliveryBoyID = ?) AS DeliveredCount,
                    (SELECT COALESCE(SUM(GrandTotal), 0) FROM Orders WHERE OrderStatus = 1 AND DeliveryBoyID = ?) AS DeliveredOrderValue,
                    (SELECT COALESCE(SUM(COALESCE(DeliverCharges, 0) + COALESCE(TipAmount, 0)), 0) FROM Orders WHERE OrderStatus = 1 AND DeliveryBoyID = ?) AS Earnings
            `;
            pool.query(query, [DeliveryBoyID, DeliveryBoyID, DeliveryBoyID], (err, results) => {
                if (err) {
                    console.error("Error querying delivered status: ", err);
                    return reject(-1);
                }
                if (results && results.length > 0) {
                    resolve(results[0]);
                } else {
                    resolve({ DeliveredCount: 0, Earnings: 0, DeliveredOrderValue: 0 });
                }
            });
        });
    }
    catch (err) {
        console.log("error in retrieving orders", err);
        return reject(-1);
    }
}

function getuserbymobilenum(MobileNumber) {
    try {
        return new Promise(function (resolve, reject) {
            pool.query("select * from AdminUsers where MobileNumber=? and Status=1", [MobileNumber], async (err, results) => {
                console.log('get user by mobile number ', results, err)
                resolve(results)
            });
        });
    }
    catch (err) {
        console.log("error in retrieving wallet balance");
        return -1;
    }
}

// function SendOTP(MobileNumber, OTP) {
//     try {
//         var http = require("https");
//         message = `/send/?apikey=${ process.env.SMS_APIKEY }&numbers=91${MobileNumber}&sender=SMARPG&message=Dear user, Your one time verification code is ${OTP}. Please DO NOT share this OTP with anyone. From mTouch Labs`
//         // message ="Your FaVMall login OTP is "+OTP+". Please do not share this with anyone. OTP expires in 30 mins. From team FavMall"
//         var options = {
//             "method": "GET",
//             "hostname": "api.textlocal.in",
//             "port": null,
//             "path": encodeURI(message),
//             "headers": {
//                 "content-type": "application/json"
//             }
//         };


//         console.log(options,'options');
//         var req = http.request(options, function (res) {
//             var chunks = [];

//             res.on("data", function (chunk) {
//                 chunks.push(chunk);
//             });
//             console.log(chunks,'chunk')
//             res.on("end", function () {
//                 var body = Buffer.concat(chunks);
//                 console.log("Success in Send OTP:", body.toString());
//             });
//         });

//         // req.write("{\"DLT_TE_ID\":\"1207161798564977983\"}");
//         req.end();
//     }
//     catch (err) { console.log("error sending OTP: ", err); }
// }

function SendOTP(mobileNumber, OTP) {
    try {
        var http = require("https");
        return new Promise(function (resolve, reject) {
            var options = {
                "method": "GET",
                "hostname": "api.textlocal.in",
                "port": null,
                "path": encodeURI("/send/?apikey=" + process.env.SMS_APIKEY + "&numbers=91" + mobileNumber + "&sender=SMARPG&message=Dear user, Your one time verification code is " + OTP + ". Please DO NOT share this OTP with anyone. From mTouch Labs"),
                "headers": {
                    "content-type": "application/json"
                }
            };
            console.log(options)

            var req = http.request(options, function (res) {
                var chunks = [];

                res.on("data", function (chunk) {
                    chunks.push(chunk);
                });

                res.on("end", function () {
                    var body = Buffer.concat(chunks);
                    console.log("Success in Send OTP:", body.toString());
                    resolve(1);
                });
            });

            // req.write();
            req.end();
        });
    }
    catch (err) {
        console.log("error in sending OTP: ", err);
    }
}

function formatToSingleDecimal(num) {
    return num.toFixed(1)
}

module.exports = deliveryboycontroller
