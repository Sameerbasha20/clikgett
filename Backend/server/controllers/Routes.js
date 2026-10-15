const express = require('express'); 
const mysql=require('mysql');
require('dotenv').config()
var moment = require('moment'); 
const jwt = require('jsonwebtoken');
var fs = require('fs')
const AWS = require('aws-sdk');

const pool = require('../utils/db');
const s3 = require('../utils/s3');

Routes_s3="https://dm95er30b2f9h.cloudfront.net/Routes/"




const Routecontroller={

    //send otp and insert into verifymob

    routesbystatus : async (req, resp, next) => {
        try{
            console.log(req.AdminID);
            pool.query("select * from Routes where Status=? order by CreatedAt desc;",[req.query.Status],(err,results)=>{
                console.log('connecting')
                if(err) {
                        return resp.json({"status":0,"Message":err.sqlMessage});}              
                        
                if (results.length>0){
                    for (var j = 0; j < results.length; j++){
                        results[j].OrderIDs = JSON.parse(results[j].OrderIDs);                                                                                   
                    }
                        resp.json({"status":1,"Routes":results})}
                else{
                        resp.json({"Status":1,"Routes":[]})}
            
                    });
            
        }
        catch(e){
            
            
            console.log(e)
            return resp.json({"status":0,"Message":'error'})
        }
    },

    Routesdetail : async (req, resp, next) => {
        try{
            
                results=await getroutesdetail(req.params.RouteID)  
                
                if (results.length>0){
                    
                        results[0].OrderIDs = JSON.parse(results[0].OrderIDs);
                        orders=[]

                        for (var j = 0; j < results[0].OrderIDs.length; j++){  
                                orderresult =await getorder(results[0].OrderIDs[j])
                                if (orderresult.length == 1){
                                    userresult = await getusername(orderresult[0]['UserID'])
                                    console.log(userresult,'username')
                                    orderresult[0]['UserName']=userresult
                                    orders.push(orderresult[0])
                                }
                         }                                                                                
                         results[0]['Orders']=orders
                        resp.json({"Status":1,"Orders":results})
                    }
                else{
                        resp.json({"Status":1,"Orders":[]})
                    }
    
            
        }
        catch(e){
            
            
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },

    

    addRoute : async (req, resp, next) => {
        try {

            body=req.body 
            
            for (var j = 0; j < body.OrderIDs.length; j++){  

                orderresult =await getorder(body.OrderIDs[j])
                if(orderresult.length!=1){
                    return resp.json({ "status": 0, "Message": "OrderID "+body.OrderIDs[j]+" doesnot exists" });
                }

                console.log(orderresult[0]['OrderType'],orderresult[0]['OrderType']==="Pickup")
            if(orderresult[0]['OrderType'] === "Pickup"){
                return resp.json({ "Status": 0, "Message": "You cannot assign a pickup order"});
            }

                else if(orderresult.length == 1){
                    if(orderresult[0]['IsAssigned']==1){
                        return resp.json({ "status": 0, "Message": "OrderID "+body.OrderIDs[j]+" Already assigned to deliverboy" });
                    }
                }
            
            }
            

            if (body.Name == null || body.Name == undefined)
                                body.Name = 'NA'
            
            let InsertRoute = {OrderIDs: JSON.stringify(body.OrderIDs),Name:body.Name,DeliveryBoyID: body.DeliveryBoyID,Status:body.Status}

            let sql = "INSERT INTO Routes set ?";

            pool.query(sql, InsertRoute, async (err, results) => {
                if (err) console.log('db error', err.sqlMessage || err.message); results = results || { affectedRows: 0 };  // never crash on a failed query
                console.log('post method', results, err)
                if (results.affectedRows === 1) {
                                await updateorders(body.OrderIDs,body.DeliveryBoyID)
                                return resp.status(200).json({ "status": 1, "Message": "Route Added successfully" });
                                }
                else {
                                console.log("error in insert user to table ", results.affectedRows);
                                return resp.status(400).json({ "status": 0, "Message": "error" });
                                            }
                                        })
        }
        catch (err) {
            console.log("exception in adding Routes ", err);
            return resp.status(500).json({ "status": 0, "Message": "Error in adding Routes" });
        }
    },
    
    updateRoute : async (req, resp, next) => {
        try {
            Body=req.body

            var getRoutes = await getRoute(req.params.RouteID);
            if (!getRoutes || getRoutes.length == 0) {
                return resp.json({ "status": 0, "Message": "Route not found" });
            }
            console.log(getRoutes);
            var DeliverboyID = getRoutes[0]['DeliveryBoyID'];
            console.log(DeliverboyID,'DeliverboyID')

            if (Body.OrderIDs != null || Body.OrderIDs != undefined){
                    for (var j = 0; j < Body.OrderIDs.length; j++){  

                        orderresult =await getorder(Body.OrderIDs[j])
                        if(orderresult.length!=1){
                            return resp.json({ "status": 0, "Message": "OrderID "+Body.OrderIDs[j]+" doesnot exists" });
                        }
                        else if(orderresult.length == 1){
                            if(orderresult[0]['IsAssigned']==1 && orderresult[0]['DeliveryBoyID']!=DeliverboyID){
                                return resp.json({ "status": 0, "Message": "OrderID "+Body.OrderIDs[j]+" Already assigned to deliverboy" });
                            }
                        }
                    
                    }
                    OrderIDs = "OrderIDs='" + JSON.stringify(Body.OrderIDs)+"',";}
            else{
                    OrderIDs = "OrderIDs = OrderIDs,";}

            if (Body.DeliveryBoyID != null || Body.DeliveryBoyID != undefined)
            DeliveryBoyID = "DeliveryBoyID=" + pool.escape(Body.DeliveryBoyID) + ",";
            else
            DeliveryBoyID = "DeliveryBoyID = DeliveryBoyID,";

            
            if (Body.Name != null || Body.Name != undefined)
            Name = "Name=" + pool.escape(Body.Name) + ",";
            else
            Name = "Name = Name,";

            if (Body.Status != null || Body.Status != undefined)
            Status = "Status=" + pool.escape(Body.Status)+"";
            else
            Status = "Status = Status";

           

            queryString = "UPDATE Routes SET " +OrderIDs+DeliveryBoyID+Name+Status+" WHERE RouteID=" + pool.escape(req.params.RouteID) + ";";
            console.log(queryString)
            return new Promise(function(resolve, reject) {
                pool.query(queryString, function(err, result, fields) {
                    if (err) {
                                console.log("Error in updating the DB:" + err);
                                return resp.json({ "status": 0, "Message": "Error in updating the DB" });
                            }
                            else {
                                console.log("update :" + result.affectedRows);
                                if (result.affectedRows > 0) {
                                    console.log('update successful')
                                    return resp.json({ "status": 1, "Message": "Route Update Successful" });
                                }
                                else {
                                    console.log("Route update failed", err, queryString);
                                    return resp.json({ "status": 0, "Message": "No changes to update" });
                                }
                            }
                });
            });
        }
        catch (err) {
            console.log("exception in updating Route ", err);
            return resp.status(500).json({ "status": 0, "Message": "Error in updating Route" });
        }
    },


    deleteRoute : async (req, resp, next) => {
        try {

            getallRoutes=await getRoute(req.params.RouteID)
            if (!getallRoutes || getallRoutes.length==0){
                return resp.json({"status":0,"Message":"Route not found"});
            }

            pool.query(`update Routes set Status=0 where RouteID=?`,[req.params.RouteID],(err,results)=>{
                console.log('connecting')
                if(err) {
                    return resp.json({"status":0,"Message":err.sqlMessage});
                }
                if(results.affectedRows===1){
                    
                    resp.json({"status":1,"Message":"Route deleted Successfully"})
                }
                else{resp.json({"status":0,"Message":"Error in deleting Routes"})}
                
    
            });
        }
        catch (err) {
            console.log("exception in deleting Route ", err);
            return resp.status(500).json({ "status": 0, "Message": "Error in deleting Route" });
        }
    },


    routesbydeliveryboyID : async (req, resp, next) => {
        try{
            console.log(req.AdminID);
            pool.query("select * from Routes where DeliveryBoyID=? order by CreatedAt desc;",[req.AdminID],(err,results)=>{
                console.log('connecting')
                if(err) {
                        return resp.json({"status":0,"Message":err.sqlMessage});}              
                        
                if (results.length>0){
                    for (var j = 0; j < results.length; j++){
                        results[j].OrderIDs = JSON.parse(results[j].OrderIDs);                                                                                   
                    }
                        resp.json({"status":1,"Routes":results})}
                else{
                        resp.json({"Status":1,"Routes":[]})}
            
                    });
            
        }
        catch(e){
            
            
            console.log(e)
            return resp.json({"status":0,"Message":'error'})
        }
    },

    Routesdetail_deliveryboy  : async (req, resp, next) => {
        try{
            console.log(req.AdminID);
            pool.query("select * from Routes where Status!=0 and RouteID=?;",[req.params.RouteID],(err,results)=>{
                console.log('connecting')
                if(err) {
                        return resp.json({"status":0,"Message":err.sqlMessage});}              
                        
                if (results.length>0){
                    for (var j = 0; j < results.length; j++){
                        results[j].OrderIDs = JSON.parse(results[j].OrderIDs);                                                                                   
                    }
                        resp.json({"status":1,"Routes":results[0]})}
                else{
                        resp.json({"Status":1,"Routes":{}})}
            
                    });
            
        }
        catch(e){
            
            
            console.log(e)
            return resp.json({"status":0,"Message":'error'})
        }
    },
}



function getRoute(RouteID) {
    try {
        return new Promise(function (resolve, reject) {
            pool.query("select * from Routes where RouteID=?", [RouteID], async (err, results) => {
                
                if(err) {
                    
                    resolve(0);
                } 
               
                    
                    console.log("retrived Routes : ", results.length);
                    resolve(results)
                
            });
        });
    }
    catch (err) {
        console.log("error in retrieving wallet balance");
        return -1;
    }
}


function getroutesdetail(RouteID) {
    try {
        return new Promise(function (resolve, reject) {
            console.log("select * from Routes where RouteID=?", RouteID)
            pool.query("select * from Routes where RouteID=?", [RouteID], async (err, results) => {
                
                if(err) {                    
                    return reject(-1);
                    } 
                    
                else{

                    console.log("retrived Routes : ", results.length);
                    resolve(results)}
                
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
            console.log("select * from Orders where OrderID=?",OrderID)
            pool.query("select * from Orders where OrderID=?", [OrderID], async (err, results) => {
                
                if(err) {                    
                    return reject(-1);
                    } 
                    
                else{

                    console.log("retrived orders : ", results.length);
                    resolve(results)}
                
            });
        });
    }
    catch (err) {
        console.log("error in retrieving orders");
        return reject(-1);
    }
}


function getusername(UserID) {
    try{
            return new Promise(function (resolve, reject) {
                query="select *,concat(FirstName,' ',LastName) as Name from Users where UserID=?"
                console.log(query,UserID)                 
                pool.query(query,[UserID], function (err, results, fields) {
                    if (err) {               
                        console.log("Error in checking orderid from DB :" + err);
                        return resolve("NA")}
                    else {               
                            if(results.length > 0 ){
                                return resolve(results[0]['Name'])                            
                            }
                            else{
                                return resolve("NA")
                            }
                        }
                });
            });
    }
    catch (err) {
        console.log("exception in getting users ", err);
        return resolve("NA")
    }
}



function updateorders(OrderIDs,DeliveryBoyID) {
    try{
            return new Promise(function (resolve, reject) {
                for (var j = 0; j < OrderIDs.length; j++){
                    console.log(OrderIDs)
                    query="update Orders set DeliveryBoyID=?,IsAssigned=1 where OrderID=?"
                    console.log(query,[DeliveryBoyID,OrderIDs[j]])
                    pool.query(query, [DeliveryBoyID,OrderIDs[j]], function (err, results) {
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
module.exports=Routecontroller