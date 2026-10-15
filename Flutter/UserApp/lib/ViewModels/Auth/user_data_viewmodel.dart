import 'dart:convert';

import 'package:fav_app/Models/login/login_model.dart';
import 'package:fav_app/Services/common/common_services.dart';
import 'package:fav_app/constants.dart';
import 'package:flutter/widgets.dart';

class UserViewModel extends ChangeNotifier {
  UserData? userDetails;
  bool isLoadingUser = false;
  // int selectedLanguage = 1;

  UserData? get _userDetails => userDetails;
  bool get _isLoadingData => isLoadingUser;
  // int get _selectedLanguage => selectedLanguage;

  // setSelectedLanguage(val) {
  //   selectedLanguage = val;
  //   saveUserData(languageCode: val);
  //   notifyListeners();
  // }

  setUserDetails(val) {
    userDetails = val;
    debugPrint('user : $userDetails');
    notifyListeners();
  }

  setIsLoadingUser(val) {
    isLoadingUser = val;
    notifyListeners();
  }

  // getSelectedlanguageFromLocal() async {
  //   setIsLoadingUser(true);

  //   CommonServices.getLanguage()
  //       .then((value) => {setSelectedLanguage(value)})
  //       .catchError((e) {
  //     setUserDetails(null);
  //   });
  // }

  Future getUserDataFromLocal() async {
    setIsLoadingUser(true);
    debugPrint("load Data");

    await CommonServices.getUserData()
        .then((value) => value != ''
            ? {
                setUserDetails(UserData.fromJson(jsonDecode(value))),
              }
            : {
                setUserDetails(null),
              })
        .catchError((e) {
      setUserDetails(null);
    });
    return;
  }

  // getUserDataFromServer({required context}) async {
  //   // setIsVerifyingOtp(true);
  //   // Timer(Duration(seconds: 2), () {
  //   Network.networkCheck(context).then((value) => value != null
  //       ? {
  //           LoginServices.getUserData().then((value) => value != null
  //               ? {
  //                   if (value.status == 1)
  //                     {
  //                       saveUserData(userDetails: value.userDetails),
  //                       setUserDetails(value.userDetails),
  //                     }
  //                   else
  //                     {
  //                       customToast(message: value.message),
  //                       logout(context),
  //                     }

  //                   // setIsVerifyingOtp(false),
  //                 }
  //               : {
  //                   getUserDataFromLocal(),
  //                   // customToast(message: 'Error'),
  //                   // setIsVerifyingOtp(false),
  //                 })
  //         }
  //       : {
  //           getUserDataFromLocal(),

  //           // customToast(message: 'Network error'),
  //           // setIsVerifyingOtp(false),
  //         });
  //   // });
  // }

  saveUserData({UserData? userDetails, String? token, int? languageCode}) {
    if (userDetails != null) {
      CommonServices.saveUserData(jsonEncode(userDetails).toString());
    }
    if (token != null) {
      CommonServices.setToken(token);
    }
    // if (languageCode != null) {
    //   CommonServices.setLanguage(languageCode);
    // }
  }

  logout(context) {
    CommonServices.clearSavedData().then((value) async => {
          await getUserDataFromLocal(),
          Navigator.pushNamedAndRemoveUntil(
              context, Constants().loginScreen, (route) => false),
        });
  }
}
