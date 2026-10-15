import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/old/Models/Account/adresses.dart';
import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../old/Services/Account/adresses.dart';
import '../../old/Services/common/network_check.dart';
import '../NewScreens/Widgets/customToast.dart';

class AdressController extends GetxController {
  final RxBool _isLoading = false.obs;
  RxBool get isLoading => _isLoading;
  AdressesModel? adressesModel;
  RxList<Address> address = RxList();
  final HomeController _homeController = Get.find();
  final RxInt _selectedAdressId = 0.obs;
  RxInt get selectedAdressId => _selectedAdressId;
  var longitude = 0.0.obs;
  var latitude = 0.0.obs;

  bool isAddressSelected() {
    return _selectedAdressId.value != 0;
  }

  void updateUI() {
    update(['update-address']);
  }

  storeSelectedAdress(int id, double longitude, double latitude,) async {
    final SharedPreferences pref = await SharedPreferences.getInstance();
    pref.setInt('selectedAdressId', id);
    pref.setDouble("longitude", longitude);
    pref.setDouble("latitude", latitude);
    retriveStoredAdressData();
  }

  retriveStoredAdressData() async {
    final SharedPreferences pref = await SharedPreferences.getInstance();

    _selectedAdressId(pref.getInt('selectedAdressId') ?? 0);
    longitude(pref.getDouble('longitude'));
    latitude(pref.getDouble('latitude'));



    update(['update-radiobtn']);
  }

  removeStoredAddressData() async {
    final SharedPreferences pref = await SharedPreferences.getInstance();
    pref.remove('selectedAdressId');

    update(['update-radiobtn']);
  }

  Future<void> getAdresses({
    required context,
  }) async {
    Future.delayed(
      Duration.zero,
      () {
        _isLoading(true);
      },
    );
    Network.networkCheck(context).then((value) => value != null
        ? {
            AdresseServices.getAdressesAPi().then((value) => value != null
                ? {
                    if (value.status == 1)
                      {
                        adressesModel = value,
                        address(adressesModel?.address),
                        if (address.length == 1)
                          {
                            _homeController.storeLocation(
                                address.first, address),
                          },
                        _homeController.getstoredLocation(address),
                        if (address.isEmpty)
                          {
                            removeStoredAddressData(),
                          }
                        else
                          {
                            retriveStoredAdressData(),
                            Get.find<HomeController>().getstoredLocation(address),
                          }
                      }
                    else
                      {
                        customToast(message: value.message),
                      },
                    _isLoading(false)
                  }
                : {customToast(message: 'Error'), _isLoading(false)})
            //     .catchError((onError) {
            //   debugPrint(onError.toString());
            //   customToast(message: onError.toString());
            //   _isLoading(false);
            // })
          }
        : {customToast(message: 'Network error'), _isLoading(false)});
  }

  deleteAdresses({required context, required int adressId}) async {
    Network.networkCheck(context).then((value) async => value != null
        ? {
            await AdresseServices.deleteAdress(adressId)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            getAdresses(context: context),
                            customToast(message: value.message),
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                      }
                    : {
                        customToast(message: 'Error'),
                      })
          }
        : {
            customToast(message: 'Network error'),
          });
  }

  resetLoadingBtn() {
    Future.delayed(
      Duration.zero,
      () => _isLoading(false),
    );
  }

  addAdresses({
    context,
    body,
  }) async {
    _isLoading(true);
    Network.networkCheck(context).then((value) async => value != null
        ? {
            await AdresseServices.addAdress(body)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            getAdresses(context: context),
                            _isLoading(false),
                            customToast(message: value.message),
                            Navigator.pop(context, true)
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
              _isLoading(false);
            })
          }
        : {
            customToast(message: 'Network error'),
            _isLoading(false),
          });
  }

  updateAdresses({context, body, id}) async {
    _isLoading(true);

    Network.networkCheck(context).then((value) async => value != null
        ? {
            await AdresseServices.updateAdress(body, id)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            getAdresses(context: context),
                            _isLoading(false),
                            customToast(message: value.message),
                            Navigator.pop(context, true)
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
              _isLoading(false);
            })
          }
        : {
            customToast(message: 'Network error'),
            _isLoading(false),
          });
  }
}
