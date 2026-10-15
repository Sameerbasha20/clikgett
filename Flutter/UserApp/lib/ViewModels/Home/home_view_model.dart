import 'package:fav_app/Constants/toast.dart';
import 'package:fav_app/Models/Home/home_model.dart';
import 'package:fav_app/Services/Home/home_services.dart';
import 'package:fav_app/Services/common/network_check.dart';
import 'package:flutter/cupertino.dart';

class HomeViewModel extends ChangeNotifier {
  bool isLoading = false;

  HomeModel? homeData;

  bool get _isLoading => isLoading;
  HomeModel? get _homeData => homeData;

  setHomeData(val) {
    homeData = val;
    notifyListeners();
  }

  setLoading(val) {
    isLoading = val;
    notifyListeners();
  }

  getHome({
    required context,
  }) async {
    setLoading(true);
    // Timer(Duration(seconds: 2), () {
    Network.networkCheck(context).then((value) => value != null
        ? {
            HomeServices.getHome().then((value) => value != null
                ? {
                    if (value.status == 1)
                      {
                        setHomeData(value),
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
    // });
  }
}
