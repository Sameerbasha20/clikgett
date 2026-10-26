const { check, validationResult } = require('express-validator');
const mysql = require('mysql');


const pool = require('./db');

const user_mandatoryfields = {
    
    cart_mandatoryfields: [ 
        check('Quantity', "Quantity cannot be empty")
            .notEmpty(),

        (req, resp, next) => {
            console.log(req.body);
            var errors = validationResult(req);
            if (!errors.isEmpty())
                return resp.status(400).json({ "Status": 0, "Message": (errors.array())[0].msg });
            next();
        }],

    adminnoftification: [   
         
        check('Title', "Title cannot be empty")
            .notEmpty(),
        check('Message', "Message cannot be empty")
            .notEmpty(),         
                                                        
        (req, resp, next) => {
            console.log(req.body);
            var errors = validationResult(req);
                if (!errors.isEmpty())
                    return resp.status(400).json({ "Status": 0, "Message": (errors.array())[0].msg });
                next();
        }],

    settings: [  
        check('SettingKey', "SettingKey cannot be empty")
                .notEmpty(),
        check('SettingValue', "SettingValue cannot be empty")
                .notEmpty(),                                                                         
                                                                                                                        
        (req, resp, next) => {
                console.log(req.body);
                var errors = validationResult(req);
                if (!errors.isEmpty())
                        return resp.status(400).json({ "Status": 0, "Message": (errors.array())[0].msg });
                next();
        }],
                                                                                                 
    product_mandatoryfields: [   
         
        check('Type', "Type cannot be empty")
                .notEmpty(),        
        // Images are added in the next step of the admin form, so they are optional here.
        check('ProductImages', "ProductImages must be a list")
                .optional()
                .isArray(),
        check('ProductName', "Enter the product name")
                .trim()
                .notEmpty(),
        check('SubCategoryID', "Choose a subcategory")
                .notEmpty(),
        check('ProductVariants', "ProductVariants cannot be empty")
                .notEmpty(),
                                                        
        (req, resp, next) => {
                console.log(req.body);
                var errors = validationResult(req);
                if (!errors.isEmpty())
                        return resp.status(400).json({ "Status": 0, "Message": (errors.array())[0].msg });
                        next();
        }],

    variant_mandatoryfields: [   
         
        check('ProductID', "ProductID cannot be empty")
                .notEmpty(),
        check('metrictype', "metrictype cannot be empty")
                .notEmpty(),
        check('metricvalue', "metricvalue cannot be empty")
                .notEmpty(),
        check('Price', "Price cannot be empty")
                .notEmpty(),
        check('AvailableQty', "AvailableQty cannot be empty")
                .notEmpty(),                                                                                                         
        (req, resp, next) => {
                console.log(req.body);
                var errors = validationResult(req);
                if (!errors.isEmpty())
                        return resp.status(400).json({ "Status": 0, "Message": (errors.array())[0].msg });
                next();
        }],
                                                                        
    promocode_mandatoryfields: [   
         
        check('PromoCode', "PromoCode cannot be empty")
                .notEmpty(),
        check('Description', "Description cannot be empty")
                .notEmpty(),
        check('StartDate', "StartDate cannot be empty")
                .notEmpty(),
        check('EndDate', "EndDate cannot be empty")
                .notEmpty(),
        check('Type', "Type cannot be empty")
                .notEmpty(),
        check('OfferValue', "OfferValue cannot be empty")
                .notEmpty(),
                                                                                                                                                                                
        (req, resp, next) => {
                console.log(req.body);
                var errors = validationResult(req);
                if (!errors.isEmpty())
                        return resp.status(400).json({ "Status": 0, "Message": (errors.array())[0].msg });
                next();
        }],
                                                      
    category_mandatoryfields: [   
         
        check('CategoryName', "CategoryName cannot be empty")
                .notEmpty(),
        check('ImageUrl', "ImageUrl cannot be empty")
                .notEmpty(),
                                               
                                                        
        (req, resp, next) => {
                console.log(req.body);
                var errors = validationResult(req);
                if (!errors.isEmpty())
                        return resp.status(400).json({ "Status": 0, "Message": (errors.array())[0].msg });
                        next();
        }],

    subcategory_mandatoryfields: [   
         
        check('SubCategoryName', "SubCategoryName cannot be empty")
                .notEmpty(),
        check('CategoryID', "CategoryID cannot be empty")
                .notEmpty(),                                                  
        (req, resp, next) => {
                console.log(req.body);
                var errors = validationResult(req);
                if (!errors.isEmpty())
                        return resp.status(400).json({ "Status": 0, "Message": (errors.array())[0].msg });
                next();
        }],

    address_mandatoryfields: [   
         
        check('Latitude', "Latitude cannot be empty")
                .notEmpty(),
        check('Longitude', "Longitude cannot be empty")
                .notEmpty(),                                                                                               
        check('Address', "Address cannot be empty")
                .notEmpty(),
        check('FlatNo', "FlatNo cannot be empty")
                .notEmpty(),                                                                    
        (req, resp, next) => {
                console.log(req.body);
                var errors = validationResult(req);
                if (!errors.isEmpty())
                        return resp.status(400).json({ "Status": 0, "Message": (errors.array())[0].msg });
                next();
        }],

    route_mandatoryfields: [  
         
        check('OrderIDs', "OrderIDs cannot be empty")
                .notEmpty(),
        check('DeliveryBoyID', "DeliveryBoyID cannot be empty")
                .notEmpty(),                                                               
        (req, resp, next) => {
                console.log(req.body);
                var errors = validationResult(req);
                if (!errors.isEmpty())
                        return resp.status(400).json({ "Status": 0, "Message": (errors.array())[0].msg });
                next();
        }],                    

    order_mandatoryfields: [   
         
        check('DeliveryMethod', "DeliveryMethod cannot be empty")
                .notEmpty(),
        check('CartID', "CartID cannot be empty")
                .notEmpty(),                                                                                                               
        check('GrandTotal', "GrandTotal cannot be empty")
                .notEmpty(),
        check('Latitude', "Latitude cannot be empty")
                .notEmpty(), 
        check('Longitude', "Longitude cannot be empty")
                .notEmpty(),  
        check('SubTotal', "SubTotal cannot be empty")
                .notEmpty(), 
        check('FlatNo', "FlatNo cannot be empty")
                .notEmpty(),  
        check('Address', "Address cannot be empty")
                .notEmpty(),    
        check('PaymentMethod', "PaymentMethod cannot be empty")
                .notEmpty(), 
        (req, resp, next) => {
                console.log(req.body);
                var errors = validationResult(req);
                if (!errors.isEmpty())
                        return resp.status(400).json({ "Status": 0, "Message": (errors.array())[0].msg });
                next();
        }],

    kit: [   
         
        check('KitName', "KitName cannot be empty")
                .notEmpty(),
        check('Description', "Description cannot be empty")
                .notEmpty(),                                                                                                               
        check('Price', "Price cannot be empty")
                .notEmpty(),
                                         
        (req, resp, next) => {
                console.log(req.body);
                var errors = validationResult(req);
                if (!errors.isEmpty())
                        return resp.status(400).json({ "Status": 0, "Message": (errors.array())[0].msg });
                next();
        }],

    kititem: [   
         
        check('ProductID', "ProductID cannot be empty")
                .notEmpty(),
        check('VariantID', "VariantID cannot be empty")
                .notEmpty(),                                                    
        (req, resp, next) => {
                console.log(req.body);
                var errors = validationResult(req);
                if (!errors.isEmpty())
                        return resp.status(400).json({ "Status": 0, "Message": (errors.array())[0].msg });
                next();
        }],

    Feedback: [   
         
        check('Message', "Message cannot be empty")
                .notEmpty(),
        check('OrderID', "OrderID cannot be empty")
                .notEmpty(),                                                    
        (req, resp, next) => {
                console.log(req.body);
                var errors = validationResult(req);
                if (!errors.isEmpty())
                        return resp.status(400).json({ "Status": 0, "Message": (errors.array())[0].msg });
                next();
                }],
    }



module.exports = { user_mandatoryfields };
