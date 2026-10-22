import 'dart:convert';

import 'package:fav_app/Models/Home/cart_model.dart';
import 'package:fav_app/Models/response_model.dart';
import 'package:fav_app/Services/common/intercepter.dart';
import 'package:fav_app/constants.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

import '../../new/NewModel/config.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class CartServices {
  static Future getConfig() {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/users/settings'),
    )
        .then((response) {
      return ConfigModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future validateCart({required Map body}) {
    return client
        .post(Uri.parse('${Constants.baseUrl}/carts/validate_cart'),
            body: json.encode(body))
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }
}
