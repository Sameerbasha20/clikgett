String appname = 'ClikGet';

class Constants {
  final String pattern =
      r'^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$';
  late RegExp regex = RegExp(pattern);

  static String razorPayTestKey = 'rzp_test_LAGwiygvDQZ32a';
  static String razorPayLiveKey = 'rzp_live_9FPNRUvl1wCmD3';
  static String razorPayKey = razorPayTestKey;

  static String baseUrlDev = const String.fromEnvironment('API_BASE_URL', defaultValue: "http://192.168.1.8:5000/api");
  static String baseUrlProd = const String.fromEnvironment('API_BASE_URL', defaultValue: "http://192.168.1.8:5000/api");
  // static String baseUrlProd = "http://13.202.27.254:3001/api";

  static String whatsAppNumber = '919429690261';

  static String supportNumber1 = '04029300415';
  static String supportNumber2 = '04029300416';

  static String baseUrl = baseUrlDev;

  String segeo = 'Segio';

  static String rupee = '₹';

  // routes
  var homePage = '/homePage';
  var loginScreen = '/loginScreen';
}
