// ignore_for_file: must_be_immutable

import 'package:auto_size_text/auto_size_text.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

AutoSizeText constantText(
    {String? text,
    TextStyle? textStyle,
    List<InlineSpan>? children,
    TextAlign? textAlign}) {
  return AutoSizeText.rich(
    TextSpan(
      text: text,
      style: textStyle ?? customTextstyle(),
      children: children,
    ),
    textAlign: textAlign,
  );
}

// ignore: camel_case_types
class customText extends StatelessWidget {
  customText(
      {Key? key,
      required this.text,
      this.color,
      this.fontSize,
      this.fontWeight,
      this.decorationColor,
      this.shadows,
      this.decoration,
      this.extrafontStyle,
      this.textAlign,
      this.overflow,
      this.maxLines})
      : super(key: key);
  final String text;
  final Color? color;
  final double? fontSize;
  final int? maxLines;
  TextDecoration? decoration;
  final TextAlign? textAlign;
  List<Shadow>? shadows;
  final TextOverflow? overflow;
  Color? decorationColor;
  TextStyle? extrafontStyle;
  final FontWeight? fontWeight;

  @override
  Widget build(BuildContext context) {
    double? resolvedSize = fontSize;
    if (resolvedSize != null && resolvedSize < 6.0) {
      resolvedSize = 14.5.sp;
    }
    return AutoSizeText(text,
        textAlign: textAlign,
        overflow: overflow,
        maxLines: maxLines,
        style: GoogleFonts.poppins(
            decoration: decoration,
            shadows: shadows,
            decorationThickness: 1,
            color: color ?? ordersPrimaryColor,
            decorationColor: decorationColor,
            textStyle: extrafontStyle,
            fontSize: resolvedSize ?? 15.sp,
            fontWeight: fontWeight ?? FontWeight.w500));
  }
}

TextStyle customTextstyle({
  Color? color,
  double? fontSize,
  FontWeight? fontWeight,
  String? fontFamily,
  TextDecoration? textDecoration,
}) {
  return GoogleFonts.poppins(
    color: color ?? ordersPrimaryColor,
    fontSize: fontSize ?? 15.sp,
    fontWeight: fontWeight ?? FontWeight.w500,
    decoration: textDecoration,
  );
}

TextStyle robotocustomTextstyle(
    {Color? color,
    double? fontSize,
    FontWeight? fontWeight,
    String? fontFamily,
    TextDecoration? textDecoration}) {
  return GoogleFonts.montserrat(
    color: color ?? ordersPrimaryColor,
    fontSize: fontSize ?? 15.sp,
    fontWeight: fontWeight ?? FontWeight.w600,
    decoration: textDecoration,
  );
}

TextStyle segoecustomTextstyle(
    {Color? color,
    TextDecoration? decoration,
    double? fontSize,
    FontWeight? fontWeight,
    String? fontFamily}) {
  return GoogleFonts.poppins(
    color: color ?? ordersPrimaryColor,
    fontSize: fontSize ?? 15.sp,
    fontWeight: fontWeight ?? FontWeight.w500,
  );
}
