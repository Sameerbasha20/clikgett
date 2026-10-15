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

  static Future getCart() {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/carts/mycart'),
    )
        .then((response) {
      return CartModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future addCart({required body}) {
    return client
        .post(Uri.parse('${Constants.baseUrl}/carts/addcart'),
            body: json.encode(body))
        .then((response) {
      // return jsonDecode(response.body);
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future deleteItemFromCart({required productId, required variantId}) {
    return client
        .delete(
      Uri.parse(
          '${Constants.baseUrl}/carts/deletecartitem/$productId/$variantId'),
    )
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future deleteCart({id}) {
    return client
        .delete(
      Uri.parse('${Constants.baseUrl}/carts/deletecart/$id'),
    )
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }
}
