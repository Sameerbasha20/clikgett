import 'dart:convert';
import 'package:fav_app/constants.dart';
import 'package:fav_app/new/NewModel/photo_order_model.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:http/http.dart' as http;

class PhotoOrdersService {
  static Future<Map<String, String>> _getHeaders() async {
    String token = await CommonServices.getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'token $token',
    };
  }

  /// Submit a photo order request
  static Future<Map<String, dynamic>> submitPhotoOrder({
    required String imageBase64,
    required String mimeType,
    String? customerNotes,
    int? deliveryAddressID,
    Map<String, dynamic>? deliveryAddressSnapshot,
  }) async {
    final headers = await _getHeaders();
    final url = Uri.parse('${Constants.baseUrl}/photo-orders/submit');

    final body = json.encode({
      'imageBase64': imageBase64,
      'mimeType': mimeType,
      'customerNotes': customerNotes,
      'deliveryAddressID': deliveryAddressID,
      'deliveryAddressSnapshot': deliveryAddressSnapshot,
    });

    final response = await http.post(url, headers: headers, body: body);
    return jsonDecode(response.body);
  }

  /// Fetch user's photo order requests
  static Future<List<PhotoOrderModel>> getMyPhotoOrders() async {
    final headers = await _getHeaders();
    final url = Uri.parse('${Constants.baseUrl}/photo-orders/my-requests');

    final response = await http.get(url, headers: headers);
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['Status'] == 1 && data['Requests'] != null) {
        return (data['Requests'] as List)
            .map((item) => PhotoOrderModel.fromJson(item))
            .toList();
      }
    }
    return [];
  }

  /// Fetch request details, proposed items, and timeline
  static Future<PhotoOrderModel?> getPhotoOrderDetail(int requestId) async {
    final headers = await _getHeaders();
    final url = Uri.parse('${Constants.baseUrl}/photo-orders/request/$requestId');

    final response = await http.get(url, headers: headers);
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['Status'] == 1 && data['Request'] != null) {
        Map<String, dynamic> combined = Map<String, dynamic>.from(data['Request']);
        combined['Items'] = data['Items'] ?? [];
        combined['Timeline'] = data['Timeline'] ?? [];
        return PhotoOrderModel.fromJson(combined);
      }
    }
    return null;
  }

  /// Customer accepts and confirms proposal
  static Future<Map<String, dynamic>> confirmProposal({
    required int requestId,
    String paymentMethod = 'COD',
    int? addressId,
  }) async {
    final headers = await _getHeaders();
    final url = Uri.parse('${Constants.baseUrl}/photo-orders/request/$requestId/confirm');

    final body = json.encode({
      'paymentMethod': paymentMethod,
      'addressId': addressId,
    });

    final response = await http.post(url, headers: headers, body: body);
    return jsonDecode(response.body);
  }

  /// Customer rejects proposal
  static Future<Map<String, dynamic>> rejectProposal({
    required int requestId,
    String? rejectionReason,
  }) async {
    final headers = await _getHeaders();
    final url = Uri.parse('${Constants.baseUrl}/photo-orders/request/$requestId/reject');

    final body = json.encode({
      'rejectionReason': rejectionReason,
    });

    final response = await http.post(url, headers: headers, body: body);
    return jsonDecode(response.body);
  }

  /// Customer cancels a request the store has not answered yet
  static Future<Map<String, dynamic>> cancelRequest({required int requestId}) async {
    final headers = await _getHeaders();
    final url = Uri.parse('${Constants.baseUrl}/photo-orders/request/$requestId/cancel');
    final response = await http.post(url, headers: headers);
    return jsonDecode(response.body);
  }
}
