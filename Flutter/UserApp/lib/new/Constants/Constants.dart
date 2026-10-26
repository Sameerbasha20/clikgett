String appname = 'FavMall';

class Constants {
  final String pattern =
      r'^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$';
  late RegExp regex = RegExp(pattern);

  static String razorPayTestKey = 'rzp_live_jcwTqWSYgMpFK0';
  static String razorPayLiveKey = 'rzp_live_jcwTqWSYgMpFK0';

  static String razorPayKey = const String.fromEnvironment('RAZORPAY_KEY').isNotEmpty
      ? const String.fromEnvironment('RAZORPAY_KEY')
      : razorPayLiveKey;
  // static String razorPayKey = razorPayTestKey;

  static String baseUrlDev = const String.fromEnvironment('API_BASE_URL', defaultValue: "http://192.168.1.9:5001/api");
  static String baseUrlProd = const String.fromEnvironment('API_BASE_URL', defaultValue: "http://192.168.1.9:5001/api");

  static String customerSupport = "9133 446 636";

  /// Official ClikGett Business Support WhatsApp number
  /// Reuses verified customer support contact (+91 94296 90261) formatted for international deep-link.
  /// If business updates the dedicated WhatsApp line, configure it here.
  static String whatsAppNumber = "919429690261";

  static String supportNumber1 = '04029300415';
  static String supportNumber2 = '04029300416';

  static String baseUrl = baseUrlDev;

  static String rupee = '₹';

  /// Google Places key for address search. Not kept in the source: pass it at build time
  /// with --dart-define=GOOGLE_PLACES_KEY=... (restrict the key to the Places API).
  static const String googlePlacesKey = String.fromEnvironment('GOOGLE_PLACES_KEY');
}
