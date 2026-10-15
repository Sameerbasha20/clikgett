import 'package:fav_app/old/Constants/text.dart';
import 'package:flutter/material.dart';

class OffersTab extends StatefulWidget {
  OffersTab({Key? key}) : super(key: key);

  @override
  State<OffersTab> createState() => _OffersTabState();
}

class _OffersTabState extends State<OffersTab> {
  @override
  Widget build(BuildContext context) {
    var size = MediaQuery.of(context).size;
    return Material(
      child: SafeArea(
        child: Scaffold(
          body: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [constantText(text: 'offertab')],
            ),
          ),
        ),
      ),
    );
  }
}
