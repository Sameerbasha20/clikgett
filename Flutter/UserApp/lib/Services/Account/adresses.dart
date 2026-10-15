import 'dart:convert';

import 'package:fav_app/Models/response_model.dart';
import 'package:fav_app/Services/common/intercepter.dart';
import 'package:fav_app/constants.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

import '../../Models/Account/adresses.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class AdresseServices {
  static Future addAdress(body) {
    return client
        .post(Uri.parse(Constants.baseUrl + '/address/addaddress'),
            body: json.encode(body))
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future updateAdress(body, id) {
    return client
        .put(Uri.parse(Constants.baseUrl + '/address/' + id.toString()),
            body: json.encode(body))
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future deleteAdress(adressId) {
    return client
        .delete(
      Uri.parse(Constants.baseUrl + '/address/' + adressId.toString()),
    )
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future getAdressesAPi() {
    return client
        .get(
      Uri.parse(Constants.baseUrl + '/address/myaddress'),
    )
        .then((response) {
      return AdressesModel.fromJson(jsonDecode(response.body));
    });
  }
}
