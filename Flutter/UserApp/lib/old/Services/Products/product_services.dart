import 'dart:convert';
import 'package:fav_app/old/Models/Home/products_model.dart';
import 'package:fav_app/old/Models/Kits/kits_model.dart';
import 'package:fav_app/old/Services/common/intercepter.dart';
import 'package:fav_app/old/constants.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

import '../../../new/NewModel/kits_details_model.dart';
import '../../../new/NewModel/product_details_model.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class ProductServices {
  static Future getKits() {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/products/allkits'),
    )
        .then((response) {
      return KitsModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future getKitsDetails(int kitId) {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/products/kitdetail/$kitId'),
    )
        .then((response) {
      return KitsDetailsModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future getProductDetails(int productId) {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/products/detail/$productId'),
    )
        .then((response) {
      return ProductDetailsModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future getProductsFromCategories({
    required categoryId,
    required subCategoryId,
    required limit,
    required offset,
  }) {
    print(Uri.parse('${Constants.baseUrl}/products/list?CategoryID=$categoryId&SubCategoryID=$subCategoryId&rowCount=$limit&Offset=$offset'),);

    return client

        .get(Uri.parse('${Constants.baseUrl}/products/list?CategoryID=$categoryId&SubCategoryID=$subCategoryId&rowCount=$limit&Offset=$offset'),)
        .then((response) {
      // debugPrint(response.body);
      return ProductsModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future<ProductsModel> getSimilarProducts(int productId) {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/products/similar/$productId'),
    )
        .then((response) {
      return ProductsModel.fromJson(jsonDecode(response.body));
    });
  }
}
