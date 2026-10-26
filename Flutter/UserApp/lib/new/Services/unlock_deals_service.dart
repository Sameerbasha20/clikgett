import 'dart:convert';

import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Services/common/intercepter.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

final Client _client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

double _d(dynamic v) => v is num ? v.toDouble() : double.tryParse('${v ?? ''}') ?? 0;
int _i(dynamic v) => v is num ? v.toInt() : int.tryParse('${v ?? ''}') ?? 0;

/// A product sold at a special price once the rest of the cart reaches [threshold]
/// (Backend controllers/ProductUnlocks.js deals; priced by the checkout bill).
class UnlockDeal {
  final int unlockId;
  final int productId;
  final int variantId;
  final String name;
  final String imageUrl;
  final String unit;
  final double mrp;
  final double regularPrice;
  final double unlockPrice;
  final double threshold;
  final bool unlocked;
  final double amountNeeded;
  final bool inStock;
  final int maxQty;
  final int inCart;
  final int? categoryId;
  final int? subCategoryId;

  UnlockDeal.fromJson(Map<String, dynamic> j)
      : unlockId = _i(j['UnlockID']),
        productId = _i(j['ProductID']),
        variantId = _i(j['VariantID']),
        name = '${j['ProductName'] ?? ''}'.trim(),
        imageUrl = '${j['ImageUrl'] ?? ''}',
        unit = '${j['Unit'] ?? ''}',
        mrp = _d(j['Price']),
        regularPrice = _d(j['OfferPrice']),
        unlockPrice = _d(j['UnlockPrice']),
        threshold = _d(j['ThresholdAmount']),
        unlocked = j['IsUnlocked'] == true,
        amountNeeded = _d(j['AmountNeeded']),
        inStock = j['InStock'] == true,
        maxQty = _i(j['MaxQty']),
        inCart = _i(j['InCart']),
        categoryId = j['CategoryID'] == null ? null : _i(j['CategoryID']),
        subCategoryId = j['SubCategoryID'] == null ? null : _i(j['SubCategoryID']);

  /// How far the cart is towards this deal (0..1).
  double get progress {
    if (unlocked || threshold <= 0) return 1;
    return ((threshold - amountNeeded + 1) / threshold).clamp(0.0, 1.0);
  }

  /// The price struck through next to the deal price.
  double get wasPrice => mrp > regularPrice ? mrp : regularPrice;
}

class UnlockDealsPage {
  final List<UnlockDeal> deals;
  final double? nextAmountNeeded;
  final double? nextUnlockPrice;
  final bool loggedIn;

  const UnlockDealsPage(this.deals, {this.nextAmountNeeded, this.nextUnlockPrice, this.loggedIn = false});
}

class UnlockDealsService {
  static Future<UnlockDealsPage?> load() async {
    try {
      final response = await _client.get(Uri.parse('${Constants.baseUrl}/product-unlocks/deals'));
      final data = jsonDecode(response.body);
      if (data is! Map || data['Status'] != 1) return null;
      final deals = (data['Deals'] is List ? data['Deals'] as List : const [])
          .whereType<Map>()
          .map((e) => UnlockDeal.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      final next = data['NextUnlock'];
      return UnlockDealsPage(
        deals,
        nextAmountNeeded: next is Map ? _d(next['AmountNeeded']) : null,
        nextUnlockPrice: next is Map ? _d(next['UnlockPrice']) : null,
        loggedIn: data['LoggedIn'] == true,
      );
    } catch (e) {
      debugPrint('unlock deals failed: $e');
      return null;
    }
  }
}
