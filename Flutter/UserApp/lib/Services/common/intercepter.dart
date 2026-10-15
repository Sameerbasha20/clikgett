import 'dart:convert';

import 'package:fav_app/Constants/toast.dart';
import 'package:fav_app/main.dart';
import 'package:fav_app/old/Screens/Auth_Screens/login_Screens.dart';
import 'package:flutter/material.dart';
import 'package:http_interceptor/http_interceptor.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'common_services.dart';

class ApiInterceptor implements InterceptorContract {
  @override
  Future<RequestData> interceptRequest({RequestData? data}) async {
    String? token;

    await CommonServices.getToken().then((onValue) {
      token = onValue;
    });
    print(token);

    try {
      // print('bearer $token');
      data!.headers['Content-Type'] = 'application/json';
      data.headers['Authorization'] = 'bearer $token';
    } catch (e) {
      print(e.toString());
    }
    return data!;
  }

  @override
  Future<ResponseData> interceptResponse({required ResponseData data}) async {
    var errorData = json.decode(data.body!);
    print("\n $data \n");
    if (data.statusCode == 400 || data.statusCode == 500) {
      var msg = errorData['Message'];
      customToast(message: msg);

      Future.error('Unexpected error 😢');
      return data;
    } else if (data.statusCode == 401) {
      // await Common.setToken(null);

      var msg = errorData['Message'];
      // customToast(message: msg);
      customToast(message: "Re-Login Please");

      // Navigate to login and clear stack
      // Navigate to login and clear stack
      final SharedPreferences pref = await SharedPreferences.getInstance();
      await pref.setString('city', '');
      pref.clear().then((value) {
        appNavigatorKey.currentState!
            .pushNamedAndRemoveUntil('/login', (route) => false);
      });

      Future.error('Unexpected error ${data.statusCode} 😢');
      return data;
    } else if (data.statusCode == 500) {
      // await Common.setToken(null);
      Future.error('Unexpected error statusCode: ${data.statusCode} 😢');
    }
    return data;
  }
}
