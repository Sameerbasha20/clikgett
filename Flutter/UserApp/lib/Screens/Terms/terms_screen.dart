import 'package:fav_app/Constants/colors.dart';
import 'package:fav_app/Constants/text.dart';
import 'package:fav_app/Screens/Terms/terms_tile.dart';
import 'package:fav_app/constants.dart';
import 'package:flutter/material.dart';

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
            onPressed: () {
              Navigator.pop(context);
            },
            icon: const Icon(
              Icons.arrow_back,
              color: tGrey,
            )));
  }
}
