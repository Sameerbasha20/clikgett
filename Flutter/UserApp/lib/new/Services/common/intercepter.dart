import 'dart:convert';

import 'package:fav_app/main.dart';
import 'package:fav_app/new/Services/common/toast_guard.dart';
import 'package:fav_app/old/Constants/toast.dart';
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
      if (!ToastGuard.blockAllToasts) {
        ToastGuard.blockAllToasts = true;

        customToast(message: "Re-Login Please");

        final pref = await SharedPreferences.getInstance();
        await pref.clear();

        appNavigatorKey.currentState!
            .pushNamedAndRemoveUntil('/login', (route) => false);
      }

      return Future.error('Unauthorized');
    } else if (data.statusCode == 500) {
      // await Common.setToken(null);
      Future.error('Unexpected error statusCode: ${data.statusCode} 😢');
    }
    return data;
  }
}
