// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/Auth/auth_shell.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../Controllers/auth_controller.dart';
import '../../Services/common/CommonFunctions.dart';

class SignUp extends StatefulWidget {
  const SignUp({super.key, this.initialMobile});

  /// Prefilled when login finds no account for the number.
  final String? initialMobile;

  @override
  State<SignUp> createState() => _SignUpState();
}

class _SignUpState extends State<SignUp> {
  final signUpKey = GlobalKey<FormState>();
  bool? agreeToTerms = false;

  TextEditingController name = TextEditingController();

  FocusNode nameFocus = FocusNode();

  TextEditingController mobileNumber = TextEditingController();
  FocusNode mobileNumberFocus = FocusNode();

  TextEditingController email = TextEditingController();

  TextEditingController referealCode = TextEditingController();
  // final List<String> _referal = List<String>.filled(1, '');

  final AuthController controller = Get.find();

  bool _showReferral = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialMobile != null) mobileNumber.text = widget.initialMobile!;
  }

  /// Back to login (with the number) — pop if login opened us, otherwise replace.
  void _goToLogin([String? mobile]) {
    if (Navigator.canPop(context)) {
      Navigator.pop(context, mobile);
    } else {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (context) => Login(initialMobile: mobile)));
    }
  }

  @override
  void dispose() {
    name.dispose();
    mobileNumber.dispose();
    referealCode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthShell(
      title: 'Create your account',
      subtitle: 'Groceries, essentials and prints, delivered in minutes.',
      children: [
        Form(
          key: signUpKey,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            AuthField(
              controller: name,
              label: 'Full name',
              hint: 'Your name',
              icon: Icons.person_outline_rounded,
              focusNode: nameFocus,
              capitalization: TextCapitalization.words,
              formatters: [LengthLimitingTextInputFormatter(25)],
              onSubmitted: (_) => mobileNumberFocus.requestFocus(),
              validator: (v) => (v ?? '').trim().length < 2 ? 'Enter your name' : null,
            ),
            AuthField(
              controller: mobileNumber,
              label: 'Mobile number',
              hint: '98765 43210',
              icon: Icons.phone_iphone_rounded,
              phone: true,
              focusNode: mobileNumberFocus,
              action: _showReferral ? TextInputAction.next : TextInputAction.done,
              validator: validateMobile,
            ),
            if (_showReferral)
              AuthField(
                controller: referealCode,
                label: 'Referral code (optional)',
                hint: 'e.g. RIU5NY50ON',
                icon: Icons.card_giftcard_rounded,
                action: TextInputAction.done,
                capitalization: TextCapitalization.characters,
                formatters: [LengthLimitingTextInputFormatter(25), UpperCaseTextFormatter()],
              )
            else
              TextButton.icon(
                style: TextButton.styleFrom(foregroundColor: primaryDark, padding: EdgeInsets.zero),
                onPressed: () => setState(() => _showReferral = true),
                icon: const Icon(Icons.card_giftcard_rounded, size: 18),
                label: Text('Have a referral code?', style: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w600)),
              ),
          ]),
        ),
        const SizedBox(height: 4),
        InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: () => setState(() => agreeToTerms = !(agreeToTerms ?? false)),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(children: [
              SizedBox(
                width: 24,
                height: 24,
                child: Checkbox(
                  value: agreeToTerms,
                  activeColor: primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  onChanged: (v) => setState(() => agreeToTerms = v),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text.rich(TextSpan(
                  text: 'I agree to the ',
                  style: GoogleFonts.poppins(color: tColor4, fontSize: 13),
                  children: [
                    TextSpan(
                      text: 'Terms & Conditions',
                      style: GoogleFonts.poppins(color: primaryDark, fontSize: 13, fontWeight: FontWeight.w700),
                      recognizer: TapGestureRecognizer()..onTap = () => CommonFunctions().openTerms(),
                    ),
                  ],
                )),
              ),
            ]),
          ),
        ),
        const SizedBox(height: 16),
        Obx(() => AuthButton(text: 'Sign up', loading: controller.isLoading.isTrue, onTap: validate)),
        const SizedBox(height: 10),
        AuthSwitch(
          question: 'Already have an account?',
          action: 'Log in',
          onTap: () => _goToLogin(),
        ),
      ],
    );
  }

  validate() {
    if (signUpKey.currentState!.validate()) {
      if (agreeToTerms == false) {
        customToast(message: 'Please accept the Terms and Conditions');
        return;
      } else {
        Map<String, dynamic> body = <String, dynamic>{};
        body['MobileNumber'] = mobileNumber.text.trim();
        body['FirstName'] = name.text.trim();
        body['EmailID'] = email.text;
        body['ReferredByCode'] = referealCode.text.trim();
        body['isScreenFromSignup'] = true;

        controller.sendOtp(
          context: context,
          body: body,
          onUserExists: () => _goToLogin(body['MobileNumber']),
        );
        FocusManager.instance.primaryFocus?.unfocus();
      }
    }
  }
}

class UpperCaseTextFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    return newValue.copyWith(
      text: newValue.text.toUpperCase(),
      selection: newValue.selection,
    );
  }
}
