import 'dart:async';
import 'dart:convert';

import 'package:fav_app/Constants/toast.dart';
import 'package:fav_app/Models/login/login_model.dart';
import 'package:fav_app/Screens/Auth_Screens/otp_Screen.dart';
import 'package:fav_app/Services/Auth/login_services.dart';
import 'package:fav_app/Services/common/common_services.dart';
import 'package:fav_app/Services/common/network_check.dart';
import 'package:fav_app/constants.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class LoginViewModel extends ChangeNotifier {
  bool isSendingOtp = false;
  bool isVerifyingOtp = false;

  bool get _isSendingOtp => isSendingOtp;

  bool get _isVerifyingOtp => isVerifyingOtp;

  setIsSendingOtp(val) {
    isSendingOtp = val;
    notifyListeners();
  }

  setIsVerifyingOtp(val) {
    isVerifyingOtp = val;
    notifyListeners();
  }

  sendOtp({
    context,
    body,
    bool resend = false,
  }) async {
    setIsSendingOtp(true);
    // Timer(Duration(seconds: 2), () {
    Network.networkCheck(context).then((value) async => value != null
        ? {
            await LoginServices.sentOtp(body).then((value) => value != null
                ? {
                    if (value.status == 1)
                      {
                        customToast(message: value.message),
                        if (resend == false)
                          {
                            navigateToOtpScreen(
                              context,
                              body['MobileNumber'],
                            ),
                          }
                      }
                    else
                      {
                        customToast(message: value.message),
                      },
                    setIsSendingOtp(false),
                  }
                : {
                    customToast(message: 'Error'),
                    setIsSendingOtp(false),
                  })
          }
        : {
            customToast(message: 'Network error'),
            setIsSendingOtp(false),
          });
    // });
  }

  verifyOtp({context, body}) async {
    setIsVerifyingOtp(true);
    // Timer(Duration(seconds: 2), () {
    // debugPrint(body);
    Network.networkCheck(context).then((value) => value != null
        ? {
            LoginServices.verifyOtp(body).then((value) async => value != null
                ? {
                    if (value.status == 1)
                      {
                        await saveUserData(
                                token: value.token, userDetails: value.userData)
                            .then((value) => {
                                  navigateToHomeScreen(context),
                                }),
                      }
                    else
                      {
                        customToast(message: value.message),
                      },
                    setIsVerifyingOtp(false),
                  }
                : {
                    debugPrint('herrreee'),
                    customToast(message: 'Error'),
                    setIsVerifyingOtp(false),
                  })
          }
        : {
            customToast(message: 'Network error'),
            setIsVerifyingOtp(false),
          });

    // });
  }

  Future saveUserData({UserData? userDetails, String? token}) async {
    if (userDetails != null) {
      CommonServices.saveUserData(jsonEncode(userDetails).toString());
    }
    if (token != null) {
      CommonServices.setToken(token);
    }
    debugPrint('data saved');
    return;
  }

  navigateToHomeScreen(context) {
    Navigator.pushNamedAndRemoveUntil(
        context, Constants().homePage, ModalRoute.withName('/'));
  }

  navigateToOtpScreen(
    context,
    number,
  ) {
    Navigator.push(
        context,
        MaterialPageRoute(
            builder: (context) => ChangeNotifierProvider(
                  create: (_) => LoginViewModel(),
                  child: OtpScreen(
                    number: number,
                  ),
                )));
    //         .then((value) => value != null
    // ? {
    //     Navigator.pop(context, true),
    //   }
    // : {});
  }
}
