import 'dart:async';
import 'dart:convert';

import 'package:fav_app/constants.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Saved login. The login token lasts an hour; [getToken] swaps the refresh token
/// for a new pair a few minutes before it runs out, so every caller (the API
/// interceptors and the services that build their own headers) always gets a
/// working token without the customer noticing. Older logins that have no refresh
/// token keep working as before.
///
/// The other CommonServices classes (lib/Services, lib/old/Services) forward here.
class CommonServices {
  static const _kToken = 'token';
  static const _kRefresh = 'refreshToken';
  static const _kExpiresAt = 'tokenExpiresAt';

  /// Renew this long before the token runs out.
  static const _renewBefore = Duration(minutes: 5);

  /// One refresh at a time; parallel callers wait for the same result.
  static Future<String>? _refreshing;

  static Future<bool> clearSavedData() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString('userDetails', '');
    await prefs.setString(_kToken, '');
    await prefs.remove(_kRefresh);
    await prefs.remove(_kExpiresAt);
    return true;
  }

  /// Saves a login token on its own (no refresh token).
  static Future<bool> setToken(String token) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    return prefs.setString(_kToken, token);
  }

  /// Saves a login from the server: token, refresh token and its lifetime in seconds.
  static Future<bool> saveSession({required String? token, String? refreshToken, int? expiresIn}) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kToken, token ?? '');
    if (refreshToken != null && refreshToken.isNotEmpty && expiresIn != null && expiresIn > 0) {
      await prefs.setString(_kRefresh, refreshToken);
      // Measured on this phone's clock, so a wrong phone time doesn't matter.
      await prefs.setInt(_kExpiresAt, DateTime.now().add(Duration(seconds: expiresIn)).millisecondsSinceEpoch);
    } else {
      await prefs.remove(_kRefresh);
      await prefs.remove(_kExpiresAt);
    }
    return true;
  }

  /// A working login token ('' when logged out).
  static Future<String> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_kToken) ?? '';
    if (token.isEmpty) return '';
    final refresh = prefs.getString(_kRefresh) ?? '';
    if (refresh.isEmpty) return token;
    final expiresAt = prefs.getInt(_kExpiresAt) ?? 0;
    if (DateTime.now().millisecondsSinceEpoch < expiresAt - _renewBefore.inMilliseconds) return token;
    return refreshNow();
  }

  /// Gets a new token now. Returns '' if the server ended the login (the caller's
  /// request then gets a 401 and the app goes to the login screen).
  static Future<String> refreshNow() {
    return _refreshing ??= _refresh().whenComplete(() => _refreshing = null);
  }

  static Future<String> _refresh() async {
    final prefs = await SharedPreferences.getInstance();
    final current = prefs.getString(_kToken) ?? '';
    final refresh = prefs.getString(_kRefresh) ?? '';
    if (refresh.isEmpty) return current;
    try {
      final res = await http
          .post(Uri.parse('${Constants.baseUrl}/auth/refresh'),
              headers: {'Content-Type': 'application/json'}, body: jsonEncode({'RefreshToken': refresh}))
          .timeout(const Duration(seconds: 15));
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data is Map && data['Status'] == 1) {
        await saveSession(
            token: '${data['token']}', refreshToken: '${data['RefreshToken']}', expiresIn: (data['ExpiresIn'] as num?)?.toInt());
        return '${data['token']}';
      }
      if (res.statusCode == 409) {
        // Another request already renewed it; use what it saved.
        await prefs.reload();
        return prefs.getString(_kToken) ?? current;
      }
      if (res.statusCode == 401) {
        await prefs.setString(_kToken, '');
        await prefs.remove(_kRefresh);
        await prefs.remove(_kExpiresAt);
        return '';
      }
    } catch (e) {
      debugPrint('Session refresh failed: $e');
    }
    // Offline or server trouble: keep the current token and try again next time.
    return current;
  }

  /// For a 401 response: true if it was only an expired login token and a fresh one
  /// was obtained (so don't log the customer out; the next request works).
  static Future<bool> recoverFromExpired(dynamic body) async {
    if (body is! Map || body['Message'] != 'Token expired') return false;
    final prefs = await SharedPreferences.getInstance();
    final before = prefs.getString(_kToken) ?? '';
    if ((prefs.getString(_kRefresh) ?? '').isEmpty) return false;
    final after = await refreshNow();
    return after.isNotEmpty && after != before;
  }

  /// Ends this login on the server too (call before clearing saved data on logout).
  static Future<void> logoutOnServer() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final refresh = prefs.getString(_kRefresh) ?? '';
      if (refresh.isEmpty) return;
      await http
          .post(Uri.parse('${Constants.baseUrl}/auth/logout'),
              headers: {'Content-Type': 'application/json'}, body: jsonEncode({'RefreshToken': refresh}))
          .timeout(const Duration(seconds: 8));
    } catch (_) {
      // Logging out on the phone still works; the refresh token expires on its own.
    }
  }

  static Future<bool> saveUserData(String data) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    return prefs.setString('userDetails', data);
  }

  static Future<String> getUserData() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    return prefs.getString('userDetails') ?? '';
  }
}
