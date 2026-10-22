import 'package:fav_app/new/Controllers/adress_controller.dart';
import 'package:fav_app/new/Controllers/auth_controller.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/category_controller.dart';
import 'package:fav_app/new/Controllers/config_controller.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/Controllers/notification_controller.dart';
import 'package:fav_app/new/Controllers/orders_controller.dart';
import 'package:fav_app/new/Controllers/profile_controller.dart';
import 'package:fav_app/new/Controllers/searchandrecomend_controller.dart';
import 'package:fav_app/new/Controllers/wallet.dart';
import 'package:get/get.dart';

class AppBindings extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut(() => AuthController());
    Get.lazyPut(() => HomeController());
    Get.lazyPut(() => AdressController());
    Get.lazyPut(() => CategoryController());
    Get.lazyPut(() => CartController());
    Get.lazyPut(() => NotificationController());
    Get.lazyPut(() => ProfileController());
    Get.lazyPut(() => SearchAndRecommendController());
    Get.lazyPut(() => OrdersController());
    Get.lazyPut(() => ConfigController());
    Get.lazyPut(() => WalletController());
  }
}
