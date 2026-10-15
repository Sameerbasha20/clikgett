import 'package:fav_app/new/NewScreens/Homepage/Homepage.dart';
import 'package:fav_app/old/Models/Users/usersDetails.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../old/Services/User/update_user.dart';
import '../../old/Services/common/network_check.dart';
import '../NewScreens/Widgets/customToast.dart';

class ProfileController extends GetxController {
  final RxBool _isLoading = false.obs;
  RxBool get isLoading => _isLoading;
  UserDetailsModel? userDetailsModel;
  Users? users;

  resetLoadingBtn() {
    Future.delayed(
      Duration.zero,
      () => _isLoading(false),
    );
  }

  updateUser({
    required context,
    required body,
    bool isUpdateUser = false,
    bool isFCMUpdate = false,
  }) async {
    if (!isFCMUpdate) {
      Future.delayed(
        Duration.zero,
        () {
          _isLoading(true);
        },
      );
    }

    Network.networkCheck(context).then((value) async => value != null
        ? {
            await UsersServices.updateeuser(body)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            if (!isFCMUpdate)
                              {
                                customToast(message: value.message),
                                if (isUpdateUser)
                                  {
                                    getuserDetails(context: context),
                                    Navigator.pop(context, true),
                                  }
                                else
                                  {
                                    Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                            builder: (_) => const Homepage()))
                                  }
                              }
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isLoading(false),
                      }
                    : {
                        // customToast(message: 'Error'),
                        // _isLoading(false),
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
  }

  updateProfile() {
    update(['profile-update']);
  }

  Future<void> getuserDetails({
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
            UsersServices.getuserDetails()
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            userDetailsModel = value,
                            users = userDetailsModel?.users,
                            updateProfile()
                          }
                        else
                          {
                            // customToast(message: value.message),
                          },
                        _isLoading(false)
                      }
                    : {
                        // customToast(message: 'Error'), _isLoading(false)
                      })
                .catchError((onError) {
              // debugPrint(onError.toString());
              // customToast(message: onError.toString());
              _isLoading(false);
            })
          }
        : {
            // customToast(message: 'Network error'), _isLoading(false)
          });
  }
}
