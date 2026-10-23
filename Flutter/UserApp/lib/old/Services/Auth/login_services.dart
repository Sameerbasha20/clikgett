import 'dart:convert';
import 'package:fav_app/old/Models/login/login_model.dart';
import 'package:fav_app/old/Models/response_model.dart';
import 'package:fav_app/old/Services/common/intercepter.dart';
import 'package:fav_app/old/constants.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class LoginServices {
  /// Digits in the last code the server sent (it chooses 4 or 6).
  static int otpLength = 4;

  static ResponseModel _readOtpResponse(String body) {
    final data = jsonDecode(body);
    final length = data is Map ? data['OtpLength'] : null;
    if (length == 4 || length == 6) otpLength = length;
    return ResponseModel.fromJson(data);
  }

  static Future sentOtp(body) {
    return client
        .post(Uri.parse('${Constants.baseUrl}/users/login/sendotp'),
            body: json.encode(body))
        .then((response) => _readOtpResponse(response.body));
  }
  static Future SIGNUPsentOtp(body) {
    return client
        .post(Uri.parse('${Constants.baseUrl}/users/signup/sendotp'),
        body: json.encode(body))
        .then((response) => _readOtpResponse(response.body));
  }


  static Future verifyOtp(body) {
    return client
        .post(Uri.parse('${Constants.baseUrl}/users/login/verifyotp'),
            body: json.encode(body))
        .then((response) {
      return LoginModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future signup(body) {
    print({"sss"+body});

    return client
        .post(Uri.parse('${Constants.baseUrl}/users/signup'),
        body: json.encode(body))
        .then((response) {
      return LoginModel.fromJson(jsonDecode(response.body));
    });
  }
}
