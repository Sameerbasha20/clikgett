import 'dart:convert';

import 'package:fav_app/Models/Home/home_model.dart';
import 'package:fav_app/Services/common/intercepter.dart';
import 'package:fav_app/constants.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class HomeServices {
  static Future getHome() {
    return client
        .get(
      Uri.parse(Constants.baseUrl + '/users/homepage'),
    )
        .then((response) {
      return HomeModel.fromJson(jsonDecode(response.body));
    });
  }
}
