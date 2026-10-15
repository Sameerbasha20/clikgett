const express = require('express'); 
const mysql=require('mysql');
require('dotenv').config()
var moment = require('moment'); 
var fs = require('fs')
const AWS = require('aws-sdk');
const CommonController = require("../controllers/CommonController");

const pool = require('../utils/db');

const s3 = require('../utils/s3');


// const category_s3 = "https://d3c9kvg5gaqz48.cloudfront.net/Categories/"
// const Products_s3="https://d3c9kvg5gaqz48.cloudfront.net/Products/"


const categories_s3="https://d3c9kvg5gaqz48.cloudfront.net/Categories/"

const Products_s3="https://d3c9kvg5gaqz48.cloudfront.net/Products/"

const subcategories_s3="https://d3c9kvg5gaqz48.cloudfront.net/SubCategories/"


const adminproductcontroller={

    getproductsbycategoryID : async (req, resp, next) => {
        try{
                query="select P.*,C.CategoryName,S.SubCategoryName from Products P inner join Categories C on C.CategoryID=P.CategoryID inner join \
                SubCategories S on P.SubCategoryID=S.SubCategoryID\
                where " + (req.query.CategoryID ? ("P.CategoryID=" + pool.escape(req.query.CategoryID) + " and ") : "") + "P.Status!=0 and P.Type=1 order by P.ProductName asc"
                
                let results = await CommonController.products(query); 
                resp.json({"Status":1,"Products":results})
        }
        catch(e){
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },

    productsbysubcategory_admin : async (req, resp, next) => {
        try{
                query = "select * from Products where SubCategoryID="+pool.escape(req.params.SubCategoryID)+" and Status!=0 and Type=1 order by ProductName asc"
                let results = await CommonController.getproducts(query); 
                resp.json({"Status":1,"Products":results})
    
            
        }
        catch(e){
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },

    Kits : async (req, resp, next) => {
        try{

                results=await getkits()  
                console.log(results,'results')
                
                if (results.length>0){
                        for (var j = 0; j < results.length; j++){

                                if(results[j].ImageUrl!="NA"){
                                    results[j].ImageUrl = Products_s3+results[j].ImageUrl}

                                
                            }
                        return resp.json({"Status":1,"Products":results})
                    }
                else{
                        return resp.json({"Status":1,"Products":[]})
                    }
    
            
        }
        catch(e){
            
            
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },

    searchProduct : async (req, resp, next) => {
        try{
                console.log('search product')
                query = "select * from Products WHERE status!=0 and ProductName LIKE " + pool.escape('%' + String(req.params.SearchString) + '%') + " order by ProductName asc"
                let results = await CommonController.products(query); 
                resp.json({"Status":1,"Products":results})
        }
        catch(e){
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },

    getproductsbyproductid : async (req, resp, next) => {
        try{

                query = "select P.*,C.CategoryName,S.SubCategoryName from Products P inner join Categories C on C.CategoryID=P.CategoryID inner join \
                SubCategories S on P.SubCategoryID=S.SubCategoryID\
                where P.ProductID="+pool.escape(req.params.ProductID)+" and P.Status!=0"

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
    
    addproduct : async (req, resp, next) => {
        try {

            body=req.body 
            
            product=await createproduct(body)
            if(product == 2)
                return resp.json({'Status':0,"Message":"SubCategory doesnot exists"})
            console.log(product)   
            
            if(body.ProductVariants.length>0){
                    addvariant_product = await addvariantsfromproducts(product,body.ProductVariants)}
                    

            ProductID=product['ID']
            if(body.ImageUrl != null || body.ImageUrl != undefined){
                    imageupload = await convertimage(ProductID,body.ImageUrl)
                    if (imageupload == -1){
                                console.log("error in adding product image")}
                        }                   
                

            return resp.json({'Status':1,"Message":"Product Added Successfully", "ProductID": ProductID})
            
        }
        catch (err) {
            console.log("exception in adding Product ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in adding Product" });
        }
    },

    updateproduct : async (req, resp, next) => {
        try {
            Body=req.body
            console.log(Body,'Body')
            // getproduct=await productsbyproductid(req.params.ProductID)
            // if (getproduct.length == 0){
            //     return resp.json({ "Status": 0, "Message": "product not found" });}

             
            if (Body.ProductName != null || Body.ProductName != undefined)
            ProductName = "ProductName='" + Body.ProductName.replace(/'/g, "\\'") + "',";
            else
            ProductName = "ProductName = ProductName,";

            if (Body.Description != null || Body.Description != undefined)
            Description = "Description='" + Body.Description.replace(/'/g, "\\'") + "',";
            else
            Description = "Description = Description,";


            if (Body.ProductImages != null || Body.ProductImages != undefined){
                ProductImages = "ProductImages='" + JSON.stringify(Body.ProductImages) + "',";
            }
                else{
                    ProductImages = "ProductImages = ProductImages,";
                }

            if(Body.ImageUrl != null || Body.ImageUrl != undefined){
                ProductID=req.params.ProductID

                imageupload = await convertimage(ProductID,Body.ImageUrl)
                if (imageupload == -1){
                                console.log("error in updating product image")
                            }
                
                }

            if (Body.CategoryID != null || Body.CategoryID != undefined){

                categorycheck = await getcategoryid(Body.CategoryID)
                if( categorycheck.length == 0 ){
                    return resp.json({'Status':0,"Message":'Category not found'})} 

                CategoryID = "CategoryID=" + pool.escape(Body.CategoryID)+",";}
                
            else{
                CategoryID = "CategoryID = CategoryID,";}

            if (Body.SubCategoryID != null || Body.SubCategoryID != undefined){

                subcategorycheck = await getsubcategoryid(Body.SubCategoryID)
                if(subcategorycheck.length == 0){
                    return resp.json({'Status':0,"Message":'Sub Category not found'})} 

                    SubCategoryID = "SubCategoryID=" + pool.escape(Body.SubCategoryID)+",";}
                
            else{
                    SubCategoryID = "SubCategoryID = SubCategoryID,";}

            if (Body.Status != null || Body.Status != undefined)
            Status = "Status=" + pool.escape(Body.Status) + "";
            else
            Status = "Status = Status";

            queryString = "UPDATE Products SET " +ProductName+Description+ProductImages+CategoryID+SubCategoryID+Status+" WHERE ProductID=" + pool.escape(req.params.ProductID) + ";";
            console.log(queryString)
            return new Promise(function(resolve, reject) {
            pool.query(queryString, function(err, result, fields) {
                            if (err) {
                                        resp.json({ "Status": 0, "Message": "Error in updating the DB" });
                                        console.log("Error in updating the DB:" + err);
                                    }
                            else {
                                            console.log("update :" + result.affectedRows);
                                            console.log('update successful')
                                            resp.json({ "Status": 1, "Message": "Product Update Successful" });
                                    }
             });
         });
        }
        catch (err) {
            console.log("exception in updating Products ", err);
            return resp.json({ "Status": 0, "Message": "Error in updating Products" });
        }
    },

    // updateproductvariant : async (req, resp, next) => {
    //     try {
    //         Body=req.body

            
    //         variantcheck = await getvariant(req.params.VariantID)            
    //         if(variantcheck.length == 0){
    //                 return resp.json({'Status':0,"Message":'Variant not found'})}

            
    //         // if (Body.ProductID != null || Body.ProductID != undefined){
    //         //     getproduct=await productsbyproductid(Body.ProductID)                
    //         //     if (getproduct.length == 0){
    //         //             return resp.json({ "Status": 0, "Message": "product not found" });}
    //         //     }

    //         if (Body.metrictype != null || Body.metrictype != undefined)
    //         metrictype = "metrictype='" + Body.metrictype+"',";
    //         else
    //         metrictype = "metrictype = metrictype,";

    //         if (Body.metricvalue != null || Body.metricvalue != undefined)
    //         metricvalue = "metricvalue=" + Body.metricvalue+",";
    //         else
    //         metricvalue = "metricvalue = metricvalue,";

    //         if (Body.OfferPrice != null || Body.OfferPrice != undefined)
    //         OfferPrice = "OfferPrice=" + Body.OfferPrice+",";
    //         else
    //         OfferPrice = "OfferPrice = OfferPrice,";

    //         if (Body.AvailableQty != null || Body.AvailableQty != undefined)
    //         AvailableQty = "AvailableQty=" + Body.AvailableQty+",";
    //         else
    //         AvailableQty = "AvailableQty = AvailableQty,";


    //         if (Body.Price != null || Body.Price != undefined)
    //         Price = "Price=" + Body.Price
    //         else
    //         Price = "Price = Price";
            
    //         queryString = "UPDATE ProductVariants SET " +metrictype+metricvalue+OfferPrice+AvailableQty+Price+" WHERE VariantID=" + req.params.VariantID + ";";
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
    //                                         resp.json({ "Status": 1, "Message": "Product Variant Update Successful" });
    //                                 }
    //                                 else {
    //                                         console.log("Product Variant update failed",err,queryString);
    //                                         resp.json({ "Status": 0, "Message": "No changes to update" });
                                    
    //                                 }
                    
    //                                 }
    //          });
    //      });
    //     }
    //     catch (err) {
    //         console.log("exception in updating ProductVariants ", err);
    //         return resp.status(500).json({ "Status": 0, "Message": "Error in updating ProductVariants" });
    //     }
    // },

        //NEWCODE
    updateproductvariant: async (req, resp, next) => {
        try {
            const Body = req.body;
            const VariantID = req.params.VariantID;
    
            // Check if the variant exists
            const variantcheck = await getvariant(VariantID);
            if (variantcheck.length == 0) {
                return resp.json({ 'Status': 0, "Message": 'Variant not found' });
            }
    
            let updates = [];
            let params = [];

            if (Body.metrictype !== undefined && Body.metrictype !== null) {
                updates.push("metrictype = ?");
                params.push(Body.metrictype);
            }
            if (Body.metricvalue !== undefined && Body.metricvalue !== null) {
                updates.push("metricvalue = ?");
                params.push(Body.metricvalue);
            }
            if (Body.OfferPrice !== undefined && Body.OfferPrice !== null) {
                updates.push("OfferPrice = ?");
                params.push(Body.OfferPrice);
            }
            if (Body.AvailableQty !== undefined && Body.AvailableQty !== null) {
                updates.push("AvailableQty = ?");
                params.push(Body.AvailableQty);
            }
            if (Body.Price !== undefined && Body.Price !== null) {
                updates.push("Price = ?");
                params.push(Body.Price);
            }
            if (Body.ExpiryDate !== undefined && Body.ExpiryDate !== null) {
                updates.push("ExpiryDate = ?");
                params.push(Body.ExpiryDate);
            }
            if (Body.maxQty !== undefined && Body.maxQty !== null) {
                updates.push("maxQty = ?");
                params.push(Body.maxQty);
            }
            if (Body.Buy2Price !== undefined && Body.Buy2Price !== null && Body.Buy2Price !== '') {
                updates.push("Buy2Price = ?");
                params.push(parseFloat(Body.Buy2Price));
            }

            if (updates.length === 0) {
                return resp.json({ "Status": 1, "Message": "No changes to update" });
            }

            params.push(VariantID);
            const queryString = `UPDATE ProductVariants SET ${updates.join(', ')} WHERE VariantID = ?`;

            pool.query(queryString, params, function (err, result) {
                if (err) {
                    console.log("Error in updating ProductVariants DB:", err);
                    return resp.json({ "Status": 0, "Message": "Error in updating the DB" });
                }
                return resp.json({ "Status": 1, "Message": "Product Variant Update Successful" });
            });
        } catch (err) {
            console.log("exception in updating ProductVariants:", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in updating ProductVariants" });
        }
    },

    deleteproduct : async (req, resp, next) => {
        try {
            console.log('delete products')
            // getproduct=await productsbyproductid(req.params.ProductID)
            
            // if (getproduct.length == 0){
            //     return resp.json({ "Status": 0, "Message": "product not found" });}

            

            productdelete=await deleteproduct(req.params.ProductID)          
            if (productdelete==0){
                resp.json({ "Status": 0, "Message": "Error in deleting product" });}

            return resp.json({ "Status": 1, "Message": "Product deleted successfully" });
        
        }
        catch (err) {
            console.log("exception in deleting products ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in deleting products" });
        }
    },

    deletingvariant : async (req, resp, next) => {
        try {
            getproductvariant=await variantby_variantid(req.params.VariantID)
            if (getproductvariant== -1){
                return resp.json({ "Status": 0, "Message": "error in getting variants" });}
         
            else if (getproductvariant==0){
                return resp.json({ "Status": 0, "Message": "product variant not found" });}
         
            variantdelete=await deletevariants_variantid(req.params.VariantID)
            if (variantdelete==0){
                return resp.json({ "Status": 0, "Message": "Error in deleting variants" });}
                    
            
            return resp.json({ "Status": 1, "Message": "Variant deleted successfully" });
        
        }
        catch (err) {
            console.log("exception in deleting variants ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in deleting variants" });
        }
    },

    // addvariant : async (req, resp, next) => {
    //     try {

    //         body=req.body 
            

                                        
    //         let InsertVariants = {ProductID: body.ProductID,metrictype: body.metrictype,status:1,metricvalue:body.metricvalue,
    //             Price:body.Price,AvailableQty:body.AvailableQty,OfferPrice:body.OfferPrice}

    //         let sql = "INSERT INTO ProductVariants set ?";

    //         pool.query(sql, InsertVariants, (err, results) => {
    //                     if(err){
    //                             return resp.json({ "Status": 0, "Message": "Error in adding Variant" });}

    //                     if (results.affectedRows === 1) {
    //                             return resp.json({'Status':1,"Message":"Product Variant Added Successfully"})}

    //                     else {
    //                             console.log("error in adding Variant", results.affectedRows);
    //                             return resp.json({ "Status": 0, "Message": "Error in adding Variant" });}
                                                                    
    //                 }) 
            
    //     }
    //     catch (err) {
    //         console.log("exception in adding Product Variant", err);
    //         return resp.status(500).json({ "Status": 0, "Message": "Error in adding Product Variant" });
    //     }
    // },

    //NEWCODE
    addvariant : async (req, resp, next) => {
        try {
            const body = req.body;
    
            // Construct the data for inserting the product variant
            let InsertVariants = {
                ProductID: body.ProductID,
                metrictype: body.metrictype,
                status: 1,
                metricvalue: body.metricvalue,
                Price: body.Price,
                AvailableQty: body.AvailableQty,
                OfferPrice: body.OfferPrice,
                maxQty: body.maxQty,
                ExpiryDate: body.ExpiryDate,
                Buy2Price: body.Buy2Price !== undefined && body.Buy2Price !== '' ? parseFloat(body.Buy2Price) : null
            };
    
            // SQL query to insert the new product variant
            let sql = "INSERT INTO ProductVariants SET ?";
    
            pool.query(sql, InsertVariants, (err, results) => {
                if (err) {
                    console.log("Error in adding Variant:", err);
                    return resp.json({ "Status": 0, "Message": "Error in adding Variant" });
                }
    
                // Check if the variant was successfully added
                if (results.affectedRows === 1) {
                    return resp.json({ 'Status': 1, "Message": "Product Variant Added Successfully" });
                } else {
                    console.log("Error in adding Variant:", results.affectedRows);
                    return resp.json({ "Status": 0, "Message": "Error in adding Variant" });
                }
            });
        } catch (err) {
            console.log("Exception in adding Product Variant:", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in adding Product Variant" });
        }
    },
    

    allKits : async (req, resp, next) => {
        try{
            query = "select * from Kits where Status!=0"
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
        try{
            query = "select * from Kits where KitID="+pool.escape(req.params.KitID)
            let results = await CommonController.kitsanditems(query,'admin');  
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

    addkit : async (req, resp, next) => {
        try {

            body=req.body 
            

            if (body.Description == null || body.Description == undefined)
                                body.Description = 'NA'
            
            if (body.OfferPrice == null || body.OfferPrice == undefined){
                                body.OfferPrice = 0}

            kit=await createkit(body)
            console.log(kit)   
            kitID=kit['ID']
            // if(body.KitItems.length>0){
            //         add_kititems = await addkititems(kitID,body.KitItems)}
                    
            
            if(body.ImageUrl != null || body.ImageUrl != undefined){
                    imageupload = await convertimagekit(kitID,body.ImageUrl)
                    if (imageupload == -1){
                                console.log("error in adding kit image")}
                        }                   
                

            return resp.json({'Status':1,"Message":"Kit Added Successfully"})
            
        }
        catch (err) {
            console.log("exception in adding kit ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in adding kit" });
        }
    },

    updatekit : async (req, resp, next) => {
        try {
            Body=req.body
            console.log(Body,'Body')
            
             
            if (Body.KitName != null || Body.KitName != undefined)
            KitName = "KitName='" + Body.KitName.replace(/'/g, "\\'") + "',";
            else
            KitName = "KitName = KitName,";

            if (Body.Description != null || Body.Description != undefined)
            Description = "Description='" + Body.Description.replace(/'/g, "\\'") + "',";
            else
            Description = "Description = Description,";

            if(Body.ImageUrl != null || Body.ImageUrl != undefined){
                KitID=req.params.KitID

                imageupload = await convertimagekit(KitID,Body.ImageUrl)
                if (imageupload == -1){
                                console.log("error in updating Kit image")
                            }
                
                }

            if (Body.Price != null || Body.Price != undefined)
                Price = "Price=" + pool.escape(Body.Price) + ",";
            else
                Price = "Price = Price,";

            if (Body.OfferPrice != null || Body.OfferPrice != undefined)
                OfferPrice = "OfferPrice=" + pool.escape(Body.OfferPrice)+ ",";
            else
                OfferPrice = "OfferPrice = OfferPrice,";

            if (Body.Status != null || Body.Status != undefined)
                Status = "Status=" + pool.escape(Body.Status) + "";
            else
                Status = "Status = Status";

            
            queryString = "UPDATE Kits SET " +KitName+Description+Price+OfferPrice+Status+" WHERE KitID=" + pool.escape(req.params.KitID) + ";";
            console.log(queryString)
            return new Promise(function(resolve, reject) {
            pool.query(queryString, function(err, result, fields) {
                            if (err) {
                                
                                        resp.json({ "Status": 0, "Message": "Error in updating the DB" });
                                        console.log("Error in updating the DB:" + err);
                                
                                    }
                            else {
                                            console.log("update :" + result.affectedRows);
                                    
                                            console.log('update successful')
                                            resp.json({ "Status": 1, "Message": "Kit Update Successful" });
                                    
                                    
                    
                                    }
             });
         });
        }
        catch (err) {
            console.log("exception in updating Kit ", err);
            return resp.json({ "Status": 0, "Message": "Error in updating Kit" });
        }
    },

    deletekit : async (req, resp, next) => {
        try {
            console.log('delete kit')
           

            Kitdelete=await deletekit(req.params.KitID)          
            if (Kitdelete==0){
                resp.json({ "Status": 0, "Message": "Error in deleting Kit" });}

            return resp.json({ "Status": 1, "Message": "Kit deleted successfully" });
        
        }
        catch (err) {
            console.log("exception in deleting Kit ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in deleting Kit" });
        }
    },

    addkititem : async (req, resp, next) => {
        try {

            body=req.body             
            let InsertVariants = {KitID: body.KitID,ProductID: body.ProductID,VariantID:body.VariantID}
            let sql = "INSERT INTO KitItems set ?";
            pool.query(sql, InsertVariants, (err, results) => {
                        if(err){
                                console.log(err)
                                return resp.json({ "Status": 0, "Message": "Error in adding kititem" });}

                        if (results.affectedRows === 1) {
                                return resp.json({'Status':1,"Message":"KitItem Added Successfully"})}

                        else {
                                console.log("error in adding Variant", results.affectedRows);
                                return resp.json({ "Status": 0, "Message": "Error in adding KitItem" });}
                                                                    
                    }) 
            
        }
        catch (err) {
            console.log("exception in adding KitItem", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in adding KitItem" });
        }
    },

    updatekititems : async (req, resp, next) => {
        try {
            Body=req.body
           

            if (Body.ProductID != null || Body.ProductID != undefined)
            ProductID = "ProductID=" + pool.escape(Body.ProductID) + ",";
            else
            ProductID = "ProductID = ProductID,";

            if (Body.VariantID != null || Body.VariantID != undefined)
            VariantID = "VariantID=" + pool.escape(Body.VariantID)
            else
            VariantID = "VariantID = VariantID";

          

           
            
            queryString = "UPDATE KitItems SET " +ProductID+VariantID+" WHERE KitItemID=" + pool.escape(req.params.KitItemID) + ";";
            console.log(queryString)
            return new Promise(function(resolve, reject) {
            pool.query(queryString, function(err, result, fields) {
                            if (err) {
                                
                                        resp.json({ "Status": 0, "Message": "Error in updating the DB" });
                                        console.log("Error in updating the DB:" + err);
                                
                                    }
                            else {
                                    console.log("update :" + result.affectedRows);
                                    if (result.affectedRows > 0) {
                                            console.log('update successful')
                                            resp.json({ "Status": 1, "Message": "KitItem Update Successful" });
                                    }
                                    else {
                                            console.log("KitItem update failed",err,queryString);
                                            resp.json({ "Status": 0, "Message": "No changes to update" });
                                    
                                    }
                    
                                    }
             });
         });
        }
        catch (err) {
            console.log("exception in updating KitItem ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in updating KitItem" });
        }
    },

    deletekititem : async (req, resp, next) => {
        try {
            
            query = "delete from KitItems where KitItemID="+pool.escape(req.params.KitItemID)
            results=await CommonController.commondelete(query)
            
            resp.json({ "Status": 1, "Message": "KitItem deleted successfully" });
        
        }
        catch (err) {
            console.log("exception in deleting kititems ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in deleting kititems" });
        }
    },


    RecommendedProducts : async (req, resp, next) => {
        try{
            query = "select Rp.*,P.ProductName,P.ImageUrl,P.ProductImages from RecommendedProducts Rp inner join Products P on P.ProductID=Rp.ProductID where Rp.Status!=0"
            let results = await CommonController.products(query);  
            console.log(results.length,'results')         
            return resp.json({"Status":1,"Products":results})
            
        }
        catch(e){
            
            
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },
    
    addRecommendedProducts : async (req, resp, next) => {
        try {

            body=req.body 
            query="select * from Products where Status=1 and ProductID="+pool.escape(body.ProductID)
            let presults = await CommonController.commonget(query);   
            if(presults.length == 0 ){
                return resp.json({'Status':0,"Message":"Product doesnot exists"})
            }

            query = "select * from RecommendedProducts where Status=1 and ProductID="+pool.escape(body.ProductID)
            let results = await CommonController.commonget(query); 
            if(results.length > 0 ){
                return resp.json({'Status':0,"Message":"Product already exists"})
            } 

            if (body.ProductID == null || body.ProductID == undefined){
                return resp.json({'Status':0,"Message":"ProductID cannot be empty"})
            }
            RecommendedProducts=await createRecommendedProduct(body)            

            return resp.json({'Status':1,"Message":"Recommended Product Added Successfully"})
            
        }
        catch (err) {
            console.log("exception in adding Recommended Product ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in adding Recommended Product" });
        }
    },

    delete_RecommendedProducts : async (req, resp, next) => {
        try {
            
            RecommendedProductdelete=await deleteRecommendedProducts(req.params.RecProductID)          
            if (RecommendedProductdelete==0){
                resp.json({ "Status": 0, "Message": "Error in deleting Recommended Product" });}

            return resp.json({ "Status": 1, "Message": "Recommended Product deleted successfully" });
        
        }
        catch (err) {
            console.log("exception in deleting Kit ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in deleting Kit" });
        }
    },
// Buy 1 / Buy 2 / Buy More product offers
buyMoreConfig: async (req, resp, next) => {
    try {
        const { ConfigID } = req.params;

        let query;

        if (ConfigID) {
            query = "SELECT * FROM buy_more_config WHERE ConfigID=" + ConfigID;
        } else {
            query = "SELECT * FROM buy_more_config ORDER BY CreatedAt DESC";
        }

        const results = await CommonController.commonget(query);

        return resp.json({
            Status: 1,
            BuyMoreConfig: results || []
        });

    } catch (err) {
        return resp.json({
            Status: 1,
            BuyMoreConfig: []
        });
    }
},

updateBuyMoreConfig: async (req, resp, next) => {
    try {
        const ConfigID = req.params.ConfigID;

        const {
            ProductID,
            OfferType,
            OfferQuantity,
            OfferPrice,
            IsActive
        } = req.body;

        // Check if config exists
        const checkQuery =
            "SELECT * FROM buy_more_config WHERE ConfigID=" + ConfigID;

        const existing =
            await CommonController.commonget(checkQuery);

        if (existing.length === 0) {

            // Create new config
            const insertQuery =
                "INSERT INTO buy_more_config " +
                "(ProductID, OfferType, OfferQuantity, OfferPrice, IsActive) " +
                "VALUES (" +
                ProductID +
                ", '" +
                OfferType +
                "', " +
                OfferQuantity +
                ", " +
                OfferPrice +
                ", " +
                IsActive +
                ")";

            await CommonController.commonget(insertQuery);

            return resp.json({
                Status: 1,
                Message: "Buy More config added successfully"
            });

        } else {

            // Update existing config
            const updateQuery =
                "UPDATE buy_more_config SET " +
                "OfferType='" +
                OfferType +
                "', OfferQuantity=" +
                OfferQuantity +
                ", OfferPrice=" +
                OfferPrice +
                ", IsActive=" +
                IsActive +
                " WHERE ConfigID=" +
                ConfigID;

            await CommonController.commonget(updateQuery);

            return resp.json({
                Status: 1,
                Message: "Buy More config updated successfully"
            });
        }

    } catch (err) {
        console.log(
            "exception in updating buy more config",
            err
        );

        return resp.status(500).json({
            Status: 0,
            Message: "Error in updating buy more config"
        });
    }
},

deleteBuyMoreConfig: async (req, resp, next) => {
    try {
        const ConfigID = req.params.ConfigID;

        const query =
            "UPDATE buy_more_config SET IsActive=0 WHERE ConfigID=" +
            ConfigID;

        await CommonController.commonget(query);

        return resp.json({
            Status: 1,
            Message: "Buy More config deactivated successfully"
        });

    } catch (err) {
        console.log(
            "exception in deleting buy more config",
            err
        );

        return resp.status(500).json({
            Status: 0,
            Message: "Error in deleting buy more config"
        });
    }
}

};

module.exports = adminproductcontroller;


function convertimage(ProductID,ImageUrl) {
    try {
        return new Promise(function (resolve, reject) {
            
            
            

            let base64String = 'data:image/png;base64,' + ImageUrl; // Not a real image 
            let base64Image = base64String.split(';base64,').pop(); 
            var imagename = Date.now() + "_" +ProductID+ '.png'
            console.log(imagename,'imagename')
            image = "ImageUrl=" + pool.escape(imagename) + "";
            fs.writeFile("images/"+imagename, base64Image, { encoding: 'base64' }, function (err) {

                const fileContent = fs.readFileSync("images/"+imagename);
                const params = {
                    Bucket: process.env.bucketname,Key: 'Products/' + imagename, 
                    Body: fileContent,
                    ACL: 'public-read'
                };            
              console.log(params)
                s3.upload(params, function (err, data) {
                    if (err) {
                        console.log(err)
                        return resolve(-1)
                    }
                    console.log("UPDATE Products SET " + image + " WHERE ProductID=" +ProductID)
                    pool.query("UPDATE Products SET " + image + " WHERE ProductID=" + ProductID + ";", function (err, results, fields) { })

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

function convertimagekit(KitID,ImageUrl) {
    try {
        return new Promise(function (resolve, reject) {
            
            
            

            let base64String = 'data:image/png;base64,' + ImageUrl; // Not a real image 
            let base64Image = base64String.split(';base64,').pop(); 
            var imagename = Date.now() + "_" +KitID+ '.png'
            console.log(imagename,'imagename')
            image = "ImageUrl=" + pool.escape(imagename) + "";
            fs.writeFile("images/"+imagename, base64Image, { encoding: 'base64' }, function (err) {

                const fileContent = fs.readFileSync("images/"+imagename);
                const params = {
                    Bucket: process.env.bucketname,Key: 'Products/' + imagename, 
                    Body: fileContent,
                    ACL: 'public-read'
                };            
              console.log(params)
                s3.upload(params, function (err, data) {
                    if (err) {
                        console.log(err)
                        return resolve(-1)
                    }
                    console.log("UPDATE Kits SET " + image + " WHERE KitID=" +KitID)
                    pool.query("UPDATE Kits SET " + image + " WHERE KitID=" + KitID + ";", function (err, results, fields) { })

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

function getcategoryid(CategoryID) {
    try {
        return new Promise(function (resolve, reject) {
            pool.query("select * from Categories where CategoryID=? and status=1", [CategoryID], async (err, results) => {
                
                if(err) {                    
                    return reject(-1);
                    } 
                    
                else{

                    console.log("retrived categories : ", results.length);
                    resolve(results)}
                
            });
        });
    }
    catch (err) {
        console.log("error in retrieving categories");
        return reject(-1);
    }
}

function getsubcategoryid(SubCategoryID) {
    try {
        return new Promise(function (resolve, reject) {
            pool.query("select * from SubCategories where SubCategoryID=? and status=1", [SubCategoryID], async (err, results) => {
                
                if(err) {                    
                    return reject(-1);
                    } 
                    
                else{

                    console.log("retrived categories : ", results.length);
                    resolve(results)}
                
            });
        });
    }
    catch (err) {
        console.log("error in retrieving categories");
        return reject(-1);
    }
}

function getvariant(VariantID) {
    try {
        return new Promise(function (resolve, reject) {
            pool.query("select * from ProductVariants where VariantID=?", [VariantID], async (err, results) => {
                
                if(err) {                    
                    return reject(-1);
                    } 
                    
                else{

                    console.log("retrived ProductVariants : ", results.length);
                    resolve(results)}
                
            });
        });
    }
    catch (err) {
        console.log("error in retrieving ProductVariants");
        return reject(-1);
    }
}

function variantby_variantid(VariantID) {
    try {
        return new Promise(function (resolve, reject) {
            pool.query("select * from ProductVariants where VariantID=?", [VariantID], async (err, results) => {
                
                if(err) {                    
                    return resolve(-1);} 

                console.log("retrived Products variants: ", results.length);
                if (results.length == 1) {                    
                        return resolve(results)}
                else {                    
                        return resolve(0);}
            });
        });
    }
    catch (err) {
        console.log("error in retrieving Products");
        return resolve(-1);
    }
}

function getkits() {
    try {
        return new Promise(function (resolve, reject) {
            console.log("select P.*,C.CategoryName,S.SubCategoryName from Products P inner join Categories C on \
            C.CategoryID=P.CategoryID inner join SubCategories S on P.SubCategoryID=S.SubCategoryID\
            where P.Status!=0 and P.Type=2 order by P.ProductName asc")
            
            pool.query("select P.*,C.CategoryName,S.SubCategoryName from Products P inner join Categories C on \
            C.CategoryID=P.CategoryID inner join SubCategories S on P.SubCategoryID=S.SubCategoryID\
            where P.Status!=0 and P.Type=2 order by P.ProductName asc", async (err, results) => {
                
                if(err) {
                    console.log("exception in retriving products",err)
                    return reject(-1);
                }                
                    console.log("retrived Products : ", results.length);
                    resolve(results)
               
            });
        });
    }
    catch (err) {
        console.log("error in retrieving Products",err);
        return reject(-1);
    }
}

function createproduct(body) {
    try {
        return new Promise(async function (resolve, reject) {
            if (body.Description == null || body.Description == undefined)
                                body.Description = 'NA'
            
            if (body.ProductImages == null || body.ProductImages == undefined){
                body.ProductImages = JSON.stringify([])}

            if (body.CategoryID == null || body.CategoryID == undefined)
                                body.CategoryID = 0
            
            if (body.SubCategoryID == null || body.SubCategoryID == undefined){
                                body.SubCategoryID = 0}
            else{
                subcategorycheck = await getsubcategoryid(body.SubCategoryID)
                if(subcategorycheck.length == 0){
                    resolve(2)}
            }

            let InsertProducts = {ProductImages:JSON.stringify(body.ProductImages),SubCategoryID:body.SubCategoryID,ProductName: body.ProductName.replace(/'/g, "\\'"), Description: body.Description.replace(/'/g, "\\'"),ImageUrl: "NA",status:1,CategoryID:body.CategoryID,Type:body.Type}
            let sql = "INSERT INTO Products set ?";
            pool.query(sql, InsertProducts, (err, results) => {
                    console.log('add product')
                    if(err){
                                console.log(err)
                                return reject(-1)}
                    if (results.affectedRows == 1) {
                                resolve({"status":1,"ID":results.insertId})}
                    else {
                                console.log("error in insert Product to table ", results.affectedRows);
                                reject(-1)}
            }) 
        });
    }
    catch (err) {
        reject(-1)
    }
}

function addvariantsfromproducts(product,ProductVariants) {
    try {
        return new Promise(function (resolve, reject) {
            console.log('add variants from product ***************************')
            for (var j = 0; j < ProductVariants.length; j++){
                    variants=ProductVariants
                    if (variants[j].OfferPrice == null || variants[j].OfferPrice == undefined){
                            variants[j].OfferPrice = 0}
                    
                            
                    let InsertVariants = {ProductID: product['ID'],metrictype: variants[j].metrictype,status:1,metricvalue:variants[j].metricvalue,Price:variants[j].Price,OfferPrice:variants[j].OfferPrice,AvailableQty:variants[j].AvailableQty}
                    let sql = "INSERT INTO ProductVariants set ?";

                    pool.query(sql, InsertVariants, (err, results) => {
                        if(err){
                                    console.log(err)
                                    return reject(-1)}
                        if (results.affectedRows === 1) {
                                    console.log('variant added')}
                        else {
                                    console.log("error in adding Variant", results.affectedRows);
                                    return reject(-1)}
                    }) 
            }
                                    
            return resolve(1)

            
        });
    }
    catch (err) {
        console.log("error in adding Variant", err);
        reject(-1)
    }
}

function deleteproduct(ProductID) {

    return new Promise(function (resolve, reject) {
        pool.query("delete from Products where ProductID=?",[ProductID], function (err, results, fields) {
            if (err) {               
                console.log("Error in checking ProductID from DB :" + err);
                reject(0);
            }
            else {
                
                console.log(results.affectedRows, 'affected rows')
                if (results.affectedRows > 0) {                    
                    resolve(1);
                }
                else {                    
                    console.log("error in product delete delete product");
                    resolve(0);
                }
            }
        });
    });
}

function deletekit(KitID) {

    return new Promise(function (resolve, reject) {
        pool.query("delete from Kits where KitID=?",[KitID], function (err, results, fields) {
            if (err) {               
                console.log("Error in checking KitID from DB :" + err);
                reject(0);
            }
            else {
                
                console.log(results.affectedRows, 'affected rows')
                if (results.affectedRows > 0) {                    
                    resolve(1);
                }
                else {                    
                    console.log("error in deleting kit");
                    resolve(0);
                }
            }
        });
    });
}

function deletevariants_variantid(VariantID) {

    return new Promise(function (resolve, reject) {
        pool.query("delete from ProductVariants where VariantID=?",[VariantID], function (err, results, fields) {
            if (err) {               
                console.log("Error in checking ProductVariants from DB :" + err);
                reject(0);
            }
            else {
                
                console.log(results.affectedRows, 'affected rows')
                if (results.affectedRows > 0) {                    
                    resolve(1);
                }
                else {                    
                    console.log("error in product delete cariant");
                    resolve(0);
                }
            }
        });
    });
}

function createkit(body) {
    try {
        return new Promise(function (resolve, reject) {
            let InsertKits = {KitName: body.KitName, Description: body.Description,ImageUrl: "NA",status:1,Price: body.Price,OfferPrice: body.OfferPrice}
            let sql = "INSERT INTO Kits set ?";
            pool.query(sql, InsertKits, (err, results) => {
                    console.log('add Kits')
                    if(err){
                                console.log(err)
                                return reject(-1)}
                    if (results.affectedRows == 1) {
                                resolve({"status":1,"ID":results.insertId})}
                    else {
                                console.log("error in insert Kits to table ", results.affectedRows);
                                reject(-1)}
            }) 
        });
    }
    catch (err) {
        reject(-1)
    }
}

function createRecommendedProduct(body) {
    try {
        return new Promise(function (resolve, reject) {
            let InsertRecommendedProducts = {ProductID: body.ProductID,status:1}
            let sql = "INSERT INTO RecommendedProducts set ?";
            pool.query(sql, InsertRecommendedProducts, (err, results) => {
                    console.log('add RecommendedProducts')
                    if(err){
                                console.log(err)
                                return reject(-1)}
                    if (results.affectedRows == 1) {
                                resolve({"status":1,"ID":results.insertId})}
                    else {
                                console.log("error in insert RecommendedProducts to table ", results.affectedRows);
                                reject(-1)}
            }) 
        });
    }
    catch (err) {
        reject(-1)
    }
}

function deleteRecommendedProducts(RecProductID) {

    return new Promise(function (resolve, reject) {
        console.log(RecProductID)
        pool.query("update RecommendedProducts set Status=0 where RecProductID=?",[RecProductID], function (err, results, fields) {
            if (err) {               
                console.log("Error in checking RecProductID from DB :" + err);
                reject(0);
            }
            else {
                
                console.log(results.affectedRows, 'affected rows')
                if (results.affectedRows > 0) {                    
                    resolve(1);
                }
                else {                    
                    console.log("error in deleting kit");
                    resolve(0);
                }
            }
        });
    });
}
;

