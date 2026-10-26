import 'dart:async';

import 'package:fav_app/Models/Home/TimingProvider.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/Controllers/orders_controller.dart';
import 'package:fav_app/new/Controllers/profile_controller.dart';
import 'package:fav_app/new/NewScreens/Account/Profile.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Categories/Categories.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/HomeTab.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/Orders.dart';
import 'package:fav_app/new/NewScreens/Homepage/widgets/homeDeliveryDetails.dart';
import 'package:fav_app/new/NewScreens/PrintStore/PrintStoreScreen.dart';
import 'package:fav_app/new/NewScreens/Widgets/floating_cart_bar.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

/// App shell: Home / Categories / My Orders / Print / Profile tabs, the floating cart
/// bar (on browse tabs) and a strip with the customer's active orders.
class Homepage extends StatefulWidget {
  const Homepage({Key? key}) : super(key: key);

  @override
  State<Homepage> createState() => _HomepageState();
}

class _HomepageState extends State<Homepage> {
  final HomeController controller = Get.find();
  final ProfileController profileController = Get.find();
  final OrdersController ordersController = Get.find();
  final TimingController timingController = Get.put(TimingController());

  String token = '';
  Timer? _ordersRefresh;

  final List<Widget> screens = [
    const Home(),
    Categories(backtoCategory: true),
    Orders(),
    const PrintStoreScreen(),
    Profile(),
  ];

  @override
  void initState() {
    super.initState();
    controller.updateTabIndex(0);
    _init();
  }

  Future<void> _init() async {
    token = await CommonServices.getToken();
    timingController.checkTiming(token);
    if (token.isEmpty || !mounted) return;
    profileController.getuserDetails(context: context);
    ordersController.getcurrentorder(context: context);
    // Keep the active-order strip live while an order is in progress.
    _ordersRefresh = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted && ordersController.orders.isNotEmpty) ordersController.getcurrentorder(context: context);
    });
    final fcmToken = await FirebaseMessaging.instance.getToken();
    if (fcmToken != null && mounted) {
      Get.put(ProfileController()).updateUser(context: context, body: {"FCMToken": fcmToken}, isFCMUpdate: true);
    }
  }

  @override
  void dispose() {
    _ordersRefresh?.cancel();
    super.dispose();
  }

  void _onTab(int index) {
    // Home, Categories and Print are open to guests; orders and profile need an account.
    if ((index == 2 || index == 4) && token.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login to see your orders and profile')),
      );
      Navigator.push(context, MaterialPageRoute(builder: (_) => Login()));
      return;
    }
    controller.updateTabIndex(index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Obx(() {
        final tab = controller.tabIndex.value;
        if (tab < 0) return const SizedBox.shrink();
        return Stack(children: [
          Positioned.fill(child: screens[tab]),
          // Blinkit-style "View cart" pill floating over the browse tabs.
          if (tab == 0 || tab == 1 || tab == 3) const Positioned(left: 0, right: 0, bottom: 12, child: FloatingCartBar()),
        ]);
      }),
      bottomNavigationBar: Obx(() {
        final tab = controller.tabIndex.value;
        if (tab < 0) return const SizedBox.shrink();
        return _bottomBar(tab);
      }),
    );
  }

  Widget _bottomBar(int index) {
    return Container(
      decoration: const BoxDecoration(
        color: white,
        border: Border(top: BorderSide(color: cardBorder)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Active orders strip (live status of in-progress orders)
            GetBuilder<OrdersController>(
              id: 'orders',
              builder: (_) {
                if (ordersController.orders.isEmpty) return const SizedBox.shrink();
                return SizedBox(
                  height: 80,
                  child: PageView.builder(
                    itemCount: ordersController.orders.length,
                    itemBuilder: (_, i) => DeliveryStatus(indexss: i),
                  ),
                );
              },
            ),
            SizedBox(
              height: 58,
              child: BottomNavigationBar(
                elevation: 0,
                backgroundColor: Colors.transparent,
                type: BottomNavigationBarType.fixed,
                unselectedItemColor: grey70,
                selectedItemColor: primary,
                currentIndex: index,
                onTap: _onTab,
                selectedLabelStyle: GoogleFonts.poppins(fontSize: 11.5, fontWeight: FontWeight.w600),
                unselectedLabelStyle: GoogleFonts.poppins(fontSize: 11.5, fontWeight: FontWeight.w500),
                items: [
                  _item(bottombarHomeIcon, 'Home'),
                  _item(bottombarCategoryIcon, 'Categories'),
                  _item(myorders, 'My Orders'),
                  _printItem(index == 3),
                  _item(userIcon, 'Profile'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Print store tab with a small "NEW" tag.
  BottomNavigationBarItem _printItem(bool selected) => BottomNavigationBarItem(
        icon: Padding(
          padding: const EdgeInsets.only(bottom: 3),
          child: Stack(clipBehavior: Clip.none, children: [
            Icon(selected ? Icons.print_rounded : Icons.print_outlined, size: 23),
            Positioned(
              right: -16,
              top: -5,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                decoration: BoxDecoration(color: red, borderRadius: BorderRadius.circular(6)),
                child: Text('NEW', style: GoogleFonts.poppins(fontSize: 7.5, fontWeight: FontWeight.w800, color: white)),
              ),
            ),
          ]),
        ),
        label: 'Print',
      );

  BottomNavigationBarItem _item(String asset, String label) => BottomNavigationBarItem(
        icon: Padding(
          padding: const EdgeInsets.only(bottom: 3),
          child: ImageIcon(AssetImage(asset), size: 22),
        ),
        label: label,
      );
}
