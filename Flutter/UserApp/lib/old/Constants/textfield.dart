import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/constants.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

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
    Widget? suffixIcon,
    bool showCursor = true,
    bool readOnly = false,
    bool onlyHint = false,
    required String hint,
    Color? hintColor,
    Color? fillColor,
    List<String?>? holder,
    TextEditingController? controller,
    FocusNode? currentFocus,
    FocusNode? nextFocus,
    Color? borderColor,
    bool isEmail = false,
    bool enabled = true,
    bool validation = true,
    TextAlign? textAlign,
    double borderRadius = 5,
    double? fontsize,
    Color? textColor,
    FontWeight? fontWeight,
    int maxLines = 1,
    int minLines = 1,
    String? fontFamily,
    EdgeInsetsGeometry? padding,
    double? width,
    TextInputAction? textInputAction,
    void Function()? onTap,
    TextInputType? keyboardType,
    Widget? suffix,
    InputBorder? enabledBorder
    // Function? onTap,
    }) {
  return Container(
    padding: EdgeInsets.symmetric(vertical: 10),
    alignment: Alignment.center,
    width: width ?? double.maxFinite,
    child: TextFormField(
      // onTap: onTap!(),
      maxLines: maxLines,
      minLines: minLines,
      textAlign: textAlign ?? TextAlign.start,
      readOnly: readOnly,
      showCursor: showCursor,
      controller: controller,

      enabled: enabled,
      // ignore: prefer_if_null_operators
      textInputAction: textInputAction != null
          ? textInputAction
          : nextFocus == null
              ? TextInputAction.done
              : TextInputAction.next,
      style: textFieldTextStyle(color: textColor ?? tBlack, fontSize: 15),

      textAlignVertical: TextAlignVertical.center,
      validator: (String? value) {
        if (validation == true) {
          if (value!.isEmpty) {
            return 'Enter $hint';
          } else if (isEmail && !Constants().regex.hasMatch(value)) {
            return 'Enter valid $hint';
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
      focusNode: currentFocus,
      onFieldSubmitted: (v) {
        _fieldFocusChange(context, nextFocus, currentFocus);
      },
      onTap: onTap, keyboardType: keyboardType,
      decoration: InputDecoration(
        // errorStyle: headingStyle(fontSize: 13, color: tWhite),
        fillColor: fillColor ?? tTransperent,
        filled: true,
        floatingLabelBehavior: FloatingLabelBehavior.always,
        // isDense: true,
        hintText: hint,
        // onlyHint ? hinttext : ' ' + hinttext,
        hintStyle: textFieldTextStyle(
          fontFamily: fontFamily,
          fontWeight: fontWeight,
          fontSize: fontsize ?? 15,
          color: hintColor ?? tGrey,
        ),
        suffix: suffix,
        suffixIcon: suffixIcon,
        prefixIcon: prefixIcon ?? null,
        // suffix: suffixIcon ?? null,
        enabledBorder: enabledBorder ??
            UnderlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
              borderSide: BorderSide(color: borderColor ?? tWhite, width: 2),
            ),
        // border: OutlineInputBorder(borderSide: BorderSide(color: tRedColor)),
        disabledBorder: enabledBorder ??
            UnderlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
              borderSide: BorderSide(
                color: borderColor != null ? Colors.grey[400]! : tWhite,
              ),
            ),
        errorBorder: enabledBorder ??
            UnderlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
              borderSide: BorderSide(color: tWhite, width: 2),
            ),
        focusedBorder: enabledBorder ??
            UnderlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
              borderSide: BorderSide(color: borderColor ?? tWhite, width: 2),
            ),
        focusedErrorBorder: enabledBorder ??
            UnderlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
              borderSide: BorderSide(color: tWhite, width: 2),
            ),
      ),
    ),
  );
}

Widget NumbertextFieldWidget(
    {BuildContext? context,
    Widget? prefixIcon,
    Widget? suffixIcon,
    required String hint,
    Color? hintColor,
    List<String?>? holder,
    TextEditingController? controller,
    FocusNode? currentFocus,
    FocusNode? nextFocus,
    bool isPhoneNumber = false,
    int validationLength = 10,
    bool readOnly = false,
    Color? fillColor,
    bool enabled = true,
    Color? borderColor,
    TextAlign? textAlign,
    bool validation = true,
    String? fontFamily,
    Color? textColor}) {
  return Container(
    padding: EdgeInsets.symmetric(vertical: 10),
    alignment: Alignment.center,
    child: TextFormField(
      enabled: enabled,
      textAlign: textAlign ?? TextAlign.start,
      controller: controller,
      maxLength: 10,
      keyboardType: TextInputType.number,
      textInputAction:
          nextFocus == null ? TextInputAction.done : TextInputAction.next,
      style: textFieldTextStyle(
          color: textColor ?? tBlack, fontFamily: fontFamily),
      textAlignVertical: TextAlignVertical.center,
      validator: (String? value) {
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
      focusNode: currentFocus,
      onFieldSubmitted: (v) {
        _fieldFocusChange(context!, nextFocus, currentFocus);
      },
      readOnly: readOnly,
      inputFormatters: <TextInputFormatter>[
        FilteringTextInputFormatter.allow(RegExp("[0-9a-zA-Z]")),
      ],
      decoration: InputDecoration(
        // errorStyle: headingStyle(fontSize: 13, color: tWhite),
        // contentPadding: EdgeInsets.only(r),
        counterText: '',

        hintText: hint,
        prefixIcon: prefixIcon ?? null,
        suffix: suffixIcon ?? null,
        filled: true,
        fillColor: fillColor ?? tTransperent,
        // isDense: true,
        // hintText: 'Enter ' + hint,

        hintStyle: textFieldTextStyle(
          color: hintColor ?? tGrey,
          fontFamily: fontFamily,
          fontSize: 15,
        ),
        enabledBorder: UnderlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(5.0)),
          borderSide: BorderSide(
            color: borderColor ?? tWhite,
            width: 2,
          ),
        ),
        disabledBorder: UnderlineInputBorder(
          borderRadius: const BorderRadius.all(Radius.circular(5.0)),
          borderSide: BorderSide(
            color: borderColor != null ? Colors.grey[400]! : tTransperent,
          ),
        ),
        focusedBorder: UnderlineInputBorder(
          borderRadius: const BorderRadius.all(Radius.circular(5.0)),
          borderSide: BorderSide(color: borderColor ?? tWhite, width: 2),
        ),
        errorBorder: UnderlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(5.0)),
          borderSide: BorderSide(color: tWhite, width: 2),
        ),
        focusedErrorBorder: UnderlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(5.0)),
          borderSide: BorderSide(color: tWhite),
        ),
      ),
    ),
  );
}

Widget searchbarWidget(
    {required BuildContext context,
    Widget? prefixIcon,
    Widget? suffixIcon,
    bool showCursor = true,
    bool readOnly = false,
    bool onlyHint = false,
    required String hint,
    Color? fillColor,
    List<String?>? holder,
    TextEditingController? controller,
    FocusNode? currentFocus,
    FocusNode? nextFocus,
    Color? borderColor,
    bool isEmail = false,
    bool enabled = true,
    bool validation = true,
    TextAlign? textAlign,
    double borderRadius = 5,
    double? fontsize,
    Color? textColor,
    FontWeight? fontWeight,
    int maxLines = 1,
    int minLines = 1,
    String? fontFamily,
    EdgeInsetsGeometry? padding,
    double? width,
    TextInputAction? textInputAction,
    void Function()? onTap,
    TextInputType? keyboardType,
    Widget? suffix,
    InputBorder? enabledBorder
    // Function? onTap,
    }) {
  return Container(
    alignment: Alignment.center,
    width: width ?? double.maxFinite,
    child: TextFormField(
      // onTap: onTap!(),
      maxLines: maxLines,
      minLines: minLines,
      textAlign: textAlign ?? TextAlign.center,
      readOnly: readOnly,
      showCursor: showCursor,
      controller: controller,

      enabled: enabled,
      // ignore: prefer_if_null_operators
      textInputAction: textInputAction != null
          ? textInputAction
          : nextFocus == null
              ? TextInputAction.done
              : TextInputAction.next,
      style: textFieldTextStyle(color: textColor ?? tWhite, fontSize: 15),

      textAlignVertical: TextAlignVertical.center,
      validator: (String? value) {
        if (validation == true) {
          if (value!.isEmpty) {
            return 'Enter $hint';
          } else if (isEmail && !Constants().regex.hasMatch(value)) {
            return 'Enter valid $hint';
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
      focusNode: currentFocus,
      onFieldSubmitted: (v) {
        _fieldFocusChange(context, nextFocus, currentFocus);
      },
      onTap: onTap, keyboardType: keyboardType,
      decoration: InputDecoration(
        errorStyle: headingStyle(fontSize: 13, color: tWhite),
        fillColor: fillColor ?? tTransperent,
        filled: true,
        floatingLabelBehavior: FloatingLabelBehavior.always,
        // isDense: true,
        hintText: hint,
        // onlyHint ? hinttext : ' ' + hinttext,
        hintStyle: textFieldTextStyle(
          fontFamily: fontFamily,
          fontWeight: fontWeight,
          fontSize: fontsize ?? 15,
          color: textColor ?? tWhite,
        ),
        suffix: suffix,
        suffixIcon: suffixIcon,
        prefixIcon: prefixIcon ?? null,
        // suffix: suffixIcon ?? null,
        enabledBorder: enabledBorder ??
            UnderlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
              borderSide: BorderSide(color: borderColor ?? tWhite, width: 2),
            ),
        // border: OutlineInputBorder(borderSide: BorderSide(color: tRedColor)),
        disabledBorder: enabledBorder ??
            UnderlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
              borderSide: BorderSide(
                color: borderColor != null ? Colors.grey[400]! : tWhite,
              ),
            ),
        errorBorder: enabledBorder ??
            UnderlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
              borderSide: BorderSide(color: tWhite, width: 2),
            ),
        focusedBorder: enabledBorder ??
            UnderlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
              borderSide: BorderSide(color: borderColor ?? tWhite, width: 2),
            ),
        focusedErrorBorder: enabledBorder ??
            UnderlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
              borderSide: BorderSide(color: tWhite, width: 2),
            ),
      ),
    ),
  );
}
