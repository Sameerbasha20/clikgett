# 17 — Unused Endpoints Report (5 November 2026)

**Status: report only. Nothing has been changed. Waiting for approval before any endpoint is removed.**

## 1. How "unused" was decided

A backend route counts as **used** when any of these call it:

| Source | What was scanned |
|---|---|
| Current admin website | `Admin/src` (every URL in `Services.js` and components, plus the CSV export buttons, whose URL is built at runtime) |
| Current customer app | `Flutter/UserApp/lib` (all Dart string literals) |
| Current rider app | `Flutter/Deliveryboy/app/src/main/java` |
| Links the server hands out | `/api/...` strings built in controllers/services (e.g. invoice links); comments ignored |
| **Old mobile app versions** | Every Git revision of `Flutter/` in this repo (82 commits) and in the two pre-squash history bundles (`clikgett-old-history-2026-10-15.bundle`, 9 commits from 27 Jul 2026; `clikgett-pre-squash-2026-10-15.bundle`). These are the versions customers and riders may still have installed. |
| **Old admin builds** | Every Git revision of `Admin/src`, both bundles, and the admin site actually served by the live server (`deploy/live-server-backup-2026-10-29/web-static.tgz`) |
| Infrastructure | Render health check (`/health`), Docker health checks, Razorpay webhook, cron-triggered jobs, signed `/media` links. The live server's crontab calls no API. |

Every "unused" entry was then spot-checked by searching the client code for its distinctive path segment, to rule out URLs built in pieces.

**Limit:** there are no traffic logs. The live-server backup has no access logs, and Render logs weren't read. This report shows which endpoints **no version of any client code** calls, not measured traffic. With your approval I can read the live server's nginx access logs (read-only, over SSH) to confirm with real request counts before anything is removed.

## 2. Summary

| | Count |
|---|---|
| Route registrations in the backend | 610 |
| Distinct endpoints (aliases merged) | 403 |
| Used by the current admin, customer app, rider app or server links | **329** |
| Infrastructure / scheduler (keep) | 9 |
| **Never called by any client version** | **58** (25 dead code + 33 second spellings of a used endpoint) |
| Called only by old admin builds (the admin is replaced at the server switch) | 5 |
| Called only by old mobile app versions (still installed on phones) | 2 |
| Extra prefixes no client uses at all (whole duplicate mounts) | 5 prefixes, 130 registrations |

## 3. Proposed action per group (needs your approval)

| Group | What I'd do | Risk |
|---|---|---|
| **A. Unused duplicate prefixes** (section 4) | Remove the extra mounts in `server.js`: `/api/admin` → AdminUsers (keeps `/api/admin` for customer requests), `/api/admin/delivery`, `/api/membershipplans`, `/api/home-sections`, `/api/cashback-admin` | Low. No client version uses them. |
| **B1. Duplicate spellings** (33) | Remove the unused second path; the used path and handler stay | Low |
| **B2. Dead endpoints** (25) | Remove the route and, where nothing else uses it, the handler | Low to medium. Confirm with access logs first if you want certainty. |
| **C. Old-admin-only** (5) | Remove at or after the server switch, when the old admin site is replaced | Low after the switch |
| **D. Old-mobile-only** (2) | **Keep** until old rider app versions are retired (force-update the rider app, then remove) | Removing now could break riders on old app versions |
| **E. Infrastructure** (9) | Keep | — |
| **F. Old app calls the new backend doesn't have** (section 6) | No removal; decide whether to add small compatibility routes before the server switch | Without them, those old-app screens break after the switch |

Each removal would get a test (removed path returns 404, used path still works), and the full suite and probe would be re-run.

## 4. A. Duplicate prefixes no client uses

| Router | Prefix with no client | Routes under it | Used prefix (keep) |
|---|---|---|---|
| AdminUsers | `/api/admin` (2 routes appear only in old admin builds) | 56 | `/api/adminuser`, `/api/adminusers` (both used, for different pages) |
| AdminOrders | `/api/admin/delivery` | 39 | `/api/adminorders` |
| Membership | `/api/membershipplans` | 8 | `/api/membership` |
| AdminHomeSections | `/api/home-sections` | 24 | `/api/admin-home-sections` |
| CashbackAdmin | `/api/cashback-admin` (old admin builds only) | 3 | `/api/cashback` |

`/api/adminuser` vs `/api/adminusers`, `/api/csv` vs `/api/productcsv`, `/api/rewards` vs `/api/milestones` and `/health` vs `/api/health` are each used for different routes (or by monitors), so they stay. Merging them means changing clients too.

## 5. Endpoint lists

### B. No client has ever called these (58 endpoints: 33 duplicate spellings of a used endpoint, 25 with no other path)

| Method | Path(s) | Handler | Auth | Notes |
|---|---|---|---|---|
| `GET` | `/api/address/byaddressid/:AddressID` | `Address.getaddressbyaddressid` | user | **Dead: no other path** |
| `POST` | `/api/address/checkserviceability` | `Address.checkServiceability` | none | Duplicate of `POST /api/address/check-serviceability` |
| `GET` | `/api/home-sections/admin`<br>`/api/admin-home-sections/admin` | `AdminHomeSections.getAllSections` | admin | Duplicate of `GET /api/admin-home-sections/sections` |
| `POST` | `/api/home-sections/admin`<br>`/api/admin-home-sections/admin` | `AdminHomeSections.createSection` | admin | Duplicate of `POST /api/admin-home-sections/sections` |
| `GET` | `/api/home-sections/admin/:SectionID`<br>`/api/admin-home-sections/admin/:SectionID` | `AdminHomeSections.getSectionById` | admin | Duplicate of `GET /api/admin-home-sections/sections/:SectionID` |
| `PUT` | `/api/home-sections/admin/:SectionID`<br>`/api/admin-home-sections/admin/:SectionID` | `AdminHomeSections.updateSection` | admin | Duplicate of `PUT /api/admin-home-sections/sections/:SectionID` |
| `DELETE` | `/api/home-sections/admin/:SectionID`<br>`/api/admin-home-sections/admin/:SectionID` | `AdminHomeSections.deleteSection` | admin | Duplicate of `DELETE /api/admin-home-sections/sections/:SectionID` |
| `POST` | `/api/home-sections/admin/:SectionID/duplicate`<br>`/api/admin-home-sections/admin/:SectionID/duplicate` | `AdminHomeSections.duplicateSection` | admin | Duplicate of `POST /api/admin-home-sections/sections/:SectionID/duplicate` |
| `PATCH` | `/api/home-sections/admin/:SectionID/status`<br>`/api/admin-home-sections/admin/:SectionID/status` | `AdminHomeSections.updateStatus` | admin | Duplicate of `PATCH /api/admin-home-sections/sections/:SectionID/status` |
| `PUT` | `/api/home-sections/admin/:SectionID/status`<br>`/api/admin-home-sections/admin/:SectionID/status` | `AdminHomeSections.updateStatus` | admin | Duplicate of `PATCH /api/admin-home-sections/sections/:SectionID/status` |
| `PUT` | `/api/home-sections/admin/reorder`<br>`/api/admin-home-sections/admin/reorder` | `AdminHomeSections.reorderSections` | admin | Duplicate of `PUT /api/admin-home-sections/sections/reorder` |
| `POST` | `/api/home-sections/admin/reorder`<br>`/api/admin-home-sections/admin/reorder` | `AdminHomeSections.reorderSections` | admin | Duplicate of `PUT /api/admin-home-sections/sections/reorder` |
| `GET` | `/api/home-sections/category-options`<br>`/api/admin-home-sections/category-options` | `AdminHomeSections.getCategoryOptions` | admin | Duplicate of `GET /api/admin-home-sections/sections/category-options` |
| `GET` | `/api/home-sections/product-options`<br>`/api/admin-home-sections/product-options` | `AdminHomeSections.getProductOptions` | admin | Duplicate of `GET /api/admin-home-sections/sections/product-options` |
| `GET` | `/api/adminorders/currentorders/sort`<br>`/api/admin/delivery/currentorders/sort` | `AdminOrders.currentorderssort` | admin | **Dead: no other path** |
| `GET` | `/api/adminorders/currentorderssort`<br>`/api/admin/delivery/currentorderssort` | `AdminOrders.currentorderssort` | admin | **Dead: no other path** |
| `GET` | `/api/adminorders/orderdetail/timeline/:OrderID`<br>`/api/admin/delivery/orderdetail/timeline/:OrderID` | `AdminOrders.ordertimeline` | admin | Duplicate of `GET /api/adminorders/ordertimeline/:OrderID` |
| `DELETE` | `/api/adminorders/orders/:OrderID/items/:OrderItemID`<br>`/api/admin/delivery/orders/:OrderID/items/:OrderItemID` | `AdminOrders.<anonymous>` | admin | Duplicate of `GET /api/adminorders/invoice/:OrderID` |
| `GET` | `/api/adminorders/pastorders/filter`<br>`/api/admin/delivery/pastorders/filter` | `AdminOrders.pastordersfilter` | admin | **Dead: no other path** |
| `GET` | `/api/adminorders/pastorders/mobilefilter`<br>`/api/admin/delivery/pastorders/mobilefilter` | `AdminOrders.pastordersmobilefilter` | admin | **Dead: no other path** |
| `GET` | `/api/adminorders/pastorders/orderidfilter`<br>`/api/admin/delivery/pastorders/orderidfilter` | `AdminOrders.pastordersorderidfilter` | admin | **Dead: no other path** |
| `GET` | `/api/adminorders/pastorders/sort`<br>`/api/admin/delivery/pastorders/sort` | `AdminOrders.pastorderssort` | admin | **Dead: no other path** |
| `GET` | `/api/adminorders/pastorders/usernamefilter`<br>`/api/admin/delivery/pastorders/usernamefilter` | `AdminOrders.pastordersusernamefilter` | admin | **Dead: no other path** |
| `GET` | `/api/adminorders/pastordersfilter`<br>`/api/admin/delivery/pastordersfilter` | `AdminOrders.pastordersfilter` | admin | **Dead: no other path** |
| `GET` | `/api/adminorders/pastordersmobilefilter`<br>`/api/admin/delivery/pastordersmobilefilter` | `AdminOrders.pastordersmobilefilter` | admin | **Dead: no other path** |
| `GET` | `/api/adminorders/pastordersorderidfilter`<br>`/api/admin/delivery/pastordersorderidfilter` | `AdminOrders.pastordersorderidfilter` | admin | **Dead: no other path** |
| `GET` | `/api/adminorders/pastorderssort`<br>`/api/admin/delivery/pastorderssort` | `AdminOrders.pastorderssort` | admin | **Dead: no other path** |
| `GET` | `/api/adminorders/pastordersusernamefilter`<br>`/api/admin/delivery/pastordersusernamefilter` | `AdminOrders.pastordersusernamefilter` | admin | **Dead: no other path** |
| `GET` | `/api/adminorders/scheduledorders`<br>`/api/admin/delivery/scheduledorders` | `AdminOrders.scheduledorders` | admin | **Dead: no other path** |
| `GET` | `/api/adminproducts/buy-more-config` | `AdminProducts.buyMoreConfig` | admin | **Dead: no other path** |
| `PUT` | `/api/adminproducts/buy-more-config/:ConfigID` | `AdminProducts.updateBuyMoreConfig` | admin | **Dead: no other path** |
| `DELETE` | `/api/adminproducts/buy-more-config/:ConfigID` | `AdminProducts.deleteBuyMoreConfig` | admin | **Dead: no other path** |
| `GET` | `/api/adminuser/adminlist`<br>`/api/adminusers/adminlist`<br>`/api/admin/adminlist` | `AdminUsers.adminuserslist` | admin | Duplicate of `GET /api/adminusers/list` |
| `GET` | `/api/adminuser/feedbackdetail/:FeedbackID`<br>`/api/adminusers/feedbackdetail/:FeedbackID`<br>`/api/admin/feedbackdetail/:FeedbackID` | `AdminUsers.Feedbackdetail` | admin | Duplicate of `GET /api/adminusers/feedback/detail/:FeedbackID` |
| `GET` | `/api/adminuser/feedbacklist`<br>`/api/adminuser/feedbacklist`<br>`/api/adminusers/feedbacklist`<br>`/api/adminusers/feedbacklist`<br>`/api/admin/feedbacklist`<br>`/api/admin/feedbacklist` | `AdminUsers.Feedbacklist` | admin | Duplicate of `GET /api/adminusers/feedback/list` |
| `PUT` | `/api/adminuser/updateuser/:UserID`<br>`/api/adminusers/updateuser/:UserID`<br>`/api/admin/updateuser/:UserID` | `AdminUsers.updateuser` | admin | Duplicate of `PUT /api/adminuser/user/update/:UserID` |
| `PUT` | `/api/buymore/tiers/status/:ID` | `BuyMore.toggleStatus` | admin | Duplicate of `PATCH /api/buymore/tiers/:ID/status` |
| `PUT` | `/api/cartoffers/offers/status/:OfferID` | `CartOffers.toggleStatus` | admin | **Dead: no other path** |
| `GET` | `/api/carts/abandoned` | `Carts.<anonymous>` | admin | Duplicate of `GET /api/carts/abandoned/trigger-notifications` |
| `GET` | `/api/categories/subcategorydetail/:SubCategoryID` | `Categories.SubcategoryDetail` | optionalUser | **Dead: no other path** |
| `GET` | `/api/categories/websubcategories` | `Categories.categories_subcategories` | none | Duplicate of `GET /api/categories/subcategories_by_category/:CategoryID` |
| `GET` | `/api/customer/enquiries/image/:id` | `CustomerRequests.getSecureEnquiryImage` | user | **Dead: no other path** |
| `GET` | `/api/customer/product-requests/image/:id` | `CustomerRequests.getSecureProductRequestImage` | user | **Dead: no other path** |
| `GET` | `/api/deliveryboy/ordersbyroute` | `DeliveryBoy.ordersbyroute` | deliveryboy | **Dead: no other path** |
| `PUT` | `/api/deliveryboy/update/:AdminID` | `DeliveryBoy.updatedeliveryboy` | deliveryboy | **Dead: no other path** |
| `DELETE` | `/api/membership/product/:productId/:planId`<br>`/api/membershipplans/product/:productId/:planId` | `Membership.deleteProductPricing` | admin | Duplicate of `POST /api/membership/product/delete` |
| `POST` | `/api/membership/save-product-pricing`<br>`/api/membershipplans/save-product-pricing` | `Membership.saveProductPricing` | admin | Duplicate of `POST /api/membership/product/save` |
| `GET` | `/api/orders/orderstatus/:OrderID` | `Orders.getOrderStatus` | user | **Dead: no other path** |
| `POST` | `/api/restrictions/restrictions/save-product-restrictions` | `ProductRestrictions.saveProductRestrictions` | admin | Duplicate of `POST /api/restrictions/save-product-restrictions` |
| `GET` | `/api/products/weblist` | `Products.productsbyCategory_subcategory` | optionalUser | Duplicate of `GET /api/products/list` |
| `GET` | `/api/product-unlocks/admin` | `ProductUnlocks.getUnlocks` | admin | Duplicate of `GET /api/product-unlocks/unlocks` |
| `POST` | `/api/product-unlocks/admin` | `ProductUnlocks.createUnlock` | admin | Duplicate of `POST /api/product-unlocks/unlocks` |
| `GET` | `/api/product-unlocks/list` | `ProductUnlocks.getUnlocks` | none | Duplicate of `GET /api/product-unlocks/unlocks` |
| `GET` | `/api/rewards/milestones`<br>`/api/milestones/milestones` | `Rewards.getMilestoneConfig` | admin | Duplicate of `GET /api/milestones/config` |
| `GET` | `/api/rewards/myRewards`<br>`/api/milestones/myRewards` | `Rewards.getMyMilestones` | user | Duplicate of `GET /api/rewards/myMilestones` |
| `GET` | `/api/users/feedback/order-status/:orderId` | `Users.checkFeedbackEligibility` | user | Duplicate of `GET /api/users/feedback/eligibility/:orderId` |
| `GET` | `/api/users/homepagesectionproducts` | `Users.HomepageSection_Products` | optionalUser | **Dead: no other path** |
| `GET` | `/api/users/webhomepage` | `Users.homepage` | optionalUser | Duplicate of `GET /api/users/homepage` |

### C. Only old admin builds called these (5)

| Method | Path(s) | Handler | Auth | Notes |
|---|---|---|---|---|
| `GET` | `/api/adminproducts/bysubcategory` | `AdminProducts.productsbysubcategory_admin` | admin | **Dead: no other path** |
| `GET` | `/api/adminuser/getactivedeliveryboys`<br>`/api/adminusers/getactivedeliveryboys`<br>`/api/admin/getactivedeliveryboys` | `AdminUsers.getactivedeliveryboys` | admin | **Dead: no other path** |
| `GET` | `/api/search-analytics/admin` | `SearchAnalytics.getAnalytics` | admin | Duplicate of `GET /api/search-analytics/keywords` |
| `PUT` | `/api/subcategories/admin/reorder` | `SubCategories.reordersubcategories` | admin | Duplicate of `PUT /api/subcategories/reorder` |
| `POST` | `/api/subcategories/admin/reorder` | `SubCategories.reordersubcategories` | admin | Duplicate of `PUT /api/subcategories/reorder` |

### D. Only old mobile app versions called these (2)

| Method | Path(s) | Handler | Auth | Notes |
|---|---|---|---|---|
| `GET` | `/api/deliveryboy/orderstatus` | `DeliveryBoy.orderstatus` | deliveryboy | Keep until old rider app versions are retired |
| `POST` | `/api/deliveryboy/verifyotp_order` | `DeliveryBoy.Orders_VerifyOTP` | deliveryboy | Keep until old rider app versions are retired |

### E. Infrastructure and scheduler endpoints: keep (9)

| Method | Path(s) | Handler | Auth | Notes |
|---|---|---|---|---|
| `GET` | `/health/db`<br>`/api/health/db` | `Health.<anonymous>` | none | Duplicate of `GET /api/health` |
| `GET` | `/health/redis`<br>`/api/health/redis` | `Health.<anonymous>` | none | Duplicate of `GET /api/health` |
| `POST` | `/health/redis/test`<br>`/api/health/redis/test` | `Health.<anonymous>` | none | Duplicate of `GET /api/health` |
| `GET` | `/api/promocodes/winback/trigger` | `PromoCodes.triggerWinbackCoupons` | cronOrAdmin | Keep: used by Razorpay, schedulers, monitors or signed media links |
| `POST` | `/api/promocodes/winback/trigger` | `PromoCodes.triggerWinbackCoupons` | cronOrAdmin | Keep: used by Razorpay, schedulers, monitors or signed media links |
| `POST` | `/api/payments/razorpay-webhook` | `server.inline` | see server.js | Keep: used by Razorpay, schedulers, monitors or signed media links |
| `GET` | `/media/*` | `server.inline` | see server.js | Keep: used by Razorpay, schedulers, monitors or signed media links |
| `PUT` | `/media/*` | `server.inline` | see server.js | Keep: used by Razorpay, schedulers, monitors or signed media links |
| `GET` | `/api/admin-wallet-check` | `WalletCheck.<anonymous>` | cronOrAdmin | Keep: used by Razorpay, schedulers, monitors or signed media links |

## 6. F. URLs old mobile app versions call that the new backend does not have

Found by scanning every old Flutter version for API URLs that match no route in the new backend. Image file names that the scan picked up are excluded.

| Old app call | Live (old) backend | New backend | Effect after the server switch for people on old app versions |
|---|---|---|---|
| `GET /api/products/allkits`, `GET /api/products/kitdetail/:KitID` | present | **missing** | Kits/combos screen shows an error. The `Kits` table is empty, so it shows nothing today either. |
| `DELETE /api/carts/deletecartitem/:ProductID/:VariantID` (2 parts) | — | only the 3-part form `/:ProductID/:VariantID/:Type` | Older app builds that use the 2-part form can't remove a cart line. Newer builds send 3 parts. |
| `GET routes/deliveryboy/detail/{RouteID}` (old rider client) | — | missing | Old route-detail screen; the `Routes` table is empty. |
| `users/add_wallet_money` | present | present | No problem (the `orders/add_wallet_money` hit was a commented-out line). |

**Recommendation:** add a 2-part `deletecartitem` alias and empty-list `allkits`/`kitdetail` responses before the server switch, or force-update the customer app at the switch.

## 7. What happens on approval

1. **Optional but recommended:** read the live server's nginx access logs (read-only) and count real hits per endpoint for the last weeks, to confirm groups A-C.
2. Remove the approved groups: routes, unused handlers, `server.js` mounts. Add 404 checks for each removed path and keep the used paths covered.
3. Re-run `npm test` (31 suites), the endpoint probe and the admin browser sweep, then report.

Machine-readable list: `unused_endpoints.json` (every endpoint, its group, and which sources reference it).
