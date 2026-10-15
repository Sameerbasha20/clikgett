// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:flutter/material.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

Widget buttonWidget(
    {required void Function() onTap,
    required BuildContext context,
    required String text,
    double? width,
    double? height,
    double? borderWidth,
    Color? buttonColor,
    Color? textColor,
    double? fontSize,
    FontWeight? fontWeight,
    Color? borderColor,
    double? borderRadius}) {
  return MaterialButton(
    elevation: 0,
    minWidth: width ?? 90.w,
    height: height ?? 6.2.h,
    visualDensity: VisualDensity.adaptivePlatformDensity,
    shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(borderRadius ?? 1.h),
        side:
            BorderSide(color: borderColor ?? primary, width: borderWidth ?? 1)),
    color: buttonColor ?? primary,
    textColor: textColor ?? white,
    onPressed: onTap,
    child: customText(
      text: text,
      color: textColor ?? white,
      fontSize: fontSize ?? 18.sp,
      fontWeight: fontWeight ?? FontWeight.w600,
    ),
  );
}

Widget iconbuttonWidget({
  required BuildContext context,
  required Widget icon,
  required String text,
  required Function() onTap,
  double? width,
  double? height,
  double? borderRadius,
  Color? buttonColor,
  Color? textColor,
  Color? borderColor,
  double? fontSize,
  FontWeight? fontWeight,
}) {
  return MaterialButton(
      elevation: 0,
      minWidth: width ?? 90.w,
      height: height ?? 5.5.h,
      visualDensity: VisualDensity.adaptivePlatformDensity,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadius ?? 1.h),
          side: BorderSide(color: borderColor ?? primary)),
      color: buttonColor ?? primary,
      textColor: textColor ?? white,
      onPressed: onTap,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        // ignore: prefer_const_literals_to_create_immutables
        children: [
          // ImageIcon(AssetImage(icon!)),
          icon,
          const SizedBox(
            width: 6,
          ),
          customText(
            text: text,
            color: textColor ?? white,
            fontSize: fontSize ?? 18.sp,
            fontWeight: fontWeight ?? FontWeight.w600,
          ),
        ],
      ));
}
