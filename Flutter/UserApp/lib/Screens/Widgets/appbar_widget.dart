import 'package:fav_app/Constants/colors.dart';
import 'package:fav_app/Constants/text.dart';
import 'package:fav_app/constants.dart';
import 'package:flutter/material.dart';

PreferredSizeWidget FavAppBar({required BuildContext context, String? title}) {
  return AppBar(
      elevation: 0,
      backgroundColor: tWhite,
      centerTitle: true,
      title: Text(
        title ?? "",
        style: normalTextstyle(
            fontFamily: Constants().segeo,
            fontSize: 20,
            fontWeight: FontWeight.w700),
      ),
      leading: IconButton(
          onPressed: () {
            Navigator.pop(context);
          },
          icon: const Icon(
            Icons.arrow_back,
            color: tGrey,
          )));
}
