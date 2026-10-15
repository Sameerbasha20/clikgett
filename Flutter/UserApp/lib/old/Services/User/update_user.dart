import 'dart:convert';
import 'package:fav_app/old/Models/Users/usersDetails.dart';
import 'package:fav_app/old/Models/response_model.dart';
import 'package:fav_app/old/Services/common/intercepter.dart';
import 'package:fav_app/old/constants.dart';
import 'package:flutter/cupertino.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class UsersServices {
  static Future updateeuser(body) {
    return client
        .put(Uri.parse('${Constants.baseUrl}/users/update'),
            body: json.encode(body))
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }

  // static Future getuserDetails() {
  //   return client
  //       .get(
  //     Uri.parse('${Constants.baseUrl}/users/detail'),
  //   )
  //       .then((response) {
  //     return UserDetailsModel.fromJson(jsonDecode(response.body));
  //   });
  // }

  static Future<UserDetailsModel> getuserDetails() async {
    try {
      final response = await client.get(
        Uri.parse('${Constants.baseUrl}/users/detail'),
      );

      if (response.statusCode == 200) {
        return UserDetailsModel.fromJson(jsonDecode(response.body));
      } else {
        throw Exception(
            'Failed to fetch user details. Status code: ${response.statusCode}');
      }
    } catch (error) {
      // debugPrint('Error in getuserDetails: $error');
      throw Exception('An error occurred while fetching user details: $error');
    }
  }
}
