import 'dart:convert';
import 'package:fav_app/old/Models/Home/home_model.dart';
import 'package:fav_app/old/Services/common/intercepter.dart';
import 'package:fav_app/old/constants.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

import '../../../new/NewModel/wallet.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class HomeServices {
  static Future getHome() {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/users/homepage'),
    )
        .then((response) {
      // print( HomeModel.fromJson(jsonDecode(response.body)));

      return HomeModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future getWallet() {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/users/user_wallets'),
    )
        .then((response) {
      return WalletModel.fromJson(jsonDecode(response.body));
    });
  }
}
