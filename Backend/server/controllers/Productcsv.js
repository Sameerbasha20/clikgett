const express = require('express'); 
const mysql=require('mysql');
require('dotenv').config()
var moment = require('moment'); 
var fs = require('fs')
const csv = require('csvtojson');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const CommonController = require("../controllers/CommonController");

const pool = require('../utils/db');

const s3 = require('../utils/s3');
const Products_s3="http://clikgett-media.local/Products/"

const adminproductcontroller={

    

    updateproduct_csv : async (req, resp, next) => {
        let Body, result; // per-request (were implicit globals)
        try {
            Body=req.body
            console.log(Body,'Body')
            const params = {
                Bucket: process.env.bucketname,
                Key: 'productscsv/'+req.params.filename
            };

            const stream = s3.getObject(params).createReadStream();
            // convert csv file (stream) to JSON format data
            const json = await csv().fromStream(stream);
            console.log(json);

            // Only numbers go into the query; a blank or bad cell leaves that price as it is.
            const priceOrNull = (v) => {
                const n = Number(String(v ?? '').trim());
                return String(v ?? '').trim() !== '' && Number.isFinite(n) && n >= 0 ? n : null;
            };
            let skipped = 0;
            for (const row of json) {
                const productId = parseInt(row['ProductID'], 10);
                const variantId = parseInt(row['VariantID'], 10);
                if (!productId || !variantId) { skipped++; continue; }
                result = await updateexistingitem(productId, variantId, priceOrNull(row['Price']), priceOrNull(row['OfferPrice']));
            }
            if (skipped) console.log(`CSV price update: skipped ${skipped} row(s) without a valid ProductID/VariantID`);
            return resp.json({ "Status": 1, "Message": "Products updated successfully" });
    }
        catch (err) {
            console.log("exception in updating Products ", err);
            return resp.json({ "Status": 0, "Message": "Error in updating Products" });
        }
    },

    orderdetails : async (req, resp, next) => {
        let getrecords, image, location, newlist, records; // per-request (were implicit globals)
        try {

            getrecords = await getpendingorders()

            records = [{
                "OrderID": "Order No","MobileNumber": "Phone Number","Address": "Address","City": "Area","OrderDetails": "Order Details",
                
            }]
            const results = getrecords
            
            const csvStringifier = createCsvStringifier({
                header: [
                    {id: 'OrderID', title: 'Order No'},
                    {id: 'MobileNumber', title: 'Phone Number'},
                    {id: 'Address', title: 'Mobile Number'},
                    {id: 'City', title: 'Area'},
                    {id: 'OrderDetails', title: 'OrderDetails'}
                ]
            });
            newlist = records.concat(results)
            // console.log(newlist)
            const csv = csvStringifier.stringifyRecords(newlist);
            image = Date.now()+".csv"
            const params = {
                Bucket: process.env.bucketname, // pass your bucket name
                Key: "csv/orders_"+image, // file will be saved as testBucket/contacts.csv
                ACL: "public-read",
                Body: csv,
                ContentType: "text/csv",
            };

            s3.upload(params, function (s3Err, data) {
                if (s3Err) throw s3Err;
                else {
                    console.log(data.Location)
                    location = data.Location
                    return resp.json({'Status':1,"File":location})
                
                }
            });

        } 
        catch(e){
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },

    productdetails : async (req, resp, next) => {
        let getrecords, image, location, newlist, records; // per-request (were implicit globals)
        try {

            getrecords = await getproductdetails()

            records = [{
                "ProductName": "Product Name","metrictype": "Metric Type","metricvalue": "Metric Value",
                "TotalQuantity": "Quantity"
                
            }]
            const results = getrecords
            
            const csvStringifier = createCsvStringifier({
                header: [
                    {id: 'ProductName', title: 'Product Name'},
                    {id: 'metrictype', title: 'Metric Type'},
                    {id: 'metricvalue', title: 'Metric Value'},
                    {id: 'TotalQuantity', title: 'Quantity'}
                ]
            });
            newlist = records.concat(results)
            // console.log(newlist)
            const csv = csvStringifier.stringifyRecords(newlist);
            image = Date.now()+".csv"
            const params = {
                Bucket: process.env.bucketname, // pass your bucket name
                Key: "csv/products_"+image, // file will be saved as testBucket/contacts.csv
                ACL: "public-read",
                Body: csv,
                ContentType: "text/csv",
            };

            s3.upload(params, function (s3Err, data) {
                if (s3Err) throw s3Err;
                else {
                    console.log(data.Location)
                    location = data.Location
                    return resp.json({'Status':1,"File":location})
                
                }
            });

        } 
        catch(e){
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },

    warehousedetails : async (req, resp, next) => {
        let getrecords, image, location, newlist, records; // per-request (were implicit globals)
        try {

            getrecords = await getpendingorders()

            records = [{
                "OrderID": "Order No","MobileNumber": "Phone Number","Address": "Address","City": "Area","OrderDetails": "Order Details",
                
            }]
            const results = getrecords
            
            const csvStringifier = createCsvStringifier({
                header: [
                    {id: 'OrderID', title: 'Order No'},
                    {id: 'MobileNumber', title: 'Phone Number'},
                    {id: 'Address', title: 'Mobile Number'},
                    {id: 'City', title: 'Area'},
                    {id: 'OrderDetails', title: 'OrderDetails'}
                ]
            });
            newlist = records.concat(results)
            // console.log(newlist)
            const csv = csvStringifier.stringifyRecords(newlist);
            image = Date.now()+".csv"
            const params = {
                Bucket: process.env.bucketname, // pass your bucket name
                Key: "csv/warehouse_"+image, // file will be saved as testBucket/contacts.csv
                ACL: "public-read",
                Body: csv,
                ContentType: "text/csv",
            };

            s3.upload(params, function (s3Err, data) {
                if (s3Err) throw s3Err;
                else {
                    console.log(data.Location)
                    location = data.Location
                    return resp.json({'Status':1,"File":location})
                
                }
            });

        } 
        catch(e){
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },

    pendingorders_csv : async (req, resp, next) => {
        let image, location, newlist, query, records; // per-request (were implicit globals)
        try {

            
            query = "SELECT I.ProductName,I.ProductID,I.VariantID,sum(I.Quantity) as Quantity,I.metrictype,I.metricvalue\
            FROM Orders O inner join OrderItems I on O.OrderID=I.OrderID  where O.OrderStatus=2 \
            group by I.VariantID order by I.ProductName asc"
            let results = await CommonController.commonget(query); 
            records = [{
                "ProductName": "Product Name","metrictype": "Metric Type","metricvalue": "Metric Value","Quantity": "Quantity",
                
            }]
            
            const csvStringifier = createCsvStringifier({
                header: [
                    {id: 'ProductName', title: 'Product Name'},
                    {id: 'metrictype', title: 'Metric Type'},
                    {id: 'metricvalue', title: 'Metric Value'},
                    {id: 'Quantity', title: 'Quantity'}
                ]
            });
            newlist = records.concat(results)
            // console.log(newlist)
            const csv = csvStringifier.stringifyRecords(newlist);
            image = Date.now()+".csv"
            const params = {
                Bucket: process.env.bucketname, // pass your bucket name
                Key: "csv/pendingorders_"+image, // file will be saved as testBucket/contacts.csv
                ACL: "public-read",
                Body: csv,
                ContentType: "text/csv",
            };

            s3.upload(params, function (s3Err, data) {
                if (s3Err) throw s3Err;
                else {
                    console.log(data.Location)
                    location = data.Location
                    return resp.json({'Status':1,"File":location})
                
                }
            });

        } 
        catch(e){
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },

    

}



function updateexistingitem(ProductID, VariantID, Price, OfferPrice) {
    return new Promise(function (resolve, reject) {
        pool.query(
            "UPDATE ProductVariants SET Price = COALESCE(?, Price), OfferPrice = COALESCE(?, OfferPrice) WHERE ProductID = ? AND VariantID = ?",
            [Price, OfferPrice, ProductID, VariantID],
            function (err, results) {
                if (err) {
                    console.log("Error updating variant price:", err);
                    return reject(-1);
                }
                resolve(1);
            });
    });
}

function getpendingorders() {
    let query; // per-request (were implicit globals)
    try{

            return new Promise(function (resolve, reject) {
                query="SELECT OrderID,MobileNumber,Address,City from Orders where OrderStatus=2 order by CreatedAt desc"
                console.log(query)
                pool.query(query,function (err, results, fields) {
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
        console.log("exception in checking orders", err);
        reject(-1);
    }
}

function getproductdetails() {
    let query; // per-request (were implicit globals)
    try{

            return new Promise(function (resolve, reject) {
                query="SELECT OI.ProductName,metrictype,metricvalue,sum(OI.Quantity) as TotalQuantity FROM OrderItems OI inner join Orders O on\
                O.OrderID=OI.OrderID where \
                OrderStatus in (8,9) group by OI.ProductID,OI.VariantID order by ProductName asc"
                console.log(query)
                pool.query(query,function (err, results, fields) {
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
        console.log("exception in checking orders", err);
        reject(-1);
    }
}
module.exports=adminproductcontroller