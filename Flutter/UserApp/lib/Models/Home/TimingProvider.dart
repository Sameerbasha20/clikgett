import 'dart:convert';
import 'package:fav_app/Models/Home/CheckTimingResponse.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;

import '../../constants.dart';

class TimingController extends GetxController {
  // Treated as open until the server says otherwise, so the "closed" banner
  // never shows while loading or when the check itself fails.
  var timingResponse = CheckTimingResponse(status: 1, message: '').obs;
  var isLoading = false.obs;

  Future<void> checkTiming(String token) async {
    isLoading.value = true;
    try {
      final response = await http.get(
        Uri.parse('${Constants.baseUrl}/orders/checktiming'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        timingResponse.value = CheckTimingResponse.fromJson(json.decode(response.body));
      }
    } catch (e) {
      print('checkTiming failed: $e');
    } finally {
      isLoading.value = false;
    }
  }
}
