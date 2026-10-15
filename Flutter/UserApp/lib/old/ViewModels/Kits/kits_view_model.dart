import 'package:fav_app/old/Constants/toast.dart';
import 'package:fav_app/old/Services/Products/product_services.dart';
import 'package:fav_app/old/Services/common/network_check.dart';
import 'package:flutter/material.dart';

class KitsViewModel extends ChangeNotifier {
  bool isLoading = false;

  List<dynamic> products = [];

  bool get _isLoading => isLoading;
  List<dynamic> get _product => products;

  setData(val) {
    products = val;
    notifyListeners();
  }

  setLoading(val) {
    isLoading = val;
    notifyListeners();
  }

  getData({
    required context,
  }) async {
    setLoading(true);
    // Timer(Duration(seconds: 2), () {
    Network.networkCheck(context).then((value) => value != null
        ? {
            ProductServices.getKits().then((value) => value != null
                ? {
                    if (value.status == 1)
                      {
                        if (value.products != null)
                          {
                            setData(value.products),
                          }
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
