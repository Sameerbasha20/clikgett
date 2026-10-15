const express = require('express');
const mysql = require('mysql');
require('dotenv').config()
var moment = require('moment');
var fs = require('fs')
const AWS = require('aws-sdk');
const CommonController = require("../controllers/CommonController");

const pool = require('../utils/db');

const category_s3 = "https://d3c9kvg5gaqz48.cloudfront.net/Categories/"
const Products_s3 = "https://d3c9kvg5gaqz48.cloudfront.net/Products/"

const s3 = require('../utils/s3');
const categoriescontroller = {

    //// user ////
    // categories_subcategories : async (req, resp, next) => {
    //     try{
    //         subcategories=await subcategoriesbycategories(req.params.CategoryID)                 
    //         if(subcategories.length>0){                    
    //             return resp.json({"Status":1,"SubCategories":subcategories})
    //                 }
    //         else{
    //             return resp.json({"Status":1,"SubCategories":[]})
    //             }            
    //     }
    //     catch(e){
    //         console.log(e)
    //         return resp.json({"Status":0,"Message":'error'})
    //     }
    // },

    //NEWCODE
    categories_subcategories: async (req, resp, next) => {
        try {
            const subcategories = await subcategoriesbycategories(req.params.CategoryID);
            if (subcategories.length > 0) {
                return resp.json({ "Status": 1, "SubCategories": subcategories });
            } else {
                return resp.json({ "Status": 1, "SubCategories": [] });
            }
        } catch (e) {
            console.log(e);
            return resp.json({ "Status": 0, "Message": 'error' });
        }
    },


    SubcategoryDetail: async (req, resp, next) => {
        try {
            let query = "select * from SubCategories where SubCategoryID=" + pool.escape(req.params.SubCategoryID) + " and Status=1"
            let subcategories = await CommonController.commonget(query);

            if (subcategories.length > 0) {
                return resp.json({ "Status": 1, "SubCategories": subcategories[0] })
            }
            else {
                return resp.json({ "Status": 1, "SubCategories": {} })
            }
        }
        catch (e) {
            console.log(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },

    categories: async (req, resp, next) => {
        try {
            query = `select C.CategoryID,C.CategoryName,C.ImageUrl from Categories C 
            inner join SubCategories S on S.CategoryID=C.CategoryID\
            inner join Products p on p.SubCategoryID=S.SubCategoryID\
             inner join ProductVariants pv on p.ProductID=pv.ProductID\
                where C.Status=1 and S.Status=1 and p.Status=1 and pv.Status=1 group by C.CategoryID order by C.Priority asc;`
            //query="select CategoryID,CategoryName,ImageUrl from Categories where Status=1"
            let categoriesresult = await CommonController.commonget(query);

            if (categoriesresult.length > 0) {
                for (var j = 0; j < categoriesresult.length; j++) {

                    if (categoriesresult[j].ImageUrl != "NA") {
                        categoriesresult[j].ImageUrl = category_s3 + categoriesresult[j].ImageUrl
                    }

                }
                return resp.json({ "Status": 1, "Categories": categoriesresult })
            }
            else {
                return resp.json({ "Status": 1, "Categories": [] })
            }





        }
        catch (e) {


            console.log(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },

    ////// admin /////

    getallCategoriesforadmin: async (req, resp, next) => {
        try {

            query = "select * from Categories where Status!=0 order by Priority asc"
            let results = await CommonController.commonget(query);
            if (results.length > 0) {
                for (var j = 0; j < results.length; j++) {
                    if (results[j].ImageUrl != "NA") {
                        results[j].ImageUrl = category_s3 + results[j].ImageUrl
                    }
                }

            }
            resp.json({ "Status": 1, "Categories": results })



        }
        catch (e) {


            console.log(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },

    categorydetail: async (req, resp, next) => {
        try {

            query = "select * from Categories where Status!=0 and CategoryID=" + pool.escape(req.params.CategoryID)
            let results = await CommonController.commonget(query);
            if (results.length > 0) {
                for (var j = 0; j < results.length; j++) {
                    if (results[j].ImageUrl != "NA") {
                        results[j].ImageUrl = category_s3 + results[j].ImageUrl
                    }
                }
                resp.json({ "Status": 1, "Categories": results[0] })
            }
            else {
                resp.json({ "Status": 1, "Categories": {} })
            }

        }
        catch (e) {


            console.log(e)
            return resp.json({ "Status": 0, "Message": 'error' })
        }
    },

    addcategory: async (req, resp, next) => {
        try {

            body = req.body

            if (body.Description == null || body.Description == undefined)
                body.Description = 'NA'
            const getQyery = `select Priority from Categories order by Priority desc limit 1`
            const priority = await CommonController.getCategoryPriority(getQyery)

            // console.log('ImageUrl',body.ImageUrl)
            let InsertCategories = { CategoryName: body.CategoryName, Priority: priority[0].Priority, Description: body.Description, ImageUrl: body.ImageUrl, Status: 1 }

            let sql = "INSERT INTO Categories set ?";

            pool.query(sql, InsertCategories, (err, results) => {
                if (err) console.log('db error', err.sqlMessage || err.message); results = results || { affectedRows: 0 };  // never crash on a failed query
                console.log('post method', results, err)
                if (results.affectedRows === 1) {

                    CategoryID = results.insertId
                    if (body.ImageUrl != null || body.ImageUrl != undefined) {
                        let base64String = 'data:image/png;base64,' + body.ImageUrl; // Not a real image 
                        let base64Image = base64String.split(';base64,').pop();
                        var imagename = Date.now() + "_" + CategoryID + '.png'
                        console.log(imagename)
                        image = "ImageUrl=" + pool.escape(imagename) + "";
                        fs.writeFile("images/" + imagename, base64Image, { encoding: 'base64' }, function (err) {

                            const fileContent = fs.readFileSync("images/" + imagename);
                            const params = {
                                Bucket: process.env.bucketname, Key: 'Categories/' + imagename,
                                Body: fileContent,
                                ACL: 'public-read'
                            };

                            s3.upload(params, function (err, data) {
                                if (err) {
                                    throw err;
                                }
                                console.log("UPDATE Categories SET " + image + " WHERE CategoryID=" + CategoryID)
                                pool.query("UPDATE Categories SET " + image + " WHERE CategoryID=" + CategoryID + ";", function (err, results, fields) { })

                                console.log(`File uploaded successfully. ${data.Location}`);


                            });
                        });
                    }

                    return resp.json({ "Status": 1, "Message": "Category Added successfully" });
                }
                else {
                    console.log("error in insert user to table ", results.affectedRows);
                    return resp.json({ "Status": 0, "Message": "error" });
                }
            })
        }
        catch (err) {
            console.log("exception in adding Categories ", err);
            return resp.json({ "Status": 0, "Message": "Error in adding Categories" });
        }
    },

    updatecategory: async (req, resp, next) => {
        try {
            Body = req.body
            console.log(Body, 'body')

            if (Body.CategoryName != null || Body.CategoryName != undefined)
                CategoryName = "CategoryName=" + pool.escape(Body.CategoryName) + ",";
            else
                CategoryName = "CategoryName = CategoryName,";

            if (Body.Description != null || Body.Description != undefined)
                Description = "Description=" + pool.escape(Body.Description) + ",";
            else
                Description = "Description = Description,";

            if (Body.ImageUrl != null || Body.ImageUrl != undefined) {
                CategoryID = req.params.CategoryID
                let base64String = 'data:image/png;base64,' + Body.ImageUrl; // Not a real image 
                let base64Image = base64String.split(';base64,').pop();
                var imagename = Date.now() + "_" + CategoryID + '.png'
                console.log(imagename)
                image = "ImageUrl=" + pool.escape(imagename) + "";
                fs.writeFile(imagename, base64Image, { encoding: 'base64' }, function (err) {

                    const fileContent = fs.readFileSync(imagename);
                    const params = {
                        Bucket: process.env.bucketname, Key: 'Categories/' + imagename,
                        Body: fileContent,
                        ACL: 'public-read'
                    };

                    s3.upload(params, function (err, data) {
                        if (err) {
                            throw err;
                        }
                        console.log("UPDATE Categories SET " + image + " WHERE CategoryID=" + CategoryID)
                        pool.query("UPDATE Categories SET " + image + " WHERE CategoryID=" + CategoryID + ";", function (err, results, fields) { })

                        console.log(`File uploaded successfully. ${data.Location}`);

                    });
                });
            }


            if (Body.Priority != null || Body.Priority != undefined)
                Priority = "Priority=" + pool.escape(Body.Priority) + ",";
            else
                Priority = "Priority = Priority,";

            if (Body.Status != null || Body.Status != undefined)
                Status = "Status=" + pool.escape(Body.Status)
            else
                Status = "Status = Status";



            if (Body.oldPriority) {
                const updateQuery = `update Categories SET Priority=${pool.escape(Body.oldPriority)} WHERE Priority=${pool.escape(Body.Priority)}`
                CommonController.updateCategoryPriority(updateQuery)
            }

            queryString = "UPDATE Categories SET " + CategoryName + Description + Priority + Status + " WHERE CategoryID=" + pool.escape(req.params.CategoryID) + ";";
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
                            resp.json({ "Status": 1, "Message": "Category Update Successful" });
                        }
                        else {
                            console.log("category update failed", err, queryString);
                            resp.json({ "Status": 0, "Message": "No changes to update" });

                        }

                    }
                });
            });
        }
        catch (err) {
            console.log("exception in updating Categories ", err);
            return resp.json({ "Status": 0, "Message": "Error in updating Categories" });
        }
    },

    deletecategory: async (req, resp, next) => {
        try {
            console.log('here')
            products = await getproducts(req.params.CategoryID)
            console.log(products)
            if (products.length > 0) {
                return resp.json({ "Status": 0, "Message": "Can't delete as there are products associated with this category" })
            }
            else {
                pool.query(`delete from Categories where CategoryID=?`, [req.params.CategoryID], (err, results) => {
                    console.log('connecting')
                    if (err) {
                        return resp.json({ "Status": 0, "Message": err.sqlMessage });
                    }
                    if (results.affectedRows == 1) {

                        resp.json({ "Status": 1, "Message": "Category deleted Successfully" })
                    }
                    else { resp.json({ "Status": 0, "Message": "Category not found" }) }


                });
            }
        }
        catch (err) {
            console.log("exception in deleting Categories ", err);
            return resp.Status(500).json({ "Status": 0, "Message": "Error in deleting Categories" });
        }
    },


}



// function subcategoriesbycategories(CategoryID) {
//     try {
//         return new Promise(function (resolve, reject) {
//             pool.query("select * from SubCategories where CategoryID=? and Status=1 order by \
//             SubCategoryName desc", [CategoryID], async (err, results) => {

//                 if(err) {
//                     console.log('err subcategoriesbycategories')
//                     return reject(-1);
//                 } 
//                 else  {

//                     console.log("retrived Products : ", results.length);
//                     resolve(results)
//                 }


//             });
//         });
//     }
//     catch (err) {
//         console.log("error in retrieving Products");
//         return reject(-1)
//     }
// }
//NEWCODE
function subcategoriesbycategories(CategoryID) {
    try {
        return new Promise(function (resolve, reject) {
            pool.query("SELECT * FROM SubCategories S \
             inner join Products p on p.SubCategoryID=S.SubCategoryID\
             inner join ProductVariants pv on p.ProductID=pv.ProductID\
             WHERE S.CategoryID=? AND S.Status=1 and p.Status=1 and pv.Status=1 \
             group by S.SubCategoryID ORDER BY S.DisplayOrder ASC, S.SubCategoryName ASC  ", [CategoryID], async (err, results) => {
                if (err) {
                    console.log(err, 'Error in subcategoriesbycategories');
                    return reject(-1);
                } else {
                    const validSubcategories = [];
                    for (const subcategory of results) {
                        // Check if products exist for each subcategory
                        const products = await getProductsBySubCategory(subcategory.SubCategoryID);
                        if (products.length > 0) {
                            validSubcategories.push(subcategory); // Only include subcategories with products
                        }
                    }
                    console.log("Retrieved SubCategories with products: ", validSubcategories.length);
                    resolve(validSubcategories);
                }
            });
        });
    } catch (err) {
        console.log("Error in retrieving SubCategories");
        return reject(-1);
    }
}

// Helper function to get products by SubCategoryID
function getProductsBySubCategory(SubCategoryID) {
    try {
        return new Promise(function (resolve, reject) {
            pool.query("SELECT * FROM Products WHERE SubCategoryID=? AND Status!=0", [SubCategoryID], (err, results) => {
                if (err) {
                    console.log('Error retrieving products by subcategory');
                    return reject(-1);
                } else {
                    resolve(results);
                }
            });
        });
    } catch (err) {
        console.log("Error in retrieving Products by SubCategoryID");
        return reject(-1);
    }
}

/// admin /// 
function getproducts(CategoryID) {
    try {
        return new Promise(function (resolve, reject) {
            pool.query("select * from Products where CategoryID=? and Status!=0", [CategoryID], async (err, results) => {

                if (err) {

                    resolve(0);
                }


                console.log("retrived Products : ", results.length);
                resolve(results)



            });
        });
    }
    catch (err) {
        console.log("error in retrieving wallet balance");
        resolve(0);
    }
}
module.exports = categoriescontroller
