const mysql = require('mysql');
require('dotenv').config({ path: './.env' });

const pool = mysql.createPool({
    connectionLimit: 2,
    password: process.env.PASSWORD,
    user: process.env.DB_USER,
    database: process.env.db,
    host: process.env.HOST,
    port: process.env.DB_PORT
});

const sql = `
CREATE TABLE IF NOT EXISTS order_item_removals (
    RemovalID INT AUTO_INCREMENT PRIMARY KEY,
    OrderID INT NOT NULL,
    OrderItemID INT NULL,
    ProductID INT NOT NULL,
    VariantID INT NULL,
    ProductName VARCHAR(255) NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    RefundAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    RefundStatus VARCHAR(50) DEFAULT 'NOT_APPLICABLE',
    Reason VARCHAR(100) NOT NULL,
    Description TEXT NOT NULL,
    AdminID INT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_id (OrderID),
    INDEX idx_created_at (CreatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

pool.query(sql, (err, result) => {
    if (err) {
        console.error('Error creating order_item_removals table:', err);
        process.exit(1);
    }
    console.log('Successfully created or verified order_item_removals table.');
    process.exit(0);
});
