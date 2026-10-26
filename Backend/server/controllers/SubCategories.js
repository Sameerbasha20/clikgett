const express = require('express');
const mysql = require('mysql');
require('dotenv').config()
var moment = require('moment');
var fs = require('fs')

const pool = require('../utils/db');
const s3 = require('../utils/s3');
// categories_s3="http://clikgett-media.local/Categories/"
// subcategories_s3 = "http://clikgett-media.local/SubCategories/"


const categories_s3 = "http://clikgett-media.local/Categories/"

const Products_s3 = "http://clikgett-media.local/Products/"

const subcategories_s3 = "http://clikgett-media.local/SubCategories/"



const subcategorycontroller = {


    subcategories_admin: async (req, resp, next) => {
        try {

            pool.query("select * from SubCategories where Status!=0 order by DisplayOrder asc, SubCategoryName asc;", [req.params.CategoryID], (err, results) => {
                console.log('connecting')
                if (err) {

                    return resp.json({ "Status": 0, "Message": err.sqlMessage });
                }

                if (results.length > 0) {

                    resp.json({ "Status": 1, "SubCategories": results })
                }
                else {
                    resp.json({ "Status": 1, "SubCategories": [] })
                }

            });
        }
        catch (e) {


            console.log(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },

    subcategoriesbycategory_admin: async (req, resp, next) => {
        try {

            pool.query("select * from SubCategories where CategoryID=? and Status!=0 order by DisplayOrder asc, SubCategoryName asc;", [req.params.CategoryID], (err, results) => {
                console.log('connecting')
                if (err) {

                    return resp.json({ "Status": 0, "Message": err.sqlMessage });
                }

                if (results.length > 0) {

                    resp.json({ "Status": 1, "SubCategories": results })
                }
                else {
                    resp.json({ "Status": 1, "SubCategories": [] })
                }

            });
        }
        catch (e) {


            console.log(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },

    subcategorydetail_admin: async (req, resp, next) => {
        try {

            pool.query("select * from SubCategories where SubCategoryID=? and Status!=0;", [req.params.SubCategoryID], (err, results) => {
                console.log('connecting')
                if (err) {

                    return resp.json({ "Status": 0, "Message": err.sqlMessage });
                }

                if (results.length > 0) {

                    resp.json({ "Status": 1, "SubCategories": results[0] })
                }
                else {
                    resp.json({ "Status": 1, "SubCategories": {} })
                }

            });
        }
        catch (e) {


            console.log(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },

    addsubcategory: async (req, resp, next) => {
        let Categoryexists, addsubcategory, body, column; // per-request (were implicit globals)
        try {

            body = req.body
            const keys = Object.keys(body);

            column = ['SubCategoryName', 'CategoryID']
            for (let val of column) {

                if (keys.includes(val) == false) {
                    return resp.json({ 'Status': 0, "Message": val + ' is a mandatory field' })
                }
            }

            Categoryexists = await get_admincategory(body.CategoryID)
            if (Categoryexists == -1) {
                return resp.json({ "Status": 0, "Message": "Error in getting Category" });
            }
            if (Categoryexists.length == 0) {
                return resp.json({ "Status": 0, "Message": "Category doesnot exists" });
            }


            addsubcategory = await createsubcategories(body)
            console.log(addsubcategory)
            if (addsubcategory == -1) {
                return resp.json({ "Status": 0, "Message": "error in adding Sub Category" });
            }

            return resp.json({ "Status": 1, "Message": "Sub Category added Successful" });

        }
        catch (err) {
            console.log("exception in adding sub Categories ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in adding sub categories" });
        }
    },

    updatesubcategory: async (req, resp, next) => {
        let Body, CategoryID, Categoryexists, Status, SubCategoryName, queryString; // per-request (were implicit globals)
        try {
            Body = req.body

            if (Body.SubCategoryName != null || Body.SubCategoryName != undefined)
                SubCategoryName = "SubCategoryName='" + Body.SubCategoryName.replace(/'/g, "\\'") + "',";
            else
                SubCategoryName = "SubCategoryName = SubCategoryName,";

            if (Body.CategoryID != null || Body.CategoryID != undefined) {
                Categoryexists = await get_admincategory(Body.CategoryID)
                if (Categoryexists == -1) {
                    return resp.json({ "Status": 0, "Message": "Error in getting Category" });
                }
                if (Categoryexists.length == 0) {
                    return resp.json({ "Status": 0, "Message": "Category doesnot exists" });
                }
                CategoryID = "CategoryID=" + pool.escape(Body.CategoryID) + ","
            }
            else {
                CategoryID = "CategoryID = CategoryID,";
            }



            if (Body.Status != null || Body.Status != undefined)
                Status = "Status=" + pool.escape(Body.Status)
            else
                Status = "Status = Status";

            queryString = "UPDATE SubCategories SET " + SubCategoryName + CategoryID + Status + " WHERE SubCategoryID=" + pool.escape(req.params.SubCategoryID) + ";";
            console.log(queryString)
            return new Promise(function (resolve, reject) {
                pool.query(queryString, function (err, result, fields) {
                    if (err) {
                        console.log("Error in updating the DB:" + err);
                        resp.json({ "Status": 0, "Message": "Error in updating the DB" });
                    }
                    else {
                        console.log("update :" + result.affectedRows);
                        if (result.affectedRows > 0) {
                            resp.json({ "Status": 1, "Message": "Sub Category Update Successful" });
                        }
                        else {
                            resp.json({ "Status": 0, "Message": "No changes to update" });
                        }

                    }
                });
            });
        }
        catch (err) {
            console.log("exception in updating Categories ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in updating categories" });
        }
    },

    deletesubcategory: async (req, resp, next) => {
        let products; // per-request (were implicit globals)
        try {
            console.log('here')
            products = await getproducts(req.params.SubCategoryID)
            if (products == -1) {
                return resp.json({ "Status": 0, "Message": "error in deleting subcategories" })
            }
            console.log(products)
            if (products.length > 0) {

                return resp.json({ "Status": 0, "Message": "Can't delete as there are products associated with this subcategory" })
            }
            pool.query(`delete from SubCategories where SubCategoryID=?`, [req.params.SubCategoryID], (err, results) => {
                console.log('connecting')
                if (err) {
                    return resp.json({ "Status": 0, "Message": err.sqlMessage });
                }
                if (results.affectedRows == 1) {

                    return resp.json({ "Status": 1, "Message": "Sub Category deleted Successfully" })
                }
                else { return resp.json({ "Status": 0, "Message": "Sub Category not found" }) }


            });
        }
        catch (err) {
            console.log("exception in deleting Categories ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in deleting categories" });
        }
    },    reordersubcategories: async (req, resp, next) => {
        try {
            let reorderItems = req.body.items;
            if (!reorderItems && Array.isArray(req.body.orderedIds)) {
                reorderItems = req.body.orderedIds.map((id, idx) => ({
                    SubCategoryID: id,
                    DisplayOrder: idx + 1
                }));
            }

            if (!Array.isArray(reorderItems) || reorderItems.length === 0) {
                return resp.status(400).json({ Status: 0, Message: "items or orderedIds array is required" });
            }

            for (const item of reorderItems) {
                if (item.SubCategoryID !== undefined && item.DisplayOrder !== undefined) {
                    await new Promise(r => pool.query(
                        "UPDATE SubCategories SET DisplayOrder = ? WHERE SubCategoryID = ?",
                        [parseInt(item.DisplayOrder, 10), parseInt(item.SubCategoryID, 10)],
                        r
                    ));
                }
            }

            return resp.json({ Status: 1, Message: "Subcategories reordered successfully" });
        } catch (err) {
            console.error("Error reordering subcategories:", err);
            return resp.status(500).json({ Status: 0, Message: "Error reordering subcategories" });
        }
    },
};

function createsubcategories(body) {
    try {
        return new Promise(function (resolve, reject) {

            let InsertSubCategories = { SubCategoryName: body.SubCategoryName.replace(/'/g, "\\'"), Status: 1, CategoryID: body.CategoryID }

            let sql = "INSERT INTO SubCategories set ?";

            pool.query(sql, InsertSubCategories, (err, results) => {
                if (err) console.log('db error', err.sqlMessage || err.message); results = results || { affectedRows: 0 };  // never crash on a failed query
                console.log('post method', results, err)
                if (results.affectedRows === 1) {

                    resolve(results.insertId)



                }
                else {
                    resolve(-1)
                }
            })




        });
    }
    catch (err) {
        resolve(-1)
    }
}


function getproducts(SubCategoryID) {
    try {
        return new Promise(function (resolve, reject) {
            pool.query("select * from Products where SubCategoryID=?", [SubCategoryID], async (err, results) => {

                if (err) {
                    resolve(-1);
                }

                console.log("retrived Products : ", results.length);
                resolve(results)
            });
        });
    }
    catch (err) {
        console.log("error in retrieving wallet balance");
        resolve(-1);
    }
}







function get_admincategory(CategoryID) {
    try {
        return new Promise(function (resolve, reject) {
            pool.query("select * from Categories where CategoryID=? and status=1", [CategoryID], async (err, results) => {

                if (err) {
                    resolve(-1);
                }

                console.log("retrived Products : ", results.length);
                resolve(results)
            });
        });
    }
    catch (err) {
        console.log("error in retrieving categories");
        resolve(-1);
    }
}


function get_adminsubcategory(SubCategoryID) {
    try {
        return new Promise(function (resolve, reject) {

            pool.query("select * from SubCategories where SubCategoryID=? and status!=0", [SubCategoryID], async (err, results) => {

                if (err) {
                    resolve(-1);
                }

                console.log("retrived Products : ", results.length);
                resolve(results)
            });
        });
    }
    catch (err) {
        console.log("error in retrieving categories");
        resolve(-1);
    }
}

module.exports = subcategorycontroller;

