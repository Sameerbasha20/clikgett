import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../NewModel/push_notification.dart';

class NotificationApi {
  static final _notification = FlutterLocalNotificationsPlugin();

  static void init() {
    _notification.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      ),
    );
  }

  //add the method to NotificationApi class

  static pushNotification(PushNotificationsModel? data) async {
    var androidPlatformChannelSpecifics =
        AndroidNotificationDetails('channed id', 'channel name',
            channelDescription: 'channel description',
            importance: Importance.max,
            priority: Priority.high,
            styleInformation: BigTextStyleInformation(
              data?.body ?? '',
              htmlFormatBigText: true,
            ),
            icon: '@mipmap/ic_launcher');
    var iOSPlatformChannelSpecifics = const DarwinNotificationDetails();
    var platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
      iOS: iOSPlatformChannelSpecifics,
    );

    await _notification.show(
        0, data?.title, data?.body, platformChannelSpecifics);
  }
}
