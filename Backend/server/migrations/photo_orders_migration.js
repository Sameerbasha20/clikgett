const mysql = require('mysql');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = mysql.createPool({
    connectionLimit: 5,
    password: process.env.PASSWORD,
    user: process.env.DB_USER,
    database: process.env.db,
    host: process.env.HOST,
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4'
});

const queries = [
    // 1. PhotoOrderRequests table
    `CREATE TABLE IF NOT EXISTS PhotoOrderRequests (
        RequestID INT AUTO_INCREMENT PRIMARY KEY,
        RequestCode VARCHAR(32) NOT NULL UNIQUE,
        UserID INT NOT NULL,
        ImageStoragePath VARCHAR(500) NOT NULL,
        CustomerNotes TEXT NULL,
        RequestStatus ENUM(
            'PENDING',
            'UNDER_REVIEW',
            'PROPOSAL_DRAFT',
            'AWAITING_CUSTOMER_CONFIRMATION',
            'CUSTOMER_REJECTED',
            'EXPIRED',
            'ORDER_CREATED',
            'CANCELLED'
        ) NOT NULL DEFAULT 'PENDING',
        AdminReviewerID INT NULL,
        AdminNotes TEXT NULL,
        SubTotal DECIMAL(10,2) DEFAULT 0.00,
        DeliveryCharges DECIMAL(10,2) DEFAULT 0.00,
        Discount DECIMAL(10,2) DEFAULT 0.00,
        GrandTotal DECIMAL(10,2) DEFAULT 0.00,
        DeliveryAddressID INT NULL,
        DeliveryAddressSnapshot TEXT NULL,
        PaymentMethod VARCHAR(20) DEFAULT 'COD',
        CreatedOrderID INT NULL,
        ReviewedAt DATETIME NULL,
        ProposedAt DATETIME NULL,
        ConfirmedAt DATETIME NULL,
        ResolvedAt DATETIME NULL,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_por_user (UserID),
        INDEX idx_por_status (RequestStatus),
        INDEX idx_por_created (CreatedAt),
        INDEX idx_por_order (CreatedOrderID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 2. PhotoOrderItems table
    `CREATE TABLE IF NOT EXISTS PhotoOrderItems (
        PhotoOrderItemID INT AUTO_INCREMENT PRIMARY KEY,
        RequestID INT NOT NULL,
        ProductID INT NOT NULL,
        VariantID INT NOT NULL,
        Quantity INT NOT NULL DEFAULT 1,
        UnitPrice DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        LineTotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        AvailabilityStatus ENUM('AVAILABLE', 'ALTERNATIVE_SUGGESTED', 'UNAVAILABLE') DEFAULT 'AVAILABLE',
        AlternativeProductID INT NULL,
        AlternativeVariantID INT NULL,
        AdminNotes VARCHAR(255) NULL,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_poi_request (RequestID),
        INDEX idx_poi_prod (ProductID, VariantID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 3. PhotoOrderStatusTimeline table
    `CREATE TABLE IF NOT EXISTS PhotoOrderStatusTimeline (
        TimelineID INT AUTO_INCREMENT PRIMARY KEY,
        RequestID INT NOT NULL,
        PreviousStatus VARCHAR(50) NULL,
        NewStatus VARCHAR(50) NOT NULL,
        ChangedByRole ENUM('CUSTOMER', 'ADMIN', 'SYSTEM') NOT NULL,
        ChangedByID INT NULL,
        Notes TEXT NULL,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_post_request (RequestID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
];

async function runMigration() {
    console.log("Starting Photo Orders schema migration...");
    for (let i = 0; i < queries.length; i++) {
        await new Promise((resolve, reject) => {
            pool.query(queries[i], (err, result) => {
                if (err) {
                    console.error(`Error executing query #${i + 1}:`, err.message);
                    return reject(err);
                }
                console.log(`Query #${i + 1} executed successfully.`);
                resolve(result);
            });
        });
    }
    console.log("Migration completed successfully!");
    pool.end();
}

runMigration().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
