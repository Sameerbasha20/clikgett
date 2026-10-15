-- ClikGett Admin Dashboard Database Migration
-- Add new tables and configuration for Admin Dashboard features
-- This migration adds support for: cashback, wallet management, milestones, memberships, sales, abandoned carts, and more

-- ============================================================
-- 1. WALLET TRANSACTIONS TABLE
-- Records all wallet credit/debit/expiry/reversal transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
    TransactionID BIGINT PRIMARY KEY AUTO_INCREMENT,
    UserID BIGINT NOT NULL,
    Amount DECIMAL(15,2) NOT NULL,
    Credited_Debited TINYINT NOT NULL COMMENT '1=Credit, 2=Debit, 3=Expiry, 4=Reversal',
    ContentType TINYINT NOT NULL COMMENT '1=User, 2=Order, 3=Adjustment, 4=Cashback, 5=Membership',
    ContentID BIGINT NOT NULL COMMENT 'Reference to order/wallet ID/membership ID',
    Description VARCHAR(255),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- ============================================================
-- 2. CASHBACK RULES TABLE
-- Configures cashback eligibility rules
-- ============================================================
CREATE TABLE IF NOT EXISTS cashback_rules (
    RuleID BIGINT PRIMARY KEY AUTO_INCREMENT,
    RuleName VARCHAR(100) NOT NULL,
    CashbackAmount DECIMAL(15,2) NOT NULL,
    CashbackPercentage DECIMAL(5,2),
    MinimumOrderValue DECIMAL(15,2) DEFAULT 0,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME,
    IsActive TINYINT DEFAULT 1,
    ApplicableProducts TEXT DEFAULT NULL COMMENT 'Comma-separated ProductIDs or "all"',
    ExcludedProducts TEXT DEFAULT NULL COMMENT 'Comma-separated ProductIDs',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. CASHBACK TRANSACTIONS TABLE
-- Records all cashback issued to customer wallets
-- ============================================================
CREATE TABLE IF NOT EXISTS cashback_transactions (
    TransactionID BIGINT PRIMARY KEY AUTO_INCREMENT,
    UserID BIGINT NOT NULL,
    OrderID BIGINT NOT NULL,
    CashbackAmount DECIMAL(15,2) NOT NULL,
    RuleID BIGINT,
    Status TINYINT DEFAULT 1 COMMENT '1=Pending, 2=Issued, 3=Reversed',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    FOREIGN KEY (RuleID) REFERENCES cashback_rules(RuleID) ON DELETE SET NULL
);

-- ============================================================
-- 4. WALLET EXPIRY TABLE
-- Tracks wallet/cashback expiry events
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_expiry (
    ExpiryID BIGINT PRIMARY KEY AUTO_INCREMENT,
    UserID BIGINT NOT NULL,
    ExpiredAmount DECIMAL(15,2) NOT NULL,
    Reason VARCHAR(100) DEFAULT 'Expiry',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- ============================================================
-- 5. PRODUCT RESTRICTIONS TABLE
-- Product-level cashback/coupon exclusion rules
-- ============================================================
CREATE TABLE IF NOT EXISTS product_restrictions (
    RestrictionID BIGINT PRIMARY KEY AUTO_INCREMENT,
    ProductID BIGINT NOT NULL,
    CashbackDisabled TINYINT DEFAULT 0 COMMENT '1=Cashback disabled, 0=Allowed',
    CouponDisabled TINYINT DEFAULT 0 COMMENT '1=Coupon disabled, 0=Allowed',
    IsActive TINYINT DEFAULT 1,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    UNIQUE KEY unique_product_restriction (ProductID)
);

-- ============================================================
-- 6. MILESTONE REWARDS TABLE
-- Configures order milestone rewards
-- ============================================================
CREATE TABLE IF NOT EXISTS milestone_rewards (
    MilestoneID BIGINT PRIMARY KEY AUTO_INCREMENT,
    MilestoneCount INT NOT NULL COMMENT 'e.g., 10, 50, 100',
    RewardType VARCHAR(50) NOT NULL COMMENT 'e.g., "wallet_credit", "discount", "free_delivery"',
    RewardAmount DECIMAL(15,2),
    RewardDescription VARCHAR(255),
    IsActive TINYINT DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. CUSTOMER MILESTONES TABLE
-- Tracks customer progress toward milestones
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_milestones (
    MilestoneID BIGINT PRIMARY KEY AUTO_INCREMENT,
    UserID BIGINT NOT NULL,
    MilestoneCount INT NOT NULL,
    OrdersCompleted INT DEFAULT 0,
    RewardAwarded TINYINT DEFAULT 0,
    RewardAwardedAt DATETIME,
    Status TINYINT DEFAULT 1 COMMENT '1=Active, 0=Completed',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    UNIQUE KEY unique_user_milestone (UserID, MilestoneCount)
);

-- ============================================================
-- 8. MEMBERSHIPS TABLE
-- Configures membership plans
-- ============================================================
CREATE TABLE IF NOT EXISTS memberships (
    MembershipID BIGINT PRIMARY KEY AUTO_INCREMENT,
    MembershipName VARCHAR(100) NOT NULL,
    DurationDays INT NOT NULL,
    MembershipPrice DECIMAL(15,2) NOT NULL,
    NormalPrice DECIMAL(15,2) NOT NULL COMMENT 'Regular price for non-members',
    IsActive TINYINT DEFAULT 1,
    StartDate DATETIME,
    EndDate DATETIME,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 9. MEMBERSHIP PRODUCT PRICES TABLE
-- Product-specific membership pricing
-- ============================================================
CREATE TABLE IF NOT EXISTS membership_product_prices (
    PriceID BIGINT PRIMARY KEY AUTO_INCREMENT,
    MembershipID BIGINT NOT NULL,
    ProductID BIGINT NOT NULL,
    MembershipPrice DECIMAL(15,2) NOT NULL,
    IsActive TINYINT DEFAULT 1,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (MembershipID) REFERENCES memberships(MembershipID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    UNIQUE KEY unique_membership_product (MembershipID, ProductID)
);

-- ============================================================
-- 10. SALES TABLE
-- Configures sales/promotions
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
    SaleID BIGINT PRIMARY KEY AUTO_INCREMENT,
    SaleName VARCHAR(100) NOT NULL,
    SaleDescription VARCHAR(255),
    SalePrice DECIMAL(15,2) NOT NULL COMMENT 'Discounted sale price',
    NormalPrice DECIMAL(15,2) NOT NULL COMMENT 'Original price before sale',
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    IsActive TINYINT DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 11. SALE PRODUCTS TABLE
-- Products included in a sale
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_products (
    SaleProductID BIGINT PRIMARY KEY AUTO_INCREMENT,
    SaleID BIGINT NOT NULL,
    ProductID BIGINT NOT NULL,
    SalePrice DECIMAL(15,2),
    IsActive TINYINT DEFAULT 1,
    FOREIGN KEY (SaleID) REFERENCES sales(SaleID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    UNIQUE KEY unique_sale_product (SaleID, ProductID)
);

-- ============================================================
-- 12. ABANDONED CARTS TABLE
-- Tracks carts abandoned after threshold
-- ============================================================
CREATE TABLE IF NOT EXISTS abandoned_carts (
    AbandonedCartID BIGINT PRIMARY KEY AUTO_INCREMENT,
    UserID BIGINT NOT NULL,
    CartValue DECIMAL(15,2) NOT NULL,
    LastActivity DATETIME NOT NULL,
    AbandonedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    IsRemoved TINYINT DEFAULT 0,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- ============================================================
-- 13. CART OFFERS TABLE
-- Configures cart value-based offers (₹1,000+ offers)
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_offers (
    OfferID BIGINT PRIMARY KEY AUTO_INCREMENT,
    MinimumCartValue DECIMAL(15,2) NOT NULL,
    OfferType VARCHAR(50) NOT NULL COMMENT 'e.g., "percentage", "fixed_amount"',
    OfferAmount DECIMAL(15,2) NOT NULL,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    ApplicableProducts TEXT DEFAULT NULL COMMENT 'Comma-separated ProductIDs or "all"',
    ExcludedProducts TEXT DEFAULT NULL COMMENT 'Comma-separated ProductIDs',
    IsActive TINYINT DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 14. SCHEDULED ORDERS TABLE
-- Tracks orders scheduled for future delivery
-- ============================================================
CREATE TABLE IF NOT EXISTS scheduled_orders (
    ScheduledOrderID BIGINT PRIMARY KEY AUTO_INCREMENT,
    UserID BIGINT NOT NULL,
    OrderID BIGINT,
    ScheduledDate DATE NOT NULL,
    ScheduledTime TIME NOT NULL,
    Status VARCHAR(50) DEFAULT 'Scheduled' COMMENT 'Scheduled, Confirmed, Processing, Completed, Cancelled',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE SET NULL
);

-- ============================================================
-- 15. ORDER TIMELINE TABLE
-- Tracks order stage timestamps
-- ============================================================
CREATE TABLE IF NOT EXISTS order_timeline (
    TimelineID BIGINT PRIMARY KEY AUTO_INCREMENT,
    OrderID BIGINT NOT NULL,
    Stage VARCHAR(50) NOT NULL COMMENT 'Order Placed, Food Preparing, etc.',
    Date DATETIME NOT NULL,
    Time TIME,
    Actor VARCHAR(100) DEFAULT NULL COMMENT 'Admin, Delivery Partner, Restaurant',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE
);

-- ============================================================
-- 16. ORDER ADJUSTMENTS TABLE
-- Records order amount adjustments (out-of-stock, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_adjustments (
    AdjustmentID BIGINT PRIMARY KEY AUTO_INCREMENT,
    OrderID BIGINT NOT NULL,
    OriginalAmount DECIMAL(15,2) NOT NULL,
    AdjustedAmount DECIMAL(15,2) NOT NULL,
    UnavailableProductAmount DECIMAL(15,2) DEFAULT 0,
    AdjustmentReason VARCHAR(255) NOT NULL,
    Resolution VARCHAR(50) NOT NULL COMMENT 'Wallet Credit / Offline Adjustment',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE
);

-- ============================================================
-- 17. NOTIFICATION MEDIA TABLE
-- Stores notification images
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_media (
    MediaID BIGINT PRIMARY KEY AUTO_INCREMENT,
    NotificationID BIGINT NOT NULL,
    ImageURL VARCHAR(500) NOT NULL,
    ImageName VARCHAR(255) NOT NULL,
    FileType VARCHAR(50) NOT NULL,
    FileSize BIGINT,
    UploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (NotificationID) REFERENCES UserNotifications(NotificationID) ON DELETE CASCADE
);

-- ============================================================
-- 18. UPDATE SETTINGS WITH NEW CONFIGURATION KEYS
-- ============================================================

-- Add new setting keys for admin configuration
-- These can be inserted via the Settings API or directly in DB

-- Example insert statements (uncomment and modify as needed):
-- INSERT INTO Settings (SettingKey, SettingValue) VALUES 
-- ('CashbackMinOrderValue', '300'),
-- ('CouponMinOrderValue', '100'),
-- ('FreeDeliveryMinOrderValue', '500'),
-- ('FreeDeliveryRadiusKm', '5'),
-- ('AbandonedCartThresholdDays', '3'),
-- ('CartOffer1000Threshold', '1000'),
-- ('MinOrderValue', '300');

-- ============================================================
-- MIGRATION SUMMARY
-- ============================================================
-- Created tables:
--   - wallet_transactions (Wallet transaction history)
--   - cashback_rules (Cashback eligibility rules)
--   - cashback_transactions (Cashback issued records)
--   - wallet_expiry (Expired wallet amounts)
--   - product_restrictions (Product cashback/coupon exclusions)
--   - milestone_rewards (Milestone reward config)
--   - customer_milestones (Customer milestone progress)
--   - memberships (Membership plans)
--   - membership_product_prices (Product-specific membership pricing)
--   - sales (Sale management)
--   - sale_products (Products on sale)
--   - abandoned_carts (Abandoned cart tracking)
--   - cart_offers (Cart value-based offers)
--   - scheduled_orders (Scheduled orders)
--   - order_timeline (Order stage tracking)
--   - order_adjustments (Order amount adjustments)
--   - notification_media (Notification images)
--
-- Modified:
--   - Settings (new configuration keys)