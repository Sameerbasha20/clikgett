import 'dart:convert';

import 'package:fav_app/Models/Orders/orders.dart';
import 'package:fav_app/Models/Orders/ordersdetails.dart';
import 'package:fav_app/Models/response_model.dart';
import 'package:fav_app/Services/common/intercepter.dart';
import 'package:fav_app/constants.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class OrderServices {
  static Future getcurrentorders() {
    return client
        .get(
      Uri.parse(Constants.baseUrl + '/orders/currentorders'),
    )
        .then((response) {
      return CurrentOrderModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future getpastorders() {
    return client
        .get(
      Uri.parse(Constants.baseUrl + '/orders/pastorders'),
    )
        .then((response) {
      return CurrentOrderModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future getordersDetails(int id) {
    return client
        .get(
      Uri.parse(Constants.baseUrl + '/orders/myorder/' + id.toString()),
    )
        .then((response) {
      return Ordersdetailsmodel.fromJson(jsonDecode(response.body));
    });
  }

  static Future cancelOrders(body, id) {
    return client
        .put(
            Uri.parse(
                Constants.baseUrl + '/orders/cancelorderuser/' + id.toString()),
            body: json.encode(body))
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future ordersfeedback(body) {
    return client
        .post(Uri.parse(Constants.baseUrl + '/users/addfeedback'),
            body: json.encode(body))
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }
}
