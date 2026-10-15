
import 'package:fav_app/Constants/toast.dart';
import 'package:fav_app/Models/Home/notification_model.dart';
import 'package:fav_app/Services/Home/notifications.dart';
import 'package:fav_app/Services/common/network_check.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class NotificationViewModel extends ChangeNotifier {
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

  NotificationsModel? notificationsModel;

  bool get _isLoading => isLoading;
  NotificationsModel? get _adressmodel => notificationsModel;

  setAdressData(val) {
    notificationsModel = val;
    notifyListeners();
  }

  getnotification({
    required context,
  }) async {
    setLoading(true);
    Network.networkCheck(context).then((value) => value != null
        ? {
            NotificationsServices.getnotifications()
                .then((value) => value != null
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
}
