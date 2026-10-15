const mysql = require('mysql');
require('dotenv').config({ path: './.env' });

const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.DB_USER,
    password: process.env.PASSWORD,
    database: process.env.db,
    port: process.env.DB_PORT
});

const query = (sql, params = []) => new Promise((res, rej) => pool.query(sql, params, (err, rows) => err ? rej(err) : res(rows)));

async function setup() {
    console.log("Checking membership tables and records...");
    
    // 1. Check/create membership_product_prices table
    await query(`
        CREATE TABLE IF NOT EXISTS membership_product_prices (
            PriceID INT PRIMARY KEY AUTO_INCREMENT,
            PlanID INT NOT NULL,
            ProductID INT NOT NULL,
            VariantID INT NULL,
            MembershipPrice DECIMAL(10,2) NOT NULL,
            Status TINYINT DEFAULT 1,
            CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_mpp_product (ProductID),
            KEY idx_mpp_plan (PlanID),
            UNIQUE KEY unique_membership_product (PlanID, ProductID)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("membership_product_prices table ready.");

    // 2. Check MembershipPlans
    const plans = await query("SELECT * FROM MembershipPlans");
    console.log(`Current MembershipPlans count: ${plans.length}`);
    if (plans.length === 0) {
        await query(`
            INSERT INTO MembershipPlans (PlanID, PlanName, Price, DurationDays, Status, FreeDelivery, ExtraCashbackPercentage, ExclusiveCoupons, PriorityCustomer)
            VALUES 
            (1, 'Gold Membership', 199.00, 30, 1, 1, 5.00, 1, 1),
            (2, 'Silver Membership', 99.00, 30, 1, 0, 2.50, 1, 0)
        `);
        console.log("Seeded standard plans (Gold Membership, Silver Membership).");
    }

    const currentPlans = await query("SELECT PlanID, PlanName, Price, DurationDays, Status, FreeDelivery, ExtraCashbackPercentage FROM MembershipPlans");
    console.log("Active Plans in AWS RDS:", currentPlans);

    pool.end();
}

setup().catch(err => {
    console.error("Setup error:", err);
    pool.end();
});
