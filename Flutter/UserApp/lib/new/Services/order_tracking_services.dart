import 'dart:convert';

import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Services/common/intercepter.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

final Client _client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

/// Order status codes (Backend utils/orderStatus.js).
class OrderStatus {
  static const received = 8;
  static const packing = 9;
  static const assigned = 2;
  static const outForDelivery = 5;
  static const arrived = 7;
  static const delivered = 1;
  static const cancelledByStore = 3;
  static const cancelledByCustomer = 4;
  static const returned = 6;

  static const finalStatuses = [delivered, cancelledByStore, cancelledByCustomer, returned];
  static const progress = [received, packing, assigned, outForDelivery, arrived, delivered];

  static bool isFinal(int s) => finalStatuses.contains(s);
  static bool isCancelled(int s) => s == cancelledByStore || s == cancelledByCustomer || s == returned;

  /// Customer-facing name of each step.
  static String title(int s) {
    switch (s) {
      case received:
        return 'Order placed';
      case packing:
        return 'Packing your order';
      case assigned:
        return 'Delivery partner assigned';
      case outForDelivery:
        return 'Out for delivery';
      case arrived:
        return 'Delivery partner has arrived';
      case delivered:
        return 'Delivered';
      case cancelledByStore:
        return 'Cancelled by store';
      case cancelledByCustomer:
        return 'Cancelled';
      case returned:
        return 'Returned';
    }
    return 'Order update';
  }

  /// One-line message for order lists and the home strip.
  static String message(int s) {
    switch (s) {
      case received:
        return 'Order received. The store will start packing soon.';
      case packing:
        return 'Your items are being packed.';
      case assigned:
        return 'A delivery partner will pick up your order shortly.';
      case outForDelivery:
        return 'Your order is on the way.';
      case arrived:
        return 'Your delivery partner has arrived. Share the OTP to receive it.';
      case delivered:
        return 'Order delivered. Thank you for choosing ClikGett!';
      case cancelledByStore:
        return 'Cancelled by the store.';
      case cancelledByCustomer:
        return 'Order cancelled.';
      case returned:
        return 'Order returned.';
    }
    return 'Order update';
  }
}

double _d(dynamic v) => v is num ? v.toDouble() : double.tryParse('${v ?? ''}') ?? 0;
int _i(dynamic v) => v is num ? v.toInt() : int.tryParse('${v ?? ''}') ?? 0;

/// Server times are store wall-clock times; ignore the "Z" the DB driver adds.
DateTime? _date(dynamic v) {
  if (v == null) return null;
  final s = '$v'.trim();
  if (s.isEmpty || s == 'NA') return null;
  return DateTime.tryParse(s.replaceAll('Z', '').replaceFirst('T', ' '));
}

String? _text(dynamic v) {
  final s = '${v ?? ''}'.trim();
  return s.isEmpty || s == 'NA' || s == 'null' ? null : s;
}

class TrackedItem {
  final String name;
  final String unit;
  final String imageUrl;
  final int quantity;
  final double price;
  final double offerPrice;

  TrackedItem.fromJson(Map<String, dynamic> j)
      : name = '${j['ProductName'] ?? ''}'.trim(),
        unit = _unit(j),
        imageUrl = _image(j),
        quantity = _i(j['Quantity']),
        price = _d(j['Price']),
        offerPrice = _d(j['OfferPrice'] ?? j['Price']);

  static String _unit(Map j) {
    final v = _d(j['metricvalue']);
    final t = '${j['metrictype'] ?? ''}'.trim();
    if (v == 0 && t.isEmpty) return '';
    return '${v == v.roundToDouble() ? v.toInt() : v} $t'.trim();
  }

  static String _image(Map j) {
    final url = '${j['ImageUrl'] ?? ''}';
    if (url.startsWith('http')) return url;
    final images = j['ProductImages'];
    if (images is List && images.isNotEmpty && '${images.first}'.startsWith('http')) return '${images.first}';
    return '';
  }
}

class TimelineEntry {
  final int status;
  final DateTime? at;
  TimelineEntry(this.status, this.at);
}

class TrackedOrder {
  final int orderId;
  final String number;
  final int status;
  final String statusLabel;
  final DateTime? createdAt;
  final DateTime? estimate;
  final DateTime? deliveredAt;
  final int? etaMinutesLeft;
  final int cancelSecondsLeft;
  final bool scheduled;
  final DateTime? scheduledAt;
  final String? otp;
  final String? riderName;
  final String? riderPhone;
  final List<TimelineEntry> timeline;
  final List<TrackedItem> items;
  final List<String> removedItems;
  final double subTotal;
  final double discount;
  final double deliveryFee;
  final double tip;
  final double walletUsed;
  final double grandTotal;
  final String? promoCode;
  final String paymentMethod;
  final bool paid;
  final String? refundStatus;
  final String? cancellationReason;
  final String address;
  final List<String> instructions;

  TrackedOrder.fromJson(Map<String, dynamic> j)
      : orderId = _i(j['OrderID']),
        number = '${j['OrderSequence'] ?? j['OrderID'] ?? ''}',
        status = _i(j['OrderStatus']),
        statusLabel = '${j['StatusLabel'] ?? ''}',
        createdAt = _date(j['CreatedAt']),
        estimate = _date(j['EstimateDateTime']),
        deliveredAt = _date(j['Delivered_Cancelled_datetime'] ?? j['deliveredDateTime']),
        etaMinutesLeft = j['EtaMinutesLeft'] is num ? (j['EtaMinutesLeft'] as num).toInt() : null,
        cancelSecondsLeft = _i(j['CancelSecondsLeft']),
        scheduled = '${j['ScheduleStatus'] ?? ''}' == 'Scheduled',
        scheduledAt = _date(j['ScheduledDateTime']),
        otp = _text(j['OTP']),
        riderName = j['Rider'] is Map ? _text(j['Rider']['Name']) : null,
        riderPhone = j['Rider'] is Map ? _text(j['Rider']['Phone']) : null,
        timeline = (j['Timeline'] is List ? j['Timeline'] as List : const [])
            .whereType<Map>()
            .map((e) => TimelineEntry(_i(e['OrderStatus']), _date(e['CreatedAt'])))
            .toList(),
        items = (j['orderitems'] is List ? j['orderitems'] as List : const [])
            .whereType<Map>()
            .map((e) => TrackedItem.fromJson(Map<String, dynamic>.from(e)))
            .toList(),
        removedItems = (j['RemovedItems'] is List ? j['RemovedItems'] as List : const [])
            .whereType<Map>()
            .map((e) => '${e['ProductName'] ?? ''} × ${e['Quantity'] ?? ''}'.trim())
            .toList(),
        subTotal = _d(j['SubTotal']),
        discount = _d(j['PromoAmount']),
        deliveryFee = _d(j['DeliverCharges']),
        tip = _d(j['TipAmount']),
        walletUsed = _d(j['WalletAmount']),
        grandTotal = _d(j['GrandTotal']),
        promoCode = _text(j['PromoCode']),
        paymentMethod = '${j['PaymentMethod'] ?? 'COD'}'.toUpperCase(),
        paid = '${j['PaymentStatus']}' == '1',
        refundStatus = _text(j['RefundStatus']),
        cancellationReason = _text(j['CancellationReason']),
        address = [j['FlatNo'], j['Address'], j['LandMark']].map(_text).whereType<String>().join(', '),
        instructions = (j['DeliveryInstructions'] is List ? j['DeliveryInstructions'] as List : const [])
            .map((e) => '$e')
            .where((e) => e.isNotEmpty)
            .toList();

  /// When each status was first reached.
  DateTime? reachedAt(int s) {
    for (final t in timeline) {
      if (t.status == s) return t.at;
    }
    if (s == OrderStatus.received) return createdAt;
    return null;
  }
}

class ActionResult {
  final bool ok;
  final String message;
  const ActionResult(this.ok, this.message);
}

class OrderTrackingServices {
  static Future<TrackedOrder?> fetch(int orderId) async {
    try {
      final response = await _client.get(Uri.parse('${Constants.baseUrl}/orders/myorder/$orderId'));
      final data = jsonDecode(response.body);
      if (data is Map && data['Status'] == 1 && data['Orders'] is Map && (data['Orders'] as Map).isNotEmpty) {
        return TrackedOrder.fromJson(Map<String, dynamic>.from(data['Orders']));
      }
    } catch (e) {
      debugPrint('fetch order $orderId failed: $e');
    }
    return null;
  }

  static Future<ActionResult> _send(String method, String path, Map<String, dynamic> body) async {
    try {
      final uri = Uri.parse('${Constants.baseUrl}$path');
      final headers = {'Content-Type': 'application/json'};
      final response = method == 'PUT'
          ? await _client.put(uri, headers: headers, body: jsonEncode(body))
          : await _client.post(uri, headers: headers, body: jsonEncode(body));
      final data = jsonDecode(response.body);
      if (data is Map) return ActionResult(data['Status'] == 1, '${data['Message'] ?? ''}');
    } catch (e) {
      debugPrint('$path failed: $e');
    }
    return const ActionResult(false, 'Could not reach the store. Please try again.');
  }

  static Future<ActionResult> cancel(int orderId, String reason) =>
      _send('PUT', '/orders/cancelorderuser/$orderId', {'CancellationReason': reason});

  /// Replaces the cart with this order's items that are still in stock.
  static Future<ActionResult> reorder(int orderId) => _send('POST', '/orders/reorder', {'OrderID': orderId});
}
