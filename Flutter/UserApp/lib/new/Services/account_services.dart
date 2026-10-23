import 'dart:convert';

import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Services/common/intercepter.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';
import 'package:fav_app/new/Services/common/server_date.dart';

final Client _client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

double _d(dynamic v) => v is num ? v.toDouble() : double.tryParse('${v ?? ''}') ?? 0;
int _i(dynamic v) => v is num ? v.toInt() : int.tryParse('${v ?? ''}') ?? 0;
DateTime? _date(dynamic v) => serverDate(v);

class FaqEntry {
  final String question;
  final String answer;
  const FaqEntry(this.question, this.answer);
}

class FaqGroup {
  final String title;
  final List<FaqEntry> entries;
  const FaqGroup(this.title, this.entries);
}

/// Store settings managed from admin Settings (/account/config).
class AppConfig {
  final String supportPhone;
  final String supportEmail;
  final List<int> walletTopupAmounts;
  final double minOrderValue;
  final double freeDeliveryAbove;
  final double referrerReward;
  final double friendReward;
  final String razorpayKey;
  final List<FaqGroup> faqs;

  const AppConfig({
    this.supportPhone = '',
    this.supportEmail = '',
    this.walletTopupAmounts = const [100, 200, 500, 1000],
    this.minOrderValue = 0,
    this.freeDeliveryAbove = 0,
    this.referrerReward = 0,
    this.friendReward = 0,
    this.razorpayKey = '',
    this.faqs = const [],
  });

  factory AppConfig.fromJson(Map<String, dynamic> j) {
    final topups = (j['WalletTopupAmounts'] is List ? j['WalletTopupAmounts'] as List : const []).map(_i).where((v) => v > 0).toList();
    return AppConfig(
      supportPhone: '${j['SupportPhone'] ?? ''}'.trim(),
      supportEmail: '${j['SupportEmail'] ?? ''}'.trim(),
      walletTopupAmounts: topups.isEmpty ? const [100, 200, 500, 1000] : topups,
      minOrderValue: _d(j['MinOrderValue']),
      freeDeliveryAbove: _d(j['FreeDeliveryAbove']),
      referrerReward: _d(j['ReferrerReward']),
      friendReward: _d(j['FriendReward']),
      razorpayKey: '${j['RazorpayKey'] ?? ''}',
      faqs: (j['FAQs'] is List ? j['FAQs'] as List : const [])
          .whereType<Map>()
          .map((g) => FaqGroup(
                '${g['category'] ?? ''}',
                (g['questions'] is List ? g['questions'] as List : const [])
                    .whereType<Map>()
                    .map((q) => FaqEntry('${q['q'] ?? ''}', '${q['a'] ?? ''}'))
                    .where((e) => e.question.isNotEmpty)
                    .toList(),
              ))
          .where((g) => g.entries.isNotEmpty)
          .toList(),
    );
  }
}

class ReferralInfo {
  final String? code;
  final double referrerReward;
  final double friendReward;
  final double minOrderValue;
  final int friendsJoined;
  final int friendsOrdered;
  final double earned;

  ReferralInfo.fromJson(Map<String, dynamic> j)
      : code = j['Code'] is String && '${j['Code']}'.isNotEmpty ? j['Code'] : null,
        referrerReward = _d(j['ReferrerReward']),
        friendReward = _d(j['FriendReward']),
        minOrderValue = _d(j['MinOrderValue']),
        friendsJoined = _i(j['FriendsJoined']),
        friendsOrdered = _i(j['FriendsOrdered']),
        earned = _d(j['Earned']);
}

class MembershipPlan {
  final int id;
  final String name;
  final int days;
  final double price;
  final bool freeDelivery;
  final double extraCashback;
  final bool exclusiveCoupons;
  final bool priority;

  MembershipPlan.fromJson(Map<String, dynamic> j)
      : id = _i(j['PlanID']),
        name = '${j['PlanName'] ?? ''}',
        days = _i(j['DurationDays']),
        price = _d(j['Price']),
        freeDelivery = _i(j['FreeDelivery']) == 1,
        extraCashback = _d(j['ExtraCashbackPercentage']),
        exclusiveCoupons = _i(j['ExclusiveCoupons']) == 1,
        priority = _i(j['PriorityCustomer']) == 1;
}

class ActiveMembership {
  final int planId;
  final String planName;
  final DateTime? endDate;

  ActiveMembership.fromJson(Map<String, dynamic> j)
      : planId = _i(j['PlanID']),
        planName = '${j['PlanName'] ?? ''}',
        endDate = _date(j['EndDate']);
}

class MembershipPage {
  final List<MembershipPlan> plans;
  final ActiveMembership? current;
  const MembershipPage(this.plans, this.current);
}

/// A product request or an enquiry the customer sent.
class CustomerRequest {
  final int id;
  final String title;
  final String details;
  final String status;
  final String? adminReply;
  final DateTime? createdAt;

  const CustomerRequest(this.id, this.title, this.details, this.status, this.adminReply, this.createdAt);
}

class ApiResult {
  final bool ok;
  final String message;
  final Map<String, dynamic> data;
  const ApiResult(this.ok, this.message, [this.data = const {}]);
}

class AccountServices {
  static AppConfig? _config;

  /// Cached for the session; [refresh] forces a reload.
  static Future<AppConfig> config({bool refresh = false}) async {
    if (_config != null && !refresh) return _config!;
    try {
      final response = await _client.get(Uri.parse('${Constants.baseUrl}/account/config'));
      final data = jsonDecode(response.body);
      if (data is Map && data['Status'] == 1 && data['Config'] is Map) {
        _config = AppConfig.fromJson(Map<String, dynamic>.from(data['Config']));
      }
    } catch (e) {
      debugPrint('app config failed: $e');
    }
    return _config ?? const AppConfig();
  }

  /// Razorpay key from the server, so it always matches the server's secret.
  static Future<String> razorpayKey() async {
    final key = (await config()).razorpayKey;
    return key.isNotEmpty ? key : Constants.razorPayKey;
  }

  static Future<Map<String, dynamic>?> _get(String path) async {
    try {
      final response = await _client.get(Uri.parse('${Constants.baseUrl}$path'));
      final data = jsonDecode(response.body);
      if (data is Map && data['Status'] == 1) return Map<String, dynamic>.from(data);
    } catch (e) {
      debugPrint('$path failed: $e');
    }
    return null;
  }

  static Future<ApiResult> _post(String path, Map<String, dynamic> body) async {
    try {
      final response = await _client.post(
        Uri.parse('${Constants.baseUrl}$path'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );
      final data = jsonDecode(response.body);
      if (data is Map) {
        final map = Map<String, dynamic>.from(data);
        return ApiResult(map['Status'] == 1, '${map['Message'] ?? ''}', map);
      }
    } catch (e) {
      debugPrint('$path failed: $e');
    }
    return const ApiResult(false, 'Could not reach the store. Please try again.');
  }

  static Future<ReferralInfo?> referral() async {
    final data = await _get('/account/referral');
    return data != null && data['Referral'] is Map ? ReferralInfo.fromJson(Map<String, dynamic>.from(data['Referral'])) : null;
  }

  static Future<MembershipPage?> membershipPlans() async {
    final data = await _get('/account/membership/plans');
    if (data == null) return null;
    final plans = (data['Plans'] is List ? data['Plans'] as List : const [])
        .whereType<Map>()
        .map((e) => MembershipPlan.fromJson(Map<String, dynamic>.from(e)))
        .toList();
    final current = data['Current'] is Map ? ActiveMembership.fromJson(Map<String, dynamic>.from(data['Current'])) : null;
    return MembershipPage(plans, current);
  }

  static Future<ApiResult> buyMembership(int planId) => _post('/account/membership/buy', {'PlanID': planId});

  static Future<ApiResult> confirmMembership(Map<String, dynamic> body) => _post('/account/membership/confirm', body);

  /// Creates a Razorpay order for a wallet top-up.
  static Future<ApiResult> startTopup(int amount) => _post('/orders/orderpayments', {'OrderAmount': amount, 'Type': 2, 'Purpose': 'WALLET'});

  static Future<ApiResult> confirmTopup(Map<String, dynamic> body) => _post('/users/add_wallet_money', body);

  static Future<List<CustomerRequest>> myProductRequests() async {
    final data = await _get('/customer/product-requests/my');
    return (data?['Requests'] is List ? data!['Requests'] as List : const []).whereType<Map>().map((e) {
      final j = Map<String, dynamic>.from(e);
      return CustomerRequest(
        _i(j['RequestID']),
        '${j['ProductName'] ?? 'Product request'}',
        [j['Brand'], j['SizeOrQty'], j['Description']].where((v) => v != null && '$v'.trim().isNotEmpty && '$v' != 'NA').join(' · '),
        '${j['Status'] ?? 'pending'}',
        j['AdminNotes'] is String && '${j['AdminNotes']}'.trim().isNotEmpty ? j['AdminNotes'] : null,
        _date(j['CreatedAt']),
      );
    }).toList();
  }

  static Future<List<CustomerRequest>> myEnquiries() async {
    final data = await _get('/customer/enquiries/my');
    return (data?['Enquiries'] is List ? data!['Enquiries'] as List : const []).whereType<Map>().map((e) {
      final j = Map<String, dynamic>.from(e);
      return CustomerRequest(
        _i(j['EnquiryID']),
        '${j['Subject'] ?? j['Category'] ?? 'Enquiry'}',
        '${j['Description'] ?? ''}',
        '${j['Status'] ?? 'open'}',
        j['AdminNotes'] is String && '${j['AdminNotes']}'.trim().isNotEmpty ? j['AdminNotes'] : null,
        _date(j['CreatedAt']),
      );
    }).toList();
  }
}
