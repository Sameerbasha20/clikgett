import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fav_app/old/Models/Home/notification_model.dart' as notif;

import '../../old/Services/Home/notifications.dart';
import '../../old/Services/common/network_check.dart';
import '../NewScreens/Widgets/customToast.dart';

class NotificationController extends GetxController {
  final RxBool _isLoading = false.obs;
  RxBool get isLoading => _isLoading;
  notif.NotificationsModel? notificationsModel;
  RxList<notif.Notification> notifications = RxList();

  getnotification({
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
            NotificationsServices.getnotifications()
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            notificationsModel = value,
                            notifications(notificationsModel?.notifications)
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isLoading(false)
                      }
                    : {customToast(message: 'Error'), _isLoading(false)})
                .catchError((onError) {
              debugPrint(onError.toString());
              customToast(message: onError.toString());
              _isLoading(false);
            })
          }
        : {customToast(message: 'Network error'), _isLoading(false)});
  }

  readNotifications({required context, required body, required uid}) async {
    await Network.networkCheck(context).then((onValue) async => onValue != null
        ? {
            await NotificationsServices.readNotification(body: body, uid: uid)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            getnotification(context: context),
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isLoading(false)
                      }
                    : {customToast(message: 'Error'), _isLoading(false)})
                .catchError((onError) {
              debugPrint(onError.toString());
              customToast(message: onError.toString());
              _isLoading(false);
            })
          }
        : {customToast(message: 'Network error'), _isLoading(false)});
  }
}
