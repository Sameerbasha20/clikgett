import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/Controllers/auth_controller.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/common/toast_guard.dart';
import 'package:fav_app/old/Services/Auth/login_services.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:pinput/pinput.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../Constants/imageslist.dart';

class OtpVerify extends StatefulWidget {
  OtpVerify({super.key, required this.mobileNumber, this.body});
  var mobileNumber;
  final Map<String, dynamic>? body;
  @override
  State<OtpVerify> createState() => _OtpVerifyState();
}

class _OtpVerifyState extends State<OtpVerify> {
  @override
  void initState() {
    super.initState();
    authController.resendTimer();
  }

  final otpKey = GlobalKey<FormState>();
  TextEditingController otpController = TextEditingController();
  List<String> otplist = List<String>.filled(1, '');
  bool hide = true;
  final AuthController authController = Get.find();
  @override
  void dispose() {
    authController.loadingBtnReset();
    authController.resetTimer();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent, // Adjust color if needed
        elevation: 0, // Removes shadow
        leading: IconButton(
          icon: Image.asset(
            arrowback,
            height: 4.h,
          ),
          // Back icon
          onPressed: () {
            Navigator.pop(context); // Navigates back to the previous screen
          },
        ),
      ),
      body: SafeArea(
        child: Form(
          key: otpKey,
          child: Center(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(5.w),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  imageWidget(context),
                  buttonsWidget(context),
                ],
              ),
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
        //   image: AssetImage(otpBanner),
        //   width: 60.w,
        //   height: 26.h,
        //   fit: BoxFit.contain,
        // ),
        // SizedBox(
        //   height: 0.4.h,
        // ),
        Text(
          "Enter the verification code",
          style: GoogleFonts.poppins(
            fontSize: 17.sp,
            fontWeight: FontWeight.w600,
          ),
        ),
        Padding(
          padding: EdgeInsets.symmetric(vertical: 2.h),
          child: Text(
            "We Have Sent You A Four-Digit Code On  ${widget.mobileNumber}",
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w500,
              color: tblack1c,
              fontSize: 15.sp,
            ),
            textAlign: TextAlign.center,
          ),
        ),
        SizedBox(
          height: 1.h,
        )
      ],
    );
  }

  Widget buttonsWidget(context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        otpBoxes(),
        resendButton(),
        SizedBox(
          height: 4.h,
        ),
        Obx(() => authController.isLoading.isTrue
            ? const Center(
                child: CircularProgressIndicator.adaptive(),
              )
            : buttonWidget(
                onTap: () async {
                  if (validateAndSave()) {
                    if (otpController.text.isNotEmpty) {
                      if (otpController.text.length == LoginServices.otpLength) {
                        Map<String, dynamic> body = <String, dynamic>{};
                        if (widget.body != null) {
                          body.addAll(widget.body!);
                        }
                        body['MobileNumber'] = widget.mobileNumber;
                        body['OTP'] = otpController.text;

                        // body['FcmToken'] =
                        //     await FirebaseMessaging.instance.getToken();

                        debugPrint(body.toString());
                        authController.verifyOtp(
                          body: body,
                          context: context,
                        );
                        ToastGuard.blockAllToasts = false;
                      } else {
                        customToast(message: 'Invalid Otp');
                      }
                    } else {
                      customToast(message: 'Please Enter Otp');
                    }
                  }
                },
                borderRadius: 26,
                context: context,
                text: "Verify OTP")),
        SizedBox(
          height: 4.h,
        ),
      ],
    );
  }

  Widget otpBoxes() {
    return Padding(
      padding: EdgeInsets.fromLTRB(14.w, 1.h, 14.w, 1.h),
      child: Pinput(
        length: LoginServices.otpLength,
        controller: otpController,
        autofillHints: const [AutofillHints.oneTimeCode],
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        defaultPinTheme: PinTheme(
          width: 12.w,
          height: 15.w,
          padding: EdgeInsets.all(1.h),
          textStyle: customTextstyle(fontSize: 19.sp),
          decoration: BoxDecoration(
            color: Colors.transparent, // No background color
            border: Border.all(
                width: 1.5,
                color: const Color(0xffadadad)), // Border color visible
            borderRadius: BorderRadius.circular(1.h),
          ),
        ),
      ),
    );
  }

  Widget resendButton() {
    return Obx(
      () => authController.isResend.isTrue
          ? Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "Resend OTP In ",
                    style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w500, color: ordersPrimaryColor),
                  ),
                  Text(
                    authController.finalTimer.value <= 9
                        ? '00:0${authController.finalTimer.value}'
                        : '00:${authController.finalTimer.value}',
                    style: customTextstyle(
                        color: primary, fontWeight: FontWeight.w600),
                  )
                ],
              ),
            )
          : Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  "Didn’t receive code ?",
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w500),
                ),
                TextButton(
                    onPressed: () {
                      otpController.clear();
                      Map<String, dynamic> body = <String, dynamic>{};
                      body['MobileNumber'] = widget.mobileNumber;

                      authController.sendOtp(
                        resend: true,
                        context: context,
                        body: body,
                      );
                    },
                    child: Text(
                      "Resend",
                      style: customTextstyle(
                          color: primary, fontWeight: FontWeight.w600),
                    )),
              ],
            ),
    );
  }

  bool validateAndSave() {
    final form = otpKey.currentState!;
    if (!form.validate()) {
      return false;
    } else {
      form.save();

      return true;
    }
  }
}
