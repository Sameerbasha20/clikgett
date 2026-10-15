const RetentionEngine = require('../services/RetentionEngine');
const mysql = require('mysql');
require('dotenv').config()


const pool = require('../utils/db');



const PromoCodecontroller = {

    // ****************************    user ********************************
    
    triggerWinbackCoupons: async (req, resp) => {
        try {
            const days = (req.query && req.query.days) || (req.body && req.body.days) || 14;
            const code = (req.query && req.query.code) || (req.body && req.body.code) || 'COMEBACK20';
            const result = await RetentionEngine.processWinBackCoupons(parseInt(days, 10), code);
            return resp.json({ Status: 1, ...result });
        } catch (err) {
            console.error('Error triggering win-back coupons:', err);
            return resp.status(500).json({ Status: 0, Message: 'Error triggering win-back coupons' });
        }
    },

    userallPromoCodes: async (req, resp, next) => {
        try {

            UserID = req.UserID
            pool.query("SELECT * from PromoCodes where StartDate<=date(CONVERT_TZ(Now(),'+00:00','+05:30'))  and \
                    EndDate>=date(CONVERT_TZ(Now(),'+00:00','+05:30')) \
                    and Status=1 and Is_Secret=0 order by createdAt desc;", (err, results) => {
                console.log('connecting')
                if (err) {

                    return resp.json({ "status": 0, "Message": err.sqlMessage });
                }

                if (results.length > 0) {


                    resp.json({ "status": 1, "PromoCodes": results })
                }
                else {
                    resp.json({ "status": 1, "PromoCodes": [] })
                }

            });

        }
        catch (e) {


            console.log(e)
            return resp.json({ "status": 0, "Message": 'error' })
        }
    },

    userapplypromoCodes: async (req, resp, next) => {
        try {
            const Body = req.body;
            const cleanCode = (Body.PromoCode || "").toString().trim().toUpperCase();
            if (!cleanCode) {
                return resp.json({ Status: 0, Message: "PromoCode is required" });
            }

            const checkPromoCodes = await getPromoCodesdetail(cleanCode, 'PromoCodeID_check_post');
            if (checkPromoCodes.length != 1) {
                return resp.json({ Status: 0, Message: "Invalid PromoCode Code" });
            }

            const PromoCodes_verify_query = `
                SELECT * from PromoCodes 
                WHERE StartDate <= date(CONVERT_TZ(Now(),'+00:00','+05:30')) 
                  AND EndDate >= date(CONVERT_TZ(Now(),'+00:00','+05:30')) 
                  AND Status = 1 
                  AND upper(PromoCode) = ?;
            `;

            pool.query(PromoCodes_verify_query, [cleanCode], async (err, results) => {
                if (err) {
                    return resp.json({ Status: 0, Message: err.sqlMessage });
                }
                if (results.length === 1) {
                    const promo = results[0];

                    // Fetch user cart items to enforce product exclusions (no_coupon)
                    let cartItems = [];
                    if (req.UserID) {
                        const userCart = await new Promise(r => pool.query("SELECT * FROM Carts WHERE UserID = ? AND IsOrderLinked = 1 ORDER BY CreatedAt DESC LIMIT 1", [req.UserID], (e, rows) => r(rows && rows.length ? rows[0] : null)));
                        if (userCart) {
                            const rawItems = await new Promise(r => pool.query(
                                "SELECT CI.ProductID, CI.VariantID, CI.Quantity, V.Price, V.OfferPrice, V.Buy2Price FROM CartItems CI JOIN ProductVariants V ON CI.VariantID = V.VariantID WHERE CI.CartID = ?", 
                                [userCart.CartID], 
                                (e, rows) => r(rows || [])
                            ));
                            cartItems = rawItems;
                        }
                    }

                    let eligibleSubTotal = parseFloat(Body.SubTotal || 0);

                    // If cart items exist, calculate exact eligible subtotal excluding restricted items
                    if (cartItems.length > 0) {
                        const calculation = await PricingEngine.calculateCart(cartItems, cleanCode, req.UserID);
                        eligibleSubTotal = calculation.CouponEligibleSubTotal;
                    }

                    const minOrder = parseFloat(promo.MinOrderValue || 0);
                    if (eligibleSubTotal < minOrder) {
                        return resp.json({ 
                            Status: 0, 
                            Message: `Minimum coupon-eligible cart value must be ₹${minOrder} (restricted products are excluded)` 
                        });
                    }

                    let Discount = 0;
                    if (promo.Type == 2) {
                        Discount = parseFloat(promo.OfferValue || promo.MaxDiscount || 0);
                    } else {
                        Discount = (eligibleSubTotal / 100) * parseFloat(promo.OfferValue || 0);
                    }
                    const maxDisc = parseFloat(promo.MaxDiscount || 0);
                    if (maxDisc > 0 && Discount >= maxDisc) {
                        Discount = maxDisc;
                    }

                    return resp.json({
                        Status: 1,
                        Message: "PromoCode Verified",
                        Discount: parseFloat(Discount.toFixed(2)),
                        EligibleSubTotal: parseFloat(eligibleSubTotal.toFixed(2))
                    });
                } else {
                    return resp.json({ Status: 0, Message: "PromoCode Expired" });
                }
            });
        } catch (e) {
            console.log(e);
            return resp.json({ Status: 0, Message: 'error' });
        }
    },

    // userapplypromoCodes : async (req, resp, next) => {
    //     try{
    //                 check_PromoCodes = await getPromoCodesdetail(req.body.PromoCode.replace(/'/g, "\\'").toUpperCase(),'PromoCodeID_check_post',0)
    //                 if (check_PromoCodes.length != 1){
    //                     return resp.json({"status":0,"Message":"Invalid Promo Code"})
    //                     }

    //                 pool.query("SELECT * from PromoCodes where StartDate<=date(CONVERT_TZ(Now(),'+00:00','+05:30'))  and \
    //                 EndDate>=date(CONVERT_TZ(Now(),'+00:00','+05:30')) \
    //                 and Status=1 and upper(PromoCode)=?;",[req.body.PromoCode.replace(/'/g, "\\'").toUpperCase()],(err,results)=>{
    //                     console.log('connecting')
    //                     if(err) {

    //                         return resp.json({"status":0,"Message":err.sqlMessage});
    //                     } 

    //                     if (results.length == 1){


    //                             resp.json({"status":1,"Message":"PromoCode Verified","PromoCode":results[0]})
    //                         }
    //                     else{
    //                             resp.json({"status":0,"Message":"PromoCode Expired"})
    //                         }

    //                 });




    //     }
    //     catch(e){


    //         console.log(e)
    //         return resp.json({"status":0,"Message":'error'})
    //     }
    // },

    // ****************************    admin ********************************


    all_PromoCodess: async (req, resp, next) => {
        try {

            UserID = req.UserID
            pool.query("SELECT * FROM PromoCodes where Status!=0 order by createdAt desc;", (err, results) => {
                console.log('connecting')
                if (err) {

                    return resp.json({ "status": 0, "Message": err.sqlMessage });
                }

                if (results.length > 0) {


                    resp.json({ "status": 1, "PromoCodes": results })
                }
                else {
                    resp.json({ "status": 1, "PromoCodes": [] })
                }

            });




        }
        catch (e) {


            console.log(e)
            return resp.json({ "status": 0, "Message": 'error' })
        }
    },

    get_PromoCodess: async (req, resp, next) => {
        try {

            UserID = req.UserID
            pool.query("SELECT * FROM PromoCodes where Status!=0 and PromoCodeID=?;", [req.params.PromoCodeID], (err, results) => {
                console.log('connecting')
                if (err) {

                    return resp.json({ "status": 0, "Message": err.sqlMessage });
                }

                if (results.length > 0) {

                    resp.json({ "status": 1, "PromoCode": results[0] })
                }
                else {
                    resp.json({ "status": 1, "PromoCode": {} })
                }

            });




        }
        catch (e) {


            console.log(e)
            return resp.json({ "status": 0, "Message": 'error' })
        }
    },

    add_promoCodess: async (req, resp, next) => {
        try {
            const keys = Object.keys(req.body);


            check_PromoCodes = await getPromoCodesdetail(req.body.PromoCode.replace(/'/g, "\\'").toUpperCase(), 'PromoCodeID_check_post', 0)
            if (check_PromoCodes.length > 0) {
                return resp.json({ "status": 0, "Message": "PromoCode Already Exists" })
            }

            createPromoCodes = await add_PromoCodes(req.body)
            if (createPromoCodes != 0) {
                return resp.json({ 'status': 1, "Message": "Promo Code added Successfully" })
            }

            else {
                return resp.json({ 'status': 0, "Message": "Error in adding Promo Code" })
            }

        }
        catch (err) {
            console.log("exception in adding PromoCode ", err);
            return resp.status(500).json({ "status": 0, "Message": "Error in adding PromoCode" });
        }
    },

    update_PromoCodes: async (req, resp, next) => {
        try {
            Body = req.body

            check_PromoCodes = await getPromoCodesdetail(0, 'PromoCodeID_check', req.params.PromoCodeID)
            if (check_PromoCodes.length == 0) {
                return resp.json({ "status": 0, "Message": "PromoCode not found" })
            }

            if (Body.PromoCode != null || Body.PromoCode != undefined) {
                check_PromoCodes = await getPromoCodesdetail(Body.PromoCode.replace(/'/g, "\\'").toUpperCase(), 'PromoCode_check', req.params.PromoCodeID)
                if (check_PromoCodes.length > 0) {
                    return resp.json({ "status": 0, "Message": "PromoCode Already Exists" })
                }
                PromoCode = "PromoCode='" + Body.PromoCode.replace(/'/g, "\\'").toUpperCase() + "',";
            }
            else {
                PromoCode = "PromoCode = PromoCode,";
            }

            if (Body.Description != null || Body.Description != undefined) {
                Description = "Description='" + Body.Description.replace(/'/g, "\\'") + "',";
            }
            else {
                Description = "Description = Description,";
            }

            if (Body.StartDate != null || Body.StartDate != undefined)
                StartDate = "StartDate=" + pool.escape(Body.StartDate) + ",";
            else
                StartDate = "StartDate = StartDate,";

            if (Body.EndDate != null || Body.EndDate != undefined)
                EndDate = "EndDate=" + pool.escape(Body.EndDate) + ",";
            else
                EndDate = "EndDate = EndDate,";

            if (Body.Type != null || Body.Type != undefined)
                Type = "Type=" + pool.escape(Body.Type) + ",";
            else
                Type = "Type = Type,";

            if (Body.Is_Secret != null || Body.Is_Secret != undefined)
                Is_Secret = "Is_Secret=" + pool.escape(Body.Is_Secret) + ",";
            else
                Is_Secret = "Is_Secret = Is_Secret,";

            if (Body.OfferValue != null || Body.OfferValue != undefined)
                OfferValue = "OfferValue=" + pool.escape(Body.OfferValue) + ",";
            else
                OfferValue = "OfferValue = OfferValue,";

            if (Body.MaxDiscount != null || Body.MaxDiscount != undefined)
                MaxDiscount = "MaxDiscount=" + pool.escape(Body.MaxDiscount) + ",";
            else
                MaxDiscount = "MaxDiscount = MaxDiscount,";

            if (Body.Status != null || Body.Status != undefined)
                Status = "Status=" + pool.escape(Body.Status)
            else
                Status = "Status = Status";




            queryString = "UPDATE PromoCodes SET " + PromoCode + Description + StartDate + EndDate + Is_Secret + Type + OfferValue + MaxDiscount + Status + " WHERE PromoCodeID=" + pool.escape(req.params.PromoCodeID) + ";";
            console.log(queryString)
            return new Promise(function (resolve, reject) {
                pool.query(queryString, function (err, result, fields) {
                    if (err) {
                        console.log("Error in updating the DB:" + err);
                        return resp.json({ "status": 0, "Message": "Error in updating the DB" });


                    }
                    else {
                        console.log("update :" + result.affectedRows);
                        if (result.affectedRows > 0) {
                            return resp.json({ "status": 1, "Message": "PromoCode Update Successful" });
                        }
                        else {
                            console.log("PromoCode update failed", err, queryString);
                            return resp.json({ "status": 0, "Message": "No changes to update" });

                        }

                    }
                });
            });
        }
        catch (err) {
            console.log("exception in updating PromoCode ", err);
            return resp.status(500).json({ "status": 0, "Message": "Error in updating PromoCode" });
        }
    },

    delete_PromoCodess: async (req, resp, next) => {
        try {
            check_PromoCodes = await getPromoCodesdetail(0, 'PromoCodeID_check', req.params.PromoCodeID)
            if (check_PromoCodes.length == 0) {
                return resp.json({ "status": 0, "Message": "PromoCode not found" })
            }



            pool.query(`update PromoCodes set status=0 where PromoCodeID=?`, [req.params.PromoCodeID], (err, results) => {
                console.log('connecting')
                if (err) {
                    return resp.json({ "status": 0, "Message": err.sqlMessage });
                }
                if (results.affectedRows === 1) {

                    resp.json({ "status": 1, "Message": "PromoCode deleted Successfully" })
                }
                else {
                    resp.json({ "status": 0, "Message": "Error in deleting PromoCode" })
                }


            });
        }
        catch (err) {
            console.log("exception in deleting PromoCode ", err);
            return resp.status(500).json({ "status": 0, "Message": "Error in deleting PromoCode" });
        }
    },

}


//////////////////////////   user //////////////////////////////////////////////////



///////////////////////////////  admin ////////////////////////////////////



function add_PromoCodes(body) {

    return new Promise(function (resolve, reject) {

        if (body.MaxDiscount == undefined) { body.MaxDiscount = 0 }

        let InsertPromoCodes = {
            PromoCode: body.PromoCode.toUpperCase(), Description: body.Description, StartDate: body.StartDate,
            EndDate: body.EndDate, Type: body.Type, OfferValue: body.OfferValue, MinOrderValue: body.MinOrderValue,
            MaxDiscount: body.MaxDiscount, Is_Secret: body.Is_Secret, status: 1
        }

        let sql = "INSERT INTO PromoCodes set ?";
        pool.query(sql, InsertPromoCodes, (err, results) => {
            console.log('post method', results, err)
            if (results.affectedRows === 1) {

                return resolve(results.insertId)
            }
            else {
                console.log("error in insert PromoCodes to table ", results.affectedRows);
                return resolve(0)
            }
        })

    });
}

function getPromoCodeDetail(PromoCode, string, PromoCodeID) {
    try {

        return new Promise(function (resolve, reject) {
            if (string == "PromoCodeID_check_post") {
                query = "select * from PromoCodes where upper(PromoCode)=" + pool.escape(PromoCode) + ""
            }
            else if (string == "PromoCode_check") {
                query = "select * from PromoCodes where upper(PromoCode)=" + pool.escape(PromoCode) + " and PromoCodeID!=" + pool.escape(PromoCodeID)
            }
            else {
                query = "select * from PromoCodes where Status!=0 and PromoCodeID=" + pool.escape(PromoCodeID)
            }
            console.log(query)
            pool.query(query, function (err, results, fields) {
                if (err) {
                    console.log("Error in checking PromoCodeID from DB :" + err);
                    reject(-1);
                }
                else {

                    resolve(results)
                }
            });
        });
    }
    catch (err) {
        console.log("exception in checking PromoCodeID", err);
        reject(-1);
    }
}

function getPromoCodesdetail(PromoCode, string, PromoCodeID) {
    try {

        return new Promise(function (resolve, reject) {
            if (string == "PromoCodeID_check_post") {
                query = "select * from PromoCodes where upper(PromoCode)=" + pool.escape(PromoCode) + ""
            }
            else if (string == "PromoCode_check") {
                query = "select * from PromoCodes where upper(PromoCode)=" + pool.escape(PromoCode) + " and PromoCodeID!=" + pool.escape(PromoCodeID)
            }
            else {
                query = "select * from PromoCodes where Status!=0 and PromoCodeID=" + pool.escape(PromoCodeID)
            }
            console.log(query)
            pool.query(query, function (err, results, fields) {
                if (err) {
                    console.log("Error in checking PromoCodeID from DB :" + err);
                    reject(-1);
                }
                else {

                    resolve(results)
                }
            });
        });
    }
    catch (err) {
        console.log("exception in checking PromoCodeID", err);
        reject(-1);
    }
}

module.exports = PromoCodecontroller