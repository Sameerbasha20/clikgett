# ClikGett — APK Local Backend Report

### Network

**PC LAN IP:**
192.168.1.8

**Backend:**
http://192.168.1.8:5000

**API:**
http://192.168.1.8:5000/api

---

### Health

| Check | URL | Result |
|---|---|---|
| Local PC | http://localhost:5000/health | HTTP 200 (healthy, database connected) |
| LAN Health | http://192.168.1.8:5000/health | HTTP 200 (healthy, database connected) |
| LAN API Health | http://192.168.1.8:5000/api/health | HTTP 200 (healthy, database connected) |
| LAN DB Health | http://192.168.1.8:5000/api/health/db | HTTP 200 (healthy, database connected) |

---

### APKs

| App | API URL | Build | Install | API Test |
|---|---|---|---|---|
| User | http://192.168.1.8:5000/api | SUCCESS (Release APK generated) | Ready for install (`adb devices` list empty - see instructions below) | Verified in APK binaries (`libapp.so`) & LAN health confirmed |
| Delivery | http://192.168.1.8:5000/api/ | SUCCESS (Release APK generated) | Ready for install (`adb devices` list empty - see instructions below) | Verified in APK binaries (`classes.dex`) & LAN health confirmed |

---

### APK Locations

**User:**
`C:\Users\DELL\Desktop\clikgett\build_outputs\user-app-local-backend.apk`  
Size: ~92.8 MB (97,345,221 bytes)

**Delivery:**
`C:\Users\DELL\Desktop\clikgett\build_outputs\delivery-app-local-backend.apk`  
Size: ~14.9 MB (15,580,159 bytes)

---

### Final Architecture

```
Physical Phone
        ↓
Same Wi-Fi (192.168.1.x)
        ↓
Windows PC (192.168.1.8)
        ↓
192.168.1.8:5000
        ↓
ClikGett Node/Express Backend (listening on 0.0.0.0:5000)
        ↓
MySQL
```

---

### Verification Details

1. **Express Backend Host Binding**:
   - Backend configured to listen on `0.0.0.0:5000`.
   - Accessible from both localhost and LAN IP `http://192.168.1.8:5000`.
   - Windows Firewall verified permitting traffic to port 5000.

2. **User App (Flutter)**:
   - Configured `ApiConfig.baseUrl` in `Flutter/UserApp/lib/config/api_config.dart` to `http://192.168.1.8:5000/api`.
   - Configured `android:usesCleartextTraffic="true"` in `Flutter/UserApp/android/app/src/main/AndroidManifest.xml`.
   - Release APK compiled with `flutter build apk --release`.
   - Verified that `http://192.168.1.8:5000/api` is baked directly into the compiled native binary (`lib/arm64-v8a/libapp.so`, `lib/armeabi-v7a/libapp.so`, `lib/x86_64/libapp.so`).

3. **Delivery App (Native Android)**:
   - Configured `CommonUtilities.URL` in `Flutter/Deliveryboy/app/src/main/java/com/deliveryboy_clickget/Utils/CommonUtilities.java` to `http://192.168.1.8:5000/api/`.
   - Verified `android:usesCleartextTraffic="true"` is enabled in `AndroidManifest.xml`.
   - Release APK compiled via `gradlew assembleRelease`.
   - Verified that `http://192.168.1.8:5000/api/` is baked directly into `classes.dex`.

4. **Installation on Phone**:
   - When connecting your physical Android phone with USB Debugging enabled:
     ```powershell
     & "C:\Users\DELL\AppData\Local\Android\Sdk\platform-tools\adb.exe" install -r C:\Users\DELL\Desktop\clikgett\build_outputs\user-app-local-backend.apk
     & "C:\Users\DELL\AppData\Local\Android\Sdk\platform-tools\adb.exe" install -r C:\Users\DELL\Desktop\clikgett\build_outputs\delivery-app-local-backend.apk
     ```
   - Alternatively, copy the APK files directly to phone storage or install via file manager / Google Drive / WhatsApp.
