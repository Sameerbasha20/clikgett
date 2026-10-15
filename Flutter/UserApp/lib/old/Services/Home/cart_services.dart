import 'dart:convert';
import 'package:fav_app/Models/Account/adresses.dart';
import 'package:fav_app/new/Controllers/adress_controller.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/old/Models/Home/cart_model.dart';
import 'package:fav_app/old/Models/response_model.dart';
import 'package:fav_app/old/Services/common/intercepter.dart';
import 'package:fav_app/old/constants.dart';
import 'package:get/get.dart';
import 'package:get/get_core/src/get_main.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class CartServices {
  static Future getCart() {
    HomeController homeController = Get.find();
    AdressController adressController = Get.find();

    print('Longitude: ${homeController.longitude.value}');
    print('Latitude: ${homeController.latitude.value}');
    print('updateLatitude: ${adressController.latitude.value}');
    print('Latitude: ${adressController.latitude.value}');
    print('Latitude: ${adressController.latitude.value}');

    double selectlat = adressController.latitude.value;
    double selectlong = adressController.longitude.value;

    return client
        .post(
      Uri.parse('${Constants.baseUrl}/carts/mycart'),
      body: jsonEncode({'Latitude': selectlat, 'Longitude': selectlong}),
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

  static Future deleteItemFromCart(
      {required productId, required variantId, required type}) {
    return client
        .delete(
      Uri.parse(
          '${Constants.baseUrl}/carts/deletecartitem/$productId/$variantId/$type'),
    )
        .then((response) {
      // print(response.statusCode);
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future deleteKitFromCart({required kitId, required type}) {
    return client
        .delete(
      Uri.parse('${Constants.baseUrl}/carts/deletekit/$kitId/$type'),
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
