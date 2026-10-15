import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/Screens/Widgets/appbar_widget.dart';
import 'package:flutter/material.dart';

class ChatScreen extends StatefulWidget {
  ChatScreen({Key? key}) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  String name = 'Vijay';
  @override
  Widget build(BuildContext context) {
    return Material(
      child: Scaffold(
        appBar: FavAppBar(context: context, title: name),
        body: Container(
          height: MediaQuery.of(context).size.height,
          width: double.maxFinite,
          child: Column(
            children: [Expanded(child: Container()), bottomBar()],
          ),
        ),
      ),
    );
  }

  Widget bottomBar() {
    return Container(
      margin: EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Expanded(
            flex: 1,
            child: IconButton(
                onPressed: () {},
                icon: const Icon(
                  Icons.camera_alt_rounded,
                  color: primaryColor,
                )),
          ),
          Expanded(
            flex: 8,
            child: inputWidget(),
          )
        ],
      ),
    );
  }

  TextEditingController controller = TextEditingController();
  Widget inputWidget() {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(25), color: tLightWhite),
      child: TextField(
        controller: controller,
        textAlignVertical: TextAlignVertical.center,
        style: normalTextstyle(fontWeight: FontWeight.bold),
        decoration: InputDecoration(
          isDense: true,
          // fillColor: tLightWhite,
          // filled: true,
          hintText: 'Type Message',
          suffixIcon: IconButton(
              onPressed: () {},
              icon: Container(
                padding: EdgeInsets.all(5),
                child: const Icon(
                  Icons.send,
                  color: primaryColor,
                  size: 20,
                ),
              )),
          border: InputBorder.none,
          focusedBorder: InputBorder.none,
          enabledBorder: InputBorder.none,
          errorBorder: InputBorder.none,
          disabledBorder: InputBorder.none,
        ),
      ),
    );
  }
}
