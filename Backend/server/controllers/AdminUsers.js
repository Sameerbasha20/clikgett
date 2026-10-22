const express = require('express');
const passwords = require('../utils/password');
const mysql = require('mysql');
const AWS = require('aws-sdk');
require('dotenv').config()
var fs = require('fs')
var moment = require('moment');
// const accesstoken=require("../controllers/utils")
const CommonController = require("../controllers/CommonController");
const pool = require('../utils/db');
const s3 = require('../utils/s3');

deliveryboy_s3 = "https://dm95er30b2f9h.cloudfront.net/deliveryboys/"

const users_s3 = "https://dm95er30b2f9h.cloudfront.net/Users/"

const usercontroller = {


    getdeliveryboys: async (req, resp, next) => {
        try {


            pool.query("select * from AdminUsers where Role=2 and Status!=0", (err, results) => {
                console.log('connecting')
                if (err) {

                    return resp.json({ "Status": 0, "Message": err.sqlMessage });
                }

                if (results.length > 0) {
                    for (var j = 0; j < results.length; j++) {
                        if (results[j].ProfilePic != "NA") {
                            results[j].ProfilePic = deliveryboy_s3 + results[j].ProfilePic
                        }
                    }
                    resp.json({ "Status": 1, "Deliveryboys": results })
                }
                else {
                    resp.json({ "Status": 1, "Deliveryboys": [] })
                }

            });




        }
        catch (e) {


            console.log(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },

    getactivedeliveryboys: async (req, resp, next) => {
        try {


            pool.query("select * from AdminUsers where Role=2 and Status=1", (err, results) => {
                console.log('connecting')
                if (err) {

                    return resp.json({ "Status": 0, "Message": err.sqlMessage });
                }

                if (results.length > 0) {
                    for (var j = 0; j < results.length; j++) {
                        if (results[j].ProfilePic != "NA") {
                            results[j].ProfilePic = deliveryboy_s3 + results[j].ProfilePic
                        }
                    }
                    resp.json({ "Status": 1, "Deliveryboys": results })
                }
                else {
                    resp.json({ "Status": 1, "Deliveryboys": [] })
                }

            });




        }
        catch (e) {


            console.log(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },

    deliveryboydetail: async (req, resp, next) => {
        try {


            pool.query("select * from AdminUsers where Role=2 and AdminID=?", [req.query.AdminID], (err, results) => {
                console.log('connecting')
                if (err) {

                    return resp.json({ "Status": 0, "Message": err.sqlMessage });
                }

                if (results.length > 0) {
                    for (var j = 0; j < results.length; j++) {
                        if (results[j].ProfilePic != "NA") {
                            results[j].ProfilePic = deliveryboy_s3 + results[j].ProfilePic
                        }
                    }
                    resp.json({ "Status": 1, "Deliveryboy": results[0] })
                }
                else {
                    resp.json({ "Status": 1, "Deliveryboy": [] })
                }

            });




        }
        catch (e) {


            console.log(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },

    adminlogin: async (req, resp, next) => {
        try {
            emaildata = await Verifyemail(req.body)
            if (emaildata == 0) {
                return resp.status(400).json({ "Status": 0, "Message": "Email doesnot exists" });
            }
            var userData = await Verifylogin(req.body)

            if (typeof (userData) === 'object') {
                req.userData = userData
                console.log(req.userData)
                next();

            }
            else if (userData == 2) {
                return resp.status(400).json({ "Status": 0, "Message": "Incorrect password" });
            }
            else {
                return resp.status(400).json({ "Status": 0, "Message": "Login failed" });
            }
        }
        catch (err) {
            console.log("exception in user login with MobileNumber ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in login with mobile number" });
        }
    },

    addeliveryboy: async (req, resp, next) => {
        try {

            body = req.body
            const keys = Object.keys(body);

            emaildata = await Verifyemail(req.body)
            if (emaildata == 1) {
                return resp.status(400).json({ "Status": 0, "Message": "Email already exists" });
            }

            column = ['EmailID', 'Password', 'FirstName']
            for (let val of column) {

                if (keys.includes(val) == false) {
                    return resp.json({ 'Status': 0, "Message": val + ' is a mandatory field' })
                }
            }
            if (body.LastName == null || body.LastName == undefined)
                body.LastName = 'NA'

            if (body.MobileNumber == null || body.MobileNumber == undefined)
                body.MobileNumber = "NA"



            let add_deliveryboy = { FirstName: body.FirstName, LastName: body.LastName, MobileNumber: body.MobileNumber, Role: 2, Status: 1, EmailID: body.EmailID, Password: body.Password ? passwords.hash(body.Password) : 'NA', ProfilePic: "NA" }

            let sql = "INSERT INTO AdminUsers set ?";

            pool.query(sql, add_deliveryboy, (err, results) => {
                if (err) console.log('db error', err.sqlMessage || err.message); results = results || { affectedRows: 0 };  // never crash on a failed query
                console.log('post method', results, err)
                if (results.affectedRows === 1) {

                    AdminID = results.insertId
                    if (body.ProfilePic != null || body.ProfilePic != undefined) {
                        convertimage(AdminID, body.ProfilePic)
                    }

                    return resp.status(200).json({ "Status": 1, "Message": "Deliveryboy Added successfully" });
                }
                else {
                    console.log("error in insert user to table ", results.affectedRows);
                    return resp.status(400).json({ "Status": 0, "Message": "error" });
                }
            })
        }
        catch (err) {
            console.log("exception in adding Product ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in adding Product" });
        }
    },

    adminupdatedeliveryboy: async (req, resp, next) => {
        try {
            Body = req.body

            deliveryboycheck = await getdeliveryboy(req.params.AdminID)
            if (deliveryboycheck == -1) { return resp.json({ "Status": 0, "Message": "Error in checking deliveryboy" }); }
            if (!deliveryboycheck || deliveryboycheck.length == 0) { return resp.json({ "Status": 0, "Message": "delivery boy not found" }); }

            if (Body.FirstName != null || Body.FirstName != undefined)
                FirstName = "FirstName=" + pool.escape(Body.FirstName) + ",";
            else
                FirstName = "FirstName = FirstName,";

            if (Body.LastName != null || Body.LastName != undefined)
                LastName = "LastName=" + pool.escape(Body.LastName) + ",";
            else
                LastName = "LastName = LastName,";




            if (Body.Status != null || Body.Status != undefined)
                Status = "Status=" + pool.escape(Body.Status) + "";
            else
                Status = "Status = Status";


            if (Body.EmailID != null || Body.EmailID != undefined) {
                console.log('here')
                emailexists = await checkemailid(Body.EmailID, req.params.AdminID)
                if (emailexists == 1) {
                    return resp.json({ "Status": 0, "Message": "Email already exists" })
                }
                EmailID = "EmailID=" + pool.escape(Body.EmailID) + "";
            }
            else {
                EmailID = "EmailID = EmailID";
            }



            queryString = "UPDATE AdminUsers SET " + FirstName + LastName + Status + " WHERE AdminID=" + pool.escape(req.params.AdminID) + ";";
            console.log(queryString)
            return new Promise(function (resolve, reject) {
                pool.query(queryString, function (err, result, fields) {
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
            console.log("exception in updating deliveryboy ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in updating deliveryboy" });
        }
    },

    admindeletedeliveryboy: async (req, resp, next) => {
        try {

            deliveryboycheck = await getdeliveryboy(req.params.AdminID)
            if (deliveryboycheck == -1) { return resp.json({ "Status": 0, "Message": "Error in checking deliveryboy" }); }
            if (deliveryboycheck.length == 0) { return resp.json({ "Status": 0, "Message": "delivery boy not found" }); }


            queryString = "update AdminUsers set Status=0 WHERE AdminID=" + pool.escape(req.params.AdminID) + ";";
            console.log(queryString)
            return new Promise(function (resolve, reject) {
                pool.query(queryString, function (err, result, fields) {
                    if (err) {
                        console.log("Error in updating the DB:" + err);
                        resp.json({ "Status": 0, "Message": "Error in updating the DB" });


                    }
                    else {
                        console.log("delete :" + result.affectedRows);
                        if (result.affectedRows > 0) {
                            console.log('delete successful')
                            resp.json({ "Status": 1, "Message": "Delivery boy deleted Successfully" });
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

    Userslist: async (req, resp, next) => {
        try {
            console.log(req.AdminID);
            pool.query("select * from Users where Status NOT IN (0,2) order by CreatedAt desc;", async (err, results) => {
                console.log('connecting')
                if (err) {
                    return resp.json({ "status": 0, "Message": err.sqlMessage });
                }

                if (results.length > 0) {
                    for (var j = 0; j < results.length; j++) {
                        if (results[j].ProfilePic != "NA") {
                            results[j].ProfilePic = users_s3 + results[j].ProfilePic
                        }
                    }
                    const url = await CommonController.generateCsv(results)
                    resp.json({ "status": 1, "Status": 1, "Users": results, url })
                }
                else {
                    resp.json({ "status": 1, "Status": 1, "Users": [] })
                }

            });

        }
        catch (e) {


            console.log(e)
            return resp.json({ "status": 0, "Message": 'error' })
        }
    },

    
    fullCustomerDetails: async (req, resp, next) => {
        try {
            const UserID = req.params.UserID;
            if (!UserID) return resp.status(400).json({ Status: 0, Message: "UserID is required" });

            // 1. Profile & Membership
            const userQuery = `
                SELECT u.*, 
                       um.PlanID, um.StartDate as MembershipStart, um.EndDate as MembershipEnd,
                       mp.PlanName, mp.FreeDelivery, mp.ExtraCashbackPercentage
                FROM Users u
                LEFT JOIN UserMemberships um ON u.UserID = um.UserID AND um.StartDate <= NOW() AND um.EndDate >= NOW()
                LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                WHERE u.UserID = ?
            `;
            const userRows = await new Promise(r => pool.query(userQuery, [UserID], (e, rows) => r(rows || [])));
            if (!userRows || userRows.length === 0) {
                return resp.status(404).json({ Status: 0, Message: "User not found" });
            }
            const profile = userRows[0];

            // 2. Saved Addresses
            const addressQuery = "SELECT * FROM Address WHERE UserID = ? ORDER BY CreatedAt DESC";
            const addresses = await new Promise(r => pool.query(addressQuery, [UserID], (e, rows) => r(rows || [])));

            // 3. Orders Breakdown & Summary
            const ordersQuery = `
                SELECT OrderID, LPAD(OrderID, 4, '0') as OrderSequence, SubTotal, GrandTotal, DeliverCharges, 
                       PaymentMethod, OrderStatus, ScheduleStatus, ScheduledDateTime, deliveredDateTime, CreatedAt
                FROM Orders 
                WHERE UserID = ? 
                ORDER BY CreatedAt DESC
            `;
            const orders = await new Promise(r => pool.query(ordersQuery, [UserID], (e, rows) => r(rows || [])));

            const orderStats = {
                Total: orders.length,
                Completed: orders.filter(o => o.OrderStatus === 1).length,
                Cancelled: orders.filter(o => o.OrderStatus === 4).length,
                Pending: orders.filter(o => [2, 5].includes(o.OrderStatus)).length,
                Scheduled: orders.filter(o => o.ScheduleStatus === 'Scheduled').length,
                TotalSpend: orders.filter(o => o.OrderStatus === 1).reduce((sum, o) => sum + parseFloat(o.GrandTotal || 0), 0)
            };

            // 4. Wallet Ledger with Derived Running Balance
            const walletQuery = "SELECT * FROM Wallets WHERE UserID = ? ORDER BY CreatedAt ASC";
            const rawWalletRows = await new Promise(r => pool.query(walletQuery, [UserID], (e, rows) => r(rows || [])));
            let runningBal = 0;
            const walletLedger = (rawWalletRows || []).map(tx => {
                const amt = parseFloat(tx.Amount || 0);
                if (tx.Credited_Debited === 1) {
                    runningBal += amt;
                } else {
                    runningBal -= amt;
                }
                return {
                    ...tx,
                    RunningBalance: parseFloat(runningBal.toFixed(2)),
                    Type: tx.Credited_Debited === 1 ? 'Credit' : 'Debit'
                };
            }).reverse(); // Most recent first

            // 5. Rewards & Milestones
            const rewardsQuery = `
                SELECT ur.*, r.RewardName, r.RewardType, r.TriggerType, r.TriggerValue, r.RewardValue, r.Description
                FROM UserRewards ur
                JOIN Rewards r ON ur.RewardID = r.RewardID
                WHERE ur.UserID = ?
                ORDER BY ur.CreatedAt DESC
            `;
            const userRewards = await new Promise(r => pool.query(rewardsQuery, [UserID], (e, rows) => r(rows || [])));

            // 6. Referral campaign info
            let referrerInfo = null;
            if (profile.ReferredBy) {
                const refRows = await new Promise(r => pool.query("SELECT UserID, FirstName, LastName, MobileNumber FROM Users WHERE MyReferralCode = ?", [profile.ReferredBy], (e, rows) => r(rows || [])));
                if (refRows.length > 0) referrerInfo = refRows[0];
            }
            const referredUsers = profile.MyReferralCode 
                ? await new Promise(r => pool.query("SELECT UserID, FirstName, LastName, MobileNumber, CreatedAt FROM Users WHERE ReferredBy = ?", [profile.MyReferralCode], (e, rows) => r(rows || [])))
                : [];

            // 7. Device & Activity signals
            const deviceInfo = {
                AppInstalled: !!profile.FCMToken && profile.FCMToken !== '',
                FCMTokenConfigured: !!profile.FCMToken,
                LastActive: profile.NotificationLastSeen || profile.UpdatedAt || profile.CreatedAt,
                RegisteredAt: profile.CreatedAt,
                Status: profile.Status === 1 ? 'Active' : 'Inactive',
                SignupCompleted: profile.SignupCompleted === 1
            };

            return resp.json({
                Status: 1,
                Profile: profile,
                Addresses: addresses,
                Orders: orders,
                OrderStats: orderStats,
                WalletBalance: parseFloat(profile.WalletAmount || 0),
                WalletLedger: walletLedger,
                Rewards: userRewards,
                Referrals: {
                    Referrer: referrerInfo,
                    ReferredUsers: referredUsers,
                    MyReferralCode: profile.MyReferralCode
                },
                DeviceInfo: deviceInfo
            });
        } catch (err) {
            console.error("Error in fullCustomerDetails:", err);
            return resp.status(500).json({ Status: 0, Message: "Server error fetching customer details" });
        }
    },

    Userdetail: async (req, resp, next) => {
        try {
            console.log(req.AdminID);
            pool.query("select * from Users where Status!=0 and UserID=?;", [req.params.UserID], (err, results) => {
                console.log('connecting')
                if (err) {
                    return resp.json({ "status": 0, "Message": err.sqlMessage });
                }

                if (results.length > 0) {
                    for (var j = 0; j < results.length; j++) {
                        if (results[j].ProfilePic != "NA") {
                            results[j].ProfilePic = users_s3 + results[j].ProfilePic
                        }
                    }
                    resp.json({ "status": 1, "Users": results[0] })
                }
                else {
                    resp.json({ "Status": 1, "Users": {} })
                }

            });

        }
        catch (e) {


            console.log(e)
            return resp.json({ "status": 0, "Message": 'error' })
        }
    },

    updateuser: async (req, resp, next) => {
        try {
            console.log(req.params.UserID, 'userid')
            UserID = req.params.UserID
            Body = req.body

            console.log(req.body, 'body')



            if (Body.Status != null || Body.Status != undefined)
                Status = "Status=" + pool.escape(Body.Status)
            else
                Status = "Status = Status";




            queryString = "UPDATE Users SET " + Status + " WHERE UserID=" + pool.escape(UserID) + ";";
            console.log(queryString)
            return new Promise(function (resolve, reject) {
                pool.query(queryString, function (err, result, fields) {
                    if (err) {
                        console.log("Error in updating the DB:" + err);
                        return resp.status(400).json({ "Status": 0, "Message": "Error in updating the DB" });


                    }
                    else {
                        console.log("update :" + result.affectedRows);
                        if (result.affectedRows > 0) {
                            console.log('update successful')
                            return resp.status(200).json({ "Status": 1, "Message": "User Update Successful" });
                        }
                        else {
                            console.log("user update failed", err, queryString);
                            return resp.status(200).json({ "Status": 0, "Message": "No changes to update" });

                        }

                    }
                });
            });
        }
        catch (err) {
            console.log("exception in updating user ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in updating user" });
        }
    },

    
    updateFeedbackReply: async (req, resp, next) => {
        try {
            const FeedbackID = req.params.FeedbackID || req.body.FeedbackID;
            const { AdminReply, Status, ReviewNotes } = req.body;
            const AdminID = req.AdminID || null;

            const updateSql = "UPDATE Feedback SET AdminReply = COALESCE(?, AdminReply), ReviewNotes = COALESCE(?, ReviewNotes), Status = COALESCE(?, Status), AdminID = COALESCE(?, AdminID), ReviewedAt = NOW(), UpdatedAt = NOW() WHERE FeedbackID = ?";
            pool.query(updateSql, [AdminReply || null, ReviewNotes || null, Status || null, AdminID, FeedbackID], (err, result) => {
                if (err) {
                    console.error("Error updating feedback reply:", err);
                    return resp.status(500).json({ Status: 0, Message: "Error updating feedback reply" });
                }
                return resp.json({ Status: 1, Message: "Feedback reply and status updated successfully" });
            });
        } catch (err) {
            console.error("Exception in updateFeedbackReply:", err);
            return resp.status(500).json({ Status: 0, Message: "Error updating feedback reply" });
        }
    },

    Feedbacklist: async (req, resp, next) => {
        try {
            const { status, rewardStatus, rating, search, startDate, endDate } = req.query;
            let conditions = [];
            let params = [];

            if (status && status !== 'all') {
                conditions.push("f.Status = ?");
                params.push(status);
            }
            if (rewardStatus && rewardStatus !== 'all') {
                conditions.push("f.RewardStatus = ?");
                params.push(rewardStatus);
            }
            if (rating && rating !== 'all') {
                conditions.push("f.Rating = ?");
                params.push(parseInt(rating, 10));
            }
            if (startDate) {
                conditions.push("f.CreatedAt >= ?");
                params.push(startDate);
            }
            if (endDate) {
                conditions.push("f.CreatedAt <= ?");
                params.push(endDate + " 23:59:59");
            }
            if (search && search.trim()) {
                const q = `%${search.trim()}%`;
                conditions.push("(CONCAT(u.FirstName, ' ', u.LastName) LIKE ? OR u.MobileNumber LIKE ? OR f.Message LIKE ? OR CAST(f.OrderID AS CHAR) LIKE ? OR CAST(f.FeedbackID AS CHAR) LIKE ?)");
                params.push(q, q, q, q, q);
            }

            let whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

            const sql = `
                SELECT f.*, 
                       COALESCE(CONCAT(u.FirstName, ' ', u.LastName), 'Customer') as UserName, 
                       u.MobileNumber as Mobile,
                       u.EmailID as Email,
                       o.GrandTotal as OrderTotal,
                       o.OrderStatus,
                       o.Delivered_Cancelled_datetime as DeliveredAt
                FROM Feedback f 
                LEFT JOIN Users u ON u.UserID = f.UserID 
                LEFT JOIN Orders o ON o.OrderID = f.OrderID
                ${whereClause}
                ORDER BY f.CreatedAt DESC
            `;

            pool.query(sql, params, (err, results) => {
                if (err) {
                    console.error("Feedbacklist SQL Error:", err);
                    return resp.json({ "status": 0, "Status": 0, "Message": err.sqlMessage });
                }
                const data = results || [];
                return resp.json({ "status": 1, "Status": 1, "Feedback": data, "data": data });
            });
        }
        catch (e) {
            console.error("Exception in Feedbacklist:", e);
            return resp.json({ "status": 0, "Status": 0, "Message": 'Error fetching feedback list' });
        }
    },

    Feedbackdetail: async (req, resp, next) => {
        try {
            const feedbackId = req.params.FeedbackID || req.params.id;
            const sql = `
                SELECT f.*, 
                       COALESCE(CONCAT(u.FirstName, ' ', u.LastName), 'Customer') as UserName, 
                       u.MobileNumber as Mobile,
                       u.EmailID as Email,
                       o.GrandTotal as OrderTotal,
                       o.OrderStatus,
                       o.Delivered_Cancelled_datetime as DeliveredAt,
                       o.PaymentMethod
                FROM Feedback f 
                LEFT JOIN Users u ON u.UserID = f.UserID 
                LEFT JOIN Orders o ON o.OrderID = f.OrderID
                WHERE f.FeedbackID = ?
            `;
            pool.query(sql, [feedbackId], async (err, results) => {
                if (err) {
                    console.error("Feedbackdetail SQL Error:", err);
                    return resp.json({ "status": 0, "Status": 0, "Message": err.sqlMessage });
                }
                const item = results && results.length > 0 ? results[0] : null;
                if (!item) {
                    return resp.status(404).json({ "status": 0, "Status": 0, "Message": "Feedback record not found" });
                }

                let walletTx = null;
                if (item.WalletTransactionID) {
                    try {
                        const txRows = await new Promise((resolve) => {
                            pool.query("SELECT * FROM Wallets WHERE WalletID = ?", [item.WalletTransactionID], (wErr, wRows) => {
                                resolve(wRows || []);
                            });
                        });
                        if (txRows.length > 0) walletTx = txRows[0];
                    } catch (txErr) {
                        console.error("Error fetching wallet transaction:", txErr);
                    }
                }

                return resp.json({ "status": 1, "Status": 1, "Feedback": item, "WalletTransaction": walletTx, "data": item });
            });
        }
        catch (e) {
            console.error("Exception in Feedbackdetail:", e);
            return resp.json({ "status": 0, "Status": 0, "Message": 'Error fetching feedback detail' });
        }
    },

    reviewFeedback: async (req, resp, next) => {
        try {
            const FeedbackID = req.params.FeedbackID || req.body.FeedbackID;
            const { status, reviewNotes, adminReply, rejectionReason } = req.body;
            const AdminID = req.AdminID || null;

            if (!FeedbackID) {
                return resp.status(400).json({ status: 0, Status: 0, Message: "FeedbackID is required" });
            }

            const validStatuses = ['approved', 'rejected', 'pending'];
            const targetStatus = (status && validStatuses.includes(status.toLowerCase())) ? status.toLowerCase() : 'approved';
            const notes = reviewNotes || rejectionReason || null;

            const feedbackRows = await new Promise((resolve, reject) => {
                pool.query("SELECT * FROM Feedback WHERE FeedbackID = ?", [FeedbackID], (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                });
            });

            if (!feedbackRows || feedbackRows.length === 0) {
                return resp.status(404).json({ status: 0, Status: 0, Message: "Feedback not found" });
            }

            const fb = feedbackRows[0];
            let newRewardStatus = fb.RewardStatus;
            if (targetStatus === 'rejected' && fb.RewardStatus !== 'credited') {
                newRewardStatus = 'rejected';
            } else if (targetStatus === 'approved' && fb.RewardStatus === 'rejected') {
                newRewardStatus = 'pending';
            }

            const updateSql = `
                UPDATE Feedback 
                SET Status = ?,
                    AdminID = COALESCE(?, AdminID),
                    ReviewedAt = NOW(),
                    ReviewNotes = COALESCE(?, ReviewNotes),
                    AdminReply = COALESCE(?, AdminReply),
                    RewardStatus = ?,
                    UpdatedAt = NOW()
                WHERE FeedbackID = ?
            `;

            await new Promise((resolve, reject) => {
                pool.query(updateSql, [targetStatus, AdminID, notes, adminReply || null, newRewardStatus, FeedbackID], (err, res) => {
                    if (err) return reject(err);
                    resolve(res);
                });
            });

            return resp.json({
                status: 1,
                Status: 1,
                Message: `Feedback marked as ${targetStatus} successfully`,
                FeedbackID: FeedbackID,
                ReviewStatus: targetStatus,
                RewardStatus: newRewardStatus
            });
        } catch (err) {
            console.error("Error reviewing feedback:", err);
            return resp.status(500).json({ status: 0, Status: 0, Message: "Error reviewing feedback" });
        }
    },

    creditFeedbackReward: async (req, resp, next) => {
        let connection;
        try {
            const FeedbackID = req.params.FeedbackID || req.body.FeedbackID;
            const AdminID = req.AdminID || null;
            const { overrideAmount } = req.body;

            if (!FeedbackID) {
                return resp.status(400).json({ status: 0, Status: 0, Message: "FeedbackID is required" });
            }

            // Fetch feedback
            const feedbackRows = await new Promise((resolve, reject) => {
                pool.query("SELECT * FROM Feedback WHERE FeedbackID = ?", [FeedbackID], (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                });
            });

            if (!feedbackRows || feedbackRows.length === 0) {
                return resp.status(404).json({ status: 0, Status: 0, Message: "Feedback not found" });
            }

            const item = feedbackRows[0];

            // Security & Idempotency Safeguards:
            if (item.RewardStatus === 'credited' || item.WalletTransactionID) {
                return resp.status(400).json({
                    status: 0,
                    Status: 0,
                    Message: `Cashback reward has already been credited for this feedback (Transaction #${item.WalletTransactionID || 'recorded'}).`,
                    alreadyCredited: true,
                    WalletTransactionID: item.WalletTransactionID
                });
            }

            if (item.Status === 'rejected') {
                return resp.status(400).json({
                    status: 0,
                    Status: 0,
                    Message: "Cannot credit cashback for rejected feedback. Please approve feedback first if eligible."
                });
            }

            // Check reward amount
            let amount = overrideAmount !== undefined ? parseFloat(overrideAmount) : parseFloat(item.RewardAmount);
            if (isNaN(amount) || amount <= 0) {
                // Fallback: check current configured reward amount
                const settingRows = await new Promise((resolve) => {
                    pool.query("SELECT SettingValue FROM Settings WHERE SettingKey = 'FeedbackRewardAmount'", (err, rows) => {
                        resolve(rows || []);
                    });
                });
                if (settingRows && settingRows.length > 0) {
                    amount = parseFloat(settingRows[0].SettingValue);
                }
            }

            if (isNaN(amount) || amount <= 0) {
                return resp.status(400).json({
                    status: 0,
                    Status: 0,
                    Message: "Reward amount must be a positive number greater than 0"
                });
            }

            // Additional ledger idempotency check: check if a wallet credit already exists for this order & feedback
            const existingWalletTx = await new Promise((resolve, reject) => {
                pool.query(
                    "SELECT WalletID FROM Wallets WHERE UserID = ? AND ContentType = 4 AND ContentID = ? AND Description LIKE ?",
                    [item.UserID, item.OrderID, `%Feedback #${item.FeedbackID}%`],
                    (err, rows) => {
                        if (err) return reject(err);
                        resolve(rows || []);
                    }
                );
            });

            if (existingWalletTx.length > 0) {
                const existingTxId = existingWalletTx[0].WalletID;
                await new Promise((resolve) => {
                    pool.query(
                        "UPDATE Feedback SET RewardStatus = 'credited', WalletTransactionID = ? WHERE FeedbackID = ?",
                        [existingTxId, FeedbackID],
                        () => resolve()
                    );
                });
                return resp.status(400).json({
                    status: 0,
                    Status: 0,
                    Message: `Duplicate wallet credit prevented. Transaction #${existingTxId} already exists in ledger.`,
                    WalletTransactionID: existingTxId
                });
            }

            // Database Transaction for Atomic Crediting
            connection = await new Promise((resolve, reject) => {
                pool.getConnection((err, conn) => {
                    if (err) return reject(err);
                    resolve(conn);
                });
            });

            await new Promise((resolve, reject) => {
                connection.beginTransaction(err => {
                    if (err) return reject(err);
                    resolve();
                });
            });

            // Re-check row lock
            const lockedRow = await new Promise((resolve, reject) => {
                connection.query("SELECT FeedbackID, RewardStatus, WalletTransactionID FROM Feedback WHERE FeedbackID = ? FOR UPDATE", [FeedbackID], (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                });
            });

            if (!lockedRow.length || lockedRow[0].RewardStatus === 'credited' || lockedRow[0].WalletTransactionID) {
                await new Promise(r => connection.rollback(r));
                connection.release();
                return resp.status(400).json({ status: 0, Status: 0, Message: "Reward already credited concurrently." });
            }

            // Feedback cashback is once per customer. Locking the customer row serialises
            // credits for their other feedback, so two can't both pass this check.
            const earlierReward = await new Promise((resolve, reject) => {
                connection.query("SELECT UserID FROM Users WHERE UserID = ? FOR UPDATE", [item.UserID], (lockErr) => {
                    if (lockErr) return reject(lockErr);
                    connection.query(
                        "SELECT FeedbackID, OrderID FROM Feedback WHERE UserID = ? AND RewardStatus = 'credited' AND FeedbackID <> ? LIMIT 1",
                        [item.UserID, FeedbackID],
                        (err, rows) => (err ? reject(err) : resolve(rows && rows[0]))
                    );
                });
            });

            if (earlierReward) {
                await new Promise((resolve, reject) => {
                    connection.query(
                        "UPDATE Feedback SET RewardStatus = 'not_eligible', UpdatedAt = NOW() WHERE FeedbackID = ?",
                        [FeedbackID],
                        (err) => (err ? reject(err) : resolve())
                    );
                });
                await new Promise((resolve, reject) => connection.commit((err) => (err ? reject(err) : resolve())));
                connection.release();
                connection = null;
                return resp.status(400).json({
                    status: 0,
                    Status: 0,
                    Message: `This customer already received feedback cashback (Feedback #${earlierReward.FeedbackID}, Order #${earlierReward.OrderID}). Feedback cashback is given only once per customer.`,
                    alreadyRewarded: true,
                    RewardStatus: 'not_eligible'
                });
            }

            // 1. Insert into Wallets ledger (ContentType 4 = Cashback, Credited_Debited 1 = Credit)
            const expiryDays = 30;
            const desc = `Feedback reward for Order #${item.OrderID} (Feedback #${item.FeedbackID})`;
            const insertWalletSql = `
                INSERT INTO Wallets (UserID, Amount, Credited_Debited, ContentType, ContentID, Description, ExpiryDate, IsExpired, CreatedAt)
                VALUES (?, ?, 1, 4, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), 0, NOW())
            `;
            const walletInsertRes = await new Promise((resolve, reject) => {
                connection.query(insertWalletSql, [item.UserID, amount, item.OrderID, desc, expiryDays], (err, res) => {
                    if (err) return reject(err);
                    resolve(res);
                });
            });
            const walletTxId = walletInsertRes.insertId;

            // 2. Increment Users.WalletAmount
            await new Promise((resolve, reject) => {
                connection.query("UPDATE Users SET WalletAmount = COALESCE(WalletAmount, 0) + ? WHERE UserID = ?", [amount, item.UserID], (err, res) => {
                    if (err) return reject(err);
                    resolve(res);
                });
            });

            // 3. Update Feedback table
            const updateFeedbackSql = `
                UPDATE Feedback 
                SET Status = 'approved',
                    RewardStatus = 'credited',
                    RewardAmount = ?,
                    WalletTransactionID = ?,
                    AdminID = COALESCE(?, AdminID),
                    ReviewedAt = NOW(),
                    UpdatedAt = NOW()
                WHERE FeedbackID = ?
            `;
            await new Promise((resolve, reject) => {
                connection.query(updateFeedbackSql, [amount, walletTxId, AdminID, FeedbackID], (err, res) => {
                    if (err) return reject(err);
                    resolve(res);
                });
            });

            // Commit transaction
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject(err);
                    resolve();
                });
            });
            connection.release();
            connection = null;

            // 4. Send customer notification
            try {
                const note = {
                    Title: "Feedback Cashback Credited!",
                    Message: `Congratulations! ₹${amount.toFixed(2)} cashback has been credited to your ClikGett wallet for your review of Order #${item.OrderID}.`
                };
                await CommonController.Send_Notification(note, item.UserID);
            } catch (notiErr) {
                console.error("Error sending cashback notification:", notiErr);
            }

            return resp.json({
                status: 1,
                Status: 1,
                Message: `Successfully credited ₹${amount.toFixed(2)} cashback to user wallet`,
                WalletTransactionID: walletTxId,
                RewardAmount: amount,
                RewardStatus: 'credited'
            });
        } catch (err) {
            console.error("Error in creditFeedbackReward:", err);
            if (connection) {
                try { await new Promise(r => connection.rollback(r)); connection.release(); } catch (e) {}
            }
            return resp.status(500).json({ status: 0, Status: 0, Message: "Error processing cashback credit" });
        }
    },

    getFeedbackRewardConfig: async (req, resp, next) => {
        try {
            const settingRows = await new Promise((resolve, reject) => {
                pool.query("SELECT SettingKey, SettingValue FROM Settings WHERE SettingKey IN ('FeedbackRewardAmount', 'FeedbackRewardEnabled')", (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                });
            });
            let amount = 20.00;
            let enabled = true;
            for (const s of settingRows) {
                if (s.SettingKey === 'FeedbackRewardAmount') {
                    const v = parseFloat(s.SettingValue);
                    if (!isNaN(v)) amount = v;
                }
                if (s.SettingKey === 'FeedbackRewardEnabled') {
                    enabled = (s.SettingValue === '1' || s.SettingValue === 'true');
                }
            }
            return resp.json({
                status: 1,
                Status: 1,
                rewardAmount: amount,
                rewardEnabled: enabled
            });
        } catch (err) {
            console.error("Error fetching feedback reward config:", err);
            return resp.status(500).json({ status: 0, Status: 0, Message: "Error fetching feedback reward config" });
        }
    },

    updateFeedbackRewardConfig: async (req, resp, next) => {
        try {
            const { rewardAmount, rewardEnabled } = req.body;
            if (rewardAmount !== undefined) {
                const amt = parseFloat(rewardAmount);
                if (isNaN(amt) || amt < 0 || amt > 1000) {
                    return resp.status(400).json({ status: 0, Status: 0, Message: "Reward amount must be between ₹0 and ₹1,000" });
                }
                await new Promise((resolve, reject) => {
                    pool.query(
                        "INSERT INTO Settings (SettingKey, SettingValue) VALUES ('FeedbackRewardAmount', ?) ON DUPLICATE KEY UPDATE SettingValue = ?",
                        [amt.toFixed(2), amt.toFixed(2)],
                        (err, res) => {
                            if (err) return reject(err);
                            resolve(res);
                        }
                    );
                });
            }
            if (rewardEnabled !== undefined) {
                const en = (rewardEnabled === true || rewardEnabled === '1' || rewardEnabled === 1) ? '1' : '0';
                await new Promise((resolve, reject) => {
                    pool.query(
                        "INSERT INTO Settings (SettingKey, SettingValue) VALUES ('FeedbackRewardEnabled', ?) ON DUPLICATE KEY UPDATE SettingValue = ?",
                        [en, en],
                        (err, res) => {
                            if (err) return reject(err);
                            resolve(res);
                        }
                    );
                });
            }
            return resp.json({
                status: 1,
                Status: 1,
                Message: "Feedback reward configuration updated successfully"
            });
        } catch (err) {
            console.error("Error updating feedback reward config:", err);
            return resp.status(500).json({ status: 0, Status: 0, Message: "Error updating feedback reward config" });
        }
    },

    adminnotification: async (req, resp, next) => {
        try {


            results = await getusers()
            console.log(results, 'results')
            resp.json({ "status": 1, "Message": "Notification send successfully" });
            for (let iterator of results) {
                addnoti = await CommonController.Send_Notification(req.body, iterator['UserID'], 'admin')
                console.log(addnoti)
                // await sendnotifications(body,results[0]['FCMToken'])
            }

            // return resp.json({ "status": 1, "Message": "Notification send successfully" });

        }
        catch (err) {
            console.log("exception in adding notifications ", err);
            return resp.status(500).json({ "status": 0, "Message": "Error in adding notifications" });
        }
    },

    settingslist: async (req, resp, next) => {
        try {
            console.log(req.AdminID);
            pool.query("SELECT * FROM Settings", (err, results) => {
                console.log('connecting')
                if (err) {
                    return resp.json({ "status": 0, "Message": err.sqlMessage });
                }

                if (results.length > 0) {
                    resp.json({ "status": 1, "Settings": results })
                }
                else {
                    resp.json({ "Status": 1, "Settings": [] })
                }

            });

        }
        catch (e) {


            console.log(e)
            return resp.json({ "status": 0, "Message": 'error' })
        }
    },

    settingsdetail: async (req, resp, next) => {
        try {
            console.log(req.AdminID);
            pool.query("SELECT * FROM Settings where ID=?", [req.params.ID], (err, results) => {
                console.log('connecting')
                if (err) {
                    return resp.json({ "status": 0, "Message": err.sqlMessage });
                }

                if (results.length > 0) {

                    resp.json({ "status": 1, "Settings": results[0] })
                }
                else {
                    resp.json({ "Status": 1, "Settings": {} })
                }

            });

        }
        catch (e) {

            console.log(e)
            return resp.json({ "status": 0, "Message": 'error' })
        }
    },

    addsettings: async (req, resp, next) => {
        try {

            settingsresult = await Createsettings(req.body)
            if (settingsresult != 1) {
                return resp.json({ "Status": 0, "Message": "error in adding settings" });
            }

            return resp.status(200).json({ "Status": 1, "Message": "Settings added successfully" });

        }
        catch (err) {
            console.log("exception in adding settings ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in adding settings" });
        }
    },

    updatesettings: async (req, resp, next) => {
        try {
            Body = req.body
            // Keys are fixed (the apps read them by name); only values change here.
            delete Body.SettingKey;
            const [current] = await CommonController.commonget("SELECT SettingKey FROM Settings WHERE ID = ?", [req.params.ID]);
            const listKeys = ['TipPresets', 'WalletTopupAmounts', 'FAQs', 'DeliveryTypes'];
            const numberKeys = ['MinOrderValue', 'FreeDelivery_CartAmount', 'DeliveryCharges', 'ReferAmount', 'Refferal_SignupBonus',
                'Referral_firstorderBonus', 'MinUseOfWallet', 'Minordervalue_wallet', 'FeedbackRewardAmount'];
            if (current && Body.SettingValue != null) {
                if (listKeys.includes(current.SettingKey)) {
                    try {
                        if (!Array.isArray(JSON.parse(Body.SettingValue))) throw new Error('not a list');
                    } catch (e) {
                        return resp.json({ "status": 0, "Status": 0, "Message": `${current.SettingKey} must be a JSON list, e.g. [10,20,30]` });
                    }
                }
                if (numberKeys.includes(current.SettingKey) && !(parseFloat(Body.SettingValue) >= 0)) {
                    return resp.json({ "status": 0, "Status": 0, "Message": `${current.SettingKey} must be a number` });
                }
            }


            if (Body.SettingKey != null || Body.SettingKey != undefined)
                SettingKey = "SettingKey=" + pool.escape(Body.SettingKey) + ",";
            else
                SettingKey = "SettingKey = SettingKey,";

            if (Body.SettingValue != null || Body.SettingValue != undefined)
                SettingValue = "SettingValue=" + pool.escape(Body.SettingValue) + "";
            else
                SettingValue = "SettingValue = SettingValue";



            queryString = "UPDATE Settings SET " + SettingKey + SettingValue + " WHERE ID=" + pool.escape(req.params.ID) + ";";
            console.log(queryString)
            return new Promise(function (resolve, reject) {
                pool.query(queryString, function (err, result, fields) {
                    if (err) {

                        resp.json({ "status": 0, "Message": "Error in updating the DB" });
                        console.log("Error in updating the DB:" + err);

                    }
                    else {
                        console.log("update :" + result.affectedRows);
                        if (result.affectedRows > 0) {
                            console.log('update successful')
                            resp.json({ "status": 1, "Message": "Setting Update Successful" });
                        }
                        else {
                            console.log("Setting update failed", err, queryString);
                            resp.json({ "status": 0, "Message": "No changes to update" });

                        }

                    }
                });
            });
        }
        catch (err) {
            console.log("exception in updating Setting ", err);
            return resp.status(500).json({ "status": 0, "Message": "Error in updating Setting" });
        }
    },

    deletesetting: async (req, resp, next) => {
        try {



            pool.query(`delete from Settings where ID=?`, [req.params.ID], (err, results) => {
                console.log('connecting')
                if (err) {
                    return resp.json({ "status": 0, "Message": err.sqlMessage });
                }
                if (results.affectedRows === 1) {

                    resp.json({ "status": 1, "Message": "Setting deleted Successfully" })
                }
                else { resp.json({ "status": 0, "Message": "Error in deleting Setting" }) }


            });
        }
        catch (err) {
            console.log("exception in deleting Setting ", err);
            return resp.status(500).json({ "status": 0, "Message": "Error in deleting Setting" });
        }
    },

    Settings: async (req, resp, next) => {
        try {
            console.log(req.AdminID);
            pool.query("SELECT * from Settings;", (err, results) => {
                console.log('connecting')
                if (err) {
                    return resp.json({ "status": 0, "Message": err.sqlMessage });
                }

                if (results.length > 0) {

                    resp.json({ "status": 1, "Settings": results })
                }
                else {
                    resp.json({ "Status": 1, "Settings": [] })
                }

            });

        }
        catch (e) {


            console.log(e)
            return resp.json({ "status": 0, "Message": 'error' })
        }
    },

    walletTransactions: async (req, resp, next) => {
        try {
            const { params: { UserID } } = req
            const getQuery = `select * from Wallets where UserID=${pool.escape(UserID)}`
            const walletTransactions = await CommonController.getWalletTransactions(getQuery)
            resp.status(200).json({ Status: 1, walletTransactions: walletTransactions })
        }
        catch (e) {


            console.log(e)
            return resp.json({ "status": 0, "Message": 'error' })
        }
    },

    creditDebitWallet: async (req, resp, next) => {
        try {
            const { body: { type, amount, UserID, Description } } = req
            if (!UserID) return resp.json({ "status": 0, "Message": 'Please select valid user' });
            const walletAmount = parseFloat(amount);
            if (!amount || !Number.isFinite(walletAmount) || walletAmount <= 0) return resp.json({ "status": 0, "Message": 'Please enter valid amount' });
            if (!type) return resp.json({ "status": 0, "Message": 'Please select payment type' });
            if (!Description) return resp.json({ "status": 0, "Message": 'Please enter description' });
            let updateQuery
            let Message
            let addWalletTransaction = {};
            let referredUserNotification = {};
            let userDetailsQuery = `select UserID,WalletAmount from Users where UserID=${pool.escape(UserID)} and Status=1`
            let userDetails = (await CommonController.commonget(userDetailsQuery))[0];
            if (type == 1) {
                updateQuery = `update Users set WalletAmount=WalletAmount+${pool.escape(walletAmount)} where UserID=${pool.escape(UserID)}`
                Message = `Amount added to wallet`;
                addWalletTransaction = {
                    UserID: UserID,
                    Amount: amount,
                    Credited_Debited: 1,
                    Description: Description || 'NA',
                    contentType: 1,
                    ContentID: UserID
                }
                referredUserNotification = {
                    Title: `ClikGett Cash Credited`,
                    Message: "Cash credited from ClikGett"
                }


            } else {

                if (userDetails.WalletAmount < 0 || amount > userDetails.WalletAmount) {
                    console.log("User Wallet Amount is less than amount to be debited");
                    return resp.status(500).json({ "status": 0, "Message": 'User Wallet Amount is less than amount to be debited' });
                }
                updateQuery = `update Users set WalletAmount=WalletAmount-${pool.escape(walletAmount)} where UserID=${pool.escape(UserID)}`
                Message = `Amount debited from wallet`;
                addWalletTransaction = {
                    UserID: UserID,
                    Amount: amount,
                    Credited_Debited: 2,
                    Description: Description || 'NA',
                    contentType: 1,
                    ContentID: UserID
                }
                referredUserNotification = {
                    Title: `ClikGett Cash Debited`,
                    Message: "Cash debited from ClikGett"
                }
            }
            await CommonController.send_push_notifications(referredUserNotification, UserID);
            let sql = "INSERT INTO Wallets  set ?";

            pool.query(sql, addWalletTransaction, (err, results) => {
                if (err) console.log('db error', err.sqlMessage || err.message); results = results || { affectedRows: 0 };  // never crash on a failed query
                console.log('error in adding Wallets ', err, results)
                if (results.affectedRows === 1) {
                    console.log(results.insertId)
                }
                else {
                    console.log("error in adding Walletss", err);
                }
            })
            await CommonController.updateWalletAmount(updateQuery);
            resp.status(200).json({ Status: 1, Message: Message })
        }
        catch (e) {
            console.log(e)
            return resp.json({ "status": 0, "Message": 'error' })
        }
    },

    creditDebitWallet_old: async (req, resp, next) => {
        try {
            const { body: { type, amount, UserID } } = req
            if (!UserID) return resp.json({ "status": 0, "Message": 'Please select valid user' })
            const walletAmount = parseFloat(amount);
            if (!amount || !Number.isFinite(walletAmount) || walletAmount <= 0) return resp.json({ "status": 0, "Message": 'Please enter valid amount' })
            if (!type) return resp.json({ "status": 0, "Message": 'Please select payment type' })
            let updateQuery
            let Message
            if (type == 1) {
                updateQuery = `update Users set WalletAmount=WalletAmount+${pool.escape(walletAmount)} where UserID=${pool.escape(UserID)}`
                Message = `Amount added to wallet`
            } else {
                updateQuery = `update Users set WalletAmount=WalletAmount-${pool.escape(walletAmount)} where UserID=${pool.escape(UserID)}`
                Message = `Amount debited from wallet`
            }

            await CommonController.updateWalletAmount(updateQuery)
            resp.status(200).json({ Status: 1, Message: Message })

        }
        catch (e) {


            console.log(e)
            return resp.json({ "status": 0, "Message": 'error' })
        }

    },

    adminuserslist: async (req, resp, next) => {
        try {
            pool.query("SELECT AdminID, AdminID AS adminUserId, FirstName AS firstName, LastName AS lastName, EmailID AS emailId, Role AS role, Status AS status, ProfilePic AS profilePic, NULL AS warehouseId FROM AdminUsers WHERE Role!=2 AND Status!=0 ORDER BY CreatedAt DESC;", (err, results) => {
                if (err) {
                    return resp.json({ "Status": 0, "Message": err.sqlMessage });
                }
                if (results && results.length > 0) {
                    for (var j = 0; j < results.length; j++) {
                        if (results[j].profilePic && results[j].profilePic !== "NA" && !results[j].profilePic.startsWith("http")) {
                            results[j].profilePic = deliveryboy_s3 + results[j].profilePic;
                        }
                    }
                }
                resp.json({ "Status": 1, "adminUsers": results || [] });
            });
        } catch (e) {
            console.log(e);
            return resp.json({ "Status": 0, "Message": 'error' });
        }
    },

    addadminuser: async (req, resp, next) => {
        try {
            const body = req.body;
            const firstName = body.firstName || body.FirstName;
            const emailId = body.emailId || body.EmailID;
            const password = body.password || body.Password;
            const role = body.role !== undefined ? body.role : 1;
            const warehouseId = body.warehouseId || body.WarehouseID || null;

            if (!firstName || !emailId || !password) {
                return resp.json({ 'Status': 0, "Message": "Name, Email and Password are required" });
            }
            if (String(password).length < 8) {
                return resp.json({ 'Status': 0, "Message": "Password must be at least 8 characters" });
            }

            const emaildata = await Verifyemail({ EmailID: emailId });
            if (emaildata === 1) {
                return resp.status(400).json({ "Status": 0, "Message": "Email already exists" });
            }

            const add_admin = {
                FirstName: firstName,
                LastName: body.lastName || body.LastName || 'NA',
                EmailID: emailId,
                Password: passwords.hash(password),
                Role: 1, // this endpoint creates admins only (riders are added from the Riders page)
                Status: 1,
                ProfilePic: "NA"
            };

            const sql = "INSERT INTO AdminUsers SET ?";
            pool.query(sql, add_admin, (err, results) => {
                if (err) {
                    console.log("error adding admin user", err);
                    return resp.status(400).json({ "Status": 0, "Message": err.sqlMessage });
                }
                if (results.affectedRows === 1) {
                    const AdminID = results.insertId;
                    if (body.profilePic || body.ProfilePic) {
                        convertimage(AdminID, body.profilePic || body.ProfilePic);
                    }
                    return resp.status(200).json({ "Status": 1, "Message": "Admin user added successfully" });
                } else {
                    return resp.status(400).json({ "Status": 0, "Message": "error" });
                }
            });
        } catch (err) {
            console.log("exception in adding admin user", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in adding admin user" });
        }
    },

    adminuserdetail: async (req, resp, next) => {
        try {
            const AdminID = req.params.AdminID || req.params.id || req.query.AdminID;
            pool.query("SELECT AdminID, AdminID AS adminUserId, FirstName AS firstName, LastName AS lastName, EmailID AS emailId, Role AS role, Status AS status, ProfilePic AS profilePic, NULL AS warehouseId FROM AdminUsers WHERE AdminID=?;", [AdminID], (err, results) => {
                if (err) {
                    return resp.json({ "Status": 0, "Message": err.sqlMessage });
                }
                if (results && results.length > 0) {
                    if (results[0].profilePic && results[0].profilePic !== "NA" && !results[0].profilePic.startsWith("http")) {
                        results[0].profilePic = deliveryboy_s3 + results[0].profilePic;
                    }
                    resp.json({ "Status": 1, "adminUsers": results[0] });
                } else {
                    resp.json({ "Status": 1, "adminUsers": {} });
                }
            });
        } catch (e) {
            console.log(e);
            return resp.json({ "Status": 0, "Message": 'error' });
        }
    },

    updateadmindata: async (req, resp, next) => {
        try {
            const AdminID = req.params.AdminID || req.params.id;
            const Body = req.body;
            let updates = [];
            let params = [];

            if (Body.firstName || Body.FirstName) {
                updates.push("FirstName = ?");
                params.push(Body.firstName || Body.FirstName);
            }
            if (Body.lastName || Body.LastName) {
                updates.push("LastName = ?");
                params.push(Body.lastName || Body.LastName);
            }
            if (Body.emailId || Body.EmailID) {
                const email = Body.emailId || Body.EmailID;
                const emailexists = await checkemailid(email, AdminID);
                if (emailexists === 1) {
                    return resp.json({ "Status": 0, "Message": "Email already exists" });
                }
                updates.push("EmailID = ?");
                params.push(email);
            }
            if (Body.status !== undefined) {
                updates.push("Status = ?");
                params.push(Body.status);
            }
            if (Body.password && Body.password !== "**********") {
                if (String(Body.password).length < 8) {
                    return resp.json({ "Status": 0, "Message": "Password must be at least 8 characters" });
                }
                updates.push("Password = ?");
                params.push(passwords.hash(Body.password));
            }

            if (updates.length === 0) {
                return resp.json({ "Status": 1, "Message": "No changes to update" });
            }

            params.push(AdminID);
            const query = "UPDATE AdminUsers SET " + updates.join(", ") + " WHERE AdminID = ?";
            pool.query(query, params, (err, result) => {
                if (err) {
                    console.log("Error updating admin user:", err);
                    return resp.json({ "Status": 0, "Message": "Error in updating the DB" });
                }
                if (Body.profilePic && Body.profilePic.length > 50) {
                    convertimage(AdminID, Body.profilePic);
                }
                return resp.json({ "Status": 1, "Message": "Admin User Updated Successfully" });
            });
        } catch (err) {
            console.log("exception in updating admin user", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in updating admin user" });
        }
    },

    deleteadmindata: async (req, resp, next) => {
        try {
            const AdminID = req.params.AdminID || req.params.id;
            if (String(AdminID) === String(req.AdminID)) {
                return resp.json({ "Status": 0, "Message": "You cannot remove your own account" });
            }
            const query = "UPDATE AdminUsers SET Status=0 WHERE AdminID = ? AND Role = 1";
            pool.query(query, [AdminID], (err, result) => {
                if (err) {
                    console.log("Error deleting admin user:", err);
                    return resp.json({ "Status": 0, "Message": "Error in updating the DB" });
                }
                if (!result.affectedRows) return resp.json({ "Status": 0, "Message": "Admin user not found" });
                return resp.json({ "Status": 1, "Message": "Admin user removed" });
            });
        } catch (err) {
            console.log("exception in deleting admin user", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in deleting admin user" });
        }
    },

    deleteUser: async (req, resp, next) => {
        try {
            const UserID = req.params.UserID || req.params.id;
            const query = "UPDATE Users SET Status=0 WHERE UserID = ?";
            pool.query(query, [UserID], (err, result) => {
                if (err) {
                    console.log("Error deleting user:", err);
                    return resp.json({ "Status": 0, "Message": "Error in updating the DB" });
                }
                return resp.json({ "Status": 1, "Message": "User Deleted Successfully" });
            });
        } catch (err) {
            console.log("exception in deleting user", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in deleting user" });
        }
    },


    notifyproducts: async (req, resp, next) => {
        try {
            const sql = `
                SELECT np.*, p.ProductName, pv.metrictype, pv.metricvalue, 
                       u.FirstName, u.LastName, u.MobileNumber as UserMobile
                FROM NotifyProducts np 
                LEFT JOIN Products p ON np.ProductID = p.ProductID 
                LEFT JOIN ProductVariants pv ON np.VariantID = pv.VariantID 
                LEFT JOIN Users u ON np.UserID = u.UserID 
                ORDER BY np.CreatedAt DESC
            `;
            pool.query(sql, (err, results) => {
                if (err) {
                    console.error("Error fetching notify products:", err);
                    return resp.json({ "Status": 1, "Products": [] });
                }
                resp.json({ "Status": 1, "Products": results || [] });
            });
        } catch (e) {
            console.error("Exception in notifyproducts:", e);
            return resp.json({ "Status": 1, "Products": [] });
        }
    },

    notifyproductupdate: async (req, resp, next) => {
        try {
            const id = req.params.id || req.params.ID || req.body.NotifyID || req.body.id;
            const { Status } = req.body;
            pool.query("UPDATE NotifyProducts SET Status=?, UpdatedAt=NOW() WHERE NotifyID=?", [Status !== undefined ? Status : 1, id], (err, results) => {
                if (err) {
                    console.error("Error updating notify product:", err);
                    return resp.status(500).json({ "Status": 0, "Message": "Error updating notify product" });
                }
                return resp.json({ "Status": 1, "Message": "Notify product updated successfully" });
            });
        } catch (e) {
            return resp.status(500).json({ "Status": 0, "Message": "Error updating notify product" });
        }
    },

    notifyproductdetail: async (req, resp, next) => {
        try {
            const id = req.params.id || req.params.ID;
            const sql = `
                SELECT np.*, p.ProductName, pv.metrictype, pv.metricvalue, 
                       u.FirstName, u.LastName, u.MobileNumber as UserMobile
                FROM NotifyProducts np 
                LEFT JOIN Products p ON np.ProductID = p.ProductID 
                LEFT JOIN ProductVariants pv ON np.VariantID = pv.VariantID 
                LEFT JOIN Users u ON np.UserID = u.UserID 
                WHERE np.NotifyID = ?
            `;
            pool.query(sql, [id], (err, results) => {
                if (err || !results || results.length === 0) {
                    return resp.json({ "Status": 1, "Product": {} });
                }
                return resp.json({ "Status": 1, "Product": results[0] });
            });
        } catch (e) {
            return resp.json({ "Status": 1, "Product": {} });
        }
    },

    triggernotifyproduct: async (req, resp, next) => {
        try {
            const id = req.params.id || req.params.ID || req.body.NotifyID;
            if (!id) return resp.status(400).json({ Status: 0, Message: "NotifyID is required" });

            const sql = `
                SELECT np.*, p.ProductName 
                FROM NotifyProducts np
                LEFT JOIN Products p ON np.ProductID = p.ProductID
                WHERE np.NotifyID = ?
            `;
            pool.query(sql, [id], (err, rows) => {
                if (err || !rows || rows.length === 0) {
                    return resp.status(404).json({ Status: 0, Message: "Notification request not found" });
                }
                const record = rows[0];
                const productName = record.ProductName || "Requested Product";
                const message = `Good news! ${productName} is now back in stock. Order now before it runs out!`;

                // Persist notification for user
                if (record.UserID) {
                    pool.query(
                        "INSERT INTO UserNotifications (UserID, Title, Message, Status, Type, CreatedAt) VALUES (?, ?, ?, 1, 1, NOW())",
                        [record.UserID, "Back in Stock Alert!", message],
                        (nErr) => {
                            if (nErr) console.error("Error creating user notification:", nErr);
                        }
                    );
                }

                // Update NotifyProducts status to 2 (Notified) and record timestamp
                pool.query(
                    "UPDATE NotifyProducts SET Status = 2, NotifiedAt = NOW(), UpdatedAt = NOW() WHERE NotifyID = ?",
                    [id],
                    (upErr) => {
                        if (upErr) return resp.status(500).json({ Status: 0, Message: "Error updating notification status" });
                        return resp.json({
                            Status: 1,
                            Message: `Back-in-stock alert sent for ${productName}`,
                            NotifiedAt: new Date()
                        });
                    }
                );
            });
        } catch (e) {
            console.error("Exception in triggernotifyproduct:", e);
            return resp.status(500).json({ Status: 0, Message: "Server error" });
        }
    },

    walletTransactions: async (req, resp, next) => {
        try {
            const UserID = req.params.UserID || req.query.UserID;
            if (!UserID) {
                return resp.status(400).json({ Status: 0, Message: "UserID is required" });
            }

            pool.query("SELECT WalletAmount, FirstName, LastName, MobileNumber FROM Users WHERE UserID = ?", [UserID], (uErr, uRows) => {
                if (uErr) {
                    return resp.status(500).json({ Status: 0, Message: "Error fetching user" });
                }
                const user = (uRows && uRows[0]) || { WalletAmount: 0 };

                pool.query("SELECT * FROM Wallets WHERE UserID = ? ORDER BY CreatedAt DESC", [UserID], (wErr, wRows) => {
                    if (wErr) {
                        return resp.status(500).json({ Status: 0, Message: "Error fetching wallet transactions" });
                    }
                    return resp.json({
                        Status: 1,
                        User: user,
                        Balance: parseFloat(user.WalletAmount || 0),
                        Transactions: wRows || []
                    });
                });
            });
        } catch (err) {
            console.error("Exception in walletTransactions:", err);
            return resp.status(500).json({ Status: 0, Message: "Server error" });
        }
    },

    creditDebitWallet: async (req, resp, next) => {
        try {
            const { UserID, Amount, Credited_Debited, Description, ExpiryDays } = req.body;
            const amountNum = parseFloat(Amount);

            if (!UserID || isNaN(parseInt(UserID, 10))) {
                return resp.status(400).json({ Status: 0, Message: "Valid UserID is required" });
            }
            if (isNaN(amountNum) || amountNum <= 0) {
                return resp.status(400).json({ Status: 0, Message: "Amount must be a positive number" });
            }
            const isCredit = parseInt(Credited_Debited, 10) === 1;

            let expiryDate = null;
            if (isCredit && ExpiryDays && parseInt(ExpiryDays, 10) > 0) {
                const exp = new Date();
                exp.setDate(exp.getDate() + parseInt(ExpiryDays, 10));
                expiryDate = exp;
            }

            pool.query("SELECT WalletAmount FROM Users WHERE UserID = ?", [UserID], (uErr, uRows) => {
                if (uErr || !uRows || uRows.length === 0) {
                    return resp.status(404).json({ Status: 0, Message: "User not found" });
                }

                const currentBal = parseFloat(uRows[0].WalletAmount || 0);
                if (!isCredit && currentBal < amountNum) {
                    return resp.status(400).json({
                        Status: 0,
                        Message: `Insufficient wallet balance. Current balance is ₹${currentBal.toFixed(2)}`
                    });
                }

                const newBalance = isCredit ? (currentBal + amountNum) : (currentBal - amountNum);

                const walletSql = `
                    INSERT INTO Wallets (UserID, Amount, Credited_Debited, ContentType, ContentID, Description, ExpiryDate, IsExpired, CreatedAt)
                    VALUES (?, ?, ?, 5, 0, ?, ?, 0, NOW())
                `;

                pool.query(
                    walletSql,
                    [
                        UserID,
                        amountNum,
                        isCredit ? 1 : 2,
                        Description || (isCredit ? 'Manual Admin Credit' : 'Manual Admin Debit'),
                        expiryDate
                    ],
                    (insErr) => {
                        if (insErr) {
                            console.error("Error inserting wallet transaction:", insErr);
                            return resp.status(500).json({ Status: 0, Message: "Error saving wallet transaction" });
                        }

                        pool.query(
                            "UPDATE Users SET WalletAmount = ? WHERE UserID = ?",
                            [newBalance, UserID],
                            (upErr) => {
                                if (upErr) {
                                    console.error("Error updating user wallet:", upErr);
                                    return resp.status(500).json({ Status: 0, Message: "Error updating user balance" });
                                }
                                return resp.json({
                                    Status: 1,
                                    Message: `Successfully ${isCredit ? 'credited' : 'debited'} ₹${amountNum.toFixed(2)}`,
                                    NewBalance: newBalance
                                });
                            }
                        );
                    }
                );
            });
        } catch (err) {
            console.error("Exception in creditDebitWallet:", err);
            return resp.status(500).json({ Status: 0, Message: "Server error" });
        }
    },

    expireCashback: async (req, resp, next) => {
        try {
            const findExpiredSql = `
                SELECT * FROM Wallets 
                WHERE Credited_Debited = 1 
                  AND IsExpired = 0 
                  AND ExpiryDate IS NOT NULL 
                  AND ExpiryDate < NOW()
            `;

            pool.query(findExpiredSql, async (err, expiredCredits) => {
                if (err) {
                    console.error("Error finding expired cashback:", err);
                    return resp.status(500).json({ Status: 0, Message: "Error querying expired cashback" });
                }

                if (!expiredCredits || expiredCredits.length === 0) {
                    return resp.json({ Status: 1, ExpiredCount: 0, Message: "No expired cashback found" });
                }

                let processedCount = 0;
                await Promise.all(expiredCredits.map(async (credit) => {
                    const deductAmount = parseFloat(credit.Amount);
                    const walletId = credit.WalletID || credit.ID;
                    await new Promise((res, rej) => {
                        pool.query("UPDATE Wallets SET IsExpired = 1 WHERE WalletID = ?", [walletId], (err, r) => err ? rej(err) : res(r));
                    });
                    await new Promise((res, rej) => {
                        pool.query(
                            "INSERT INTO Wallets (UserID, Amount, Credited_Debited, ContentType, ContentID, Description, CreatedAt) VALUES (?, ?, 2, 5, ?, 'Cashback expired debit', NOW())",
                            [credit.UserID, deductAmount, walletId],
                            (err, r) => err ? rej(err) : res(r)
                        );
                    });
                    await new Promise((res, rej) => {
                        pool.query(
                            "UPDATE Users SET WalletAmount = GREATEST(0, COALESCE(WalletAmount, 0) - ?) WHERE UserID = ?",
                            [deductAmount, credit.UserID],
                            (err, r) => err ? rej(err) : res(r)
                        );
                    });
                    processedCount++;
                }));

                return resp.json({
                    Status: 1,
                    ExpiredCount: processedCount,
                    Message: `Processed ${processedCount} expired cashback records`
                });
            });
        } catch (err) {
            console.error("Exception in expireCashback:", err);
            return resp.status(500).json({ Status: 0, Message: "Server error" });
        }
    }

}

function getdeliveryboy(AdminID) {

    return new Promise(function (resolve, reject) {
        try {


            query = "select * from AdminUsers where Role=2 and AdminID=?"
            console.log(query)
            pool.query(query, [AdminID], function (err, results, fields) {
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

function Createsettings(body) {
    try {
        return new Promise(function (resolve, reject) {


            let Insertorder = { SettingKey: body.SettingKey, SettingValue: body.SettingValue }
            let sql = "INSERT INTO Settings set ?";

            pool.query(sql, Insertorder, (err, results) => {
                console.log('post method', results, err)
                if (err) {
                    console.log("error in insert settings to table :" + err);
                    return reject(-1);
                }
                if (results.affectedRows == 1) {
                    console.log("Added to settings table: ", results.affectedRows);
                    return resolve(1);
                }
                else {
                    console.log("error in insert settings to table ", results.affectedRows);
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

function Verifyemail(inputs) {
    return new Promise(function (resolve, reject) {
        var myQuery = "select * from AdminUsers where EmailID = ?";
        pool.query(myQuery, [inputs.EmailID], function (err, results) {
            if (err) {
                console.log("error checking verify MobileNumber table: ", err);
                reject(0)
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
        var myQuery = "select * from AdminUsers where EmailID = ? and Password = ?";
        pool.query(myQuery, [inputs.EmailID, inputs.Password], function (err, results) {
            if (err) {
                console.log("error checking verify MobileNumber table: ", err);
                reject(0)
            }

            if (results.length > 0) {
                var data = { "AdminID": results[0]['AdminID'], "FirstName": results[0]['FirstName'], "LastName": results[0]['LastName'], "ProfilePic": "NA", "Role": results[0]['Role'] }
                resolve(data)
            }
            else {
                console.log("Entered incorrect password");
                resolve(2);
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

function checkemailid(EmailID, AdminID) {
    var queryString = "select * from AdminUsers where EmailID = ? and AdminID != ?";
    return new Promise(function (resolve, reject) {
        pool.query(queryString, [EmailID, AdminID], function (err, results, fields) {
            if (err) {
                //mysqlConn.end();
                console.log("Error in checking UserID from DB :" + err);
                reject(0);
            }
            else {
                //mysqlConn.end();
                if (results.length > 0) {
                    console.log("emailid is already in use");
                    resolve(1);
                }
                else {
                    console.log("emailid is not in use : " + results.length);
                    resolve(0);
                }
            }
        });
    });
}

function getusers() {

    return new Promise(function (resolve, reject) {
        try {
            query = "select * from Users where FCMToken!='NA'"
            console.log(query)
            pool.query(query, function (err, results, fields) {
                if (err) {
                    console.log("Error in checking :" + err);
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

function addnotification(body, UserID) {
    try {
        return new Promise(function (resolve, reject) {
            let InsertProducts = { UserID: UserID, Title: body.Title, Status: 1, Type: 1, Message: body.Message }
            let sql = "INSERT INTO UserNotifications set ?";
            pool.query(sql, InsertProducts, (err, results) => {
                console.log('add UserNotifications')
                if (err) {
                    console.log(err)
                    return reject(-1)
                }
                if (results.affectedRows == 1) {
                    resolve(1)
                }
                else {
                    console.log("error in insert UserNotifications to table ", results.affectedRows);
                    reject(-1)
                }
            })
        });
    }
    catch (err) {
        reject(-1)
    }
}

function sendnotifications(body, FCMToken) {
    try {
        return new Promise(function (resolve, reject) {

            {



                var serverKey = server_Key; // put your server key here
                var fcm = new FCM(serverKey);

                var message = {
                    registration_ids: FCMToken,
                    collapse_key: 'FavMall',

                    notification: {
                        title: body.Title,
                        body: body.Message
                    },

                };

                fcm.send(message, function (err, response) {
                    if (err) {
                        console.log("Something has gone wrong!", err);
                        resolve(0);
                    } else {
                        console.log("Successfully sent with response: ", response);
                        resolve(1);
                    }
                });

            }

        });

    }
    catch (err) {
        console.log("Error in creating ContactUs: ", err);
        return false;
    }
}


module.exports = usercontroller
