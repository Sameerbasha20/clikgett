import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/Screens/Terms/terms_tile.dart';
import 'package:fav_app/old/constants.dart';
import 'package:flutter/material.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../../new/Constants/imageslist.dart';

class TermsScreen extends StatefulWidget {
  TermsScreen({Key? key}) : super(key: key);

  @override
  State<TermsScreen> createState() => _TermsScreenState();
}

class _TermsScreenState extends State<TermsScreen> {
  @override
  Widget build(BuildContext context) {
    return Material(
      color: tWhite,
      child: Scaffold(
        backgroundColor: tWhite,
        appBar: appBar(),
        body: Container(
          padding: EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          child: ListView.builder(
            itemCount: 5,
            shrinkWrap: true,
            physics: const BouncingScrollPhysics(),
            itemBuilder: (context, index) {
              return TermsTile();
            },
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget appBar() {
    return AppBar(
      elevation: 0,
      backgroundColor: tWhite,
      centerTitle: true,
      title: Text(
        "Terms And Conditions",
        style: normalTextstyle(fontFamily: Constants().segeo, fontSize: 20),
      ),
      leading: IconButton(
          padding: EdgeInsets.zero,
          onPressed: () {
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
}
