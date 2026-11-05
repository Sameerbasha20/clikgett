import 'dart:convert';
import 'package:fav_app/old/Models/Home/home_model.dart';
import 'package:fav_app/old/Services/common/intercepter.dart';
import 'package:fav_app/old/constants.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

import '../../../new/NewModel/wallet.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()], requestTimeout: const Duration(seconds: 30));

class HomeServices {
  /// Null when the request fails, times out or cannot be read; the caller then stops
  /// the loader and offers a retry instead of spinning for ever.
  static Future getHome() {
    return client
        .get(
          Uri.parse('${Constants.baseUrl}/users/homepage'),
        )
        .timeout(const Duration(seconds: 45))
        .then<void>((response) => HomeModel.fromJson(jsonDecode(response.body)))
        .catchError((Object e) {
      debugPrint('home failed: $e');
      return null;
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
