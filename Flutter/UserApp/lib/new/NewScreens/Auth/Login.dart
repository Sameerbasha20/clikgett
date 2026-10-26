import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Controllers/auth_controller.dart';
import 'package:fav_app/new/NewScreens/Auth/auth_shell.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../Controllers/home_controller.dart';
import 'Signup.dart';

class Login extends StatefulWidget {
  const Login({super.key, this.isScreenFromLogout = false});
  final bool isScreenFromLogout;
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
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const SignUp())),
        ),
      ],
    );
  }

  void validate() {
    if (signUpKey.currentState!.validate()) {
      controller.sendOtp(
        context: context,
        body: <String, dynamic>{'MobileNumber': mobileNumber.text.trim()},
      );
      FocusManager.instance.primaryFocus?.unfocus();
    }
  }
}
