'use strict';
const mysql = require('mysql');
require('dotenv').config();

const pool = require('../utils/db');

const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, res) => {
            if (err) return reject(err);
            resolve(res || []);
        });
    });
};

const AdminGlobalSearch = {
    search: async (req, resp) => {
        try {
            const rawQuery = (req.query.q || req.query.query || '').trim().slice(0, 100);
            if (!rawQuery || rawQuery.length < 2) {
                return resp.status(400).json({
                    Status: 0,
                    Message: "Search query must be at least 2 characters long",
                    results: {
                        customers: [],
                        orders: [],
                        products: [],
                        enquiries: [],
                        productRequests: []
                    }
                });
            }

            const searchPattern = `%${rawQuery}%`;
            const numericId = parseInt(rawQuery, 10);
            const isNumeric = !isNaN(numericId);

            // Execute parallel queries for each category
            const [customers, orders, products, enquiries, productRequests] = await Promise.all([
                // 1. Customers: UserID, name, phone, email
                queryAsync(
                    `SELECT UserID, FirstName, LastName, MobileNumber, EmailID, WalletAmount, CreatedAt
                     FROM Users
                     WHERE (${isNumeric ? 'UserID = ? OR ' : ''}
                            FirstName LIKE ? OR LastName LIKE ? OR 
                            MobileNumber LIKE ? OR EmailID LIKE ? OR
                            CONCAT(FirstName, ' ', LastName) LIKE ?)
                     LIMIT 6`,
                    isNumeric
                        ? [numericId, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]
                        : [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]
                ),

                // 2. Orders: OrderID, customer name/mobile, status, total
                queryAsync(
                    `SELECT o.OrderID, o.UserID, o.GrandTotal, o.OrderStatus, o.OrderType,
                            o.EstimateDateTime, o.CreatedAt, o.MobileNumber,
                            u.FirstName, u.LastName
                     FROM Orders o
                     LEFT JOIN Users u ON o.UserID = u.UserID
                     WHERE (${isNumeric ? 'o.OrderID = ? OR o.UserID = ? OR ' : ''}
                            o.MobileNumber LIKE ? OR
                            u.FirstName LIKE ? OR u.LastName LIKE ? OR
                            CONCAT(u.FirstName, ' ', u.LastName) LIKE ?)
                     ORDER BY o.CreatedAt DESC
                     LIMIT 6`,
                    isNumeric
                        ? [numericId, numericId, searchPattern, searchPattern, searchPattern, searchPattern]
                        : [searchPattern, searchPattern, searchPattern, searchPattern]
                ),

                // 3. Products: ProductID, name, category
                queryAsync(
                    `SELECT p.ProductID, p.ProductName, p.Status, p.Type, p.ImageUrl,
                            c.CategoryName
                     FROM Products p
                     LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
                     WHERE (${isNumeric ? 'p.ProductID = ? OR ' : ''}
                            p.ProductName LIKE ? OR
                            p.Description LIKE ? OR
                            c.CategoryName LIKE ?)
                     LIMIT 6`,
                    isNumeric
                        ? [numericId, searchPattern, searchPattern, searchPattern]
                        : [searchPattern, searchPattern, searchPattern]
                ),

                // 4. Customer Enquiries: EnquiryID, name, mobile, subject
                queryAsync(
                    `SELECT EnquiryID, UserID, Name, MobileNumber, Subject, Status, CreatedAt
                     FROM CustomerEnquiries
                     WHERE (${isNumeric ? 'EnquiryID = ? OR UserID = ? OR ' : ''}
                            Name LIKE ? OR MobileNumber LIKE ? OR Subject LIKE ? OR Description LIKE ?)
                     ORDER BY CreatedAt DESC
                     LIMIT 6`,
                    isNumeric
                        ? [numericId, numericId, searchPattern, searchPattern, searchPattern, searchPattern]
                        : [searchPattern, searchPattern, searchPattern, searchPattern]
                ),

                // 5. Product Requests: RequestID, customer name, product name, mobile
                queryAsync(
                    `SELECT RequestID, UserID, CustomerName, MobileNumber, ProductName, Brand, Status, CreatedAt
                     FROM ProductRequests
                     WHERE (${isNumeric ? 'RequestID = ? OR UserID = ? OR ' : ''}
                            CustomerName LIKE ? OR MobileNumber LIKE ? OR ProductName LIKE ? OR Brand LIKE ?)
                     ORDER BY CreatedAt DESC
                     LIMIT 6`,
                    isNumeric
                        ? [numericId, numericId, searchPattern, searchPattern, searchPattern, searchPattern]
                        : [searchPattern, searchPattern, searchPattern, searchPattern]
                )
            ]);

            const totalResults = customers.length + orders.length + products.length + enquiries.length + productRequests.length;

            return resp.status(200).json({
                Status: 1,
                query: rawQuery,
                totalResults,
                counts: {
                    customers: customers.length,
                    orders: orders.length,
                    products: products.length,
                    enquiries: enquiries.length,
                    productRequests: productRequests.length
                },
                results: {
                    customers,
                    orders,
                    products,
                    enquiries,
                    productRequests
                }
            });
        } catch (err) {
            console.error("Exception in AdminGlobalSearch:", err);
            return resp.status(500).json({
                Status: 0,
                Message: "Internal server error performing global search",
                results: {
                    customers: [],
                    orders: [],
                    products: [],
                    enquiries: [],
                    productRequests: []
                }
            });
        }
    }
};

module.exports = AdminGlobalSearch;
