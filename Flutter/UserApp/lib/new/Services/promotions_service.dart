import 'dart:convert';

import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Services/common/intercepter.dart';
import 'package:fav_app/old/Models/Home/home_model.dart' as home_model;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

final Client _client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

double _d(dynamic v) => v is num ? v.toDouble() : double.tryParse('${v ?? ''}') ?? 0;

/// Welcome offer: ₹ off each of a new customer's first orders (set in admin).
class WelcomeOfferInfo {
  final bool active;
  final String title;
  final double minOrderValue;
  final List<double> steps;
  final int ordersPlaced;
  final int? nextStep; // 1-based

  const WelcomeOfferInfo({
    required this.active,
    required this.title,
    required this.minOrderValue,
    required this.steps,
    required this.ordersPlaced,
    this.nextStep,
  });

  factory WelcomeOfferInfo.fromJson(Map<String, dynamic> j) => WelcomeOfferInfo(
        active: j['Active'] == true,
        title: '${j['Title'] ?? 'Welcome offer for you!'}',
        minOrderValue: _d(j['MinOrderValue']),
        steps: (j['Steps'] is List ? j['Steps'] as List : const []).map(_d).toList(),
        ordersPlaced: (j['OrdersPlaced'] as num?)?.toInt() ?? 0,
        nextStep: (j['NextStep'] as num?)?.toInt(),
      );
}

class PromotionsService {
  static Future<WelcomeOfferInfo?> welcome() async {
    try {
      final response = await _client.get(Uri.parse('${Constants.baseUrl}/promotions/welcome'));
      final data = jsonDecode(response.body);
      if (data is Map && data['Status'] == 1 && data['Offer'] is Map) {
        return WelcomeOfferInfo.fromJson(Map<String, dynamic>.from(data['Offer']));
      }
    } catch (e) {
      debugPrint('welcome offer failed: $e');
    }
    return null;
  }

  /// Products tagged "Our app: X% lower", in the admin's order.
  static Future<List<home_model.BestItem>> priceCompareProducts() async {
    try {
      final response = await _client.get(Uri.parse('${Constants.baseUrl}/promotions/price-compare'));
      final data = jsonDecode(response.body);
      final list = (data is Map ? data['Products'] : null) as List? ?? [];
      return list.map((e) => home_model.BestItem.fromJson(Map<String, dynamic>.from(e))).toList();
    } catch (e) {
      debugPrint('price compare products failed: $e');
      return [];
    }
  }
}
