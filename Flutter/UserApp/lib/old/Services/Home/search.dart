import 'dart:convert';
import 'package:fav_app/old/Models/Home/products_model.dart';
import 'package:fav_app/old/Services/common/intercepter.dart';
import 'package:fav_app/old/constants.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

import '../../../new/NewModel/recomended_model.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class SuggestionItem {
  final int productId;
  final String productName;
  final int? categoryId;
  final String categoryName;
  final int? subCategoryId;
  final String subCategoryName;
  final String imageUrl;
  final double price;
  final double offerPrice;
  final bool inStock;

  SuggestionItem({
    required this.productId,
    required this.productName,
    this.categoryId,
    this.categoryName = '',
    this.subCategoryId,
    this.subCategoryName = '',
    this.imageUrl = '',
    this.price = 0.0,
    this.offerPrice = 0.0,
    this.inStock = true,
  });

  factory SuggestionItem.fromJson(Map<String, dynamic> json) {
    return SuggestionItem(
      productId: json['ProductID'] ?? 0,
      productName: json['ProductName'] ?? '',
      categoryId: json['CategoryID'],
      categoryName: json['CategoryName'] ?? '',
      subCategoryId: json['SubCategoryID'],
      subCategoryName: json['SubCategoryName'] ?? '',
      imageUrl: json['ImageUrl'] ?? '',
      price: json['Price'] != null ? (json['Price'] as num).toDouble() : 0.0,
      offerPrice: json['OfferPrice'] != null ? (json['OfferPrice'] as num).toDouble() : 0.0,
      inStock: json['InStock'] == true || json['InStock'] == 1,
    );
  }
}

class SuggestionsResponse {
  final int status;
  final String query;
  final List<SuggestionItem> suggestions;
  final List<String> popularSearches;

  SuggestionsResponse({
    required this.status,
    required this.query,
    required this.suggestions,
    required this.popularSearches,
  });

  factory SuggestionsResponse.fromJson(Map<String, dynamic> json) {
    var rawList = json['Suggestions'] as List? ?? [];
    List<SuggestionItem> items = rawList.map((e) => SuggestionItem.fromJson(e)).toList();

    var rawPopular = json['PopularSearches'] as List? ?? [];
    List<String> popular = rawPopular.map((e) => e.toString()).toList();

    return SuggestionsResponse(
      status: json['Status'] ?? 0,
      query: json['Query'] ?? '',
      suggestions: items,
      popularSearches: popular,
    );
  }
}

class SearchServices {
  static Future<ProductsModel> searchProducts(String query) {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/products/search/$query'),
    )
        .then((response) {
      return ProductsModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future<RecomendedModel> recomendedProducts() {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/products/recommendedproducts'),
    )
        .then((response) {
      return RecomendedModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future<SuggestionsResponse> getSuggestions(String query) {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/products/suggestions?q=${Uri.encodeComponent(query)}'),
    )
        .then((response) {
      if (response.statusCode == 200) {
        return SuggestionsResponse.fromJson(jsonDecode(response.body));
      }
      return SuggestionsResponse(status: 0, query: query, suggestions: [], popularSearches: []);
    }).catchError((_) {
      return SuggestionsResponse(status: 0, query: query, suggestions: [], popularSearches: []);
    });
  }

  static Future<bool> clearSearchHistory() {
    return client
        .delete(
      Uri.parse('${Constants.baseUrl}/products/search-history'),
    )
        .then((response) {
      return response.statusCode == 200;
    }).catchError((_) => false);
  }
}
