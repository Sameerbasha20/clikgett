const express = require('express'); 
const mysql=require('mysql');
require('dotenv').config()
var moment = require('moment'); 
const CommonController = require("../controllers/CommonController");

const pool = require('../utils/db');


const Products_s3="http://clikgett-media.local/Products/"

const productcontroller={
    // GET /products/bulk-deals: products that get cheaper when you buy more.
    bulkDeals: async (req, resp) => {
        try {
            const ids = (await require('../services/ProductDeals').bulkDealProductIds())
                .map((n) => parseInt(n, 10)).filter((n) => n > 0);
            if (!ids.length) return resp.json({ Status: 1, Products: [] });
            const results = await CommonController.getproducts(
                `select p.* from Products p where p.Status=1 and p.ProductID in (${ids.join(',')}) order by p.ProductName asc limit 0,100`);
            return resp.json({ Status: 1, Products: results || [] });
        } catch (e) {
            console.log('bulk deals failed', e);
            return resp.json({ Status: 0, Message: 'error' });
        }
    },

    //send otp and insert into verifymob

    productsbyCategory_subcategory : async (req, resp, next) => {
        try{
                console.log('getallproducts')
                var rowCount = req.query.rowCount
                var keys = req.query;
                console.log(keys,'keys')
                var offset = 0;
                if (req.query.Offset != undefined)
                    offset = keys.Offset;
                else
                    offset = 0;
                console.log("Offset:", req.query);
                // Sort: price_asc | price_desc | discount | default (in stock first, then name)
                const sortOrders = {
                    price_asc: 'min(pv.OfferPrice) ASC',
                    price_desc: 'min(pv.OfferPrice) DESC',
                    discount: 'max((pv.Price - pv.OfferPrice) / NULLIF(pv.Price, 0)) DESC',
                };
                const sortClause = sortOrders[req.query.Sort] || "CONCAT(p.ProductName, '', pv.AvailableQty) ASC";
                const query = `select p.* from Products p inner join ProductVariants pv on p.ProductID=pv.ProductID 
where p.Status=1 and ${req.query.SubCategoryID ? 'p.SubCategoryID=' + pool.escape(req.query.SubCategoryID) : 'p.CategoryID=' + pool.escape(req.query.CategoryID)} and p.Type=1 and pv.status=1 group by p.ProductID order by 
                        CASE WHEN max(pv.AvailableQty) = 0 THEN 1 ELSE 0 END,
                        ${sortClause} limit ${Math.max(0, parseInt(offset, 10) || 0)},${Math.max(0, parseInt(rowCount, 10) || 20)};`
                console.log("products",query)
                let results = await CommonController.getproducts(query); 

                if (results.length >= rowCount)
                        offset = Number(offset) + Number(rowCount);
                else
                        offset = -1;

                resp.json({"Status":1,"Products":results,"offset":offset})
        }
        catch(e){
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },

    // productsbyCategory_subcategory : async (req, resp, next) => {
    //     try{
    //             console.log('getallproducts')
                 
    //             query="select * from Products where Status=1 and CategoryID="+req.query.CategoryID+" and SubCategoryID="+req.query.SubCategoryID+" and Type=1 order by ProductName asc"
    //             let results = await CommonController.getproducts(query); 
    //             resp.json({"Status":1,"Products":results})
    //     }
    //     catch(e){
    //         console.log(e)
    //         return resp.json({"Status":0,"Message":'error'})
    //     }
    // },
   
    productsby_ProductID : async (req, resp, next) => {
        let query; // per-request (were implicit globals)
        try{
                query="select * from Products where Status=1 and ProductID="+pool.escape(req.params.ProductID)                
                let results = await CommonController.getproducts(query); 
                if (results.length>0){
                        resp.json({"Status":1,"Products":results[0]})
                    }
                else{
                        resp.json({"Status":1,"Products":{}})
                    }
        }
        catch(e){
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },

    searchProduct : async (req, resp, next) => {
        let query; // per-request (were implicit globals)
        try{                 
            // The search text is a bound parameter (quote-escaping alone let "\" break out of the string).
            const like = `%${String(req.params.SearchString || '').replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
            query=`select * from Products p inner join ProductVariants PV on PV.ProductID=p.ProductID
            WHERE p.status=1 and PV.Status=1 and p.ProductName LIKE ? group by p.ProductID order by
             CASE WHEN PV.AvailableQty = 0 THEN 1 ELSE 0 END,
             CONCAT(p.ProductName, '', PV.AvailableQty) ASC`
            let results = await CommonController.getproducts(query, [like]);

            // Log search query for analytics
            const searchKw = req.params.SearchString ? req.params.SearchString.trim() : '';
            if (searchKw) {
                const resultCount = (results && results.length) || 0;
                const userId = req.UserID || null;
                pool.query("INSERT INTO SearchLogs (Keyword, UserID, ResultCount, CreatedAt) VALUES (?, ?, ?, NOW())", [searchKw, userId, resultCount], (logErr) => {
                    if (logErr) console.error("Error logging search query:", logErr);
                });
            }

            resp.json({"Status":1,"Products":results})
        }
        catch(e){
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },

    searchSuggestions: async (req, resp, next) => {
        try {
            const rawQuery = (req.query.q || req.query.query || req.params.query || '').trim();
            const limit = Math.min(20, Math.max(1, parseInt(req.query.limit || 8, 10)));

            if (rawQuery.length < 2) {
                const popularQuery = `
                    SELECT MIN(TRIM(Keyword)) AS Keyword, COUNT(*) as SearchCount
                    FROM SearchLogs
                    WHERE CHAR_LENGTH(TRIM(Keyword)) >= 3 AND ResultCount > 0
                    GROUP BY LOWER(TRIM(Keyword))
                    ORDER BY SearchCount DESC
                    LIMIT 8
                `;
                pool.query(popularQuery, (popErr, popRows) => {
                    const popular = (popRows || []).map(r => r.Keyword);
                    return resp.json({
                        Status: 1,
                        Query: rawQuery,
                        Suggestions: [],
                        PopularSearches: popular
                    });
                });
                return;
            }

            // LIKE patterns are passed as parameters; % _ and \ in user input are escaped.
            const likeText = rawQuery.replace(/[\\%_]/g, (c) => '\\' + c);
            const containsPattern = `%${likeText}%`;
            const prefixPattern = `${likeText}%`;
            const sql = `
                SELECT p.ProductID, p.ProductName, p.CategoryID, p.SubCategoryID, p.ProductImages,
                       c.CategoryName, sc.SubCategoryName,
                       MIN(pv.Price) as Price, MIN(pv.OfferPrice) as OfferPrice,
                       MAX(pv.AvailableQty) as AvailableQty
                FROM Products p
                INNER JOIN ProductVariants pv ON pv.ProductID = p.ProductID AND pv.Status = 1
                LEFT JOIN Categories c ON c.CategoryID = p.CategoryID
                LEFT JOIN SubCategories sc ON sc.SubCategoryID = p.SubCategoryID
                WHERE p.Status = 1
                  AND (p.ProductName LIKE ? OR c.CategoryName LIKE ? OR sc.SubCategoryName LIKE ?)
                GROUP BY p.ProductID
                ORDER BY 
                    CASE WHEN p.ProductName LIKE ? THEN 0 
                         WHEN p.ProductName LIKE ? THEN 1 
                         ELSE 2 END ASC,
                    CASE WHEN MAX(pv.AvailableQty) > 0 THEN 0 ELSE 1 END ASC,
                    p.ProductName ASC
                LIMIT ${limit}
            `;

            pool.query(sql, [containsPattern, containsPattern, containsPattern, prefixPattern, containsPattern], (err, rows) => {
                if (err) {
                    console.error("Error in searchSuggestions:", err);
                    return resp.status(500).json({ Status: 0, Message: "Error fetching suggestions", Suggestions: [] });
                }

                const suggestions = (rows || []).map(item => {
                    let images = [];
                    try {
                        images = typeof item.ProductImages === 'string' ? JSON.parse(item.ProductImages) : (item.ProductImages || []);
                    } catch (e) {
                        images = [];
                    }
                    const primaryImage = images.length > 0 ? (images[0].startsWith('http') ? images[0] : Products_s3 + images[0]) : '';
                    return {
                        ProductID: item.ProductID,
                        ProductName: item.ProductName,
                        CategoryID: item.CategoryID,
                        CategoryName: item.CategoryName || '',
                        SubCategoryID: item.SubCategoryID,
                        SubCategoryName: item.SubCategoryName || '',
                        ImageUrl: primaryImage,
                        Price: parseFloat(item.Price || 0),
                        OfferPrice: parseFloat(item.OfferPrice || item.Price || 0),
                        InStock: (item.AvailableQty || 0) > 0
                    };
                });

                const popularSql = `
                    SELECT MIN(TRIM(Keyword)) AS Keyword
                    FROM SearchLogs
                    WHERE Keyword LIKE ? AND CHAR_LENGTH(TRIM(Keyword)) >= 3 AND ResultCount > 0
                    GROUP BY LOWER(TRIM(Keyword))
                    ORDER BY COUNT(*) DESC
                    LIMIT 5
                `;
                pool.query(popularSql, [containsPattern], (popErr, popRows) => {
                    const popular = (popRows || []).map(r => r.Keyword);
                    return resp.json({
                        Status: 1,
                        Query: rawQuery,
                        Suggestions: suggestions,
                        PopularSearches: popular
                    });
                });
            });
        } catch (e) {
            console.error("Exception in searchSuggestions:", e);
            return resp.status(500).json({ Status: 0, Message: "Error fetching suggestions", Suggestions: [] });
        }
    },

    clearSearchHistory: async (req, resp, next) => {
        try {
            const userId = req.UserID;
            if (userId) {
                pool.query("DELETE FROM SearchLogs WHERE UserID = ?", [userId], (err) => {
                    if (err) console.error("Error clearing SearchLogs for user:", err);
                });
            }
            return resp.json({ Status: 1, Message: "Search history cleared" });
        } catch (e) {
            return resp.status(500).json({ Status: 0, Message: "Error clearing search history" });
        }
    },
    
    kits : async (req, resp, next) => {
        let query; // per-request (were implicit globals)
        try{
                query="select * from Products where Status=1 and Type=2 order by ProductName asc"
                let results = await CommonController.getproducts(query);                 
                resp.json({"Status":1,"Products":results})
            
        }
        catch(e){
            
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },
    
    allKits : async (req, resp, next) => {
        let query; // per-request (were implicit globals)
        try{
            query = "select * from Kits where Status=1"
            let results = await CommonController.products(query);  
            console.log(results.length,'results')         
            return resp.json({"Status":1,"Products":results})
            
        }
        catch(e){
            
            
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },

    kitdetail : async (req, resp, next) => {
        let query; // per-request (were implicit globals)
        try{
            query = "select * from Kits where KitID="+pool.escape(req.params.KitID)
            let results = await CommonController.kitsanditems(query,'user');  
            console.log(results.length,'results')        
            if(results.length != 0) 
                    return resp.json({"Status":1,"Kits":results[0]})
            else
                    return resp.json({"Status":1,"Kits":{}})
            
        }
        catch(e){
            
            
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },


    RecommendedProducts_User : async (req, resp, next) => {
        try{
            // Personalised: best-sellers in the categories this customer buys from.
            // Guests / new customers: overall best-sellers; no sales yet: newest products.
            const bestSellers = (whereExtra) => `select P.* from Products P
                inner join (select OI.ProductID, sum(OI.Quantity) as Sold from OrderItems OI
                    inner join Orders O on O.OrderID = OI.OrderID
                    where O.OrderStatus not in (3,4) and O.CreatedAt > NOW() - INTERVAL 120 DAY
                    group by OI.ProductID) S on S.ProductID = P.ProductID
                where P.Status = 1 ${whereExtra} order by S.Sold desc limit 0,20`;
            const userId = parseInt(req.UserID, 10);
            let results = [];
            if (userId > 0) {
                results = await CommonController.getproducts(bestSellers(
                    `and P.CategoryID in (select distinct P2.CategoryID from OrderItems OI2
                        inner join Orders O2 on O2.OrderID = OI2.OrderID
                        inner join Products P2 on P2.ProductID = OI2.ProductID where O2.UserID = ${userId})`));
            }
            if (!results || results.length < 6) results = await CommonController.getproducts(bestSellers(''));
            if (!results || results.length === 0) {
                results = await CommonController.getproducts("select P.* from Products P where P.Status = 1 order by P.ProductID desc limit 0,20");
            }
            return resp.json({"Status":1,"BestItems":results})                  
        }
        catch(e){
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },

    YouMayLikeIt_Products : async (req, resp, next) => {
        try{
                 
                let getOrderItems="select OI.*  from OrderItems OI inner join Orders O on O.OrderID=OI.OrderID where \
                O.UserID="+req.UserID+" group by OI.ProductID"
                let getOrderItems_results = await CommonController.commonget(getOrderItems);
                let Product_IDs = []
                for(let iterator of getOrderItems_results){
                    let get_CartItem = "SELECT * FROM Carts C inner join CartItems I on C.CartID=I.CartID where \
                        C.UserID="+req.UserID+" and C.IsOrderLinked=1 and ProductID="+iterator.ProductID
                    let get_CartItem_results = await CommonController.commonget(get_CartItem);
                    if(get_CartItem_results.length == 0){
                        Product_IDs.push(iterator['ProductID'])
                    }
                } 
                var productids = Product_IDs.join(',')
                if(productids.length > 0){
                    let getProducts = `select P.* from Products P inner join ProductVariants PV on PV.ProductID=P.ProductID 
                    where P.Status=1 and P.ProductID in (${ productids}) group by P.ProductID
                    order by P.createdAt desc limit 0,10`
                    var getProducts_results = await CommonController.getproducts(getProducts);
                }
                else{
                    var getProducts_results = []
                }
                resp.json({"Status":1,"Products":getProducts_results})
        }
        catch(e){
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },

    similarProducts: async (req, resp, next) => {
        try {
            const productId = parseInt(req.params.ProductID, 10);
            if (isNaN(productId) || productId <= 0) {
                return resp.status(400).json({ "Status": 0, "Message": "Invalid ProductID" });
            }

            // 1. Fetch current product's CategoryID and SubCategoryID
            pool.query(
                "SELECT ProductID, ProductName, CategoryID, SubCategoryID, Type FROM Products WHERE ProductID = ? AND Status = 1",
                [productId],
                async (err, currentProductRows) => {
                    if (err) {
                        console.error("Error fetching product for similar recommendations:", err);
                        return resp.status(500).json({ "Status": 0, "Message": "Database error" });
                    }

                    if (!currentProductRows || currentProductRows.length === 0) {
                        return resp.json({ "Status": 1, "Products": [] });
                    }

                    const currentProduct = currentProductRows[0];
                    const categoryId = currentProduct.CategoryID;
                    const subCategoryId = currentProduct.SubCategoryID;

                    // 2. Query similar recommendations:
                    // Priority 1: Same SubCategoryID (and CategoryID)
                    // Priority 2: Same CategoryID (different SubCategoryID)
                    // Excludes current product, only active products (Status=1) and active variants (status=1)
                    // In-stock items prioritized, ordered by relevance and newest
                    const sql = `
                        SELECT p.*,
                          CASE 
                            WHEN p.SubCategoryID = ? THEN 1
                            WHEN p.CategoryID = ? THEN 2
                            ELSE 3
                          END AS relevancePriority
                        FROM Products p
                        INNER JOIN ProductVariants pv ON p.ProductID = pv.ProductID
                        WHERE p.Status = 1 
                          AND pv.status = 1 
                          AND p.ProductID != ? 
                          AND (p.SubCategoryID = ? OR p.CategoryID = ?)
                        GROUP BY p.ProductID
                        ORDER BY 
                          relevancePriority ASC,
                          CASE WHEN pv.AvailableQty > 0 THEN 0 ELSE 1 END,
                          p.ProductID DESC
                        LIMIT 15;
                    `;

                    const params = [subCategoryId, categoryId, productId, subCategoryId, categoryId];

                    try {
                        const results = await CommonController.getproducts(sql, params);
                        return resp.json({ "Status": 1, "Products": results || [] });
                    } catch (queryErr) {
                        console.error("Error retrieving similar products:", queryErr);
                        return resp.status(500).json({ "Status": 0, "Message": "Error retrieving recommendations" });
                    }
                }
            );
        } catch (e) {
            console.error("Exception in similarProducts:", e);
            return resp.status(500).json({ "Status": 0, "Message": "Server error" });
        }
    },
}


module.exports=productcontroller
