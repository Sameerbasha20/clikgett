# ClikGett Admin Dashboard — Complete Page Inventory

| ID | Route | Page | Purpose | Data Source | API Endpoint | DB Table | Status |
|---|---|---|---|---|---|---|---|
| P-01 | `/` | Login | Admin Authentication | AWS RDS | `POST /api/adminusers/login` | `AdminUsers` | PASS |
| P-02 | `/forgotpassword` | ForgotPassword | Admin Password Reset & OTP | AWS RDS | `POST /api/adminusers/forgotpassword` | `AdminUsers` | PASS |
| P-03 | `/orders` | Orders | Current & Past Order Management | AWS RDS | `GET /api/orders/all`, `GET /api/orders/past` | `Orders`, `OrderItems` | PASS |
| P-04 | `/orders/:id` | OrderDetails | Order detail, delivery boy assign, item adjustments | AWS RDS | `GET /api/orders/:id`, `POST /api/adminorders/adjustorder` | `Orders`, `OrderItems`, `order_adjustments` | PASS |
| P-05 | `/customers` | Customers | User listings, customer search, balance lookup | AWS RDS | `GET /api/users/all` | `Users`, `Wallets` | PASS |
| P-06 | `/customers/:id` | UserDetails | Customer profile & order history | AWS RDS | `GET /api/users/detail/:id` | `Users`, `Orders` | PASS |
| P-07 | `/customers/transactions/:id` | Transactions | Wallet credit/debit, cashback expiry ledger | AWS RDS | `GET /api/adminusers/wallettransactions/:id`, `POST /api/adminusers/creditdebitwallet` | `Wallets`, `wallet_transactions` | PASS |
| P-08 | `/products` | Products | Product catalog, pricing, stock, category filter | AWS RDS | `GET /api/adminproducts/bycategory`, `POST /api/adminproducts/addproduct` | `Products`, `ProductVariants` | PASS |
| P-09 | `/products/details/:productID` | Details | Product variants, pricing, stock updates | AWS RDS | `GET /api/adminproducts/productdetail/:id` | `Products`, `ProductVariants` | PASS |
| P-10 | `/categories` | Category | Product categories management | AWS RDS | `GET /api/categories`, `POST /api/categories/add` | `Categories` | PASS |
| P-11 | `/subcategories` | Subcategories | Subcategory management | AWS RDS | `GET /api/subcategories`, `POST /api/subcategories/add` | `SubCategories` | PASS |
| P-12 | `/banners` | Banners | Promo banner carousel management | AWS RDS | `GET /api/banners`, `POST /api/banners/addbanner` | `Banners` | PASS |
| P-13 | `/promocodes` | Promocodes | Promo coupons, discounts, min order value | AWS RDS | `GET /api/promocodes/admin/all`, `POST /api/promocodes/admin/add` | `PromoCodes` | PASS |
| P-14 | `/sales` | Sales | Flash Sales and promotional product batches | AWS RDS | `GET /api/sales/all`, `POST /api/sales/create` | `Sales`, `SaleItems` | PASS |
| P-15 | `/buymore` | BuyMore | Buy More multi-tier quantity pricing tiers | AWS RDS | `GET /api/buymore/tiers`, `POST /api/buymore/tiers` | `buy_more_config`, `Products` | PASS |
| P-16 | `/restrictions` | Restrictions | Product exclusions (no coupon, no cashback) | AWS RDS | `GET /api/restrictions/restrictions`, `POST /api/restrictions/restrictions` | `product_restrictions`, `Products` | PASS |
| P-17 | `/cart-offers` | CartOffers | Cart threshold discount offers | AWS RDS | `GET /api/cartoffers/offers`, `POST /api/cartoffers/offers` | `cart_offers` | PASS |
| P-18 | `/milestones` | Milestones | Gamified loyalty milestones & rewards | AWS RDS | `GET /api/rewards/all`, `GET /api/rewards/userprogress` | `Rewards`, `UserRewards` | PASS |
| P-19 | `/abandoned-carts` | AbandonedCarts | Inactive shopping carts recovery tracking | AWS RDS | `GET /api/carts/abandoned/list` | `AbandonedCartLogs`, `Carts` | PASS |
| P-20 | `/Warehouse` | Warehouse | Master warehouse and facility locations | AWS RDS | `GET /api/warehouses`, `POST /api/warehouses/add` | `Warehouses` | PASS |
| P-21 | `/DeliveryBoy` | DeliverBoy | Delivery personnel roster & contact | AWS RDS | `GET /api/deliveryboy/all`, `POST /api/deliveryboy/add` | `DeliveryBoy` | PASS |
| P-22 | `/routes` | RoutesComponent | Delivery route zones & delivery schedules | AWS RDS | `GET /api/routes/admin/bystatus`, `POST /api/routes/admin/add` | `Routes`, `StoreTimings` | PASS |
| P-23 | `/store-timings` | StoreTimings | Store operating hours and active store toggle | AWS RDS | `GET /api/admintimings`, `POST /api/admintimings/toggle` | `StoreTimings`, `Settings` | PASS |
| P-24 | `/settings` | Settings | App settings, cashback rate, delivery fee/km | AWS RDS | `GET /api/settings`, `PUT /api/settings/update/:id` | `Settings` | PASS |
| P-25 | `/FranchiseEnquiry` | FranchiseEnquiry | Franchise partner submissions & status | AWS RDS | `GET /api/forms/franchise`, `PUT /api/forms/franchise/:id` | `FranchiseForms` | PASS |
| P-26 | `/Callbackforms` | Callbackforms | Customer callback requests & resolution | AWS RDS | `GET /api/forms/callback`, `PUT /api/forms/callback/:id` | `CallbackForms` | PASS |
| P-27 | `/availabilityForms` | Availability | Product locality availability requests | AWS RDS | `GET /api/forms/availability`, `PUT /api/forms/availability/:id` | `AvailabilityForms` | PASS |
| P-28 | `/notifyproducts` | Notify | Back-in-stock customer alerts & trigger | AWS RDS | `GET /api/adminusers/notifyproducts`, `POST /api/adminusers/triggernotifyproduct/:id` | `NotifyProducts` | PASS |
| P-29 | `/update-price` | Update | Bulk CSV product price & stock updates | AWS RDS / S3 | `POST /api/productcsv/upload` | `Products`, `ProductVariants` | PASS |
| P-30 | `/notification` | Notification | Broadcast push notifications | AWS RDS / FCM | `POST /api/adminusers/sendnotification` | `UserNotifications` | PASS |
| P-31 | `/kits` | Kits | Bundled product kit management | AWS RDS | `GET /api/adminproducts/kits` | `Products`, `KitItems` | PASS |
| P-32 | `/Recommended` | Recommended | Recommended product associations | AWS RDS | `GET /api/adminproducts/recommended` | `RecommendedProducts` | PASS |
| P-33 | `/operations` | Operations | CSV master exports for products, orders, etc. | AWS RDS | `GET /api/productcsv/download/:type` | `Products`, `Orders`, `Warehouses` | PASS |
