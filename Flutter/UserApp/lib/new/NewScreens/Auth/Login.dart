import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/Controllers/auth_controller.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:fav_app/new/NewScreens/Widgets/textfieldWidget.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../Controllers/home_controller.dart';
import '../Widgets/customToast.dart';
import 'Signup.dart';

class Login extends StatefulWidget {
  const Login({super.key, this.isScreenFromLogout = false});
  final bool isScreenFromLogout;
  @override
  State<Login> createState() => _LoginState();
}

class _LoginState extends State<Login> {
  TextEditingController mobileNumber = TextEditingController();
  final FocusNode _mobileNumber = FocusNode();
  List<String> number = List<String>.filled(1, '');
  final signUpKey = GlobalKey<FormState>();
  final AuthController controller = Get.find();
  @override
  void dispose() {
    controller.loadingBtnReset();
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
    return Scaffold(
      backgroundColor: bg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(5.w),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                height: 8.h,
              ),
              imageWidget(context),
              fieldWidget(context),
              RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: "Don’t have an account? ",
                      style: GoogleFonts.poppins(
                          color: Colors.black, fontSize: 17.sp),
                    ),
                    TextSpan(
                      text: "Register",
                      style:
                          GoogleFonts.poppins(color: primary, fontSize: 17.sp),
                      recognizer: TapGestureRecognizer()
                        ..onTap = () {
                          // Navigate to the new screen
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const SignUp(),
                            ),
                          );
                        },
                    ),
                    TextSpan(
                      text: " here",
                      style: GoogleFonts.poppins(
                          color: Colors.black, fontSize: 17.sp),
                    ),
                  ],
                ),
              ),
            ],
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
        //   width: 37.w,
        //   height: 27.h,
        //   fit: BoxFit.cover,
        // ),
        // SizedBox(
        //   height: 2.2.h,
        // ),
        Text(
         "Login",
          style: GoogleFonts.poppins(
            fontSize: 21.sp,
            fontWeight: FontWeight.w600,
            color: tblack1c,
          ),

        ),
        SizedBox(
          height: 1.2.h,
        ),
        Padding(
          padding: EdgeInsets.only(bottom: 4.h),
          child: Text(
             "Enter your details to login",
              style: GoogleFonts.poppins(
                fontSize: 17.sp,
                fontWeight: FontWeight.w500,
                color: tblack1c,
    ),
          )

        ),
      ],
    );
  }

  Widget fieldWidget(context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.start,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        customText(
            text: "Mobile Number",
            fontSize: 17.sp,
            fontWeight: FontWeight.w500,
            color: tblack1c),
        SizedBox(
          height: 2.h,
        ),
        Form(
          key: signUpKey,
          child: NumbertextFieldWidget(
              context: context,
              hint: "Mobile Number",
              hinttext: "Enter Mobile Number",
              hintStyle: GoogleFonts.montserrat(
                      fontSize: 16.sp, color: black.withOpacity(0.5)),
              controller: mobileNumber,
              currentFocus: _mobileNumber,
              nextFocus: null,
              holder: number,
              isPhoneNumber: true,
              onChanged: (p0) {
                if (p0.isNotEmpty) {
                  if (int.parse(p0) <= 5) {
                    mobileNumber.clear();
                    customToast(
                        message: 'Mobile Number Cannot Be Start With $p0');
                  }
                }
              },
              fontSize: 18.sp,
              fontWeight: FontWeight.w600,
              textColor: black,
              prefixIcon: Padding(
                  padding: const EdgeInsets.only(bottom: 0),
                  child: Image.asset(
                    mobicon,
                    height: 2.h,
                  ))),
        ),
        SizedBox(
          height: 3.h,
        ),
        Obx(() => controller.isLoading.isTrue
            ? const Center(
                child: CircularProgressIndicator.adaptive(),
              )
            :
        buttonWidget(
                borderRadius: 26,
                onTap: validate,
                context: context,
                text: "Send OTP")),
        SizedBox(
          height: 4.h,
        ),
      ],
    );
  }

  validate() {
    if (signUpKey.currentState!.validate()) {
      Map<String, dynamic> body = <String, dynamic>{};
      body['MobileNumber'] = mobileNumber.text;

      controller.sendOtp(
        context: context,
        body: body,
      );
      FocusManager.instance.primaryFocus?.unfocus();
    }
  }
}
