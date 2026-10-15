import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:flutter/material.dart';

class FaqTile extends StatefulWidget {
  FaqTile({Key? key}) : super(key: key);

  @override
  State<FaqTile> createState() => _FaqTileState();
}

class _FaqTileState extends State<FaqTile> {
  bool isExapnds = false;

  @override
  Widget build(BuildContext context) {
    return Container(
        // margin: EdgeInsets.zero,
        decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10), color: tLightGrey),
        margin: EdgeInsets.symmetric(vertical: 5),
        child: Theme(
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
          child: ExpansionTile(
            onExpansionChanged: (value) {
              setState(() {
                isExapnds = value;
              });
            },
            trailing: Padding(
              padding: EdgeInsets.symmetric(horizontal: 10),
              child: isExapnds
                  ? const Icon(
                      Icons.keyboard_arrow_down,
                      color: primaryColor,
                      size: 30,
                    )
                  : const Icon(
                      Icons.keyboard_arrow_right,
                      color: primaryColor,
                      size: 30,
                    ),
            ),
            tilePadding: EdgeInsets.zero,
            childrenPadding: EdgeInsets.only(bottom: 10),
            // backgroundColor: tLightGrey,
            title: Column(
              children: [
                ListTile(
                  title: Text(
                    "My order did'nt delivered",
                    style: normalTextstyle(fontSize: 16, color: tBlack),
                  ),
                )
              ],
            ),
            children: [
              Container(
                  padding: EdgeInsets.symmetric(horizontal: 20),
                  child: Text(
                    'You need to enter your email address on the Login page and click on forgot password. An email with a reset password will be sent to your email address. With this,  you can change your password. In case of any further issues please contact our customer support team.',
                    style: normalTextstyle(fontSize: 14, color: tBlack),
                  ))
            ],
          ),
        ));
  }
}
