// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/Auth/OtpVerify.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/NewScreens/Widgets/textfieldWidget.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:get/get_core/src/get_main.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../Controllers/auth_controller.dart';
import '../../Services/common/CommonFunctions.dart';

class SignUp extends StatefulWidget {
  const SignUp({super.key});

  @override
  State<SignUp> createState() => _SignUpState();
}

class _SignUpState extends State<SignUp> {
  final signUpKey = GlobalKey<FormState>();
  bool? agreeToTerms = false;

  TextEditingController name = TextEditingController();

  FocusNode nameFocus = FocusNode();
  final List<String> _name = List<String>.filled(1, '');

  TextEditingController mobileNumber = TextEditingController();
  FocusNode mobileNumberFocus = FocusNode();
  final List<String> _mobilenumber = List<String>.filled(1, '');

  TextEditingController email = TextEditingController();
  FocusNode emailFocus = FocusNode();
  final List<String> _email = List<String>.filled(1, '');

  TextEditingController referealCode = TextEditingController();
  // final List<String> _referal = List<String>.filled(1, '');

  final AuthController controller = Get.find();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bg,
      body: SafeArea(
        child: Form(
          key: signUpKey,
          child: SingleChildScrollView(
            physics: BouncingScrollPhysics(),
            padding: EdgeInsets.only(left: 5.w, top: 10.h, right: 5.w),
            child: Column(
              children: [
                imageWidget(context),
                fieldWidgets(context),
                SizedBox(
                  height: 3.h,
                ),
                RichText(
                  text: TextSpan(
                    children: [
                      TextSpan(
                        text: "Already have an account ? ",
                        style: GoogleFonts.poppins(
                            color: Colors.black, fontSize: 16.sp),
                      ),
                      TextSpan(
                        text: "Login",
                        style: GoogleFonts.poppins(
                            color: primary, fontSize: 16.sp),
                        recognizer: TapGestureRecognizer()
                          ..onTap = () {
                            // Navigate to the new screen and replace the current one
                            Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const Login(),
                              ),
                            );
                          },
                      ),
                      TextSpan(
                        text: " here",
                        style: GoogleFonts.poppins(
                            color: Colors.black, fontSize: 16.sp),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget imageWidget(context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Image(
        //   image: AssetImage(loginBanner),
        //   width: 50.w,
        //   height: 17.h,
        //   fit: BoxFit.contain,
        // ),
        SizedBox(
          height: 1.h,
        ),
        Text(
          "Signup",
          style: GoogleFonts.poppins(
            fontSize: 24.sp,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(
          height: 0.8.h,
        ),
        Text(
          "Enter your details to Signup",
          style: GoogleFonts.poppins(
            fontSize: 16.sp,
            fontWeight: FontWeight.w500,
          ),
        ),
        SizedBox(
          height: 4.h,
        ),
      ],
    );
  }

  Widget fieldWidgets(context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.start,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        customText(
          text: "User Name",
          fontWeight: FontWeight.w500,
        ),
        SizedBox(
          height: 1.h,
        ),
        textFieldWidget(
          inputFormatters: [
            LengthLimitingTextInputFormatter(25), // Restrict length to 7
          ],
          context: context,
          prefixIcon: ImageIcon(
            AssetImage(userIcon),
            color: black,
          ),
          hint: "Enter Full Name",
          hinttext: "Enter Full Name",
          hintStyle: GoogleFonts.montserrat(),
          controller: name,
          onChanged: (p0) {
            if (p0 == ' ') {
              name.clear();
            }
          },
          currentFocus: nameFocus,
          textCapitalization: TextCapitalization.words,
          nextFocus: mobileNumberFocus,
          holder: _name,
          fillColor: bg1,
          textColor: black.withOpacity(0.50),
        ),
        SizedBox(
          height: 10,
        ),
        // customText(
        //   text: "Email",
        //   fontWeight: FontWeight.w600,
        // ),
        // SizedBox(
        //   height: 1.h,
        // ),
        // textFieldWidget(
        //   context: context,
        //   prefixIcon: ImageIcon(
        //     AssetImage(mailIcon),
        //     color: black,
        //   ),
        //   hint: "Enter your email (optional)",
        //   hinttext: "Enter Your Email (optional)",
        //   hintStyle: GoogleFonts.montserrat(),
        //   controller: email,
        //   currentFocus: emailFocus,
        //   validation: false,
        //   nextFocus: null,
        //   onChanged: (p0) {
        //     if (p0 == ' ') {
        //       email.clear();
        //     }
        //   },
        //   holder: _email,
        //   isEmail: true,
        //   fillColor: bg1,
        //   textColor: black.withOpacity(0.50),
        // ),
        SizedBox(
          height: 1.h,
        ),
        customText(
          text: "Mobile Number",
          fontWeight: FontWeight.w500,
        ),
        SizedBox(
          height: 1.h,
        ),
        NumbertextFieldWidget(
          context: context,
          prefixIcon: ImageIcon(
            AssetImage(phoneIcon),
            color: black,
          ),
          hint: "Mobile Number",
          hintStyle: GoogleFonts.montserrat(),
          hinttext: "Enter Mobile Number",
          controller: mobileNumber,
          currentFocus: mobileNumberFocus,
          nextFocus: emailFocus,
          holder: _mobilenumber,
          onChanged: (p0) {
            if (p0.isNotEmpty) {
              if (int.parse(p0) <= 5) {
                mobileNumber.clear();
                customToast(message: 'Mobile Number Cannot Be Start With $p0');
              }
            }
          },
          isPhoneNumber: true,
          fillColor: bg1,
          textColor: black.withOpacity(0.50),
        ),
        SizedBox(height: 2.h),
        customText(
          text: "Referral Code",
          fontWeight: FontWeight.w500,
        ),
        SizedBox(
          height: 1.h,
        ),
        textFieldWidget(
            inputFormatters: [
              LengthLimitingTextInputFormatter(25), // Restrict length to 7
              UpperCaseTextFormatter(),
            ],
            context: context,
            prefixIcon: Icon(
              Icons.celebration,
              color: black.withOpacity(0.5),
            ),
            hint: "Enter Referral Code",
            hinttext: "Enter Referral Code (optional)",
            hintStyle: GoogleFonts.montserrat(),
            controller: referealCode,
            onChanged: (p0) {
              if (p0 == ' ') {
                referealCode.clear();
              }
            },
            // currentFocus: nameFocus,
            textCapitalization: TextCapitalization.characters,
            // nextFocus: mobileNumberFocus,
            holder: _name,
            fillColor: bg1,
            textColor: black.withOpacity(0.50),
            validation: false),
        // Checkbox for Terms and Conditions
        // CheckboxListTile(
        //   value: agreeToTerms,
        //   onChanged: (bool? value) {
        //     setState(() {
        //       agreeToTerms = value ?? false;
        //     });
        //   },
        //   title: Text(
        //     "Terms and Conditions",
        //     style: GoogleFonts.poppins(fontSize: 16.sp),
        //   ),
        //   controlAffinity: ListTileControlAffinity.leading,
        //   activeColor: primary,
        // ),
        Row(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: <Widget>[
            // const SizedBox(width: 10),
            Checkbox(
              value: agreeToTerms,
              onChanged: (bool? newValue) {
                setState(() {
                  agreeToTerms = newValue;
                });
              },
            ),
            RichText(
              text: TextSpan(
                text: 'I agree to the ',
                style: GoogleFonts.poppins(
                  color: Colors.black,
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w600,
                ),
                children: <TextSpan>[
                  TextSpan(
                    text: 'Terms and Conditions',
                    style: GoogleFonts.poppins(
                      color: Colors.red,
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w600,
                    ),
                    recognizer: TapGestureRecognizer()
                      ..onTap = () {
                        // Add your logic to open Terms and Conditions
                        CommonFunctions().openTerms();
                      },
                  ),
                ],
              ),
            ),
          ],
        ),
        SizedBox(
          height: 2.h,
        ),
        buttonWidget(
            onTap: () {
              if (email.text.isEmpty ||
                  Constants().regex.hasMatch(email.text)) {
                validate();
              } else {
                customToast(message: 'Invalid Email Id');
              }
            },
            borderRadius: 26,
            context: context,
            text: "Sign Up"),
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
        body['MobileNumber'] = mobileNumber.text;
        body['FirstName'] = name.text;
        body['EmailID'] = email.text;
        body['ReferredByCode'] = referealCode.text;
        body['isScreenFromSignup'] = true;

        print(body);

        controller.sendOtp(
          context: context,
          body: body,
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
