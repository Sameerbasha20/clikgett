// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:flutter/material.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class IntroScreen1 extends StatefulWidget {
  const IntroScreen1({super.key});

  @override
  State<IntroScreen1> createState() => _IntroScreen1State();
}

class _IntroScreen1State extends State<IntroScreen1> {
  String text1 = "Shopping For Your Vegetable Needs";
  String text2 =
      "Vegetables are important sources of many nutrients. purchase fresh and quality vegetables with our app.";
  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image(
              image: AssetImage(
                intro1,
              ),
              height: 39.h,
              fit: BoxFit.cover),
          Padding(
            padding: EdgeInsets.symmetric(vertical: 4.h),
            child: customText(
              text: text1,
              fontSize: 19.sp,
              fontWeight: FontWeight.w600,
              textAlign: TextAlign.center,
            ),
          ),
          customText(
            text: text2,
            fontWeight: FontWeight.w500,
            textAlign: TextAlign.center,
            color: ordersPrimaryColor.withOpacity(.6),
          )
        ],
      ),
    );
  }
}
