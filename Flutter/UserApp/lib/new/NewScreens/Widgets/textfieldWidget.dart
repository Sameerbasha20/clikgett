import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

_fieldFocusChange(
  BuildContext context,
  FocusNode? nextFocus,
  FocusNode? currentFocus,
) {
  currentFocus!.unfocus();
  FocusScope.of(context).requestFocus(nextFocus);
}

Widget textFieldWidget(
    {required BuildContext context,
    Widget? prefixIcon,
    TextStyle? hintStyle,
    Widget? suffixIcon,
    bool showCursor = true,
    bool readOnly = false,
    bool onlyHint = false,
    required String hint,
    String? hinttext,
    Color? fillColor,
    List<String?>? holder,
    TextEditingController? controller,
    FocusNode? currentFocus,
    FocusNode? nextFocus,
    Color? borderColor,
    bool isEmail = false,
    bool isadress = false,
    bool enabled = true,
    bool validation = true,
    TextAlign? textAlign,
    double? fontsize,
    List<TextInputFormatter>? inputFormatters,
    Color? textColor,
    bool autofocus = false,
    FontWeight? fontWeight,
    int? maxLines = 1,
    int minLines = 1,
    TextCapitalization textCapitalization = TextCapitalization.none,
    String? fontFamily,
    EdgeInsetsGeometry? padding,
    int? maxLength,
    String? labelText,
    double? width,
    TextInputAction? textInputAction,
    void Function()? onTap,
    TextInputType? keyboardType,
    Widget? suffix,
    bool isMobile = false,
    void Function(String)? onChanged,
    void Function()? onsubmit,
    InputBorder? enabledBorder,
    String? Function(String?)? validator
    // Function? onTap,
    }) {
  return TextFormField(
    // onTap: onTap!(),
    maxLines: maxLines ?? null,
    // maxLines: null,
    keyboardType: keyboardType,
    // minLines: minLines,
    textAlign: textAlign ?? TextAlign.start,
    readOnly: readOnly,
    showCursor: showCursor,
    controller: controller,
    enabled: enabled, autofocus: autofocus,
    textCapitalization: textCapitalization,
    // ignore: prefer_if_null_operators
    textInputAction: textInputAction != null
        ? textInputAction
        : nextFocus == null
            ? TextInputAction.done
            : TextInputAction.next,
    style: customTextstyle(
        color: textColor ?? black,
        fontSize: fontsize ?? 16.sp,
        fontWeight: FontWeight.w500),
    inputFormatters: inputFormatters, // Ensure inputFormatters is applied here

    textAlignVertical: TextAlignVertical.center,
    validator: validator ??
        (String? value) {
          if (validation == true) {
            if (value!.isEmpty) {
              return hint;
            } else if (isEmail && !Constants().regex.hasMatch(value)) {
              return hint;
            } else {
              return null;
            }
          } else {
            return null;
          }
        },

    onChanged: onChanged,
    onSaved: (value) {},

    focusNode: currentFocus,
    onFieldSubmitted: (v) {
      _fieldFocusChange(context, nextFocus, currentFocus);
    },
    onTap: onTap,
    onEditingComplete: onsubmit,
    // keyboardType: keyboardType,
    maxLength: maxLength,
    decoration: InputDecoration(
      labelText: labelText,
      counterText: '',
      fillColor: fillColor ?? bg1,
      filled: true,
      isDense: true,
      alignLabelWithHint: true,
      prefixIcon: prefixIcon != null
          ? Padding(padding: EdgeInsets.all(15), child: prefixIcon)
          : null,
      // contentPadding: EdgeInsets.only(left: 10, right: 0, top: 8, bottom: 8),
      enabled: true,
      // prefixIconraints: Boxraints(minWidth: 23, maxHeight: 20),
      labelStyle:
          customTextstyle(color: Colors.black, fontWeight: FontWeight.w400),
      hintText: hinttext,
      hintStyle: hintStyle ??
          customTextstyle(
            fontWeight: fontWeight ?? FontWeight.w500,
            fontSize: fontsize ?? 16.sp,
            color: textColor ?? black,
          ),
      suffix: suffix,
      suffixIcon: suffixIcon != null
          ? Padding(padding: EdgeInsets.all(15), child: suffixIcon)
          : null,

      enabledBorder: enabledBorder ??
          OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(1.h)),
              borderSide: BorderSide(color: borderColor ?? bg1)),

      disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(1.h)),
          borderSide: BorderSide(color: borderColor ?? bg1, width: 2)),
      errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(1.h)),
          borderSide: BorderSide(
            color: red,
          )),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(1.h)),
          borderSide: BorderSide(color: borderColor ?? bg1, width: 1)),
      focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(1.h)),
          borderSide: BorderSide(color: borderColor ?? bg1, width: 2)),
    ),
  );
}

Widget NumbertextFieldWidget({
  required BuildContext context,
  Widget? prefixIcon,
  Widget? suffixIcon,
  String? Function(String?)? validator,
  required String hint,
  int maxLength = 10,
  TextStyle? hintStyle,
  String? hinttext,
  List<String?>? holder,
  TextEditingController? controller,
  InputBorder? enabledBorder,
  FocusNode? currentFocus,
  FocusNode? nextFocus,
  bool isPhoneNumber = false,
  int validationLength = 10,
  bool readOnly = false,
  bool enabled = true,
  Iterable<String>? autofillHints,
  TextAlignVertical? textAlignVertical,
  Color? borderColor,
  TextAlign? textAlign,
  Widget? child,
  void Function(String)? onChanged,
  bool validation = true,
  String? fontFamily,
  String? labelText,
  Color? textColor,
  double? fontSize,
  FontWeight? fontWeight,
  Color? fillColor,
}) {
  return TextFormField(
    enabled: enabled,
    textAlign: textAlign ?? TextAlign.start,
    controller: controller,
    // maxLength: maxLength ?? 10,
    keyboardType: TextInputType.number,
    textInputAction:
        nextFocus == null ? TextInputAction.done : TextInputAction.next,
    style: customTextstyle(
        fontWeight: fontWeight ?? FontWeight.w500,
        color: textColor ?? black,
        fontSize: fontSize ?? 16.sp),
    textAlignVertical: textAlignVertical ?? TextAlignVertical.center,
    validator: validator ??
        (String? value) {
          if (validation == true) {
            if (value!.isEmpty) {
              return 'Enter $hint';
            } else if (isPhoneNumber == true &&
                value.length != validationLength) {
              return 'Invalid Number';
            } else {
              return null;
            }
          } else {
            return null;
          }
        },

    onSaved: (value) {
      holder![0] = value;
    },

    onChanged: onChanged,

    focusNode: currentFocus,
    onFieldSubmitted: (v) {
      _fieldFocusChange(context, nextFocus, currentFocus);
    },
    autofillHints: autofillHints,
    readOnly: readOnly,
    inputFormatters: <TextInputFormatter>[
      FilteringTextInputFormatter.allow(RegExp("[0-9a-zA-Z]")),
    ],
    maxLength: maxLength,
    decoration: InputDecoration(
      counterText: '',
      fillColor: fillColor ?? bg1,
      hintText: hinttext,
      isDense: true,
      alignLabelWithHint: true,
      prefixIcon: prefixIcon != null
          ? Padding(padding: EdgeInsets.all(15), child: prefixIcon)
          : null,
      // contentPadding: EdgeInsets.only(left: 10, right: 0, top: 8, bottom: 8),
      enabled: true,
      labelText: labelText,
      labelStyle: customTextstyle(color: black, fontWeight: FontWeight.w400),
      suffix: suffixIcon ?? null,
      filled: true,
      hintStyle: hintStyle ??
          customTextstyle(
              color: textColor ?? black,
              fontSize: fontSize ?? 16.sp,
              fontWeight: fontWeight ?? FontWeight.w500),
      enabledBorder: enabledBorder ??
          OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(1.h)),
              borderSide: BorderSide(color: borderColor ?? bg1)),
      disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(1.h)),
          borderSide: BorderSide(color: borderColor ?? bg1, width: 2)),
      errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(1.h)),
          borderSide: BorderSide(
            color: borderColor ?? red,
          )),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(1.h)),
          borderSide: BorderSide(color: borderColor ?? white, width: 1)),
      focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(1.h)),
          borderSide: BorderSide(color: borderColor ?? bg1, width: 2)),
    ),
  );
}
