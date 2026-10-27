// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/NewScreens/Homepage/Homepage.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/PastOrders.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/CurrentOrders.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../Controllers/home_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/widgets/milestone_reward_card.dart';

class Orders extends StatefulWidget {
  const Orders({super.key, this.isFromSuccess = false});
  final bool? isFromSuccess;
  @override
  State<Orders> createState() => _OrdersState();
}

class _OrdersState extends State<Orders> {
  final HomeController homeController = Get.find();
  @override
  Widget build(BuildContext context) {
    // return WillPopScope(
    //     onWillPop: () async {
    //       homeController.updateTabIndex(0);
    //       return false;
    //     },
    //     child: OrdersScreen());
    return DefaultTabController(
        length: 2,
        child: WillPopScope(
          onWillPop: () async {
            navigateToHome();
            return false;
          },
          child: Scaffold(
              appBar: AppBar(
                surfaceTintColor: Colors.transparent,
                backgroundColor: white,
                elevation: 0,
                centerTitle: false,
                titleSpacing: 0,
                title: Text(
                  "My Orders",
                  style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w700, color: tColor),
                ),
                leading: IconButton(
                  onPressed: navigateToHome,
                  icon: Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: tColor),
                ),
                bottom: PreferredSize(
                  preferredSize: const Size.fromHeight(52),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 2, 16, 10),
                    child: Container(
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(22),
                      ),
                      padding: const EdgeInsets.all(3),
                      child: TabBar(
                        indicatorSize: TabBarIndicatorSize.tab,
                        dividerColor: Colors.transparent,
                        splashBorderRadius: BorderRadius.circular(20),
                        labelColor: primaryDark,
                        unselectedLabelColor: const Color(0xFF64748B),
                        labelStyle: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w600),
                        unselectedLabelStyle: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w500),
                        indicator: BoxDecoration(
                          color: white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 6, offset: const Offset(0, 2)),
                          ],
                        ),
                        tabs: const [
                          Tab(text: "Current"),
                          Tab(text: "Past"),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              backgroundColor: const Color(0xFFF7F9F8),
              body: Column(
                children: [
                  const MilestoneRewardCard(),
                  Expanded(
                    child: TabBarView(
                      children: [
                        CurrentOrders(),
                        CancelledOrders(),
                      ],
                    ),
                  ),
                ],
              )),
        ));
  }

  void navigateToHome() {
    homeController.updateTabIndex(0);
    if (widget.isFromSuccess == true) {
      Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(
            builder: (context) => Homepage(),
          ),
          (route) => false);
    }
  }
}
