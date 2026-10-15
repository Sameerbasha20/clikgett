import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:flutter/material.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../Constants/colors.dart';

class IntroScreen2 extends StatefulWidget {
  const IntroScreen2({super.key});

  @override
  State<IntroScreen2> createState() => _IntroScreen2State();
}

class _IntroScreen2State extends State<IntroScreen2> {
  String text1 = "Fresh And Organic Fruits";
  String text2 =
      "Provides higher nutrition in fruits that are beneficial for human heath are naturally produced by plants.";

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
                intro2,
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
          ),
        ],
      ),
    );
  }
}
