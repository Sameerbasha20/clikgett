import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:fav_app/old/Services/common/interneet_error.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class Network {
  static Future networkCheck(BuildContext context) async {
    debugPrint('Checking connectivity...');
    var connectivityResult = await Connectivity().checkConnectivity();
    if (connectivityResult == ConnectivityResult.mobile ||
        connectivityResult == ConnectivityResult.wifi) {
      debugPrint("Connected");
      return true;
    } else {
      debugPrint("No connection");
      showDialog(
        barrierDismissible: false,
        context: context,
        builder: (_) => InternetError(),
      ).then(
        (value) => value == true ? networkCheck(context) : exit(0),
      );
    }
  }
}
