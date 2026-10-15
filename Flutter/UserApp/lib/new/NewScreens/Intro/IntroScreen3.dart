import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:flutter/material.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../Constants/colors.dart';

class IntroScreen3 extends StatefulWidget {
  const IntroScreen3({super.key});

  @override
  State<IntroScreen3> createState() => _IntroScreen3State();
}

class _IntroScreen3State extends State<IntroScreen3> {
  String text1 = "Eat Food That Is Healthy For You";
  String text2 =
      "Vitamin k is essential for healthy body and for strong bones. it improves how well the body absorbs calcium";
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image(
              image: AssetImage(
                intro3,
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
