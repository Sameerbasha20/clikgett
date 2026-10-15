import 'dart:convert';
import 'package:fav_app/old/Models/Account/adresses.dart';
import 'package:fav_app/old/Models/response_model.dart';
import 'package:fav_app/old/Services/common/intercepter.dart';
import 'package:fav_app/old/constants.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class AdresseServices {
  static Future addAdress(body) {
    return client
        .post(Uri.parse('${Constants.baseUrl}/address/addaddress'),
            body: json.encode(body))
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future updateAdress(body, id) {
    return client
        .put(Uri.parse('${Constants.baseUrl}/address/$id'),
            body: json.encode(body))
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future deleteAdress(adressId) {
    return client
        .delete(
      Uri.parse('${Constants.baseUrl}/address/$adressId'),
    )
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future getAdressesAPi() {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/address/myaddress'),
    )
        .then((response) {
      return AdressesModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future<Map<String, dynamic>?> checkServiceabilityApi({
    required double latitude,
    required double longitude,
    int? addressId,
  }) async {
    try {
      final body = {
        'Latitude': latitude,
        'Longitude': longitude,
        if (addressId != null) 'AddressID': addressId,
      };
      final response = await client.post(
        Uri.parse('${Constants.baseUrl}/address/check-serviceability'),
        body: json.encode(body),
        headers: {'Content-Type': 'application/json'},
      );
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }
}
