# ClikGett Physical Device Testing Guide

**Date:** 2026-10-03  
**Target Environment:** Physical Android Devices (Android 5.0 to Android 15)  
**Deliverable:** Physical Device Testing Guide (`APK_DEVICE_TEST_REPORT.md`)

---

## 1. Prerequisites & Phone Preparation

To test both mobile applications on a real, physical Android device, follow these initial steps:

### Step 1: Enable Developer Options
1. On your Android phone, open **Settings**.
2. Scroll to the bottom and select **About phone** (or **About device**).
3. Find **Build number** (on MIUI/HyperOS: *OS Version*; on OxygenOS/ColorOS: *Version* > *Build number*).
4. Tap **Build number** rapidly **7 times** until you see the toast message: `"You are now a developer!"`.

### Step 2: Enable USB Debugging
1. Return to the main **Settings** menu.
2. Select **System** > **Developer options** (or **Additional settings** > **Developer options**).
3. Toggle ON **Developer options**.
4. Scroll down and enable **USB debugging**.
5. Connect your phone to your computer with a USB data cable.
6. When prompted on your phone display: `"Allow USB debugging?"`, check **"Always allow from this computer"** and tap **Allow**.

---

## 2. APK Installation Instructions

Both release APKs are compiled and stored in the `build_outputs/` directory:

| Application | Package Name | APK Location | File Size |
|---|---|---|---|
| **Customer / User App** | `com.app.clikget` | `build_outputs/user-app-release.apk` | **92.9 MB** |
| **Delivery Boy App** | `com.deliveryboy_clickget` | `build_outputs/delivery-app-release.apk` | **14.9 MB** |

### Installing via ADB (Command Line)

Ensure `adb` is in your terminal or Android SDK platform-tools path:

```bash
# Verify device connection
adb devices

# Install Customer App (Allow reinstall with existing data)
adb install -r c:\Users\DELL\Desktop\clikgett\build_outputs\user-app-release.apk

# Install Delivery App (Allow reinstall with existing data)
adb install -r c:\Users\DELL\Desktop\clikgett\build_outputs\delivery-app-release.apk
```

### Uninstalling Old Versions (If Clean Reinstall Needed)

```bash
# Uninstall Customer App
adb uninstall com.app.clikget

# Uninstall Delivery App
adb uninstall com.deliveryboy_clickget
```

### Manual Installation (Sideloading via WhatsApp / File Transfer)
1. Transfer `user-app-release.apk` and `delivery-app-release.apk` to your phone via USB cable, Google Drive, or WhatsApp.
2. Open your phone's **File Manager** and tap the APK file.
3. If prompted with `"Install unknown apps"`, tap **Settings** and toggle ON **"Allow from this source"**.
4. Tap **Install**.

---

## 3. Required App Permissions

When launching the applications for the first time, grant the following permissions:

### Customer / User App (`com.app.clikget`):
- **Location (`ACCESS_FINE_LOCATION`):** Required to calculate delivery distance, long-distance surcharge, and address assignment. Select **"While using the app"**.
- **Notifications (`POST_NOTIFICATIONS`):** Required on Android 13+ to receive order stage updates, OTP SMS, and delivery arrival alerts. Tap **Allow**.

### Delivery Boy App (`com.deliveryboy_clickget`):
- **Location (`ACCESS_FINE_LOCATION`):** Required to track driver position and calculate order ETAs. Select **"While using the app"** (or **"Allow all the time"** for background tracking).
- **Notifications (`POST_NOTIFICATIONS`):** Required for new order dispatch notifications.
- **Photos & Media (`READ_MEDIA_IMAGES`):** Required if delivery proof images or store receipts are uploaded.

---

## 4. End-to-End Testing Workflows

### A. Customer Flow (User App)
1. **Launch App:** Open ClikGett. The splash screen should transition to the location selection / home feed.
2. **Login:** Enter phone number and verify via OTP.
3. **Homepage:**
   - Verify promotional banners load dynamically. Tap a promotional banner to verify subcategory routing.
   - Verify active temporary store sections load with products.
4. **Category & Product Details:**
   - Browse catalog. Verify stock indicators:
     - 0 quantity: **"Out of Stock"**
     - 1–9 quantity: **"Only X left"**
     - 10+ quantity: Clean price display without urgency text.
5. **Floating Bottom Cart Capsule:**
   - Add items to cart. Verify the sleek, centered floating capsule widget appears dynamically showing item count and total price.
6. **Cart & Pricing Engine:**
   - Navigate to Cart.
   - Verify coupon suggestions bar: `"Add ₹X more to unlock this coupon"`.
   - Add Atta product (Category 23) and apply coupon: verify server correctly discounts non-Atta items and excludes Atta from discount subtotal.
   - Verify long-distance surcharge if delivery address is beyond the threshold configured in Admin.
   - Verify large cart ETA buffer notice (+5 / +10 mins) if item count exceeds threshold.
   - Verify wallet payment option is disabled if cart total is under ₹399.
7. **Order Placement:** Complete order via Cash on Delivery or test Razorpay gateway.
8. **Live Order Tracking:** Observe visual stage timeline (Ordered, Packing, Out for Delivery, Delivered) and live delivery countdown timer.
9. **Completed Order Feedback:** Upon order delivery, submit star rating and message to verify customer feedback reaches Admin Inbox.

---

### B. Delivery Driver Flow (Delivery App)
1. **Launch App:** Open Delivery Boy.
2. **Authentication:** Enter delivery boy registered mobile number and verify OTP.
3. **Assigned Orders List:** View active dispatch queue.
4. **Order Details & Privacy Gating:**
   - Open order details.
   - Verify customer address masking:
     - If Admin toggle `DeliveryAddressVisibility` is OFF: address is obscured.
     - If ON: full delivery address is visible.
   - Verify product list visibility:
     - If Admin toggle `DeliveryProductListVisibility` is OFF: item details are hidden.
     - If ON: complete item list is displayed for pickup verification.
5. **Status Transitions:** Update order status from `Assigned` -> `Out for Delivery` -> `Delivered`.
6. **Customer Sync:** Confirm customer app receives instant notification and updates stage timeline in real time.
