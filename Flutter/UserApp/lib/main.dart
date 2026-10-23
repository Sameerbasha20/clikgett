import 'dart:async';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Dependancy_Injection/bindings.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/Auth/LoginIntro.dart';
import 'package:fav_app/new/NewScreens/Auth/OnBoarding1.dart';
import 'package:fav_app/new/NewScreens/Homepage/Homepage.dart';
import 'package:fav_app/new/Services/common/backend_discovery.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/ViewModels/Auth/login_view_model.dart';
import 'package:fav_app/old/constants.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'firebase_options.dart';
import 'new/Constants/notifications.dart';
import 'new/NewModel/push_notification.dart';

final GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  // options: DefaultFirebaseOptions.currentPlatform);
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  NotificationApi.init();
  notificationHandler();
  // Local builds: find the backend on this Wi-Fi if the PC's IP changed (splash stays up meanwhile).
  await BackendDiscovery.ensureBackend();
  runApp(
    const MyApp(),
  );
}
//clikgett.com

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage event) async {
  // await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  if (event.data.isNotEmpty) {
    PushNotificationsModel pushNotificationsModel =
        PushNotificationsModel.fromJson(event.data);

    await NotificationApi.pushNotification(pushNotificationsModel);
  }
}

void notificationHandler() async {
  FirebaseMessaging firebaseMessaging = FirebaseMessaging.instance;
  await firebaseMessaging.requestPermission(
    alert: true,
    announcement: false,
    badge: true,
    carPlay: false,
    criticalAlert: false,
    provisional: false,
    sound: true,
  );

  FirebaseMessaging.onMessage.listen((event) async {
    if (event.data.isNotEmpty) {
      PushNotificationsModel pushNotificationsModel =
          PushNotificationsModel.fromJson(event.data);

      await NotificationApi.pushNotification(pushNotificationsModel);
    }
  });
}

Future<void> openMessageFromNotification() async {
  FirebaseMessaging.onMessageOpenedApp.listen((event) {});
}

class MyApp extends StatefulWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  Widget build(BuildContext context) {
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    return GestureDetector(
      onTap: () {
        WidgetsBinding.instance.focusManager.primaryFocus?.unfocus();
      },
      child: GetMaterialApp(
        title: appname,
        initialBinding: AppBindings(),
        navigatorKey: appNavigatorKey,
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
            primaryColor: primary,
            appBarTheme: AppBarTheme(
                centerTitle: true,
                titleTextStyle:
                    customTextstyle(fontSize: 20, fontWeight: FontWeight.w600),
                elevation: 0,
                backgroundColor: white,
                iconTheme: IconThemeData(color: black, size: 22)),
            bottomAppBarTheme: BottomAppBarThemeData(color: white, elevation: 0)),
        routes: {
          '/login': (_) => ChangeNotifierProvider(
                create: (_) => LoginViewModel(),
                child: LoginIntro(),
              ),
        },
        home: ResponsiveSizer(builder: (p0, p1, p2) => SplashScreen()),
      ),
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _bounceAnimation;

  @override
  void initState() {
    super.initState();

    // Initialize the AnimationController
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );

    // Bounce effect
    _bounceAnimation = Tween<double>(begin: 0.0, end: 30.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.elasticOut),
    );

    // Scale + pulse effect
    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween:
            Tween(begin: 1.0, end: 1.2).chain(CurveTween(curve: Curves.easeIn)),
        weight: 50.0,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.2, end: 1.0)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 50.0,
      ),
    ]).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      ),
    );

    // Start the animation
    _animationController.repeat(reverse: true);

    // Set a 3-second delay for the splash screen
    Timer(const Duration(seconds: 3), checkUserLoggedOrNot);
  }

  // Check if user is logged in and navigate accordingly
  void checkUserLoggedOrNot() async {
    CommonServices.getToken().then((value) {
      Navigator.of(context).pushReplacement(MaterialPageRoute(
        builder: (context) => value.isEmpty ? OnboardingScreen() : Homepage(),
      ));
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          Expanded(
            child: Center(
              child: AnimatedBuilder(
                animation: _animationController,
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(0, _bounceAnimation.value),
                    child: Transform.scale(
                      scale: _scaleAnimation.value,
                      child: SizedBox(
                        width: 200,
                        height: 200,
                        child: Image(
                          image: AssetImage(logo2), // Animated top image
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          // SizedBox(
          //   width: MediaQuery.of(context).size.width, // Full screen width
          //   height: 36.7.h, // Maintain the height based on the screen size
          //   child: Image(
          //     image: AssetImage(spl_bottom),
          //     fit: BoxFit.fill, // Ensures the image fits the width without distortion
          //   ),
          // ),
        ],
      ),
    );
  }
}
