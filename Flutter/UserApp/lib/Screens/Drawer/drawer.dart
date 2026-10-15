import 'package:fav_app/Constants/colors.dart';
import 'package:fav_app/Constants/text.dart';
import 'package:fav_app/Screens/Account/manage_address.dart';
import 'package:fav_app/Screens/FAQ/faq_screen.dart';
import 'package:fav_app/Screens/Notification/notifications_screen.dart';
import 'package:fav_app/Screens/Orders/orders_screen.dart';
import 'package:fav_app/Screens/support/support.dart';
import 'package:fav_app/new/NewScreens/PhotoOrders/PhotoOrderUploadScreen.dart';
import 'package:fav_app/ViewModels/Auth/user_data_viewmodel.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../ViewModels/Users/usersDetails.dart';

class DrawerScreen extends StatefulWidget {
  DrawerScreen({Key? key}) : super(key: key);

  @override
  State<DrawerScreen> createState() => _DrawerScreenState();
}

class _DrawerScreenState extends State<DrawerScreen> {
  UserViewModel? userViewModel;
  UsersViewModel? usersViewModel;
  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance!.addPostFrameCallback((timeStamp) {
      if (usersViewModel != null) {
        usersViewModel!.getuserDetails(context: context);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (mounted) {
      userViewModel = context.watch<UserViewModel>();
      usersViewModel = context.watch<UsersViewModel>();
    }

    return Material(
      child: Drawer(
        backgroundColor: tWhite,
        child: Column(
          children: [
            header(),
            customTile(
              title: 'Home',
            ),
            // customTile(
            //   title: 'Categories',
            // ),
            // customTile(
            //   title: 'Kits / Combos',
            // ),
            // customTile(
            //   title: 'Offers',
            // ),
            // customTile(
            //   title: 'Accounts / Profile',
            // ),
            // customTile(title: 'Profile', isSubMenu: true),
            // customTile(title: 'Payment / Wallet', isSubMenu: true),
            customTile(
                title: 'Manage Address',
                function: () {
                  Navigator.push(context,
                      MaterialPageRoute(builder: (context) => ManageAddress()));
                }),
            customTile(
                title: 'Order by Photo',
                function: () {
                  Navigator.push(context,
                      MaterialPageRoute(builder: (context) => const PhotoOrderUploadScreen()));
                }),
            customTile(
                title: 'Orders',
                function: () {
                  Navigator.push(context,
                      MaterialPageRoute(builder: (context) => OrdersScreen()));
                }),
            customTile(
                title: 'Customer Support',
                function: () {
                  Navigator.push(context,
                      MaterialPageRoute(builder: (context) => SupportScreen()));
                }),
            customTile(
                title: 'FAQs',
                function: () {
                  Navigator.push(context,
                      MaterialPageRoute(builder: (context) => FAQScreen()));
                }),
            customTile(
                title: 'Notifications',
                function: () {
                  Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (conext) => NotificationScreen()));
                }),
            customTile(
                title: 'Logout',
                function: () {
                  userViewModel!.logout(context);
                }),
          ],
        ),
      ),
    );
  }

  Widget header() {
    return Container(
      // height: 100,
      padding: EdgeInsets.symmetric(vertical: 10, horizontal: 20),
      decoration:
          BoxDecoration(gradient: LinearGradient(colors: bottombarlGColor)),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              flex: 3,
              child: Container(
                height: 60,
                width: 60,
                decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: tWhite,
                    ),
                    image: usersViewModel?.userDetailsModel?.users.profilePic !=
                            'NA'
                        ? DecorationImage(
                            image: NetworkImage(
                              usersViewModel
                                      ?.userDetailsModel?.users.profilePic ??
                                  '',
                            ),
                            fit: BoxFit.cover)
                        : const DecorationImage(
                            image: AssetImage(
                              'Assets/Images/propic.png',
                            ),
                            fit: BoxFit.fill)),
              ),
            ),
            const SizedBox(
              width: 10,
            ),
            Expanded(
              flex: 8,
              child: Text(
                'Hello, ${usersViewModel?.userDetailsModel?.users.firstName}${usersViewModel?.userDetailsModel?.users.lastName}',
                style: normalTextstyle(
                  color: tWhite,
                ),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget customTile(
      {String? title, Function? function, bool isSubMenu = false}) {
    return InkWell(
      onTap: function == null
          ? null
          : () {
              function();
            },
      child: Container(
        width: double.maxFinite,
        padding: EdgeInsets.symmetric(
            vertical: 10, horizontal: isSubMenu == true ? 50 : 30),
        child: Text(
          title!,
          style: normalTextstyle(color: tBlack),
        ),
      ),
    );
  }
}
