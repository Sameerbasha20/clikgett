# CLIKGETT AUTHORITATIVE ENDPOINT INVENTORY & AUDIT CATALOG

**Total Registered Endpoints:** 389  
**Canonical Routers:** 34 router modules mounted across 35 canonical prefix paths  
**Generated At:** 2026-10-14T12:21:10.648Z  

---

## 1. Inventory Summary by Module

| Router Module | Mount Prefix | Endpoints | Default Auth |
| :--- | :--- | :--- | :--- |
| `Users.js` | `/api/users` | 22 | None |
| `Categories.js` | `/api/categories` | 9 | Customer JWT |
| `Products.js` | `/api/products` | 12 | Customer JWT |
| `Carts.js` | `/api/carts` | 13 | Customer JWT |
| `AdminUsers.js` | `/api/adminuser` | 58 | None |
| `Banners.js` | `/api/banners` | 5 | Admin JWT |
| `SubCategories.js` | `/api/subcategories` | 10 | Admin JWT |
| `AdminProducts.js` | `/api/adminproducts` | 25 | Admin JWT |
| `PromoCodes.js` | `/api/promocodes` | 9 | None |
| `Address.js` | `/api/address` | 7 | Customer JWT |
| `Orders.js` | `/api/orders` | 10 | Customer JWT |
| `AdminOrders.js` | `/api/adminorders` | 36 | Admin JWT |
| `DeliveryBoy.js` | `/api/deliveryboy` | 15 | None |
| `Routes.js` | `/api/routes` | 11 | Admin JWT |
| `Productcsv.js` | `/api/productcsv` | 5 | None |
| `AdminTiming.js` | `/api/admintiming` | 7 | Admin JWT |
| `Warehouses.js` | `/api/warehouses` | 10 | Admin JWT |
| `Forms.js` | `/api/forms` | 21 | Admin JWT |
| `Sales.js` | `/api/sales` | 14 | None |
| `Rewards.js` | `/api/rewards` | 11 | Admin JWT |
| `BuyMore.js` | `/api/buymore` | 8 | Admin JWT |
| `ProductRestrictions.js` | `/api/restrictions` | 6 | Admin JWT |
| `CartOffers.js` | `/api/cartoffers` | 5 | Admin JWT |
| `Membership.js` | `/api/membership` | 6 | Admin JWT |
| `AdminCostOverview.js` | `/api/cost-overview` | 1 | Admin JWT |
| `ProductUnlocks.js` | `/api/product-unlocks` | 9 | Admin JWT |
| `AdminHomeSections.js` | `/api/home-sections` | 8 | Admin JWT |
| `SearchAnalytics.js` | `/api/search-analytics` | 3 | Admin JWT |
| `CashbackAdmin.js` | `/api/cashback-admin` | 3 | Admin JWT |
| `PhotoOrders.js` | `/api/photo-orders` | 6 | Customer JWT |
| `AdminPhotoOrders.js` | `/api/admin/photo-orders` | 7 | Admin JWT |
| `CustomerRequests.js` | `/api/customer` | 6 | Customer JWT |
| `AdminCustomerRequests.js` | `/api/admin` | 7 | Admin JWT |
| `Health.js` | `/health` | 2 | None |
| `Health.js` | `/api/health` | 2 | None |

---

## 2. Exhaustive Endpoint Catalog (389 Endpoints)

| ID | Method | Path | Router | Auth | Frontend Consumers | DB Tables |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **EP_001** | `POST` | `/api/users/signup/sendotp` | `Users.js` | None | Customer App | Users |
| **EP_002** | `POST` | `/api/users/login/sendotp` | `Users.js` | None | Customer App | Users |
| **EP_003** | `POST` | `/api/users/login/verifyotp` | `Users.js` | None | Customer App | Users |
| **EP_004** | `POST` | `/api/users/signup` | `Users.js` | None | Customer App | Users |
| **EP_005** | `GET` | `/api/users/homepage` | `Users.js` | None | Customer App | Users |
| **EP_006** | `GET` | `/api/users/homepagesectionproducts` | `Users.js` | Customer JWT | Customer App | Users, Products, ProductVariants |
| **EP_007** | `GET` | `/api/users/homepagesectionproducts_all/:HomeSectionId` | `Users.js` | Customer JWT | Customer App | Users, Products, ProductVariants |
| **EP_008** | `GET` | `/api/users/webhomepage` | `Users.js` | None | Customer App | Users |
| **EP_009** | `PUT` | `/api/users/update` | `Users.js` | Customer JWT | Customer App | Users |
| **EP_010** | `GET` | `/api/users/detail` | `Users.js` | Customer JWT | Customer App | Users |
| **EP_011** | `POST` | `/api/users/addfeedback/` | `Users.js` | Customer JWT | Customer App | Users |
| **EP_012** | `POST` | `/api/users/addfeedback` | `Users.js` | Customer JWT | Customer App | Users |
| **EP_013** | `GET` | `/api/users/feedback/order-status/:orderId` | `Users.js` | Customer JWT | Customer App | Users, Orders, OrderItems |
| **EP_014** | `GET` | `/api/users/feedback/eligibility/:orderId` | `Users.js` | Customer JWT | Customer App | Users, Orders, OrderItems |
| **EP_015** | `GET` | `/api/users/notifications` | `Users.js` | Customer JWT | Customer App | Users |
| **EP_016** | `PUT` | `/api/users/updatenotifications/:NotificationID` | `Users.js` | Customer JWT | Customer App | Users |
| **EP_017** | `GET` | `/api/users/settings` | `Users.js` | None | Customer App | Users |
| **EP_018** | `GET` | `/api/users/user_wallets` | `Users.js` | Customer JWT | Customer App | Users |
| **EP_019** | `POST` | `/api/users/add_wallet_money` | `Users.js` | Customer JWT | Customer App | Users |
| **EP_020** | `DELETE` | `/api/users/deleteuser` | `Users.js` | Customer JWT | Customer App | Users |
| **EP_021** | `GET` | `/api/users/datatransfer` | `Users.js` | None | Customer App | Users |
| **EP_022** | `GET` | `/api/users/updateproducts` | `Users.js` | None | Customer App | Users, Products, ProductVariants |
| **EP_023** | `GET` | `/api/categories/subcategories_by_category/:CategoryID` | `Categories.js` | Customer JWT | Customer App | Categories |
| **EP_024** | `GET` | `/api/categories/allcategoriesuser` | `Categories.js` | Customer JWT | Customer App | Users, Categories |
| **EP_025** | `GET` | `/api/categories/websubcategories` | `Categories.js` | None | Customer App | Categories |
| **EP_026** | `GET` | `/api/categories/subcategorydetail/:SubCategoryID` | `Categories.js` | Customer JWT | Customer App | Categories, SubCategories |
| **EP_027** | `GET` | `/api/categories/allcategoriesadmin` | `Categories.js` | Admin JWT | Customer App, Admin Web | AdminUsers, Categories |
| **EP_028** | `GET` | `/api/categories/detail/:CategoryID` | `Categories.js` | Admin JWT | Customer App, Admin Web | Categories |
| **EP_029** | `POST` | `/api/categories/addcategory` | `Categories.js` | Admin JWT | Customer App, Admin Web | Categories |
| **EP_030** | `PUT` | `/api/categories/updatecategory/:CategoryID` | `Categories.js` | Admin JWT | Customer App, Admin Web | Categories |
| **EP_031** | `DELETE` | `/api/categories/deletecategory/:CategoryID` | `Categories.js` | Admin JWT | Customer App, Admin Web | Categories |
| **EP_032** | `GET` | `/api/products/list` | `Products.js` | Customer JWT | Customer App | Products, ProductVariants |
| **EP_033** | `GET` | `/api/products/weblist` | `Products.js` | Customer JWT | Customer App | Products, ProductVariants |
| **EP_034** | `GET` | `/api/products/detail/:ProductID` | `Products.js` | Customer JWT | Customer App | Products, ProductVariants |
| **EP_035** | `GET` | `/api/products/search/:SearchString` | `Products.js` | Customer JWT | Customer App | Products, ProductVariants |
| **EP_036** | `GET` | `/api/products/suggestions` | `Products.js` | Customer JWT | Customer App | Products, ProductVariants |
| **EP_037** | `GET` | `/api/products/suggestions/:query` | `Products.js` | Customer JWT | Customer App | Products, ProductVariants |
| **EP_038** | `DELETE` | `/api/products/search-history` | `Products.js` | Customer JWT | Customer App | Products, ProductVariants |
| **EP_039** | `GET` | `/api/products/kits` | `Products.js` | Customer JWT | Customer App | Products, ProductVariants |
| **EP_040** | `GET` | `/api/products/allkits` | `Products.js` | Customer JWT | Customer App | Products, ProductVariants |
| **EP_041** | `GET` | `/api/products/kitdetail/:KitID` | `Products.js` | Customer JWT | Customer App | Products, ProductVariants |
| **EP_042** | `GET` | `/api/products/recommendedproducts` | `Products.js` | Customer JWT | Customer App | Products, ProductVariants |
| **EP_043** | `GET` | `/api/products/youmaylikeit` | `Products.js` | Customer JWT | Customer App | Products, ProductVariants |
| **EP_044** | `POST` | `/api/carts/validate_cart` | `Carts.js` | Customer JWT | Customer App | Carts, CartItems |
| **EP_045** | `POST` | `/api/carts/mycart` | `Carts.js` | Customer JWT | Customer App | Carts, CartItems |
| **EP_046** | `POST` | `/api/carts/addcart` | `Carts.js` | Customer JWT | Customer App | Carts, CartItems |
| **EP_047** | `DELETE` | `/api/carts/deletecartitem/:ProductID/:VariantID/:Type` | `Carts.js` | Customer JWT | Customer App | Products, ProductVariants, Carts, CartItems |
| **EP_048** | `DELETE` | `/api/carts/deletekit/:KitID/:Type` | `Carts.js` | Customer JWT | Customer App | Carts, CartItems |
| **EP_049** | `DELETE` | `/api/carts/deletecart/:CartID` | `Carts.js` | Customer JWT | Customer App | Carts, CartItems |
| **EP_050** | `GET` | `/api/carts/abandoned/trigger-notifications` | `Carts.js` | None | Customer App | Carts, CartItems |
| **EP_051** | `POST` | `/api/carts/abandoned/trigger-notifications` | `Carts.js` | None | Customer App | Carts, CartItems |
| **EP_052** | `GET` | `/api/carts/abandoned/list` | `Carts.js` | Admin JWT | Customer App, Admin Web | Carts, CartItems |
| **EP_053** | `GET` | `/api/carts/abandoned` | `Carts.js` | Admin JWT | Customer App, Admin Web | Carts, CartItems |
| **EP_054** | `GET` | `/api/carts/abandoned/:id` | `Carts.js` | Admin JWT | Customer App, Admin Web | Carts, CartItems |
| **EP_055** | `POST` | `/api/carts/abandoned/status` | `Carts.js` | Admin JWT | Customer App, Admin Web | Carts, CartItems |
| **EP_056** | `POST` | `/api/carts/abandoned/details` | `Carts.js` | Admin JWT | Customer App, Admin Web | Carts, CartItems |
| **EP_057** | `POST` | `/api/adminuser/login` | `AdminUsers.js` | None | Admin Web | Users, AdminUsers |
| **EP_058** | `POST` | `/api/adminuser/verify-2fa` | `AdminUsers.js` | None | Admin Web | Users, AdminUsers |
| **EP_059** | `POST` | `/api/adminuser/reset-2fa/:AdminID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_060** | `GET` | `/api/adminuser/2fa-status` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_061** | `GET` | `/api/adminuser/global-search` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_062** | `GET` | `/api/adminuser/referrals/config` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_063** | `PUT` | `/api/adminuser/referrals/config` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_064** | `GET` | `/api/adminuser/referrals/audit-history` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_065** | `GET` | `/api/adminuser/referrals/claims` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_066** | `GET` | `/api/adminuser/delivery-eta/rules` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_067** | `PUT` | `/api/adminuser/delivery-eta/rules` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_068** | `GET` | `/api/adminuser/delivery-eta/order/:OrderID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers, Orders, OrderItems, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_069** | `GET` | `/api/adminuser/getalldeliveryboys` | `AdminUsers.js` | DeliveryBoy JWT | Delivery App, Admin Web | Users, AdminUsers, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_070** | `GET` | `/api/adminuser/getactivedeliveryboys` | `AdminUsers.js` | DeliveryBoy JWT | Delivery App, Admin Web | Users, AdminUsers, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_071** | `GET` | `/api/adminuser/deliveryboydetail` | `AdminUsers.js` | DeliveryBoy JWT | Delivery App, Admin Web | Users, AdminUsers, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_072** | `PUT` | `/api/adminuser/updatedeliveryboy/:AdminID` | `AdminUsers.js` | DeliveryBoy JWT | Delivery App, Admin Web | Users, AdminUsers, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_073** | `DELETE` | `/api/adminuser/deletedeliveryboy/:AdminID` | `AdminUsers.js` | DeliveryBoy JWT | Delivery App, Admin Web | Users, AdminUsers, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_074** | `POST` | `/api/adminuser/addeliveryboy` | `AdminUsers.js` | DeliveryBoy JWT | Delivery App, Admin Web | Users, AdminUsers, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_075** | `PUT` | `/api/adminuser/updateuser/:UserID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_076** | `GET` | `/api/adminuser/userdetail/:UserID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_077** | `GET` | `/api/adminuser/customer-full-details/:UserID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_078** | `GET` | `/api/adminuser/userslist` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_079** | `GET` | `/api/adminuser/feedbackdetail/:FeedbackID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_080** | `GET` | `/api/adminuser/feedback/detail/:FeedbackID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_081** | `GET` | `/api/adminuser/feedbacklist/` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_082** | `GET` | `/api/adminuser/feedbacklist` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_083** | `GET` | `/api/adminuser/feedback/list` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_084** | `PUT` | `/api/adminuser/feedback/reply/:FeedbackID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_085** | `POST` | `/api/adminuser/feedback/reply/:FeedbackID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_086** | `POST` | `/api/adminuser/feedback/review/:FeedbackID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_087** | `PUT` | `/api/adminuser/feedback/review/:FeedbackID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_088** | `POST` | `/api/adminuser/feedback/credit-reward/:FeedbackID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers, UserRewards, RewardMilestones |
| **EP_089** | `GET` | `/api/adminuser/feedback/reward-config` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers, UserRewards, RewardMilestones |
| **EP_090** | `POST` | `/api/adminuser/feedback/reward-config` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers, UserRewards, RewardMilestones |
| **EP_091** | `PUT` | `/api/adminuser/feedback/reward-config` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers, UserRewards, RewardMilestones |
| **EP_092** | `POST` | `/api/adminuser/sendnotifications` | `AdminUsers.js` | None | Admin Web | Users, AdminUsers |
| **EP_093** | `GET` | `/api/adminuser/settingslist` | `AdminUsers.js` | None | Admin Web | Users, AdminUsers |
| **EP_094** | `GET` | `/api/adminuser/settingdetail/:ID` | `AdminUsers.js` | None | Admin Web | Users, AdminUsers |
| **EP_095** | `POST` | `/api/adminuser/addsettings` | `AdminUsers.js` | None | Admin Web | Users, AdminUsers |
| **EP_096** | `PUT` | `/api/adminuser/updatesettings/:ID` | `AdminUsers.js` | None | Admin Web | Users, AdminUsers |
| **EP_097** | `DELETE` | `/api/adminuser/deletesettings/:ID` | `AdminUsers.js` | None | Admin Web | Users, AdminUsers |
| **EP_098** | `GET` | `/api/adminuser/list` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_099** | `GET` | `/api/adminuser/adminlist` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_100** | `POST` | `/api/adminuser/addadmin` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_101** | `GET` | `/api/adminuser/detail/:AdminID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_102** | `PUT` | `/api/adminuser/updateadminuser/:AdminID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_103** | `DELETE` | `/api/adminuser/deleteadminuser/:AdminID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_104** | `PUT` | `/api/adminuser/update/:AdminID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_105** | `PUT` | `/api/adminuser/user/update/:UserID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_106** | `DELETE` | `/api/adminuser/user/delete/:UserID` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_107** | `GET` | `/api/adminuser/notifyproducts` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers, Products, ProductVariants |
| **EP_108** | `PUT` | `/api/adminuser/notifyproductupdate/:id` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers, Products, ProductVariants |
| **EP_109** | `GET` | `/api/adminuser/notifyproductdetail/:id` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers, Products, ProductVariants |
| **EP_110** | `GET` | `/api/adminuser/wallettransactions/:UserID` | `AdminUsers.js` | None | Admin Web | Users, AdminUsers |
| **EP_111** | `POST` | `/api/adminuser/creditdebitwallet` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers |
| **EP_112** | `POST` | `/api/adminuser/expirecashback` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers, CashbackRules, UserCashbackLogs |
| **EP_113** | `POST` | `/api/adminuser/triggernotifyproduct/:id` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers, Products, ProductVariants |
| **EP_114** | `PUT` | `/api/adminuser/triggernotifyproduct/:id` | `AdminUsers.js` | Admin JWT | Admin Web | Users, AdminUsers, Products, ProductVariants |
| **EP_115** | `GET` | `/api/banners` | `Banners.js` | Admin JWT | Admin Web | Banners |
| **EP_116** | `GET` | `/api/banners/detail/:BannerID` | `Banners.js` | Admin JWT | Admin Web | Banners |
| **EP_117** | `POST` | `/api/banners/addbanner` | `Banners.js` | Admin JWT | Admin Web | Banners |
| **EP_118** | `PUT` | `/api/banners/updatebanner/:BannerID` | `Banners.js` | Admin JWT | Admin Web | Banners |
| **EP_119** | `DELETE` | `/api/banners/deletebanner/:BannerID` | `Banners.js` | Admin JWT | Admin Web | Banners |
| **EP_120** | `GET` | `/api/subcategories` | `SubCategories.js` | Admin JWT | Admin Web | Categories, SubCategories |
| **EP_121** | `GET` | `/api/subcategories/bycategory/:CategoryID` | `SubCategories.js` | Admin JWT | Admin Web | Categories, SubCategories |
| **EP_122** | `GET` | `/api/subcategories/detail/:SubCategoryID` | `SubCategories.js` | Admin JWT | Admin Web | Categories, SubCategories |
| **EP_123** | `POST` | `/api/subcategories/add` | `SubCategories.js` | Admin JWT | Admin Web | Categories, SubCategories |
| **EP_124** | `PUT` | `/api/subcategories/update/:SubCategoryID` | `SubCategories.js` | Admin JWT | Admin Web | Categories, SubCategories |
| **EP_125** | `DELETE` | `/api/subcategories/delete/:SubCategoryID` | `SubCategories.js` | Admin JWT | Admin Web | Categories, SubCategories |
| **EP_126** | `PUT` | `/api/subcategories/admin/reorder` | `SubCategories.js` | Admin JWT | Admin Web | AdminUsers, Categories, SubCategories, Orders, OrderItems |
| **EP_127** | `PUT` | `/api/subcategories/reorder` | `SubCategories.js` | Admin JWT | Admin Web | Categories, SubCategories, Orders, OrderItems |
| **EP_128** | `POST` | `/api/subcategories/admin/reorder` | `SubCategories.js` | Admin JWT | Admin Web | AdminUsers, Categories, SubCategories, Orders, OrderItems |
| **EP_129** | `POST` | `/api/subcategories/reorder` | `SubCategories.js` | Admin JWT | Admin Web | Categories, SubCategories, Orders, OrderItems |
| **EP_130** | `GET` | `/api/adminproducts/bycategory` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Categories, Products, ProductVariants |
| **EP_131** | `GET` | `/api/adminproducts/bysubcategory` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Categories, SubCategories, Products, ProductVariants |
| **EP_132** | `GET` | `/api/adminproducts/kits` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_133** | `GET` | `/api/adminproducts/search/:SearchString` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_134** | `GET` | `/api/adminproducts/productdetail/:ProductID` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_135** | `POST` | `/api/adminproducts/addproduct` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_136** | `POST` | `/api/adminproducts/addvariant` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_137** | `PUT` | `/api/adminproducts/updateproduct/:ProductID` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_138** | `PUT` | `/api/adminproducts/updateproductvariant/:VariantID` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_139** | `DELETE` | `/api/adminproducts/deleteproduct/:ProductID` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_140** | `DELETE` | `/api/adminproducts/deletevariant/:VariantID` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_141** | `GET` | `/api/adminproducts/allkits` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_142** | `GET` | `/api/adminproducts/kitdetail/:KitID` | `AdminProducts.js` | None | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_143** | `POST` | `/api/adminproducts/addkit` | `AdminProducts.js` | None | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_144** | `POST` | `/api/adminproducts/addkititem` | `AdminProducts.js` | None | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_145** | `PUT` | `/api/adminproducts/updatekit/:KitID` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_146** | `PUT` | `/api/adminproducts/updatekititem/:KitItemID` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_147** | `DELETE` | `/api/adminproducts/deletekit/:KitID` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_148** | `DELETE` | `/api/adminproducts/deletekititem/:KitItemID` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_149** | `GET` | `/api/adminproducts/recommendedproducts` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_150** | `POST` | `/api/adminproducts/addrecommendedproduct` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_151** | `DELETE` | `/api/adminproducts/deleterecommendedproducts/:RecProductID` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_152** | `GET` | `/api/adminproducts/buy-more-config` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_153** | `PUT` | `/api/adminproducts/buy-more-config/:ConfigID` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_154** | `DELETE` | `/api/adminproducts/buy-more-config/:ConfigID` | `AdminProducts.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_155** | `GET` | `/api/promocodes/winback/trigger` | `PromoCodes.js` | None | Internal / Service | PromoCodes |
| **EP_156** | `POST` | `/api/promocodes/winback/trigger` | `PromoCodes.js` | None | Internal / Service | PromoCodes |
| **EP_157** | `GET` | `/api/promocodes/active` | `PromoCodes.js` | Customer JWT | Customer App | PromoCodes |
| **EP_158** | `POST` | `/api/promocodes/user/verify` | `PromoCodes.js` | Customer JWT | Customer App | Users, PromoCodes |
| **EP_159** | `GET` | `/api/promocodes/admin/all` | `PromoCodes.js` | Admin JWT | Admin Web | AdminUsers, PromoCodes |
| **EP_160** | `GET` | `/api/promocodes/admin/detail/:PromoCodeID` | `PromoCodes.js` | Admin JWT | Admin Web | AdminUsers, PromoCodes |
| **EP_161** | `POST` | `/api/promocodes/admin/add` | `PromoCodes.js` | Admin JWT | Admin Web | AdminUsers, PromoCodes |
| **EP_162** | `PUT` | `/api/promocodes/admin/update/:PromoCodeID` | `PromoCodes.js` | Admin JWT | Admin Web | AdminUsers, PromoCodes |
| **EP_163** | `DELETE` | `/api/promocodes/admin/delete/:PromoCodeID` | `PromoCodes.js` | Admin JWT | Admin Web | AdminUsers, PromoCodes |
| **EP_164** | `GET` | `/api/address/myaddress` | `Address.js` | Customer JWT | Customer App | UserAddresses, AdminShopToggleSettings |
| **EP_165** | `GET` | `/api/address/byaddressid/:AddressID` | `Address.js` | Customer JWT | Customer App | UserAddresses, AdminShopToggleSettings |
| **EP_166** | `POST` | `/api/address/check-serviceability` | `Address.js` | None | Customer App | UserAddresses, AdminShopToggleSettings |
| **EP_167** | `POST` | `/api/address/checkserviceability` | `Address.js` | None | Customer App | UserAddresses, AdminShopToggleSettings |
| **EP_168** | `POST` | `/api/address/addaddress` | `Address.js` | Customer JWT | Customer App | UserAddresses, AdminShopToggleSettings |
| **EP_169** | `PUT` | `/api/address/:AddressID` | `Address.js` | Customer JWT | Customer App | UserAddresses, AdminShopToggleSettings |
| **EP_170** | `DELETE` | `/api/address/:AddressID` | `Address.js` | Customer JWT | Customer App | UserAddresses, AdminShopToggleSettings |
| **EP_171** | `GET` | `/api/orders/currentorders` | `Orders.js` | Customer JWT | Customer App | Orders, OrderItems |
| **EP_172** | `GET` | `/api/orders/pastorders` | `Orders.js` | Customer JWT | Customer App | Orders, OrderItems |
| **EP_173** | `GET` | `/api/orders/myorder/:OrderID` | `Orders.js` | Customer JWT | Customer App | Orders, OrderItems |
| **EP_174** | `POST` | `/api/orders/orderpayments` | `Orders.js` | Customer JWT | Customer App | Orders, OrderItems |
| **EP_175** | `POST` | `/api/orders/createorder` | `Orders.js` | Customer JWT | Customer App | Orders, OrderItems |
| **EP_176** | `PUT` | `/api/orders/cancelorderuser/:OrderID` | `Orders.js` | Customer JWT | Customer App | Users, Orders, OrderItems |
| **EP_177** | `POST` | `/api/orders/reorder` | `Orders.js` | Customer JWT | Customer App | Orders, OrderItems |
| **EP_178** | `GET` | `/api/orders/checktiming` | `Orders.js` | None | Customer App | Orders, OrderItems |
| **EP_179** | `GET` | `/api/orders/orderstatus/:OrderID` | `Orders.js` | Customer JWT | Customer App | Orders, OrderItems |
| **EP_180** | `GET` | `/api/orders/invoice/:OrderID` | `Orders.js` | None | Customer App | Orders, OrderItems |
| **EP_181** | `GET` | `/api/adminorders/currentorders` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_182** | `GET` | `/api/adminorders/pastorders` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_183** | `GET` | `/api/adminorders/orderdetail` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_184** | `GET` | `/api/adminorders/invoice/:OrderID` | `AdminOrders.js` | None | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_185** | `GET` | `/api/adminorders/eligible-drivers` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_186** | `PUT` | `/api/adminorders/assigndeliverboy/:OrderID` | `AdminOrders.js` | DeliveryBoy JWT | Delivery App, Admin Web | AdminUsers, Orders, OrderItems |
| **EP_187** | `PUT` | `/api/adminorders/updatestatus/:OrderID` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_188** | `PUT` | `/api/adminorders/editedeliverytime/:OrderID` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_189** | `PUT` | `/api/adminorders/adjustorder` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_190** | `POST` | `/api/adminorders/adjustorder` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_191** | `PUT` | `/api/adminorders/adjustorder/:OrderID` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_192** | `POST` | `/api/adminorders/remove-item` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_193** | `DELETE` | `/api/adminorders/orders/:OrderID/items/:OrderItemID` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_194** | `GET` | `/api/adminorders/removed-items/:OrderID` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_195** | `GET` | `/api/adminorders/adjustments/:OrderID` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_196** | `GET` | `/api/adminorders/adjustorder/:OrderID` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_197** | `GET` | `/api/adminorders/scheduledorders` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_198** | `GET` | `/api/adminorders/orderdetail/timeline/:OrderID` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_199** | `GET` | `/api/adminorders/ordertimeline/:OrderID` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_200** | `GET` | `/api/adminorders/pastorders/sort` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_201** | `GET` | `/api/adminorders/pastorderssort` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_202** | `GET` | `/api/adminorders/pastorders/filter` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_203** | `GET` | `/api/adminorders/pastordersfilter` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_204** | `GET` | `/api/adminorders/pastorders/mobilefilter` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_205** | `GET` | `/api/adminorders/pastordersmobilefilter` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_206** | `GET` | `/api/adminorders/pastorders/usernamefilter` | `AdminOrders.js` | Admin JWT | Admin Web | Users, AdminUsers, Orders, OrderItems |
| **EP_207** | `GET` | `/api/adminorders/pastordersusernamefilter` | `AdminOrders.js` | Admin JWT | Admin Web | Users, AdminUsers, Orders, OrderItems |
| **EP_208** | `GET` | `/api/adminorders/pastorders/orderidfilter` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_209** | `GET` | `/api/adminorders/pastordersorderidfilter` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_210** | `GET` | `/api/adminorders/currentorders/sort` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_211** | `GET` | `/api/adminorders/currentorderssort` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_212** | `GET` | `/api/adminorders/live-operations` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_213** | `GET` | `/api/adminorders/delays` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_214** | `POST` | `/api/adminorders/delays/:DelayID/review` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_215** | `PUT` | `/api/adminorders/reassign/:OrderID` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_216** | `GET` | `/api/adminorders/dynamic-eta/:OrderID` | `AdminOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems |
| **EP_217** | `POST` | `/api/deliveryboy/sendotp` | `DeliveryBoy.js` | None | Delivery App | DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_218** | `POST` | `/api/deliveryboy/login` | `DeliveryBoy.js` | DeliveryBoy JWT | Delivery App | DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_219** | `GET` | `/api/deliveryboy/getroutes` | `DeliveryBoy.js` | DeliveryBoy JWT | Delivery App | DeliveryBoyShiftLogs, DriverLocationPings, Routes |
| **EP_220** | `GET` | `/api/deliveryboy/ordersbyroute` | `DeliveryBoy.js` | DeliveryBoy JWT | Customer App, Delivery App | Orders, OrderItems, DeliveryBoyShiftLogs, DriverLocationPings, Routes |
| **EP_221** | `GET` | `/api/deliveryboy/orderdetail` | `DeliveryBoy.js` | DeliveryBoy JWT | Delivery App | Orders, OrderItems, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_222** | `GET` | `/api/deliveryboy/orderstatus` | `DeliveryBoy.js` | DeliveryBoy JWT | Customer App, Delivery App | Orders, OrderItems, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_223** | `PUT` | `/api/deliveryboy/updatestatus/:OrderID` | `DeliveryBoy.js` | DeliveryBoy JWT | Delivery App | Orders, OrderItems, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_224** | `PUT` | `/api/deliveryboy/update/:AdminID` | `DeliveryBoy.js` | DeliveryBoy JWT | Delivery App | AdminUsers, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_225** | `POST` | `/api/deliveryboy/sendotp_order` | `DeliveryBoy.js` | DeliveryBoy JWT | Delivery App | Orders, OrderItems, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_226** | `POST` | `/api/deliveryboy/verifyotp_order` | `DeliveryBoy.js` | DeliveryBoy JWT | Delivery App | Orders, OrderItems, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_227** | `PUT` | `/api/deliveryboy/duty-status` | `DeliveryBoy.js` | DeliveryBoy JWT | Delivery App | DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_228** | `GET` | `/api/deliveryboy/duty-status` | `DeliveryBoy.js` | DeliveryBoy JWT | Delivery App | DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_229** | `POST` | `/api/deliveryboy/location/ping` | `DeliveryBoy.js` | DeliveryBoy JWT | Delivery App | DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_230** | `POST` | `/api/deliveryboy/orders/report-delay` | `DeliveryBoy.js` | DeliveryBoy JWT | Customer App, Delivery App | Orders, OrderItems, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_231** | `POST` | `/api/deliveryboy/orders/report-issue` | `DeliveryBoy.js` | DeliveryBoy JWT | Customer App, Delivery App | Orders, OrderItems, DeliveryBoyShiftLogs, DriverLocationPings |
| **EP_232** | `GET` | `/api/routes/admin/bystatus` | `Routes.js` | Admin JWT | Admin Web | AdminUsers, Routes |
| **EP_233** | `GET` | `/api/routes/admin/detail/:RouteID` | `Routes.js` | Admin JWT | Admin Web | AdminUsers, Routes |
| **EP_234** | `POST` | `/api/routes/admin/add` | `Routes.js` | Admin JWT | Admin Web | AdminUsers, Routes |
| **EP_235** | `PUT` | `/api/routes/admin/update/:RouteID` | `Routes.js` | Admin JWT | Admin Web | AdminUsers, Routes |
| **EP_236** | `DELETE` | `/api/routes/admin/delete/:RouteID` | `Routes.js` | Admin JWT | Admin Web | AdminUsers, Routes |
| **EP_237** | `GET` | `/api/routes/deliveryboy/` | `Routes.js` | DeliveryBoy JWT | Delivery App | DeliveryBoyShiftLogs, DriverLocationPings, Routes |
| **EP_238** | `GET` | `/api/routes/deliveryboy/detail/:RouteID` | `Routes.js` | DeliveryBoy JWT | Delivery App | DeliveryBoyShiftLogs, DriverLocationPings, Routes |
| **EP_239** | `POST` | `/api/routes/admin/timing/add` | `Routes.js` | Admin JWT | Admin Web | AdminUsers, Routes |
| **EP_240** | `PUT` | `/api/routes/admin/timing/update/:TimingID` | `Routes.js` | Admin JWT | Admin Web | AdminUsers, Routes |
| **EP_241** | `GET` | `/api/routes/admin/timing/` | `Routes.js` | Admin JWT | Admin Web | AdminUsers, Routes |
| **EP_242** | `DELETE` | `/api/routes/admin/timing/delete/:TimingID` | `Routes.js` | Admin JWT | Admin Web | AdminUsers, Routes |
| **EP_243** | `PUT` | `/api/productcsv/update/:filename` | `Productcsv.js` | None | Internal / Service | Products, ProductVariants |
| **EP_244** | `GET` | `/api/productcsv/pendingproductscsv` | `Productcsv.js` | None | Internal / Service | Products, ProductVariants |
| **EP_245** | `GET` | `/api/productcsv/orderdetails` | `Productcsv.js` | None | Internal / Service | Products, ProductVariants, Orders, OrderItems |
| **EP_246** | `GET` | `/api/productcsv/productdetails` | `Productcsv.js` | None | Internal / Service | Products, ProductVariants |
| **EP_247** | `GET` | `/api/productcsv/warehouse` | `Productcsv.js` | None | Internal / Service | Products, ProductVariants, Warehouses |
| **EP_248** | `POST` | `/api/admintiming/add` | `AdminTiming.js` | Admin JWT | Admin Web | AdminUsers |
| **EP_249** | `PUT` | `/api/admintiming/update/:TimingID` | `AdminTiming.js` | Admin JWT | Admin Web | AdminUsers |
| **EP_250** | `GET` | `/api/admintiming` | `AdminTiming.js` | Admin JWT | Admin Web | AdminUsers |
| **EP_251** | `GET` | `/api/admintiming/shopstatus` | `AdminTiming.js` | Admin JWT | Admin Web | AdminUsers |
| **EP_252** | `PUT` | `/api/admintiming/toggle` | `AdminTiming.js` | Admin JWT | Admin Web | AdminUsers |
| **EP_253** | `DELETE` | `/api/admintiming/delete/:TimingID` | `AdminTiming.js` | Admin JWT | Admin Web | AdminUsers |
| **EP_254** | `PUT` | `/api/admintiming/updatesettings/:SettingID` | `AdminTiming.js` | Admin JWT | Admin Web | AdminUsers |
| **EP_255** | `GET` | `/api/warehouses` | `Warehouses.js` | Admin JWT | Admin Web | Warehouses |
| **EP_256** | `GET` | `/api/warehouses/all` | `Warehouses.js` | Admin JWT | Admin Web | Warehouses |
| **EP_257** | `GET` | `/api/warehouses/detail/:id` | `Warehouses.js` | Admin JWT | Admin Web | Warehouses |
| **EP_258** | `GET` | `/api/warehouses/:id` | `Warehouses.js` | Admin JWT | Admin Web | Warehouses |
| **EP_259** | `POST` | `/api/warehouses/add` | `Warehouses.js` | Admin JWT | Admin Web | Warehouses |
| **EP_260** | `POST` | `/api/warehouses` | `Warehouses.js` | Admin JWT | Admin Web | Warehouses |
| **EP_261** | `PUT` | `/api/warehouses/update/:id` | `Warehouses.js` | Admin JWT | Admin Web | Warehouses |
| **EP_262** | `PUT` | `/api/warehouses/:id` | `Warehouses.js` | Admin JWT | Admin Web | Warehouses |
| **EP_263** | `DELETE` | `/api/warehouses/delete/:id` | `Warehouses.js` | Admin JWT | Admin Web | Warehouses |
| **EP_264** | `DELETE` | `/api/warehouses/:id` | `Warehouses.js` | Admin JWT | Admin Web | Warehouses |
| **EP_265** | `GET` | `/api/forms/callback` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_266** | `GET` | `/api/forms/callbackforms` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_267** | `GET` | `/api/forms/callback/:id` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_268** | `POST` | `/api/forms/callback/status` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_269** | `PUT` | `/api/forms/callback/:id` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_270** | `PUT` | `/api/forms/callbackforms/:id` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_271** | `PUT` | `/api/forms/updatecallback/:id` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_272** | `GET` | `/api/forms/franchise` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_273** | `GET` | `/api/forms/franchiseEnquiryforms` | `Forms.js` | Admin JWT | Admin Web | CustomerEnquiries, CustomerProductRequests |
| **EP_274** | `GET` | `/api/forms/franchise/:id` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_275** | `POST` | `/api/forms/franchise/status` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_276** | `PUT` | `/api/forms/franchise/:id` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_277** | `PUT` | `/api/forms/franchiseEnquiryforms/:id` | `Forms.js` | Admin JWT | Admin Web | CustomerEnquiries, CustomerProductRequests |
| **EP_278** | `PUT` | `/api/forms/updatefranchise/:id` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_279** | `GET` | `/api/forms/availability` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_280** | `GET` | `/api/forms/availabilityforms` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_281** | `GET` | `/api/forms/availability/:id` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_282** | `POST` | `/api/forms/availability/status` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_283** | `PUT` | `/api/forms/availability/:id` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_284** | `PUT` | `/api/forms/availabilityforms/:id` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_285** | `PUT` | `/api/forms/updateavailability/:id` | `Forms.js` | Admin JWT | Admin Web | N/A |
| **EP_286** | `GET` | `/api/sales/getsales` | `Sales.js` | None | Internal / Service | N/A |
| **EP_287** | `GET` | `/api/sales/all` | `Sales.js` | Admin JWT | Admin Web | N/A |
| **EP_288** | `GET` | `/api/sales` | `Sales.js` | Admin JWT | Admin Web | N/A |
| **EP_289** | `GET` | `/api/sales/details/:id` | `Sales.js` | Admin JWT | Admin Web | N/A |
| **EP_290** | `POST` | `/api/sales/create` | `Sales.js` | Admin JWT | Admin Web | N/A |
| **EP_291** | `POST` | `/api/sales/update` | `Sales.js` | Admin JWT | Admin Web | N/A |
| **EP_292** | `PUT` | `/api/sales/:id` | `Sales.js` | Admin JWT | Admin Web | N/A |
| **EP_293** | `POST` | `/api/sales/delete` | `Sales.js` | Admin JWT | Admin Web | N/A |
| **EP_294** | `DELETE` | `/api/sales/:id` | `Sales.js` | Admin JWT | Admin Web | N/A |
| **EP_295** | `POST` | `/api/sales/additems` | `Sales.js` | Admin JWT | Admin Web | N/A |
| **EP_296** | `POST` | `/api/sales/removeitem` | `Sales.js` | Admin JWT | Admin Web | N/A |
| **EP_297** | `GET` | `/api/sales/product/:productId` | `Sales.js` | Admin JWT | Admin Web | Products, ProductVariants |
| **EP_298** | `POST` | `/api/sales/assign-product` | `Sales.js` | Admin JWT | Admin Web | Products, ProductVariants |
| **EP_299** | `POST` | `/api/sales/remove-product` | `Sales.js` | Admin JWT | Admin Web | Products, ProductVariants |
| **EP_300** | `GET` | `/api/rewards/all` | `Rewards.js` | Admin JWT | Customer App, Admin Web | UserRewards, RewardMilestones |
| **EP_301** | `GET` | `/api/rewards/milestones` | `Rewards.js` | Admin JWT | Customer App, Admin Web | UserRewards, RewardMilestones |
| **EP_302** | `GET` | `/api/rewards/config` | `Rewards.js` | Admin JWT | Customer App, Admin Web | UserRewards, RewardMilestones |
| **EP_303** | `GET` | `/api/rewards/userprogress` | `Rewards.js` | Admin JWT | Customer App, Admin Web | Users, UserRewards, RewardMilestones |
| **EP_304** | `POST` | `/api/rewards/create` | `Rewards.js` | Admin JWT | Customer App, Admin Web | UserRewards, RewardMilestones |
| **EP_305** | `POST` | `/api/rewards/update` | `Rewards.js` | Admin JWT | Customer App, Admin Web | UserRewards, RewardMilestones |
| **EP_306** | `PUT` | `/api/rewards/:id` | `Rewards.js` | Admin JWT | Customer App, Admin Web | UserRewards, RewardMilestones |
| **EP_307** | `POST` | `/api/rewards/delete` | `Rewards.js` | Admin JWT | Customer App, Admin Web | UserRewards, RewardMilestones |
| **EP_308** | `DELETE` | `/api/rewards/:id` | `Rewards.js` | Admin JWT | Customer App, Admin Web | UserRewards, RewardMilestones |
| **EP_309** | `GET` | `/api/rewards/myMilestones` | `Rewards.js` | Customer JWT | Customer App | UserRewards, RewardMilestones |
| **EP_310** | `GET` | `/api/rewards/myRewards` | `Rewards.js` | Customer JWT | Customer App | UserRewards, RewardMilestones |
| **EP_311** | `GET` | `/api/buymore/tiers` | `BuyMore.js` | Admin JWT | Customer App, Admin Web | BuyMoreOffers |
| **EP_312** | `GET` | `/api/buymore/tiers/:ProductID` | `BuyMore.js` | Admin JWT | Customer App, Admin Web | Products, ProductVariants, BuyMoreOffers |
| **EP_313** | `POST` | `/api/buymore/tiers` | `BuyMore.js` | Admin JWT | Customer App, Admin Web | BuyMoreOffers |
| **EP_314** | `POST` | `/api/buymore/save-product-tiers` | `BuyMore.js` | Admin JWT | Customer App, Admin Web | Products, ProductVariants, BuyMoreOffers |
| **EP_315** | `PUT` | `/api/buymore/tiers/:ID` | `BuyMore.js` | Admin JWT | Customer App, Admin Web | BuyMoreOffers |
| **EP_316** | `PUT` | `/api/buymore/tiers/status/:ID` | `BuyMore.js` | Admin JWT | Customer App, Admin Web | BuyMoreOffers |
| **EP_317** | `PATCH` | `/api/buymore/tiers/:ID/status` | `BuyMore.js` | Admin JWT | Customer App, Admin Web | BuyMoreOffers |
| **EP_318** | `DELETE` | `/api/buymore/tiers/:ID` | `BuyMore.js` | Admin JWT | Customer App, Admin Web | BuyMoreOffers |
| **EP_319** | `GET` | `/api/restrictions/restrictions` | `ProductRestrictions.js` | Admin JWT | Admin Web | N/A |
| **EP_320** | `POST` | `/api/restrictions/restrictions` | `ProductRestrictions.js` | Admin JWT | Admin Web | N/A |
| **EP_321** | `PUT` | `/api/restrictions/restrictions/:ID` | `ProductRestrictions.js` | Admin JWT | Admin Web | N/A |
| **EP_322** | `DELETE` | `/api/restrictions/restrictions/:ID` | `ProductRestrictions.js` | Admin JWT | Admin Web | N/A |
| **EP_323** | `POST` | `/api/restrictions/save-product-restrictions` | `ProductRestrictions.js` | Admin JWT | Admin Web | Products, ProductVariants |
| **EP_324** | `POST` | `/api/restrictions/restrictions/save-product-restrictions` | `ProductRestrictions.js` | Admin JWT | Admin Web | Products, ProductVariants |
| **EP_325** | `GET` | `/api/cartoffers/offers` | `CartOffers.js` | Admin JWT | Customer App, Admin Web | Carts, CartItems |
| **EP_326** | `POST` | `/api/cartoffers/offers` | `CartOffers.js` | Admin JWT | Customer App, Admin Web | Carts, CartItems |
| **EP_327** | `PUT` | `/api/cartoffers/offers/:OfferID` | `CartOffers.js` | Admin JWT | Customer App, Admin Web | Carts, CartItems |
| **EP_328** | `PUT` | `/api/cartoffers/offers/status/:OfferID` | `CartOffers.js` | Admin JWT | Customer App, Admin Web | Carts, CartItems |
| **EP_329** | `DELETE` | `/api/cartoffers/offers/:OfferID` | `CartOffers.js` | Admin JWT | Customer App, Admin Web | Carts, CartItems |
| **EP_330** | `GET` | `/api/membership/plans` | `Membership.js` | Admin JWT | Customer App, Admin Web | MembershipPlans, UserMemberships |
| **EP_331** | `GET` | `/api/membership/product/:productId` | `Membership.js` | Admin JWT | Customer App, Admin Web | Products, ProductVariants, MembershipPlans, UserMemberships |
| **EP_332** | `POST` | `/api/membership/product/save` | `Membership.js` | Admin JWT | Customer App, Admin Web | Products, ProductVariants, MembershipPlans, UserMemberships |
| **EP_333** | `POST` | `/api/membership/save-product-pricing` | `Membership.js` | Admin JWT | Customer App, Admin Web | Products, ProductVariants, MembershipPlans, UserMemberships |
| **EP_334** | `POST` | `/api/membership/product/delete` | `Membership.js` | Admin JWT | Customer App, Admin Web | Products, ProductVariants, MembershipPlans, UserMemberships |
| **EP_335** | `DELETE` | `/api/membership/product/:productId/:planId` | `Membership.js` | Admin JWT | Customer App, Admin Web | Products, ProductVariants, MembershipPlans, UserMemberships |
| **EP_336** | `GET` | `/api/cost-overview/cost-overview` | `AdminCostOverview.js` | Admin JWT | Admin Web | AdminUsers |
| **EP_337** | `GET` | `/api/product-unlocks/admin` | `ProductUnlocks.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_338** | `POST` | `/api/product-unlocks/admin` | `ProductUnlocks.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_339** | `PUT` | `/api/product-unlocks/admin/:UnlockID` | `ProductUnlocks.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_340** | `DELETE` | `/api/product-unlocks/admin/:UnlockID` | `ProductUnlocks.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants |
| **EP_341** | `GET` | `/api/product-unlocks/unlocks` | `ProductUnlocks.js` | Admin JWT | Admin Web | Products, ProductVariants |
| **EP_342** | `POST` | `/api/product-unlocks/unlocks` | `ProductUnlocks.js` | Admin JWT | Admin Web | Products, ProductVariants |
| **EP_343** | `PUT` | `/api/product-unlocks/unlocks/:UnlockID` | `ProductUnlocks.js` | Admin JWT | Admin Web | Products, ProductVariants |
| **EP_344** | `DELETE` | `/api/product-unlocks/unlocks/:UnlockID` | `ProductUnlocks.js` | Admin JWT | Admin Web | Products, ProductVariants |
| **EP_345** | `GET` | `/api/product-unlocks/list` | `ProductUnlocks.js` | None | Internal / Service | Products, ProductVariants |
| **EP_346** | `GET` | `/api/home-sections/admin` | `AdminHomeSections.js` | Admin JWT | Admin Web | AdminUsers |
| **EP_347** | `POST` | `/api/home-sections/admin` | `AdminHomeSections.js` | Admin JWT | Admin Web | AdminUsers |
| **EP_348** | `PUT` | `/api/home-sections/admin/:SectionID` | `AdminHomeSections.js` | Admin JWT | Admin Web | AdminUsers |
| **EP_349** | `DELETE` | `/api/home-sections/admin/:SectionID` | `AdminHomeSections.js` | Admin JWT | Admin Web | AdminUsers |
| **EP_350** | `GET` | `/api/home-sections/sections` | `AdminHomeSections.js` | Admin JWT | Admin Web | AdminUsers |
| **EP_351** | `POST` | `/api/home-sections/sections` | `AdminHomeSections.js` | Admin JWT | Admin Web | AdminUsers |
| **EP_352** | `PUT` | `/api/home-sections/sections/:SectionID` | `AdminHomeSections.js` | Admin JWT | Admin Web | AdminUsers |
| **EP_353** | `DELETE` | `/api/home-sections/sections/:SectionID` | `AdminHomeSections.js` | Admin JWT | Admin Web | AdminUsers |
| **EP_354** | `GET` | `/api/search-analytics/admin` | `SearchAnalytics.js` | Admin JWT | Admin Web | AdminUsers |
| **EP_355** | `GET` | `/api/search-analytics/keywords` | `SearchAnalytics.js` | Admin JWT | Admin Web | N/A |
| **EP_356** | `GET` | `/api/search-analytics/keyword-users` | `SearchAnalytics.js` | Admin JWT | Admin Web | Users |
| **EP_357** | `GET` | `/api/cashback-admin/pending` | `CashbackAdmin.js` | Admin JWT | Admin Web | AdminUsers, CashbackRules, UserCashbackLogs |
| **EP_358** | `POST` | `/api/cashback-admin/approve` | `CashbackAdmin.js` | Admin JWT | Admin Web | AdminUsers, CashbackRules, UserCashbackLogs |
| **EP_359** | `POST` | `/api/cashback-admin/reject` | `CashbackAdmin.js` | Admin JWT | Admin Web | AdminUsers, CashbackRules, UserCashbackLogs |
| **EP_360** | `POST` | `/api/photo-orders/submit` | `PhotoOrders.js` | Customer JWT | Customer App | Orders, OrderItems, PhotoOrderRequests |
| **EP_361** | `GET` | `/api/photo-orders/my-requests` | `PhotoOrders.js` | Customer JWT | Customer App | Orders, OrderItems, PhotoOrderRequests |
| **EP_362** | `GET` | `/api/photo-orders/request/:id` | `PhotoOrders.js` | Customer JWT | Customer App | Orders, OrderItems, PhotoOrderRequests |
| **EP_363** | `GET` | `/api/photo-orders/image/:id` | `PhotoOrders.js` | Customer JWT | Customer App | Orders, OrderItems, PhotoOrderRequests |
| **EP_364** | `POST` | `/api/photo-orders/request/:id/confirm` | `PhotoOrders.js` | Customer JWT | Customer App | Orders, OrderItems, PhotoOrderRequests |
| **EP_365** | `POST` | `/api/photo-orders/request/:id/reject` | `PhotoOrders.js` | Customer JWT | Customer App | Orders, OrderItems, PhotoOrderRequests |
| **EP_366** | `GET` | `/api/admin/photo-orders/list` | `AdminPhotoOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems, PhotoOrderRequests |
| **EP_367** | `GET` | `/api/admin/photo-orders/detail/:id` | `AdminPhotoOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems, PhotoOrderRequests |
| **EP_368** | `GET` | `/api/admin/photo-orders/image/:id` | `AdminPhotoOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems, PhotoOrderRequests |
| **EP_369** | `PUT` | `/api/admin/photo-orders/claim/:id` | `AdminPhotoOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems, PhotoOrderRequests |
| **EP_370** | `POST` | `/api/admin/photo-orders/prepare-proposal/:id` | `AdminPhotoOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems, PhotoOrderRequests |
| **EP_371** | `POST` | `/api/admin/photo-orders/send-proposal/:id` | `AdminPhotoOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems, PhotoOrderRequests |
| **EP_372** | `POST` | `/api/admin/photo-orders/cancel/:id` | `AdminPhotoOrders.js` | Admin JWT | Admin Web | AdminUsers, Orders, OrderItems, PhotoOrderRequests |
| **EP_373** | `POST` | `/api/customer/enquiries` | `CustomerRequests.js` | Customer JWT | Customer App | CustomerEnquiries, CustomerProductRequests |
| **EP_374** | `GET` | `/api/customer/enquiries/my` | `CustomerRequests.js` | Customer JWT | Customer App | CustomerEnquiries, CustomerProductRequests |
| **EP_375** | `GET` | `/api/customer/enquiries/image/:id` | `CustomerRequests.js` | Customer JWT | Customer App | CustomerEnquiries, CustomerProductRequests |
| **EP_376** | `POST` | `/api/customer/product-requests` | `CustomerRequests.js` | Customer JWT | Customer App | Products, ProductVariants, CustomerEnquiries, CustomerProductRequests |
| **EP_377** | `GET` | `/api/customer/product-requests/my` | `CustomerRequests.js` | Customer JWT | Customer App | Products, ProductVariants, CustomerEnquiries, CustomerProductRequests |
| **EP_378** | `GET` | `/api/customer/product-requests/image/:id` | `CustomerRequests.js` | Customer JWT | Customer App | Products, ProductVariants, CustomerEnquiries, CustomerProductRequests |
| **EP_379** | `GET` | `/api/admin/customer-enquiries` | `AdminCustomerRequests.js` | Admin JWT | Admin Web | AdminUsers, CustomerEnquiries, CustomerProductRequests |
| **EP_380** | `PUT` | `/api/admin/customer-enquiries/:id/status` | `AdminCustomerRequests.js` | Admin JWT | Admin Web | AdminUsers, CustomerEnquiries, CustomerProductRequests |
| **EP_381** | `GET` | `/api/admin/customer-enquiries/image/:id` | `AdminCustomerRequests.js` | Admin JWT | Admin Web | AdminUsers, CustomerEnquiries, CustomerProductRequests |
| **EP_382** | `GET` | `/api/admin/product-requests` | `AdminCustomerRequests.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants, CustomerEnquiries, CustomerProductRequests |
| **EP_383** | `PUT` | `/api/admin/product-requests/:id/status` | `AdminCustomerRequests.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants, CustomerEnquiries, CustomerProductRequests |
| **EP_384** | `POST` | `/api/admin/product-requests/:id/notify` | `AdminCustomerRequests.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants, CustomerEnquiries, CustomerProductRequests |
| **EP_385** | `GET` | `/api/admin/product-requests/image/:id` | `AdminCustomerRequests.js` | Admin JWT | Admin Web | AdminUsers, Products, ProductVariants, CustomerEnquiries, CustomerProductRequests |
| **EP_386** | `GET` | `/health` | `Health.js` | None | Customer App, Admin Web | N/A |
| **EP_387** | `GET` | `/health/db` | `Health.js` | None | Customer App, Admin Web | N/A |
| **EP_388** | `GET` | `/api/health` | `Health.js` | None | Customer App, Admin Web | N/A |
| **EP_389** | `GET` | `/api/health/db` | `Health.js` | None | Customer App, Admin Web | N/A |
