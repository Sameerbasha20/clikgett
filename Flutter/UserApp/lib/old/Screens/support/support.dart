import 'package:fav_app/old/Constants/button.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/Screens/Widgets/appbar_widget.dart';
import 'package:fav_app/old/Screens/support/chat_screen.dart';
import 'package:fav_app/old/constants.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class SupportScreen extends StatefulWidget {
  SupportScreen({Key? key}) : super(key: key);

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  @override
  Widget build(BuildContext context) {
    return Material(
      child: Scaffold(
        appBar: FavAppBar(context: context, title: 'Customer Support'),
        body: Container(
          child: Column(
            children: [
              // chatWidget(),
              callWidget(number: Constants.supportNumber1),
              callWidget(number: Constants.supportNumber2)
            ],
          ),
        ),
      ),
    );
  }

  Widget chatWidget() {
    return InkWell(
      onTap: () {
        Navigator.push(
            context, MaterialPageRoute(builder: (context) => ChatScreen()));
      },
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(5), color: Colors.grey[200]),
        child: Row(children: [
          Expanded(
            flex: 8,
            child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Live chat with our support',
                    style: normalTextstyle(color: primaryColor, fontSize: 18),
                  ),
                  const SizedBox(
                    height: 20,
                  ),
                  buttonWidget(
                      text: 'Start',
                      buttonColor: tGreen,
                      textColor: tWhite,
                      width: 80,
                      height: 30),
                ]),
          ),
          Expanded(
            flex: 2,
            child: Image.asset('Assets/Images/support/chat.png'),
          )
        ]),
      ),
    );
  }

  Widget callWidget({required String number}) {
    return InkWell(
      onTap: () {
        makeACall(Uri.parse('tel:' + number));
      },
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(5), color: Colors.grey[200]),
        child: Row(children: [
          Expanded(
            flex: 8,
            child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    number,
                    style: normalTextstyle(color: primaryColor, fontSize: 18),
                  ),
                  const SizedBox(
                    height: 20,
                  ),
                  buttonWidget(
                      text: 'call',
                      buttonColor: tGreen,
                      textColor: tWhite,
                      width: 80,
                      height: 30),
                ]),
          ),
          Expanded(
            flex: 2,
            child: Image.asset('Assets/Images/support/call.png'),
          )
        ]),
      ),
    );
  }

  // final Uri _url = Uri.parse('tel:+1-1800000000');

  void makeACall(url) async {
    if (!await launchUrl(url)) throw 'Could not launch $url';
  }
}
