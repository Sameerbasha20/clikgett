// ignore_for_file: prefer_const_constructors
import 'dart:io';
import 'dart:ui';

import 'package:fav_app/Screens/Widgets/Sizes.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/config_controller.dart';
import 'package:fav_app/new/NewModel/profileListModel.dart';
import 'package:fav_app/new/NewScreens/Account/EditProfile.dart';
import 'package:fav_app/new/NewScreens/Account/Widgets/animatesCOntainer.dart';
import 'package:fav_app/new/NewScreens/Account/Widgets/deleteAcc.dart';
import 'package:fav_app/new/NewScreens/Address/ManageAddress.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/CouponAndOffers/Offers.dart';
import 'package:fav_app/new/NewScreens/CouponAndOffers/wallet.dart';
import 'package:fav_app/new/NewScreens/Homepage/Homepage.dart';
import 'package:fav_app/new/NewScreens/Notifications.dart';
import 'package:fav_app/new/NewScreens/Support/Support.dart';
import 'package:fav_app/new/NewScreens/Support/EnquiryScreen.dart';
import 'package:fav_app/new/NewScreens/FAQ/FAQ.dart';
import 'package:fav_app/new/NewScreens/Terms/TermsAndConditions.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:fav_app/new/Services/common/CommonFunctions.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/widgets/milestone_reward_card.dart';

import '../../../Constants/toast.dart';
import '../../../Services/common/common_services.dart';
import '../../../constants.dart';
import '../../Controllers/home_controller.dart';
import '../../Controllers/profile_controller.dart';
import '../Referral/referralScreen.dart';
import 'package:http/http.dart' as http;

class Profile extends StatefulWidget {
  // const Profile({super.key, required this.profileController});
  // final ProfileController profileController;
  @override
  State<Profile> createState() => _ProfileState();
}

class _ProfileState extends State<Profile> {
  ScrollController scrollController = ScrollController();
  final ProfileController profileController = Get.find();
  final HomeController homeController = Get.find();
  String? token;
  List<profileListModel> list = [
    (profileListModel(
        title: "Notifications", icon: notification, page: Notifications())),
    (profileListModel(title: "Wallet", icon: walletIcon, page: WalletScreen())),
    (profileListModel(
        title: "Manage Address", icon: mapIcon, page: ManageAddress())),
    (profileListModel(
        title: "Offers", icon: tagIcon, page: Offers(hideCopyIcon: true))),
    (profileListModel(
        title: "Customer Support", icon: supportIcon, page: Support())),
    (profileListModel(title: "FAQs", icon: faqIcon, page: FAQ())),
    (profileListModel(
        title: "Submit your inquiry", icon: inquiry, page: EnquiryScreen())),
    (profileListModel(title: "Privacy Policy", icon: privacyIcon, page: "")),
    (profileListModel(title: "Terms & Conditions", icon: termsIcon, page: "")),
    //  Platform.isIOS? (profileListModel(title: "Delete Account", icon: termsIcon, page: "")),
    // (profileListModel(title: "Delete Account", icon: userIcon, page: "")),
    // (profileListModel(
    //     title: "Refer & earn", icon: usersIcon, page: ReferralScreen())),
  ];

  @override
  void initState() {
    super.initState();
    // profileController = widget.profileController;
    Future.wait([
      profileController.getuserDetails(context: context),
    ]);
    retriveToken();
  }

  Future retriveToken() async {
    await CommonServices.getToken().then((onValue) {
      token = onValue; // Store the token
    });
    final SharedPreferences pref = await SharedPreferences.getInstance();
    double? latitude = pref.getDouble('latitude'); // Get area name
    // address = pref.getString('Address') ?? '';
    // print("ddddddddd");
  }

  // late ProfileController profileController;
  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        homeController.updateTabIndex(0);
        return false;
      },
      child: Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: false,
          elevation: 0,
          backgroundColor: white,
          surfaceTintColor: Colors.transparent,
          bottom: PreferredSize(
            preferredSize: Size.fromHeight(1),
            child: Container(
              color: cardBorder,
              height: 1,
            ),
          ),
          title: Text(
            "Profile",
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 18.5.sp,
              color: tColor,
            ),
          ),
        ),
        backgroundColor: bg1,
        body: SingleChildScrollView(
          controller: scrollController,
          physics: BouncingScrollPhysics(),
          padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.5.h),
          child: GetBuilder<ProfileController>(
            id: 'profile-update',
            init: ProfileController(),
            builder: (_) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  profileWidget(
                      userName: '${profileController.users?.firstName}',
                      email: profileController.users?.emailId),

// Refer & Earn Section
                  AnimatedGradientBorderCard(
                    onTap: () {
                      Navigator.push(
                        context,
                        CupertinoPageRoute(
                            builder: (_) => const ReferralScreen()),
                      );
                    },
                  ),

                  SizedBox(height: 1.5.h),

                  const MilestoneRewardCard(),

                  SizedBox(height: 1.h),

                  listWidget(),
                  !Platform.isIOS
                      ? SizedBox()
                      : SizedBox(
                          height: 1.h,
                        ),
                  !Platform.isIOS
                      ? SizedBox()
                      : InkWell(
                          onTap: () {
                            showDeleteConfirmationDialog(context);
                          },
                          child: Padding(
                            padding:
                                EdgeInsets.only(top: 1.5.h, bottom: 1.5.h),
                            child: Row(
                              children: [
                                Expanded(
                                  flex: 1,
                                  child: Icon(
                                    Icons.delete_forever,
                                    size: 2.9.h,
                                    color: red,
                                  ),
                                ),
                                Expanded(
                                  flex: 6,
                                  child: customText(
                                    text: "Delete Account",
                                    fontWeight: FontWeight.w600,
                                    fontSize: 17.sp,
                                    color: red,
                                  ),
                                ),
                                Expanded(
                                  flex: 1,
                                  child: Icon(
                                    Icons.arrow_forward_ios,
                                    size: 2.h,
                                    color: black,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                  SizedBox(
                    height: 2.5.h,
                  ),
                  Container(
                    width: double.infinity,
                    height: 50,
                    margin: EdgeInsets.only(bottom: 3.h),
                    decoration: BoxDecoration(
                      color: white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.red.shade200, width: 1),
                      boxShadow: softCardShadow,
                    ),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(14),
                        onTap: () {
                          alertDialogue().then((value) async {
                            if (value == true) {
                              if (Get.isRegistered<CartController>()) {
                                Get.find<CartController>().clearCart();
                              }
                              final SharedPreferences pref =
                                  await SharedPreferences.getInstance();
                              await pref.setString('city', '');
                              pref.clear().then((value) {
                                Navigator.pushAndRemoveUntil(
                                    context,
                                    MaterialPageRoute(
                                        builder: (_) => Login(
                                              isScreenFromLogout: true,
                                            )),
                                    (route) => false);
                              });
                            }
                          });
                        },
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.logout_rounded,
                              color: Colors.red.shade600,
                              size: 20,
                            ),
                            SizedBox(width: 8),
                            Text(
                              "Logout",
                              style: GoogleFonts.poppins(
                                fontSize: 15.sp,
                                fontWeight: FontWeight.w600,
                                color: Colors.red.shade600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
        // bottomNavigationBar: BottomAppBar(
        //   padding: EdgeInsets.fromLTRB(5.w, 0, 5.w, 2.h),
        //   child:
        // ),
      ),
    );
  }

  void showDeleteConfirmationDialog(BuildContext context) {
    showDialog(
      barrierColor: Colors
          .transparent, // Set the barrier color to transparent to allow the blur effect
      context: context,
      builder: (context) {
        return Stack(
          children: [
            Positioned.fill(
              child: BackdropFilter(
                filter: ImageFilter.blur(
                    sigmaX: 5.0, sigmaY: 5.0), // Adjust blur intensity
                child: Container(
                  color: black.withOpacity(0.4),
                ),
              ),
            ),
            DeleteAccountDialog(toke: token!), // Your logout dialog
          ],
        );
      },
    );
  }

  Widget profileWidget({userName, email}) {
    final initials = profileController.users?.firstName != null &&
            profileController.users!.firstName.isNotEmpty
        ? profileController.users!.firstName[0].toUpperCase()
        : 'U';
    final displayName = (userName != null && userName.toString().trim().isNotEmpty && userName != "null")
        ? userName.toString().trim()
        : "ClikGett Shopper";
    final phone = profileController.users?.mobileNumber ?? "";

    return Container(
      margin: EdgeInsets.only(top: 0.5.h, bottom: 1.5.h),
      padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.h),
      decoration: BoxDecoration(
        color: white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorder, width: 1),
        boxShadow: softCardShadow,
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [primary, primaryDark],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: primary.withOpacity(0.25),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            alignment: Alignment.center,
            child: Text(
              initials,
              style: GoogleFonts.poppins(
                color: white,
                fontSize: 22,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          SizedBox(width: 3.5.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  displayName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(
                    fontSize: 17.5.sp,
                    fontWeight: FontWeight.w600,
                    color: tColor,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  phone.isNotEmpty ? phone : (email ?? "Welcome to ClikGett"),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(
                    fontSize: 13.5.sp,
                    color: tColor3,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
          Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () {
                Navigator.of(context).push(MaterialPageRoute(
                    builder: (context) => EditProfile(
                          profileController: profileController,
                          users: profileController.users,
                        )));
              },
              child: Container(
                padding: EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: primaryLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: primary.withOpacity(0.2)),
                ),
                child: Icon(
                  Icons.edit_outlined,
                  size: 18,
                  color: primary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: EdgeInsets.only(left: 1.w, top: 1.8.h, bottom: 0.8.h),
      child: Text(
        title,
        style: GoogleFonts.poppins(
          fontSize: 14.sp,
          fontWeight: FontWeight.w600,
          color: tColor2,
          letterSpacing: 0.3,
        ),
      ),
    );
  }

  Widget _buildMenuCard(List<profileListModel> items) {
    return Container(
      decoration: BoxDecoration(
        color: white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorder, width: 1),
        boxShadow: softCardShadow,
      ),
      child: Column(
        children: List.generate(items.length, (index) {
          final item = items[index];
          final isLast = index == items.length - 1;

          return Column(
            children: [
              Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.vertical(
                    top: index == 0 ? Radius.circular(16) : Radius.zero,
                    bottom: isLast ? Radius.circular(16) : Radius.zero,
                  ),
                  onTap: () {
                    if (item.title.toLowerCase() == 'submit your inquiry' ||
                        item.title.toLowerCase() == 'submit your enquiry') {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (context) => const EnquiryScreen()),
                      );
                    } else if (item.title.toLowerCase() == 'privacy policy') {
                      CommonFunctions().openprivacy();
                    } else if (item.title.toLowerCase() == 'terms & conditions') {
                      CommonFunctions().openTerms();
                    } else {
                      Navigator.of(context).push(
                          MaterialPageRoute(builder: ((context) => item.page)));
                    }
                  },
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.6.h),
                    child: Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: primaryLight,
                            shape: BoxShape.circle,
                          ),
                          alignment: Alignment.center,
                          child: ImageIcon(
                            AssetImage(item.icon),
                            size: 18,
                            color: primary,
                          ),
                        ),
                        SizedBox(width: 3.5.w),
                        Expanded(
                          child: Text(
                            item.title,
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w500,
                              fontSize: 15.sp,
                              color: tColor,
                            ),
                          ),
                        ),
                        Icon(
                          Icons.chevron_right_rounded,
                          size: 20,
                          color: tColor3,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              if (!isLast)
                Divider(
                  height: 1,
                  thickness: 1,
                  color: cardBorder.withOpacity(0.7),
                  indent: 14.w,
                  endIndent: 4.w,
                ),
            ],
          );
        }),
      ),
    );
  }

  Widget listWidget() {
    final accountItems = list.where((item) {
      final t = item.title.toLowerCase();
      return t == 'manage address' || t == 'wallet' || t == 'notifications' || t == 'offers';
    }).toList();

    final supportItems = list.where((item) {
      final t = item.title.toLowerCase();
      return t == 'customer support' || t == 'faqs' || t.contains('inquiry') || t.contains('enquiry');
    }).toList();

    final legalItems = list.where((item) {
      final t = item.title.toLowerCase();
      return t.contains('privacy') || t.contains('terms');
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (accountItems.isNotEmpty) ...[
          _buildSectionHeader("Account & Orders"),
          _buildMenuCard(accountItems),
        ],
        if (supportItems.isNotEmpty) ...[
          _buildSectionHeader("Help & Support"),
          _buildMenuCard(supportItems),
        ],
        if (legalItems.isNotEmpty) ...[
          _buildSectionHeader("About & Legal"),
          _buildMenuCard(legalItems),
        ],
      ],
    );
  }

  Future alertDialogue() {
    return showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(builder: (context, setState) {
          return AlertDialog(
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text('Logout',
                    style: GoogleFonts.outfit(
                        color: Color(0xff1C1C1C),
                        fontSize: 20.sp,
                        fontWeight: FontWeight.w500)),
                Padding(
                  padding: EdgeInsets.symmetric(vertical: 2.h),
                  child: Text('Are you sure ,want to logout?',
                      style: GoogleFonts.outfit(
                          color: Color(0xff707070),
                          fontSize: 16.sp,
                          fontWeight: FontWeight.w400)),
                ),
                SizedBox(
                  height: 10,
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    SizedBox(
                      width: 1,
                    ),
                    SizedBox(
                      width: 100, // Set your desired width here
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          // No background color
                          side: BorderSide(color: primary, width: 1.0),
                          // Black border with width
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(
                                5), // Rectangular shape with slight rounding
                          ),
                          padding: EdgeInsets.symmetric(
                              vertical: 12), // Padding for button height
                        ),
                        onPressed: () async {
                          Navigator.pop(context, true);
                        },
                        child: Text(
                          "Yes",
                          style: GoogleFonts.poppins(
                              color: primary,
                              fontSize: 16,
                              fontWeight: FontWeight.w600), // White text color
                        ),
                      ),
                    ),
                    SizedBox(
                      width: 1,
                    ),
                    SizedBox(
                      width: 100, // Set your desired width here
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primary,
                          // No background color
                          side: BorderSide(color: primary, width: 1.0),
                          // Black border with width
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(
                                5), // Rectangular shape with slight rounding
                          ),
                          padding: EdgeInsets.symmetric(
                              vertical: 12), // Padding for button height
                        ),
                        onPressed: () async {
                          Navigator.pop(context, false);
                        },
                        child: Text(
                          "Cancel",
                          style: GoogleFonts.poppins(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600), // White text color
                        ),
                      ),
                    ),
                    SizedBox(
                      width: 1,
                    ),
                  ],
                )
              ],
            ),
          );
        });
      },
    );
  }

  String truncateString(String text, {int maxLength = 10}) {
    if (text.length > maxLength) {
      return '${text.substring(0, maxLength)}...'; // Truncate and add ellipsis
    }
    return text;
  }

  Future delatealertDialogue() {
    return showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(builder: (context, setState) {
          return AlertDialog(
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text('Delete Account',
                    style: GoogleFonts.outfit(
                        color: Color(0xff1C1C1C),
                        fontSize: 20.sp,
                        fontWeight: FontWeight.w500)),
                Padding(
                  padding: EdgeInsets.symmetric(vertical: 2.h),
                  child: Text('Are you sure ,want to delete?',
                      style: GoogleFonts.outfit(
                          color: Color(0xff707070),
                          fontSize: 16.sp,
                          fontWeight: FontWeight.w400)),
                ),
                SizedBox(
                  height: 10,
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    SizedBox(
                      width: 1,
                    ),
                    SizedBox(
                      width: 100, // Set your desired width here
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          // No background color
                          side: BorderSide(color: primary, width: 1.0),
                          // Black border with width
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(
                                5), // Rectangular shape with slight rounding
                          ),
                          padding: EdgeInsets.symmetric(
                              vertical: 12), // Padding for button height
                        ),
                        onPressed: () async {
                          deleteUser(token);
                        },
                        child: Text(
                          "Yes",
                          style: GoogleFonts.poppins(
                              color: primary,
                              fontSize: 16,
                              fontWeight: FontWeight.w600), // White text color
                        ),
                      ),
                    ),
                    SizedBox(
                      width: 1,
                    ),
                    SizedBox(
                      width: 100, // Set your desired width here
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primary,
                          // No background color
                          side: BorderSide(color: primary, width: 1.0),
                          // Black border with width
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(
                                5), // Rectangular shape with slight rounding
                          ),
                          padding: EdgeInsets.symmetric(
                              vertical: 12), // Padding for button height
                        ),
                        onPressed: () async {
                          Navigator.pop(context, false);
                        },
                        child: Text(
                          "Cancel",
                          style: GoogleFonts.poppins(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600), // White text color
                        ),
                      ),
                    ),
                    SizedBox(
                      width: 1,
                    ),
                  ],
                )
              ],
            ),
          );
        });
      },
    );
  }

  Future<void> deleteUser(String? token) async {
    final String url = '${Constants.baseUrl}/users/deleteuser';

    try {
      final response = await http.delete(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token', // Attach the token in the header
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final SharedPreferences pref = await SharedPreferences.getInstance();
        await pref.setString('city', '');
        pref.clear().then((value) {
          Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(
                  builder: (_) => Login(
                        isScreenFromLogout: true,
                      )),
              (route) => false);
        });
        // Handle success, e.g., navigate to a different screen or show a success message
      } else {
        // Handle error based on the response code
      }
    } catch (e) {
      // Handle network or other errors
    }
  }
}
