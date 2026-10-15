import 'dart:convert';
import 'package:fav_app/old/Models/Home/notification_model.dart';
import 'package:fav_app/old/Services/common/intercepter.dart';
import 'package:fav_app/old/constants.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';

import '../../Models/response_model.dart';

Client client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

class NotificationsServices {
  static Future getnotifications() {
    return client
        .get(
      Uri.parse('${Constants.baseUrl}/users/notifications'),
    )
        .then((response) {
      return NotificationsModel.fromJson(jsonDecode(response.body));
    });
  }

  static Future readNotification({required body, required uid}) {
    return client
        .put(Uri.parse('${Constants.baseUrl}/users/updatenotifications/$uid'),
            body: json.encode(body))
        .then((response) {
      return ResponseModel.fromJson(jsonDecode(response.body));
    });
  }
}
