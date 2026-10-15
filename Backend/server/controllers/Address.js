const express = require('express'); 
const mysql=require('mysql');
const https = require('https');
const querystring = require('querystring');
require('dotenv').config()
const CommonController = require("../controllers/CommonController");

const pool = require('../utils/db');

const addresscontroller={

    gettaddressbyuserid : async (req, resp, next) => {
        try{                    
            query="select * from Address where UserID="+req.UserID+" order by CreatedAt desc;"
            let results = await CommonController.commonget(query); 
            resp.json({"Status":1,"Address":results})                   
        }
        catch(e){            
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },
    
    getaddressbyaddressid : async (req, resp, next) => {
        try{
            let results = await CommonController.commonget("select * from Address where AddressID = ? and UserID = ?", [req.params.AddressID, req.UserID]); 
            if(results.length>0){
                resp.json({"Status":1,"Address":results[0]})
            }
            else{
                resp.json({"Status":1,"Address":{}})
            }
        }
        catch(e){            
            console.log(e)
            return resp.json({"Status":0,"Message":'error'})
        }
    },

    // addaddress : async (req, resp, next) => {
    //     try {
    //         body=req.body             
           
    //         // let settingslist = await CommonController.settings();
    //         // console.log(settingslist,'settingslist')

    //         // storelatitude = settingslist[0]['Latitude']
    //         // storeLongitude = settingslist[0]['Longitude']

    //         // getradiusresult =await getradius(storelatitude,storeLongitude,body)
    //         // console.log(getradiusresult,settingslist[0]['Radius'])
    //         // if(getradiusresult[0]['distance']>settingslist[0]['Radius']){
    //         //     return resp.status(400).json({ "Status": 0, "Message": "Currently we are not serving your location." });}

    //         if (body.Landmark == null || body.Landmark == undefined){body.Landmark = 'NA'}
    //         if (body.City == null || body.City == undefined){body.City = 'NA'}
    //         if (body.Type == null || body.Type == undefined){body.Type = 'NA'}

    //         let InsertAddress = {Type:body.Type,City:body.City,UserID: req.UserID, Latitude: body.Latitude,Longitude: body.Longitude,Address:body.Address,FlatNo:body.FlatNo,Landmark:body.Landmark}

    //         let sql = "INSERT INTO Address set ?";

    //         pool.query(sql, InsertAddress, (err, results) => {
    //             console.log('post method', results, err)
    //             if (results.affectedRows === 1) {
    //                         return resp.status(200).json({ "Status": 1, "Message": "Address Added successfully" });}
    //             else {
    //                         console.log("error in insert address to table ", results.affectedRows);
    //                         return resp.status(400).json({ "Status": 0, "Message": "error" });}
    //                                     })
    //     }
    //     catch (err) {
    //         console.log("exception in adding address ", err);
    //         return resp.status(500).json({ "Status": 0, "Message": "Error in adding address" });
    //     }
    // },
    
    addaddress : async (req, resp, next) => {
        try {
            let body = req.body;
    
            // Example: Fetch store latitude and longitude from settings (if applicable)
            let getshop = `select * from AdminShopToggleSettings limit 0,1`;
            let settingslist = await CommonController.commonget(getshop);
            console.log(settingslist, 'settingslist');
    
            let storelatitude = settingslist[0]['Latitude'];
            let storeLongitude = settingslist[0]['Longitude'];
    
            // Calculate distance between user's address and store's location
            let getradiusresult = await getradius(storelatitude, storeLongitude, body);
            let getDistanceinKMs= await getDistance_googleAPIDistanceMatrix(storelatitude, storeLongitude, body);
            console.log(getradiusresult, 'getradiusresult', getradiusresult[0]['distance']);
            console.log('getgoogleAPI distance: ',getDistanceinKMs.toString().replace(',', ''));
            getDistanceinKMs = getDistanceinKMs.toString().replace(',', '');
            // If the distance is greater than 20 km, block the address and return an error message
            if (parseFloat(getDistanceinKMs) > 20) {
                console.log("Delivery not possible for this location. The delivery radius is limited to 20 km.")
            
                return resp.status(400).json({ 
                    "Status": 0, 
                    "Message": "Delivery not possible for this location. The delivery radius is limited to 20 km." 
                });
            }
    
            // Set default values for optional fields
            if (body.Landmark == null || body.Landmark == undefined) { body.Landmark = 'NA'; }
            if (body.City == null || body.City == undefined) { body.City = 'NA'; }
            if (body.Type == null || body.Type == undefined) { body.Type = 'NA'; }
    
            // Prepare the address data to be inserted
            let InsertAddress = {
                Type: body.Type,
                City: body.City,
                UserID: req.UserID,
                Latitude: body.Latitude,
                Longitude: body.Longitude,
                Address: body.Address,
                FlatNo: body.FlatNo,
                Landmark: body.Landmark
            };
    
            // SQL query to insert the address into the database
            let sql = "INSERT INTO Address set ?";
            
            pool.query(sql, InsertAddress, (err, results) => {
                if (err) console.log('db error', err.sqlMessage || err.message); results = results || { affectedRows: 0 };  // never crash on a failed query
                console.log('Post method result', results, err);
                if (results.affectedRows === 1) {
                    return resp.status(200).json({ "Status": 1, "Message": "Address added successfully" });
                } else {
                    console.log("Error in inserting address to the table", results.affectedRows);
                    return resp.status(400).json({ "Status": 0, "Message": "Error in adding address" });
                }
            });
    
        } catch (err) {
            console.log("Exception in adding address", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in adding address" });
        }
    },
    
    // updateaddress : async (req, resp, next) => {
    //     try {
    //         Body=req.body
    //         console.log(Body,'address update body')

    //         if (Body.UserID != null || Body.UserID != undefined)
    //         UserID = "UserID=" + Body.UserID+",";
    //         else
    //         UserID = "UserID = UserID,";

            
    //         if (Body.Type != null || Body.Type != undefined)
    //         Type = "Type='" + Body.Type+"',";
    //         else
    //         Type = "Type = Type,";

    //         if (Body.Latitude != null || Body.Latitude != undefined)
    //         Latitude = "Latitude=" + Body.Latitude+",";
    //         else
    //         Latitude = "Latitude = Latitude,";

    //         if (Body.Longitude != null || Body.Longitude != undefined)
    //         Longitude = "Longitude=" + Body.Longitude+",";
    //         else
    //         Longitude = "Longitude = Longitude,";

            

    //         if (Body.FlatNo != null || Body.FlatNo != undefined)
    //         FlatNo = "FlatNo='" + Body.FlatNo+"',";
    //         else
    //         FlatNo = "FlatNo = FlatNo,";

    //         if (Body.Address != null || Body.Address != undefined)
    //         Address = "Address='" + Body.Address+"',";
    //         else
    //         Address = "Address = Address,";

    //         if (Body.City != null || Body.City != undefined)
    //         City = "City='" + Body.City+"',";
    //         else
    //         City = "City = City,";

    //         if (Body.Landmark != null || Body.Landmark != undefined)
    //         Landmark = "Landmark='" + Body.Landmark+"'";
    //         else
    //         Landmark = "Landmark = Landmark";

    //         queryString = "UPDATE Address SET " +City+Type+UserID+Latitude+Longitude+Address+FlatNo+Landmark+" WHERE AddressID=" + req.params.AddressID + ";";
    //         console.log(queryString)
    //         return new Promise(function(resolve, reject) {
    //             pool.query(queryString, function(err, result, fields) {
    //                         if (err) {
    //                                 console.log("Error in updating the DB:" + err);
    //                                 return resp.json({ "Status": 0, "Message": "Error in updating the DB" });}
    //                         else {
    //                                 console.log("update :" + result.affectedRows);
    //                                 if (result.affectedRows > 0) {
    //                                             console.log('update successful')
    //                                         resp.json({ "Status": 1, "Message": "Address Update Successful" });}
    //                                 else {
    //                                         console.log("Address update failed",err,queryString);
    //                                         resp.json({ "Status": 0, "Message": "No changes to update" }); } }
    //                         });
    //         });
    //     }
    //     catch (err) {
    //         console.log("exception in updating Address ", err);
    //         return resp.status(500).json({ "Status": 0, "Message": "Error in updating Address" });
    //     }
    // },

    updateaddress : async (req, resp, next) => {
        try {
            let Body = req.body;
            console.log(Body, 'address update body');
    
            // Example: Fetch store latitude and longitude from settings (if applicable)
            let getshop = `select * from AdminShopToggleSettings limit 0,1`;
            let settingslist = await CommonController.commonget(getshop);
            console.log(settingslist, 'settingslist');
    
            let storelatitude = settingslist[0]['Latitude'];
            let storeLongitude = settingslist[0]['Longitude'];
    
            // Calculate distance between user's address and store's location
            let getradiusresult = await getradius(storelatitude, storeLongitude, Body);
            //console.log(getradiusresult, 'getradiusresult', getradiusresult[0]['distance']);
            let getDistanceinKMs = await getDistance_googleAPIDistanceMatrix(storelatitude, storeLongitude, Body);
            console.log(getradiusresult, 'getradiusresult', getradiusresult[0]['distance']);
            console.log('getgoogleAPI distance: ', getDistanceinKMs.toString().replace(',', ''));
            getDistanceinKMs = getDistanceinKMs.toString().replace(',', '');
    
            // If the distance is greater than 20 km, block the address update and return an error message
            if (parseFloat(getDistanceinKMs) > 20) {
                return resp.status(400).json({
                    "Status": 0,
                    "Message": "Delivery not possible for this location. The delivery radius is limited to 20 km."
                });
            }
    
            // Build the update from provided fields only. The address always stays
            // with the authenticated user (Body.UserID is ignored).
            const sets = [];
            const params = [];
            for (const column of ['City', 'Type', 'Latitude', 'Longitude', 'Address', 'FlatNo', 'Landmark']) {
                if (Body[column] != null && Body[column] != undefined) {
                    sets.push(`${column} = ?`);
                    params.push(Body[column]);
                }
            }
            if (sets.length === 0) {
                return resp.json({ "Status": 0, "Message": "No changes to update" });
            }
            const queryString = "UPDATE Address SET " + sets.join(', ') + " WHERE AddressID = ? AND UserID = ?";
            params.push(req.params.AddressID, req.UserID);

            // Execute the update query
            return new Promise(function (resolve, reject) {
                pool.query(queryString, params, function (err, result, fields) {
                    if (err) {
                        console.log("Error in updating the DB:" + err);
                        return resp.json({ "Status": 0, "Message": "Error in updating the DB" });
                    } else {
                        console.log("Update result:", result.affectedRows);
                        if (result.affectedRows > 0) {
                            console.log('Update successful');
                            resp.json({ "Status": 1, "Message": "Address Update Successful" });
                        } else {
                            console.log("Address update failed", err, queryString);
                            resp.json({ "Status": 0, "Message": "No changes to update" });
                        }
                    }
                });
            });
        } catch (err) {
            console.log("Exception in updating address", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in updating Address" });
        }
    },
    

    deleteaddress : async (req, resp, next) => {
        try {
            pool.query(`delete from Address where AddressID=? and UserID=?`,[req.params.AddressID, req.UserID],(err,results)=>{
                console.log('connecting')
                if(err) {
                    return resp.json({"Status":0,"Message":err.sqlMessage});
                }
                if(results.affectedRows===1){
                    
                    resp.json({"Status":1,"Message":"Address deleted Successfully"})
                }
                else{resp.json({"Status":0,"Message":"Error in deleting Address"})}
                
    
            });
        }
        catch (err) {
            console.log("exception in deleting Address ", err);
            return resp.status(500).json({ "Status": 0, "Message": "Error in deleting Address" });
        }
    },

    checkServiceability: async (req, resp) => {
        try {
            const body = req.body || {};
            let lat = parseFloat(body.Latitude !== undefined ? body.Latitude : body.latitude);
            let lng = parseFloat(body.Longitude !== undefined ? body.Longitude : body.longitude);
            const addressId = body.AddressID || body.addressId;

            // If coordinates are missing/invalid, look up by AddressID if provided
            if ((isNaN(lat) || isNaN(lng)) && addressId) {
                const addrRows = await CommonController.commonget(`SELECT Latitude, Longitude, Address, City FROM Address WHERE AddressID = ${parseInt(addressId, 10)} LIMIT 1`);
                if (addrRows && addrRows.length > 0) {
                    lat = parseFloat(addrRows[0].Latitude);
                    lng = parseFloat(addrRows[0].Longitude);
                }
            }

            if (isNaN(lat) || isNaN(lng)) {
                return resp.status(400).json({
                    Status: 0,
                    IsServiceable: false,
                    Message: "Valid coordinates (Latitude, Longitude) or AddressID are required"
                });
            }

            // Retrieve authoritative store coordinates and delivery radius from AdminShopToggleSettings
            let storeLat = 15.8391;
            let storeLng = 78.0397;
            let maxRadius = 20.0;
            try {
                const settingsList = await CommonController.commonget("SELECT Latitude, Longitude, DeliveryRadiusKm FROM AdminShopToggleSettings LIMIT 1");
                if (settingsList && settingsList[0]) {
                    if (settingsList[0].Latitude) storeLat = parseFloat(settingsList[0].Latitude);
                    if (settingsList[0].Longitude) storeLng = parseFloat(settingsList[0].Longitude);
                    if (settingsList[0].DeliveryRadiusKm || settingsList[0].Radius) {
                        maxRadius = parseFloat(settingsList[0].DeliveryRadiusKm || settingsList[0].Radius);
                    }
                }
            } catch (setErr) {
                console.warn("Using fallback store coordinates for serviceability check:", setErr);
            }

            // Authoritative distance calculation using spherical Law of Cosines / Haversine
            let distanceKm = 0;
            const distanceResult = await getradius(storeLat, storeLng, { Latitude: lat, Longitude: lng });
            if (distanceResult && Array.isArray(distanceResult) && distanceResult.length > 0 && distanceResult[0].distance !== undefined) {
                distanceKm = parseFloat(distanceResult[0].distance) || 0;
            } else {
                // Resilient fallback: compute exact spherical Haversine distance
                distanceKm = calculateHaversineKm(storeLat, storeLng, lat, lng);
            }

            const isServiceable = distanceKm <= maxRadius;
            // Delivery time for this address from the admin's distance-band ETA rules
            const eta = await require('./DeliveryETA').calculateBaseETA(distanceKm);

            return resp.status(200).json({
                Status: 1,
                IsServiceable: isServiceable,
                DistanceKm: distanceKm,
                MaxDeliveryRadiusKm: maxRadius,
                EtaMinutes: isServiceable ? eta.baseMinutes : null,
                Message: isServiceable
                    ? "Delivery is available for this location"
                    : "Sorry! ClikGett is not available at your selected address right now. We're working to expand our delivery service."
            });
        } catch (err) {
            console.error("Exception in checkServiceability:", err);
            return resp.status(500).json({
                Status: 0,
                IsServiceable: false,
                Message: "Error verifying delivery location serviceability"
            });
        }
    }
}

function calculateHaversineKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
}

function getradius(storelatitude,storeLongitude,body) {

    return new Promise(function (resolve, reject) {
        try{

        
                query="SELECT ROUND(6371 * acos (cos ( radians(" + (Number(body.Latitude) || 0) + ") ) * cos( radians( " + (Number(storelatitude) || 0) + " ) ) * \
                cos( radians( " + (Number(storeLongitude) || 0) + " ) - radians(" + (Number(body.Longitude) || 0) + ") ) + \
                sin ( radians(" + (Number(body.Latitude) || 0) + ") ) * sin( radians( " + (Number(storelatitude) || 0) + " ) ))) AS distance" 
                console.log(query)
                pool.query(query, function (err, results, fields) {
                    if (err) {               
                        console.log("Error in checking delivery boy :" + err);
                        return resolve(-1)
                    }
                    else {                
                    
                            resolve(results);
                        
                    }
                });
            }
        catch(err){
            return resolve(-1)
        }

    });
}

function getDistance_googleAPIDistanceMatrix(storelatitude, storeLongitude, body) {
    return new Promise((resolve, reject) => {
        const params = querystring.stringify(
            {
                origins: `${storelatitude},${storeLongitude}`,
                destinations: `${body.Latitude},${body.Longitude}`,
                mode: "driving", key: process.env.GOOGLE_APIKEY
            });
        const options =
        {
            hostname: 'maps.googleapis.com',
            path: `/maps/api/distancematrix/json?${params}`,
            method: 'GET'
        };
        https.request(options, (response) => {
            let data = '';
            response.on('data', (chunk) => { data += chunk; });
            response.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.rows && parsed.rows[0] && parsed.rows[0].elements && parsed.rows[0].elements[0] && parsed.rows[0].elements[0].distance) {
                        let distanceText = parsed.rows[0].elements[0].distance.text;
                        console.log("Google Distance Matrix API response: ", distanceText);
                        let distanceinKMs = distanceText.split(" ")[0];
                        resolve(distanceinKMs);
                    } else {
                        console.warn("Google Distance Matrix API returned unexpected structure or error:", data);
                        resolve("5");
                    }
                } catch (e) {
                    console.error("Error parsing Google Distance Matrix API response:", e);
                    resolve("5");
                }
            });
        }).on('error', (error) => {
            console.error('Error in distance request:', error);
            resolve("5");
        }).end();
    })
}


module.exports=addresscontroller
