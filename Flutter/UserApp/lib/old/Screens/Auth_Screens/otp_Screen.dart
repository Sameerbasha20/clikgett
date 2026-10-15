import 'package:fav_app/old/Constants/toast.dart';
import 'package:fav_app/old/ViewModels/Auth/login_view_model.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:pin_input_text_field/pin_input_text_field.dart';
import 'package:provider/provider.dart';

import '../../Constants/button.dart';
import '../../Constants/colors.dart';
import '../../Constants/text.dart';

class OtpScreen extends StatefulWidget {
  String number;
  OtpScreen({Key? key, required this.number}) : super(key: key);

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final formKey = GlobalKey<FormState>();
  TextEditingController otpController = TextEditingController();
  FocusNode _otpFocus = FocusNode();
  List<String?> otp = List.filled(1, '');
  LoginViewModel? loginViewModel;

  @override
  void initState() {
    super.initState();
    Firebase.initializeApp();
  }

  bool validateAndSave() {
    final form = formKey.currentState!;
    if (!form.validate()) {
      return false;
    } else {
      form.save();

      return true;
    }
  }

  @override
  Widget build(BuildContext context) {
    var size = MediaQuery.of(context).size;
    if (mounted) {
      loginViewModel = context.watch<LoginViewModel>();
    }
    return Form(
      key: formKey,
      child: Material(
        child: SafeArea(
          child: Scaffold(
            body: Container(
              height: size.height,
              width: size.width,
              decoration:
                  BoxDecoration(gradient: LinearGradient(colors: lGColor)),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  image(height: size.height, width: size.width),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          height: size.height * .08,
                        ),
                        constantText(
                            text: 'Add the user code to link\nyour account',
                            textAlign: TextAlign.center),
                        SizedBox(
                          height: size.height * .02,
                        ),
                        pinWidget(),
                        button(),
                        SizedBox(
                          height: size.height * .04,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget pinWidget() {
    return Container(
        padding: const EdgeInsets.symmetric(horizontal: 30),
        margin: const EdgeInsets.symmetric(vertical: 20),
        child: PinInputTextField(
          pinLength: 4,
          decoration: UnderlineDecoration(
              textStyle: textFieldTextStyle(fontSize: 18, color: tWhite),
              lineHeight: 1,
              colorBuilder: PinListenColorBuilder(tWhite, tWhite)),
          controller: otpController,
          textInputAction: TextInputAction.go,
          focusNode: _otpFocus,
          enabled: true,
          keyboardType: TextInputType.number,
          inputFormatters: <TextInputFormatter>[
            FilteringTextInputFormatter.allow(RegExp("[0-9a-zA-Z]")),
          ],
          onChanged: (pin) {
            debugPrint('onChanged execute. pin:$pin');
          },
          enableInteractiveSelection: false,
          cursor: Cursor(
            width: 2,
            color: tTransperent,
          ),
        ));
  }

  Widget image({double? height, double? width}) {
    return Center(
      child: Image.asset(
        'Assets/Images/fav_App_fav_logo.png',
        height: height! * .1,
        width: double.infinity,
        fit: BoxFit.contain,
      ),
    );
  }

  Widget button() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 25),
      child: loginViewModel!.isVerifyingOtp == true
          ? loadingButton(color: tWhite)
          : buttonWidget(
              text: 'PROCEED',
              onTap: () async {
                if (validateAndSave()) {
                  if (otpController.text.isNotEmpty) {
                    if (otpController.text.length == 4) {
                      Map<String, dynamic> body = Map<String, dynamic>();
                      body['MobileNumber'] = widget.number;
                      body['OTP'] = otpController.text;

                      body['FcmToken'] =
                          await FirebaseMessaging.instance.getToken();

                      debugPrint(body.toString());
                      loginViewModel!.verifyOtp(
                        body: body,
                        context: context,
                      );
                    } else {
                      customToast(message: 'OTP Should be 4 Numbers');
                    }
                  } else {
                    customToast(message: 'Enter OTP');
                  }
                }
              }),
    );
  }
}
