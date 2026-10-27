const express = require('express');
const mysql = require('mysql');
require('dotenv').config()
var moment = require('moment');
const crypto = require('crypto');
const { body } = require('express-validator');
const Razorpay = require('razorpay')
const CommonController = require("../controllers/CommonController");
const PDFDocument = require('pdfkit');
var fs = require('fs')

const s3 = require('../utils/s3');
const pool = require('../utils/db');
const OrderLifecycle = require('../services/OrderLifecycle');
const CheckoutBill = require('../services/CheckoutBill');
const DeliveryTime = require('../services/DeliveryTime');
const PrintStore = require('../services/PrintStore');
const Products_s3 = 'http://clikgett-media.local/Products/';
const StoreHours = require('../services/StoreHours');
const PRODUCTS_S3 = "http://clikgett-media.local/Products/";
const { ORDER_STATUS, STATUS_LABELS, FINAL_STATUSES } = require('../utils/orderStatus');



var instance;
try {
    instance = new Razorpay({
        key_id: process.env.RAZORPAYID || 'rzp_test_local_mock_key',
        key_secret: process.env.RAZORPAYSECRET || 'local_mock_secret',
    });
} catch (e) {
    if (typeof logger !== 'undefined' && logger.warn) logger.warn("Razorpay instance init fallback: " + e.message);
}


const ordercontroller = {


    mypastorders: async (req, resp, next) => {
        try {
            // let query = "select * from Orders where OrderStatus in (1,3,4,6) and UserID="+req.UserID+" order by CreatedAt desc;"
            let getPastOrders = "select LPAD(O.OrderID, 4, '0') as OrderSequence,O.OrderID,O.CartID,O.UserID,O.GrandTotal,OI.ImageUrl,\
            O.CreatedAt,O.OrderStatus,O.Delivered_Cancelled_datetime,p.productId,p.ProductImages,\
            EXISTS(SELECT 1 FROM PhotoOrderRequests por WHERE por.CreatedOrderID = O.OrderID) AS IsPhotoOrder,\
            EXISTS(SELECT 1 FROM PrintJobs pj WHERE pj.OrderID = O.OrderID) AS HasPrints from Orders O \
            left join OrderItems OI on O.OrderID=OI.OrderID \
            left join Products p on p.productId=OI.productId where O.OrderStatus in (1,3,4,6) and O.UserID="+ req.UserID + "  \
            group by O.OrderID order by O.CreatedAt desc"
            let results = await CommonController.commonget(getPastOrders)
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
            }
            resp.json({ "Status": 1, "Orders": results })

        }
        catch (err) {
            console.log("exception in getting orders", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in getting orders" });
        }
    },

    mycurrentorders: async (req, resp, next) => {
        try {
            // let query = "select * from Orders where OrderStatus in (2,5) and UserID="+req.UserID+" order by CreatedAt desc;"
            let getCurrentOrders = "select LPAD(O.OrderID, 4, '0') as OrderSequence,O.OrderID,O.CartID,O.UserID,O.GrandTotal,OI.ImageUrl,\
            O.CreatedAt,O.OrderStatus,O.Delivered_Cancelled_datetime,O.EstimateDateTime,O.TotalDelayMinutes,O.OrderSizeBufferMinutes,O.ScheduleStatus,O.ScheduledDateTime,p.ProductImages,\
            EXISTS(SELECT 1 FROM PhotoOrderRequests por WHERE por.CreatedOrderID = O.OrderID) AS IsPhotoOrder,\
            EXISTS(SELECT 1 FROM PrintJobs pj WHERE pj.OrderID = O.OrderID) AS HasPrints from Orders O \
            left join OrderItems OI on O.OrderID=OI.OrderID \
            left join Products p on p.productId=OI.productId where O.OrderStatus not in (1,3,4,6) and O.UserID="+ req.UserID + "  \
            group by O.OrderID order by O.CreatedAt desc"
            let results = await CommonController.commonget(getCurrentOrders)
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
            }
            resp.json({ "Status": 1, "Orders": results })

        }
        catch (err) {
            console.log("exception in getting orders", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in getting orders" });
        }
    },

    myorder: async (req, resp, next) => {
        try {
            let query = "select *,LPAD(OrderID, 4, '0') AS OrderSequence from Orders where OrderID=" + pool.escape(req.params.OrderID) + " and UserID=" + pool.escape(req.UserID) + ";"
            let results = await CommonController.Get_Order_Complete_Detail(query)

            if (results.length == 1) {
                results[0]['InvoiceFile'] = `/api/orders/invoice/${results[0]['OrderID']}`;
                try {
                    const removedItems = await new Promise(r => pool.query(
                        "SELECT RemovalID, ProductName, Quantity, Reason, CreatedAt FROM order_item_removals WHERE OrderID = ? ORDER BY CreatedAt DESC",
                        [results[0]['OrderID']],
                        (e, rows) => r(rows || [])
                    ));
                    results[0]['RemovedItems'] = removedItems || [];
                } catch (e) {
                    results[0]['RemovedItems'] = [];
                }
                results[0]['PrintJobs'] = await PrintStore.orderJobs(results[0]['OrderID']);
                await addTrackingDetails(results[0]);
                resp.json({ "Status": 1, "Orders": results[0] });
            }
            else {
                resp.json({ "Status": 1, "Orders": {} })
            }
        }
        catch (err) {
            console.log("exception in getting orders", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in getting orders" });
        }
    },

    downloadInvoice: async (req, resp, next) => {
        try {
            const orderId = req.params.OrderID;
            if (!orderId) {
                return resp.status(400).json({ Status: 0, Message: 'OrderID is required' });
            }
            const InvoiceGenerator = require('../services/InvoiceGenerator');
            await InvoiceGenerator.generateReceiptPdf(orderId, resp);
        } catch (err) {
            console.error('Error generating invoice:', err);
            if (!resp.headersSent) {
                return resp.status(500).json({ Status: 0, Message: 'Failed to generate invoice' });
            }
        }
    },

    orderpayments: async (req, resp, next) => {
        let OrderReceiptID, RazorpayOrderID, order, orderPayment, result; // per-request (were implicit globals)
        try {
            console.log('*************order payments**************')
            var body = req.body
            console.log(req.body)
            const keys = Object.keys(body);

            const purpose = String(body.Purpose || '').toUpperCase() === 'ORDER' ? 'ORDER' : 'WALLET';
            if (purpose === 'ORDER') {
                // Order payments are always for the server-calculated amount.
                const bill = await CheckoutBill.computeBill({
                    userId: req.UserID,
                    promoCode: body.PromoCode && body.PromoCode !== 'NA' ? body.PromoCode : null,
                    latitude: body.Latitude,
                    longitude: body.Longitude,
                    tip: body.TipAmount,
                    useWallet: (parseFloat(body.WalletAmount) || 0) > 0,
                });
                if (!bill.Items.length && !bill.PrintItems.length) return resp.status(400).json({ Status: 0, Message: 'Your cart is empty.' });
                if (!bill.MinOrderMet) return resp.status(400).json({ Status: 0, Message: `Minimum order value is Rs.${bill.MinOrderValue}.` });
                if (bill.ToPay <= 0) return resp.status(400).json({ Status: 0, Message: 'Nothing to pay online for this order.' });
                body.OrderAmount = bill.ToPay;
            }
            if (!(parseFloat(body.OrderAmount) >= 1)) {
                return resp.json({ 'Status': 0, "Message": 'OrderAmount is a mandatory field' })
            }
            console.log("Payment Method: ",body.PaymentMethod);

            while (true) {

                OrderReceiptID = Math.floor((Math.random() * 1999999) + 1000000);
                console.log(OrderReceiptID, 'id generated'); // mostly demostrative
                result = await checkOrderReceiptID(OrderReceiptID)
                console.log(result, 'result from function')
                if (parseInt(result) === 1) break
            } //

            const amount = (body.OrderAmount * 100).toFixed(2)
            if (body.Type === undefined || body.Type === null) {
                body.Type = 2
            }

            orderPayment = {
                amount: parseInt(amount),
                currency: "INR",
                receipt: OrderReceiptID.toString(),
                payment_capture: 1
            }
            console.log(orderPayment)
            order = await createorderpayment(orderPayment)
            console.log(order, 'order created');


            RazorpayOrderID = order.id;
            if (keys.includes('Notes') == false) { body.Notes = "NA" }

            let InsertOrderPayments = {
                OrderReceiptID: OrderReceiptID, UserID: req.UserID, OrderAmount: body.OrderAmount,
                OrderCurrency: "INR", Notes: body.Notes, PaymentCapture: 1, RazorpayOrderID: RazorpayOrderID, Type: body.Type,
                Purpose: purpose
            }

            let sql = "INSERT INTO OrderPayments set ?";

            pool.query(sql, InsertOrderPayments, (err, results) => {
                if (err) console.log('db error', err.sqlMessage || err.message); results = results || { affectedRows: 0 };  // never crash on a failed query
                console.log('post method', results, err)
                if (results.affectedRows === 1) {
                    return resp.status(200).json({ "Status": 1, "RazorpayOrderID": RazorpayOrderID, "OrderReceiptID": OrderReceiptID, "OrderAmount": parseFloat(body.OrderAmount) });
                }
                else {
                    console.log("error in adding OrderPayments", results.affectedRows);
                    return resp.status(400).json({ "Status": 0, "Message": "error" });
                }
            })
        }
        catch (err) {
            console.log("exception in getting orders", err);
            return resp.json({ "Status": 0, "Message": "Error in getting orders" });
        }
    },

    addorder: async (req, resp, next) => {
        let OrderID, createorder, createorderitems, decreasevariantsQuantity, decreasewalletAmount, expecteddate, result; // per-request (were implicit globals)
        try {

            console.log('Order Body', req.body)
            var body = req.body;

            // Online payments that cannot become an order are refunded right away.
            const isOnline = String(body.PaymentMethod || '').toUpperCase() === 'ONLINE';
            const fail = async (status, message, extra = {}) => {
                if (isOnline && body.razorpay_payment_id) {
                    const refunded = await refundUnusedPayment(body.RazorpayOrderID, body.razorpay_payment_id, body.razorpay_signature, req.UserID);
                    if (refunded) message += ' Your payment will be refunded.';
                }
                return resp.status(status).json({ Status: 0, Message: message, ...extra });
            };

            const store = await StoreHours.getState();
            if (!store.isOpen) {
                const opens = StoreHours.opensAtText(store);
                return fail(400, `The store is closed right now.${opens ? ` ${opens}.` : ''}`, { StoreClosed: true });
            }

            // Authoritative backend serviceability verification: reject orders outside 20 km radius
            if (body.Latitude !== undefined && body.Longitude !== undefined && body.Latitude !== null && body.Longitude !== null) {
                const deliveryDistance = await Calculate_customer_shop_distance(body.Latitude, body.Longitude);
                if (parseFloat(deliveryDistance) > 20) {
                    return fail(400, "Delivery not possible for this location. The delivery radius is limited to 20 km.", { IsServiceable: false });
                }
                body.Distance = deliveryDistance;
            }

            // The server prices the order; amounts sent by the app are ignored.
            const bill = await CheckoutBill.computeBill({
                userId: req.UserID,
                promoCode: body.PromoCode && body.PromoCode !== 'NA' ? body.PromoCode : null,
                latitude: body.Latitude,
                longitude: body.Longitude,
                tip: body.TipAmount,
                useWallet: (parseFloat(body.WalletAmount) || 0) > 0,
            });
            if (!bill.CartID || (bill.Items.length === 0 && bill.PrintItems.length === 0))
                return fail(400, "Your cart is empty.");
            if (body.PromoCode && body.PromoCode !== 'NA' && !bill.PromoCode)
                return fail(400, bill.CouponMessage || "This coupon cannot be applied to your cart.");
            if (bill.StockIssues.length) {
                const item = bill.StockIssues[0];
                const name = String(item.ProductName || '').trim();
                return fail(400, Number(item.AvailableQty) > 0
                    ? `${name}: only ${item.AvailableQty} left in stock.`
                    : `${name} is out of stock. Remove it from your cart to place the order.`);
            }
            if (!bill.MinOrderMet)
                return fail(400, `Minimum order value is Rs.${bill.MinOrderValue}. Add Rs.${bill.AmountForMinOrder} more to place the order.`);

            let paymentMethod = String(body.PaymentMethod || 'COD').toUpperCase();
            if (bill.ToPay === 0 && bill.WalletApplied > 0) paymentMethod = 'WALLET';
            if (!['COD', 'ONLINE', 'WALLET'].includes(paymentMethod))
                return fail(400, "Please choose a payment method.");
            if (paymentMethod === 'WALLET' && bill.ToPay > 0)
                return fail(400, "Your wallet balance does not cover this order. Choose cash or online payment for the rest.");

            body.PaymentMethod = paymentMethod;
            body.CartID = bill.CartID;
            body.SubTotal = Math.round((bill.ItemsTotal + bill.PrintTotal) * 100) / 100;
            body.PromoCode = bill.PromoCode || undefined;
            body.PromoAmount = Math.round((bill.CouponDiscount + bill.CartOfferDiscount) * 100) / 100;
            body.Discount = body.PromoAmount;
            body.DeliverCharges = bill.DeliveryFee;
            body.TipAmount = bill.Tip;
            body.WalletAmount = bill.WalletApplied;
            body.GrandTotal = bill.ToPay;
            body.OrderItems = bill.Items.map((i) => ({
                ProductID: i.ProductID, VariantID: i.VariantID, ProductName: i.ProductName,
                Quantity: i.Quantity, Price: i.Price, OfferPrice: i.UnitPrice,
                metrictype: i.metrictype, metricvalue: i.metricvalue, Type: i.Type || 1,
                ImageUrl: i.ImageUrl && i.ImageUrl !== 'NA' && !String(i.ImageUrl).startsWith('http') ? PRODUCTS_S3 + i.ImageUrl : i.ImageUrl,
                KitID: 0, KitItems: [],
            }));
            const requestedWallet = bill.WalletApplied;

            console.log(body.PaymentMethod, 'PaymentMethod')
            if (paymentMethod == "ONLINE") {
                var RazorpayOrderID = body.RazorpayOrderID;
                let signaturebody = RazorpayOrderID + "|" + body.razorpay_payment_id;
                var expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAYSECRET).update(signaturebody.toString()).digest('hex');
                if (expectedSignature != body.razorpay_signature) {
                    return resp.json({ 'Status': 0, "Message": "invalid signature" })
                }
                let paymentdetails = await getpaymentdetails(body.razorpay_payment_id)
                const paidAmount = (parseFloat(paymentdetails.amount) || 0) / 100;
                if (paymentdetails.order_id !== RazorpayOrderID || paidAmount + 0.5 < bill.ToPay)
                    return fail(400, `Payment of Rs.${paidAmount.toFixed(2)} does not match the order total of Rs.${bill.ToPay.toFixed(2)}.`);
                // A payment can be used for one order only.
                const consumed = await consumePayment(RazorpayOrderID, body.razorpay_payment_id, req.UserID);
                if (!consumed)
                    return resp.status(400).json({ Status: 0, Message: "This payment has already been used." });
                body.PaymentTransactionID = paymentdetails.id;
                body.PaymentStatus = 1
            }
            else {
                console.log('COD/Wallet Order')
                RazorpayOrderID = 'NA'
                body.PaymentTransactionID = "NA";
                body.PaymentStatus = paymentMethod === 'WALLET' ? 1 : 0;
            }

            while (true) {
                OrderID = Math.floor((Math.random() * 1999999) + 1000000);
                console.log(OrderID, 'id generated'); // mostly demostrative
                result = await checkID(OrderID)
                console.log(result, 'result from function')
                if (parseInt(result) === 1) break
            } //


            body.UserID = req.UserID
            body.MobileNumber = req.MobileNumber

            if (body.PromoAmount == undefined) {
                body.PromoAmount = 0
            }

            body.current_date = await CommonController.currentdate();

            // Delivery time: distance + order size + fresh fruit + prints (services/DeliveryTime.js)
            const exactDistance = await DeliveryTime.distanceFromStore(body.Latitude, body.Longitude);
            const eta = await DeliveryTime.estimate({ distanceKm: exactDistance, items: bill.Items, printJobs: bill.PrintItems.length });
            const isScheduledOrder = body.ScheduleStatus === 'Scheduled' && body.ScheduledDateTime;
            expecteddate = isScheduledOrder
                ? moment(body.ScheduledDateTime).format('YYYY-MM-DD HH:mm:ss')
                : moment().add(eta.totalMinutes, 'minutes').format('YYYY-MM-DD HH:mm:ss');

            body.BaseETAMinutes = eta.distanceMinutes;
            body.OrderSizeBufferMinutes = eta.itemMinutes + eta.fruitMinutes + (eta.printMinutes || 0);
            body.TotalItemQuantity = eta.itemQuantity;
            body.DistanceETABand = eta.band;
            body.ETACalculationDetails = JSON.stringify(eta);

            createorder = await CreateOrders(body, OrderID, RazorpayOrderID, expecteddate)
            body.orderid = createorder.insertId
            console.log(createorder.insertId, 'createorder.insertIdcreateorder.insertIdcreateorder.insertIdcreateorder.insertIdcreateorder.insertId')

            createorderitems = await Orderitemscreate(body.OrderItems, createorder.insertId)
            if (bill.PrintItems.length) await PrintStore.attachToOrder(body.CartID, createorder.insertId, bill.PrintItems)
            decreasevariantsQuantity = await decvariantsQuantity(body.OrderItems)
            if (requestedWallet > 0) {
                decreasewalletAmount = await decWalletAmount(body.WalletAmount, req.UserID, body.orderid)
            }
            //else {
            //    console.log("Wallet Balance for the user: ", req.WalletAmount)
            //    return resp.status(400).json({ "Status": 0, "Message": "Insufficient Wallet Balance to proceed with placing the order." });
            //}
            await unlinkcart(body.CartID)
            //body.OrderSequence = OrderID.toString().padStart(4, '0');
            body.OrderSequence = createorder.insertId.toString().padStart(4, '0');
            console.log("Generated Order ID: ", body.OrderSequence);
            await createinvoice(body, [...body.OrderItems, ...bill.PrintItems.map((p) => ({
                ProductName: `Print: ${p.FileName}`, Quantity: 1, Price: p.LineTotal, OfferPrice: p.LineTotal,
                metricvalue: p.PrintedPages, metrictype: 'pages',
            }))])
            const notificationBody = await CommonController.notificationMessages(8, body.OrderSequence);
            await CommonController.Send_Notification(notificationBody, req.UserID);
            resp.status(200).json({ "Status": 1, "Message": "Order placed successfully", "OrderID": createorder.insertId });
            await OrderLifecycle.addTimeline(createorder.insertId, ORDER_STATUS.RECEIVED, `Order received (${body.PaymentMethod || 'COD'}).`)
            CommonController.sendSmsForNewOrder(createorder.insertId).catch((e) => console.log('new order sms failed', e.message))

        }
        catch (err) {
            console.log("exception in adding orders ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in adding orders" });
        }
    },

    // cancelorderuser : async (req, resp, next) => {
    //     try {
    //         Body=req.body
    //         let OrderID = req.params.OrderID
    //         let GetOrder = `select * from Orders where OrderID = ${OrderID}`
    //         let ResultOrder = await CommonController.commonget(GetOrder)
    //         if(ResultOrder.length === 0){
    //             resp.json({ "Status": 0, "Message": "Order doesnot exists" });
    //         } 

    //         var datetimenow = new Date(Date.now());      
    //         currentdatetime = moment(datetimenow).add(5, 'hours').add(30, 'minutes').format('yyyy-MM-DD hh:mm:ss');
    //         Delivered_Cancelled_datetime = "Delivered_Cancelled_datetime='" + currentdatetime+"',"

    //         if (Body.CancellationReason != null || Body.CancellationReason != undefined)
    //             CancellationReason = "CancellationReason='" + Body.CancellationReason+"'";
    //         else
    //             CancellationReason = "CancellationReason = CancellationReason";

    //         if(parseFloat(ResultOrder[0].WalletAmount) !=0){
    //                 increasewalletAmount = await incWalletAmount(ResultOrder[0].WalletAmount,req.UserID,OrderID)
    //                 }

    //         queryString = "UPDATE Orders SET OrderStatus=4," +Delivered_Cancelled_datetime+CancellationReason+" WHERE OrderID=" + OrderID + ";";
    //         console.log(queryString)
    //         return new Promise(function(resolve, reject) {
    //         pool.query(queryString, function(err, result, fields) {
    //                         if (err) {

    //                                     resp.json({ "Status": 0, "Message": "Error in updating the DB" });
    //                                     console.log("Error in updating the DB:" + err);

    //                                 }
    //                         else {
    //                                 console.log("update :" + result.affectedRows);
    //                                 if (result.affectedRows > 0) {
    //                                         console.log('update successful')
    //                                         resp.json({ "Status": 1, "Message": "Order cancelled Successful" });
    //                                 }
    //                                 else {
    //                                         console.log("Address update failed",err,queryString);
    //                                         resp.json({ "Status": 0, "Message": "No changes to update" });

    //                                 }

    //                                 }
    //          });
    //      });
    //     }
    //     catch (err) {
    //         console.log("exception in updating Order ", err);
    //         return resp.status(500).json({ "Status": 0, "Message": "Error in updating Order" });
    //     }
    // },

    //NEWCODE
    cancelorderuser: async (req, resp, next) => {
        try {
            const Body = req.body || {};
            const OrderID = req.params.OrderID;

            // Only the order's owner may cancel it.
            const ResultOrder = await CommonController.commonget("SELECT * FROM Orders WHERE OrderID = ? AND UserID = ?", [OrderID, req.UserID]);
            if (ResultOrder.length === 0) {
                return resp.json({ "Status": 0, "Message": "Order does not exist" });
            }

            const windowSeconds = await cancelWindowSeconds();
            const secondsSincePlaced = moment().diff(moment(ResultOrder[0].CreatedAt), 'seconds');
            if (secondsSincePlaced > windowSeconds) {
                const mins = Math.max(1, Math.round(windowSeconds / 60));
                return resp.json({ "Status": 0, "Message": windowSeconds > 0
                    ? `You can only cancel the order within ${mins} minute${mins === 1 ? '' : 's'} of placing it.`
                    : "Orders can't be cancelled once placed. Please contact support." });
            }

            await OrderLifecycle.transition(OrderID, ORDER_STATUS.CANCELLED_BY_CUSTOMER, { type: 'customer', id: req.UserID }, {
                reason: Body.CancellationReason ? String(Body.CancellationReason) : null,
            });
            return resp.json({ "Status": 1, "Message": "Order cancelled successfully" });

        } catch (err) {
            if (err instanceof OrderLifecycle.LifecycleError) {
                return resp.json({ "Status": 0, "Message": "This order can no longer be cancelled" });
            }
            console.log("Exception in updating order:", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in updating order" });
        }
    },

    reorder: async (req, resp, next) => {
        let Body, Cart, Cartitem, result; // per-request (were implicit globals)
        try {

            Body = req.body || {}
            // Only the customer's own orders can be re-ordered.
            const owned = await CommonController.commonget("SELECT OrderID FROM Orders WHERE OrderID = ? AND UserID = ?", [Body.OrderID, req.UserID]);
            if (!owned.length) return resp.status(404).json({ "Status": 0, "Message": "Order not found" });

            let orderresult = await getorderitems(Body.OrderID)
            console.log(orderresult, 'orderresult')
            if (orderresult != 0) {
                if(orderresult.length==0)
                     return resp.json({ "Status": 0, "Message": "All the products you're trying to reorder are out of stock." });
                let cartexists = await getcurrentcart(req.UserID)
                if (cartexists.length == 1) {
                    let cartdelete = await deletecart(cartexists[0]['CartID'])
                    if (cartdelete == 1) {
                        console.log('cart doesnot exists')
                        while (true) {
                            var CartID = Math.floor((Math.random() * 1999999) + 1000000);
                            console.log(CartID, 'id generated'); // mostly demostrative
                            let result = await check_CartID(CartID)
                            if (parseInt(result) === 1) break
                        } // condition to determine when should the loop stop 

                        let Cart = await createcart(CartID, req.UserID)
                        for (var j = 0; j < orderresult.length; j++) {
                            let Cartitem = await createcartItems(orderresult[j], CartID)
                        }

                        return resp.status(200).json({ 'Status': 1, "Message": "Cart added successfully, excluding out-of-stock products." })
                    }
                }
                else {
                    console.log('cart doesnot exists')
                    while (true) {
                        CartID = Math.floor((Math.random() * 1999999) + 1000000);
                        console.log(CartID, 'id generated'); // mostly demostrative
                        result = await checkID(CartID)
                        if (parseInt(result) === 1) break
                    } // condition to determine when should the loop stop 

                    Cart = await createcart(CartID, req.UserID)
                    for (var j = 0; j < orderresult.length; j++) {
                        Cartitem = await createcartItems(orderresult[j], CartID)
                    }

                    return resp.status(200).json({ 'Status': 1, "Message": "Cart added successfully, excluding out-of-stock products." })
                }
            }
            else {
                return resp.json({ "Status": 0, "Message": "Order doesnot exists" });
            }

        }
        catch (err) {
            console.log("exception in reorder ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in reorder" });
        }
    },

    getOrderStatus: async (req, resp, next) => {
        try {
            const OrderID = req.params.OrderID; // Get OrderID from request parameters

            // Query the database for the order status
            let orderResult = await CommonController.commonget("SELECT OrderStatus FROM Orders WHERE OrderID = ? AND UserID = ?", [OrderID, req.UserID]);

            // Check if order exists
            if (orderResult.length === 0) {
                return resp.json({ "Status": 0, "Message": "Order not found" });
            }

            // Successful response with the order status
            return resp.status(200).json({ "Status": 1, "OrderStatus": orderResult[0].OrderStatus });
        } catch (err) {
            console.error("Exception in getOrderStatus", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error retrieving order status" });
        }
    },

}



// How long a customer may cancel after placing an order (admin → Settings). 0 = not allowed.
async function cancelWindowSeconds() {
    try {
        const [row] = await CommonController.commonget('SELECT CancelWindowSeconds FROM AdminShopToggleSettings LIMIT 1');
        const v = row ? parseInt(row.CancelWindowSeconds, 10) : NaN;
        return Number.isFinite(v) && v >= 0 ? v : 120;
    } catch (e) {
        return 120;
    }
}

// Tracking info for the customer: status label, timeline, rider details, and
// the delivery OTP only once the rider has arrived.
async function addTrackingDetails(order) {
    order.StatusLabel = STATUS_LABELS[order.OrderStatus] || '';
    if (Number(order.OrderStatus) !== ORDER_STATUS.ARRIVED) order.OTP = null;
    // Computed here so the app does not depend on the phone's clock.
    const status = Number(order.OrderStatus);
    const secondsSincePlaced = moment().diff(moment(order.CreatedAt), 'seconds');
    order.CancelSecondsLeft = [ORDER_STATUS.RECEIVED, ORDER_STATUS.PACKING].includes(status)
        ? Math.max(0, (await cancelWindowSeconds()) - secondsSincePlaced) : 0;
    order.EtaMinutesLeft = (!FINAL_STATUSES.includes(status) && order.EstimateDateTime && moment(order.EstimateDateTime).isValid())
        ? Math.max(0, Math.ceil(moment(order.EstimateDateTime).diff(moment(), 'seconds') / 60)) : null;
    try {
        order.Timeline = await CommonController.commonget(
            "SELECT OrderStatus, Notes, CreatedAt FROM OrderStatusTimeline WHERE OrderID = ? ORDER BY CreatedAt ASC, TimelineID ASC", [order.OrderID]);
    } catch (e) {
        order.Timeline = [];
    }
    order.Rider = null;
    if (Number(order.DeliveryBoyID) > 0) {
        const riders = await CommonController.commonget(
            "SELECT AdminID, FirstName, LastName, MobileNumber FROM AdminUsers WHERE AdminID = ? AND Role = 2", [order.DeliveryBoyID]);
        if (riders.length) {
            order.Rider = {
                Name: `${riders[0].FirstName || ''} ${riders[0].LastName || ''}`.trim(),
                Phone: riders[0].MobileNumber || null,
            };
        }
    }
}

function decWalletAmount(WalletAmount, UserID, OrderID) {
    try {
        return new Promise(async function (resolve, reject) {
            let updateWallets = `update Users set WalletAmount=WalletAmount-${parseFloat(WalletAmount)} where UserID=${UserID}`
            console.log(updateWallets)
            let update_Wallets = await CommonController.commonget(updateWallets)
            await CommonController.Add_To_Wallet_Debit(UserID, (process.env.OrderPlace || 3), OrderID, WalletAmount)
            resolve(1);
        });
    }
    catch (err) {
        reject(-1);
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

function decvariantsQuantity(items) {
    try {
        return new Promise(function (resolve, reject) {
            for (var j = 0; j < items.length; j++) {
                console.log(items[j], 'item1', typeof (items[j]))
                const query = "update ProductVariants set AvailableQty=AvailableQty-? where ProductID = ? and VariantID = ?"
                pool.query(query, [parseInt(items[j]['Quantity'], 10) || 0, items[j]['ProductID'], items[j]['VariantID']], function (err, results, fields) {
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

function incvariantsQuantity(items) {
    try {
        return new Promise(function (resolve, reject) {
            for (var j = 0; j < items.length; j++) {
                console.log(items[j], 'item1', typeof (items[j]))
                const query = "update ProductVariants set AvailableQty=AvailableQty+? where ProductID = ? and VariantID = ?"
                pool.query(query, [parseInt(items[j]['Quantity'], 10) || 0, items[j]['ProductID'], items[j]['VariantID']], function (err, results, fields) {
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

function CreateOrders(body, OrderID, RazorpayOrderID, expecteddate) {
    try {
        return new Promise(async function (resolve, reject) {

            if (body.PromoCode == null || body.PromoCode == undefined) { body.PromoCode = 'NA' }
            if (body.PromoAmount == null || body.PromoAmount == undefined) { body.PromoAmount = 0 }
            if (body.CancellationReason == null || body.CancellationReason == undefined) { body.CancellationReason = "NA" }
            if (body.LandMark == null || body.LandMark == undefined) { body.LandMark = 'NA' }
            if (body.TaxAmount == null || body.TaxAmount == undefined) { body.TaxAmount = 0 }
            if (body.City == null || body.City == undefined) { body.City = "NA" }
            if (body.Discount == null || body.Discount == undefined) { body.Discount = 0 }
            if (body.OrderType == null || body.OrderType == undefined) { body.OrderType = "Delivery" }
            if (body.EstimateDateTime == null || body.EstimateDateTime == undefined) { body.EstimateDateTime = 0 }
            if (body.DeliveryInstructions == null || body.DeliveryInstructions == undefined) { body.DeliveryInstructions = [] }
            if (body.WalletAmount == null || body.WalletAmount == undefined || Array.isArray(body.WalletAmount)) { body.WalletAmount = 0 }
            console.log(body.TipAmount, 'TipAmount')
            if (body.TipAmount == null || body.TipAmount == undefined || Array.isArray(body.TipAmount)) { body.TipAmount = 0 }
            if (body.DeliverCharges == null || body.DeliverCharges == undefined || Array.isArray(body.DeliverCharges)) { body.DeliverCharges = 0 }
            if (body.Distance == null || body.Distance == undefined) { 
                body.Distance = await Calculate_customer_shop_distance(body.Latitude, body.Longitude);  
            }

            if (body.BaseETAMinutes == null) {
                // Callers other than addorder (e.g. photo orders) get the distance-only estimate.
                const eta = await DeliveryTime.estimate({ distanceKm: body.Distance, items: body.OrderItems || [] });
                body.BaseETAMinutes = eta.distanceMinutes;
                body.OrderSizeBufferMinutes = eta.itemMinutes + eta.fruitMinutes;
                body.DistanceETABand = eta.band;
                body.ETACalculationDetails = JSON.stringify(eta);
            }

            const isScheduled = body.ScheduleStatus === 'Scheduled' && body.ScheduledDateTime;
            if (!isScheduled) {
                const totalBaseMinutes = (body.BaseETAMinutes || 20) + (parseInt(body.OrderSizeBufferMinutes, 10) || 0);
                expecteddate = moment().add(totalBaseMinutes, 'minutes').format('YYYY-MM-DD HH:mm:ss');
            }

            // 0 is a valid total (fully paid from the wallet)
            body.GrandTotal = Number.isFinite(parseFloat(body.GrandTotal)) ? parseFloat(body.GrandTotal) : parseFloat(body.SubTotal);

            let Insertorder = {
                MobileNumber: body.MobileNumber, CancellationReason: body.CancellationReason, City: body.City,
                CartID: body.CartID, UserID: body.UserID, PromoCode: body.PromoCode, SubTotal: parseFloat(body.SubTotal) || 0,
                TaxAmount: parseFloat(body.TaxAmount) || 0, PromoAmount: parseFloat(body.PromoAmount) || 0, 
                DeliverCharges: parseFloat(body.DeliverCharges) || 0, GrandTotal: body.GrandTotal,
                PaymentMethod: body.PaymentMethod, Address: body.Address || '', FlatNo: body.FlatNo || '', LandMark: body.LandMark || 'NA',
                Latitude: body.Latitude, Longitude: body.Longitude, PaymentStatus: body.PaymentStatus || 0, PaymentTransactionID: body.PaymentTransactionID || 'NA',
                OrderStatus: 8, DeliveryBoyID: 0, RazorpayOrderID: RazorpayOrderID || 'NA', Discount: parseFloat(body.Discount) || 0,
                EstimateDateTime: isScheduled ? body.ScheduledDateTime : expecteddate, DeliveryInstructions: JSON.stringify(body.DeliveryInstructions),
                OrderType: body.OrderType, WalletAmount: parseFloat(body.WalletAmount) || 0, TipAmount: parseFloat(body.TipAmount) || 0,
                Distance: parseFloat(body.Distance) || 0,
                BaseETAMinutes: body.BaseETAMinutes,
                DistanceETABand: body.DistanceETABand,
                ETACalculationDetails: body.ETACalculationDetails,
                ScheduleStatus: isScheduled ? 'Scheduled' : 'Immediate',
                ScheduledDateTime: isScheduled ? body.ScheduledDateTime : null,
                OrderSizeBufferMinutes: body.OrderSizeBufferMinutes || 0,
                TotalItemQuantity: body.TotalItemQuantity || 0
            }
            let sql = "INSERT INTO Orders set ?";

            pool.query(sql, Insertorder, (err, results) => {
                console.log('post method', results, err)
                if (err) {
                    console.log("error in insert Orders to table :" + err);
                    return reject(-1);
                }
                if (results.affectedRows == 1) {
                    console.log("Added to Orders table: ", results.affectedRows);
                    return resolve(results);
                }
                else {
                    console.log("error in insert Orders to table ", results.affectedRows);
                    return reject(-1);
                }
            });


        });
    }
    catch (err) {
        console.log("error in insert Orders to table ", err);
        return reject(-1);
    }
}



function Orderitemscreate(body, OrderID) {
    try {
        return new Promise(function (resolve, reject) {

            for (var j = 0; j < body.length; j++) {

                console.log(OrderID, body[j])
                if (body[j].KitID == null || body[j].KitID == undefined)
                    body[j].KitID = 0
                if (body[j].KitItems == null || body[j].KitItems == undefined)
                    body[j].KitItems = []
                if (body[j].KitName == null || body[j].KitName == undefined)
                    body[j].KitName = 0
                let InsertorderItems = { OrderID: OrderID, metrictype: body[j].metrictype, metricvalue: body[j].metricvalue, ProductName: body[j].ProductName, ProductID: body[j].ProductID, VariantID: body[j].VariantID, Quantity: body[j].Quantity, Price: body[j].Price, ImageUrl: body[j].ImageUrl, OfferPrice: body[j].OfferPrice, Type: body[j].Type, KitItems: JSON.stringify(body[j].KitItems) }
                console.log(InsertorderItems)
                let sql = "INSERT INTO OrderItems set ?";

                pool.query(sql, InsertorderItems, (err, results) => {
                    console.log('post method', results, err)
                    if (err) {
                        return reject(-1)
                    }

                })
            }

            resolve(1)
        });
    }
    catch (err) {
        return reject(-1)
    }
}

// Marks a Razorpay payment as used; false when it was already redeemed.
function consumePayment(RazorpayOrderID, paymentId, UserID) {
    return new Promise((resolve) => {
        pool.query(
            "UPDATE OrderPayments SET PaymentID = ?, ConsumedAt = NOW() WHERE RazorpayOrderID = ? AND UserID = ? AND ConsumedAt IS NULL",
            [paymentId, RazorpayOrderID, UserID],
            (err, results) => {
                if (err) { console.log('consumePayment failed', err.message); return resolve(false); }
                resolve(results.affectedRows === 1);
            }
        );
    });
}

// Refunds a verified, not-yet-used payment when the order could not be placed.
async function refundUnusedPayment(RazorpayOrderID, paymentId, signature, UserID) {
    try {
        const expected = crypto.createHmac('sha256', process.env.RAZORPAYSECRET).update(`${RazorpayOrderID}|${paymentId}`).digest('hex');
        if (expected !== signature) return false;
        if (!(await consumePayment(RazorpayOrderID, paymentId, UserID))) return false;
        await instance.payments.refund(paymentId);
        return true;
    } catch (err) {
        console.log('refund of unused payment failed', paymentId, err && (err.error || err.message));
        return false;
    }
}

function createorderpayment(orderPayment) {

    return new Promise(function (resolve, reject) {
        resolve(instance.orders.create(orderPayment))
    });
}

function getpaymentdetails(paymentId) {

    return new Promise(function (resolve, reject) {
        resolve(instance.payments.fetch(paymentId))
    });
}


function getmyorder(OrderID) {

    return new Promise(function (resolve, reject) {
        pool.query("select * from Orders where OrderID = ?", [OrderID], function (err, results, fields) {
            if (err) {
                console.log("Error in checking orderid from DB :" + err);
                reject(0);
            }
            else {

                console.log(parseInt(results.length), 'order length')
                if (parseInt(results.length) === 1) {
                    console.log("order exists: ");
                    resolve(results);

                }
                else {
                    console.log(results.length, 'cart length')
                    console.log("order doesnot exists :");
                    resolve(0);

                }
            }
        });
    });
}

function getPromoCode(PromoCode) {

    return new Promise(function (resolve, reject) {
        pool.query("select * from PromoCodes where Status=1 and PromoCode = ?", [PromoCode], function (err, results, fields) {
            if (err) {
                console.log("Error in checking PromoCode from DB :" + err);
                reject(0);
            }
            else {

                console.log(parseInt(results.length), 'PromoCode length')
                if (parseInt(results.length) === 1) {
                    console.log("PromoCode exists: ");
                    resolve(1);

                }
                else {

                    console.log("PromoCode doesnot exists :");
                    resolve(0);

                }
            }
        });
    });
}

function checkID(OrderID) {

    return new Promise(function (resolve, reject) {
        pool.query("select * from Orders where OrderID = ?", [OrderID], function (err, results, fields) {
            if (err) {
                console.log("Error in checking CartID from DB :" + err);
                reject(0);
            }
            else {

                console.log(parseInt(results.length), 'id length')
                if (parseInt(results.length) === 1) {
                    console.log("orderid exists : " + OrderID);
                    resolve(0);

                }
                else {

                    console.log("orderid not exists :" + OrderID);
                    resolve(1);

                }
            }
        });
    });
}

function checkOrderReceiptID(OrderReceiptID) {

    return new Promise(function (resolve, reject) {
        pool.query("select * from OrderPayments where OrderReceiptID = ?", [OrderReceiptID], function (err, results, fields) {
            if (err) {
                console.log("Error in checking CartID from DB :" + err);
                reject(0);
            }
            else {

                console.log(parseInt(results.length), 'id length')
                if (parseInt(results.length) === 1) {
                    console.log("ID already useD : " + OrderReceiptID);
                    resolve(0);

                }
                else {
                    console.log(results.length, 'id length')
                    console.log("ID not in used :" + OrderReceiptID);
                    resolve(1);

                }
            }
        });
    });
}

function getorderitems(OrderID) {
    var queryString = "";

    queryString = `SELECT oi.*
                FROM OrderItems oi
                INNER JOIN Products p ON oi.ProductID = p.ProductID
                INNER JOIN ProductVariants pv ON oi.VariantID = pv.VariantID
                WHERE oi.OrderID =? and pv.AvailableQty>0 and oi.Quantity<pv.maxQty`;

    return new Promise(function (resolve, reject) {
        pool.query(queryString, [OrderID], function (err, results, fields) {
            if (err) {
                console.log("Error in checking OrderID from DB :" + err);
                reject(0);
            }
            else {
                if (results.length > 0) {
                    resolve(results);
                }
                else {
                    resolve(0);
                }
            }
        });
    });
}

function unlinkcart(CartID) {
    let query; // per-request (were implicit globals)
    try {
        return new Promise(function (resolve, reject) {
            // console.log(cartId,'unlink cart')

            query = "update Carts set isOrderLinked=0 where CartID=?"
            // console.log(query)
            pool.query(query, [CartID], function (error, results, fields) {
                if (error) {
                    console.log("Error in unlink Cart:" + error);
                    reject(0);
                }
                else {
                    // Mark any active abandoned cart log for this CartID as recovered because order was placed
                    pool.query(
                        "UPDATE AbandonedCartLogs SET Status = 'recovered', RecoveredAt = NOW(), UpdatedAt = NOW() WHERE CartID = ? AND Status = 'active'",
                        [CartID],
                        (logErr) => {
                            if (logErr) console.error("Error recovering abandoned cart log in unlinkcart:", logErr);
                        }
                    );
                    resolve(1)
                }
            });

        });
    }
    catch (err) {
        reject(0);
    }
}

function getcurrentcart(UserID) {

    return new Promise(function (resolve, reject) {
        let getCart = "select * from Carts where UserID = ? and isOrderLinked=1"
        pool.query(getCart, [UserID], function (err, results, fields) {
            if (err) {
                console.log("Error in checking cartId from DB :" + err);
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

function createcart(CartID, UserID) {
    try {
        return new Promise(function (resolve, reject) {

            let Insertcarts = { CartID: CartID, UserID: UserID, IsOrderLinked: 1 }
            let sql = "INSERT INTO Carts set ?";
            console.log('Insertcarts :', Insertcarts)
            pool.query(sql, Insertcarts, (err, results) => {
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

function createcartItems(body, CartID) {
    try {
        return new Promise(function (resolve, reject) {

            let InsertcartItems = { CartID: CartID, ProductID: body.ProductID, VariantId: body.VariantID, Quantity: body.Quantity }
            let sql = "INSERT INTO CartItems set ?";
            console.log('InsertcartItems :', InsertcartItems)
            pool.query(sql, InsertcartItems, (err, results) => {
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
        console.log("error in insert cartItems to table ", err);
        reject(-1)
    }
}

function check_CartID(CartID) {

    return new Promise(function (resolve, reject) {
        pool.query("select * from Carts where CartID = ?", [CartID], function (err, results, fields) {
            if (err) {
                console.log("Error in checking cartId from DB :" + err);
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


function deletecart(CartID) {
    return new Promise(function (resolve, reject) {
        console.log(CartID)
        let delete_cart = "delete from Carts where CartID = ?"
        pool.query(delete_cart, [CartID], function (err, results, fields) {
            if (err) {
                console.log("Error in checking cartId from DB :" + err);
                reject(0);
            }
            else {
                console.log(results.affectedRows, 'cart delete affected rows')
                resolve(1)
                // if (results.affectedRows === 1) {
                //     console.log("cart exists: ");
                //     resolve(1);}
                // else {                    
                //     console.log("error in cart delete");
                //     reject(0);}
            }
        });
    });
}

async function createinvoice(orderresult, orderitems) {
    let Order_Date, filename, invdate, issuedate, location, newline1, newline2, noofpages; // per-request (were implicit globals)

    return new Promise(async function (resolve, reject) {
        console.log('pdf started')
        // console.log('pdf started',orderitems)
        let shopaddress = "44-6a , Prakash Nagar Kurnool - 518004"
        const doc = new PDFDocument({
            size: [79, 210], // Width: 79mm, Height: 210mm (A4 height)
            margin: 2, // No margin
        });


        invdate = moment(orderresult['current_date'], 'yyyy-MM-dd').format('DDMM');
        filename = "INV" + invdate.toString() + "_" + Date.now() + ".pdf"
        // filename="TESTINV.pdf"

        Order_Date = new Date(orderresult['current_date'])
        issuedate = moment(Order_Date, 'yyyy-MM-dd').format('yyyy-MM-DD');

        doc.pipe(fs.createWriteStream("images/" + filename));
        doc.registerFont('TeluguFont', 'images/NotoSerifTelugu-Black.ttf');
        const shoplines = shopaddress.split(' ').reduce((result, element, index) => {
            if (index % 7 === 0) result.push([]);
            result[result.length - 1].push(element);
            return result;
        }, []).map(line => line.join(' '));
        console.log(shoplines)
        var shop_address = shoplines.join('\n');
        shop_address = shop_address
        var imagename = "images/logo_clikgett.jpeg"
        doc.image(imagename, 32, 5, {
            fit: [15, 15]
        }).stroke();
        // doc.fill('black').fontSize(4).font('Helvetica-Bold').text('Clikgett', 27.5, 5);
        // doc.fontSize(2).font('Helvetica-Bold').text(shop_address, 17.5, 10);

        filename = "INV" + "_" + Date.now() + ".pdf"
        const invoiceno = filename
        doc.fontSize(3).font('Helvetica-Bold').text("Clikgett ", 33.5, 23);

        doc.fontSize(3).font('Helvetica-Bold').text("Customer Info: ", 5, 27);

        doc.fontSize(2.5).font('Helvetica').text("Name : " + orderresult['username'], 5, 33);
        doc.fontSize(2.5).font('Helvetica').text("Order Id : " + orderresult['OrderSequence'], 5, 36);

        doc.fontSize(2.5).font('Helvetica').text("Invoice Date : " + issuedate, 45, 33);

        // doc.moveTo(0,40).lineTo(650, 40).fill('gray').stroke();
        var string = String("-").padStart(75, "-")
        doc.fontSize(3).font('Helvetica').text(string, 2, 40);

        doc.fill('black').fontSize(3).font('Helvetica-Bold').text('Item', 5, 44);
        doc.fontSize(3).font('Helvetica-Bold').text('Qty', 50, 44);
        doc.fontSize(3).font('Helvetica-Bold').text('Price', 60, 44);
        doc.fontSize(3).font('Helvetica-Bold').text('Amt', 70, 44);

        doc.fontSize(3).font('Helvetica').text(string, 2, 47);
        // doc.moveTo(0,47).lineTo(650, 47).fill('gray').stroke();

        line1 = 47
        // lin2=65

        var products_in_page_1 = 22
        var products_in_newpage = 29
        var itemsqty = 0

        var TotalGst = 0
        var gst = 0

        const teluguFontPath = 'images/NotoSerifTelugu-Black.ttf'; // Replace with the actual path
        doc.font(teluguFontPath);
        if (orderitems.length > products_in_page_1) {
            //if products length more than 10
            for (var j = 0; j < products_in_page_1; j++) {
                //first page of pdf
                if (j < products_in_page_1) {
                    itemsqty = itemsqty + orderitems[j]['Quantity']
                    console.log(itemsqty + orderitems[j]['Quantity'], "---------------------------")
                    // if (orderitems[j]['gst'] == undefined){
                    //     orderitems[j]['gst'] = 0
                    // }

                    // gst = (orderitems[j]['dmrp']*orderitems[j]['Quantity'])/(1+(orderitems[j]['gst']/100))     

                    // gst = (orderitems[j]['dmrp']*orderitems[j]['Quantity']) - gst

                    // TotalGst = parseFloat(TotalGst) + parseFloat(gst)
                    // console.log(parseFloat(TotalGst) , parseFloat(gst),'totalgst')
                    TotalGst = 0
                    line1 = line1 + 7
                    // console.log(line2,'line2')
                    line2 = line1 + 15
                    await invoiceproducts(doc, orderitems[j], line1)
                }
            }

            var itemslength = orderitems.length
            if (orderitems.length < products_in_newpage) {
                noofpages = 1
            }
            else {
                noofpages = itemslength / products_in_newpage
            }
            console.log(noofpages, 'noofpages')

            var num = products_in_page_1

            for (var i = 0; i < noofpages; i++) {
                //to add new page added
                doc.addPage()
                newline1 = 0
                for (var k = num; k < num + products_in_newpage; k++) {

                    if (k < itemslength) {
                        itemsqty = itemsqty + orderitems[k]['Quantity']
                        // orderitems[k]['gst'] =1  
                        if (orderitems[k]['gst'] == undefined) {
                            orderitems[k]['gst'] = 0
                        }
                        // gst = (orderitems[k]['dmrp']*orderitems[k]['Quantity'])/(1+(orderitems[k]['gst']/100))   

                        // gst = (orderitems[k]['dmrp']*orderitems[k]['Quantity']) - gst
                        TotalGst = 0
                        // TotalGst = parseFloat(TotalGst) + parseFloat(gst)
                        // console.log(parseFloat(TotalGst) , parseFloat(gst),'totalgst')

                        newline2 = newline1 + 15
                        newline1 = newline1 + 7
                        let ItemNo = num + 1;
                        await invoiceproducts(doc, orderitems[k], newline1, newline2, ItemNo)
                    }
                }
                num = num + products_in_newpage
                if (k > itemslength) {
                    break
                }
            }


            if (newline2 <= 174) {
                console.log('here')
                await ordersummary(doc, newline2, orderresult, string, itemsqty, TotalGst)
            }
            else {
                doc.addPage()
                await newpage_ordersummary(doc, orderresult, string, itemsqty, TotalGst)
            }
        }
        else {
            for (var j = 0; j < orderitems.length; j++) {
                itemsqty = itemsqty + orderitems[j]['Quantity']
                var line2 = line1 + 15
                var line1 = line1 + 4;
                TotalGst = 0
                let ItemNo = j + 1;

                await invoiceproducts(doc, orderitems[j], line1, line2, ItemNo)
            }
            console.log(line2, 'line2')
            if (line2 <= 174) {
                await ordersummary(doc, line2, orderresult, string, itemsqty, TotalGst)
            }
            else {
                doc.addPage()
                await newpage_ordersummary(doc, orderresult, string, itemsqty, TotalGst)
            }
        }

        console.log('file ended')
        console.log('file endedd')
        doc.end();

        const params = {
            Bucket: process.env.bucketname,
            Key: 'orderinvoice/' + filename, // File name you want to save as in S3
            Body: doc,
            ContentType: 'application/pdf',
            ACL: 'public-read'
        };

        // Uploading files to the bucket
        s3.upload(params, async function (err, data) {
            console.log('upload')
            if (err) {
                console.log(err)
                return console.error('image upload failed:', err.message); // never throw in a callback (crashes the server)
            }
            location = data.Location
            console.log(`File uploaded successfully. ${data.Location}`);
            try {
                let UpdateOrders = `update Orders set InvoiceFile=${pool.escape(filename)} where OrderID=${orderresult.orderid}`
                console.log(UpdateOrders, 'UpdateOrders')
                await CommonController.commonget(UpdateOrders)
                // 
                // let queryx = {                               
                //     orderid: orderresult['orderid']                                
                // }
                // fndupdchanges = {
                //     $set: {invoicefile: 'http://clikgett-media.local/orderinvoice/'+filename}
                // };
                // console.log(queryx,fndupdchanges)
                // orderupdate = await orders.updateOne(queryx, fndupdchanges)
                // console.log(orderupdate)                        
            }
            catch (e) {
                console.log('file not found')
            }
            console.log("PDF upload success");

        });

        resolve(1)



    });
}



function ordersummary(doc, line2, orderresult, string, itemsqty, TotalGst) {
    // Center the main topic
    var string = String("-").padStart(110, "-")
    const mainTopicX = (doc.page.width / 2) - (doc.widthOfString(string) / 2);

    doc.fill('black').fontSize(2).font('Helvetica').text(string, mainTopicX, line2 + 5);

    // Define positions for vertical alignment
    const subTotalY = line2 + 8;
    const discountY = line2 + 13;
    const deliveryChargesY = line2 + 17;
    const walletY = line2 + 20;
    const tipY = line2 + 23;
    const totalY = line2 + 29;

    const storeinfo = line2 + 35;
    const gst = line2 + 41;
    const address = line2 + 47;
    const systemgenerated = line2 + 53;
    doc.fill('black').fontSize(3).font('Helvetica').text('Sub Total', 5, subTotalY);
    doc.fill('black').fontSize(3).font('Helvetica').text(itemsqty, 50, subTotalY);

    // Add other fields with vertical alignment
    doc.fill('black').fontSize(3).font('Helvetica').text('Discount', 5, discountY);
    doc.fill('black').fontSize(3).font('Helvetica').text('Delivery charges', 5, deliveryChargesY);
    doc.fill('black').fontSize(3).font('Helvetica').text('Wallet', 5, walletY);
    doc.fill('black').fontSize(3).font('Helvetica').text('Tip', 5, tipY);

    doc.fill('black').fontSize(2).font('Helvetica').text(string, mainTopicX, line2 + 26);

    doc.fill('black').fontSize(3).font('Helvetica').text('Total', 5, totalY);

    // Round and convert to two decimal points format
    let finalsubtotal = Math.round(orderresult['SubTotal']);
    let convfinalsubtotal = finalsubtotal.toFixed(2);

    // Display respective amounts including Tip
    doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + convfinalsubtotal, { align: 'right' }, subTotalY);
    doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + Math.round(orderresult['PromoAmount']).toFixed(2), { align: 'right' }, discountY);
    doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + Math.round(orderresult['DeliverCharges']).toFixed(2), { align: 'right' }, deliveryChargesY);
    doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + Math.round(orderresult['WalletAmount']).toFixed(2), { align: 'right' }, walletY);
    doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + Math.round(orderresult['TipAmount']).toFixed(2), { align: 'right' }, tipY);

    // Adjust the grand total to include Tip and round it
    let grandTotalWithTip = Math.round(parseFloat(orderresult['GrandTotal']) + parseFloat(0));
    grandTotalWithTip = grandTotalWithTip.toFixed(2);

    doc.fill('black').fontSize(3).font('Helvetica').text("Rs. " + grandTotalWithTip, { align: 'right' }, totalY);

    // Footer section
    if (line2 + 165 < 690) {

        //doc.fill('black').fontSize(3).font('Helvetica').text("Store Info: ", 5, storeinfo);
        //doc.fill('black').fontSize(2.5).font('Helvetica').text("GSTIN No. 37AHBPB8954G1ZB ", 5, gst);
        //doc.fill('black').fontSize(2.5).font('Helvetica').text("Address ; 44-6A , Prakash Nagar, Kurnool - 518004", 5, address);
        doc.fill('black').fontSize(2).font('Helvetica').text("This is system generated. Does not require any signature.", 5, systemgenerated);
    } else {
        // doc.fill('black').fontSize(9).font('Helvetica').text("Store Info: ", 170, line2 + 145);
        // doc.fill('black').fontSize(9).font('Helvetica').text("GSTIN No. 37AHBPB8954G1ZB ", 180, line2 + 145);
        // doc.fill('black').fontSize(9).font('Helvetica').text("Address ; 44-6A , Prakash Nagar, Kurnool - 518004", 185, line2 + 145);
        doc.fill('black').fontSize(3).font('Helvetica').text("This is system generated. Does not require any signature.", 200, line2 + 145);
    }
}

function newpage_ordersummary(doc, orderresult, string, itemsqty, TotalGst) {
    // Center the main topic
    const mainTopicX = (doc.page.width / 2) - (doc.widthOfString(string) / 2);
    doc.fill('black').fontSize(3).font('Helvetica').text(string, mainTopicX, 5);

    // Define positions for vertical alignment
    const subTotalY = 8;
    const discountY = 18;
    const deliveryChargesY = 20;
    const walletY = 22;
    const tipY = 24;
    const totalY = 26;

    doc.fill('black').fontSize(3).font('Helvetica').text('Sub Total', 5, subTotalY);
    doc.fill('black').fontSize(3).font('Helvetica').text(itemsqty, 50, subTotalY);

    doc.fill('black').fontSize(3).font('Helvetica').text('Discount', 5, discountY);
    doc.fill('black').fontSize(3).font('Helvetica').text('Delivery charges', 5, deliveryChargesY);
    doc.fill('black').fontSize(3).font('Helvetica').text('Wallet', 5, walletY);
    doc.fill('black').fontSize(3).font('Helvetica').text('Tip', 5, tipY);

    doc.fill('black').fontSize(3).font('Helvetica').text(string, 2, 26);
    doc.fill('black').fontSize(3).font('Helvetica').text('Total', 5, totalY);

    let finalsubtotal = Math.round(orderresult['subtotal']);
    let convfinalsubtotal = finalsubtotal.toFixed(2);

    doc.fill('black').fontSize(3).font('Helvetica').text("Rs. " + convfinalsubtotal.toString(), { align: 'right' }, subTotalY);
    doc.fill('black').fontSize(3).font('Helvetica').text("Rs. " + Math.round(orderresult['PromoAmount']).toFixed(2), { align: 'right' }, discountY);
    doc.fill('black').fontSize(3).font('Helvetica').text("Rs. " + Math.round(orderresult['DeliverCharges']).toFixed(2), { align: 'right' }, deliveryChargesY);
    doc.fill('black').fontSize(3).font('Helvetica').text("Rs. " + Math.round(orderresult['WalletAmount']).toFixed(2), { align: 'right' }, walletY);
    doc.fill('black').fontSize(3).font('Helvetica').text("Rs. " + Math.round(orderresult['TipAmount']).toFixed(2), { align: 'right' }, tipY);

    let grandTotalWithTip = Math.round(parseFloat(orderresult['GrandTotal']) + parseFloat(0));
    grandTotalWithTip = grandTotalWithTip.toFixed(2);

    doc.fill('black').fontSize(3).font('Helvetica').text("Rs. " + grandTotalWithTip.toString(), { align: 'right' }, totalY);

    doc.fill('black').fontSize(3).font('Helvetica').text("Thank You.", 40, 200);
}

function invoiceproducts(doc, orderitems, line1, line2, ItemNo) {
    var TotalPrice = parseInt(orderitems['Quantity']) * parseInt(orderitems['OfferPrice']);
    TotalPrice = TotalPrice.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

    var convprice = Math.round(orderitems['OfferPrice']).toFixed(2);

    // Remove quantity from the product name
    //doc.fill('black').fontSize(2).text(ItemNo + "." + orderitems['ProductName'], 5, line1, { width: 43 });
    doc.fill('black').fontSize(1.5).font('TeluguFont').text(ItemNo + "." + orderitems['ProductName'] + "  " + orderitems['metricvalue'] + " " + orderitems['metrictype'], 5, line1, { width: 46 });
    doc.fill('black').fontSize(2).font('Helvetica').text(orderitems['Quantity'], 50, line1 );
    doc.fill('black').fontSize(2).font('Helvetica').text(convprice, 60, line1 );
    doc.fill('black').fontSize(2).font('Helvetica').text(TotalPrice, 70, line1 );
}

async function Calculate_customer_shop_distance(Cust_Latitude, Cust_Longitude) {
    return new Promise(async (resolve, reject) => {
        try {
            let getshop = `select * from AdminShopToggleSettings limit 0,1`;
            let settingslist = await CommonController.commonget(getshop);

            let storelatitude = (settingslist && settingslist[0]) ? settingslist[0]['Latitude'] : 0;
            let storeLongitude = (settingslist && settingslist[0]) ? settingslist[0]['Longitude'] : 0;

            // Calculate distance between user's address and store's location
            let query = "SELECT coalesce(ROUND(6371 * acos (cos ( radians(" + (Number(Cust_Latitude) || 0) + ") ) * cos( radians( " + (Number(storelatitude) || 0) + " ) ) * \
                        cos( radians( " + (Number(storeLongitude) || 0) + " ) - radians(" + (Number(Cust_Longitude) || 0) + ") ) + \
                        sin ( radians(" + (Number(Cust_Latitude) || 0) + ") ) * sin( radians( " + (Number(storelatitude) || 0) + " ) ))),0) AS distance";
            pool.query(query, function (err, results, fields) {
                if (err) {
                    console.log("Error in calculating delivery distance, using spherical fallback:" + err);
                    const R = 6371;
                    const dLat = (storelatitude - Cust_Latitude) * Math.PI / 180;
                    const dLon = (storeLongitude - Cust_Longitude) * Math.PI / 180;
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                              Math.cos(Cust_Latitude * Math.PI / 180) * Math.cos(storelatitude * Math.PI / 180) *
                              Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    return resolve(Math.round(R * c * 100) / 100);
                } else {
                    resolve((results && results[0]) ? results[0].distance : 0);
                }
            });
        } catch (e) {
            resolve(0);
        }
    });
}



// function invoiceproducts(doc,orderitems,line1) {

//         // console(line2,'new line2')
//         var TotalPrice = parseInt(orderitems['Quantity'])*parseInt(orderitems['OfferPrice'])
//         var TotalPrice = TotalPrice.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]

//         var convprice = orderitems['OfferPrice'].toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]
//             // const teluguFontPath = 'images/NotoSerifTelugu-Black.ttf'; // Replace with the actual path
//             // doc.font(teluguFontPath);                              
//             doc.fill('black').fontSize(2).text(orderitems['ProductName']+" ("+orderitems['Quantity']+")",5, line1,{width:43});                                    
//             doc.fill('black').fontSize(2).font('Helvetica').text(orderitems['Quantity'],50, line1); 
//             doc.fill('black').fontSize(2).font('Helvetica').text(convprice,60, line1);   
//             doc.fill('black').fontSize(2).font('Helvetica').text(TotalPrice,70, line1);

//     }

//NEWCODE
// function invoiceproducts(doc, orderitems, line1) {
//     var TotalPrice = parseInt(orderitems['Quantity']) * parseInt(orderitems['OfferPrice']);
//     TotalPrice = TotalPrice.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     var convprice = orderitems['OfferPrice'].toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     // Remove quantity from the product name
//     doc.fill('black').fontSize(2).text(orderitems['ProductName'], 5, line1, { width: 43 });
//     doc.fill('black').fontSize(2).font('Helvetica').text(orderitems['Quantity'], 50, line1);
//     doc.fill('black').fontSize(2).font('Helvetica').text(convprice, 60, line1);
//     doc.fill('black').fontSize(2).font('Helvetica').text(TotalPrice, 70, line1);
// }

// //NEWERCODE
// function invoiceproducts(doc, orderitems, line1) {
//     // Calculate total price
//     var TotalPrice = parseInt(orderitems['Quantity']) * parseInt(orderitems['OfferPrice']);
//     TotalPrice = TotalPrice.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     // Convert price to two decimal points format
//     var convprice = orderitems['OfferPrice'].toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     // Adjust the alignment of product details
//     doc.fill('black').fontSize(2).text(orderitems['ProductName'], 5, line1, { width: 43 });
//     doc.fill('black').fontSize(2).font('Helvetica').text(orderitems['Quantity'], 50, line1);
//     doc.fill('black').fontSize(2).font('Helvetica').text(convprice, 60, line1);
//     doc.fill('black').fontSize(2).font('Helvetica').text(TotalPrice, 70, line1);
// }



// function newpage_ordersummary(doc,orderresult,string,itemsqty,TotalGst) {
//         console.log('igst')


//         // doc.moveTo(0,5).lineTo(650, 5).fill('gray').stroke();
//         doc.fill('black').fontSize(2).font('Helvetica').text(string,2, 5);

//         doc.fill('black').fontSize(2).font('Helvetica').text('Sub Total',5, 8);  
//         doc.fill('black').fontSize(2).font('Helvetica').text(itemsqty,50, 8);  

//         // doc.moveTo(0,11).lineTo(650, 11).fill('gray').stroke();
//         doc.fill('black').fontSize(2).font('Helvetica').text(string,2, 11);


//         doc.fill('black').fontSize(2).font('Helvetica').text('Discount',45, 14);
//         doc.fill('black').fontSize(2).font('Helvetica').text('Delivery charges',45,17);
//         doc.fill('black').fontSize(2).font('Helvetica').text('Wallet',45, 20);



//         // doc.moveTo(0,23).lineTo(650, 23).fill('gray').stroke();
//         doc.fill('black').fontSize(2).font('Helvetica').text(string,2, 23);

//         doc.fill('black').fontSize(2).font('Helvetica').text('Total',5, 26);

//         doc.fill('black').fontSize(2).font('Helvetica').text(string,2, 29);

//         // doc.moveTo(0,29).lineTo(650, 29).fill('gray').stroke();


//         finalsubtotal = orderresult['subtotal']
//         convfinalsubtotal = finalsubtotal.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]                                        


//         doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + convfinalsubtotal.toString(),{align: 'right'}, 8);
//         doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['PromoAmount'],{align: 'right'}, 14);
//         doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['DeliverCharges'],{align: 'right'}, 17);
//         doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['WalletAmount'],{align: 'right'}, 20); 

//         doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['GrandTotal'].toString(),{align: 'right'}, 23);
//         doc.fill('black').fontSize(2).font('Helvetica').text("Thank You.",40, 200);

//     }

// NEWCODE
// function newpage_ordersummary(doc, orderresult, string, itemsqty, TotalGst) {
//     doc.fill('black').fontSize(2).font('Helvetica').text(string, 2, 5);

//     doc.fill('black').fontSize(2).font('Helvetica').text('Sub Total', 5, 8);
//     doc.fill('black').fontSize(2).font('Helvetica').text(itemsqty, 50, 8);

//     doc.fill('black').fontSize(2).font('Helvetica').text(string, 2, 11);

//     doc.fill('black').fontSize(2).font('Helvetica').text('Discount', 45, 14);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Delivery charges', 45, 17);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Wallet', 45, 20);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Tip', 45, 23);  // Add Tip Amount row

//     doc.fill('black').fontSize(2).font('Helvetica').text(string, 2, 26);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Total', 5, 29);

//     finalsubtotal = orderresult['subtotal'];
//     convfinalsubtotal = finalsubtotal.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + convfinalsubtotal.toString(), { align: 'right' }, 8);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['PromoAmount'], { align: 'right' }, 14);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['DeliverCharges'], { align: 'right' }, 17);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['WalletAmount'], { align: 'right' }, 20);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['TipAmount'], { align: 'right' }, 23);  // Display Tip Amount

//     let grandTotalWithTip = parseFloat(orderresult['GrandTotal']) + parseFloat(orderresult['TipAmount']);
//     grandTotalWithTip = grandTotalWithTip.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + grandTotalWithTip.toString(), { align: 'right' }, 26);

//     doc.fill('black').fontSize(2).font('Helvetica').text("Thank You.", 40, 200);
// }

//NEWERCODE
// function newpage_ordersummary(doc, orderresult, string, itemsqty, TotalGst) {
//     // Center the header text
//     doc.fill('black').fontSize(2).font('Helvetica').text(string, { align: 'center' }, 5);

//     // Adjust positioning for subtotal and below fields
//     doc.fill('black').fontSize(2).font('Helvetica').text('Sub Total', 5, 8);
//     doc.fill('black').fontSize(2).font('Helvetica').text(itemsqty, 60, 8); // Align qty on the right

//     doc.fill('black').fontSize(2).font('Helvetica').text(string, 2, 11);

//     // Labels for Discount, Delivery Charges, Wallet, Tip
//     doc.fill('black').fontSize(2).font('Helvetica').text('Discount', 5, 14);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Delivery charges', 5, 17);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Wallet', 5, 20);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Tip', 5, 23);

//     doc.fill('black').fontSize(2).font('Helvetica').text(string, 2, 26);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Total', 5, 29);

//     // Convert to two decimal points format for final subtotal
//     finalsubtotal = orderresult['subtotal'];
//     convfinalsubtotal = finalsubtotal.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     // Align values for subtotal, promo, delivery, wallet, and tip on the right
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + convfinalsubtotal.toString(), { align: 'right' }, 8);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['PromoAmount'], { align: 'right' }, 14);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['DeliverCharges'], { align: 'right' }, 17);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['WalletAmount'], { align: 'right' }, 20);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['TipAmount'], { align: 'right' }, 23);

//     let grandTotalWithTip = parseFloat(orderresult['GrandTotal']) + parseFloat(orderresult['TipAmount']);
//     grandTotalWithTip = grandTotalWithTip.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     // Align grand total on the right
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + grandTotalWithTip.toString(), { align: 'right' }, 26);

//     // Footer text aligned to the center
//     doc.fill('black').fontSize(9).font('Helvetica').text("Thank You.", { align: 'center' }, 200);
// }


// function ordersummary(doc,line2,orderresult,string,itemsqty,TotalGst) {

//         // CGST = TotalGst/2
//         // SGST = TotalGst/2
//         // convtotalCGST = CGST.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]
//         // convtotalSGST = SGST.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]

//         // doc.moveTo(0,5).lineTo(650, 5).fill('gray').stroke();
//         doc.fill('black').fontSize(2).font('Helvetica').text(string,2, line2+5);

//         doc.fill('black').fontSize(2).font('Helvetica').text('Sub Total',5, line2+8);
//         doc.fill('black').fontSize(2).font('Helvetica').text(itemsqty,50, line2+8);

//         doc.fill('black').fontSize(2).font('Helvetica').text(string,2, line2+11);

//         doc.fill('black').fontSize(2).font('Helvetica').text('Discount',45, line2+13);
//         doc.fill('black').fontSize(2).font('Helvetica').text('Delivery charges',45, line2+17);
//         doc.fill('black').fontSize(2).font('Helvetica').text('Wallet',45, line2+20);


//         doc.fill('black').fontSize(2).font('Helvetica').text(string,2, line2+23);

//         doc.fill('black').fontSize(2).font('Helvetica').text('Total',5, line2+26);

//         doc.fill('black').fontSize(2).font('Helvetica').text(string,2, line2+29);


//         finalsubtotal = orderresult['SubTotal']
//         convfinalsubtotal = finalsubtotal.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]                                        


//         doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + convfinalsubtotal,{align: 'right'}, line2+8);    
//         doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['PromoAmount'],{align: 'right'}, line2+13);
//         doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['DeliverCharges'],{align: 'right'}, line2+17);
//         doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['WalletAmount'],{align: 'right'}, line2+20);  

//         doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['GrandTotal'].toString(),{align: 'right'}, line2+32);

//         console.log(line2+145,'line2',line2)
//         if(line2+165<690){
//             doc.fill('black').fontSize(9).font('Helvetica').text("This is system generated. Does not require any signature.",200, 700);}
//         else{
//             doc.fill('black').fontSize(9).font('Helvetica').text("This is system generated. Does not require any signature.",200, line2+145);                                      
//             }
//     }

//NEWCODE
// function ordersummary(doc, line2, orderresult, string, itemsqty, TotalGst) {
//     doc.fill('black').fontSize(2).font('Helvetica').text(string, 2, line2 + 5);

//     doc.fill('black').fontSize(2).font('Helvetica').text('Sub Total', 5, line2 + 8);
//     doc.fill('black').fontSize(2).font('Helvetica').text(itemsqty, 50, line2 + 8);

//     doc.fill('black').fontSize(2).font('Helvetica').text(string, 2, line2 + 11);

//     // Add Tip Amount in the list
//     doc.fill('black').fontSize(2).font('Helvetica').text('Discount', 45, line2 + 13);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Delivery charges', 45, line2 + 17);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Wallet', 45, line2 + 20);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Tip', 45, line2 + 23); // Add Tip Amount row

//     doc.fill('black').fontSize(2).font('Helvetica').text(string, 2, line2 + 26);

//     doc.fill('black').fontSize(2).font('Helvetica').text('Total', 5, line2 + 29);

//     // Convert to two decimal points format
//     finalsubtotal = orderresult['SubTotal'];
//     convfinalsubtotal = finalsubtotal.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     // Display respective amounts including Tip
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + convfinalsubtotal, { align: 'right' }, line2 + 8);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['PromoAmount'], { align: 'right' }, line2 + 13);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['DeliverCharges'], { align: 'right' }, line2 + 17);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['WalletAmount'], { align: 'right' }, line2 + 20);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['TipAmount'], { align: 'right' }, line2 + 23);  // Display Tip Amount

//     // Adjust the grand total to include Tip
//     let grandTotalWithTip = parseFloat(orderresult['GrandTotal']) + parseFloat(orderresult['TipAmount']);
//     grandTotalWithTip = grandTotalWithTip.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + grandTotalWithTip, { align: 'right' }, line2 + 32);

//     // Footer section
//     if (line2 + 165 < 690) {
//         doc.fill('black').fontSize(9).font('Helvetica').text("This is system generated. Does not require any signature.", 200, 700);
//     } else {
//         doc.fill('black').fontSize(9).font('Helvetica').text("This is system generated. Does not require any signature.", 200, line2 + 145);
//     }
// }

//NEWERCODE
// function ordersummary(doc, line2, orderresult, string, itemsqty, TotalGst) {
//     // Center the header text
//     doc.fill('black').fontSize(2).font('Helvetica').text(string, { align: 'center' }, line2 + 5);

//     // Adjust positioning for subtotal and below fields
//     doc.fill('black').fontSize(2).font('Helvetica').text('Sub Total', 5, line2 + 8);
//     doc.fill('black').fontSize(2).font('Helvetica').text(itemsqty, 60, line2 + 8); // Align qty on the right

//     doc.fill('black').fontSize(2).font('Helvetica').text(string, 2, line2 + 11);

//     // Labels for Discount, Delivery Charges, Wallet, Tip
//     doc.fill('black').fontSize(2).font('Helvetica').text('Discount', 5, line2 + 13);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Delivery charges', 5, line2 + 17);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Wallet', 5, line2 + 20);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Tip', 5, line2 + 23);

//     // Separate section divider
//     doc.fill('black').fontSize(2).font('Helvetica').text(string, 2, line2 + 26);

//     doc.fill('black').fontSize(2).font('Helvetica').text('Total', 5, line2 + 29);

//     // Convert to two decimal points format
//     finalsubtotal = orderresult['SubTotal'];
//     convfinalsubtotal = finalsubtotal.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     // Align values for subtotal, promo, delivery, wallet, and tip on the right
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + convfinalsubtotal, { align: 'right' }, line2 + 8);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['PromoAmount'], { align: 'right' }, line2 + 13);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['DeliverCharges'], { align: 'right' }, line2 + 17);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['WalletAmount'], { align: 'right' }, line2 + 20);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['TipAmount'], { align: 'right' }, line2 + 23);

//     // Adjust the grand total to include Tip
//     let grandTotalWithTip = parseFloat(orderresult['GrandTotal']) + parseFloat(orderresult['TipAmount']);
//     grandTotalWithTip = grandTotalWithTip.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     // Align grand total on the right
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + grandTotalWithTip, { align: 'right' }, line2 + 32);

//     // Footer section, adjust alignment based on page length
//     if (line2 + 165 < 690) {
//         doc.fill('black').fontSize(9).font('Helvetica').text("This is system generated. Does not require any signature.", { align: 'center' }, 700);
//     } else {
//         doc.fill('black').fontSize(9).font('Helvetica').text("This is system generated. Does not require any signature.", { align: 'center' }, line2 + 145);
//     }
// }

//NEWESTCODE

// function ordersummary(doc, line2, orderresult, string, itemsqty, TotalGst) {
//     // Center the main topic
//     const mainTopicX = (doc.page.width / 2) - (doc.widthOfString(string) / 2);
//     doc.fill('black').fontSize(2).font('Helvetica').text(string, mainTopicX, line2 + 5);

//     // Define positions for vertical alignment
//     const subTotalY = line2 + 8;
//     const discountY = line2 + 13;
//     const deliveryChargesY = line2 + 17;
//     const walletY = line2 + 20;
//     const tipY = line2 + 23;
//     const totalY = line2 + 29;

//     doc.fill('black').fontSize(2).font('Helvetica').text('Sub Total', 5, subTotalY);
//     doc.fill('black').fontSize(2).font('Helvetica').text(itemsqty, 50, subTotalY);

//     // Add other fields with vertical alignment
//     doc.fill('black').fontSize(2).font('Helvetica').text('Discount', 5, discountY);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Delivery charges', 5, deliveryChargesY);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Wallet', 5, walletY);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Tip', 5, tipY); 

//     doc.fill('black').fontSize(2).font('Helvetica').text(string, 2, line2 + 26);

//     doc.fill('black').fontSize(2).font('Helvetica').text('Total', 5, totalY);

//     // Convert to two decimal points format
//     finalsubtotal = orderresult['SubTotal'];
//     convfinalsubtotal = finalsubtotal.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     // Display respective amounts including Tip
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + convfinalsubtotal, { align: 'right' }, subTotalY);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['PromoAmount'], { align: 'right' }, discountY);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['DeliverCharges'], { align: 'right' }, deliveryChargesY);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['WalletAmount'], { align: 'right' }, walletY);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['TipAmount'], { align: 'right' }, tipY);  

//     // Adjust the grand total to include Tip
//     let grandTotalWithTip = parseFloat(orderresult['GrandTotal']) + parseFloat(orderresult['TipAmount']);
//     grandTotalWithTip = grandTotalWithTip.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + grandTotalWithTip, { align: 'right' }, totalY);

//     // Footer section
//     if (line2 + 165 < 690) {
//         doc.fill('black').fontSize(9).font('Helvetica').text("This is system generated. Does not require any signature.", 200, 700);
//     } else {
//         doc.fill('black').fontSize(9).font('Helvetica').text("This is system generated. Does not require any signature.", 200, line2 + 145);
//     }
// }

// function newpage_ordersummary(doc, orderresult, string, itemsqty, TotalGst) {
//     // Center the main topic
//     const mainTopicX = (doc.page.width / 2) - (doc.widthOfString(string) / 2);
//     doc.fill('black').fontSize(2).font('Helvetica').text(string, mainTopicX, 5);

//     // Define positions for vertical alignment
//     const subTotalY = 8;
//     const discountY = 14;
//     const deliveryChargesY = 17;
//     const walletY = 20;
//     const tipY = 23;
//     const totalY = 29;

//     doc.fill('black').fontSize(2).font('Helvetica').text('Sub Total', 5, subTotalY);
//     doc.fill('black').fontSize(2).font('Helvetica').text(itemsqty, 50, subTotalY);

//     doc.fill('black').fontSize(2).font('Helvetica').text('Discount', 5, discountY);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Delivery charges', 5, deliveryChargesY);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Wallet', 5, walletY);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Tip', 5, tipY);  

//     doc.fill('black').fontSize(2).font('Helvetica').text(string, 2, 26);
//     doc.fill('black').fontSize(2).font('Helvetica').text('Total', 5, totalY);

//     finalsubtotal = orderresult['subtotal'];
//     convfinalsubtotal = finalsubtotal.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + convfinalsubtotal.toString(), { align: 'right' }, subTotalY);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['PromoAmount'], { align: 'right' }, discountY);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['DeliverCharges'], { align: 'right' }, deliveryChargesY);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['WalletAmount'], { align: 'right' }, walletY);
//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + orderresult['TipAmount'], { align: 'right' }, tipY);  

//     let grandTotalWithTip = parseFloat(orderresult['GrandTotal']) + parseFloat(orderresult['TipAmount']);
//     grandTotalWithTip = grandTotalWithTip.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     doc.fill('black').fontSize(2).font('Helvetica').text("Rs. " + grandTotalWithTip.toString(), { align: 'right' }, totalY);

//     doc.fill('black').fontSize(2).font('Helvetica').text("Thank You.", 40, 200);
// }

// function invoiceproducts(doc, orderitems, line1) {
//     var TotalPrice = parseInt(orderitems['Quantity']) * parseInt(orderitems['OfferPrice']);
//     TotalPrice = TotalPrice.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     var convprice = orderitems['OfferPrice'].toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

//     // Remove quantity from the product name
//     doc.fill('black').fontSize(2).text(orderitems['ProductName'], 5, line1, { width: 43 });
//     doc.fill('black').fontSize(2).font('Helvetica').text(orderitems['Quantity'], 50, line1);
//     doc.fill('black').fontSize(2).font('Helvetica').text(convprice, 60, line1);
//     doc.fill('black').fontSize(2).font('Helvetica').text(TotalPrice, 70, line1);
// }

module.exports = ordercontroller
module.exports.consumePayment = consumePayment
