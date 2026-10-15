// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/NewScreens/Homepage/Homepage.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/PastOrders.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/CurrentOrders.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../../../Constants/imageslist.dart';
import '../../../../Controllers/home_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/widgets/milestone_reward_card.dart';
import 'package:fav_app/new/NewScreens/PhotoOrders/PhotoOrdersListScreen.dart';

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
                title: Text(
                  "My Orders",
                  style: GoogleFonts.poppins(
                    fontSize: 18.5.sp,
                    fontWeight: FontWeight.w600,
                    color: tColor,
                  ),
                ),
                leading: IconButton(
                  padding: EdgeInsets.zero,
                  onPressed: () {
                    navigateToHome();
                  },
                  icon: Icon(
                    Icons.arrow_back_ios_new_rounded,
                    size: 20,
                    color: tColor,
                  ),
                ),
                actions: [
                  Container(
                    margin: EdgeInsets.only(right: 3.w),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(10),
                        onTap: () => Get.to(() => const PhotoOrdersListScreen()),
                        child: Container(
                          padding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: primaryLight,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: primary.withOpacity(0.2)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.camera_alt_rounded, color: primary, size: 16),
                              SizedBox(width: 5),
                              Text(
                                "Photo Orders",
                                style: GoogleFonts.poppins(
                                  color: primary,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13.sp,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
                bottom: PreferredSize(
                  preferredSize: Size.fromHeight(56),
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(color: cardBorder, width: 1),
                      ),
                    ),
                    padding: EdgeInsets.fromLTRB(4.w, 0, 4.w, 1.2.h),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.all(4),
                      child: TabBar(
                        indicatorSize: TabBarIndicatorSize.tab,
                        dividerColor: Colors.transparent,
                        labelColor: white,
                        unselectedLabelColor: tColor2,
                        labelStyle: GoogleFonts.poppins(
                          fontSize: 14.5.sp,
                          fontWeight: FontWeight.w600,
                        ),
                        unselectedLabelStyle: GoogleFonts.poppins(
                          fontSize: 14.5.sp,
                          fontWeight: FontWeight.w500,
                        ),
                        physics: const BouncingScrollPhysics(),
                        indicator: BoxDecoration(
                          borderRadius: BorderRadius.circular(9),
                          color: primary,
                          boxShadow: [
                            BoxShadow(
                              color: primary.withOpacity(0.25),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        labelPadding: EdgeInsets.symmetric(vertical: 0.6.h),
                        tabs: const [
                          Tab(text: "Current Orders"),
                          Tab(text: "Past Orders"),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              backgroundColor: bg1,
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
