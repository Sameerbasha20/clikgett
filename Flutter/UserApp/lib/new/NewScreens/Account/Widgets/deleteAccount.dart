import 'package:fav_app/Constants/toast.dart';
import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

Future<void> deleteUserAndLogout(BuildContext context, token) async {
  var headers = {
    'Authorization': 'Bearer $token', // Replace with your auth token
  };

  var request = http.Request(
    'DELETE',
    Uri.parse('${Constants.baseUrl}/users/deleteuser'),
  );

  request.headers.addAll(headers);

  try {
    http.StreamedResponse response = await request.send();

    if (response.statusCode == 200) {
      final responseBody = await response.stream.bytesToString();
      print("Deleted: $responseBody");

      // Optionally clear shared prefs
      SharedPreferences prefs = await SharedPreferences.getInstance();
      await prefs.clear();

      // Navigate to Login and remove all previous routes
      if (context.mounted) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const Login()),
          (route) => false,
        );
      }
    } else {
      print("Failed: ${response.reasonPhrase}");
      if (context.mounted) {
        customToast(message: "Failed to delete account. Please try again.");
        // ScaffoldMessenger.of(context).showSnackBar(
        //   SnackBar(
        //       content: Text("Failed to delete account. Please try again.")),
        // );
      }
    }
  } catch (e) {
    print("Error: $e");
    if (context.mounted) {
      customToast(message: "An error occurred. Please try again.");

      // ScaffoldMessenger.of(context).showSnackBar(
      //   SnackBar(content: Text("An error occurred. Please try again.")),
      // );
    }
  }
}
