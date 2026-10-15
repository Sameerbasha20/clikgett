import 'dart:async';
import 'dart:convert';
import 'package:fav_app/old/Constants/toast.dart';
import 'package:fav_app/old/Models/Account/adresses.dart';
import 'package:fav_app/old/Models/login/login_model.dart';
import 'package:fav_app/old/Services/Account/adresses.dart';
import 'package:fav_app/old/Services/common/common_services.dart';
import 'package:fav_app/old/Services/common/network_check.dart';
import 'package:fav_app/old/constants.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class AcountViewModel extends ChangeNotifier {
  bool issendingAdress = false;

  bool get _issendingAdress => issendingAdress;

  setIsAdressSending(val) {
    issendingAdress = val;
    notifyListeners();
  }

  setLoading(val) {
    isLoading = val;
    notifyListeners();
  }

  bool isLoading = false;

  AdressesModel? adressesModel;

  bool get _isLoading => isLoading;
  AdressesModel? get _adressmodel => adressesModel;

  setAdressData(val) {
    adressesModel = val;
    debugPrint("cart:  ${adressesModel!.toJson()}");
    notifyListeners();
  }

  addAdresses({
    context,
    body,
  }) async {
    setIsAdressSending(true);
    // Timer(Duration(seconds: 2), () {
    Network.networkCheck(context).then((value) async => value != null
        ? {
            await AdresseServices.addAdress(body).then((value) => value != null
                ? {
                    if (value.status == 1)
                      {
                        customToast(message: value.message),
                        Navigator.pop(context, true)
                      }
                    else
                      {
                        customToast(message: value.message),
                      },
                    setIsAdressSending(false),
                  }
                : {
                    customToast(message: 'Error'),
                    setIsAdressSending(false),
                  })
          }
        : {
            customToast(message: 'Network error'),
            setIsAdressSending(false),
          });
  }

  updateAdresses({context, body, id}) async {
    setIsAdressSending(true);
    // Timer(Duration(seconds: 2), () {
    Network.networkCheck(context).then((value) async => value != null
        ? {
            await AdresseServices.updateAdress(body, id)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            customToast(message: value.message),
                            Navigator.pop(context, true)
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        setIsAdressSending(false),
                      }
                    : {
                        customToast(message: 'Error'),
                        setIsAdressSending(false),
                      })
          }
        : {
            customToast(message: 'Network error'),
            setIsAdressSending(false),
          });
  }

  deleteAdresses({required context, required adressId}) async {
    setIsAdressSending(true);
    Network.networkCheck(context).then((value) async => value != null
        ? {
            await AdresseServices.deleteAdress(adressId)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            customToast(message: value.message),
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        setIsAdressSending(false),
                      }
                    : {
                        customToast(message: 'Error'),
                        setIsAdressSending(false),
                      })
          }
        : {
            customToast(message: 'Network error'),
            setIsAdressSending(false),
          });
    notifyListeners();
  }

  getAdresses({
    required context,
  }) async {
    setLoading(true);
    Network.networkCheck(context).then((value) => value != null
        ? {
            AdresseServices.getAdressesAPi().then((value) => value != null
                ? {
                    if (value.status == 1)
                      {
                        setAdressData(value),
                      }
                    else
                      {
                        customToast(message: value.message),
                      },
                    setLoading(false)
                  }
                : {customToast(message: 'Error'), setLoading(false)})
          }
        : {customToast(message: 'Network error'), setLoading(false)});
    notifyListeners();
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
}
