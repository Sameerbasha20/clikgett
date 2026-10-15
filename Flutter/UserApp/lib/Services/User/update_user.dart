import 'dart:convert';

import 'package:fav_app/Models/Users/usersDetails.dart';
import 'package:fav_app/Models/response_model.dart';
import 'package:fav_app/Services/common/intercepter.dart';
import 'package:fav_app/constants.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class UsersServices {
  static Future updateeuser(body) {
    return client
        .put(Uri.parse(Constants.baseUrl + '/users/update'),
            body: json.encode(body))
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future getuserDetails() {
    return client
        .get(
      Uri.parse(Constants.baseUrl + '/users/detail'),
    )
        .then((response) {
      return UserDetailsModel.fromJson(jsonDecode(response.body));
    });
  }
}
