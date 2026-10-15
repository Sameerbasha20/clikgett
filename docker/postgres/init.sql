-- =============================================================================
-- ClikGett PostgreSQL Schema (Migration Target Architecture)
-- Converted faithfully from MySQL 8.0 schema.
-- Casing preserved via double-quoted identifiers to match Express query casing.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper trigger for automatic UpdatedAt timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."UpdatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. AdminUsers Table
CREATE TABLE IF NOT EXISTS "AdminUsers" (
    "AdminID" SERIAL PRIMARY KEY,
    "FirstName" VARCHAR(100) NOT NULL,
    "LastName" VARCHAR(100) DEFAULT '',
    "EmailID" VARCHAR(150) UNIQUE NOT NULL,
    "MobileNumber" VARCHAR(20) DEFAULT '',
    "Password" VARCHAR(255) NOT NULL,
    "Role" INT NOT NULL DEFAULT 1,
    "Status" SMALLINT DEFAULT 1,
    "DutyStatus" VARCHAR(20) DEFAULT 'OFFLINE',
    "LastLocationLat" NUMERIC(10, 8) NULL,
    "LastLocationLng" NUMERIC(11, 8) NULL,
    "LastLocationUpdatedAt" TIMESTAMP NULL,
    "BatteryLevel" INT NULL,
    "VehicleType" VARCHAR(50) NULL,
    "VehicleNumber" VARCHAR(50) NULL,
    "ActiveOrdersCount" INT DEFAULT 0,
    "TwoFactorEnabled" SMALLINT DEFAULT 0,
    "TwoFactorSecret" VARCHAR(128) NULL,
    "TwoFactorRecoveryCodes" TEXT NULL,
    "TwoFactorFailedAttempts" INT DEFAULT 0,
    "TwoFactorLockedUntil" TIMESTAMP NULL,
    "TwoFactorLastUsedTimestamp" BIGINT DEFAULT 0,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_timestamp_adminusers
BEFORE UPDATE ON "AdminUsers"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 2. Users Table
CREATE TABLE IF NOT EXISTS "Users" (
    "UserID" BIGSERIAL PRIMARY KEY,
    "FirstName" VARCHAR(100) NOT NULL,
    "LastName" VARCHAR(100) DEFAULT '',
    "MobileNumber" VARCHAR(20) UNIQUE NOT NULL,
    "EmailID" VARCHAR(150) NULL,
    "WalletAmount" NUMERIC(15, 2) DEFAULT 0.00,
    "Status" SMALLINT DEFAULT 1,
    "SignupCompleted" SMALLINT DEFAULT 0,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON "Users"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS "Categories" (
    "CategoryID" SERIAL PRIMARY KEY,
    "CategoryName" VARCHAR(150) NOT NULL,
    "CategoryImage" VARCHAR(255) DEFAULT '',
    "Status" SMALLINT DEFAULT 1,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. SubCategories Table
CREATE TABLE IF NOT EXISTS "SubCategories" (
    "SubCategoryID" SERIAL PRIMARY KEY,
    "CategoryID" INT NOT NULL REFERENCES "Categories"("CategoryID") ON DELETE CASCADE,
    "SubCategoryName" VARCHAR(150) NOT NULL,
    "SubCategoryImage" VARCHAR(255) DEFAULT '',
    "DisplayOrder" INT DEFAULT 0,
    "Status" SMALLINT DEFAULT 1,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Products Table
CREATE TABLE IF NOT EXISTS "Products" (
    "ProductID" BIGSERIAL PRIMARY KEY,
    "ProductName" VARCHAR(255) NOT NULL,
    "Description" TEXT NULL,
    "CategoryID" INT NOT NULL,
    "SubCategoryID" INT NULL,
    "Status" SMALLINT DEFAULT 1,
    "Type" INT DEFAULT 1,
    "ImageUrl" VARCHAR(255) DEFAULT '',
    "ProductImages" TEXT NULL,
    "IsTransfered" SMALLINT DEFAULT 0,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. ProductVariants Table
CREATE TABLE IF NOT EXISTS "ProductVariants" (
    "VariantID" BIGSERIAL PRIMARY KEY,
    "ProductID" BIGINT NOT NULL REFERENCES "Products"("ProductID") ON DELETE CASCADE,
    "metrictype" VARCHAR(50) DEFAULT 'unit',
    "metricvalue" VARCHAR(50) DEFAULT '1',
    "Price" NUMERIC(10, 2) NOT NULL,
    "OfferPrice" NUMERIC(10, 2) NOT NULL,
    "AvailableQty" INT DEFAULT 0,
    "maxQty" INT DEFAULT 10,
    "status" SMALLINT DEFAULT 1,
    "IsTransfered" SMALLINT DEFAULT 0,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Address Table
CREATE TABLE IF NOT EXISTS "Address" (
    "AddressID" BIGSERIAL PRIMARY KEY,
    "UserID" BIGINT NOT NULL REFERENCES "Users"("UserID") ON DELETE CASCADE,
    "Type" VARCHAR(50) DEFAULT 'Home',
    "Address" TEXT NOT NULL,
    "FlatNo" VARCHAR(100) DEFAULT '',
    "Landmark" VARCHAR(150) DEFAULT '',
    "City" VARCHAR(100) DEFAULT 'Kurnool',
    "Latitude" NUMERIC(10, 8) NOT NULL,
    "Longitude" NUMERIC(11, 8) NOT NULL,
    "Status" SMALLINT DEFAULT 1,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Carts Table
CREATE TABLE IF NOT EXISTS "Carts" (
    "CartID" BIGSERIAL PRIMARY KEY,
    "UserID" BIGINT NOT NULL,
    "Status" SMALLINT DEFAULT 1,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. CartItems Table
CREATE TABLE IF NOT EXISTS "CartItems" (
    "CartItemID" BIGSERIAL PRIMARY KEY,
    "CartID" BIGINT NOT NULL REFERENCES "Carts"("CartID") ON DELETE CASCADE,
    "ProductID" BIGINT NOT NULL,
    "VariantID" BIGINT NOT NULL,
    "Quantity" INT NOT NULL DEFAULT 1,
    "Price" NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Orders Table
CREATE TABLE IF NOT EXISTS "Orders" (
    "OrderID" BIGSERIAL PRIMARY KEY,
    "UserID" BIGINT NOT NULL,
    "OrderNumber" VARCHAR(60) UNIQUE NOT NULL,
    "OrderStatus" INT NOT NULL DEFAULT 2,
    "DeliveryBoyID" INT NULL,
    "AddressID" BIGINT NULL,
    "TotalAmount" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "DiscountAmount" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "WalletAmount" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "FinalAmount" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "PaymentType" VARCHAR(50) DEFAULT 'COD',
    "PaymentStatus" VARCHAR(50) DEFAULT 'Pending',
    "DelayStatus" VARCHAR(20) DEFAULT 'NONE',
    "TotalDelayMinutes" INT DEFAULT 0,
    "CurrentLeg" VARCHAR(30) DEFAULT 'ASSIGNED',
    "AssignedAt" TIMESTAMP NULL,
    "PickedUpAt" TIMESTAMP NULL,
    "StoreLatitude" NUMERIC(10, 8) NULL,
    "StoreLongitude" NUMERIC(11, 8) NULL,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. OrderItems Table
CREATE TABLE IF NOT EXISTS "OrderItems" (
    "OrderItemID" BIGSERIAL PRIMARY KEY,
    "OrderID" BIGINT NOT NULL REFERENCES "Orders"("OrderID") ON DELETE CASCADE,
    "ProductID" BIGINT NOT NULL,
    "VariantID" BIGINT NOT NULL,
    "Quantity" INT NOT NULL DEFAULT 1,
    "Price" NUMERIC(10, 2) NOT NULL,
    "OfferPrice" NUMERIC(10, 2) NOT NULL,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Banners Table
CREATE TABLE IF NOT EXISTS "Banners" (
    "BannerID" SERIAL PRIMARY KEY,
    "BannerName" VARCHAR(150) NOT NULL,
    "Description" TEXT NULL,
    "BannerImage" VARCHAR(255) NOT NULL,
    "DestinationType" VARCHAR(50) DEFAULT 'none',
    "DestinationID" INT NULL,
    "Status" SMALLINT DEFAULT 1,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. PromoCodes Table
CREATE TABLE IF NOT EXISTS "PromoCodes" (
    "PromoCodeID" SERIAL PRIMARY KEY,
    "PromoCode" VARCHAR(50) UNIQUE NOT NULL,
    "DiscountType" VARCHAR(20) DEFAULT 'percentage',
    "DiscountValue" NUMERIC(10, 2) NOT NULL,
    "MinOrderAmount" NUMERIC(10, 2) DEFAULT 0.00,
    "MaxDiscount" NUMERIC(10, 2) DEFAULT 0.00,
    "StartDate" TIMESTAMP NULL,
    "EndDate" TIMESTAMP NULL,
    "UsageLimit" INT DEFAULT 1000,
    "Status" SMALLINT DEFAULT 1,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Routes Table
CREATE TABLE IF NOT EXISTS "Routes" (
    "RouteID" SERIAL PRIMARY KEY,
    "RouteName" VARCHAR(150) NOT NULL,
    "DeliveryBoyID" INT NULL,
    "Status" SMALLINT DEFAULT 1,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Warehouses Table
CREATE TABLE IF NOT EXISTS "Warehouses" (
    "WarehouseID" SERIAL PRIMARY KEY,
    "WarehouseName" VARCHAR(150) NOT NULL,
    "Latitude" NUMERIC(10, 8) NOT NULL,
    "Longitude" NUMERIC(11, 8) NOT NULL,
    "Radius" NUMERIC(5, 2) DEFAULT 15.00,
    "Status" SMALLINT DEFAULT 1,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Settings Table
CREATE TABLE IF NOT EXISTS "Settings" (
    "SettingID" SERIAL PRIMARY KEY,
    "SettingKey" VARCHAR(100) UNIQUE NOT NULL,
    "SettingValue" TEXT NOT NULL,
    "Status" SMALLINT DEFAULT 1,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Synthetic Data Insertion for PostgreSQL
INSERT INTO "AdminUsers" ("AdminID", "FirstName", "LastName", "EmailID", "MobileNumber", "Password", "Role", "Status", "DutyStatus")
VALUES 
(1, 'Super', 'Admin', 'admin@clikgett.com', '9999999991', '0192023a7bbd73250516f069df18b500', 1, 1, 'OFFLINE'),
(16, 'Ravi', 'Kumar', 'deliveryboy1@clikgett.com', '9999999916', '0192023a7bbd73250516f069df18b500', 16, 1, 'ONLINE')
ON CONFLICT ("EmailID") DO NOTHING;

INSERT INTO "Users" ("UserID", "FirstName", "LastName", "MobileNumber", "EmailID", "WalletAmount", "Status", "SignupCompleted")
VALUES 
(1000523, 'LocalTest', 'Customer', '9999999999', 'customer@clikgett.local', 500.00, 1, 1)
ON CONFLICT ("MobileNumber") DO NOTHING;

INSERT INTO "Categories" ("CategoryID", "CategoryName", "CategoryImage", "Status")
VALUES 
(1, 'Dairy & Breakfast', 'dairy.png', 1),
(2, 'Fruits & Vegetables', 'fruits.png', 1)
ON CONFLICT ("CategoryID") DO NOTHING;

INSERT INTO "Warehouses" ("WarehouseID", "WarehouseName", "Latitude", "Longitude", "Radius", "Status")
VALUES 
(1, 'Kurnool Central Warehouse', 15.82810000, 78.03730000, 20.00, 1)
ON CONFLICT ("WarehouseID") DO NOTHING;
