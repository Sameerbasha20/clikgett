import 'dart:convert';
import 'package:fav_app/old/Models/Categories/categories_model.dart';
import 'package:fav_app/old/Services/common/intercepter.dart';
import 'package:fav_app/old/constants.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

import '../../../new/NewModel/sub_category_model.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class CategoriesServices {
  static Future getCategories() {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/categories/allcategoriesuser'),
    )
        .then((response) {
      // print( CategoriesModel.fromJson(jsonDecode(response.body)));

      return CategoriesModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future getsubCategoriesList(int categoryId) {
    return client
        .get(
      Uri.parse(
          '${Constants.baseUrl}/categories/subcategories_by_category/$categoryId'),
    )
        .then((response) {
      return SubCategoriesModel.fromJson(jsonDecode(response.body));
    });
  }
}
