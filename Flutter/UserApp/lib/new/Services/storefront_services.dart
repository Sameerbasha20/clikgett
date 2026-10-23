import 'dart:convert';

import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Services/common/intercepter.dart';
import 'package:fav_app/old/Models/Home/home_model.dart' as home_model;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

final Client _client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

/// Serviceability + delivery time for a location.
class DeliveryEstimate {
  final bool serviceable;
  final int? etaMinutes;
  final String message;

  const DeliveryEstimate({required this.serviceable, this.etaMinutes, this.message = ''});
}

class CategoryPage {
  final List<home_model.BestItem> products;

  /// Offset of the next page, or -1 when there are no more products.
  final int nextOffset;

  const CategoryPage(this.products, this.nextOffset);
}

class SubCategoryItem {
  final int id;
  final String name;
  final String? imageUrl;

  const SubCategoryItem({required this.id, required this.name, this.imageUrl});

  factory SubCategoryItem.fromJson(Map<String, dynamic> json) => SubCategoryItem(
        id: (json['SubCategoryID'] as num).toInt(),
        name: '${json['SubCategoryName'] ?? ''}'.trim(),
        imageUrl: (json['SubCategoryImage'] is String && '${json['SubCategoryImage']}'.startsWith('http'))
            ? json['SubCategoryImage']
            : null,
      );
}

class StorefrontServices {
  /// Delivery time for the given location, from the admin's distance-band ETA rules.
  static Future<DeliveryEstimate?> deliveryEstimate(double latitude, double longitude) async {
    if (latitude == 0 && longitude == 0) return null;
    try {
      final response = await _client.post(
        Uri.parse('${Constants.baseUrl}/address/check-serviceability'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'Latitude': latitude, 'Longitude': longitude}),
      );
      final data = jsonDecode(response.body);
      if (data is! Map || data['Status'] != 1) return null;
      return DeliveryEstimate(
        serviceable: data['IsServiceable'] == true,
        etaMinutes: data['EtaMinutes'] is num ? (data['EtaMinutes'] as num).toInt() : null,
        message: '${data['Message'] ?? ''}',
      );
    } catch (e) {
      debugPrint('deliveryEstimate failed: $e');
      return null;
    }
  }

  /// Subcategories of a category that currently have products.
  static Future<List<SubCategoryItem>> subcategories(int categoryId) async {
    final response = await _client.get(Uri.parse('${Constants.baseUrl}/categories/subcategories_by_category/$categoryId'));
    final data = jsonDecode(response.body);
    final list = (data is Map ? data['SubCategories'] : null) as List? ?? [];
    return list.map((e) => SubCategoryItem.fromJson(Map<String, dynamic>.from(e))).toList();
  }

  /// One page of a category's products (optionally one subcategory), with sort.
  static Future<CategoryPage> categoryProducts({
    required int categoryId,
    int? subCategoryId,
    int offset = 0,
    int pageSize = 20,
    String sort = '',
  }) async {
    final params = <String, String>{
      'CategoryID': '$categoryId',
      if (subCategoryId != null) 'SubCategoryID': '$subCategoryId',
      'rowCount': '$pageSize',
      'Offset': '$offset',
      if (sort.isNotEmpty) 'Sort': sort,
    };
    final uri = Uri.parse('${Constants.baseUrl}/products/list').replace(queryParameters: params);
    final response = await _client.get(uri);
    final data = jsonDecode(response.body);
    final list = (data is Map ? data['Products'] : null) as List? ?? [];
    final next = data is Map && data['offset'] is num ? (data['offset'] as num).toInt() : -1;
    return CategoryPage(list.map((e) => home_model.BestItem.fromJson(Map<String, dynamic>.from(e))).toList(), next);
  }

  /// Bestsellers / personalised picks (used for "You might also like").
  static Future<List<home_model.BestItem>> recommendedProducts() async {
    try {
      final response = await _client.get(Uri.parse('${Constants.baseUrl}/products/recommendedproducts'));
      final data = jsonDecode(response.body);
      final list = (data is Map ? (data['BestItems'] ?? data['Products']) : null) as List? ?? [];
      return list.map((e) => home_model.BestItem.fromJson(Map<String, dynamic>.from(e))).toList();
    } catch (e) {
      debugPrint('recommendedProducts failed: $e');
      return [];
    }
  }

  /// Products from the same subcategory/category as [productId].
  static Future<List<home_model.BestItem>> similarProducts(int productId) async {
    try {
      final response = await _client.get(Uri.parse('${Constants.baseUrl}/products/similar/$productId'));
      final data = jsonDecode(response.body);
      final list = (data is Map ? data['Products'] : null) as List? ?? [];
      return list.map((e) => home_model.BestItem.fromJson(Map<String, dynamic>.from(e))).toList();
    } catch (e) {
      debugPrint('similarProducts failed: $e');
      return [];
    }
  }

  /// Products that get cheaper when you buy more (bundles, slabs, "buy 2" prices).
  static Future<List<home_model.BestItem>> bulkDeals() async {
    try {
      final response = await _client.get(Uri.parse('${Constants.baseUrl}/products/bulk-deals'));
      final data = jsonDecode(response.body);
      final list = (data is Map ? data['Products'] : null) as List? ?? [];
      return list.map((e) => home_model.BestItem.fromJson(Map<String, dynamic>.from(e))).toList();
    } catch (e) {
      debugPrint('bulkDeals failed: $e');
      return [];
    }
  }

  /// All products of one home section (the section's "See all" list).
  static Future<List<home_model.BestItem>> sectionProducts(int homeSectionId) async {
    final response = await _client.get(
      Uri.parse('${Constants.baseUrl}/users/homepagesectionproducts_all/$homeSectionId'),
    );
    final data = jsonDecode(response.body);
    final list = (data is Map ? data['Products'] : null) as List? ?? [];
    return list.map((e) => home_model.BestItem.fromJson(Map<String, dynamic>.from(e))).toList();
  }
}
