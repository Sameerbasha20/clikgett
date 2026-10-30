import 'dart:ui';

import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/Controllers/profile_controller.dart';
import 'package:fav_app/new/Controllers/wallet.dart';
import 'package:fav_app/new/NewScreens/Account/EditProfile.dart';
import 'package:fav_app/new/NewScreens/Account/Widgets/deleteAcc.dart';
import 'package:fav_app/new/NewScreens/Account/account_widgets.dart';
import 'package:fav_app/new/NewScreens/Account/membership_screen.dart';
import 'package:fav_app/new/NewScreens/Account/my_requests_screen.dart';
import 'package:fav_app/new/NewScreens/Address/ManageAddress.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/CouponAndOffers/Offers.dart';
import 'package:fav_app/new/NewScreens/CouponAndOffers/wallet.dart';
import 'package:fav_app/new/NewScreens/Notifications.dart';
import 'package:fav_app/new/NewScreens/Account/notification_settings_screen.dart';
import 'package:fav_app/new/NewScreens/PhotoOrders/PhotoOrdersListScreen.dart';
import 'package:fav_app/new/NewScreens/Referral/referralScreen.dart';
import 'package:fav_app/new/NewScreens/Support/Support.dart';
import 'package:fav_app/new/Services/account_services.dart';
import 'package:fav_app/new/Services/common/CommonFunctions.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Profile tab: account details and every account screen.
class Profile extends StatefulWidget {
  const Profile({super.key});

  @override
  State<Profile> createState() => _ProfileState();
}

class _ProfileState extends State<Profile> {
  final ProfileController profileController = Get.find();
  final HomeController homeController = Get.find();
  final WalletController walletController = Get.find();
  ActiveMembership? _membership;
  AccountSummary? _summary;

  @override
  void initState() {
    super.initState();
    profileController.getuserDetails(context: context);
    walletController.getWallet(context: context);
    AccountServices.membershipPlans().then((page) {
      if (mounted) setState(() => _membership = page?.current);
    });
    _loadSummary();
  }

  Future<void> _loadSummary() async {
    final s = await AccountServices.summary();
    if (mounted && s != null) setState(() => _summary = s);
  }

  /// The birthday is set once: pick, confirm, save. After that it only shows.
  Future<void> _birthday() async {
    final saved = _summary?.dateOfBirth;
    if (saved != null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Your birthday is saved and cannot be changed. Contact support if it is wrong.')));
      return;
    }
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 25, now.month, now.day),
      firstDate: DateTime(now.year - 100),
      lastDate: DateTime(now.year - 5, now.month, now.day),
      initialEntryMode: DatePickerEntryMode.calendarOnly,
      helpText: 'SELECT YOUR BIRTHDAY',
    );
    if (picked == null || !mounted) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Save your birthday?'),
        content: Text('${DateFormat('d MMMM yyyy').format(picked)}\n\nYou cannot change it later, so please check it is correct.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Change')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Confirm')),
        ],
      ),
    );
    if (ok != true) return;
    final result = await AccountServices.setBirthday(DateFormat('yyyy-MM-dd').format(picked));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result.ok ? 'Birthday saved 🎂' : result.message)));
    _loadSummary();
  }

  String get _birthdaySubtitle {
    final dob = _summary?.dateOfBirth;
    final reward = _summary?.birthdayReward ?? 0;
    if (dob != null) {
      return '${DateFormat('d MMMM').format(dob)}${reward > 0 ? ' · ${rupees(reward)} gift on your birthday' : ''}';
    }
    return reward > 0 ? 'Add it and get ${rupees(reward)} on your birthday' : 'Add your birthday for a birthday surprise';
  }

  void _push(Widget screen) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));

  Future<void> _logout() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Log out?'),
        content: const Text('You will need your mobile number and an OTP to log in again.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Log out', style: TextStyle(color: red))),
        ],
      ),
    );
    if (ok != true) return;
    if (Get.isRegistered<CartController>()) Get.find<CartController>().clearCart();
    await CommonServices.logoutOnServer();
    final pref = await SharedPreferences.getInstance();
    await pref.clear();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => Login(isScreenFromLogout: true)),
      (route) => false,
    );
  }

  Future<void> _deleteAccount() async {
    final token = await CommonServices.getToken();
    if (!mounted) return;
    showDialog(
      barrierColor: Colors.transparent,
      context: context,
      builder: (_) => Stack(children: [
        Positioned.fill(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
            child: Container(color: black.withOpacity(0.4)),
          ),
        ),
        DeleteAccountDialog(toke: token),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Shown as the bottom "Profile" tab, or pushed on top of Home from the header avatar.
    final pushed = ModalRoute.of(context)?.canPop ?? false;
    return WillPopScope(
      onWillPop: () async {
        if (pushed) return true;
        homeController.updateTabIndex(0);
        return false;
      },
      child: Scaffold(
        backgroundColor: bg1,
        appBar: AppBar(
          automaticallyImplyLeading: false,
          leading: pushed
              ? IconButton(
                  icon: const Icon(Icons.arrow_back_rounded),
                  tooltip: 'Back',
                  onPressed: () => Navigator.of(context).pop(),
                )
              : null,
          backgroundColor: white,
          foregroundColor: tColor,
          elevation: 0.5,
          title: Text('Profile', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700)),
        ),
        body: RefreshIndicator(
          color: primary,
          onRefresh: () async {
            await profileController.getuserDetails(context: context);
            walletController.getWallet(context: context);
            await _loadSummary();
          },
          child: ListView(
            padding: const EdgeInsets.all(12),
            children: [
              _header(),
              _savings(),
              _quickActions(),
              const SectionTitle('Your account'),
              MenuGroup([
                MenuTile(icon: Icons.location_on_outlined, title: 'Saved addresses', onTap: () => _push(ManageAddress())),
                MenuTile(icon: Icons.cake_outlined, title: 'Birthday', subtitle: _birthdaySubtitle, onTap: _birthday),
                MenuTile(icon: Icons.photo_camera_outlined, title: 'Photo orders', subtitle: 'Orders you sent as a photo of your list', onTap: () => _push(const PhotoOrdersListScreen())),
                MenuTile(icon: Icons.forum_outlined, title: 'My requests', subtitle: 'Product requests and messages to us', onTap: () => _push(const MyRequestsScreen())),
                MenuTile(icon: Icons.notifications_none_rounded, title: 'Notifications', onTap: () => _push(const Notifications())),
                MenuTile(icon: Icons.tune_rounded, title: 'Notification settings', subtitle: 'Order updates and offers', onTap: () => _push(const NotificationSettingsScreen())),
              ]),
              const SectionTitle('Rewards'),
              MenuGroup([
                MenuTile(
                  icon: Icons.workspace_premium_outlined,
                  title: 'Membership',
                  subtitle: _membership != null ? '${_membership!.planName} · active' : 'Free delivery and extra cashback',
                  onTap: () => _push(const MembershipScreen()),
                ),
                MenuTile(icon: Icons.card_giftcard_rounded, title: 'Refer & earn', subtitle: 'Invite friends, both of you get wallet money', onTap: () => _push(const ReferralScreen())),
                MenuTile(icon: Icons.local_offer_outlined, title: 'Offers & coupons', onTap: () => _push(const Offers())),
              ]),
              const SectionTitle('Help'),
              MenuGroup([
                MenuTile(icon: Icons.support_agent_rounded, title: 'Help & support', subtitle: 'FAQs, call or message us', onTap: () => _push(const Support())),
                MenuTile(icon: Icons.privacy_tip_outlined, title: 'Privacy policy', onTap: () => CommonFunctions().openprivacy()),
                MenuTile(icon: Icons.description_outlined, title: 'Terms & conditions', onTap: () => CommonFunctions().openTerms()),
              ]),
              const SizedBox(height: 4),
              MenuGroup([
                MenuTile(icon: Icons.logout_rounded, title: 'Log out', color: red, trailing: const SizedBox.shrink(), onTap: _logout),
              ]),
              Center(
                child: TextButton(
                  onPressed: _deleteAccount,
                  child: Text('Delete account', style: GoogleFonts.poppins(fontSize: 12.5, color: grey70, decoration: TextDecoration.underline)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _header() => GetBuilder<ProfileController>(
        id: 'profile-update',
        builder: (_) {
          final u = profileController.users;
          final name = u == null ? '' : '${u.firstName} ${u.lastName}'.trim();
          return SectionCard(
            child: Row(children: [
              CircleAvatar(
                radius: 26,
                backgroundColor: primaryGhost,
                child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                    style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w800, color: primaryDark)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(name.isNotEmpty ? name : 'Your profile',
                      style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700, color: tColor)),
                  if (u != null) Text(u.mobileNumber, style: GoogleFonts.poppins(fontSize: 12.5, color: tColor3)),
                  if ((u?.emailId ?? '').isNotEmpty && u!.emailId != 'NA')
                    Text(u.emailId!, style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
                ]),
              ),
              TextButton(
                onPressed: u == null ? null : () => _push(EditProfile(users: u, profileController: profileController)),
                child: const Text('Edit'),
              ),
            ]),
          );
        },
      );

  /// Total saved on all delivered orders (offer prices + coupons).
  Widget _savings() {
    final s = _summary;
    if (s == null || s.deliveredOrders == 0 || s.totalSaved <= 0) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFFECFDF5), Color(0xFFD1FAE5)]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFA7F3D0)),
      ),
      child: Row(children: [
        Container(
          width: 40,
          height: 40,
          decoration: const BoxDecoration(color: white, shape: BoxShape.circle),
          child: const Icon(Icons.savings_rounded, color: primaryDark, size: 22),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text.rich(TextSpan(children: [
              TextSpan(text: 'You have saved ', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: tColor)),
              TextSpan(text: rupees(s.totalSaved), style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w800, color: primaryDark)),
            ])),
            Text('on ${s.deliveredOrders} order${s.deliveredOrders == 1 ? '' : 's'} with ClikGett',
                style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
          ]),
        ),
      ]),
    );
  }

  // Wallet and Help side by side, same size: icon, main line, small line.
  Widget _quickActions() => IntrinsicHeight(
        child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Expanded(
            child: Obx(() => _quick(Icons.account_balance_wallet_outlined, rupees(walletController.walletAmount.value), 'Wallet balance',
                () => _push(const WalletScreen()))),
          ),
          const SizedBox(width: 10),
          Expanded(child: _quick(Icons.support_agent_rounded, 'Help', 'Chat, call or FAQs', () => _push(const Support()))),
        ]),
      );

  Widget _quick(IconData icon, String title, String subtitle, VoidCallback onTap) => Material(
        color: white,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            constraints: const BoxConstraints(minHeight: 96),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: cardBorder)),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(color: primaryGhost, borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, color: primaryDark, size: 20),
              ),
              const SizedBox(height: 6),
              Text(title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, color: tColor)),
              Text(subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(fontSize: 11, color: tColor3)),
            ]),
          ),
        ),
      );
}
