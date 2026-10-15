// ignore_for_file: prefer_const_constructors
import 'package:fav_app/Constants/colors.dart';
import 'package:fav_app/Models/Home/TimingProvider.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/Controllers/orders_controller.dart';
import 'package:fav_app/new/Controllers/profile_controller.dart';
import 'package:fav_app/new/NewScreens/Account/Profile.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Cart/Cart.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Categories/Categories.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/HomeTab.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/OrderDetails.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/Orders.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/widgets/homeDeliveryDetails.dart';
import 'package:fav_app/new/NewScreens/Widgets/floating_cart_bar.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lottie/lottie.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

class Homepage extends StatefulWidget {
  const Homepage({Key? key}) : super(key: key);

  @override
  State<Homepage> createState() => _HomepageState();
}

class _HomepageState extends State<Homepage> {
  // int selectedIndex = 0;
  final ProfileController profileController = Get.find();

  String? token;

  List<Widget> Screens = [
    Home(),
    Categories(backtoCategory: true),
    // Combo(),
    // Cart(),
    Orders(),
    Profile(),
  ];

  List bottombarstyles = [];

  // @override
  // void initState() {
  //   super.initState();
  //   controller.updateTabIndex(0);

  //   retriveToken();
  //   // datat();
  //   // updateFCM();
  // }

  // datat() async {
  //   if (token != "" || token != null) {
  //     profileController.getuserDetails(context: context);
  //     ordersController.getcurrentorder(context: context);
  //   }
  // }

  @override
  void initState() {
    super.initState();
    controller.updateTabIndex(0);
    initApp();
  }

  void initApp() async {
    await retriveToken(); // wait for token to be fetched

    if (token != null && token!.isNotEmpty) {
      datat();
      updateFCM();
    }
  }

  void datat() {
    profileController.getuserDetails(context: context);
    ordersController.getcurrentorder(context: context);
  }

  final TimingController timingController = Get.put(TimingController());

  Future retriveToken() async {
    await CommonServices.getToken().then((onValue) {
      token = onValue; // Store the token
      timingController.checkTiming(token!);
    });
    final SharedPreferences pref = await SharedPreferences.getInstance();
    double? latitude = pref.getDouble('latitude'); // Get area name
    // address = pref.getString('Address') ?? '';
    print("AreaName$latitude");
    // print("ddddddddd");
  }

  final OrdersController ordersController = Get.find();

  void updateFCM() async {
    await FirebaseMessaging.instance.getToken().then((value) {
      if (value != null) {
        Map body = {
          "FCMToken": value,
        };
        Get.put(ProfileController())
            .updateUser(context: context, body: body, isFCMUpdate: true);
      }
    });
  }

  onTap(int value) {
    if (token == "" || token == null) {
      Fluttertoast.showToast(
        msg: "Please Login to chectout this section!\nThanks.",
      );
      Navigator.push(context, MaterialPageRoute(builder: (context) => Login()));
    } else {
      controller.updateTabIndex(value);
    }
  }

  final HomeController controller = Get.find();

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: ClipRRect(
        child: Scaffold(
          // appBar: selectedIndex == 0
          //     ? AppBar(
          //         centerTitle: true,
          //         title: Text(""),
          //       )
          //     : null,
          // drawer: Drawer(
          //   backgroundColor: black,
          // ),
          body: Obx(() => controller.tabIndex.value == -1
              ? SizedBox.shrink()
              : Screens[controller.tabIndex.value]),
          bottomNavigationBar: Obx(
            () {
              if (controller.tabIndex.value == -1) {
                return const SizedBox.shrink();
              }
              final int currentTab = controller.tabIndex.value;
              final bool showCartCapsule =
                  currentTab == 0 || currentTab == 1;

              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (showCartCapsule) const FloatingCartBar(),
                  bottombar(currentTab),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget bottombar(int index) {
    return GetBuilder<OrdersController>(
        id: 'orders',
        builder: (controller) {
          return ordersController.isLoading.isTrue
              ? LinearProgressIndicator()
              : Container(
                  decoration: BoxDecoration(
                    borderRadius:
                        const BorderRadius.vertical(top: Radius.circular(20)),
                    border: Border(top: BorderSide(color: cardBorder, width: 1)),
                    boxShadow: softElevatedShadow,
                    color: white,
                  ),
                  child: SafeArea(
                    top: false,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ordersController.orders.isEmpty
                            ? const SizedBox.shrink()
                            : SizedBox(
                                height: 80,
                              child: PageView.builder(
                                itemCount: ordersController.orders.length,
                                controller: PageController(
                                    viewportFraction: 1), // full width
                                onPageChanged: (index) {
                                  // You can use this to update any state if needed
                                },
                                itemBuilder: (context, index) {
                                  // final order = ordersController.orders[index];
                                  // final createdAt = DateTime.tryParse(
                                  //     order.createdAt.toString());
                                  // final elapsed = createdAt != null
                                  //     ? DateTime.now().difference(createdAt)
                                  //     : Duration.zero;
                                  return DeliveryStatus(indexss: index);
                                  //                               GestureDetector(
                                  //                                 behavior: HitTestBehavior.opaque,
                                  // onTap: () {
                                  //   Navigator.push(
                                  //       context,
                                  //       MaterialPageRoute(
                                  //           builder: (_) => OrderDetailsScreen(
                                  //                 isPastOrders: false,
                                  //                 orderNo: order.orderId ?? 0,
                                  //               )));
                                  // },
                                  //                                 child:
                                  //                                  Container(
                                  //                                   height: 80,
                                  //                                   width: double.infinity,
                                  //                                   padding: EdgeInsets.all(16),
                                  //                                   decoration: BoxDecoration(
                                  //                                     gradient: elapsed.inMinutes<= 30? LinearGradient(
                                  //                                       colors:  [
                                  //                                         Color(0xFFa8e063), // Light green
                                  //                                         Color(0xFF56ab2f), // Darker green
                                  //                                       ],
                                  //                                       begin: Alignment.topLeft,
                                  //                                       end: Alignment.bottomRight,
                                  //                                     ): LinearGradient(
                                  //                                       colors:  [
                                  //                                         Color(0xFFFADA7A), // Light green
                                  //                                         Color(0xFFFFA725), // Darker green
                                  //                                       ],
                                  //                                       begin: Alignment.topLeft,
                                  //                                       end: Alignment.bottomRight,
                                  //                                     ),
                                  //                                     borderRadius: BorderRadius.vertical(
                                  //                                         top: Radius.circular(16)),
                                  //                                     boxShadow: [
                                  //                                       BoxShadow(
                                  //                                         color: Colors.black26,
                                  //                                         blurRadius: 8,
                                  //                                         offset: Offset(0, 4),
                                  //                                       ),
                                  //                                     ],
                                  //                                   ),
                                  //                                   child: Stack(
                                  //                                     children: [
                                  //                                       Row(
                                  //                                         children: [
                                  //                                           if (elapsed.inMinutes <= 30) ...[
                                  //                                             Container(
                                  //                                               decoration: BoxDecoration(
                                  //                                                 borderRadius: BorderRadius.circular(8),color: Colors.white
                                  //                                               ),
                                  //                                               child: Padding(
                                  //                                                 padding: const EdgeInsets.all(8.0),
                                  //                                                 child: Text(
                                  //                                                   '${30 - elapsed.inMinutes}\nMin',
                                  //                                                   style: TextStyle(
                                  //                                                     fontSize: 14,
                                  //                                                     fontWeight: FontWeight.bold,
                                  //                                                     color: Colors.green,
                                  //                                                   ),
                                  //                                                   textAlign: TextAlign.center,
                                  //                                                 ),
                                  //                                               ),
                                  //                                             ),
                                  //                                             SizedBox(width: 8),
                                  //                                             Text(
                                  //                                               "${'#${order.OrderSequence}'}\nTo get the order delivered",
                                  //                                               style: TextStyle(
                                  //                                                 fontSize: 14,
                                  //                                                 color: Colors.white,
                                  //                                               ),
                                  //                                             ),
                                  //                                           ] else ...[
                                  //                                             Container(
                                  //                                               decoration: BoxDecoration(
                                  //                                                 borderRadius: BorderRadius.circular(8),color: Colors.white
                                  //                                               ),
                                  //                                               child: Padding(
                                  //                                                 padding: const EdgeInsets.all(8.0),
                                  //                                                 child: Text(
                                  //                                                   '${elapsed.inMinutes - 30}\nMin',
                                  //                                                   style: TextStyle(
                                  //                                                     fontSize: 14,
                                  //                                                     fontWeight: FontWeight.bold,
                                  //                                                     color: Colors.redAccent,
                                  //                                                   ),
                                  //                                                   textAlign: TextAlign.center,
                                  //                                                 ),
                                  //                                               ),
                                  //                                             ),
                                  //                                             SizedBox(width: 8),
                                  //                                             Flexible(
                                  //                                               child: Text(
                                  //                                                  "${'#${order.OrderSequence}'}\nOrder Delivery Delayed.",
                                  //                                                 style: TextStyle(
                                  //                                                   fontSize: 14,
                                  //                                                   color: Colors.white,
                                  //                                                 ),
                                  //                                               ),
                                  //                                             ),
                                  //                                           ],
                                  //                                         ],
                                  //                                       ),
                                  //                                       Align(
                                  //                                         alignment: Alignment.centerRight,
                                  //                                         child: Transform.flip(
                                  //                                           flipX: true,
                                  //                                           child: Transform.scale(
                                  //                                             scale: 1.8,
                                  //                                             child: Lottie.asset(
                                  //                                                 'Assets/Images/Homepage/animation.json'),
                                  //                                           ),
                                  //                                         ),
                                  //                                       ),
                                  //                                     ],
                                  //                                   ),
                                  //                                 ),
                                  //                               );
                                },
                              ),
                            ),
                      SizedBox(
                        height: 58,
                        child: BottomNavigationBar(
                          elevation: 0,
                          backgroundColor: Colors.transparent,
                          type: BottomNavigationBarType.fixed,
                          unselectedItemColor: const Color(0xFF64748B),
                          selectedItemColor: primary,
                          currentIndex: index,
                          onTap: onTap,
                          selectedLabelStyle: GoogleFonts.poppins(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                          ),
                          unselectedLabelStyle: GoogleFonts.poppins(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w500,
                          ),
                          items: <BottomNavigationBarItem>[
                            BottomNavigationBarItem(
                              icon: Padding(
                                padding: const EdgeInsets.only(bottom: 3.0),
                                child: ImageIcon(AssetImage(bottombarHomeIcon), size: 22),
                              ),
                              label: "Home",
                            ),
                            BottomNavigationBarItem(
                              icon: Padding(
                                padding: const EdgeInsets.only(bottom: 3.0),
                                child: ImageIcon(AssetImage(bottombarCategoryIcon), size: 22),
                              ),
                              label: "Categories",
                            ),
                            BottomNavigationBarItem(
                              icon: Padding(
                                padding: const EdgeInsets.only(bottom: 3.0),
                                child: ImageIcon(AssetImage(myorders), size: 22),
                              ),
                              label: "My Orders",
                            ),
                            BottomNavigationBarItem(
                              icon: Padding(
                                padding: const EdgeInsets.only(bottom: 3.0),
                                child: ImageIcon(AssetImage(userIcon), size: 22),
                              ),
                              label: "Profile",
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
        });
  }
}
