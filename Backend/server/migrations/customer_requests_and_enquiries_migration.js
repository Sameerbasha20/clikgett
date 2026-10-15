'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql');

const pool = mysql.createPool({
    connectionLimit: 5,
    password: process.env.PASSWORD,
    user: process.env.DB_USER,
    database: process.env.db,
    host: process.env.HOST,
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4'
});

const runMigration = async () => {
    console.log('--- Starting Customer Requests & Enquiries Migration ---');
    
    const queries = [
        `CREATE TABLE IF NOT EXISTS CustomerEnquiries (
            EnquiryID INT AUTO_INCREMENT PRIMARY KEY,
            UserID INT NOT NULL,
            Name VARCHAR(255),
            MobileNumber VARCHAR(20),
            Subject VARCHAR(255),
            Description TEXT NOT NULL,
            Status VARCHAR(50) DEFAULT 'Pending',
            AdminNotes TEXT,
            CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user (UserID),
            INDEX idx_status (Status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

        `CREATE TABLE IF NOT EXISTS ProductRequests (
            RequestID INT AUTO_INCREMENT PRIMARY KEY,
            UserID INT NOT NULL,
            CustomerName VARCHAR(255),
            MobileNumber VARCHAR(20),
            ProductName VARCHAR(255) NOT NULL,
            Brand VARCHAR(100),
            SizeOrQty VARCHAR(100),
            Description TEXT,
            ImagePath VARCHAR(500),
            Status VARCHAR(50) DEFAULT 'Pending',
            LinkedProductID INT NULL,
            AdminNotes TEXT,
            NotifiedAt DATETIME NULL,
            CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user (UserID),
            INDEX idx_status (Status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    ];

    for (let q of queries) {
        await new Promise((resolve, reject) => {
            pool.query(q, (err, res) => {
                if (err) {
                    console.error('Migration error:', err);
                    return reject(err);
                }
                console.log('Query executed successfully.');
                resolve(res);
            });
        });
    }

    console.log('--- Customer Requests & Enquiries Migration Completed Successfully ---');
    pool.end();
};

runMigration().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
