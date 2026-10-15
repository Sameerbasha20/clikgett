import 'dart:convert';
import 'package:fav_app/new/NewModel/sale_model.dart';
import 'package:fav_app/old/Services/common/intercepter.dart';
import 'package:fav_app/old/constants.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

class SaleServices {
  static final Client _client =
      InterceptedClient.build(interceptors: [ApiInterceptor()]);

  /// Retrieves all currently active Flash Sale / Sale campaigns from the backend.
  /// Reuses existing GET /api/sales/getsales endpoint without duplicating systems.
  static Future<ActiveSaleResponse?> getActiveSales() async {
    try {
      final Uri uri = Uri.parse('${Constants.baseUrl}/sales/getsales');
      final response = await _client.get(uri);

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        return ActiveSaleResponse.fromJson(data);
      } else {
        debugPrint(
            'SaleServices: Failed to load sales, code: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      debugPrint('SaleServices: Exception fetching active sales: $e');
      return null;
    }
  }
}
