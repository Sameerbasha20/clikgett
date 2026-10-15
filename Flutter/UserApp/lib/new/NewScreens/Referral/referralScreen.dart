import 'package:fav_app/Constants/toast.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/Controllers/adress_controller.dart';
import 'package:fav_app/new/Controllers/profile_controller.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:fav_app/new/Services/common/CommonFunctions.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:share_plus/share_plus.dart';

import '../../Controllers/config_controller.dart';

class ReferralScreen extends StatefulWidget {
  const ReferralScreen({super.key});

  @override
  State<ReferralScreen> createState() => _ReferralScreenState();
}

class _ReferralScreenState extends State<ReferralScreen> {
  TextEditingController referralCode = TextEditingController();
  List<String> _referralCode = List.filled(1, '');
  FocusNode referralCodeFocus = FocusNode();
  String? referCode;
  final AdressController adressController = Get.find();

  @override
  void initState() {
    super.initState();
    referCode = profileController.users?.myReferralCode;
    Future.wait([
      adressController.getAdresses(context: context),
      configController.getConfig(context: context),
    ]);
  }

  final ConfigController configController = Get.find<ConfigController>();
  final ProfileController profileController = Get.find<ProfileController>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Appprimary,
      appBar: AppBar(
        backgroundColor: Appprimary,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text("Refer & Earn",
            style: customTextstyle(
                fontSize: 18.sp, fontWeight: FontWeight.bold, color: white)),
      ),
      body: SingleChildScrollView(
        // physics: const BouncingScrollPhysics(),
        child: Column(
          children: [
            // Top Colorful Section
            Container(
              width: 100.w,
              padding: EdgeInsets.only(top: 3.h, bottom: 4.h),
              decoration: BoxDecoration(
                // color: Colors.deepPurple.shade100,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(30),
                  bottomRight: Radius.circular(30),
                ),
              ),
              child: Column(
                children: [
                  Image.asset(
                    referralBanner,
                    height: 18.h,
                    fit: BoxFit.contain,
                  ),
                  SizedBox(height: 2.h),
                  Text("Refer & Earn",
                      style: customTextstyle(
                          fontSize: 22.sp,
                          fontWeight: FontWeight.w700,
                          color: Colors.white)),
                  SizedBox(height: 0.5.h),
                  Obx(() => InkWell(
                        onTap: () {},
                        child: Text(
                          "Earn ₹${configController.deliveryFee.toStringAsFixed(0)} per referral!",
                          style: customTextstyle(
                              fontSize: 16.sp,
                              color: Colors.white.withOpacity(0.8)),
                        ),
                      )),
                ],
              ),
            ),

            // Step Cards
            Container(
              height: 500,
              decoration: BoxDecoration(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                  color: white),
              child: Column(
                children: [
                  Padding(
                    padding:
                        EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.h),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _stepCard("Step 1", Icons.share_rounded, "Invite"),
                        _stepCard("Step 2", Icons.login, "They Join & Order"),
                        _stepCard("Step 3", Icons.wallet_giftcard, "You Earn"),
                      ],
                    ),
                  ),

                  // howItworksWidget(context),

                  // Description
                  Padding(
                    padding:
                        EdgeInsets.symmetric(horizontal: 5.w, vertical: 2.h),
                    child: Text(
                      "Share your referral code with a friend. When your friend signs up using your code and places an order, both of you get rewarded after successful delivery: You get ₹50 - Your friend gets ₹50",
                      // "Refer friends and family, and once they place and complete their first order, your wallet gets credited with a reward ready to be used on your next order",
                      // "Invite your friends and family to join the app. Once they sign up and complete their first order, you get ₹100 in your wallet. The more you refer, the more you earn!",
                      style: customTextstyle(
                        fontSize: 15.sp,
                        color: black.withOpacity(0.7),
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),

                  // Referral Code Box
                  referralWidget(),

                  // SizedBox(height: 3.h),
                  Padding(
                    padding: EdgeInsets.all(5.w),
                    child: buttonWidget(
                      context: context,
                      text: "Share & Earn",
                      onTap: () {
                        Share.share(
                            "Use my referral code ${referCode?.toUpperCase()} and get ₹${configController.referFee} in your wallet when you sign up on the Clikgett app.\nDownload on Play Store: https://play.google.com/store/apps/details?id=com.app.clikget&hl=en_IN or App Store: https://apps.apple.com/in/app/clikgett/id6746932740");
                      },
                    ),
                  ),
                ],
              ),
            )
          ],
        ),
      ),
      // bottomNavigationBar:
    );
  }

  Widget _stepCard(String title, IconData icon, String label) {
    return Container(
      width: 26.w,
      padding: EdgeInsets.symmetric(vertical: 2.h),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 5,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          CircleAvatar(
            backgroundColor: Appprimary.withOpacity(0.08),
            radius: 22,
            child: Icon(icon, color: Appprimary, size: 20),
          ),
          SizedBox(height: 1.h),
          Text(title,
              style: customTextstyle(
                  fontSize: 13.sp, fontWeight: FontWeight.bold)),
          SizedBox(height: 0.5.h),
          Text(label,
              style: customTextstyle(
                  fontSize: 12.sp, color: Colors.black.withOpacity(0.5))),
        ],
      ),
    );
  }

  Widget howItworksWidget(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 2),
      child: Container(
        decoration: BoxDecoration(
          color: bg1,
          border: Border.all(color: primary.withOpacity(0.4), width: 1),
          borderRadius: BorderRadius.circular(14),
          // boxShadow: [
          //   BoxShadow(
          //     color: Colors.black12,
          //     blurRadius: 5,
          //     offset: Offset(0, 2),
          //   ),
          // ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: Theme(
            data: Theme.of(context).copyWith(
              dividerColor: Colors.transparent,
              unselectedWidgetColor: primary,
              colorScheme: ColorScheme.light(primary: primary),
            ),
            child: ExpansionTile(
              tilePadding: EdgeInsets.symmetric(horizontal: 15, vertical: 2),
              childrenPadding:
                  EdgeInsets.symmetric(horizontal: 15, vertical: 2),
              title: Text(
                'How it works?',
                style: customTextstyle(
                  fontSize: 17.sp,
                  fontWeight: FontWeight.w600,
                ),
              ),
              leading: Icon(Icons.info_outline_rounded, color: primary),
              trailing: Icon(Icons.keyboard_arrow_down_rounded, color: primary),
              children: [
                trackerWidget(
                  context,
                  index: 1,
                  value:
                      'Refer the app to your friends or relatives and get ₹100 in your wallet.',
                ),
                trackerWidget(
                  context,
                  index: 2,
                  value:
                      'Earn ₹50 when they install the app and ₹50 when they complete their first order.',
                ),
                trackerWidget(
                  context,
                  index: 3,
                  value: 'Use wallet balance to shop seamlessly!',
                  removeBottomLine: true,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget trackerWidget(
    BuildContext context, {
    required int index,
    required String value,
    bool removeBottomLine = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            CircleAvatar(
              radius: 17,
              backgroundColor: Appprimary,
              child: Text(
                index.toString(),
                style: customTextstyle(color: white),
              ),
            ),
            removeBottomLine
                ? Container()
                : Container(
                    width: 4,
                    height: index == 1
                        ? MediaQuery.of(context).size.height * .06
                        : MediaQuery.of(context).size.height * .06,
                    color: Appprimary.withOpacity(0.6),
                  )
          ],
        ),
        Flexible(
          child: Padding(
            padding: const EdgeInsets.only(top: 0, left: 10),
            child: Text(
              value,
              style: customTextstyle(fontSize: 15, fontWeight: FontWeight.w500),
            ),
          ),
        ),
      ],
    );
  }

  Widget imageWidget() {
    return Image.asset(
      referralBanner,
      height: 25.h,
      width: 80.w,
      fit: BoxFit.contain,
    );
  }

  Widget referralWidget() {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 2.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text("Your Referral Code",
              style: customTextstyle(
                  fontSize: 16.sp, fontWeight: FontWeight.w600)),
          SizedBox(height: 1.h),
          Container(
            width: 70.w,
            padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.5.h),
            decoration: BoxDecoration(
              color: bg1,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: primary),
            ),
            child: Row(
              // mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Center(
                    child: SelectableText(
                      referCode?.toUpperCase() ?? 'N/A',
                      style: customTextstyle(
                        fontSize: 17.sp,
                        fontWeight: FontWeight.bold,
                        color: black,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
                InkWell(
                  onTap: () {
                    if (referCode == null) {
                      customToast(message: 'No refer code found');
                      return;
                    }
                    CommonFunctions.copyText(
                        text: referCode?.toUpperCase() ?? '',
                        applied: false); // customToast(message: 'Copied');

                    Share.share(
                        "Use my referral code ${referCode?.toUpperCase()} and get ₹${configController.referFee} in your wallet when you sign up on the Clikgett app.\nDownload on Play Store: https://play.google.com/store/apps/details?id=com.app.clikget&hl=en_IN or App Store: https://apps.apple.com/in/app/clikgett/id6746932740");
                  },
                  child: Icon(Icons.copy, color: primary, size: 20.sp),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
