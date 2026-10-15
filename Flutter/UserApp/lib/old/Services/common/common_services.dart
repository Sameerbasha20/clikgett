import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CommonServices {
  // save token on storage
  static Future<bool> clearSavedData() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();

    // return prefs.clear();
    await prefs.setString('userDetails', '');
    await prefs.setString('token', '');
    return true;
  }

  // save token on storage
  static Future<bool> setToken(String token) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();

    return prefs.setString('token', token);
  }

  // retrive token from storage
  static Future<String> getToken() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    return Future(() => prefs.getString('token') ?? '');
  }

  // save user data
  static Future<bool> saveUserData(String data) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    debugPrint('userDetails: ${data}');

    return prefs.setString('userDetails', data);
  }

  // retrive token from storage
  static Future<String> getUserData() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    debugPrint('userDetails: ${prefs.getString('userDetails')}');
    return Future(() => prefs.getString('userDetails') ?? '');
  }

  // save language on storage
  // static Future<bool> setLanguage(int languageId) async {
  //   SharedPreferences prefs = await SharedPreferences.getInstance();
  //   debugPrint('setLanguage: ${languageId.toString()}');

  //   return prefs.setInt('LanguageId', languageId);
  // }

  // retrive token from storage
  // static Future<int> getLanguage() async {
  //   SharedPreferences prefs = await SharedPreferences.getInstance();
  //   debugPrint('getlanguage: ${prefs.getInt('LanguageId')}');
  //   return Future(() => prefs.getInt('LanguageId') ?? 1);
  // }
}
