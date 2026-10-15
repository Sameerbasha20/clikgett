import 'package:auto_size_text/auto_size_text.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

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
    return AutoSizeText(text,
        textAlign: textAlign,
        overflow: overflow,
        maxLines: maxLines,
        style: GoogleFonts.montserrat(
            decoration: decoration,
            shadows: shadows,
            decorationThickness: 1,
            color: color ?? black,
            decorationColor: decorationColor,
            textStyle: extrafontStyle,
            fontSize: fontSize ?? 16,
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
  return GoogleFonts.montserrat(
    color: color ?? black,
    fontSize: fontSize ?? 16,
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
  return GoogleFonts.roboto(
    color: color ?? black,
    fontSize: fontSize ?? 16,
    fontWeight: fontWeight ?? FontWeight.w500,
    decoration: textDecoration,
  );
}

TextStyle segoecustomTextstyle(
    {Color? color,
    TextDecoration? decoration,
    double? fontSize,
    FontWeight? fontWeight,
    String? fontFamily}) {
  return GoogleFonts.notoSans(
    color: color ?? black,
    fontSize: fontSize ?? 16,
    fontWeight: fontWeight ?? FontWeight.w500,
  );
}


TextStyle onbordTextstyle(
    {Color? color,
      TextDecoration? decoration,
      double? fontSize,
      FontWeight? fontWeight,
      String? fontFamily}) {
  return GoogleFonts.poppins(
    color: color ?? black,
    fontSize: fontSize ?? 16,
    fontWeight: fontWeight ?? FontWeight.w500,
  );
}
