import 'dart:io';

import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/NewScreens/Homepage/Homepage.dart';
import 'package:fav_app/new/Controllers/auth_controller.dart';
import 'package:fav_app/new/NewScreens/Auth/auth_shell.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../Controllers/home_controller.dart';
import 'Signup.dart';

class Login extends StatefulWidget {
  const Login({super.key, this.isScreenFromLogout = false, this.initialMobile});
  final bool isScreenFromLogout;
  /// Prefilled when sign-up finds the number already has an account.
  final String? initialMobile;
  @override
  State<Login> createState() => _LoginState();
}

class _LoginState extends State<Login> {
  final TextEditingController mobileNumber = TextEditingController();
  final signUpKey = GlobalKey<FormState>();
  final AuthController controller = Get.find();

  @override
  void dispose() {
    controller.loadingBtnReset();
    mobileNumber.dispose();
    super.dispose();
  }

  @override
  void initState() {
    if (widget.initialMobile != null) mobileNumber.text = widget.initialMobile!;
    if (widget.isScreenFromLogout) {
      WidgetsBinding.instance.addPostFrameCallback((timeStamp) {
        final HomeController controller = Get.find();
        controller.updateTabIndex(-1);
      });
    }
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return AuthShell(
      title: 'Welcome back 👋',
      subtitle: 'Log in with your mobile number. We\'ll send you a one-time code.',
      children: [
        Form(
          key: signUpKey,
          child: AuthField(
            controller: mobileNumber,
            label: 'Mobile number',
            hint: '98765 43210',
            icon: Icons.phone_iphone_rounded,
            phone: true,
            action: TextInputAction.done,
            onSubmitted: (_) => validate(),
            validator: validateMobile,
          ),
        ),
        const SizedBox(height: 6),
        Obx(() => AuthButton(text: 'Send OTP', loading: controller.isLoading.isTrue, onTap: validate)),
        const SizedBox(height: 18),
        Row(children: [
          const Icon(Icons.verified_user_outlined, size: 18, color: primaryDark),
          const SizedBox(width: 8),
          Expanded(
            child: Text('Your number is only used to log in and to update you about orders.',
                style: GoogleFonts.poppins(fontSize: 12, color: tColor3)),
          ),
        ]),
        const SizedBox(height: 10),
        AuthSwitch(
          question: 'New to ClikGett?',
          action: 'Create an account',
          onTap: () => _openSignUp(),
        ),
        // App Store review: people must be able to browse without an account.
        if (Platform.isIOS)
          Center(
            child: TextButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const Homepage())),
              child: Text('Continue as guest', style: GoogleFonts.poppins(fontSize: 13.5, color: tColor3)),
            ),
          ),
      ],
    );
  }

  /// Sign-up sits on top of login; if it finds an existing account it comes back here with the number.
  Future<void> _openSignUp([String? mobile]) async {
    final back = await Navigator.push<String>(
        context, MaterialPageRoute(builder: (context) => SignUp(initialMobile: mobile)));
    if (back != null && mounted) mobileNumber.text = back;
  }

  void validate() {
    if (signUpKey.currentState!.validate()) {
      final mobile = mobileNumber.text.trim();
      controller.sendOtp(
        context: context,
        body: <String, dynamic>{'MobileNumber': mobile},
        onUserNotFound: () => _openSignUp(mobile),
      );
      FocusManager.instance.primaryFocus?.unfocus();
    }
  }
}
