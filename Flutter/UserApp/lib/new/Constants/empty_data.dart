import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:flutter/material.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class EmptyDataWidget extends StatelessWidget {
  final String message;
  const EmptyDataWidget({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(message,
          style: customTextstyle(
              fontSize: 20.sp,
              fontWeight: FontWeight.w600,
              color: black.withOpacity(.5))),
    );
  }
}
