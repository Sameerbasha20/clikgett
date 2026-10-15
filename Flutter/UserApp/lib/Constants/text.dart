import 'package:auto_size_text/auto_size_text.dart';
import 'package:fav_app/Constants/colors.dart';
import 'package:flutter/material.dart';

AutoSizeText constantText(
    {String? text,
    TextStyle? textStyle,
    List<InlineSpan>? children,
    TextAlign? textAlign}) {
  return AutoSizeText.rich(
    TextSpan(
      text: text,
      style: textStyle ?? headingStyle(),
      children: children,
    ),
    textAlign: textAlign,
  );
}

TextStyle headingStyle(
    {Color? color,
    TextDecoration? decoration,
    double? fontSize,
    FontWeight? fontWeight,
    String? fontFamily}) {
  return TextStyle(
    decoration: decoration,
    fontWeight: fontWeight ?? FontWeight.w400,
    fontSize: fontSize ?? 20,
    color: color ?? tWhite,
    fontFamily: fontFamily ?? 'Roboto',
  );
}

TextStyle onButtonTextStyle(
    {Color? color, double? fontSize, FontWeight? fontWeight}) {
  return TextStyle(
    fontWeight: fontWeight ?? FontWeight.bold,
    fontSize: fontSize ?? 14,
    color: color ?? tButtontextcolor,
    fontFamily: 'Roboto',
  );
}

TextStyle textFieldTextStyle(
    {Color? color,
    double? fontSize,
    FontWeight? fontWeight,
    String? fontFamily}) {
  return TextStyle(
    fontWeight: fontWeight ?? FontWeight.w600,
    fontSize: fontSize ?? 14,
    color: color ?? tBlack,
    fontFamily: fontFamily ?? 'Space Grotesk',
  );
}

TextStyle normalTextstyle(
    {Color? color,
    double? fontSize,
    FontWeight? fontWeight,
    TextDecoration? decoration,
    String? fontFamily}) {
  return TextStyle(
      fontWeight: fontWeight ?? FontWeight.w400,
      fontSize: fontSize ?? 16,
      color: color ?? tButtontextcolor,
      decoration: decoration ?? TextDecoration.none,
      fontFamily: fontFamily ?? 'proximaNova');
}
