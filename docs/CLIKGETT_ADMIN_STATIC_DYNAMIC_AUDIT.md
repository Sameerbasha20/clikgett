# ClikGett Admin Dashboard — Master Static vs Dynamic Matrix

| ID | Page | Component | Data / Action | Expected Source | Actual Source | Dynamic? | API | AWS Table | Result |
|---|---|---|---|---|---|---|---|---|---|
| SD-001 | Buy More | Product dropdown (filter & form) | Active Product List | AWS Products | AWS Products (`GET /api/adminproducts/bycategory`) | YES | PASS | `Products` | **PASS (FIXED)** |
| SD-002 | Buy More | Tier Table & CRUD | Multi-Tier Pricing | AWS `buy_more_config` | AWS `buy_more_config` | YES | PASS | `buy_more_config` | **PASS** |
| SD-003 | Buy More | Business Engine | Tier Price Calculation | Backend PricingEngine | Backend PricingEngine | YES | PASS | `buy_more_config` | **PASS** |
| SD-004 | Product Exclusions | Product dropdown & Type | Active Products & Types | AWS Products | AWS Products (`GET /api/adminproducts/bycategory`) | YES | PASS | `Products` | **PASS (FIXED)** |
| SD-005 | Product Exclusions | Restriction Table & CRUD | Exclusion Rules | AWS `product_restrictions` | AWS `product_restrictions` | YES | PASS | `product_restrictions` | **PASS** |
| SD-006 | Product Exclusions | Business Engine | Coupon/Cashback Exclusion | Backend PricingEngine | Backend PricingEngine | YES | PASS | `product_restrictions` | **PASS** |
| SD-007 | Cart Offers | Offer Table & CRUD | Threshold Discount Config | AWS `cart_offers` | AWS `cart_offers` | YES | PASS | `cart_offers` | **PASS** |
| SD-008 | Cart Offers | Business Engine | Cart Threshold Discount | Backend PricingEngine | Backend PricingEngine | YES | PASS | `cart_offers` | **PASS** |
| SD-009 | Flash Sales | Sales Table & Form | Sale Name, Dates, Discounts | AWS `Sales`, `SaleItems` | AWS `Sales`, `SaleItems` | YES | PASS | `Sales`, `SaleItems` | **PASS** |
| SD-010 | Flash Sales | Product Selector | Active Products | AWS Products | AWS Products (`GET /api/adminproducts/bycategory`) | YES | PASS | `Products` | **PASS** |
| SD-011 | Orders | Order Table & Filter | Live Customer Orders | AWS `Orders`, `OrderItems` | AWS `Orders`, `OrderItems` | YES | PASS | `Orders`, `OrderItems` | **PASS** |
| SD-012 | Orders | Delivery Boy Dropdown | Active Delivery Boys | AWS `DeliveryBoy` | AWS `DeliveryBoy` | YES | PASS | `DeliveryBoy` | **PASS** |
| SD-013 | Order Details | Order Adjustment Form | Adjustment Amount & Reason | AWS `order_adjustments` | AWS `order_adjustments` | YES | PASS | `order_adjustments`, `Wallets` | **PASS** |
| SD-014 | Customers | Customer Table & Search | Registered Users & Balances | AWS `Users`, `Wallets` | AWS `Users`, `Wallets` | YES | PASS | `Users`, `Wallets` | **PASS** |
| SD-015 | Customers | Wallet Transactions | Credit/Debit & Expiry Ledger | AWS `Wallets`, `wallet_transactions` | AWS `Wallets`, `wallet_transactions` | YES | PASS | `wallet_transactions` | **PASS** |
| SD-016 | Customers | Expire Cashback Button | Automated Expiry Run | AWS `Wallets`, `wallet_transactions` | AWS `Wallets`, `wallet_transactions` | YES | PASS | `wallet_transactions` | **PASS** |
| SD-017 | Products | Product Table & Search | Active Catalog Products | AWS `Products`, `ProductVariants` | AWS `Products`, `ProductVariants` | YES | PASS | `Products`, `ProductVariants` | **PASS** |
| SD-018 | Products | Category Dropdown | Product Categories | AWS `Categories` | AWS `Categories` | YES | PASS | `Categories` | **PASS** |
| SD-019 | Products | Add/Edit Product Form | Product Master & Variant | AWS `Products`, `ProductVariants` | AWS `Products`, `ProductVariants` | YES | PASS | `Products`, `ProductVariants` | **PASS** |
| SD-020 | Categories | Category Table & CRUD | Categories Catalog | AWS `Categories` | AWS `Categories` | YES | PASS | `Categories` | **PASS** |
| SD-021 | Subcategories | Subcategory Table & CRUD | Subcategories Catalog | AWS `SubCategories` | AWS `SubCategories` | YES | PASS | `SubCategories` | **PASS** |
| SD-022 | Banners | Banner Carousel & CRUD | Promo Banners | AWS `Banners` | AWS `Banners` | YES | PASS | `Banners` | **PASS** |
| SD-023 | Coupon Codes | Promo Table & Form | Discount Coupons | AWS `PromoCodes` | AWS `PromoCodes` | YES | PASS | `PromoCodes` | **PASS** |
| SD-024 | Milestones | Rewards Table & Form | Loyalty Milestone Config | AWS `Rewards` | AWS `Rewards` | YES | PASS | `Rewards` | **PASS** |
| SD-025 | Milestones | User Progress Table | User Progress Ledger | AWS `UserRewards`, `Users` | AWS `UserRewards`, `Users` | YES | PASS | `UserRewards` | **PASS** |
| SD-026 | Abandoned Carts | Inactive Cart Table | Abandoned User Carts | AWS `AbandonedCartLogs`, `Carts` | AWS `AbandonedCartLogs`, `Carts` | YES | PASS | `AbandonedCartLogs` | **PASS** |
| SD-027 | Abandoned Carts | Status Update Action | Recovery Status Flag | AWS `AbandonedCartLogs` | AWS `AbandonedCartLogs` | YES | PASS | `AbandonedCartLogs` | **PASS** |
| SD-028 | Warehouses | Warehouse Table & Form | Facility Master Records | AWS `Warehouses` | AWS `Warehouses` | YES | PASS | `Warehouses` | **PASS** |
| SD-029 | Delivery Boys | Personnel Table & Form | Delivery Boy Details | AWS `DeliveryBoy` | AWS `DeliveryBoy` | YES | PASS | `DeliveryBoy` | **PASS** |
| SD-030 | Routes | Routes Table & Form | Delivery Routes & Timings | AWS `Routes` | AWS `Routes` | YES | PASS | `Routes` | **PASS** |
| SD-031 | Store Timings | Timings Table & Toggle | Store Hours & Open/Close | AWS `StoreTimings`, `Settings` | AWS `StoreTimings`, `Settings` | YES | PASS | `StoreTimings`, `Settings` | **PASS** |
| SD-032 | Settings | App Settings Form | Cashback %, Price/Km, Min Order | AWS `Settings` | AWS `Settings` | YES | PASS | `Settings` | **PASS** |
| SD-033 | Forms | Franchise Enquiries | Partner Submissions | AWS `FranchiseForms` | AWS `FranchiseForms` | YES | PASS | `FranchiseForms` | **PASS** |
| SD-034 | Forms | Callback Requests | Customer Callback Tickets | AWS `CallbackForms` | AWS `CallbackForms` | YES | PASS | `CallbackForms` | **PASS** |
| SD-035 | Forms | Availability Requests | Product Locality Requests | AWS `AvailabilityForms` | AWS `AvailabilityForms` | YES | PASS | `AvailabilityForms` | **PASS** |
| SD-036 | Back In Stock | Notify Products Table | Waiting Customers List | AWS `NotifyProducts` | AWS `NotifyProducts` | YES | PASS | `NotifyProducts` | **PASS** |
| SD-037 | Back In Stock | Trigger Alert Action | Push/SMS Customer Alert | AWS `NotifyProducts`, `UserNotifications` | AWS `NotifyProducts`, `UserNotifications` | YES | PASS | `NotifyProducts` | **PASS** |
| SD-038 | Operations | CSV Master Exports | Product, Order, Warehouse Exports | AWS RDS Database | Dynamic CSV stream | YES | PASS | Multiple AWS Tables | **PASS** |
| SD-039 | Broadcast | Push Notification Form | Broadcast Alert Message | AWS `UserNotifications` | AWS `UserNotifications` | YES | PASS | `UserNotifications` | **PASS** |
| SD-040 | Authentication | Admin Login & Session | Admin Credentials & Token | AWS `AdminUsers` | AWS `AdminUsers` | YES | PASS | `AdminUsers` | **PASS** |
