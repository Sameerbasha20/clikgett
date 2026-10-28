import 'package:fav_app/new/Services/common/common_services.dart' as session;

/// Older copy kept for its imports; the saved login (including token renewal)
/// lives in lib/new/Services/common/common_services.dart.
class CommonServices {
  static Future<bool> clearSavedData() => session.CommonServices.clearSavedData();
  static Future<bool> setToken(String token) => session.CommonServices.setToken(token);
  static Future<bool> saveSession({required String? token, String? refreshToken, int? expiresIn}) =>
      session.CommonServices.saveSession(token: token, refreshToken: refreshToken, expiresIn: expiresIn);
  static Future<String> getToken() => session.CommonServices.getToken();
  static Future<String> refreshNow() => session.CommonServices.refreshNow();
  static Future<bool> recoverFromExpired(dynamic body) => session.CommonServices.recoverFromExpired(body);
  static Future<void> logoutOnServer() => session.CommonServices.logoutOnServer();
  static Future<bool> saveUserData(String data) => session.CommonServices.saveUserData(data);
  static Future<String> getUserData() => session.CommonServices.getUserData();
}
