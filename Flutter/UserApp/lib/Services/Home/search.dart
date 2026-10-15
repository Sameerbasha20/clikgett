import 'dart:convert';

import 'package:fav_app/Models/Home/search_model.dart';
import 'package:fav_app/Services/common/intercepter.dart';
import 'package:fav_app/constants.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class SearchServices {
  static Future<SearchModel> getCart(String query) {
    return client
        .get(
      Uri.parse(Constants.baseUrl + '/products/search/' + query),
    )
        .then((response) {
      return SearchModel.fromJson(jsonDecode(response.body));
    });
  }
}
