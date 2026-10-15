import 'dart:convert';
import 'package:fav_app/Models/Home/CheckTimingResponse.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;

import '../../constants.dart';

class TimingController extends GetxController {
  var timingResponse = CheckTimingResponse(status: 0, message: '').obs;
  var isLoading = false.obs;

  Future<void> checkTiming(String token) async {
    try {
      print('ssssssssssssssssssssssssssssssssssssssssssssssssss');
      isLoading.value = true;
      print('jfndkjfnd');
      print('Bodytoken: ${Constants.baseUrl}');

      final response = await http.get(
        Uri.parse('${Constants.baseUrl}/orders/checktiming'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );
      print('Mycccccccccccccc : ${response.body}');


      if (response.statusCode == 200) {
        print(CheckTimingResponse.fromJson(json.decode(response.body)));
        print("vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv");
        timingResponse.value =
            CheckTimingResponse.fromJson(json.decode(response.body));
        print("jjjjjjjjj${timingResponse.value}");
      } else {
        // Handle error
        // timingResponse.value = CheckTimingResponse(
        //     status: , message: 'Failed to fetch data');
      }

      isLoading.value = false;
    } catch (e) {
      print('Exception during API call: $e');
    }
  }
}
