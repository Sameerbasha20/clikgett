import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Screens/FAQ/faq_tile.dart';
import 'package:fav_app/old/Screens/Widgets/appbar_widget.dart';
import 'package:flutter/material.dart';

class FAQScreen extends StatefulWidget {
  FAQScreen({Key? key}) : super(key: key);

  @override
  State<FAQScreen> createState() => _FAQScreenState();
}

class _FAQScreenState extends State<FAQScreen> {
  @override
  Widget build(BuildContext context) {
    return Material(
      color: tWhite,
      child: Scaffold(
        backgroundColor: tWhite,
        appBar: FavAppBar(context: context, title: "FAQ's"),
        body: Container(
          padding: EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          child: ListView.builder(
            itemCount: 5,
            shrinkWrap: true,
            physics: const BouncingScrollPhysics(),
            itemBuilder: (context, index) {
              return FaqTile();
            },
          ),
        ),
      ),
    );
  }
}
