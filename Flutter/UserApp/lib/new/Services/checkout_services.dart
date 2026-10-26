import 'dart:convert';

import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Services/common/intercepter.dart';
import 'package:fav_app/new/Services/print_store_service.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

final Client _client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

double _d(dynamic v) => v is num ? v.toDouble() : double.tryParse('${v ?? ''}') ?? 0;
int _i(dynamic v) => v is num ? v.toInt() : int.tryParse('${v ?? ''}') ?? 0;

class BillItem {
  final int productId;
  final int variantId;
  final String name;
  final String imageUrl;
  final String unit;
  final int quantity;
  final int availableQty;
  final int maxQty;
  final double mrp;
  final double unitPrice;
  final double lineTotal;
  final double originalTotal;
  final String? appliedRule;

  BillItem.fromJson(Map<String, dynamic> j)
      : productId = _i(j['ProductID']),
        variantId = _i(j['VariantID']),
        name = '${j['ProductName'] ?? ''}'.trim(),
        imageUrl = _imageUrl(j),
        unit = _unit(j),
        quantity = _i(j['Quantity']),
        availableQty = _i(j['AvailableQty']),
        maxQty = _i(j['maxQty']),
        mrp = _d(j['Price']),
        unitPrice = _d(j['UnitPrice'] ?? j['OfferPrice']),
        lineTotal = _d(j['LineTotal']),
        originalTotal = _d(j['OriginalTotal']),
        appliedRule = j['AppliedRule'] is String && '${j['AppliedRule']}'.isNotEmpty ? j['AppliedRule'] : null;

  /// Most a customer can order of this item (stock and per-order limit).
  int get limit => maxQty > 0 && maxQty < availableQty ? maxQty : availableQty;

  /// None left in the store.
  bool get outOfStock => availableQty <= 0;

  /// Fewer left than the cart asks for (or none at all); the order cannot be placed like this.
  bool get stockProblem => quantity > availableQty;

  static String _unit(Map j) {
    final v = _d(j['metricvalue']);
    final t = '${j['metrictype'] ?? ''}'.trim();
    if (v == 0 && t.isEmpty) return '';
    final value = v == v.roundToDouble() ? v.toInt().toString() : v.toString();
    return '$value $t'.trim();
  }

  static String _imageUrl(Map j) {
    final url = '${j['ImageUrl'] ?? ''}';
    if (url.startsWith('http')) return url;
    final images = j['ProductImages'];
    if (images is List && images.isNotEmpty && '${images.first}'.startsWith('http')) return '${images.first}';
    return '';
  }
}

class BillCoupon {
  final String code;
  final String description;
  final double minOrderValue;
  final double amountNeeded;
  final bool applicable;

  BillCoupon.fromJson(Map<String, dynamic> j)
      : code = '${j['PromoCode'] ?? ''}',
        description = '${j['Description'] ?? ''}'.trim(),
        minOrderValue = _d(j['MinOrderValue']),
        amountNeeded = _d(j['AmountNeeded']),
        applicable = j['IsApplicable'] == true;
}

class BillUnlock {
  final int productId;
  final int? variantId;
  final String name;
  final String unit;
  final double price;
  final double unlockPrice;
  final double threshold;
  final bool unlocked;
  final double amountNeeded;

  BillUnlock.fromJson(Map<String, dynamic> j)
      : productId = _i(j['ProductID']),
        variantId = j['VariantID'] == null ? null : _i(j['VariantID']),
        name = '${j['ProductName'] ?? ''}'.trim(),
        unit = '${j['Unit'] ?? ''}',
        price = _d(j['Price']),
        unlockPrice = _d(j['UnlockPrice']),
        threshold = _d(j['ThresholdAmount']),
        unlocked = j['IsUnlocked'] == true,
        amountNeeded = _d(j['AmountNeeded']);
}

/// The server's bill for the current cart (see Backend services/CheckoutBill.js).
class CheckoutBill {
  final List<BillItem> items;

  /// Print-store files in the cart, and what they cost.
  final List<PrintJob> printItems;
  final double printTotal;
  final bool printOnly;
  final int itemCount;
  final double mrpTotal;
  final double itemsTotal;
  final double productSavings;
  final String? promoCode;
  final double couponDiscount;
  final String? couponMessage;
  final String? cartOfferName;
  final double cartOfferDiscount;
  final double deliveryFee;
  final bool freeDelivery;
  final double freeDeliveryThreshold;
  final double amountForFreeDelivery;
  final int tip;
  final List<int> tipPresets;
  final double walletBalance;
  final double walletUsable;
  final double walletApplied;
  final double toPay;
  final double totalSavings;
  final double freeDeliverySavings;
  final double minOrderValue;
  final bool minOrderMet;
  final double amountForMinOrder;
  final double minOrderForFullWallet;
  final double smallOrderWalletCap;
  final double cashbackEarned;
  final List<BillCoupon> applicableCoupons;
  final List<BillCoupon> suggestedCoupons;
  final List<BillUnlock> unlocks;
  final String? largeCartNotice;

  /// Delivery time for this cart and address (distance + items + fresh fruit).
  final int? etaMinutes;

  /// Nothing to order: no products and no prints.
  bool get isEmpty => items.isEmpty && printItems.isEmpty;

  /// Items that are out of stock or have fewer left than the cart asks for.
  List<BillItem> get stockProblems => items.where((i) => i.stockProblem).toList();

  CheckoutBill.fromJson(Map<String, dynamic> j)
      : items = _list(j['Items']).map((e) => BillItem.fromJson(e)).toList(),
        printItems = _list(j['PrintItems']).map((e) => PrintJob.fromJson(e)).toList(),
        printTotal = _d(j['PrintTotal']),
        printOnly = j['PrintOnly'] == true,
        itemCount = _i(j['ItemCount']),
        mrpTotal = _d(j['MRPTotal']),
        itemsTotal = _d(j['ItemsTotal']),
        productSavings = _d(j['ProductSavings']),
        promoCode = j['PromoCode'] is String ? j['PromoCode'] : null,
        couponDiscount = _d(j['CouponDiscount']),
        couponMessage = j['CouponMessage'] is String ? j['CouponMessage'] : null,
        cartOfferName = j['CartOffer'] is Map ? '${j['CartOffer']['OfferName'] ?? ''}' : null,
        cartOfferDiscount = _d(j['CartOfferDiscount']),
        deliveryFee = _d(j['DeliveryFee']),
        freeDelivery = j['FreeDeliveryApplied'] == true,
        freeDeliveryThreshold = _d(j['FreeDeliveryThreshold']),
        amountForFreeDelivery = _d(j['AmountForFreeDelivery']),
        tip = _i(j['Tip']),
        tipPresets = (j['TipPresets'] is List ? j['TipPresets'] as List : const []).map(_i).where((t) => t > 0).toList(),
        walletBalance = _d(j['WalletBalance']),
        walletUsable = _d(j['WalletUsable']),
        walletApplied = _d(j['WalletApplied']),
        toPay = _d(j['ToPay']),
        totalSavings = _d(j['TotalSavings']),
        freeDeliverySavings = _d(j['FreeDeliverySavings']),
        minOrderValue = _d(j['MinOrderValue']),
        minOrderMet = j['MinOrderMet'] == true,
        amountForMinOrder = _d(j['AmountForMinOrder']),
        minOrderForFullWallet = _d(j['WalletRule'] is Map ? j['WalletRule']['MinOrderForFullWallet'] : 0),
        smallOrderWalletCap = _d(j['WalletRule'] is Map ? j['WalletRule']['SmallOrderWalletCap'] : 0),
        cashbackEarned = _d(j['CashbackEarned']),
        applicableCoupons = _list(j['ApplicableCoupons']).map((e) => BillCoupon.fromJson(e)).toList(),
        suggestedCoupons = _list(j['SuggestedCoupons']).map((e) => BillCoupon.fromJson(e)).toList(),
        unlocks = _list(j['ProductUnlocks']).map((e) => BillUnlock.fromJson(e)).toList(),
        largeCartNotice = j['LargeCartNotice'] is String ? j['LargeCartNotice'] : null,
        etaMinutes = j['EtaMinutes'] is num ? (j['EtaMinutes'] as num).toInt() : null;

  static List<Map<String, dynamic>> _list(dynamic v) =>
      v is List ? v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList() : [];
}

class CheckoutResult {
  final bool ok;
  final String message;
  final int? orderId;
  final Map<String, dynamic> data;

  const CheckoutResult(this.ok, this.message, {this.orderId, this.data = const {}});
}

class CheckoutServices {
  static Future<CheckoutBill?> bill({
    String? promoCode,
    required double latitude,
    required double longitude,
    int tip = 0,
    bool useWallet = false,
  }) async {
    try {
      final response = await _client.post(
        Uri.parse('${Constants.baseUrl}/carts/bill'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          if (promoCode != null && promoCode.isNotEmpty) 'PromoCode': promoCode,
          'Latitude': latitude,
          'Longitude': longitude,
          'Tip': tip,
          'UseWallet': useWallet,
        }),
      );
      final data = jsonDecode(response.body);
      if (data is Map && data['Status'] == 1 && data['Bill'] is Map) {
        return CheckoutBill.fromJson(Map<String, dynamic>.from(data['Bill']));
      }
    } catch (e) {
      debugPrint('checkout bill failed: $e');
    }
    return null;
  }

  static Future<CheckoutResult> _post(String path, Map<String, dynamic> body) async {
    try {
      final response = await _client.post(
        Uri.parse('${Constants.baseUrl}$path'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );
      final data = jsonDecode(response.body);
      if (data is! Map) return const CheckoutResult(false, 'Something went wrong. Please try again.');
      final map = Map<String, dynamic>.from(data);
      return CheckoutResult(
        map['Status'] == 1,
        '${map['Message'] ?? (map['Status'] == 1 ? 'Done' : 'Something went wrong. Please try again.')}',
        orderId: map['OrderID'] is num ? (map['OrderID'] as num).toInt() : null,
        data: map,
      );
    } catch (e) {
      debugPrint('checkout $path failed: $e');
      return const CheckoutResult(false, 'Could not reach the store. Check your internet and try again.');
    }
  }

  /// Creates a Razorpay order for the server-calculated amount.
  static Future<CheckoutResult> createPayment(Map<String, dynamic> orderBody) =>
      _post('/orders/orderpayments', {...orderBody, 'Purpose': 'ORDER', 'Type': 2});

  static Future<CheckoutResult> placeOrder(Map<String, dynamic> orderBody) => _post('/orders/createorder', orderBody);
}
