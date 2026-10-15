import 'dart:convert';

import 'package:fav_app/Models/login/login_model.dart';
import 'package:fav_app/Models/response_model.dart';
import 'package:fav_app/Services/common/intercepter.dart';
import 'package:fav_app/constants.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class LoginServices {
  static Future sentOtp(body) {
    print('${Constants.baseUrl}/users/login/sendotp');
    print('111111111111111111111111111111111111');
    return client
        .post(Uri.parse('${Constants.baseUrl}/users/login/sendotp'),
            body: json.encode(body))
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future verifyOtp(body) {
    return client
        .post(Uri.parse('${Constants.baseUrl}/users/login/verifyotp'),
            body: json.encode(body))
        .then((response) {
      return LoginModel.fromJson(jsonDecode(response.body));
    });
  }
}
