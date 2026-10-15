import 'package:fav_app/Constants/colors.dart';
import 'package:flutter/material.dart';

class InternetError extends StatefulWidget {
  @override
  State<StatefulWidget> createState() => _InternetError();
}

class _InternetError extends State<InternetError> {
  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
        color: Colors.transparent,
        child: AlertDialog(
          title: const Text(
            'No Internet Connection',
            style: TextStyle(
                fontSize: 18, fontWeight: FontWeight.w500, color: primaryColor),
          ),
          actions: <Widget>[
            TextButton(
              child: const Text(
                'Retry',
                style: TextStyle(fontSize: 16, color: primaryColor),
              ),
              onPressed: () {
                Navigator.of(context).pop(true);
              },
            ),
          ],
        ));
  }
}
