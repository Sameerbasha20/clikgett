import 'dart:convert';

import 'package:fav_app/Models/Home/notification_model.dart';
import 'package:fav_app/Services/common/intercepter.dart';
import 'package:fav_app/constants.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class NotificationsServices {
  static Future getnotifications() {
    return client
        .get(
      Uri.parse(Constants.baseUrl + '/users/notifications'),
    )
        .then((response) {
      return NotificationsModel.fromJson(jsonDecode(response.body));
    });
  }
}
