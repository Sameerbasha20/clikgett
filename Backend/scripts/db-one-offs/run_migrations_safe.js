require('dotenv').config({ path: './.env' });
const mysql = require('mysql');
const pool = mysql.createPool({
  connectionLimit: 2,
  password: process.env.PASSWORD,
  user: process.env.DB_USER,
  database: process.env.db,
  host: process.env.HOST,
  port: process.env.DB_PORT || 3306
});

const queries = [
  // 1. order_adjustments
  `CREATE TABLE IF NOT EXISTS order_adjustments (
    AdjustmentID INT AUTO_INCREMENT PRIMARY KEY,
    OrderID INT NOT NULL,
    PreviousAmount DECIMAL(10,2) NOT NULL,
    NewAmount DECIMAL(10,2) NOT NULL,
    DifferenceAmount DECIMAL(10,2) NOT NULL,
    AdjustmentType VARCHAR(50) DEFAULT 'manual',
    Reason TEXT NOT NULL,
    AdminID INT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_id (OrderID),
    INDEX idx_admin_id (AdminID)
  )`,

  // 2. buy_more_config
  `CREATE TABLE IF NOT EXISTS buy_more_config (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    ProductID INT NOT NULL,
    VariantID INT NOT NULL,
    MinQuantity INT NOT NULL,
    MaxQuantity INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    Status TINYINT(1) DEFAULT 1,
    StartDate DATETIME NULL,
    EndDate DATETIME NULL,
    CreatedBy INT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_prod_var (ProductID, VariantID)
  )`,

  // 3. product_restrictions
  `CREATE TABLE IF NOT EXISTS product_restrictions (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    ProductID INT NOT NULL,
    VariantID INT NULL,
    RestrictionType ENUM('cashback_excluded', 'coupon_excluded', 'membership_excluded', 'max_qty_per_order') NOT NULL,
    RestrictionValue VARCHAR(255) NULL,
    Status TINYINT(1) DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_prod_restrict (ProductID, RestrictionType)
  )`,

  // 4. cart_offers
  `CREATE TABLE IF NOT EXISTS cart_offers (
    OfferID INT AUTO_INCREMENT PRIMARY KEY,
    OfferName VARCHAR(255) NOT NULL,
    ThresholdAmount DECIMAL(10,2) NOT NULL,
    OfferType ENUM('percentage', 'flat', 'free_item') NOT NULL,
    OfferValue DECIMAL(10,2) NOT NULL,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    ApplicableProducts JSON NULL,
    ExcludedProducts JSON NULL,
    Status TINYINT(1) DEFAULT 1,
    CreatedBy INT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // 5. Warehouses
  `CREATE TABLE IF NOT EXISTS Warehouses (
    WarehouseID INT AUTO_INCREMENT PRIMARY KEY,
    WarehouseName VARCHAR(255) NOT NULL,
    Address TEXT NOT NULL,
    City VARCHAR(100) NOT NULL,
    Pincode VARCHAR(20) NOT NULL,
    ContactPerson VARCHAR(100) NULL,
    ContactNumber VARCHAR(20) NULL,
    Latitude DECIMAL(9,6) NULL,
    Longitude DECIMAL(9,6) NULL,
    Status TINYINT(1) DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // 6. FranchiseEnquiryForms
  `CREATE TABLE IF NOT EXISTS FranchiseEnquiryForms (
    FormID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    MobileNumber VARCHAR(20) NOT NULL,
    EmailID VARCHAR(100) NULL,
    City VARCHAR(100) NOT NULL,
    State VARCHAR(100) NULL,
    InvestmentRange VARCHAR(100) NULL,
    Experience TEXT NULL,
    Message TEXT NULL,
    Status ENUM('Pending', 'In Review', 'Contacted', 'Approved', 'Rejected') DEFAULT 'Pending',
    Notes TEXT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // 7. CallBackForms
  `CREATE TABLE IF NOT EXISTS CallBackForms (
    FormID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NULL,
    FullName VARCHAR(100) NOT NULL,
    MobileNumber VARCHAR(20) NOT NULL,
    PreferredTime VARCHAR(100) NULL,
    Subject VARCHAR(255) NULL,
    Message TEXT NULL,
    Status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    Notes TEXT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // 8. AvailabilityForms
  `CREATE TABLE IF NOT EXISTS AvailabilityForms (
    FormID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NULL,
    CustomerName VARCHAR(100) NOT NULL,
    MobileNumber VARCHAR(20) NOT NULL,
    ProductName VARCHAR(255) NOT NULL,
    Pincode VARCHAR(20) NOT NULL,
    Status ENUM('Pending', 'Reviewed', 'Available', 'Not Available') DEFAULT 'Pending',
    Notes TEXT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // 9. NotifyProducts
  `CREATE TABLE IF NOT EXISTS NotifyProducts (
    NotifyID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    ProductID INT NOT NULL,
    VariantID INT NULL,
    MobileNumber VARCHAR(20) NULL,
    EmailID VARCHAR(100) NULL,
    Status ENUM('Pending', 'Notified', 'Cancelled') DEFAULT 'Pending',
    NotifiedAt DATETIME NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_notify_prod (ProductID, Status)
  )`
];

async function runMigration() {
  console.log('Running safe migrations...');
  for (const q of queries) {
    await new Promise((resolve, reject) => {
      pool.query(q, (err) => {
        if (err) {
          console.error('Migration error on query:', q.substring(0, 50), err.message);
          return reject(err);
        }
        resolve();
      });
    });
  }

  // Safe column additions
  const columnChecks = [
    { table: 'ProductVariants', column: 'Buy2Price', sql: 'ALTER TABLE ProductVariants ADD COLUMN Buy2Price DECIMAL(10,2) DEFAULT NULL' },
    { table: 'Wallets', column: 'ExpiryDate', sql: 'ALTER TABLE Wallets ADD COLUMN ExpiryDate DATETIME NULL' },
    { table: 'Wallets', column: 'IsExpired', sql: 'ALTER TABLE Wallets ADD COLUMN IsExpired TINYINT(1) DEFAULT 0' },
    { table: 'AdminUsers', column: 'WarehouseID', sql: 'ALTER TABLE AdminUsers ADD COLUMN WarehouseID INT NULL' }
  ];

  for (const check of columnChecks) {
    const exists = await new Promise((resolve) => {
      pool.query(`SHOW COLUMNS FROM ${check.table} LIKE '${check.column}'`, (err, rows) => {
        if (err || !rows || rows.length === 0) resolve(false);
        else resolve(true);
      });
    });

    if (!exists) {
      console.log(`Adding column ${check.column} to ${check.table}...`);
      await new Promise((resolve, reject) => {
        pool.query(check.sql, (err) => {
          if (err) {
            console.error(`Error adding column ${check.column}:`, err.message);
            return reject(err);
          }
          console.log(`Added column ${check.column} to ${check.table} successfully.`);
          resolve();
        });
      });
    } else {
      console.log(`Column ${check.column} already exists in ${check.table}.`);
    }
  }

  console.log('Migration completed successfully.');
  pool.end();
}

runMigration().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
