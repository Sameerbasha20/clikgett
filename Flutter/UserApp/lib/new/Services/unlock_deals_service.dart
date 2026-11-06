import 'dart:async';
import 'dart:convert';

import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Services/common/intercepter.dart';
import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

final Client _client = InterceptedClient.build(interceptors: [ApiInterceptor()], requestTimeout: const Duration(seconds: 30));

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

  /// Units per order at the deal price (more are charged the normal price).
  final int dealLimit;
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
        dealLimit = _i(j['DealLimit']) < 1 ? 1 : _i(j['DealLimit']),
        categoryId = j['CategoryID'] == null ? null : _i(j['CategoryID']),
        subCategoryId = j['SubCategoryID'] == null ? null : _i(j['SubCategoryID']);

  /// How far the cart is towards this deal (0..1).
  double get progress {
    if (unlocked || threshold <= 0) return 1;
    return ((threshold - amountNeeded) / threshold).clamp(0.0, 1.0);
  }

  /// The price struck through next to the deal price.
  double get wasPrice => mrp > regularPrice ? mrp : regularPrice;
}

class UnlockDealsPage {
  final List<UnlockDeal> deals;
  final double? nextAmountNeeded;
  final double? nextUnlockPrice;
  final bool loggedIn;

  /// One cart value unlocks every deal (admin → Unlock deals).
  final double threshold;

  /// What the cart counts towards it (deal items excluded) and what is still needed.
  final double cartValue;
  final double amountNeeded;
  final bool unlocked;

  const UnlockDealsPage(this.deals,
      {this.nextAmountNeeded,
      this.nextUnlockPrice,
      this.loggedIn = false,
      this.threshold = 0,
      this.cartValue = 0,
      this.amountNeeded = 0,
      this.unlocked = false});

  double get progress => unlocked || threshold <= 0 ? 1 : (cartValue / threshold).clamp(0.0, 1.0);

  /// Deals that can be bought right now (in stock).
  List<UnlockDeal> get available => deals.where((d) => d.inStock).toList();
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
      final page = UnlockDealsPage(
        deals,
        nextAmountNeeded: next is Map ? _d(next['AmountNeeded']) : null,
        nextUnlockPrice: next is Map ? _d(next['UnlockPrice']) : null,
        loggedIn: data['LoggedIn'] == true,
        threshold: _d(data['ThresholdAmount']),
        cartValue: _d(data['CartValue']),
        amountNeeded: _d(data['AmountNeeded']),
        unlocked: data['Unlocked'] == true,
      );
      UnlockDealsStore._set(page);
      return page;
    } catch (e) {
      debugPrint('unlock deals failed: $e');
      return null;
    }
  }
}

/// The latest deals, shared by every product card and product page so each one can show
/// "🔒 ₹896 · Shop for ₹599". Loaded once, refreshed when the cart changes.
class UnlockDealsStore {
  static final Rxn<UnlockDealsPage> page = Rxn<UnlockDealsPage>();
  static DateTime? _loadedAt;
  static bool _loading = false;
  static Timer? _debounce;
  static Worker? _cartWatch;

  static void _set(UnlockDealsPage p) {
    page.value = p;
    _loadedAt = DateTime.now();
  }

  /// The in-stock deal on this pack, if any.
  static UnlockDeal? forVariant(int? variantId) {
    final p = page.value;
    if (p == null || variantId == null || variantId <= 0) return null;
    return p.deals.firstWhereOrNull((d) => d.variantId == variantId && d.inStock);
  }

  /// Loads the deals once (and again after 2 minutes); safe to call from build.
  static void ensureLoaded() {
    _watchCart();
    final at = _loadedAt;
    if (_loading || (at != null && DateTime.now().difference(at) < const Duration(minutes: 2))) return;
    refresh();
  }

  static Future<void> refresh() async {
    if (_loading) return;
    _loading = true;
    try {
      await UnlockDealsService.load();
    } finally {
      _loading = false;
      _loadedAt ??= DateTime.now(); // a failed load waits for the next window too
    }
  }

  static void _watchCart() {
    if (_cartWatch != null || !Get.isRegistered<CartController>()) return;
    _cartWatch = ever(Get.find<CartController>().cartItems, (_) {
      _debounce?.cancel();
      _debounce = Timer(const Duration(milliseconds: 700), refresh);
    });
  }
}
