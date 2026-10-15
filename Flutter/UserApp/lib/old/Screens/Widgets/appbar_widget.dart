import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/constants.dart';
import 'package:flutter/material.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../../new/Constants/imageslist.dart';

PreferredSizeWidget FavAppBar(
    {required BuildContext context,
    String? title,
    void Function()? onPressed}) {
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
        padding: EdgeInsets.zero,
        onPressed: onPressed ??
            () {
              Navigator.of(context).pop();
            },
        icon: Image.asset(
          backbutton,
          height: 5.h,
          width: 10.w,
          fit: BoxFit.cover,
        )),
  );
}
