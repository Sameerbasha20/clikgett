String appname = 'FavMall';

class Constants {
  final String pattern =
      r'^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$';
  late RegExp regex = RegExp(pattern);

  static String baseUrlDev = const String.fromEnvironment('API_BASE_URL', defaultValue: "http://192.168.1.8:5000/api");
  static String baseUrlProd = const String.fromEnvironment('API_BASE_URL', defaultValue: "http://192.168.1.8:5000/api");

  static String baseUrl = baseUrlDev;


  String segeo = 'Segio';

  // routes
  var homePage = '/homePage';
  var loginScreen = '/loginScreen';
}
