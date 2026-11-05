# 06 — Delivery App (Native Android) Audit

> Post-fix status (5 Nov 2026): see `16_REAUDIT_AFTER_FIXES.md`. This file describes the state found on 4 Nov.

## 1. Scope and limits

- **Code:** `Flutter/Deliveryboy` (native Java, despite the folder name), 28 Java files and 4,854 lines.
- **Device testing: BLOCKED.** No device connected and no Espresso/UI tests beyond the template. Screens and background location were not exercised at runtime.
- **Verified:** build, unit tests, lint, API mapping, and the rider backend endpoints (by suites and the probe).

## 2. Build and tests

Command: `./gradlew.bat testDebugUnitTest assembleDebug lintDebug --console=plain`. Exit code 0, **BUILD SUCCESSFUL** (2 m 56 s).

| Item | Result |
|---|---|
| Unit tests | 1 test (template `ExampleUnitTest`), 0 failures, 0 skipped. No real tests. |
| Instrumented tests | 1 template test, not run (no device) |
| `assembleDebug` | `app-debug.apk`, 17.8 MB |
| `assembleRelease` | Not run. `app/build.gradle:48` falls back to **debug signing** when `key.properties` is missing (it is missing), so a release build would be debug-signed and unusable for Play. |
| Lint | 0 errors, **315 warnings**: 129 `UnusedResources`, 53 `HardcodedText`, 8 `Overdraw`, 7 `ContentDescription`, 6 `ObsoleteSdkInt`, … |
| SDK | compileSdk 36, targetSdk 36, minSdk 21, versionCode 7 / versionName 1.6 |
| `minifyEnabled` | false |

## 3. Screens and workflows

| Screen / component | Purpose | Backend endpoint(s) | Backend verified | Device verified |
|---|---|---|---|---|
| `SplashActivity` | start, session check | — | — | BLOCKED |
| `SentotpActivity` | enter mobile, request OTP | `POST deliveryboy/sendotp` | BLOCKED (real SMS) | BLOCKED |
| `VerifyOtpActivity` | verify OTP, get tokens | `POST deliveryboy/login`, `auth/refresh`, `auth/logout` | refresh/logout (test_refresh_tokens) | BLOCKED |
| `MainActivity` + `CurrentOrdersFragment` / `PastOrdersFragment` | assigned and past orders, duty status, summary | `GET deliveryboy/getroutes?Type=pending\|past`, `duty-status`, `summary` | getroutes (assignment suite Test 09, probe: 95 past orders, OTP removed) | BLOCKED |
| `OrderDetailsActivity` | details, call customer, navigate, delivery OTP, doorstep UPI QR, report delay or issue | `GET deliveryboy/orderdetail`, `POST orders/:id/upi-qr`, `GET orders/:id/upi-status`, `POST orders/report-delay`, `orders/report-issue`, `POST deliveryboy/sendotp_order` | orderdetail ownership (probe: 403 "not assigned to you"); UPI QR (test_doorstep_upi); report delay/issue (suite); sendotp_order BLOCKED | BLOCKED |
| `StatusActivity` | status updates, deliver with OTP | `PUT deliveryboy/updatestatus/:id`, `POST deliveryboy/deliver/:id` | Yes (test_order_flow) | BLOCKED |
| `LocationTrackingService` | foreground location pings | `POST deliveryboy/location/ping` | **Not tested** | BLOCKED |
| `RiderMessagingService` | FCM new-order push | `POST deliveryboy/fcmtoken` | BLOCKED | BLOCKED |
| Accept / reject | — | **No accept/reject step exists.** Orders are assigned by admin, and the rider app has no accept/decline action. | — | — |
| Profile / logout | logout | `POST auth/logout` | Yes | BLOCKED |

**API mapping:** 20 URL literals reference 16 rider routes. All exist. Two concatenated URLs (`orders/<id>/upi-qr`, `upi-status`) were confirmed by hand.

**Server-side ownership:**
- `deliveryboyAuthenticate` requires `AdminUsers.Role = 2`;
- order detail checks assignment (403 otherwise);
- customer and admin tokens are refused on rider routes (probe).

## 4. Security and configuration findings

| Finding | Location | Risk |
|---|---|---|
| Cleartext HTTP allowed for **all hosts** (`base-config cleartextTrafficPermitted="true"`) and `usesCleartextTraffic="true"` | `res/xml/network_security_config.xml`, `AndroidManifest.xml:31-32` | Medium: a misconfigured base URL silently sends tokens over HTTP |
| Activities exported with no intent filter: `VerifyOtpActivity`, `SentotpActivity`, `OrderDetailsActivity`, `StatusActivity`, `MainActivity` (`exported="true"`) | `AndroidManifest.xml:64-85` | Low-medium: other apps can launch internal screens with crafted extras; the backend still enforces ownership |
| `allowBackup="true"` with the auth token in plain SharedPreferences | `AndroidManifest.xml:23`, `Utils/Auth.java:53` | Low-medium: the token can be extracted from device backups |
| Release signing falls back to the debug key | `app/build.gradle:33-48` | High for release: Play upload impossible |
| Default `apiBaseUrl` is a LAN HTTP address | `app/build.gradle:11-12` | Release builds must pass `-PapiBaseUrl=https://…` |
| Old server IPs in comments | `Utils/CommonUtilities.java:10-16` | Cosmetic |
| Permissions | INTERNET, network/wifi state, fine and coarse location, FOREGROUND_SERVICE(_LOCATION), POST_NOTIFICATIONS | Appropriate. No background-location permission, so tracking relies on the foreground service. |
