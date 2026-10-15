# ClikGett User App (Customer App) Pre-Build Audit

**Date:** 2026-10-03  
**Project:** `Flutter/UserApp`  
**Target Platform:** Android (Physical Device Release Build)  
**Deliverable:** Phase 1 Audit Report (`APK_USERAPP_PREBUILD_AUDIT.md`)

---

## 1. Executive Summary

A comprehensive pre-build inspection of the Customer/User App (`Flutter/UserApp`) was conducted to evaluate build feasibility, Android SDK configuration, network architecture, and physical device testability.

The application is configured to communicate with the live production backend over HTTPS (`https://api.clikgett.com/api`). It contains **zero localhost, zero 127.0.0.1, and zero 10.0.2.2 emulator-only API endpoints**. The backend endpoints were validated live and responded with `HTTP 200 OK`. The project is structurally ready for a production-like release APK build.

---

## 2. Core Technical Specifications

| Parameter | Current Value | Evaluation / Status |
|---|---|---|
| **Flutter Version** | `3.47.4` (Channel stable, Dart `3.13.3`) | Up to date, fully compatible |
| **Application ID / Package Name** | `com.app.clikget` | Consistent across Gradle, Manifest, and Firebase |
| **App Name** | `ClikGett` | Display name in `AndroidManifest.xml` |
| **Version Name** | `1.1.8` | Defined in `pubspec.yaml` (`1.1.8+118`) |
| **Version Code** | `118` | Defined in `pubspec.yaml` |
| **compileSdkVersion** | `35` (Android 15) | Modern Android standard |
| **targetSdkVersion** | `35` (Android 15) | Conforms to Google Play & Android 14/15 requirements |
| **minSdkVersion** | `21` (Android 5.0 Lollipop) | Wide physical device compatibility (99%+ Android devices) |
| **Gradle Version** | Gradle `8.4` (wrapper) | Compatible with AGP 8.3.2 |
| **Android Gradle Plugin (AGP)** | `8.3.2` | Clean modern Gradle build system |
| **Kotlin Version** | `1.9.0` | Compatible with Flutter & plugins |
| **Java Compatibility** | Java 8 (1.8) | With `coreLibraryDesugaringEnabled true` (`desugar_jdk_libs:2.1.4`) |
| **Multidex** | Enabled (`multiDexEnabled true`) | Accommodates large dependency footprint |

---

## 3. Network & API Architecture Audit

### A. Base API URLs
- **Primary Source:** `Flutter/UserApp/lib/new/Constants/Constants.dart`
  - `Constants.baseUrl`: `"https://api.clikgett.com/api"`
  - `Constants.baseUrlDev`: `"https://api.clikgett.com/api"`
  - `Constants.baseUrlProd`: `"https://api.clikgett.com/api"`
- **Legacy Source:** `Flutter/UserApp/lib/old/constants.dart`
  - `baseUrlDev`: `"https://api.clikgett.com/api"`
  - `baseUrlProd`: `"https://api.clikgett.com/api"`

### B. Physical Phone Usability
- **Usability:** **YES, 100% USABLE ON PHYSICAL DEVICE**
- **Public Reachability Test:**
  - `GET https://api.clikgett.com/api/users/settings` -> **HTTP 200 OK** (Returned live shop settings)
  - `GET https://api.clikgett.com/api/users/homepage` -> **HTTP 200 OK** (Returned live banners, categories, and products)
- **Localhost / Emulator References:** **ZERO** (No `localhost`, `127.0.0.1`, or `10.0.2.2` used for backend calls).
- **Protocol:** Enforced HTTPS with valid TLS/SSL certificate signed by Amazon Trust Services.

---

## 4. Key Integrations & Third-Party Services

| Integration | Configuration File | Key / Value | Status |
|---|---|---|---|
| **Firebase Cloud Messaging** | `android/app/google-services.json` | Project: `clikgett-2ac7e`, App ID: `1:826426051495:android:858f80ff672dcf6072c482` | Active & Verified |
| **Google Maps SDK** | `android/app/src/main/AndroidManifest.xml` | `AIzaSyDWSVWNGH0j1I-2emUK6u7g_Wy56iNAlj8` | Valid Android Maps key configured |
| **Razorpay Payments** | `lib/new/Constants/Constants.dart` | Key ID: `rzp_live_jcwTqWSYgMpFK0` | Live gateway configured |
| **Image CDN / S3** | CloudFront CDN | `https://d3c9kvg5gaqz48.cloudfront.net/` | Active live image delivery |
| **Android Permissions** | `AndroidManifest.xml` | `INTERNET`, `ACCESS_FINE_LOCATION`, `POST_NOTIFICATIONS`, `WAKE_LOCK`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED` | Complete |

---

## 5. Signing & ProGuard Configuration

- **Release Signing:** In `android/app/build.gradle`, the `release` build type uses `signingConfig signingConfigs.debug`. This generates a testable release APK signed with the standard Android debug keystore, allowing direct `adb install` or manual sideloading on any physical Android phone without requiring custom private production keys.
- **R8 / Minification:** `minifyEnabled true`, `shrinkResources false`.
- **ProGuard Rules:** `android/app/proguard-rules.pro` already contains explicit `-keep` rules for:
  - Retrofit & OkHttp (`-keep class retrofit2.** { *; }`, `-keep class com.squareup.okhttp3.** { *; }`)
  - Gson models (`-keep class com.app.clikget.models.** { *; }`)
  - Google Play Services Auth (`-keep class com.google.android.gms.auth.api.credentials.** { *; }`)
  - Firebase (`-keep class com.google.firebase.** { *; }`)
  - Razorpay (`-keep class com.razorpay.** { *; }`)

---

## 6. Build & Runtime Risk Assessment

- **Build Blockers:** None. Code passes static analysis (`dart analyze` exit code 0).
- **Runtime Blockers:** None. Backend APIs are live, database is active, and HTTPS certificates are valid.
- **Recommendations for Phase 2:**
  - Proceed with standard Flutter clean and dependency synchronization:
    ```bash
    flutter clean
    flutter pub get
    flutter analyze
    flutter build apk --release
    ```
