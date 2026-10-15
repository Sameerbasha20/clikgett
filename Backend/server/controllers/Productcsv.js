const express = require('express'); 
const mysql=require('mysql');
require('dotenv').config()
var moment = require('moment'); 
var fs = require('fs')
const AWS = require('aws-sdk');
const csv = require('csvtojson');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const CommonController = require("../controllers/CommonController");

const pool = require('../utils/db');

const s3 = require('../utils/s3');
const Products_s3="https://d3c9kvg5gaqz48.cloudfront.net/Products/"

const adminproductcontroller={

    

    updateproduct_csv : async (req, resp, next) => {
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

            for (var j = 0; j < json.length; j++){
                    console.log(json[j]['Price'],json[j]['OfferPrice'])
                    if (json[j]['Price'] != null && json[j]['Price'] != undefined && json[j]['Price'] !== "" && json[j]['Price'] !== "null"){
                        Price = "Price=" + json[j]['Price'] }
                    else{
                        Price = "Price = Price";}

                    if (json[j]['OfferPrice'] != null && json[j]['OfferPrice'] != undefined && json[j]['OfferPrice'] !== "" && json[j]['OfferPrice'] !== "null"){
                        OfferPrice = "OfferPrice=" + json[j]['OfferPrice']}
                    else{
                        OfferPrice = "OfferPrice = OfferPrice";}

                    result = await updateexistingitem(json[j]['ProductID'],json[j]['VariantID'],Price,OfferPrice)
                    console.log(result)
            
                    }
            return resp.json({ "Status": 1, "Message": "Products updated successfully" });
    }
        catch (err) {
            console.log("exception in updating Products ", err);
            return resp.json({ "Status": 0, "Message": "Error in updating Products" });
        }
    },

    orderdetails : async (req, resp, next) => {
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



function updateexistingitem(ProductID,VariantID,Price,OfferPrice) {

    return new Promise(function (resolve, reject) {
            query="update ProductVariants set "+Price+","+OfferPrice+" where ProductID="+ProductID+" and VariantID="+VariantID+";"
            console.log(query)
            pool.query(query, function (err, results, fields) {
                if (err) {               
                    console.log("Error in checking CartId from DB :" + err);
                    reject(-1);
                }
                else {  
                    if (results.affectedRows === 1) {
                        console.log("product updated: ");
                        resolve(1);}
                    else {                    
                        console.log("product update failed");
                        resolve(1);}
                }
            });
    });
}

function getpendingorders() {
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
    try{

            return new Promise(function (resolve, reject) {
                query="SELECT OI.ProductName,metrictype,metricvalue,sum(OI.Quantity) as TotalQuantity FROM OrderItems OI inner join Orders O on\
                O.OrderID=OI.OrderID where \
                OrderStatus=2 group by OI.ProductID,OI.VariantID order by ProductName asc"
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