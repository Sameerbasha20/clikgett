import 'dart:convert';
import 'package:fav_app/old/Models/login/login_model.dart';
import 'package:fav_app/old/Models/response_model.dart';
import 'package:fav_app/old/Services/common/intercepter.dart';
import 'package:fav_app/old/constants.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class LoginServices {
  static Future sentOtp(body) {
    print('44444444444444444444444444444444444444444444');
    print('${Constants.baseUrl}/users/login/sendotp');
    return client
        .post(Uri.parse('${Constants.baseUrl}/users/login/sendotp'),
            body: json.encode(body))
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }
  static Future SIGNUPsentOtp(body) {
    print('44444444444444444444444444444444444444444444');
    print('${Constants.baseUrl}/users/signup/sendotp');
    return client
        .post(Uri.parse('${Constants.baseUrl}/users/signup/sendotp'),
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
