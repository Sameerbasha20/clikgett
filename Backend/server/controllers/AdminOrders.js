const express = require('express');
const mysql = require('mysql');
require('dotenv').config()
var moment = require('moment');
const CommonController = require("../controllers/CommonController");
const PricingEngine = require('../services/PricingEngine');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const s3 = require('../utils/s3');
const pool = require('../utils/db');
const OrderLifecycle = require('../services/OrderLifecycle');
const { ORDER_STATUS } = require('../utils/orderStatus');
Products_s3 = "http://clikgett-media.local/Products/"

const ordercontroller = {

    currentorders: async (req, resp, next) => {
        try {

            query = "select *,LPAD(OrderID, 4, '0') AS OrderSequence from Orders where  OrderStatus not in (1,3,4,6) order by CreatedAt desc;"
            let allordersforadmin = await CommonController.commonget(query);

            if (allordersforadmin.length > 0) {
                for (var j = 0; j < allordersforadmin.length; j++) {
                    allordersforadmin[j].OrderID = allordersforadmin[j].OrderID.toString().padStart(4, '0');
                    converteddate = await CommonController.convertdate(allordersforadmin[j].CreatedAt);
                    allordersforadmin[j].CreatedAt = converteddate
                }

            }
            resp.json({ "Status": 1, "Orders": allordersforadmin })

        }
        catch (err) {
            console.log("exception in getting orders", err);
            return resp.json({ "Status": 0, "Message": "Error in getting orders" });
        }
    },

    pastorders: async (req, resp, next) => {
        try {
            const { sort, mobile, username, orderId, status, startDate, endDate } = req.query;

            let query = `
                SELECT o.*, LPAD(o.OrderID, 4, '0') AS OrderSequence, u.FirstName AS UserName
                FROM Orders o 
                LEFT JOIN Users u ON o.UserID = u.UserID
                WHERE o.OrderStatus IN (1, 3, 4, 6)
            `;
            const params = [];

            if (orderId) {
                query += " AND (o.OrderID = ? OR LPAD(o.OrderID, 4, '0') LIKE ?)";
                params.push(orderId, `%${orderId}%`);
            }
            if (mobile) {
                query += " AND o.MobileNumber LIKE ?";
                params.push(`%${mobile}%`);
            }
            if (username) {
                query += " AND u.FirstName LIKE ?";
                params.push(`%${username}%`);
            }
            if (status) {
                query += " AND o.OrderStatus = ?";
                params.push(parseInt(status, 10));
            }
            if (startDate && endDate) {
                query += " AND DATE(o.CreatedAt) BETWEEN ? AND ?";
                params.push(startDate, endDate);
            } else if (startDate) {
                query += " AND DATE(o.CreatedAt) >= ?";
                params.push(startDate);
            } else if (endDate) {
                query += " AND DATE(o.CreatedAt) <= ?";
                params.push(endDate);
            }

            switch (sort) {
                case 'oldest':
                    query += " ORDER BY o.CreatedAt ASC";
                    break;
                case 'highest_value':
                    query += " ORDER BY o.GrandTotal DESC";
                    break;
                case 'lowest_value':
                    query += " ORDER BY o.GrandTotal ASC";
                    break;
                case 'status':
                    query += " ORDER BY o.OrderStatus ASC, o.CreatedAt DESC";
                    break;
                case 'scheduled_date':
                    query += " ORDER BY o.ScheduledDateTime DESC, o.CreatedAt DESC";
                    break;
                case 'delivery_date':
                    query += " ORDER BY o.deliveredDateTime DESC, o.Delivered_Cancelled_datetime DESC, o.CreatedAt DESC";
                    break;
                case 'latest':
                default:
                    query += " ORDER BY o.CreatedAt DESC";
                    break;
            }

            pool.query(query, params, async (err, allordersforadmin) => {
                if (err) {
                    console.log("Error querying past orders:", err);
                    return resp.json({ Status: 0, Message: "Error in getting orders" });
                }

                if (allordersforadmin && allordersforadmin.length > 0) {
                    for (var j = 0; j < allordersforadmin.length; j++) {
                        allordersforadmin[j].OrderID = allordersforadmin[j].OrderID.toString().padStart(4, '0');
                        allordersforadmin[j].CreatedAt = await CommonController.convertdate(allordersforadmin[j].CreatedAt);
                    }
                }
                resp.json({ Status: 1, Orders: allordersforadmin || [] });
            });
        }
        catch (err) {
            console.log("exception in getting orders", err);
            return resp.json({ "Status": 0, "Message": "Error in getting orders" });
        }
    },

    myorder: async (req, resp, next) => {
        try {

            myorder = await getorderbyorderid(req.query.OrderID)

            if (myorder.length == 1) {
                myorder = myorder[0]
                const orderCount = await userOrderCount(req.query.OrderID, myorder.UserID)

                converteddate = await CommonController.convertdate(myorder.CreatedAt);
                myorder.CreatedAt = converteddate
                myorder.orderCount = orderCount

                userresult = await getusername(myorder['UserID'])
                console.log(userresult, 'username')
                myorder['UserName'] = userresult['UserName']
                myorder['OrderID'] = myorder['OrderID'].toString().padStart(4, '0');
                myorder['EmailID'] = userresult['EmailID']
                myorder['InvoiceFile'] = "/api/adminorders/invoice/" + myorder['OrderID']

                cartitems = await getcartitems(myorder.OrderID)
                if (cartitems.length == 0) {
                    cartitems = []
                }
                myorder.OrderItems = cartitems;

                let removedItems = await new Promise(r => pool.query(
                    "SELECT oir.*, a.FirstName AS AdminFirstName, a.LastName AS AdminLastName FROM order_item_removals oir LEFT JOIN AdminUsers a ON oir.AdminID = a.AdminID WHERE oir.OrderID = ? ORDER BY oir.CreatedAt DESC",
                    [myorder.OrderID],
                    (e, rows) => r(rows || [])
                ));
                myorder.RemovedItems = removedItems || [];

                const totalItemQty = myorder.TotalItemQuantity || (cartitems ? cartitems.reduce((sum, item) => sum + (parseInt(item.Quantity) || 1), 0) : 0);
                const baseDeliveryMinutes = 30;
                let orderSizeBufferMinutes = 0;
                if (myorder.OrderSizeBufferMinutes !== undefined && myorder.OrderSizeBufferMinutes !== null && myorder.OrderSizeBufferMinutes > 0) {
                    orderSizeBufferMinutes = parseInt(myorder.OrderSizeBufferMinutes, 10);
                } else {
                    orderSizeBufferMinutes = totalItemQty <= 10 ? 0 : Math.ceil((totalItemQty - 10) / 10) * 10;
                }
                const totalDelayMinutes = parseInt(myorder.TotalDelayMinutes || 0, 10);
                const finalETAMinutes = baseDeliveryMinutes + orderSizeBufferMinutes + totalDelayMinutes;

                myorder.TotalItemQuantity = totalItemQty;
                myorder.BaseDeliveryMinutes = baseDeliveryMinutes;
                myorder.OrderSizeBufferMinutes = orderSizeBufferMinutes;
                myorder.TotalDelayMinutes = totalDelayMinutes;
                myorder.FinalETAMinutes = finalETAMinutes;


                resp.json({ "Status": 1, "Orders": myorder })
            }
            else {
                resp.json({ "Status": 1, "Orders": { OrderItems: [] } })
            }

        }
        catch (err) {
            console.log("ðŸ˜’ðŸ˜’ðŸ˜’", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in getting orders" });
        }
    },

    updatestatus: async (req, resp, next) => {
        try {
            const Body = req.body || {};
            const OrderID = req.params.OrderID;
            let target = parseInt(Body.OrderStatus, 10);
            if (isNaN(target)) {
                return resp.status(400).json({ "Status": 0, "Message": "Valid OrderStatus is required" });
            }
            // Compatibility with the current admin UI: it labels 2 as "Packing" and
            // uses 4 for its cancel action. Rider assignment has its own endpoint.
            if (target === ORDER_STATUS.ASSIGNED) target = ORDER_STATUS.PACKING;
            if (target === ORDER_STATUS.CANCELLED_BY_CUSTOMER) target = ORDER_STATUS.CANCELLED_BY_STORE;

            const reason = [Body.CancellationReason, Body.Reason].map((r) => (r ? String(r).trim() : '')).find(Boolean) || null;
            const updated = await OrderLifecycle.transition(OrderID, target, { type: 'admin', id: req.AdminID }, {
                reason,
                // Admin may complete rider steps on the rider's behalf (e.g. phone died).
                override: [ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.ARRIVED, ORDER_STATUS.DELIVERED].includes(target),
            });
            return resp.status(200).json({ "Status": 1, "Message": "Order Update Successful", "OrderStatus": updated.OrderStatus });
        }
        catch (err) {
            if (err instanceof OrderLifecycle.LifecycleError) {
                return resp.status(err.httpStatus).json({ "Status": 0, "Message": err.message });
            }
            console.log("exception in updating Orders ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in updating Orders" });
        }
    },

    assignordertodeliveryboy: async (req, resp, next) => {
        const deliveryOperations = require("./DeliveryOperations");
        return deliveryOperations.assignDeliveryBoy(req, resp);
    },

    pendingorders: async (req, resp, next) => {
        try {


            query = "SELECT I.ProductName,I.ProductID,I.VariantID,sum(I.Quantity) as Quantity,I.metrictype,I.metricvalue\
            FROM Orders O inner join OrderItems I on O.OrderID=I.OrderID  where O.OrderStatus=2 \
            group by I.VariantID order by I.ProductName asc"
            let results = await CommonController.commonget(query);
            records = [{
                "ProductName": "Product Name", "metrictype": "Metric Type", "metricvalue": "Metric Value", "Quantity": "Quantity",

            }]

            const csvStringifier = createCsvStringifier({
                header: [
                    { id: 'ProductName', title: 'Product Name' },
                    { id: 'metrictype', title: 'Metric Type' },
                    { id: 'metricvalue', title: 'Metric Value' },
                    { id: 'Quantity', title: 'Quantity' }
                ]
            });
            newlist = records.concat(results)
            // console.log(newlist)
            const csv = csvStringifier.stringifyRecords(newlist);
            image = Date.now() + ".csv"
            const params = {
                Bucket: process.env.bucketname, // pass your bucket name
                Key: "csv/pendingorders_" + image, // file will be saved as testBucket/contacts.csv
                ACL: "public-read",
                Body: csv,
                ContentType: "text/csv",
            };

            s3.upload(params, function (s3Err, data) {
                if (s3Err) throw s3Err;
                else {
                    console.log(data.Location)
                    location = data.Location
                    return resp.json({ 'Status': 1, "File": location })

                }
            });

        }
        catch (e) {
            console.log(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },


}


function getorderbyorderid(OrderID) {

    return new Promise(function (resolve, reject) {
        query = "select O.*,LPAD(OrderID, 4, '0') AS OrderSequence,coalesce(W.Amount,0) as WalletDebit from Orders O left join Wallets W on O.OrderID=W.ContentID where O.OrderID=? group by OrderID" 
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

function userOrderCount(OrderID, userID) {

    return new Promise(function (resolve, reject) {
        query = `SELECT COUNT(*) AS orderCount FROM Orders WHERE UserID = ${pool.escape(userID)} AND OrderID <= ${pool.escape(OrderID)}`
        console.log(query)
        pool.query(query, [OrderID], function (err, results, fields) {
            if (err) {
                console.log("Error in checking orderid from DB :" + err);
                reject(-1);
            }
            else {
                resolve(results[0].orderCount);
            }
        });
    });
}

function getcartitems(OrderID) {
    try {
        queryString = "select oi.*,p.ProductImages from OrderItems oi inner join Products p on p.productId=oi.productId\
                 where oi.OrderID=?"
        return new Promise(function (resolve, reject) {
            pool.query(queryString, [OrderID], function (err, results, fields) {
                if (err) {
                    console.log("Error in checking OrderID from DB :" + err);
                    return reject(-1);
                }
                else {
                    for (let iterator of results) {
                        try {
                            iterator.ProductImages = JSON.parse(iterator.ProductImages) || [];
                        } catch (e) {
                            iterator.ProductImages = []; // Fallback in case JSON parsing fails
                        }

                        // Update each ProductImage URL with the S3 prefix
                        for (var i = 0; i < iterator.ProductImages.length; i++) {
                            iterator.ProductImages[i] = Products_s3 + iterator.ProductImages[i];
                        }
                    }

                    return resolve(results);

                }
            });
        });
    }
    catch (err) {
        console.log("exception in getting orders items", err);
        return reject(-1)
    }
}

function deliverboy(AdminID) {
    try {
        return new Promise(function (resolve, reject) {
            query = "select *,concat(firstName,' ',lastName) as Name from AdminUsers where AdminID=?"
            pool.query(query, [AdminID], function (err, results, fields) {
                if (err) {
                    console.log("Error in checking orderid from DB :" + err);
                    return resolve(-1);
                }
                else {
                    resolve(results);
                }
            });
        });
    }
    catch (err) {
        console.log("exception in getting orders ", err);
        return resolve(-1)
    }
}

// function getusername(UserID) {
//     try{
//             return new Promise(function (resolve, reject) {
//                 query="select *,concat(FirstName,' ',LastName) as Name from Users where UserID=?"                 
//                 pool.query(query,[UserID], function (err, results, fields) {
//                     if (err) {               
//                         console.log("Error in checking orderid from DB :" + err);
//                         return resolve({"UserName":"NA","EmailID":"NA"})}
//                     else {               
//                             if(results.length > 0 ){
//                                 return resolve({"UserName":results[0]['Name'],"EmailID":results[0]['EmailID']})                            
//                             }
//                             else{
//                                 return resolve({"UserName":"NA","EmailID":"NA"})
//                             }
//                         }
//                 });
//             });
//     }
//     catch (err) {
//         console.log("exception in getting users ", err);
//         return resolve({"UserName":"NA","EmailID":"NA"})
//     }
// }

//NEWCODE
function getusername(UserID) {
    try {
        return new Promise(function (resolve, reject) {
            const query = `
                SELECT 
                    *,
                    CASE 
                        WHEN LastName = 'NA' THEN FirstName 
                        ELSE CONCAT(FirstName, ' ', LastName) 
                    END AS Name 
                FROM Users 
                WHERE UserID = ?
            `;

            pool.query(query, [UserID], function (err, results, fields) {
                if (err) {
                    console.log("Error in checking orderid from DB: " + err);
                    return resolve({ "UserName": "NA", "EmailID": "NA" });
                } else {
                    if (results.length > 0) {
                        return resolve({ "UserName": results[0]['Name'], "EmailID": results[0]['EmailID'] });
                    } else {
                        return resolve({ "UserName": "NA", "EmailID": "NA" });
                    }
                }
            });
        });
    } catch (err) {
        console.log("Exception in getting users: ", err);
        return Promise.resolve({ "UserName": "NA", "EmailID": "NA" });
    }
}


function incWalletAmount(WalletAmount, UserID, OrderID) {
    try {
        return new Promise(async function (resolve, reject) {
            let updateWallets = `update Users set WalletAmount=WalletAmount+${parseFloat(WalletAmount)} where UserID=${UserID}`
            console.log(updateWallets)
            let update_Wallets = await CommonController.commonget(updateWallets)
            await CommonController.Add_To_Wallet(UserID, (process.env.OrderCancel || 4), OrderID, WalletAmount)
            resolve(1);
        });
    }
    catch (err) {
        reject(-1);
    }
}


function AssignDeliveryBoy(OrderIDs, DeliveryBoyID) {
    try {
        return new Promise(function (resolve, reject) {
            for (var j = 0; j < OrderIDs.length; j++) {
                console.log(OrderIDs)
                query = "update Orders set DeliveryBoyID=?,IsAssigned=1 where OrderID=?"
                console.log(query, [DeliveryBoyID, OrderIDs[j]])
                pool.query(query, [DeliveryBoyID, OrderIDs[j]], function (err, results) {
                    if (err) {
                        console.log('error in update Orders ')
                    }
                })
            }
            resolve(1)
        });
    }
    catch (err) {
        console.log("exception in update Orders", err);
        return resolve("NA")
    }
}


function incvariantsQuantity(items) {
    try {
        return new Promise(function (resolve, reject) {
            for (var j = 0; j < items.length; j++) {
                console.log(items[j], 'item1', typeof (items[j]))
                query = "update ProductVariants set AvailableQty=AvailableQty+" + items[j]['Quantity'] + " where ProductID=" + items[j]['ProductID'] + " and VariantID=" + items[j]['VariantID']
                pool.query(query, function (err, results, fields) {
                    if (err) {
                        console.log("Error in decreasing Quantity :" + err);
                        reject(-1);
                    }
                    else {
                        console.log(results.affectedRows, 'affected rows')

                    }
                });
            }
            resolve(1);
        });
    }
    catch (err) {
reject(-1);
}
}


const ordercontrollerExtensions = {
currentorderssort: async (req, resp, next) => {
    try {
        const { sortBy } = req.query;
        let orderClause = "ORDER BY CreatedAt DESC";
        switch (sortBy) {
            case 'latest':
                orderClause = "ORDER BY CreatedAt DESC";
                break;
            case 'oldest':
                orderClause = "ORDER BY CreatedAt ASC";
                break;
            case 'highest_value':
                orderClause = "ORDER BY GrandTotal DESC";
                break;
            case 'lowest_value':
                orderClause = "ORDER BY GrandTotal ASC";
                break;
            case 'status':
                orderClause = "ORDER BY OrderStatus ASC";
                break;
            case 'scheduled_date':
                orderClause = "ORDER BY ScheduledDateTime ASC";
                break;
            case 'delivery_date':
                orderClause = "ORDER BY deliveredDateTime ASC";
                break;
            default:
                orderClause = "ORDER BY CreatedAt DESC";
        }
        let query = "SELECT *, LPAD(OrderID, 4, '0') AS OrderSequence FROM Orders WHERE OrderStatus NOT IN (1,3,4,6) " + orderClause;
        let allordersforadmin = await CommonController.commonget(query);
        if (allordersforadmin.length > 0) {
            for (var j = 0; j < allordersforadmin.length; j++) {
                allordersforadmin[j].OrderID = allordersforadmin[j].OrderID.toString().padStart(4, '0');
                let converteddate = await CommonController.convertdate(allordersforadmin[j].CreatedAt);
                allordersforadmin[j].CreatedAt = converteddate;
            }
        }
        resp.json({ Status: 1, Orders: allordersforadmin });
    } catch (err) {
        console.log("exception in sorting current orders", err);
        resp.status(500).json({ Status: 0, Message: "Error in sorting current orders" });
    }
},

pastordersfilter: async (req, resp, next) => {
    try {
        const { mobileNumber, username, orderId, orderStatus, startDate, endDate } = req.query;
        let conditions = ["O.OrderStatus IN (1,3,4,6)"];
        let params = [];
        if (mobileNumber) {
            conditions.push("O.MobileNumber LIKE ?");
            params.push(`%${mobileNumber}%`);
        }
        if (username) {
            conditions.push("(U.FirstName LIKE ? OR U.LastName LIKE ?)");
            params.push(`%${username}%`, `%${username}%`);
        }
        if (orderId) {
            conditions.push("O.OrderID LIKE ?");
            params.push(`%${orderId}%`);
        }
        if (orderStatus) {
            conditions.push("O.OrderStatus = ?");
            params.push(parseInt(orderStatus, 10));
        }
        if (startDate) {
            conditions.push("O.CreatedAt >= ?");
            params.push(startDate);
        }
        if (endDate) {
            conditions.push("O.CreatedAt <= ?");
            params.push(endDate);
        }
        let query = "SELECT O.*, LPAD(O.OrderID, 4, '0') AS OrderSequence, U.FirstName, U.LastName FROM Orders O LEFT JOIN Users U ON O.UserID = U.UserID WHERE " + conditions.join(" AND ") + " ORDER BY O.CreatedAt DESC";
        pool.query(query, params, async (err, allordersforadmin) => {
            if (err) {
                console.error("error in filtering past orders:", err);
                return resp.status(500).json({ Status: 0, Message: "Error in filtering past orders" });
            }
            if (allordersforadmin && allordersforadmin.length > 0) {
                for (var j = 0; j < allordersforadmin.length; j++) {
                    allordersforadmin[j].OrderID = allordersforadmin[j].OrderID.toString().padStart(4, '0');
                    let converteddate = await CommonController.convertdate(allordersforadmin[j].CreatedAt);
                    allordersforadmin[j].CreatedAt = converteddate;
                }
            }
            resp.json({ Status: 1, Orders: allordersforadmin || [] });
        });
    } catch (err) {
        console.log("exception in filtering past orders", err);
        resp.status(500).json({ Status: 0, Message: "Error in filtering past orders" });
    }
},
// Past orders sorting
pastorderssort: async (req, resp, next) => {
    try {
        const { sortBy } = req.query;
        let query;
        switch (sortBy) {
            case 'latest':
                query = "SELECT *,LPAD(OrderID, 4, '0') AS OrderSequence FROM Orders ORDER BY CreatedAt DESC";
                break;
            case 'oldest':
                query = "SELECT *,LPAD(OrderID, 4, '0') AS OrderSequence FROM Orders ORDER BY CreatedAt ASC";
                break;
            case 'highest_value':
                query = "SELECT *,LPAD(OrderID, 4, '0') AS OrderSequence FROM Orders ORDER BY GrandTotal DESC";
                break;
            case 'lowest_value':
                query = "SELECT *,LPAD(OrderID, 4, '0') AS OrderSequence FROM Orders ORDER BY GrandTotal ASC";
                break;
            case 'status':
                query = "SELECT *,LPAD(OrderID, 4, '0') AS OrderSequence FROM Orders ORDER BY OrderStatus";
                break;
            case 'scheduled_date':
                query = "SELECT *,LPAD(OrderID, 4, '0') AS OrderSequence FROM Orders WHERE ScheduledDateTime IS NOT NULL ORDER BY ScheduledDateTime ASC";
                break;
            case 'delivery_date':
                query = "SELECT *,LPAD(OrderID, 4, '0') AS OrderSequence FROM Orders ORDER BY deliveredDateTime ASC";
                break;
            default:
                query = "SELECT *,LPAD(OrderID, 4, '0') AS OrderSequence FROM Orders ORDER BY CreatedAt DESC";
        }
        let allordersforadmin = await CommonController.commonget(query);
        if (allordersforadmin.length > 0) {
            for (var j = 0; j < allordersforadmin.length; j++) {
                allordersforadmin[j].OrderID = allordersforadmin[j].OrderID.toString().padStart(4, '0');
                converteddate = await CommonController.convertdate(allordersforadmin[j].CreatedAt);
                allordersforadmin[j].CreatedAt = converteddate;
            }
        }
        resp.json({ Status: 1, Orders: allordersforadmin });
    } catch (err) {
        console.log("exception in sorting orders", err);
        resp.status(500).json({ Status: 0, Message: "Error in sorting orders" });
    }
},

// Past orders filtering by mobile number
pastordersmobilefilter: async (req, resp, next) => {
    try {
        const { mobileNumber } = req.query;
        let query = "SELECT *, LPAD(OrderID, 4, '0') AS OrderSequence FROM Orders WHERE MobileNumber LIKE ? AND OrderStatus IN (1,3,4,6) ORDER BY CreatedAt DESC";
        let allordersforadmin = await new Promise((res, rej) => pool.query(query, [`%${mobileNumber || ""}%`], (err, rows) => err ? rej(err) : res(rows)));
        if (allordersforadmin.length > 0) {
            for (var j = 0; j < allordersforadmin.length; j++) {
                allordersforadmin[j].OrderID = allordersforadmin[j].OrderID.toString().padStart(4, '0');
                converteddate = await CommonController.convertdate(allordersforadmin[j].CreatedAt);
                allordersforadmin[j].CreatedAt = converteddate;
            }
        }
        resp.json({ Status: 1, Orders: allordersforadmin });
    } catch (err) {
        console.log("exception in filtering orders by mobile", err);
        resp.status(500).json({ Status: 0, Message: "Error in filtering orders" });
    }
},

// Past orders filtering by username
pastordersusernamefilter: async (req, resp, next) => {
    try {
        const { username } = req.query;
        let query = "SELECT O.*, LPAD(O.OrderID, 4, '0') AS OrderSequence, U.FirstName, U.LastName FROM Orders O INNER JOIN Users U ON O.UserID = U.UserID WHERE (U.FirstName LIKE ? OR U.LastName LIKE ?) AND O.OrderStatus IN (1,3,4,6) ORDER BY O.CreatedAt DESC";
        let allordersforadmin = await new Promise((res, rej) => pool.query(query, [`%${username || ""}%`, `%${username || ""}%`], (err, rows) => err ? rej(err) : res(rows)));
        if (allordersforadmin.length > 0) {
            for (var j = 0; j < allordersforadmin.length; j++) {
                allordersforadmin[j].OrderID = allordersforadmin[j].OrderID.toString().padStart(4, '0');
                converteddate = await CommonController.convertdate(allordersforadmin[j].CreatedAt);
                allordersforadmin[j].CreatedAt = converteddate;
            }
        }
        resp.json({ Status: 1, Orders: allordersforadmin });
    } catch (err) {
        console.log("exception in filtering orders by username", err);
        resp.status(500).json({ Status: 0, Message: "Error in filtering orders" });
    }
},

// Past orders filtering by order ID
pastordersorderidfilter: async (req, resp, next) => {
    try {
        const { orderId } = req.query;
        let query = "SELECT *, LPAD(OrderID, 4, '0') AS OrderSequence FROM Orders WHERE OrderID LIKE ? AND OrderStatus IN (1,3,4,6) ORDER BY CreatedAt DESC";
        let allordersforadmin = await new Promise((res, rej) => pool.query(query, [`%${orderId || ""}%`], (err, rows) => err ? rej(err) : res(rows)));
        if (allordersforadmin.length > 0) {
            for (var j = 0; j < allordersforadmin.length; j++) {
                allordersforadmin[j].OrderID = allordersforadmin[j].OrderID.toString().padStart(4, '0');
                converteddate = await CommonController.convertdate(allordersforadmin[j].CreatedAt);
                allordersforadmin[j].CreatedAt = converteddate;
            }
        }
        resp.json({ Status: 1, Orders: allordersforadmin });
    } catch (err) {
        console.log("exception in filtering orders by order ID", err);
        resp.status(500).json({ Status: 0, Message: "Error in filtering orders" });
    }
},

// Order timeline
ordertimeline: async (req, resp, next) => {
    try {
        const OrderID = req.params.OrderID;
        let query = "SELECT TimelineID, OrderID, OrderStatus, Notes, CreatedAt FROM OrderStatusTimeline WHERE OrderID = ? ORDER BY CreatedAt ASC";
        let timeline = await new Promise((res, rej) => pool.query(query, [OrderID], (err, rows) => err ? rej(err) : res(rows)));
        resp.json({ Status: 1, Timeline: timeline });
    } catch (err) {
        console.log("exception in getting order timeline", err);
        resp.status(500).json({ Status: 0, Message: "Error in getting order timeline" });
    }
},

// Scheduled orders
scheduledorders: async (req, resp, next) => {
    try {
        let query = "SELECT O.*, LPAD(O.OrderID, 4, '0') AS OrderSequence, U.FirstName, U.MobileNumber FROM Orders O INNER JOIN Users U ON O.UserID = U.UserID WHERE O.ScheduleStatus = 'Scheduled' OR O.ScheduledDateTime IS NOT NULL ORDER BY O.ScheduledDateTime ASC, O.CreatedAt DESC";
        let scheduled = await CommonController.commonget(query);
        resp.json({ Status: 1, ScheduledOrders: scheduled });
    } catch (err) {
        console.log("exception in getting scheduled orders", err);
        resp.status(500).json({ Status: 0, Message: "Error in getting scheduled orders" });
    }
},

// Editable delivery time
editedeliverytime: async (req, resp, next) => {
        try {
            const OrderID = req.params.OrderID;
            const { newExpectedDeliveryTime, adjustmentMinutes, reason } = req.body;
            const AdminID = req.AdminID || (req.user && req.user.AdminID) || null;

            pool.query("SELECT * FROM Orders WHERE OrderID = ?", [OrderID], (orderErr, order) => {
                if (orderErr) {
                    console.error("error fetching order for ETA update:", orderErr);
                    return resp.status(500).json({ Status: 0, Message: "Error in fetching order" });
                }

                if (!order || order.length === 0) {
                    return resp.status(404).json({ Status: 0, Message: "Order not found" });
                }

                if (order[0].OrderStatus === 1 || order[0].OrderStatus === 4) {
                    return resp.status(400).json({ Status: 0, Message: "Cannot adjust delivery time for completed or cancelled orders" });
                }

                const currentETA = order[0].EstimateDateTime ? new Date(order[0].EstimateDateTime) : new Date();
                const originalETAStr = order[0].EstimateDateTime ? moment(order[0].EstimateDateTime).format('YYYY-MM-DD HH:mm:ss') : 'Not set';
                let calculatedMinutes = 0;
                let formattedNewETA;

                if (adjustmentMinutes !== undefined && adjustmentMinutes !== null && !isNaN(parseInt(adjustmentMinutes))) {
                    calculatedMinutes = parseInt(adjustmentMinutes, 10);
                    const updatedDate = new Date(currentETA.getTime() + (calculatedMinutes * 60000));
                    formattedNewETA = moment(updatedDate).format('YYYY-MM-DD HH:mm:ss');
                } else if (newExpectedDeliveryTime) {
                    formattedNewETA = moment(newExpectedDeliveryTime).format('YYYY-MM-DD HH:mm:ss');
                    const diffMs = new Date(formattedNewETA).getTime() - currentETA.getTime();
                    calculatedMinutes = Math.round(diffMs / 60000);
                } else {
                    calculatedMinutes = 5;
                    const updatedDate = new Date(currentETA.getTime() + (5 * 60000));
                    formattedNewETA = moment(updatedDate).format('YYYY-MM-DD HH:mm:ss');
                }

                const updateOrderSql = "UPDATE Orders SET EstimateDateTime = ?, TotalDelayMinutes = TotalDelayMinutes + ?, UpdatedAt = NOW() WHERE OrderID = ?";
                pool.query(updateOrderSql, [formattedNewETA, calculatedMinutes, OrderID], (updateErr) => {
                    if (updateErr) {
                        console.error("error updating EstimateDateTime:", updateErr);
                        return resp.status(500).json({ Status: 0, Message: "Error in updating delivery time" });
                    }

                    // Record in OrderETAAdjustments audit table
                    const insertAuditSql = `
                        INSERT INTO OrderETAAdjustments (OrderID, PreviousETA, NewETA, AdjustmentMinutes, Reason, AdminID, InitiatorType, CreatedAt)
                        VALUES (?, ?, ?, ?, ?, ?, 'ADMIN', NOW())
                    `;
                    pool.query(insertAuditSql, [
                        OrderID,
                        order[0].EstimateDateTime || null,
                        formattedNewETA,
                        calculatedMinutes,
                        reason || `Admin adjusted delivery time by ${calculatedMinutes > 0 ? '+' : ''}${calculatedMinutes} mins`,
                        AdminID
                    ], (auditErr) => {
                        if (auditErr) console.error("Error saving OrderETAAdjustment:", auditErr);
                    });

                    const etaMessage = calculatedMinutes > 0 
                        ? `Delivery time increased by ${calculatedMinutes} mins`
                        : (calculatedMinutes < 0 ? `Delivery time decreased by ${Math.abs(calculatedMinutes)} mins` : 'Delivery time updated');

                    const etaNote = `${etaMessage} (New ETA: ${formattedNewETA}). Reason: ${reason || 'Admin update'}`;
                    const timelineSql = "INSERT INTO OrderStatusTimeline (OrderID, OrderStatus, Notes, CreatedAt) VALUES (?, ?, ?, NOW())";
                    pool.query(timelineSql, [OrderID, order[0].OrderStatus || 2, etaNote], (timelineErr) => {
                        if (timelineErr) {
                            console.error("error logging ETA update timeline:", timelineErr);
                        }
                        return resp.json({
                            Status: 1,
                            Message: etaMessage,
                            OriginalETA: originalETAStr,
                            NewETA: formattedNewETA,
                            AdjustmentMinutes: calculatedMinutes,
                            TotalDelayMinutes: (order[0].TotalDelayMinutes || 0) + calculatedMinutes,
                            Reason: reason || 'Admin update'
                        });
                    });
                });
            });
        } catch (err) {
            console.log("exception in editing delivery time", err);
            resp.status(500).json({ Status: 0, Message: "Error in editing delivery time" });
        }
    },

// Order adjustment (out-of-stock, etc.)
// Order adjustment (out-of-stock, amount modification, etc.)
adjustorder: async (req, resp, next) => {
    try {
        const OrderID = req.params.OrderID || req.body.OrderID;
        const { newAmount, unavailableProductAmount, OrderItemID, removedQuantity, adjustmentReason, reason, resolution, refundToWallet } = req.body;
        const AdminID = req.AdminID || req.body.AdminID || null;
        let effectiveReason = adjustmentReason || reason || 'Order amount manual adjustment';

        pool.query("SELECT * FROM Orders WHERE OrderID = ?", [OrderID], async (orderErr, orders) => {
            if (orderErr) {
                console.error("error fetching order for adjustment:", orderErr);
                return resp.status(500).json({ Status: 0, Message: "Error fetching order" });
            }
            if (!orders || orders.length === 0) {
                return resp.status(404).json({ Status: 0, Message: "Order not found" });
            }

            const order = orders[0];
            const previousAmount = parseFloat(order.GrandTotal || 0);
            let finalNewAmount = previousAmount;
            let removedItemDetails = null;

            // If an OrderItemID is specified for removal or reduction
            if (OrderItemID) {
                const itemRows = await new Promise(r => pool.query("SELECT * FROM OrderItems WHERE OrderItemID = ? AND OrderID = ?", [OrderItemID, OrderID], (e, rows) => r(rows || [])));
                if (itemRows.length > 0) {
                    const oi = itemRows[0];
                    const itemPrice = parseFloat(oi.OfferPrice || oi.Price || 0);
                    const currentQty = parseInt(oi.Quantity || 1);
                    const qtyToRemove = (removedQuantity && parseInt(removedQuantity) <= currentQty) ? parseInt(removedQuantity) : currentQty;
                    const deduction = itemPrice * qtyToRemove;

                    if (qtyToRemove >= currentQty) {
                        await new Promise(r => pool.query("DELETE FROM OrderItems WHERE OrderItemID = ?", [OrderItemID], r));
                    } else {
                        await new Promise(r => pool.query("UPDATE OrderItems SET Quantity = Quantity - ? WHERE OrderItemID = ?", [qtyToRemove, OrderItemID], r));
                    }

                    finalNewAmount = Math.max(0, previousAmount - deduction);
                    effectiveReason = `Product ${oi.ProductName} is unavailable and has been removed from your order (Qty: ${qtyToRemove})`;
                    removedItemDetails = {
                        ProductName: oi.ProductName,
                        Quantity: qtyToRemove,
                        AmountDeducted: deduction
                    };
                }
            } else if (newAmount !== undefined && newAmount !== null && !isNaN(parseFloat(newAmount))) {
                finalNewAmount = parseFloat(newAmount);
            } else if (unavailableProductAmount !== undefined && !isNaN(parseFloat(unavailableProductAmount))) {
                finalNewAmount = Math.max(0, previousAmount - parseFloat(unavailableProductAmount));
            }

            const differenceAmount = finalNewAmount - previousAmount;

            const insertAdjSql = `
                INSERT INTO order_adjustments 
                (OrderID, PreviousAmount, NewAmount, DifferenceAmount, AdjustmentType, Reason, AdminID, CreatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            const adjType = differenceAmount < 0 ? 'deduction' : (differenceAmount > 0 ? 'addition' : 'correction');

            pool.query(insertAdjSql, [OrderID, previousAmount, finalNewAmount, differenceAmount, adjType, effectiveReason, AdminID], (adjErr, adjResult) => {
                if (adjErr) {
                    console.error("error saving order adjustment:", adjErr);
                    return resp.status(500).json({ Status: 0, Message: "Error saving adjustment" });
                }

                pool.query("UPDATE Orders SET GrandTotal = ?, SubTotal = GREATEST(0, SubTotal + ?), UpdatedAt = NOW() WHERE OrderID = ?", [finalNewAmount, differenceAmount, OrderID], (upErr) => {
                    if (upErr) console.error("error updating order grand total:", upErr);

                    // If refund to wallet is requested or order was paid online and difference is negative
                    if ((resolution === 'Wallet Credit' || refundToWallet || order.PaymentMethod !== 'COD') && differenceAmount < 0) {
                        const refundAmount = Math.abs(differenceAmount);
                        const walletSql = `
                            INSERT INTO Wallets (UserID, Amount, Credited_Debited, ContentType, ContentID, Description, CreatedAt)
                            VALUES (?, ?, 1, 5, ?, ?, NOW())
                        `;
                        pool.query(walletSql, [order.UserID, refundAmount, OrderID, `Refund credit for order #${OrderID} adjustment: ${effectiveReason}`], (wErr) => {
                            if (wErr) console.error("error crediting wallet for adjustment:", wErr);
                            else {
                                pool.query("UPDATE Users SET WalletAmount = COALESCE(WalletAmount, 0) + ? WHERE UserID = ?", [refundAmount, order.UserID]);
                            }
                        });
                    }

                    // Log in OrderStatusTimeline
                    const note = `Order amount adjusted from ₹${previousAmount.toFixed(2)} to ₹${finalNewAmount.toFixed(2)}. Difference: ₹${Math.abs(differenceAmount).toFixed(2)}. ${effectiveReason}`;
                    pool.query("INSERT INTO OrderStatusTimeline (OrderID, OrderStatus, Notes, CreatedAt) VALUES (?, ?, ?, NOW())", [OrderID, order.OrderStatus || 2, note]);

                    return resp.json({
                        Status: 1,
                        Message: "Order adjusted successfully",
                        AdjustmentID: adjResult.insertId,
                        OrderID: parseInt(OrderID),
                        PreviousAmount: previousAmount,
                        NewAmount: finalNewAmount,
                        DifferenceAmount: differenceAmount,
                        RemovedItem: removedItemDetails,
                        Notification: effectiveReason
                    });
                });
            });
        });
    } catch (err) {
        console.log("exception in adjusting order", err);
        resp.status(500).json({ Status: 0, Message: "Error in adjusting order" });
    }
},

getorderadjustments: async (req, resp, next) => {
    try {
        const OrderID = req.params.OrderID || req.query.OrderID;
        if (!OrderID) {
            return resp.status(400).json({ Status: 0, Message: "OrderID is required" });
        }
        const sql = `
            SELECT oa.*, a.FirstName AS AdminFirstName, a.LastName AS AdminLastName
            FROM order_adjustments oa
            LEFT JOIN AdminUsers a ON oa.AdminID = a.AdminID
            WHERE oa.OrderID = ?
            ORDER BY oa.CreatedAt DESC
        `;
        pool.query(sql, [OrderID], (err, rows) => {
            if (err) {
                console.error("error fetching adjustments:", err);
                return resp.status(500).json({ Status: 0, Message: "Error fetching adjustments" });
            }
            return resp.json({ Status: 1, Adjustments: rows || [] });
        });
    } catch (err) {
        console.log("exception in getting adjustments", err);
        resp.status(500).json({ Status: 0, Message: "Error in getting adjustments" });
    }
},

// Export orders (CSV)
exportorders: async (req, resp, next) => {
    try {
        let query = "SELECT O.OrderID, U.FirstName, U.MobileNumber, O.GrandTotal, O.OrderStatus, O.CreatedAt FROM Orders O INNER JOIN Users U ON O.UserID = U.UserID";
        let allorders = await CommonController.commonget(query);

        // CSV export logic similar to pendingorders
        const csvStringifier = createCsvStringifier({
            header: [
                { id: 'OrderID', title: 'Order ID' },
                { id: 'FirstName', title: 'Customer Name' },
                { id: 'MobileNumber', title: 'Mobile Number' },
                { id: 'GrandTotal', title: 'Amount' },
                { id: 'OrderStatus', title: 'Status' },
                { id: 'CreatedAt', title: 'Order Date' }
            ]
        });

        const records = allorders.map(row => ({
            OrderID: row.OrderID,
            FirstName: row.FirstName,
            MobileNumber: row.MobileNumber,
            GrandTotal: row.GrandTotal,
            OrderStatus: row.OrderStatus,
            CreatedAt: row.CreatedAt
        }));

        const csv = csvStringifier.stringifyRecords(records);
        const image = Date.now() + ".csv";
        const params = {
            Bucket: process.env.bucketname,
            Key: "csv/export_orders_" + image,
            ACL: "public-read",
            Body: csv,
            ContentType: "text/csv",
        };

        s3.upload(params, function (s3Err, data) {
            if (s3Err) throw s3Err;
            else {
                return resp.json({ Status: 1, File: data.Location });
            }
        });
    } catch (err) {
        console.log("exception in exporting orders", err);
        resp.status(500).json({ Status: 0, Message: "Error in exporting orders" });
    }
}
};

ordercontrollerExtensions.removeItemFromOrder = async (req, resp, next) => {
    try {
        const params = req.params || {};
        const body = req.body || {};
        const OrderID = parseInt(params.OrderID || body.OrderID, 10);
        const OrderItemID = parseInt(params.OrderItemID || body.OrderItemID, 10);
        const removedQuantity = body.removedQuantity !== undefined 
            ? parseInt(body.removedQuantity, 10) 
            : (body.quantity !== undefined ? parseInt(body.quantity, 10) : null);
        const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
        const description = typeof body.description === 'string' ? body.description.trim() : '';
        const resolution = body.resolution || 'Wallet Credit';
        const AdminID = req.AdminID || (req.user && req.user.AdminID) || body.AdminID || null;

        if (!AdminID) {
            return resp.status(401).json({ Status: 0, Message: "Unauthorized admin" });
        }

        if (!OrderID || isNaN(OrderID) || OrderID <= 0) {
            return resp.status(400).json({ Status: 0, Message: "Valid OrderID is required" });
        }

        if (!OrderItemID || isNaN(OrderItemID) || OrderItemID <= 0) {
            return resp.status(400).json({ Status: 0, Message: "Valid OrderItemID is required" });
        }

        const VALID_REMOVAL_REASONS = [
            'Out of Stock',
            'Unavailable',
            'Damaged',
            'Quality Issue',
            'Incorrect Product',
            'Vendor/Store Issue',
            'Other'
        ];

        if (!reason || !VALID_REMOVAL_REASONS.includes(reason)) {
            return resp.status(400).json({
                Status: 0,
                Message: "Reason is required and must be one of: " + VALID_REMOVAL_REASONS.join(', ')
            });
        }

        if (!description || description.length === 0) {
            return resp.status(400).json({
                Status: 0,
                Message: "Description is mandatory and cannot be empty."
            });
        }

        // 1. Fetch Order & Validate State
        const orderRows = await new Promise(r => pool.query("SELECT * FROM Orders WHERE OrderID = ?", [OrderID], (e, rows) => r(rows || [])));
        if (!orderRows || orderRows.length === 0) {
            return resp.status(404).json({ Status: 0, Message: "Order not found" });
        }
        const order = orderRows[0];

        // Immutable terminal statuses: 1 (Delivered), 3 (Admin Cancelled), 4 (Cancelled), 6 (Returned)
        const IMMUTABLE_STATUSES = [1, 3, 4, 6];
        if (IMMUTABLE_STATUSES.includes(order.OrderStatus)) {
            return resp.status(400).json({
                Status: 0,
                Message: "This order can no longer be modified."
            });
        }

        // 2. Fetch OrderItem & Validate that it belongs to this Order
        const itemRows = await new Promise(r => pool.query("SELECT * FROM OrderItems WHERE OrderItemID = ? AND OrderID = ?", [OrderItemID, OrderID], (e, rows) => r(rows || [])));
        if (!itemRows || itemRows.length === 0) {
            return resp.status(404).json({ Status: 0, Message: "Product does not belong to this order." });
        }
        const oi = itemRows[0];
        const currentQty = parseInt(oi.Quantity || 1, 10);
        const qtyToRemove = (removedQuantity !== null && !isNaN(removedQuantity)) ? removedQuantity : currentQty;

        if (qtyToRemove <= 0 || qtyToRemove > currentQty) {
            return resp.status(400).json({
                Status: 0,
                Message: `Invalid removal quantity (${qtyToRemove}). Order contains ${currentQty} units.`
            });
        }

        // 3. Remove/decrement item in OrderItems
        if (qtyToRemove >= currentQty) {
            await new Promise(r => pool.query("DELETE FROM OrderItems WHERE OrderItemID = ?", [OrderItemID], r));
        } else {
            await new Promise(r => pool.query("UPDATE OrderItems SET Quantity = Quantity - ? WHERE OrderItemID = ?", [qtyToRemove, OrderItemID], r));
        }

        // 4. Recalculate order using existing PricingEngine
        const remainingItems = await new Promise(r => pool.query(
            "SELECT OI.ProductID, OI.VariantID, OI.Quantity, OI.Price, OI.OfferPrice, PV.Buy2Price FROM OrderItems OI LEFT JOIN ProductVariants PV ON OI.VariantID = PV.VariantID WHERE OI.OrderID = ?",
            [OrderID],
            (e, rows) => r(rows || [])
        ));

        const calculation = await PricingEngine.calculateCart(
            remainingItems,
            order.PromoCode,
            order.UserID,
            { distanceKm: order.Distance }
        );

        const newSubTotal = calculation.SubTotal;
        const newCouponDiscount = calculation.CouponDiscount;
        const newCartOfferDiscount = calculation.CartOfferDiscount;
        const newDeliverCharges = calculation.DeliveryCharges;
        const totalDiscounts = newCouponDiscount + newCartOfferDiscount;
        const tipAmount = parseFloat(order.TipAmount || 0);
        const walletAmount = parseFloat(order.WalletAmount || 0);
        const newGrandTotal = Math.max(0, parseFloat((newSubTotal - totalDiscounts + newDeliverCharges + tipAmount - walletAmount).toFixed(2)));
        const previousGrandTotal = parseFloat(order.GrandTotal || 0);
        const differenceAmount = parseFloat((newGrandTotal - previousGrandTotal).toFixed(2));
        const refundAmount = differenceAmount < 0 ? Math.abs(differenceAmount) : 0;

        // 5. ETA for the remaining items (services/DeliveryTime.js)
        const newTotalItems = calculation.TotalItemQuantity;
        const eta = await require('../services/DeliveryTime').estimate({ distanceKm: order.Distance, items: calculation.Items || [] });
        const newOrderSizeBuffer = eta.itemMinutes + eta.fruitMinutes;
        const baseDeliveryMinutes = parseInt(order.BaseETAMinutes, 10) || eta.distanceMinutes;
        const operationalDelayMinutes = parseInt(order.TotalDelayMinutes || 0, 10);
        const newTotalETAMinutes = baseDeliveryMinutes + newOrderSizeBuffer + operationalDelayMinutes;
        const newEstimateDateTime = moment(order.CreatedAt).add(newTotalETAMinutes, 'minutes').format('YYYY-MM-DD HH:mm:ss');

        // 6. Update Orders Table
        await new Promise(r => pool.query(`
            UPDATE Orders 
            SET SubTotal = ?,
                GrandTotal = ?,
                PromoAmount = ?,
                Discount = ?,
                DeliverCharges = ?,
                TotalItemQuantity = ?,
                OrderSizeBufferMinutes = ?,
                EstimateDateTime = ?,
                UpdatedAt = NOW()
            WHERE OrderID = ?
        `, [
            newSubTotal,
            newGrandTotal,
            newCouponDiscount,
            newCartOfferDiscount,
            newDeliverCharges,
            newTotalItems,
            newOrderSizeBuffer,
            newEstimateDateTime,
            OrderID
        ], r));

        // 7. Payment & Refund Safety Handling
        let refundStatus = 'NOT_APPLICABLE';
        if (refundAmount > 0) {
            if (order.PaymentMethod === 'COD') {
                refundStatus = 'COD_ADJUSTED';
            } else if (resolution === 'Wallet Credit') {
                refundStatus = 'WALLET_REFUNDED';
                const walletSql = `
                    INSERT INTO Wallets (UserID, Amount, Credited_Debited, ContentType, ContentID, Description, CreatedAt)
                    VALUES (?, ?, 1, 5, ?, ?, NOW())
                `;
                await new Promise(r => pool.query(walletSql, [
                    order.UserID,
                    refundAmount,
                    OrderID,
                    `Wallet refund for item removal in order #${OrderID} (${oi.ProductName} x${qtyToRemove}): ${reason}`
                ], r));
                await new Promise(r => pool.query("UPDATE Users SET WalletAmount = COALESCE(WalletAmount, 0) + ? WHERE UserID = ?", [refundAmount, order.UserID], r));
            } else {
                refundStatus = 'PENDING_MANUAL_REFUND';
            }
        }

        // 8. Removal Audit Logging in order_item_removals
        const unitPrice = parseFloat(oi.OfferPrice || oi.Price || 0);
        const removalResult = await new Promise(r => pool.query(`
            INSERT INTO order_item_removals
            (OrderID, OrderItemID, ProductID, VariantID, ProductName, Quantity, UnitPrice, RefundAmount, RefundStatus, Reason, Description, AdminID, CreatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            OrderID,
            OrderItemID,
            oi.ProductID,
            oi.VariantID || null,
            oi.ProductName,
            qtyToRemove,
            unitPrice,
            refundAmount,
            refundStatus,
            reason,
            description,
            AdminID
        ], (e, res) => r(res)));

        // 9. Adjustment Logging in order_adjustments
        await new Promise(r => pool.query(`
            INSERT INTO order_adjustments 
            (OrderID, PreviousAmount, NewAmount, DifferenceAmount, AdjustmentType, Reason, AdminID, CreatedAt)
            VALUES (?, ?, ?, ?, 'deduction', ?, ?, NOW())
        `, [
            OrderID,
            previousGrandTotal,
            newGrandTotal,
            differenceAmount,
            `Item Removed: ${qtyToRemove}x ${oi.ProductName}. Reason: ${reason}. ${description}`,
            AdminID
        ], r));

        // 10. Audit Logging in OrderStatusTimeline
        const physicalNotice = (order.OrderStatus === 5 || order.OrderStatus === 7) 
            ? " [NOTICE: Item removed while driver is in transit/arrived]" 
            : "";
        const timelineNote = `Item Removed: ${qtyToRemove}x ${oi.ProductName}. Reason: ${reason}. Description: ${description}. Removed by Admin #${AdminID}${physicalNotice}. Refund: ${refundStatus} (₹${refundAmount.toFixed(2)})`;
        await new Promise(r => pool.query(`
            INSERT INTO OrderStatusTimeline (OrderID, OrderStatus, Notes, CreatedAt)
            VALUES (?, ?, ?, NOW())
        `, [OrderID, order.OrderStatus || 2, timelineNote], r));

        return resp.status(200).json({
            Status: 1,
            Message: "Item removed successfully and order recalculated.",
            RemovalID: removalResult ? removalResult.insertId : null,
            OrderID: OrderID,
            RemovedItem: {
                OrderItemID,
                ProductID: oi.ProductID,
                VariantID: oi.VariantID,
                ProductName: oi.ProductName,
                Quantity: qtyToRemove,
                UnitPrice: unitPrice,
                Reason: reason,
                Description: description,
                RefundAmount: refundAmount,
                RefundStatus: refundStatus
            },
            RecalculatedOrder: {
                SubTotal: newSubTotal,
                GrandTotal: newGrandTotal,
                CouponDiscount: newCouponDiscount,
                CartOfferDiscount: newCartOfferDiscount,
                DeliverCharges: newDeliverCharges,
                TotalItemQuantity: newTotalItems,
                OrderSizeBufferMinutes: newOrderSizeBuffer,
                TotalDeliveryMinutes: newTotalETAMinutes,
                EstimateDateTime: newEstimateDateTime,
                PreviousGrandTotal: previousGrandTotal,
                DifferenceAmount: differenceAmount
            }
        });
    } catch (err) {
        console.error("Error removing item from order:", err);
        return resp.status(500).json({ Status: 0, Message: "Error removing item from order: " + err.message });
    }
};

ordercontrollerExtensions.getRemovedItems = async (req, resp, next) => {
    try {
        const params = req.params || {};
        const query = req.query || {};
        const body = req.body || {};
        const OrderID = parseInt(params.OrderID || query.OrderID || body.OrderID, 10);
        if (!OrderID || isNaN(OrderID)) {
            return resp.status(400).json({ Status: 0, Message: "Valid OrderID is required" });
        }
        const sql = `
            SELECT oir.*, a.FirstName AS AdminFirstName, a.LastName AS AdminLastName
            FROM order_item_removals oir
            LEFT JOIN AdminUsers a ON oir.AdminID = a.AdminID
            WHERE oir.OrderID = ?
            ORDER BY oir.CreatedAt DESC
        `;
        const rows = await new Promise((res, rej) => pool.query(sql, [OrderID], (err, r) => err ? rej(err) : res(r || [])));
        return resp.status(200).json({ Status: 1, RemovedItems: rows });
    } catch (err) {
        console.error("Error in getRemovedItems:", err);
        return resp.status(500).json({ Status: 0, Message: "Error fetching removed items" });
    }
};

ordercontrollerExtensions.downloadInvoice = async (req, resp, next) => {
    try {
        const orderId = req.params.OrderID;
        if (!orderId) {
            return resp.status(400).json({ Status: 0, Message: 'OrderID is required' });
        }
        const InvoiceGenerator = require('../services/InvoiceGenerator');
        await InvoiceGenerator.generateReceiptPdf(orderId, resp);
    } catch (err) {
        console.error('Error generating admin invoice:', err);
        if (!resp.headersSent) {
            return resp.status(500).json({ Status: 0, Message: 'Failed to generate invoice' });
        }
    }
};

Object.assign(ordercontroller, ordercontrollerExtensions);

module.exports = ordercontroller

