import 'dart:async';

import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:fav_app/new/Services/common/network_check.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../old/Services/Auth/login_services.dart';
import '../NewScreens/Account/CreateProfile.dart';
import '../NewScreens/Auth/OtpVerify.dart';
import '../NewScreens/Homepage/Homepage.dart';
import '../NewScreens/Widgets/customToast.dart';
import '../NewScreens/location/grantlocation.dart';

class AuthController extends GetxController {
  final RxBool _isLoading = false.obs;
  RxBool get isLoading => _isLoading;
  final RxBool _isResend = true.obs;
  RxBool get isResend => _isResend;
  late Timer _timer;
  int _stopCount = -1.obs;
  RxInt get stopCount => _stopCount.obs;
  final RxInt _pageCount = 0.obs;
  RxInt get pageCount => _pageCount;
  PageController pageController = PageController();
  void startPageTransition() {
    _timer = Timer.periodic(const Duration(seconds: 2), (timer) {
      _stopCount++;

      if (stopCount.value <= 1) {
        if (_pageCount < 2) {
          pageController.nextPage(
              duration: const Duration(milliseconds: 450), curve: Curves.ease);
          updateUi();
        }
      }
    });
  }

  updateUi() {
    update(['update-splash']);
  }

  updatePageCount(int val) {
    _pageCount(val);
  }

  late Timer timer;
  RxInt finalTimer = 10.obs;

  resendTimer() {
    timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (finalTimer.value <= 0) {
        timer.cancel();
        _isResend(false);
      } else {
        _isResend(true);
        finalTimer.value--;
      }
    });
  }

  resetTimer() {
    timer.cancel();
    Future.delayed(
      Duration.zero,
      () {
        _isResend(true);
        finalTimer(10);
        _pageCount(0);
      },
    );
  }

  void resetValues() {
    _timer.cancel();

    pageController.dispose();
  }

  void loadingBtnReset() {
    _isLoading(false);
  }

  sendOtp({
    context,
    body,
    bool resend = false,
  }) async {
    _isLoading(true);
    Network.networkCheck(context).then((value) async => value != null
        ? {
    if(body['isScreenFromSignup']!=null){
      await LoginServices.SIGNUPsentOtp(body)
          .then((value) async => value != null
          ? {
        if (value.status == 1)
          {
            customToast(message: value.message),
            if (resend == false)
              {
                Navigator.of(context).push(MaterialPageRoute(
                    builder: (context) => OtpVerify(
                        body: body,
                        mobileNumber: body['MobileNumber']))),
              }
            else
              {
                resetTimer(),
                resendTimer(),
              }
          }
        else
          {
            customToast(message: value.message),
          },
        _isLoading(false),
      }
          : {
        customToast(message: 'Error'),
        _isLoading(false),
      })
          .catchError((onError) {
        customToast(message: onError.toString());
        debugPrint(onError.toString());
        _isLoading(false);
        return <dynamic>{};
      })

    }else{
      await LoginServices.sentOtp(body)
          .then((value) async => value != null
          ? {
        if (value.status == 1)
          {
            customToast(message: value.message),
            if (resend == false)
              {
                Navigator.of(context).push(MaterialPageRoute(
                    builder: (context) => OtpVerify(
                        body: body,
                        mobileNumber: body['MobileNumber']))),
              }
            else
              {
                resetTimer(),
                resendTimer(),
              }
          }
        else
          {
            customToast(message: value.message),
          },
        _isLoading(false),
      }
          : {
        customToast(message: 'Error'),
        _isLoading(false),
      })
          .catchError((onError) {
        customToast(message: onError.toString());
        debugPrint(onError.toString());
        _isLoading(false);
        return <dynamic>{};
      })

    }

          }
        : {
            customToast(message: 'Network error'),
            _isLoading(false),
          });
  }

  verifyOtp({context, body}) async {
    _isLoading(true);

    Network.networkCheck(context).then((value) => value != null
        ? {
            LoginServices.verifyOtp(body)
                .then((value) async => value != null
                    ? {
                        if (value.status == 1)
                          {
                            if(body['isScreenFromSignup']!=null){

                              await CommonServices.setToken(value.token)
                                  .then((val) {
                                if (val == true) {


                                    // Navigator.of(context).push(MaterialPageRoute(
                                    //     builder: (context) => CreateProfile(
                                    //           number: body['MobileNumber'],
                                    //         )));
                                    Navigator.of(context).pushReplacement(MaterialPageRoute(
                                        builder: (context) =>
                                        const GrantLocation()));

                                }
                              })

                            }else{
                              await CommonServices.setToken(value.token)
                                  .then((val) {
                                if (val == true) {
                                  if (value.userData.firstName != 'NA') {
                                    Navigator.of(context).push(MaterialPageRoute(
                                        builder: (context) => const Homepage()));
                                  } else {
                                    // Navigator.of(context).push(MaterialPageRoute(
                                    //     builder: (context) => CreateProfile(
                                    //           number: body['MobileNumber'],
                                    //         )));
                                    Navigator.of(context).push(MaterialPageRoute(
                                        builder: (context) =>
                                        const GrantLocation()));
                                  }
                                }
                              })
                            }

                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isLoading(false),
                      }
                    : {
                        debugPrint('herrreee'),
                        customToast(message: 'Error'),
                        _isLoading(false),
                      })
                .catchError((onError) {
              debugPrint(onError.toString());
              customToast(message: onError.toString());
              _isLoading(false);
            })
          }
        : {
            customToast(message: 'Network error'),
            _isLoading(false),
          });

    // });
  }
}
