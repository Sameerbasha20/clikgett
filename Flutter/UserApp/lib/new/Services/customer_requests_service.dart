import 'dart:convert';
import 'package:fav_app/constants.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:http/http.dart' as http;

class CustomerRequestsService {
  static Future<Map<String, String>> _getHeaders() async {
    String token = await CommonServices.getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'token $token',
    };
  }

  /// Submit customer support enquiry or product request
  static Future<Map<String, dynamic>> submitEnquiry({
    required String description,
    String? subject,
    String? name,
    String? mobileNumber,
    String? category,
    String? productName,
    String? brand,
    String? sizeOrQty,
    String? imageBase64,
    String? mimeType,
    /// Up to 3 photos: [{'imageBase64': ..., 'mimeType': ...}].
    List<Map<String, String>> images = const [],
  }) async {
    final headers = await _getHeaders();
    final url = Uri.parse('${Constants.baseUrl}/customer/enquiries');

    final body = json.encode({
      'description': description,
      'subject': subject,
      'name': name,
      'mobileNumber': mobileNumber,
      'category': category,
      'productName': productName,
      'brand': brand,
      'sizeOrQty': sizeOrQty,
      'imageBase64': imageBase64 ?? (images.isNotEmpty ? images.first['imageBase64'] : null),
      'mimeType': mimeType ?? (images.isNotEmpty ? images.first['mimeType'] : null),
      if (images.isNotEmpty) 'images': images,
    });

    final response = await http.post(url, headers: headers, body: body);
    return jsonDecode(response.body);
  }

  /// Submit unavailable product request (with optional photo)
  static Future<Map<String, dynamic>> submitProductRequest({
    required String productName,
    String? brand,
    String? sizeOrQty,
    String? description,
    String? imageBase64,
    String? mimeType,
  }) async {
    final headers = await _getHeaders();
    final url = Uri.parse('${Constants.baseUrl}/customer/product-requests');

    final body = json.encode({
      'productName': productName,
      'brand': brand,
      'sizeOrQty': sizeOrQty,
      'description': description,
      'imageBase64': imageBase64,
      'mimeType': mimeType,
    });

    final response = await http.post(url, headers: headers, body: body);
    return jsonDecode(response.body);
  }

  /// Fetch user's submitted product requests
  static Future<List<dynamic>> getMyProductRequests() async {
    final headers = await _getHeaders();
    final url = Uri.parse('${Constants.baseUrl}/customer/product-requests/my');

    final response = await http.get(url, headers: headers);
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['Status'] == 1 && data['Requests'] != null) {
        return data['Requests'] as List<dynamic>;
      }
    }
    return [];
  }
}
