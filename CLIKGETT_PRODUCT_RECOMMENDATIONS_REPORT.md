# ClikGett — Product-Based Recommendations Report

## Executive Summary
This document provides a comprehensive verification and implementation report for the **Similar Products Recommendation Engine** on the ClikGett mobile customer application (`Flutter/UserApp/`). Inspired by top-tier quick-commerce experiences (such as Blinkit), this feature delivers data-driven, real-time product recommendations directly beneath the primary product details on the product page (`ItemDescription.dart`).

The implementation is **100% data-driven** from the active Dockerized database and backend APIs, fully reactive with GetX cart state management, and incorporates authoritative prioritization, stock tracking, and graceful empty/loading states.

---

## 1. Files Changed & Added

### Backend (`Backend/server/`)
1. **`controllers/CommonController.js`**
   - Enhanced `CommonController.getproducts(query, params)` to support parameterized queries, preventing SQL injection and avoiding double S3/CloudFront URL prefixes when resolving product image URLs.
2. **`controllers/Products.js`**
   - Implemented `similarProducts(req, res)` endpoint controller with 2-tier relevance prioritization (`relevancePriority: 1` for same subcategory, `relevancePriority: 2` for same category), strictly excluding the currently viewed product (`ProductID != ?`), filtering active records (`p.Status = 1`, `pv.status = 1`), and applying safe limits (`LIMIT 12`).
3. **`routes/Products.js`**
   - Registered `GET /similar/:ProductID` route with `util.authenticate.optionalUserAuthenticate` middleware.

### Database (`docker/mysql/`)
4. **`seed_recommendations.sql`** & **`init.sql`**
   - Seeded complementary realistic quick-commerce catalog items (IDs 83–91) across dairy, vegetables, and pantry goods with verified pricing, variants, and stock counts.

### Flutter Mobile App (`Flutter/UserApp/`)
5. **`lib/old/Services/Products/product_services.dart`**
   - Added `ProductServices.getSimilarProducts(int productId)` HTTP client method targeting `/products/similar/:ProductID`.
6. **`lib/new/Controllers/category_controller.dart`**
   - Added reactive observables `RxList<Products> similarProducts` and `RxBool isSimilarProductsLoading`.
   - Added `getSimilarProducts({required int productId})` async action with error handling.
   - Updated `clearValues()` to reset recommendation state on screen transitions to prevent stale data.
7. **`lib/new/NewScreens/Homepage/widgets/similar_products_widget.dart`** *(New Widget)*
   - Built modern Blinkit-inspired horizontal carousel widget (`SimilarProductsWidget` and `_SimilarProductCard`).
   - Features:
     - Header: "Similar products" with subtle item count badge.
     - Horizontal list with smooth bouncing physics (`ListView.separated`).
     - Product image with `BoxFit.contain` inside rounded container (`CustomNetworkImage`).
     - Discount badge on top-left of image (`% OFF`).
     - "Out of Stock" badge when `availableQty <= 0`.
     - 2-line truncated product name with strict height bounding to prevent layout jumping.
     - Pack size / unit display with variant selector trigger for multi-variant items.
     - Current selling price and struck-through MRP.
     - Reactive cart integration: "ADD" button when qty == 0, interactive stepper `[-] qty [+]` when qty > 0.
     - Tap on card navigates to `ItemDescription` with state refresh on navigation pop (`.then(...)`).
     - Lightweight skeleton loader for asynchronous loading.
     - Graceful empty state (`SizedBox.shrink()` when no recommendations exist).
8. **`lib/new/NewScreens/Homepage/ItemDescription.dart`**
   - Integrated `SimilarProductsWidget(parentProductId: widget.id)` directly below `descrptionWidget`.
   - Dispatched `categoryController.getSimilarProducts(productId: widget.id)` in `initState()`.
   - Added bottom padding spacer (`SizedBox(height: 100)`) to ensure the recommendation cards and action buttons are never obscured by the floating cart viewer (`bottomQuantityViewer`, height: 80).

### Test Suite (`Flutter/UserApp/test/`)
9. **`test/product_recommendations_test.dart`** *(New Test Suite)*
   - Created 6 unit tests validating model parsing, priority ordering, exclusion of active product, discount math, stock checking, and cart quantity matching.

---

## 2. Recommendation Algorithm & Fallback Behavior

### Algorithm
Recommendations are dynamically retrieved and sorted using a parameterized query in MySQL:
```sql
SELECT 
  p.*, 
  CASE 
    WHEN p.SubCategoryID = ? THEN 1 
    WHEN p.CategoryID = ? THEN 2 
    ELSE 3 
  END AS relevancePriority
FROM Products p
WHERE p.ProductID != ? 
  AND p.Status = 1
  AND (p.SubCategoryID = ? OR p.CategoryID = ?)
ORDER BY relevancePriority ASC, p.ProductID DESC
LIMIT 12;
```

### Priority Hierarchy:
1. **Tier 1 (Priority 1): Products in the Same Subcategory**
   - *Example:* When viewing "Amul Gold Full Cream Milk 500ml" (SubCategoryID: 1 - Milk), the API first yields "Organic Buffalo Milk 1L", "Toned Fresh Milk 1L", and "Cow Fresh Milk 500ml".
2. **Tier 2 (Priority 2): Products in the Same Category (Fallback)**
   - *Example:* When subcategory items are exhausted or complementary items exist in the broader category (CategoryID: 1 - Dairy & Breakfast), the API yields "Table Butter 100g", "Pure Cow Ghee 500ml", and "Fresh Malai Paneer 200g".
3. **Exclusions**:
   - The currently displayed product is strictly excluded (`p.ProductID != ?`).
   - Inactive products (`Status = 0`) and inactive variants (`status = 0`) are excluded.
   - Products with duplicate IDs are aggregated via `CommonController.getproducts`.

### Fallback Behavior:
- **No Same-Subcategory Items:** Automatically falls back to items within the same category.
- **No Similar Products in Database:** If no related active products exist (e.g. standalone specialty item like product 91 "Natural Wild Forest Honey"), the API returns `{"Status": 1, "Products": []}`.
- **Flutter Empty State:** When the returned list is empty, `SimilarProductsWidget` renders `SizedBox.shrink()`, cleanly collapsing the section without empty placeholders or visual glitches.

---

## 3. API Specification

- **Endpoint:** `GET /api/products/similar/:ProductID`
- **Authentication:** Optional (`optionalUserAuthenticate`)
- **Direct Port:** `http://localhost:5001/api/products/similar/:ProductID`
- **Reverse Proxy Port:** `http://localhost:3001/api/products/similar/:ProductID`

### Sample Request:
```http
GET /api/products/similar/82 HTTP/1.1
Host: localhost:5001
```

### Sample Response:
```json
{
  "Status": 1,
  "Products": [
    {
      "ProductID": 85,
      "ProductName": "Organic Buffalo Milk 1L",
      "Description": "Rich and creamy pure buffalo milk pouch.",
      "CategoryID": 1,
      "SubCategoryID": 1,
      "Status": 1,
      "Type": 1,
      "ImageUrl": "https://d3c9kvg5gaqz48.cloudfront.net/Products/buffalo_milk_1l.png",
      "ProductImages": [
        "https://d3c9kvg5gaqz48.cloudfront.net/Products/buffalo_milk_1l.png"
      ],
      "relevancePriority": 1,
      "ProductVariants": [
        {
          "VariantID": 851,
          "ProductID": 85,
          "metrictype": "L",
          "metricvalue": "1",
          "Price": 78,
          "OfferPrice": 72,
          "AvailableQty": 20,
          "maxQty": 10,
          "status": 1
        }
      ]
    },
    {
      "ProductID": 88,
      "ProductName": "Salted Table Butter 100g",
      "CategoryID": 1,
      "SubCategoryID": 2,
      "relevancePriority": 2,
      "ProductVariants": [
        {
          "VariantID": 881,
          "ProductID": 88,
          "metrictype": "g",
          "metricvalue": "100",
          "Price": 55,
          "OfferPrice": 50,
          "AvailableQty": 50,
          "maxQty": 10,
          "status": 1
        }
      ]
    }
  ]
}
```

---

## 4. Tests Executed & Results

| # | Test Category | Scenario / Command | Expected Result | Actual Result | Status |
|---|---------------|--------------------|-----------------|---------------|:------:|
| 1 | **API Verification** | `GET /api/products/similar/82` (Product with many related items) | Returns 6 items, priority 1 (milk) before priority 2 (butter, ghee, paneer), excluding ID 82 | HTTP 200, 6 items sorted by `relevancePriority` ASC, ID 82 excluded | **PASS** |
| 2 | **API Verification** | `GET /api/products/similar/89` (Onion - few related items) | Returns potatoes (SubCategoryID 3) | HTTP 200, 1 item (`Farm Fresh Potatoes 1kg`, Priority 1) | **PASS** |
| 3 | **API Verification** | `GET /api/products/similar/91` (Honey - zero related items) | Returns empty products array `[]` | HTTP 200, `{"Status":1,"Products":[]}` | **PASS** |
| 4 | **API Verification** | `GET /api/products/similar/invalid_id` (Invalid input) | Returns HTTP 400 Bad Request | HTTP 400, `{"Status":0,"Message":"Invalid ProductID"}` | **PASS** |
| 5 | **API Verification** | `GET http://localhost:3001/api/products/similar/82` (Nginx Proxy) | Proxies cleanly from port 3001 to Node backend | HTTP 200, identical JSON payload | **PASS** |
| 6 | **Unit Tests** | `flutter test test/product_recommendations_test.dart` | 6 unit tests passing (JSON parsing, exclusion, discounts, stock, cart) | 6/6 tests passed in 0s | **PASS** |
| 7 | **Regression Tests** | `flutter test test/low_stock_test.dart test/fruit_timer_test.dart` | 25 regression tests passing | 25/25 tests passed with 0 failures | **PASS** |
| 8 | **Static Analysis** | `flutter analyze` on modified files | Zero compilation errors or fatal warnings | 0 errors | **PASS** |
| 9 | **Release Build** | `gradlew.bat assembleRelease --offline` | Produces clean `app-release.apk` | **BUILD SUCCESSFUL in 6m 48s** (Binary copied to `C:\Users\DELL\Desktop\clikgett\NEW_APKS\app-release.apk`) | **PASS** |

---

## 5. UI Architecture & Product Card Interactions

1. **Tap Image or Name:**
   - Navigates immediately to that item's `ItemDescription(id: product.productId, title: product.productName, percent: discountPercent)`.
   - On pop (`.then(...)`), parent state refreshes asynchronously so no stale recommendations or cart states remain.
2. **"ADD" Button Interaction:**
   - Single-variant products: Directly calls `CartController.updateQuantity(..., quantity: 1)`.
   - Multi-variant products: Seamlessly opens `showPurchaseOptionsSheet(...)` with Buy 1 / Buy 2 promotions and variant selector.
3. **Quantity Stepper Interaction:**
   - `[-]` decreases quantity; automatically removes from cart when reaching 0.
   - `[+]` increases quantity up to `availableQty` and `maxQty`, triggering a custom toast if the customer exceeds available stock.
4. **Bottom Bar Spacing & SafeArea:**
   - The scroll container includes `const SizedBox(height: 100)` at the bottom, guaranteeing that recommendation cards and "ADD" buttons remain fully visible and clickable even when the sticky `bottomQuantityViewer` is displayed.

---

## 6. Remaining Issues / Next Steps
- **None:** The recommendation engine, backend routing, database queries, GetX controller integration, UI widgets, tests, and Android release compilation are complete, verified, and operational.
