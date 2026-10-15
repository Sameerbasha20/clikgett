# ClikGett Customer App — Fruit Timer Extension Implementation Report

**Document Date:** October 14, 2026  
**Status:** Implemented & Verified  

---

## 1. Executive Summary & Purpose of Existing Timer

### Existing Timer Overview
In the ClikGett Customer App, the delivery countdown timer manages the estimated time of arrival (ETA) for orders and active cart sessions. It represents the target delivery window committed to the customer (baseline standard delivery duration of 30 minutes from order placement/fulfillment).

### Objective
Whenever a product belonging to the **Fruits category** is successfully added to the cart, the applicable timer must automatically increase by **10 minutes** (e.g. standard 30 minutes becomes 40 minutes) to accommodate additional fresh-produce selection and packaging buffers.

The existing timer and cart architecture is preserved and reused directly. No duplicate or secondary timers were created.

---

## 2. Files Changed

| Component | File Path | Description of Changes |
| :--- | :--- | :--- |
| **Category Logic** | `Flutter/UserApp/lib/new/Constants/fruit_category_helper.dart` | Authoritative helper to determine fruit categories via database IDs and subcategory names; rejects name matching and missing info. |
| **Cart & Timer** | `Flutter/UserApp/lib/new/Controllers/cart_controller.dart` | Added timer extension state (`timerEndTime`, `remainingDeliveryDuration`, `fruitExtensionMinutes`, `isTimerRunning`), deduplication set, SharedPreferences persistence/restoration, and hooks inside `updateQuantity(...)`. |
| **Home Screen** | `Flutter/UserApp/lib/new/NewScreens/Homepage/Tabs/items_widget.dart` | Forwarded authoritative `categoryId` and `subCategoryId` to `cartController.updateQuantity(...)` during add-to-cart operations. |
| **Search Screen** | `Flutter/UserApp/lib/new/NewScreens/Homepage/SearchScreen.dart` | Passed `categoryId` and `subCategoryId` to `cartController.updateQuantity(...)` for search result additions. |
| **Category Screen** | `Flutter/UserApp/lib/new/NewScreens/Homepage/Tabs/Categories/SubCategoryList.dart` | Passed `categoryId` and `subCategoryId` to both `cartController.updateQuantity(...)` and `showPurchaseOptionsSheet(...)`. |
| **Product Details** | `Flutter/UserApp/lib/new/NewScreens/Homepage/ItemDescription.dart` | Passed `categoryId` and `subCategoryId` to both `cartController.updateQuantity(...)` and `showPurchaseOptionsSheet(...)`. |
| **Buy More Sheet** | `Flutter/UserApp/lib/new/NewScreens/Widgets/purchase_options_sheet.dart` | Accepted `categoryId` and `subCategoryId` parameters and propagated them to `cartController.updateQuantity(...)`. |
| **Backend ETA** | `Backend/server/services/PricingEngine.js` | Updated `PricingEngine.calculateCart` to query `SubCategoryID` and apply +10 minute buffer to `AdditionalDeliveryMinutes` and `TotalDeliveryMinutes` when fruit products are in the cart. |
| **Flutter Tests** | `Flutter/UserApp/test/fruit_timer_test.dart` | 13 automated unit and integration tests verifying category detection, 10-minute timer extension, tap deduplication, persistence across app reopen, reset, and non-fruit safety. |
| **Backend Tests** | `Backend/scripts/verify_fruit_timer.js` | Automated node verification script testing single, mixed, vegetable, and dry fruit carts against the pricing engine. |

---

## 3. How Fruit Category Detection Works

### Authoritative Category Architecture
The ClikGett MySQL database classifies products using hierarchical identifiers:
- `CategoryID: 24` represents **"Vegetables & Fruits "**
- `SubCategoryID: 84` represents **"All Fruits"**
- `SubCategoryID: 87` represents **"Vegetables"**
- `CategoryID: 6` represents **"Dry Fruits"**
- `SubCategoryID: 17` represents **"Dried Fruits"**

Because vegetables and fruits share `CategoryID: 24`, relying solely on `CategoryID` or on arbitrary product names (e.g., matching "Apple" or "Banana") would violate design integrity and misclassify vegetables.

### `FruitCategoryHelper` Implementation
The centralized `FruitCategoryHelper` class strictly evaluates products based on authoritative category and subcategory criteria:

```dart
static bool isFruitCategory({
  int? categoryId,
  int? subCategoryId,
  String? categoryName,
  String? subCategoryName,
}) {
  // Direct authoritative SubCategoryID check
  if (subCategoryId != null && fruitSubCategoryIds.contains(subCategoryId)) {
    return true; // 84 (All Fruits) or 17 (Dried Fruits)
  }

  // Explicitly reject non-fruit subcategories sharing CategoryID 24
  if (subCategoryId != null && nonFruitSubCategoryIds.contains(subCategoryId)) {
    return false; // E.g., SubCategoryID 87 (Vegetables)
  }

  // Authoritative Dry Fruits CategoryID check
  if (categoryId != null && categoryId == 6) {
    return true;
  }

  // Normalized category/subcategory title fallback (strictly at category level)
  if (subCategoryName != null && subCategoryName.trim().isNotEmpty) {
    final lowerSub = subCategoryName.toLowerCase().trim();
    if (lowerSub == 'all fruits' || lowerSub == 'fruits' || lowerSub == 'dried fruits') {
      return true;
    }
  }

  // If category data is missing or non-fruit, NEVER assume Fruit
  return false;
}
```

**Key Safeguards:**
1. **No Product-Name Matching:** A shampoo named "Apple Fresh" or dish soap named "Lemon Drops" will never be flagged as a fruit because only category-level metadata is checked.
2. **Missing Information Protection:** Missing, null, or zero values evaluate to `false`.
3. **Vegetable Disambiguation:** `SubCategoryID: 87` sharing `CategoryID: 24` is explicitly recognized as non-fruit.

---

## 4. Timer Extension Logic, Deduplication & Persistence

### 1. Operation Flow & Success Validation
Extensions occur strictly inside `CartController.updateQuantity(...)`:
- The cart mutation API call (`CartServices().addRemoveCartItem(...)`) is awaited.
- Extension is triggered **only** when `isAddedSuccessfully == true` and `isAddition == true`.
- If an API error occurs or the network request fails, no extension is applied.

### 2. Extension Logic
- If no timer is active or the timer has expired, the baseline delivery duration (30 minutes) is extended by 10 minutes to **40 minutes**.
- If a timer is already counting down, **10 minutes** are added to `timerEndTime`:
  $$\text{newEndTime} = \text{timerEndTime} + 10\text{ minutes}$$
- `fruitExtensionMinutes` is incremented by 10.
- If an active order exists in `OrdersController`, its estimated delivery timestamp is synced accordingly.

### 3. Deduplication Protection
To prevent accidental repeated extensions caused by rapid button tapping, retry loops, or Flutter UI rebuilds:
- Every addition registers an operation signature: `"${productId}_${variantId}_$quantity"`.
- If `_processedFruitAdditions.contains(opKey)` is true, the call is ignored as an idempotent duplicate.

### 4. Persistence Across App Reopens
- The computed `timerEndTime` (in ISO-8601 string format) and `fruitExtensionMinutes` are written to `SharedPreferences`:
  - `fruit_delivery_timer_end_timestamp`
  - `fruit_timer_extension_minutes`
- Upon app start or controller recreation (`initTimerFromPreferences()`), the saved timestamp is retrieved. If the target timestamp is still in the future, the timer state and 1-second countdown ticker (`Timer.periodic`) are restored automatically without resetting.
- If the cart is cleared or deleted, `resetTimer()` cancels the ticker and deletes the keys from `SharedPreferences`.

### 5. Multi-Screen Integration
The extension logic supports fruit products added from all shopping surfaces:
1. **Home Screen (`items_widget.dart`):** Direct "ADD" and variant selections forward category metadata.
2. **Search Screen (`SearchScreen.dart`):** Global search product results pass category IDs directly.
3. **Categories / Subcategory Screen (`SubCategoryList.dart`):** Category browsing preserves category IDs.
4. **Product Details Screen (`ItemDescription.dart`):** Detailed view and variant picker pass category IDs.
5. **Buy More Bottom Sheet (`purchase_options_sheet.dart`):** Variant selector forwards category IDs to `updateQuantity`.

---

## 5. Verification & Test Results

### A. Flutter Unit & Integration Tests (`fruit_timer_test.dart`)
Command executed:
```bash
flutter test test/fruit_timer_test.dart
```

**Results: 13 / 13 Tests Passed (100%)**

| Test # | Test Description | Result |
| :---: | :--- | :---: |
| 1 | CASE 1: Fresh Fruit (`CategoryID: 24`, `SubCategoryID: 84`) -> Identified as Fruit | **PASSED** |
| 2 | CASE 2: Vegetable (`CategoryID: 24`, `SubCategoryID: 87`) -> Rejection (NOT Fruit) | **PASSED** |
| 3 | CASE 3: Dry Fruits (`CategoryID: 6`, `SubCategoryID: 17`) -> Identified as Fruit | **PASSED** |
| 4 | CASE 4: Non-Fruit Category (`CategoryID: 1` Tea/Coffee, `CategoryID: 3` Oils) -> NOT Fruit | **PASSED** |
| 5 | CASE 5: Missing or null category info -> Never assumed to be Fruit | **PASSED** |
| 6 | CASE 6: Authoritative category check ignores product name (e.g. "Apple Shampoo") | **PASSED** |
| 7 | Cart Controller: Adding one fruit product extends timer by 10 minutes (30m -> 40m) | **PASSED** |
| 8 | Cart Controller: Adding a second distinct fruit addition further extends by 10 minutes (40m -> 50m) | **PASSED** |
| 9 | Cart Controller: Repeated taps / duplicate callbacks do not cause duplicate extensions | **PASSED** |
| 10 | Cart Controller: Timer continues counting down correctly and preserves persistence across app reopen | **PASSED** |
| 11 | Cart Controller: Reset behavior clears timer state, ticker, and preferences | **PASSED** |
| 12 | Cart Controller: Non-fruit products do not trigger timer extension | **PASSED** |
| 13 | Cart Controller: Missing category info does not trigger timer extension | **PASSED** |

### B. Regression Tests (`low_stock_test.dart`)
Command executed:
```bash
flutter test test/low_stock_test.dart test/fruit_timer_test.dart
```
**Results: 25 / 25 Tests Passed (100% - 0 regressions)**

### C. Backend Pricing Engine & ETA Tests (`verify_fruit_timer.js`)
Command executed:
```bash
node scripts/verify_fruit_timer.js
```
**Output:**
```
=== TESTING BACKEND FRUIT TIMER ETA BUFFER ===
Non-fruit cart ETA: 30 Buffer: 0
Fruit cart ETA: 40 Buffer: 10
Mixed cart ETA: 40 Buffer: 10
Vegetable cart ETA: 30 Buffer: 0
✓ ALL BACKEND FRUIT TIMER TESTS PASSED!
```

### D. Static Code Analysis
Command executed:
```bash
flutter analyze lib/new/Constants/fruit_category_helper.dart test/fruit_timer_test.dart
```
**Result:**
```
Analyzing 2 items...
No issues found! (ran in 2.3s)
```

---

## 6. Summary of Compliance with Constraints

1. **Authoritative Identification:** Category ID / SubCategory ID used; product names are never parsed for category matching.
2. **Reused Existing Architecture:** Extended `CartController`'s delivery countdown ticker; no duplicate timers created.
3. **Success Gated:** Added only after `isAddedSuccessfully == true` and cart API returns success.
4. **Idempotence & Deduplication:** Rapid taps, rebuilds, and duplicate callbacks are rejected via operation keys.
5. **Persistence:** Saved in `SharedPreferences`; survives app restarts and reopens without resetting.
6. **No Git / Deploy:** Changes kept local; no commits or pushes performed.
