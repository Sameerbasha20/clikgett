
const mysql = require('mysql');
require('dotenv').config()
var fs = require('fs')
const AWS = require('aws-sdk');
const crypto = require('crypto');
const CommonController = require("../controllers/CommonController");
const logger = require('../utils/logger');
Razorpay = require('razorpay')

var instance;
try {
    instance = new Razorpay({
        key_id: process.env.RAZORPAYID || 'rzp_test_local_mock_key',
        key_secret: process.env.RAZORPAYSECRET || 'local_mock_secret',
    });
} catch (e) {
    if (logger && logger.warn) logger.warn("Razorpay instance init fallback: " + e.message);
}


const s3 = require('../utils/s3');




const banner_s3 = "https://d3c9kvg5gaqz48.cloudfront.net/Banners/"

const users_s3 = "https://d3c9kvg5gaqz48.cloudfront.net/Users/"

const category_s3 = "https://d3c9kvg5gaqz48.cloudfront.net/Categories/"

const Products_s3 = "https://d3c9kvg5gaqz48.cloudfront.net/Products/"

const subcategories_s3 = "https://d3c9kvg5gaqz48.cloudfront.net/SubCategories/"




const pool = require('../utils/db');



async function fetchDynamicHomeSections(userId) {
    const finalSections = [];
    try {
        const getSectionsQuery = "select Name, HomeSectionID, Description, ImageUrl, DisplayOrder, SectionType, SystemKey, IsBuiltIn, ConfigurationJSON from HomepageSections where Status=1 and (StartDate IS NULL OR StartDate <= NOW()) and (EndDate IS NULL OR EndDate >= NOW()) order by DisplayOrder asc, created_at desc";
        const sections = await CommonController.commonget(getSectionsQuery);

        if (!Array.isArray(sections)) return [];

        for (const section of sections) {
            section.SectionType = (section.SectionType || 'selected_products').toLowerCase();
            
            let config = {};
            if (section.ConfigurationJSON) {
                try {
                    config = typeof section.ConfigurationJSON === 'string' ? JSON.parse(section.ConfigurationJSON) : section.ConfigurationJSON;
                } catch (e) {
                    config = {};
                }
            }
            section.Configuration = config;

            let products = [];
            let categories = [];
            let subcategories = [];

            if (section.SectionType === 'shop_by_category') {
                categories = await CommonController.commonget(
                    "select c.CategoryID, c.CategoryName, c.CategoryImage, c.ImageUrl from HomeSectionCategories hsc inner join Categories c on c.CategoryID=hsc.CategoryID where c.Status=1 and hsc.HomeSectionID=" + section.HomeSectionID + " order by hsc.DisplayOrder asc"
                );
                if (!categories || categories.length === 0) {
                    categories = await CommonController.commonget("select CategoryID, CategoryName, CategoryImage, ImageUrl from Categories where Status=1 order by Priority asc, CategoryName asc limit 0,12");
                }
            } else if (section.SectionType === 'category_shelf') {
                const catRows = await CommonController.commonget(
                    "select c.CategoryID, c.CategoryName, c.CategoryImage, c.ImageUrl from HomeSectionCategories hsc inner join Categories c on c.CategoryID=hsc.CategoryID where c.Status=1 and hsc.HomeSectionID=" + section.HomeSectionID + " order by hsc.DisplayOrder asc"
                );
                categories = catRows || [];
                if (categories.length > 0) {
                    const catIds = categories.map(c => c.CategoryID).join(',');
                    products = await CommonController.getproducts(`select p.* from Products p where p.Status=1 and p.CategoryID in (${catIds}) limit 0,15`);
                }
            } else if (section.SectionType === 'subcategory_shelf') {
                const subRows = await CommonController.commonget(
                    "select s.SubCategoryID, s.SubCategoryName, s.CategoryID from HomeSectionSubcategories hss inner join SubCategories s on s.SubCategoryID=hss.SubCategoryID where s.Status=1 and hss.HomeSectionID=" + section.HomeSectionID + " order by hss.DisplayOrder asc"
                );
                subcategories = subRows || [];
                if (subcategories.length > 0) {
                    const subIds = subcategories.map(s => s.SubCategoryID).join(',');
                    products = await CommonController.getproducts(`select p.* from Products p where p.Status=1 and p.SubCategoryID in (${subIds}) limit 0,15`);
                }
            } else if (section.SectionType === 'bestsellers') {
                products = await CommonController.getproducts(
                    "select p.* from RecommendedProducts Rp inner join Products p on p.ProductID=Rp.ProductID inner join ProductVariants pv on p.ProductID=pv.ProductID where p.Status=1 and Rp.Status=1 and pv.AvailableQty>0 and pv.Status=1 group by p.ProductID limit 0,15"
                );
            } else if (section.SectionType === 'recommendations') {
                products = await CommonController.getproducts(
                    "select p.* from RecommendedProducts Rp inner join Products p on p.ProductID=Rp.ProductID where p.Status=1 and Rp.Status=1 limit 0,15"
                );
            } else if (section.SectionType === 'deals_and_offers') {
                products = await CommonController.getproducts(
                    "select p.* from Products p inner join ProductVariants pv on p.ProductID=pv.ProductID where p.Status=1 and pv.Status=1 and pv.OfferPrice < pv.Price and pv.AvailableQty>0 group by p.ProductID order by max(pv.Price - pv.OfferPrice) desc limit 0,15"
                );
            } else if (section.SectionType === 'order_again') {
                if (userId) {
                    products = await CommonController.getproducts(
                        `select p.* from OrderItems oi inner join Orders o on o.OrderID=oi.OrderID inner join Products p on p.ProductID=oi.ProductID where o.UserID=${parseInt(userId, 10)} and p.Status=1 group by p.ProductID order by max(o.CreatedAt) desc limit 0,15`
                    );
                }
            } else if (section.SectionType === 'promotional_banner') {
                // Banner section
            } else {
                // Default: 'selected_products'
                const getSectionProducts = "select p.* from HomeSectionProducts hp inner join Products p on p.ProductID=hp.ProductID where p.Status=1 and hp.HomeSectionID=" + section.HomeSectionID + " order by hp.DisplayOrder asc, hp.id asc limit 0,15";
                products = await CommonController.getproducts(getSectionProducts);
            }

            section.Products = products || [];
            section.Categories = categories || [];
            section.SubCategories = subcategories || [];

            if (
                (section.Products && section.Products.length > 0) ||
                (section.Categories && section.Categories.length > 0) ||
                section.SectionType === 'promotional_banner' ||
                section.SectionType === 'order_again'
            ) {
                finalSections.push(section);
            }
        }
    } catch (err) {
        console.error("Error in fetchDynamicHomeSections:", err);
    }
    return finalSections;
}

const usercontroller = {

    products_transfer: async (req, resp, next) => {
        let XLSX;
        try {
            XLSX = require('xlsx');
        } catch (e) {
            return resp.status(501).json({
                status: false,
                message: 'Excel processing dependency (xlsx) is not installed on server'
            });
        }
        const fs = require('fs');

        // Function to read Excel file and convert to JSON
        function excelToJson(filePath) {
            if (!fs.existsSync(filePath)) {
                throw new Error('File not found: ' + filePath);
            }
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // Convert the sheet data to JSON
            return XLSX.utils.sheet_to_json(sheet, { header: 'A' });
        }

        // Function to add a product and return the inserted ProductID
        async function addProduct(pool, row) {
            try {
                const query =
                    `INSERT INTO Products (IsTransfered, ProductName, Description, CategoryID, SubCategoryID, Status, Type, ImageUrl, ProductImages)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE ProductID = LAST_INSERT_ID(ProductID)`;

                const values = [
                    1,          // IsTransfered
                    row["D"],   // ProductName
                    row["J"],   // Description
                    row["B"],   // CategoryID
                    row["C"],   // SubCategoryID
                    1,          // Status (active)
                    1,          // Type (default)
                    row["K"],   // ImageUrl
                    JSON.stringify([
                        row["K"], row["L"]
                    ]) // ProductImages as JSON
                ];

                const result = await new Promise((resolve, reject) => {
                    pool.query(query, values, (error, results) => {
                        if (error) reject(error);
                        else resolve(results);
                    });
                });

                return result.insertId;
            } catch (error) {
                throw new Error(`Error in addProduct: ${error.message}`);
            }
        }

        // Function to add a product variant
        async function addProductVariant(pool, productId, row) {
            try {
                const query =
                    `INSERT INTO ProductVariants (IsTransfered, ProductID, metrictype, metricvalue, Price, OfferPrice, AvailableQty, maxQty, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                const values = [
                    1,          // IsTransfered
                    productId,  // ProductID
                    row["N"],   // metrictype
                    row["E"],   // metricvalue
                    row["F"],   // Price
                    row["G"],   // OfferPrice
                    row["H"],   // AvailableQty
                    row["I"],   // maxQty
                    1           // status (active)
                ];

                await new Promise((resolve, reject) => {
                    pool.query(query, values, (error) => {
                        if (error) reject(error);
                        else resolve();
                    });
                });
            } catch (error) {
                throw new Error(`Error in addProductVariant: ${error.message}`);
            }
        }

        try {
            const filePath = '/home/ubuntu/clikgett/server/controllers/ProductsListforClikgett.xlsx';
            const jsonData = excelToJson(filePath);

            for (const row of jsonData) {
                const productId = await addProduct(pool, row); // Add product and get ProductID
                await addProductVariant(pool, productId, row); // Add product variant
            }

            resp.json({ "Status": 1, "Message": "Data transfer completed successfully." });
        } catch (error) {
            console.error("Error during products_transfer:", error);
            resp.status(500).json({ "Status": 0, "Message": "An error occurred.", "Error": error.message });
        }
    }
    ,
    updateproducts: async (req, resp, next) => {
        try {
            let getproducts = `SELECT ProductID, ProductImages FROM Products where IsTransfered = 1`
            let products = await CommonController.commonget(getproducts)
            console.log(products.length)
            // Loop through each product
            for (let product of products) {
                console.log(product)
                const productImages = JSON.parse(product.ProductImages);
                const updatedImages = Object.values(productImages);
                UPDATE = `UPDATE Products SET ProductImages = '${JSON.stringify(updatedImages)}' WHERE ProductID = ${product.ProductID}`
                console.log(UPDATE)
                await CommonController.commonget(UPDATE)

            }

            return resp.status(200).json({ "Status": 1, "Message": "Products updated successfully", "count": products.length });
        }
        catch (err) {
            console.log(err)
            return resp.status(500).json({ "Status": 0, "Message": "Error in updating products", "Error": err.message });
        }
    }
    ,

    Sendotp_Signup: async (req, resp, next) => {
        try {

            // const keys = Object.keys(req.body);
            var userData = await getuserbymobilenum(req.body.MobileNumber)

            console.log(req.body, 'signup userData____________________')
            var OTP = Math.floor((Math.random() * 8999) + 1000)
            //OTP = 1234
            if (userData.length === 1) {

                if (userData[0]['SignupCompleted'] == 1) {
                    return resp.status(200).json({ "Status": 0, "Message": "User already exists please login" });
                }
                if (req.body.MobileNumber != '9999999999') {

                    await CommonController.sendSms(req.body.MobileNumber, OTP)
                    pool.query("update Users set OTP=? where MobileNumber=?", [OTP, req.body.MobileNumber], function (err, results) {
                        if (err) { return resp.status(400).json({ "Status": 0, "Message": "error in updating otp" }) }
                    })
                }
                return resp.status(200).json({ "Status": 1, "Message": "OTP sent successfully" });
            }

            else if (userData.length == 0) {

                req.body.OTP = OTP
                await CommonController.sendSms(req.body.MobileNumber, OTP)
                while (true) {
                    UserID = Math.floor((Math.random() * 1999999) + 1000000);
                    result = await checkUserID(UserID)
                    logger.info(UserID, result)
                    if (parseInt(result) === 1) break
                } //

                while (true) {
                    var randomString = generateRandomString(10);
                    result = await checkReferral(randomString)
                    logger.info(randomString, result)
                    if (parseInt(result) === 1) break
                } //
                var userDetails = await CreateUser(req.body, UserID, randomString);


                logger.info(userDetails)
                if (typeof (userDetails) == 'object') {
                    return resp.status(200).json({ "Status": 1, "Message": "OTP sent successfully" });
                }
                else {
                    return resp.status(400).json({ "Status": 0, "Message": "Login failed" });
                }
            }
            else {
                return resp.status(400).json({ "Status": 0, "Message": "Login failed" });
            }
        }
        catch (err) {
            logger.info("exception in user login with MobileNumber ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in login with mobile number" });
        }
    },

    // Sendotp_Signup: async (req, resp, next) => {
    //     try {
    //         var userData = await getuserbymobilenum(req.body.MobileNumber);

    //         console.log(req.body, 'signup userData____________________');
    //         var OTP = Math.floor((Math.random() * 8999) + 1000);
    //         OTP = 1234;

    //         if (userData.length === 1) {
    //             if (userData[0]['SignupCompleted'] == 1) {
    //                 return resp.status(200).json({ "Status": 0, "Message": "User already exists, please login" });
    //             }

    //             // Check if OTP has expired (for example, within 10 minutes)
    //             if (userData[0]['OTP'] && Date.now() - new Date(userData[0]['CreatedAt']).getTime() > 10 * 60 * 1000) {
    //                 // Reset OTP and SignupCompleted if expired
    //                 pool.query("UPDATE Users SET OTP = NULL, SignupCompleted = 0 WHERE MobileNumber = ?", [req.body.MobileNumber], function (err, results) {
    //                     if (err) {
    //                         return resp.status(400).json({ "Status": 0, "Message": "Error resetting OTP" });
    //                     }
    //                 });
    //             }

    //             // Proceed with sending OTP only if it's a valid signup request
    //             if (req.body.MobileNumber != '9999999999') {
    //                 SendOTP(req.body.MobileNumber, OTP);
    //                 pool.query("UPDATE Users SET OTP = ? WHERE MobileNumber = ?", [OTP, req.body.MobileNumber], function (err, results) {
    //                     if (err) {
    //                         return resp.status(400).json({ "Status": 0, "Message": "Error in updating OTP" });
    //                     }
    //                 });
    //             }
    //             return resp.status(200).json({ "Status": 1, "Message": "OTP sent successfully" });
    //         } else if (userData.length == 0) {
    //             req.body.OTP = OTP;
    //             SendOTP(req.body.MobileNumber, OTP);
    //             while (true) {
    //                 UserID = Math.floor((Math.random() * 1999999) + 1000000);
    //                 result = await checkUserID(UserID);
    //                 logger.info(UserID, result);
    //                 if (parseInt(result) === 1) break;
    //             }

    //             while (true) {
    //                 var randomString = generateRandomString(10);
    //                 result = await checkReferral(randomString);
    //                 logger.info(randomString, result);
    //                 if (parseInt(result) === 1) break;
    //             }

    //             var userDetails = await CreateUser(req.body, UserID, randomString);

    //             logger.info(userDetails);
    //             if (typeof (userDetails) == 'object') {
    //                 return resp.status(200).json({ "Status": 1, "Message": "OTP sent successfully" });
    //             } else {
    //                 return resp.status(400).json({ "Status": 0, "Message": "Login failed" });
    //             }
    //         } else {
    //             return resp.status(400).json({ "Status": 0, "Message": "Login failed" });
    //         }
    //     } catch (err) {
    //         logger.info("Exception in user signup with MobileNumber ", err);
    //         return resp.status(500).json({ "Status": 0, "Message": "Error in signup with mobile number" });
    //     }
    // },


    // loginwithotp : async (req, resp, next) => {
    //     try {
    //         let Body = req.body
    //         console.log(Body,'Login body')
    //         var userData = await VerifyloginOTP(req.body)
    //         console.log(req.body)

    //         if (typeof (userData) === 'object') {
    //             req.userData=userData
    //             logger.info(req.userData)
    //             if(Body.FirstName !== undefined){
    //                 let updateusers = `update Users set SignupCompleted=1,FirstName='${Body.FirstName}',EmailID='${Body.EmailID}' where UserID=${req.userData.UserID}`
    //                 let update_Users = await CommonController.commonget(updateusers)
    //             }
    //             next();
    //             // return resp.status(200).json({ "Status": 1, "userDetails": userData, "Message": "User Login successful","token":token });
    //             }
    //         else if(userData==2){
    //             return resp.status(400).json({ "Status": 0, "Message": "Incorrect OTP" });
    //         }            
    //         else {
    //             return resp.status(400).json({ "Status": 0, "Message": "Login failed" });
    //         }
    //     }
    //     catch (err) {
    //         logger.info("exception in user login with MobileNumber ", err);
    //         return resp.status(500).json({ "Status": 0, "Message": "Error in login with mobile number" });
    //     }
    // },  

    loginwithotp: async (req, resp, next) => {
        try {
            let Body = req.body || {};

            var userData = await VerifyloginOTP(Body);

            if (typeof (userData) === 'object') {
                req.userData = userData;
                logger.info(req.userData);

                // Update SignupCompleted to 1 after successful OTP verification
                let updateResult = await CommonController.commonget("UPDATE Users SET SignupCompleted = 1 WHERE UserID = ?", [req.userData.UserID]);

                // If additional user data like FirstName, EmailID is provided, update those as well
                if (Body.FirstName !== undefined) {
                    await CommonController.commonget("UPDATE Users SET FirstName = ?, EmailID = ? WHERE UserID = ?", [Body.FirstName, Body.EmailID || null, req.userData.UserID]);
                }

                next(); // Proceed with the next middleware
            } else if (userData == 2) {
                return resp.status(400).json({ "Status": 0, "Message": "Incorrect OTP" });
            } else {
                return resp.status(400).json({ "Status": 0, "Message": "Login failed" });
            }
        } catch (err) {
            logger.info("Exception in user login with MobileNumber ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in login with mobile number" });
        }
    },


    Sendotp_Login: async (req, resp, next) => {
        try {

            // const keys = Object.keys(req.body);
            var userData = await getuserbymobilenum(req.body.MobileNumber)

            console.log(req.body, 'signup userData____________________')
            var OTP = Math.floor((Math.random() * 8999) + 1000)
            //OTP = 1234
            if (userData.length === 1) {

                if (req.body.MobileNumber != '9999999999') {

                    await CommonController.sendSms(req.body.MobileNumber, OTP)
                    pool.query("update Users set OTP=? where MobileNumber=?", [OTP, req.body.MobileNumber], function (err, results) {
                        if (err) { return resp.status(400).json({ "Status": 0, "Message": "error in updating otp" }) }
                    })
                }
                return resp.status(200).json({ "Status": 1, "Message": "OTP sent successfully" });
            }
            else {
                return resp.status(200).json({ "Status": 0, "Message": "User doesnot exists please register" });
            }


        }
        catch (err) {
            logger.info("exception in user login with MobileNumber ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in login with mobile number" });
        }
    },


    Signup: async (req, resp, next) => {
        try {
            let Body = req.body || {};
            // Only the authenticated user can complete their own signup.
            const uid = req.UserID;
            if (!Body.FirstName || !uid) {
                return resp.status(400).json({ "Status": 0, "Message": "FirstName and UserID are required for signup" });
            }
            await CommonController.commonget("update Users set SignupCompleted=1, FirstName = ?, EmailID = ? where UserID = ?", [Body.FirstName, Body.EmailID || null, uid]);
            req.userData = { "UserID": uid, "FirstName": Body.FirstName, "profilePic": "NA" };
            next();
        }
        catch (err) {
            logger.info("exception in user login with MobileNumber ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in login with mobile number" });
        }
    },



    homepage: async (req, resp, next) => {
        try {
            // logger.info('homepage')
            var bannerresult = await getactivebanners()
            query = `select P.* from RecommendedProducts Rp 
                            inner join Products P on P.ProductID=Rp.ProductID 
                            inner join ProductVariants PV on Rp.ProductID=PV.ProductID 
                            where P.Status=1 and Rp.Status=1 and PV.AvailableQty>0 and
                            PV.Status=1 group by P.ProductID limit 0,30
                            `
            let results = await CommonController.getproducts(query);

            query = "select C.CategoryID,C.CategoryName,C.ImageUrl from Categories C \
            inner join SubCategories S on S.CategoryID=C.CategoryID\
            inner join Products p on p.SubCategoryID=S.SubCategoryID\
             inner join ProductVariants pv on p.ProductID=pv.ProductID\
                where C.Status=1 and S.Status=1 and p.Status=1 and pv.Status=1 and pv.AvailableQty>0 group by C.CategoryID order by C.Priority asc limit 0,7"
            let categoriesresult = await CommonController.getcategories(query);

            FinalProducts = await fetchDynamicHomeSections(req.UserID);
            return resp.status(200).json({ "Status": 1, "Notifications": 0, "Banners": bannerresult, "SpecialCategories": categoriesresult, "BestItems": results, "HomePageSectionProducts": FinalProducts })

        }
        catch (e) {
            console.log('err', e)
            return resp.status(400).json({ "Status": 0, "Message": 'error' })
        }
    },


    HomepageSection_Products: async (req, resp, next) => {
        try {
            const FinalProducts = await fetchDynamicHomeSections(req.UserID);
            resp.json({ "status": 1, "Sections": FinalProducts, "HomePageSectionProducts": FinalProducts })
        } catch (error) {
            logger.info(error)
            return resp.json({ "status": 0, "Message": 'error' })
        }
    },

    Add_Wallet_Money: async (req, resp, next) => {
        try {

            console.log('Order Body', req.body)
            var body = req.body
            var RazorpayOrderID = body.RazorpayOrderID;
            let signaturebody = RazorpayOrderID + "|" + body.razorpay_payment_id;
            console.log(signaturebody)
            var expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAYSECRET).update(signaturebody.toString()).digest('hex');

            console.log("sig received ", body.razorpay_signature);
            console.log("sig generated ", expectedSignature);

            if (expectedSignature != body.razorpay_signature) {
                return resp.json({ 'Status': 0, "Message": "invalid signature" })
            }
            else {
                paymentdetails = await getpaymentdetails(body.razorpay_payment_id)
                console.log(paymentdetails, 'payment details')
                body.PaymentTransactionID = paymentdetails.id;
                body.PaymentStatus = 1
            }


            await CommonController.Add_To_Wallet(req.UserID, 3, req.UserID, body.Amount)
            await CommonController.save_to_users_wallets(req.UserID, body.Amount)

            return resp.status(200).json({ "Status": 1, "Message": "Money added to wallet successfully" });

        }
        catch (err) {
            console.log("exception in adding orders ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in adding orders" });
        }
    },

    Wallets: async (req, resp, next) => {
        try {

            GetWallets = `select * from Wallets where UserID=${req.UserID} order by CreatedAt desc`
            let Result = await CommonController.commonget(GetWallets)
            // logger.info(Result,'Result')
            WalletAmount = 0
            let GetUsers = `select * from Users where UserID=${req.UserID}`
            let ResultUsers = await CommonController.commonget(GetUsers)
            if (ResultUsers.length > 0) {
                WalletAmount = ResultUsers[0].WalletAmount
            }

            resp.json({ "status": 1, "Wallets": Result, "WalletAmount": WalletAmount })
        } catch (error) {
            logger.info(error)
            return resp.json({ "status": 0, "Message": 'error' })
        }
    },

    HomepageSection_Products_all: async (req, resp, next) => {
        try {
            GetSection_Products = "select p.* from HomeSectionProducts hp inner join Products p on\
                    p.ProductID=hp.ProductID where p.Status=1 and \
                    hp.HomeSectionID="+ pool.escape(req.params.HomeSectionId)
            let ProductResult = await CommonController.getproducts(GetSection_Products)
            resp.json({ "status": 1, "Products": ProductResult })

        } catch (error) {
            logger.info(error)
            return resp.json({ "status": 0, "Message": 'error' })
        }
    },

    Userdetail: async (req, resp, next) => {
        try {
            let GetUser = "select * from Users where Status!=0 and UserID=" + req.UserID + ";"
            console.log(GetUser, 'GetUser')
            let GetUser_Result = await CommonController.commonget(GetUser)
            if (GetUser_Result.length > 0) {
                console.log(GetUser_Result)
                if (GetUser_Result[0].ProfilePic != "NA") {
                    GetUser_Result[0].ProfilePic = users_s3 + GetUser_Result[0].ProfilePic
                }
                resp.json({ "status": 1, "Users": GetUser_Result[0] })
            }
            else {
                resp.json({ "Status": 1, "Users": {} })
            }
        }
        catch (error) {
            logger.info(error, 'error in getting user details')
            return resp.json({ "status": 0, "Message": 'error in getting user details' })
        }
    },

    updateuser: async (req, resp, next) => {
        try {
            const UserID = req.UserID
            const Body = req.body || {}
            Body.ReferredBy = Body.ReferredByCode


            if (Body.ProfilePic != null || Body.ProfilePic != undefined) {
                await ConvertImage(req.UserID, Body.ProfilePic)
            }

            const sets = [];
            const params = [];
            const setField = (column, value) => {
                if (value !== null && value !== undefined) {
                    sets.push(`${column} = ?`);
                    params.push(value);
                }
            };
            setField('FirstName', Body.FirstName);
            setField('FCMToken', Body.FCMToken);
            setField('LastName', Body.LastName);
            setField('ReferredBy', Body.ReferredBy);

            if (Body.EmailID != null || Body.EmailID != undefined) {
                let EmailExists = await CheckUser_Email(Body.EmailID, UserID)
                if (EmailExists == 1) {
                    return resp.json({ "Status": 0, "Message": "Email already exists" })
                }
                setField('EmailID', Body.EmailID);
            }

            if (sets.length === 0) {
                if (Body.ProfilePic != null || Body.ProfilePic != undefined) {
                    return resp.status(200).json({ "Status": 1, "Message": "User Update Successful" });
                }
                return resp.status(200).json({ "Status": 0, "Message": "No changes to update" });
            }
            params.push(req.UserID);
            let update_UserDetails = await CommonController.CommonUpdate_Function("UPDATE Users SET " + sets.join(', ') + " WHERE UserID = ?", params)
            if (update_UserDetails == 1) {
                console.log(Body.ReferredBy, 'req.body.ReferredBy', Body.ReferredBy != undefined)
                if (Body.ReferredBy != undefined) {
                    let referralCredited = false;
                    try {
                        const ReferralRewards = require('./ReferralRewards');
                        const outcome = await ReferralRewards.processReward({
                            referredUserId: req.UserID,
                            triggerEvent: 'registration'
                        });
                        if (outcome && outcome.success) {
                            referralCredited = true;
                        }
                    } catch (refErr) {
                        console.error("Error in registration ReferralRewards.processReward:", refErr);
                    }
                    if (!referralCredited) {
                        let ResultReferral = await CommonController.commonget("select * from Users where MyReferralCode = ?", [Body.ReferredBy])
                        if (ResultReferral.length > 0) {
                            await CommonController.Referred_Amount_Details(ResultReferral[0]['UserID'], UserID, 0, 'USER')
                        }
                    }

                }
                return resp.status(200).json({ "Status": 1, "Message": "User Update Successful" });
            }
            else {
                return resp.status(200).json({ "Status": 0, "Message": "No changes to update" });
            }

        }
        catch (err) {
            logger.info("exception in updating user ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in updating user" });
        }
    },

    addFeedback: async (req, resp, next) => {
        try {
            const body = req.body;
            const userId = req.UserID;

            if (!userId) {
                return resp.status(401).json({ "Status": 0, "Message": "Unauthorized: User authentication required" });
            }

            const rawRating = body.Rating !== undefined ? body.Rating : (body.rating !== undefined ? body.rating : null);
            const rating = parseInt(rawRating, 10);
            if (isNaN(rating) || rating < 1 || rating > 5) {
                return resp.status(400).json({ "Status": 0, "Message": "Rating must be an integer between 1 and 5" });
            }

            const orderId = body.OrderID ? parseInt(body.OrderID, 10) : (body.orderId ? parseInt(body.orderId, 10) : null);
            if (!orderId) {
                return resp.status(400).json({ "Status": 0, "Message": "A valid OrderID is required to submit feedback" });
            }

            const message = (body.Message && body.Message.trim()) ? body.Message.trim() : (body.message && body.message.trim() ? body.message.trim() : null);
            if (message && message.length > 1000) {
                return resp.status(400).json({ "Status": 0, "Message": "Feedback message cannot exceed 1000 characters" });
            }

            const category = body.Category || body.category || 'Order Experience';

            // 1. Verify Order exists, belongs to this customer, and is delivered
            const orderRows = await new Promise((resolve, reject) => {
                pool.query("SELECT OrderID, UserID, OrderStatus, GrandTotal FROM Orders WHERE OrderID = ?", [orderId], (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                });
            });

            if (!orderRows || orderRows.length === 0) {
                return resp.status(404).json({ "Status": 0, "Message": "Order not found" });
            }

            const order = orderRows[0];
            if (order.UserID !== userId) {
                return resp.status(403).json({ "Status": 0, "Message": "Unauthorized: You can only submit feedback for your own orders" });
            }

            // Authoritative delivered check (OrderStatus = 1 is delivered)
            if (order.OrderStatus !== 1) {
                return resp.status(400).json({ "Status": 0, "Message": "Feedback can only be submitted after the order has been delivered" });
            }

            // 2. Prevent duplicate feedback submissions for the same order
            const existingFeedback = await new Promise((resolve, reject) => {
                pool.query("SELECT FeedbackID, Status, RewardStatus, CreatedAt FROM Feedback WHERE UserID = ? AND OrderID = ?", [userId, orderId], (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                });
            });

            if (existingFeedback.length > 0) {
                return resp.status(400).json({
                    "Status": 0,
                    "Message": "Feedback has already been submitted for this order.",
                    "alreadySubmitted": true,
                    "FeedbackID": existingFeedback[0].FeedbackID
                });
            }

            // 3. Check Feedback Reward Program configuration from Settings
            let rewardEnabled = true;
            let rewardAmount = 20.00;
            try {
                const settingRows = await new Promise((resolve) => {
                    pool.query("SELECT SettingKey, SettingValue FROM Settings WHERE SettingKey IN ('FeedbackRewardAmount', 'FeedbackRewardEnabled')", (err, rows) => {
                        resolve(rows || []);
                    });
                });
                for (const s of settingRows) {
                    if (s.SettingKey === 'FeedbackRewardAmount') {
                        const val = parseFloat(s.SettingValue);
                        if (!isNaN(val) && val >= 0) rewardAmount = val;
                    }
                    if (s.SettingKey === 'FeedbackRewardEnabled') {
                        rewardEnabled = (s.SettingValue === '1' || s.SettingValue === 'true');
                    }
                }
            } catch (err) {
                console.error("Error reading feedback reward settings:", err);
            }

            const initialRewardStatus = (rewardEnabled && rewardAmount > 0) ? 'pending' : 'not_eligible';
            const initialRewardAmount = (rewardEnabled && rewardAmount > 0) ? rewardAmount : 0.00;

            const insertData = {
                UserID: userId,
                OrderID: orderId,
                Message: message,
                Rating: rating,
                Category: category,
                Status: 'pending',
                RewardStatus: initialRewardStatus,
                RewardAmount: initialRewardAmount,
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            };

            const insertResult = await new Promise((resolve, reject) => {
                pool.query("INSERT INTO Feedback SET ?", insertData, (err, res) => {
                    if (err) return reject(err);
                    resolve(res);
                });
            });

            // 4. Send customer confirmation notification
            try {
                const note = {
                    Title: "Feedback Received!",
                    Message: `Thank you for rating Order #${orderId}! Your feedback has been received and may be reviewed by the ClikGett team.`
                };
                await CommonController.Send_Notification(note, userId);
            } catch (notiErr) {
                console.error("Error sending feedback confirmation notification:", notiErr);
            }

            return resp.status(200).json({
                "Status": 1,
                "Message": "Feedback submitted successfully! Thank you for sharing your experience.",
                "FeedbackID": insertResult.insertId,
                "RewardStatus": initialRewardStatus,
                "RewardAmount": initialRewardAmount,
                "RewardEligible": rewardEnabled && rewardAmount > 0
            });
        }
        catch (err) {
            console.error("exception in adding feedback:", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in adding feedback" });
        }
    },

    checkFeedbackEligibility: async (req, resp, next) => {
        try {
            const userId = req.UserID;
            const orderId = parseInt(req.params.orderId, 10);

            if (!userId) {
                return resp.status(401).json({ "Status": 0, "Message": "Unauthorized" });
            }
            if (!orderId) {
                return resp.status(400).json({ "Status": 0, "Message": "Valid OrderID required" });
            }

            // Fetch order
            const orderRows = await new Promise((resolve, reject) => {
                pool.query("SELECT OrderID, UserID, OrderStatus, GrandTotal FROM Orders WHERE OrderID = ?", [orderId], (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                });
            });

            if (!orderRows || orderRows.length === 0) {
                return resp.status(404).json({ "Status": 0, "Message": "Order not found" });
            }

            const order = orderRows[0];
            if (order.UserID !== userId) {
                return resp.status(403).json({ "Status": 0, "Message": "Unauthorized: Not your order" });
            }

            const isDelivered = (order.OrderStatus === 1);

            // Check existing feedback
            const existing = await new Promise((resolve, reject) => {
                pool.query("SELECT FeedbackID, Rating, Message, Status, RewardStatus, RewardAmount, CreatedAt FROM Feedback WHERE UserID = ? AND OrderID = ?", [userId, orderId], (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                });
            });

            // Read reward program settings
            let rewardEnabled = true;
            let rewardAmount = 20.00;
            try {
                const settingRows = await new Promise((resolve) => {
                    pool.query("SELECT SettingKey, SettingValue FROM Settings WHERE SettingKey IN ('FeedbackRewardAmount', 'FeedbackRewardEnabled')", (err, rows) => {
                        resolve(rows || []);
                    });
                });
                for (const s of settingRows) {
                    if (s.SettingKey === 'FeedbackRewardAmount') {
                        const val = parseFloat(s.SettingValue);
                        if (!isNaN(val) && val >= 0) rewardAmount = val;
                    }
                    if (s.SettingKey === 'FeedbackRewardEnabled') {
                        rewardEnabled = (s.SettingValue === '1' || s.SettingValue === 'true');
                    }
                }
            } catch (err) {
                console.error("Error reading feedback reward settings:", err);
            }

            return resp.json({
                "Status": 1,
                "OrderID": orderId,
                "isDelivered": isDelivered,
                "alreadySubmitted": existing.length > 0,
                "feedback": existing.length > 0 ? existing[0] : null,
                "rewardProgram": {
                    "enabled": rewardEnabled,
                    "amount": rewardAmount,
                    "terms": `Submit honest feedback on your delivered order for a chance to receive ₹${rewardAmount.toFixed(2)} cashback in your ClikGett wallet upon admin review.`
                }
            });
        } catch (err) {
            console.error("Error checking feedback eligibility:", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error checking feedback eligibility" });
        }
    },

    notifications: async (req, resp, next) => {
        try {
            query = "SELECT NotificationID,UserID,Title,Status,Type,Message,CONVERT_TZ(CreatedAt, '+00:00', '+05:30') AS CreatedAt,\
            UpdatedAt,IsRead FROM UserNotifications where UserID="+ req.UserID + " order by CreatedAt desc"
            let results = await CommonController.commonget(query);

            let NotificationLastSeen = `update Users set NotificationLastSeen=? where 
                UserID=${req.UserID}`;
            let UpdateLastseen = await CommonController.Update_NotificationLastSeen(NotificationLastSeen)


            resp.json({ "Status": 1, "Notifications": results })
        }
        catch (e) {
            logger.info(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },

    UserNotification_Update: async (req, resp, next) => {
        try {
            let Body = req.body
            logger.info(req.body, 'req.body')

            const IsRead = (Body.IsRead != null || Body.IsRead != undefined) ? (parseInt(Body.IsRead, 10) ? 1 : 0) : null;
            // Users may only update their own notifications.
            const queryString = "UPDATE UserNotifications SET IsRead = COALESCE(?, IsRead) WHERE NotificationID = ? AND UserID = ?";
            return new Promise(function (resolve, reject) {
                pool.query(queryString, [IsRead, req.params.NotificationID, req.UserID], function (err, result, fields) {
                    if (err) {
                        logger.info("Error in updating the DB:" + err);
                        return resp.status(400).json({ "Status": 0, "Message": "Error in updating the DB" });


                    }
                    else {
                        logger.info("update :" + result.affectedRows);
                        if (result.affectedRows > 0) {
                            logger.info('update successful')
                            return resp.status(200).json({ "Status": 1, "Message": "User Notification Update Successful" });
                        }
                        else {
                            logger.info("user update failed", err, queryString);
                            return resp.status(200).json({ "Status": 0, "Message": "No changes to update" });
                        }

                    }
                });
            });
        }
        catch (err) {
            logger.info("exception in updating User Notification ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in updating User Notification" });
        }
    },

    getSettings: async (req, resp, next) => {
        try {
            query = "select * from Settings"
            let results = await CommonController.commonget(query);
            // for(let iterator of results){
            //     console.log(iterator.SettingKey,'settings')
            //     if(iterator.SettingKey === "DeliveryTypes"){
            //         iterator.SettingValue = JSON.parse(iterator.SettingValue)
            //     } 
            // }
            resp.json({ "Status": 1, "Settings": results })
        }
        catch (e) {
            logger.info(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },

    deleteAccount: async (req, resp, next) => {
        try {
            query = `update Users set Status=1 where UserID=${req.UserID}`
            console.log(query, 'delete query')
            let results = await CommonController.commonget(query);

            resp.json({ "Status": 1, "Settings": "User Deleted Successfully" })
        }
        catch (e) {
            logger.info(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },

}

function getuserbymobilenum(MobileNumber) {
    try {
        return new Promise(function (resolve, reject) {
            pool.query("select * from Users where MobileNumber=? and Status=1", [MobileNumber], async (err, results) => {
                console.log('get user by mobile number ', results, err)
                resolve(results)
            });
        });
    }
    catch (err) {
        logger.info("error in retrieving wallet balance");
        return -1;
    }
}

function getproductvariants(ProductID) {
    try {
        return new Promise(function (resolve, reject) {
            pool.query("select * from ProductVariants where ProductID=?", [ProductID], async (err, results) => {

                if (err) {
                    logger.info("exception in retrieving product varaints", err);
                    return reject(-1)
                }

                else {

                    resolve(results)
                }

            });
        });
    }
    catch (err) {
        logger.info("error in retrieving product varaints", err);
        return reject(-1)
    }
}

function VerifyloginOTP(inputs) {
    return new Promise(function (resolve, reject) {
        if (!inputs || inputs.OTP === undefined || inputs.OTP === null || !inputs.MobileNumber) {
            return resolve(2);
        }
        var myQuery = "select * from Users where Status=1 and OTP = ? and MobileNumber = ?";
        pool.query(myQuery, [String(inputs.OTP), String(inputs.MobileNumber)], function (err, results) {
            if (err) {
                logger.info("error checking verify MobileNumber table: ", err);
                return reject(0)
            }

            if (results.length > 0) {
                var data = { "UserID": results[0]['UserID'], "FirstName": results[0]['FirstName'], "profilePic": "NA" }
                resolve(data)
            }
            else {
                logger.info("Entered incorrect OTP");
                resolve(2);
            }

        });
    });
}

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

// function SendOTP(MobileNumber, OTP) {
//     try {
//         var http = require("https");
//         message = `/send/?apikey=${ process.env.SMS_APIKEY }&numbers=91${MobileNumber}&sender=SMARPG&message=Dear user, Your one time verification code is ${OTP}. Please DO NOT share this OTP with anyone. From mTouch Labs`
//         // message ="Your FaVMall login OTP is "+OTP+". Please do not share this with anyone. OTP expires in 30 mins. From team FavMall"
//         var options = {
//             "method": "GET",
//             "hostname": "api.bulksmsgateway.in",
//             "port": null,
//             "path": encodeURI("/sendmessage.php?user=fnvmall&password=2758963&mobile="+MobileNumber+"&message="+message+"&sender=FAVMAL&type=3&template_id=1207165270747467244"),
//             "headers": {
//                 "content-type": "application/json"
//             }
//         };


//         logger.info(options,'options');
//         var req = http.request(options, function (res) {
//             var chunks = [];

//             res.on("data", function (chunk) {
//                 chunks.push(chunk);
//             });
//             logger.info(chunks,'chunk')
//             res.on("end", function () {
//                 var body = Buffer.concat(chunks);
//                 logger.info("Success in Send OTP:", body.toString());
//             });
//         });

//         // req.write("{\"DLT_TE_ID\":\"1207161798564977983\"}");
//         req.end();
//     }
//     catch (err) { logger.info("error sending OTP: ", err); }
// }

function CreateUser(inputs, UserID, MyReferralCode) {
    try {
        return new Promise(function (resolve, reject) {
            logger.info(inputs, 'inputs')

            if (inputs.FirstName == null || inputs.FirstName == undefined)
                inputs.FirstName = 'NA'

            if (inputs.LastName == null || inputs.LastName == undefined)
                inputs.LastName = 'NA'

            if (inputs.EmailID == null || inputs.EmailID == undefined)
                inputs.EmailID = 'NA'


            let InsertUsers = {
                UserID: UserID, MobileNumber: inputs.MobileNumber, EmailID: inputs.EmailID,
                OTP: inputs.OTP, FirstName: inputs.FirstName, profilePic: 'NA', LastName: inputs.LastName,
                Status: 1, FCMToken: "NA", MyReferralCode: MyReferralCode, SignupCompleted: 0,
                ReferredBy: inputs.ReferredByCode || 'NA'
            }

            let sql = "INSERT INTO Users set ?";

            pool.query(sql, InsertUsers, (err, results) => {
                if (err) console.log('db error', err.sqlMessage || err.message); results = results || { affectedRows: 0 };  // never crash on a failed query
                logger.info('post method', results, err)
                if (results.affectedRows === 1) {
                    logger.info("Added to Users table: ", results.affectedRows);
                    var data = { "UserID": UserID, "MobileNumber": inputs.MobileNumber, "profilePic": "NA" }
                    resolve(data);
                }
                else {
                    logger.info("error in insert user to table ", results.affectedRows);
                    reject(0);
                }
            });


        });
    }
    catch (err) {
        return 0;
    }
}

function checkUserID(UserID) {

    return new Promise(function (resolve, reject) {
        pool.query("select * from Users where UserID = ?", [UserID], function (err, results, fields) {
            if (err) {
                logger.info("Error in checking UserID from DB :" + err);
                reject(0);
            }
            else {

                logger.info(parseInt(results.length), 'id length')
                if (parseInt(results.length) === 1) {
                    logger.info("UserID exists : " + UserID);
                    resolve(0);

                }
                else {

                    logger.info("UserID not exists :" + UserID);
                    resolve(1);

                }
            }
        });
    });
}

function checkReferral(MyReferralCode) {

    return new Promise(function (resolve, reject) {
        pool.query("select * from Users where MyReferralCode = ?", [MyReferralCode], function (err, results, fields) {
            if (err) {
                logger.info("Error in checking UserID from DB :" + err);
                reject(0);
            }
            else {

                logger.info(parseInt(results.length), 'id length')
                if (parseInt(results.length) === 1) {
                    logger.info("UserID exists : " + UserID);
                    resolve(0);

                }
                else {

                    logger.info("UserID not exists :" + UserID);
                    resolve(1);

                }
            }
        });
    });
}


function getactivebanners() {
    try {

        return new Promise(function (resolve, reject) {
            var query = ""
            query = "select * from Banners where Status=1"

            pool.query(query, function (err, results, fields) {
                if (err) {
                    logger.info("Error in checking ID from DB :" + err);
                    reject(-1);
                }
                else {

                    if (results.length > 0) {
                        for (var j = 0; j < results.length; j++) {
                            if (results[j].ImageUrl && results[j].ImageUrl !== "NA") {
                                if (!results[j].ImageUrl.startsWith("http://") && !results[j].ImageUrl.startsWith("https://")) {
                                    results[j].ImageUrl = banner_s3 + results[j].ImageUrl;
                                }
                            } else if (results[j].BannerImage && results[j].BannerImage !== "NA") {
                                if (!results[j].BannerImage.startsWith("http://") && !results[j].BannerImage.startsWith("https://")) {
                                    results[j].ImageUrl = banner_s3 + results[j].BannerImage;
                                } else {
                                    results[j].ImageUrl = results[j].BannerImage;
                                }
                            }
                        }
                    }
                    logger.info(results)
                    resolve(results)
                }
            });
        });
    }
    catch (err) {
        logger.info("exception in checking banners", err);
        reject(-1);
    }
}

function getactiivecategories() {
    try {

        return new Promise(function (resolve, reject) {
            var query = ""
            query = "select * from Categories where Status=1"

            pool.query(query, function (err, results, fields) {
                if (err) {
                    logger.info("Error in checking ID from DB :" + err);
                    reject(-1);
                }
                else {

                    if (results.length > 0) {
                        for (var j = 0; j < results.length; j++) {
                            if (results[j].ImageUrl != "NA") {
                                results[j].ImageUrl = category_s3 + results[j].ImageUrl
                            }
                        }
                    }

                    resolve(results)
                }
            });
        });
    }
    catch (err) {
        logger.info("exception in checking banners", err);
        reject(-1);
    }
}

function subcategoriesbycategories(CategoryID) {
    try {
        return new Promise(function (resolve, reject) {
            pool.query("select SubCategoryID,SubCategoryName from SubCategories where CategoryID=? and Status=1 order by rand() limit 0,1", [CategoryID], async (err, results) => {

                if (err) {
                    logger.info('err subcategoriesbycategories')
                    return reject(-1);
                }
                else {

                    logger.info("retrived Products : ", results.length);
                    resolve(results)
                }


            });
        });
    }
    catch (err) {
        logger.info("error in retrieving Products");
        return reject(-1)
    }
}

function CheckUser_Email(EmailID, UserID) {
    var queryString = "";
    queryString = "select * from Users where EmailID = ? and UserID != ?";

    return new Promise(function (resolve, reject) {
        pool.query(queryString, [EmailID, UserID], function (err, results, fields) {
            if (err) {
                //mysqlConn.end();
                logger.info("Error in checking UserID from DB :" + err);
                reject(0);
            }
            else {
                //mysqlConn.end();
                if (results.length > 0) {
                    logger.info("emailid is already in use");
                    resolve(1);
                }
                else {
                    logger.info("emailid is not in use : " + results.length);
                    resolve(0);
                }
            }
        });
    });
}

function ConvertImage(UserID, ProfilePic) {
    try {
        return new Promise(function (resolve, reject) {

            let base64String = 'data:image/png;base64,' + ProfilePic; // Not a real image 
            let base64Image = base64String.split(';base64,').pop();
            var imagename = Date.now() + "_" + UserID + '.png'
            logger.info(imagename, 'imagename')
            image = "ProfilePic=" + pool.escape(imagename) + "";
            fs.writeFile("images/" + imagename, base64Image, { encoding: 'base64' }, function (err) {

                const fileContent = fs.readFileSync("images/" + imagename);
                const params = {
                    Bucket: process.env.bucketname, Key: 'Users/' + imagename,
                    Body: fileContent,
                    ACL: 'public-read'
                };
                logger.info(params)
                s3.upload(params, function (err, data) {
                    if (err) {
                        logger.info(err)
                        return resolve(-1)
                    }
                    logger.info("UPDATE Users SET " + image + " WHERE UserID=" + UserID)
                    pool.query("UPDATE Users SET " + image + " WHERE UserID=" + UserID + ";", function (err, results, fields) { })

                    logger.info(`File uploaded successfully. ${data.Location}`);



                });
            });

            return resolve(1)
        });
    }
    catch (err) {
        logger.info(err)
        resolve(-1)
    }
}


function updateFCMToken(FCMToken, UserID) {
    try {
        return new Promise(function (resolve, reject) {

            const query = "update Users set FCMToken = ? where UserID = ?"
            pool.query(query, [FCMToken, UserID], function (error, results, fields) {
                if (error) {
                    logger.info("Error in FCMToken update:" + error);
                }
                else {
                    resolve(1)
                }
            });

        });
    }
    catch (err) {
        logger.info("Error in FCMToken update:" + error);
        resolve(0);
    }
}

function createinvoice(orderresult, orderitems, shopaddress) {

    return new Promise(async function (resolve, reject) {
        console.log.debug('pdf started')
        // console.log('pdf started',orderitems)

        const doc = new PDFDocument({
            size: [79, 210], // Width: 79mm, Height: 210mm (A4 height)
            margin: 2, // No margin
        });


        invdate = moment(orderresult['created'], 'yyyy-MM-dd').format('DDMM');
        filename = "INV" + invdate.toString() + "_" + Date.now() + ".pdf"
        // filename="TESTINV.pdf"

        Order_Date = new Date(orderresult['created'])
        issuedate = moment(Order_Date, 'yyyy-MM-dd').format('yyyy-MM-DD');

        doc.pipe(fs.createWriteStream("images/" + filename));

        const shoplines = shopaddress.split(' ').reduce((result, element, index) => {
            if (index % 7 === 0) result.push([]);
            result[result.length - 1].push(element);
            return result;
        }, []).map(line => line.join(' '));
        console.log(shoplines)
        var shop_address = shoplines.join('\n');
        shop_address = shop_address
        doc.fill('black').fontSize(4).font('Helvetica-Bold').text('Omnimart', 25, 5);
        doc.fontSize(2).font('Helvetica-Bold').text(shop_address, 15, 10);

        const invoiceno = orderresult['orderid'].replace("HM", "INV");

        doc.fontSize(2).font('Helvetica-Bold').text("GSTIN : 36AADCO9556B1ZD", 15, 18);
        doc.fontSize(2).font('Helvetica-Bold').text("CustomerInfo", 5, 27);

        doc.fontSize(2).font('Helvetica').text("Name : " + orderresult['username'], 5, 33);
        doc.fontSize(2).font('Helvetica').text("Order No : " + orderresult['orderid'], 5, 36);

        doc.fontSize(2).font('Helvetica').text("Issue Date : " + issuedate, 45, 36);

        // doc.moveTo(0,40).lineTo(650, 40).fill('gray').stroke();
        var string = String("-").padStart(110, "-")
        doc.fontSize(2).font('Helvetica').text(string, 2, 40);

        doc.fill('black').fontSize(2).font('Helvetica-Bold').text('Item', 5, 44);
        doc.fontSize(2).font('Helvetica-Bold').text('Qty', 50, 44);
        doc.fontSize(2).font('Helvetica-Bold').text('Price', 60, 44);
        doc.fontSize(2).font('Helvetica-Bold').text('Amt', 70, 44);

        doc.fontSize(2).font('Helvetica').text(string, 2, 47);
        // doc.moveTo(0,47).lineTo(650, 47).fill('gray').stroke();

        line1 = 47
        // lin2=65

        var products_in_page_1 = 22
        var products_in_newpage = 29
        var itemsqty = 0

        var TotalGst = 0
        var gst = 0


        if (orderitems.length > products_in_page_1) {
            //if products length more than 10
            for (var j = 0; j < products_in_page_1; j++) {
                //first page of pdf
                if (j < products_in_page_1) {
                    itemsqty = itemsqty + orderitems[j]['quantity']
                    if (orderitems[j]['gst'] == undefined) {
                        orderitems[j]['gst'] = 0
                    }

                    gst = (orderitems[j]['dmrp'] * orderitems[j]['quantity']) / (1 + (orderitems[j]['gst'] / 100))

                    gst = (orderitems[j]['dmrp'] * orderitems[j]['quantity']) - gst

                    TotalGst = parseFloat(TotalGst) + parseFloat(gst)
                    console.log(parseFloat(TotalGst), parseFloat(gst), 'totalgst')
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
            console.log.debug(noofpages, 'noofpages')

            var num = products_in_page_1

            for (var i = 0; i < noofpages; i++) {
                //to add new page added
                doc.addPage()
                newline1 = 0
                for (var k = num; k < num + products_in_newpage; k++) {

                    if (k < itemslength) {
                        itemsqty = itemsqty + orderitems[k]['quantity']
                        // orderitems[k]['gst'] =1  
                        if (orderitems[k]['gst'] == undefined) {
                            orderitems[k]['gst'] = 0
                        }
                        gst = (orderitems[k]['dmrp'] * orderitems[k]['quantity']) / (1 + (orderitems[k]['gst'] / 100))

                        gst = (orderitems[k]['dmrp'] * orderitems[k]['quantity']) - gst

                        TotalGst = parseFloat(TotalGst) + parseFloat(gst)
                        console.log(parseFloat(TotalGst), parseFloat(gst), 'totalgst')

                        newline2 = newline1 + 15
                        newline1 = newline1 + 7
                        await invoiceproducts(doc, orderitems[k], newline1, newline2)
                    }
                }
                num = num + products_in_newpage
                if (k > itemslength) {
                    break
                }
            }
            console.log(itemsqty, '*********************************')
            console.log(TotalGst, '*********************************')
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
                var line2 = line1 + 15
                var line1 = line1 + 7
                console.log(line1, "*******************************************************")
                console.log(line2, "*******************************************************")
                itemsqty = itemsqty + orderitems[j]['quantity']
                if (orderitems[j]['gst'] == undefined) {
                    orderitems[j]['gst'] = 0
                }
                gst = (orderitems[j]['dmrp'] * orderitems[j]['quantity']) / (1 + (orderitems[j]['gst'] / 100))
                gst = (orderitems[j]['dmrp'] * orderitems[j]['quantity']) - gst
                TotalGst = parseFloat(TotalGst) + parseFloat(gst)
                console.log(parseFloat(TotalGst), parseFloat(gst), 'totalgst')
                await invoiceproducts(doc, orderitems[j], line1, line2)
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

        console.log.debug('file ended')
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
                throw err;
            }
            location = data.Location
            console.log(`File uploaded successfully. ${data.Location}`);
            try {
                // 
                let queryx = {
                    orderid: orderresult['orderid']
                }
                fndupdchanges = {
                    $set: { invoicefile: 'https://heyman-new.s3.amazonaws.com/orderinvoice/' + filename }
                };
                console.log(queryx, fndupdchanges)
                orderupdate = await orders.updateOne(queryx, fndupdchanges)
                console.log(orderupdate)
            }
            catch (e) {
                console.log.debug('file not found')
            }
            console.log("PDF upload success");

        });

        resolve(1)



    });
}


function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        result += chars[randomIndex];
    }
    return result;
}



function getpaymentdetails(paymentId) {

    return new Promise(function (resolve, reject) {
        resolve(instance.payments.fetch(paymentId))
    });
}


function UnSeen_NoticationCount(UserID) {

    return new Promise(async (resolve, reject) => {
        try {
            let NotificationLastSeen = `select * from UserNotifications N inner join 
            Users U on U.UserID=N.UserID where N.UserID = ${parseInt(UserID, 10) || 0}
            and  N.CreatedAt > U.NotificationLastSeen`
            console.log(NotificationLastSeen, 'NotificationLastSeen', UserID)
            let ResultNotifications = await CommonController.commonget(NotificationLastSeen)
            if (ResultNotifications.length > 0) {
                resolve(1)
            }
            else {
                resolve(0)
            }

        }
        catch (err) {
            console.log("exception in notifications last seen count", err);
            reject(0);
        }
    });
}


module.exports = usercontroller
