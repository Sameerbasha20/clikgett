import 'dart:convert';
import 'package:fav_app/old/Models/Orders/orders.dart';
import 'package:fav_app/old/Models/Orders/ordersdetails.dart';
import 'package:fav_app/old/Models/Orders/promocode_model.dart';
import 'package:fav_app/old/Models/response_model.dart';
import 'package:fav_app/old/Services/common/intercepter.dart';
import 'package:fav_app/old/constants.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

import '../../../new/NewModel/promocodes_model.dart';
import '../../../new/NewModel/youmaylike_model.dart';
import '../../Models/OrderResponseModel.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class OrderServices {
  static Future createOrder({required body}) {
    return client.post(
      Uri.parse('${Constants.baseUrl}/orders/createorder'),
      body: json.encode(body),
      headers: {
        'Content-Type': 'application/json', // Make sure to set the content type
      },
    ).then((response) {
      // Print the raw response
      print('Raw response: ${response.body}');

      // Decode and print the response as a map
      final decodedResponse = jsonDecode(response.body);
      print('Decoded response: $decodedResponse');

      // Return the parsed ResponseModel
      return OrderResponseModel.fromJson(decodedResponse);
    }).catchError((error) {
      // Print the error in case of a failure
      print('Error: $error');
    });
  }

  static Future createOrderPayment({required body}) {
    return client
        .post(
      Uri.parse('${Constants.baseUrl}/orders/orderpayments'),
      body: json.encode(body),
    )
        .then((response) {
      return jsonDecode(response.body);
    });
  }

  static Future reOrder({required body}) {
    return client
        .post(
      Uri.parse('${Constants.baseUrl}/orders/reorder'),
      body: json.encode(body),
    )
        .then((response) {
      return jsonDecode(response.body);
    });
  }

  static Future getcurrentorders() {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/orders/currentorders'),
    )
        .then((response) {
      return CurrentOrderModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future getpastorders() {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/orders/pastorders'),
    )
        .then((response) {
      return CurrentOrderModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future getordersDetails(int id) {
    print('${Constants.baseUrl}/orders/myorder/$id');
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/orders/myorder/$id'),
    )
        .then((response) {
      return Ordersdetailsmodel.fromJson(jsonDecode(response.body));
    });
  }

  static Future<dynamic> getActivepromoCodes() {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/promocodes/active'),
    )
        .then((response) {
      return PromoCodeListModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future getYouMayLikeProducts() {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/products/youmaylikeit'),
    )
        .then((response) {
      return YouMayLikeModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future cancelOrders(body, id) {
    return client
        .put(Uri.parse('${Constants.baseUrl}/orders/cancelorderuser/$id'),
            body: json.encode(body))
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future ordersfeedback(body) {
    return client
        .post(Uri.parse('${Constants.baseUrl}/users/addfeedback'),
            body: json.encode(body))
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future validatePromo({required body}) {
    return client
        .post(
      Uri.parse('${Constants.baseUrl}/promocodes/user/verify'),
      body: json.encode(body),
    )
        .then((response) {
      return PromoCodeModel.fromJson(jsonDecode(response.body));
    });
  }
}
