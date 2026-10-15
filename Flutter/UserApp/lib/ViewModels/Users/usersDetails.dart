import 'package:fav_app/Constants/toast.dart';
import 'package:fav_app/Models/Users/usersDetails.dart';
import 'package:fav_app/Services/User/update_user.dart';
import 'package:fav_app/Services/common/network_check.dart';
import 'package:flutter/cupertino.dart';

class UsersViewModel extends ChangeNotifier {
  bool isLoading = false;

  UserDetailsModel? userDetailsModel;

  bool get _isLoading => isLoading;
  UserDetailsModel? get _usersDetailModel => userDetailsModel;

  setprofileupdate(val) {
    userDetailsModel = val;
    debugPrint("cart:  ${userDetailsModel!.toJson()}");
    notifyListeners();
  }

  setLoading(val) {
    isLoading = val;
    notifyListeners();
  }

  updateuserDetails({required context, body}) async {
    setLoading(true);
    Network.networkCheck(context).then((value) => value != null
        ? {
            UsersServices.updateeuser(body).then((value) => value != null
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
                    //   {
                    //     setprofileupdate(value),
                    //   }
                    // else
                    //   {
                    //     customToast(message: value.message),
                    //   },
                    setLoading(false)
                  }
                : {customToast(message: 'Error'), setLoading(false)})
          }
        : {customToast(message: 'Network error'), setLoading(false)});
  }

  getuserDetails({
    required context,
  }) async {
    setLoading(true);
    Network.networkCheck(context).then((value) => value != null
        ? {
            UsersServices.getuserDetails().then((value) => value != null
                ? {
                    if (value.status == 1)
                      {
                        setprofileupdate(value),
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
  }
}
