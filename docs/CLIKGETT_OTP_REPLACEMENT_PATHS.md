# ClikGett OTP / DLT Replacement Paths

## 1. Customer OTP

### Send OTP
- File: [Backend/server/controllers/CommonController.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/CommonController.js#L1029-L1040) (Primary Active Gateway Service)
  - Line: 1029–1040 (active API trigger at line 1034)
  - Function: `CommonController.sendSms(number, otp)`
  - Route: Called via `POST /api/users/login/sendotp` and `POST /api/users/signup/sendotp` (defined in [Backend/server/routes/Users.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/routes/Users.js#L12-L13))
  - Variable: Hardcoded directly in query string of `url1`
  - Current DLT Template ID: `1207168224779287282`
  - Sender ID: `SMARPG`
  - Entity/PE ID: Configured in the SMS Provider (Textspeed) portal under Sender ID `SMARPG` (not passed in query URL)
- Controller Dispatch File: [Backend/server/controllers/Users.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Users.js)
  - Line: 170–193 (`Sendotp_Signup`) and 366–389 (`Sendotp_Login`)
  - Route: `POST /api/users/signup/sendotp` & `POST /api/users/login/sendotp`
  - Helper Function (Secondary / Textlocal): `SendOTP(mobileNumber, OTP)` at [Users.js:840-876](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Users.js#L840-L876)
  - Historical Commented DLT Template ID: `1207161798564977983` (line 908) & `1207165270747467244` (line 887)

### Verify OTP
- File: [Backend/server/controllers/Users.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Users.js#L330-L363)
- Line: 330–363
- Function: `loginwithotp`
- Route: `POST /api/users/login/verifyotp` (defined in [Backend/server/routes/Users.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/routes/Users.js#L16))

---

## 2. Delivery OTP

### Send OTP
- File: [Backend/server/controllers/DeliveryBoy.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/DeliveryBoy.js#L67-L99)
- Line: 67–99 (invokes `CommonController.sendSms(req.body.MobileNumber, OTP)` at line 82)
- Function: `SendotpLogin`
- Route: `POST /api/deliveryboy/sendotp` (defined in [Backend/server/routes/DeliveryBoy.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/routes/DeliveryBoy.js#L9))
- Variable: Hardcoded in [Backend/server/controllers/CommonController.js:1034](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/CommonController.js#L1034)
- Current DLT Template ID: `1207168224779287282`
- Sender ID: `SMARPG`
- Entity/PE ID: Configured in the SMS Provider portal
- Note on Order Delivery OTP:
  - File: [Backend/server/controllers/DeliveryBoy.js:136-154](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/DeliveryBoy.js#L136-L154)
  - Function: `Sendotp_Orders`
  - Route: `POST /api/deliveryboy/sendotp_order` (defined in [Backend/server/routes/DeliveryBoy.js:26](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/routes/DeliveryBoy.js#L26))
  - Note: Generates 4-digit numeric code and stores it in the `Orders` database table (`update Orders set OTP=? where OrderID=?`).

### Verify OTP
- Login OTP Verification:
  - File: [Backend/server/controllers/DeliveryBoy.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/DeliveryBoy.js#L101-L134)
  - Line: 101–134
  - Function: `deliveryboylogin`
  - Route: `POST /api/deliveryboy/login` (defined in [Backend/server/routes/DeliveryBoy.js:12](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/routes/DeliveryBoy.js#L12))
- Order Delivery Completion OTP Verification:
  - File: [Backend/server/controllers/DeliveryBoy.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/DeliveryBoy.js#L156-L171)
  - Line: 156–171
  - Function: `Orders_VerifyOTP`
  - Route: `POST /api/deliveryboy/verifyotp_order` (defined in [Backend/server/routes/DeliveryBoy.js:28](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/routes/DeliveryBoy.js#L28))

---

## 3. SMS Provider

### Active Primary SMS Provider (Textspeed Gateway)
- Provider: Textspeed (`sms.textspeed.in`)
- Provider URL: `https://sms.textspeed.in/vb/apikey.php`
- Configuration file: [Backend/server/controllers/CommonController.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/CommonController.js#L1034)
- API key variable: Currently hardcoded as query parameter `apikey=yVh1Wl4HpLysSRP9` (Masked: `apikey=********`) in line 1034
- Auth variable: None (uses API key in query string)
- DLT template variable: Hardcoded query param `templateid=1207168224779287282` in line 1034
- Entity ID variable: Mapped in the Textspeed web portal / DLT telemarketer account under Sender ID `SMARPG`
- Sender ID variable: Hardcoded query param `senderid=SMARPG` in line 1034

### Secondary / Alternate Provider (Textlocal)
- Provider: Textlocal (`api.textlocal.in`)
- Provider URL: `https://api.textlocal.in/send/`
- Configuration files:
  - [Backend/server/controllers/Users.js:840-876](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Users.js#L840-L876) (`SendOTP`)
  - [Backend/server/controllers/DeliveryBoy.js:869-906](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/DeliveryBoy.js#L869-L906) (`SendOTP`)
- API key variable: Loaded from environment variable `process.env.SMS_APIKEY` in [Backend/.env:12](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/.env#L12)
- Auth variable: Passed as URL parameter `apikey`
- DLT template variable: In Textlocal, templates are registered directly on the portal and matched with `message` text (or passed in header `DLT_TE_ID` as commented at line 908: `1207161798564977983`)
- Entity ID variable: Registered directly on Textlocal portal with Telemarketer
- Sender ID variable: Hardcoded parameter `sender=SMARPG`

---

## 4. Environment Files

### 1. `Backend/.env`
- File Path: [Backend/.env](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/.env)
- Does OTP configuration exist? **Yes** (SMS provider API key only)
- Variable Names:
  - Line 12: `SMS_APIKEY = "********"` (Loaded via `process.env.SMS_APIKEY` in `Users.js` and `DeliveryBoy.js`)
- Value loading method: Loaded from environment file
- Note: DLT Template ID, Entity/PE ID, and Sender ID are **NOT** in `.env`; they are currently hardcoded in [CommonController.js:1034](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/CommonController.js#L1034).

### 2. `Admin/.env`
- File Path: [Admin/.env](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Admin/.env)
- Does OTP configuration exist? **No**
- Variables: Contains `REACT_APP_BASE_URL`, `REACT_APP_ACCESSKEY`, `REACT_APP_SECRETKEY`. No OTP/DLT/SMS variables.

### 3. `Flutter/UserApp/.env`
- File Path: None (No `.env` file exists in `Flutter/UserApp`).

### 4. `Flutter/Deliveryboy/.env`
- File Path: None (No `.env` file exists in `Flutter/Deliveryboy`).

---

## 5. User App OTP Configuration

- **Findings:** The User App does **NOT** contain any SMS provider URLs, DLT Template IDs, Entity IDs, Sender IDs, or SMS API credentials.
- The User App **ONLY** calls the backend REST API endpoints using `Constants.baseUrl`:
  - Base URL configuration: [Flutter/UserApp/lib/constants.dart:9-11](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/constants.dart#L9-L11) (`https://api.clikgett.com/api`)
  - Login Send OTP endpoint: [Flutter/UserApp/lib/Services/Auth/login_services.dart:17](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/Services/Auth/login_services.dart#L17)
    - `POST ${Constants.baseUrl}/users/login/sendotp`
  - Login Verify OTP endpoint: [Flutter/UserApp/lib/Services/Auth/login_services.dart:26](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/Services/Auth/login_services.dart#L26)
    - `POST ${Constants.baseUrl}/users/login/verifyotp`
  - Signup Send OTP endpoint: [Flutter/UserApp/lib/old/Services/Auth/login_services.dart:26](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/old/Services/Auth/login_services.dart#L26)
    - `POST ${Constants.baseUrl}/users/signup/sendotp`
  - Controller Layer: [Flutter/UserApp/lib/new/Controllers/auth_controller.dart:85-185](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/new/Controllers/auth_controller.dart#L85-L185) (`sendOtp`, `verifyOtp`)
  - UI Screens:
    - [Flutter/UserApp/lib/new/NewScreens/Auth/Login.dart:213](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/new/NewScreens/Auth/Login.dart#L213)
    - [Flutter/UserApp/lib/new/NewScreens/Auth/Signup.dart:373](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/new/NewScreens/Auth/Signup.dart#L373)
    - [Flutter/UserApp/lib/new/NewScreens/Auth/OtpVerify.dart:151, 235](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/UserApp/lib/new/NewScreens/Auth/OtpVerify.dart#L151)

---

## 6. Delivery App OTP Configuration

- **Findings:** The Delivery App does **NOT** contain any SMS provider URLs, DLT Template IDs, Entity IDs, Sender IDs, or SMS API credentials.
- The Delivery App **ONLY** calls the backend REST API endpoints using Retrofit and `CommonUtilities.URL`:
  - Base URL configuration: [Flutter/Deliveryboy/app/src/main/java/com/deliveryboy_clickget/Utils/CommonUtilities.java:9](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/Deliveryboy/app/src/main/java/com/deliveryboy_clickget/Utils/CommonUtilities.java#L9) (`https://api.clikgett.com/api/`)
  - API Interface definitions: [Flutter/Deliveryboy/app/src/main/java/com/deliveryboy_clickget/Utils/APIService.java:33-41](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/Deliveryboy/app/src/main/java/com/deliveryboy_clickget/Utils/APIService.java#L33-L41)
    - `POST deliveryboy/sendotp` (Line 33)
    - `POST deliveryboy/sendotp_order` (Line 36)
    - `POST deliveryboy/verifyotp_order` (Line 40)
  - Login Send OTP Calling Activity: [Flutter/Deliveryboy/app/src/main/java/com/deliveryboy_clickget/SentotpActivity.java:49, 66](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/Deliveryboy/app/src/main/java/com/deliveryboy_clickget/SentotpActivity.java#L49)
  - Verify / Resend Calling Activity: [Flutter/Deliveryboy/app/src/main/java/com/deliveryboy_clickget/VerifyOtpActivity.java:215, 236](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/Deliveryboy/app/src/main/java/com/deliveryboy_clickget/VerifyOtpActivity.java#L215)
  - Order Delivery Send OTP Calling Activity: [Flutter/Deliveryboy/app/src/main/java/com/deliveryboy_clickget/OrderDetailsActivity.java:680, 711](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Flutter/Deliveryboy/app/src/main/java/com/deliveryboy_clickget/OrderDetailsActivity.java#L680)
- **Shared Service:** Delivery Login OTP uses `CommonController.sendSms()` (identical service and template as User App OTP).

---

## 7. OTP Message Template

### Active Message Template
- File: [Backend/server/controllers/CommonController.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/CommonController.js#L1030-L1032)
- Function: `CommonController.sendSms`
- Lines: 1030–1032
- Message Text:
  ```text
  Dear user, Your one time verification code is {otp}. Please DO NOT share this OTP with anyone. From mTouch Labs
  ```
- Storage Type: **A. Hardcoded** in `CommonController.js` (NOT loaded from `.env` or database).

### Secondary Message Template (Textlocal)
- Files: [Backend/server/controllers/Users.js:848](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Users.js#L848) and [Backend/server/controllers/DeliveryBoy.js:877](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/DeliveryBoy.js#L877)
- Message Text:
  ```text
  Dear user, Your one time verification code is {OTP}. Please DO NOT share this OTP with anyone. From mTouch Labs
  ```
- Storage Type: **A. Hardcoded**

---

## 8. Complete OTP Flow

### Customer Flow
```
Customer Mobile App (Flutter/UserApp)
    ↓
[auth_controller.dart -> LoginServices.sentOtp()]
    ↓
[POST https://api.clikgett.com/api/users/login/sendotp]
    ↓
Backend Router: [Backend/server/routes/Users.js]
    ↓
Backend Controller: [Backend/server/controllers/Users.js -> Sendotp_Login]
    ↓
SMS Service: [Backend/server/controllers/CommonController.js -> CommonController.sendSms()]
    ↓
SMS Provider HTTP Request:
https://sms.textspeed.in/vb/apikey.php?apikey=********&senderid=SMARPG&templateid=1207168224779287282&number=<Mobile>&message=Dear user, Your one time verification code is <OTP>...
    ↓
DLT Registered Template & Sender ID (SMARPG)
    ↓
Customer Handset receives OTP SMS
```

### Delivery Flow
```
Delivery Mobile App (Flutter/Deliveryboy)
    ↓
[SentotpActivity.java -> apiService.sentotp()]
    ↓
[POST https://api.clikgett.com/api/deliveryboy/sendotp]
    ↓
Backend Router: [Backend/server/routes/DeliveryBoy.js]
    ↓
Backend Controller: [Backend/server/controllers/DeliveryBoy.js -> SendotpLogin]
    ↓
SMS Service: [Backend/server/controllers/CommonController.js -> CommonController.sendSms()]
    ↓
SMS Provider HTTP Request:
https://sms.textspeed.in/vb/apikey.php?apikey=********&senderid=SMARPG&templateid=1207168224779287282&number=<Mobile>&message=Dear user, Your one time verification code is <OTP>...
    ↓
DLT Registered Template & Sender ID (SMARPG)
    ↓
Delivery Partner Handset receives OTP SMS
```

---

## 9. MANUAL REPLACEMENT CHECKLIST

[ ] Replace Customer & Delivery OTP Template ID (`1207168224779287282`) in [Backend/server/controllers/CommonController.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/CommonController.js#L1034)  
[ ] Replace Sender ID (`SMARPG`) in [Backend/server/controllers/CommonController.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/CommonController.js#L1034)  
[ ] Replace Entity/PE ID in SMS Provider Portal (Textspeed / DLT operator dashboard mapped to Sender ID)  
[ ] Replace SMS Provider API Key in [Backend/server/controllers/CommonController.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/CommonController.js#L1034) if renewed  
[ ] Update OTP message text in [Backend/server/controllers/CommonController.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/CommonController.js#L1030-L1032) to match exact renewed DLT wording  
[ ] If utilizing secondary Textlocal fallback, replace `SMS_APIKEY` in [Backend/.env](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/.env#L12) and sender/message in [Users.js:848](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Users.js#L848) and [DeliveryBoy.js:877](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/DeliveryBoy.js#L877)  
[ ] Verify User App endpoint connectivity (`https://api.clikgett.com/api/users/login/sendotp`)  
[ ] Verify Delivery App endpoint connectivity (`https://api.clikgett.com/api/deliveryboy/sendotp`)  

---

## 10. Files I SHOULD EDIT

To update the DLT Template ID, Sender ID, Message Text, and Provider API Key for OTP sending, you ONLY need to edit:

1. **[Backend/server/controllers/CommonController.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/CommonController.js)**
   - **Line 1030–1032:** Message template text
   - **Line 1034:** `apikey`, `senderid`, `templateid`, and provider URL
2. *(Optional — Only if you also want to update the secondary/legacy Textlocal functions)*:
   - **[Backend/.env](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/.env):** Line 12 (`SMS_APIKEY`)
   - **[Backend/server/controllers/Users.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/Users.js):** Line 848
   - **[Backend/server/controllers/DeliveryBoy.js](file:///c:/Users/DELL/Desktop/clikgett/clikgett-code/Backend/server/controllers/DeliveryBoy.js):** Line 877

---

## 11. Files I SHOULD NOT EDIT

The following files do NOT contain DLT configuration, Sender IDs, or gateway credentials, and do NOT need to be edited for DLT renewal:

- **Flutter / User App files:**
  - `Flutter/UserApp/lib/Services/Auth/login_services.dart`
  - `Flutter/UserApp/lib/new/Controllers/auth_controller.dart`
  - `Flutter/UserApp/lib/new/NewScreens/Auth/Login.dart`
  - `Flutter/UserApp/lib/new/NewScreens/Auth/Signup.dart`
  - `Flutter/UserApp/lib/new/NewScreens/Auth/OtpVerify.dart`
  - `Flutter/UserApp/lib/constants.dart`
- **Flutter / Delivery App files:**
  - `Flutter/Deliveryboy/app/src/main/java/com/deliveryboy_clickget/SentotpActivity.java`
  - `Flutter/Deliveryboy/app/src/main/java/com/deliveryboy_clickget/VerifyOtpActivity.java`
  - `Flutter/Deliveryboy/app/src/main/java/com/deliveryboy_clickget/OrderDetailsActivity.java`
  - `Flutter/Deliveryboy/app/src/main/java/com/deliveryboy_clickget/Utils/APIService.java`
  - `Flutter/Deliveryboy/app/src/main/java/com/deliveryboy_clickget/Utils/CommonUtilities.java`
- **Admin Panel files:**
  - `Admin/.env`
  - `Admin/src/Components/Login/forgotPassword.jsx`
  - Any file in `Admin/` (contains zero SMS/OTP functionality)
- **Backend Routing and Auth Middleware:**
  - `Backend/server/routes/Users.js`
  - `Backend/server/routes/DeliveryBoy.js`
  - `Backend/server/utils/utils.js`
