import 'dart:async';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/ViewModels/Auth/user_data_viewmodel.dart';
import 'package:fav_app/old/constants.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class SplashScreen extends StatefulWidget {
  SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  UserViewModel? userViewModel;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async => {
          if (userViewModel != null)
            {
              userViewModel!.getUserDataFromLocal(),
            },
          startTime(),
        });
  }

  startTime() async {
    var _duration = const Duration(seconds: 1);
    return Timer(_duration, () {
      Navigator.pushReplacementNamed(
        context,
        userViewModel!.userDetails == null
            ? Constants().loginScreen
            : Constants().homePage,
      );

      // Navigator.pushNamed(context, Constants().loginScreen);
    });
  }

  @override
  Widget build(BuildContext context) {
    var size = MediaQuery.of(context).size;
    if (mounted) {
      userViewModel = context.watch<UserViewModel>();
    }
    return Material(
      child: SafeArea(
        child: Scaffold(
          body: Container(
            height: size.height,
            width: size.width,
            decoration:
                BoxDecoration(gradient: LinearGradient(colors: lGColor)),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                images(height: size.height, width: size.width),
                SizedBox(
                  height: size.height * .03,
                ),
                Center(
                  child: Image.asset(
                    'Assets/Images/fav_App_logo_bottom.png',
                    // height: size.height,
                    width: double.infinity,
                    fit: BoxFit.contain,
                  ),
                )
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget images({double? height, double? width, Widget? child}) {
    return Center(
        child: child ??
            Image.asset(
              'Assets/Images/fav_App_logo.png',
              height: height! * .35,
              width: double.infinity,
              fit: BoxFit.contain,
            ));
  }
}
