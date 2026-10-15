import 'package:auto_size_text/auto_size_text.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:flutter/material.dart';

Widget buttonWidget(
    {Color? buttonColor,
    Color? textColor,
    double? fontSize,
    Function? onTap,
    required String text,
    double? width,
    FontWeight? fontWeight,
    BorderRadiusGeometry? borderRadius,
    BoxBorder? border,
    Widget? child,
    double? height}) {
  return InkWell(
    onTap: onTap as void Function()?,
    child: Container(
      alignment: Alignment.center,
      width: width ?? double.maxFinite,
      height: height ?? 45,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
          border: border,
          color: buttonColor ?? tWhite,
          borderRadius: borderRadius ?? BorderRadius.circular(25)),
      child: child ??
          AutoSizeText(
            text,
            style: onButtonTextStyle(
                color: textColor ?? tButtontextcolor,
                fontSize: fontSize ?? 20,
                fontWeight: fontWeight ?? FontWeight.w400),
          ),
    ),
  );
}

Widget loadingButton({double? height, Color? color}) {
  return Container(
    alignment: Alignment.center,
    height: height ?? 45,
    child: CircularProgressIndicator(
      color: color ?? primaryColor,
    ),
  );
}
