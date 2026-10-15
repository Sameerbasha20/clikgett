const express = require('express');
const mysql = require('mysql');
require('dotenv').config()
var moment = require('moment');
const jwt = require('jsonwebtoken');
var fs = require('fs')
const AWS = require('aws-sdk');
const CommonController = require("../controllers/CommonController");

const pool = require('../utils/db');
const s3 = require('../utils/s3');

// Banners_s3="https://dm95er30b2f9h.cloudfront.net/Banners/"
const Banners_s3 = "https://d3c9kvg5gaqz48.cloudfront.net/Banners/"


const categories_s3 = "https://d3c9kvg5gaqz48.cloudfront.net/Categories/"

const Products_s3 = "https://d3c9kvg5gaqz48.cloudfront.net/Products/"

const subcategories_s3 = "https://d3c9kvg5gaqz48.cloudfront.net/SubCategories/"



const bannercontroller = {

    //send otp and insert into verifymob

    getallbanners: async (req, resp, next) => {
        try {

            query = "SELECT B.*, SC.CategoryID as ParentCategoryID FROM Banners B LEFT JOIN SubCategories SC ON B.DestinationType = 'subcategory' AND B.DestinationID = SC.SubCategoryID WHERE B.Status!=0 ORDER BY B.CreatedAt DESC;"
            let results = await CommonController.commonget(query);
            if (results.length > 0) {
                for (var j = 0; j < results.length; j++) {
                    if (results[j].ImageUrl != "NA") {
                        results[j].ImageUrl = Banners_s3 + results[j].ImageUrl
                    }
                }
            }
            resp.json({ "status": 1, "Banners": results })


        }
        catch (e) {


            console.log(e)
            return resp.json({ "status": 0, "Message": 'error' })
        }
    },

    bannersdetail: async (req, resp, next) => {
        try {
            console.log(req.AdminID);
            query = "select * from Banners where Status!=0 and BannerID=" + pool.escape(req.params.BannerID)
            let results = await CommonController.commonget(query);
            if (results.length > 0) {
                for (var j = 0; j < results.length; j++) {
                    if (results[j].ImageUrl != "NA") {
                        results[j].ImageUrl = Banners_s3 + results[j].ImageUrl
                    }
                }
                resp.json({ "status": 1, "Banners": results[0] })
            }
            else {
                resp.json({ "status": 1, "Banners": {} })
            }


        }
        catch (e) {


            console.log(e)
            return resp.json({ "status": 0, "Message": 'error' })
        }
    },

    addbanner: async (req, resp, next) => {
        try {

            body = req.body
            const keys = Object.keys(body);

            column = ['BannerName', 'ImageUrl']
            for (let val of column) {

                if (keys.includes(val) == false) {
                    return resp.json({ 'Status': 0, "Message": val + ' is a mandatory field' })
                }
            }

            if (body.Description == null || body.Description == undefined)
                body.Description = 'NA'



            let Insertbanner = { 
        BannerName: body.BannerName, 
        ImageUrl: body.ImageUrl, 
        Description: body.Description, 
        DestinationType: body.DestinationType || 'none',
        DestinationID: body.DestinationID ? parseInt(body.DestinationID) : null,
        Status: 1 
    }

            let sql = "INSERT INTO Banners set ?";

            pool.query(sql, Insertbanner, (err, results) => {
                console.log('post method', results, err)
                if (results.affectedRows === 1) {
                    BannerID = results.insertId
                    if (body.ImageUrl != null || body.ImageUrl != undefined) {
                        let base64String = 'data:image/png;base64,' + body.ImageUrl; // Not a real image 
                        let base64Image = base64String.split(';base64,').pop();
                        var imagename = Date.now() + "_" + BannerID + '.png'
                        console.log(imagename)
                        image = "ImageUrl=" + pool.escape(imagename) + "";
                        fs.writeFile("images/" + imagename, base64Image, { encoding: 'base64' }, function (err) {

                            const fileContent = fs.readFileSync("images/" + imagename);
                            const params = {
                                Bucket: process.env.bucketname, Key: 'Banners/' + imagename,
                                Body: fileContent,
                                ACL: 'public-read'
                            };

                            s3.upload(params, function (err, data) {
                                if (err) {
                                    throw err;
                                }
                                console.log("UPDATE Banners SET " + image + " WHERE BannerID=" + BannerID)
                                pool.query("UPDATE Banners SET " + image + " WHERE BannerID=" + BannerID + ";", function (err, results, fields) { })

                                console.log(`File uploaded successfully. ${data.Location}`);


                            });
                        });
                    }
                    return resp.status(200).json({ "status": 1, "Message": "Banner Added successfully" });
                }
                else {
                    console.log("error in insert user to table ", results.affectedRows);
                    return resp.status(400).json({ "status": 0, "Message": "error" });
                }
            })
        }
        catch (err) {
            console.log("exception in adding banners ", err);
            return resp.status(500).json({ "status": 0, "Message": "Error in adding banners" });
        }
    },

    updateBanner: async (req, resp, next) => {
        try {
            Body = req.body

            getbanners = await getbanner(req.params.BannerID)
            if (!getbanners || getbanners.length == 0) {
                return resp.json({ "status": 0, "Message": "Banner not found" });
            }

            if (Body.BannerName != null || Body.BannerName != undefined)
                BannerName = "BannerName=" + pool.escape(Body.BannerName) + ",";
            else
                BannerName = "BannerName = BannerName,";

            if (Body.Description != null || Body.Description != undefined)
                Description = "Description=" + pool.escape(Body.Description) + ",";
            else
                Description = "Description = Description,";

            BannerID = req.params.BannerID
            if (Body.ImageUrl != null || Body.ImageUrl != undefined) {
                let base64String = 'data:image/png;base64,' + Body.ImageUrl; // Not a real image 
                let base64Image = base64String.split(';base64,').pop();
                var imagename = Date.now() + "_" + BannerID + '.png'
                console.log(imagename)
                image = "ImageUrl=" + pool.escape(imagename) + "";
                fs.writeFile(imagename, base64Image, { encoding: 'base64' }, function (err) {

                    const fileContent = fs.readFileSync(imagename);
                    const params = {
                        Bucket: process.env.bucketname, Key: 'Banners/' + imagename,
                        Body: fileContent,
                        ACL: 'public-read'
                    };

                    s3.upload(params, function (err, data) {
                        if (err) {
                            throw err;
                        }
                        console.log("UPDATE Banners SET " + image + " WHERE BannerID=" + BannerID)
                        pool.query("UPDATE Banners SET " + image + " WHERE BannerID=" + BannerID + ";", function (err, results, fields) { })

                        console.log(`File uploaded successfully. ${data.Location}`);


                    });
                });
            }


            if (Body.Status != null || Body.Status != undefined)
                Status = "Status=" + pool.escape(Body.Status) + "";
            else
                Status = "Status = Status";



            let destType = Body.DestinationType != null ? "DestinationType=" + pool.escape(Body.DestinationType) + "," : "";
            let destId = Body.DestinationID !== undefined ? "DestinationID=" + (Body.DestinationID ? parseInt(Body.DestinationID) : "NULL") + "," : "";
            queryString = "UPDATE Banners SET " + BannerName + Description + destType + destId + Status + " WHERE BannerID=" + pool.escape(req.params.BannerID) + ";";
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
                            resp.json({ "status": 1, "Message": "Banner Update Successful" });
                        }
                        else {
                            console.log("Banner update failed", err, queryString);
                            resp.json({ "status": 0, "Message": "No changes to update" });

                        }

                    }
                });
            });
        }
        catch (err) {
            console.log("exception in updating Banner ", err);
            return resp.status(500).json({ "status": 0, "Message": "Error in updating Banner" });
        }
    },


    deleteBanner: async (req, resp, next) => {
        try {

            getallbanners = await getbanner(req.params.BannerID)
            if (!getallbanners || getallbanners.length == 0) {
                return resp.json({ "status": 0, "Message": "Banner not found" });
            }

            pool.query(`delete from Banners where BannerID=?`, [req.params.BannerID], (err, results) => {
                console.log('connecting')
                if (err) {
                    return resp.json({ "status": 0, "Message": err.sqlMessage });
                }
                if (results.affectedRows === 1) {

                    resp.json({ "status": 1, "Message": "Banner deleted Successfully" })
                }
                else { resp.json({ "status": 0, "Message": "Error in deleting banners" }) }


            });
        }
        catch (err) {
            console.log("exception in deleting Banner ", err);
            return resp.status(500).json({ "status": 0, "Message": "Error in deleting Banner" });
        }
    },


}



function getbanner(BannerID) {
    try {
        return new Promise(function (resolve, reject) {
            pool.query("select * from Banners where BannerID=?", [BannerID], async (err, results) => {

                if (err) {

                    resolve(0);
                }


                console.log("retrived banners : ", results.length);
                resolve(results)

            });
        });
    }
    catch (err) {
        console.log("error in retrieving wallet balance");
        return -1;
    }
}



module.exports = bannercontroller