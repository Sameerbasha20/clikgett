import 'package:fav_app/old/Models/Orders/orders.dart';
import 'package:get/get.dart';

import '../../old/Services/Orders/orders.dart';
import '../../old/Services/common/network_check.dart';
import '../NewScreens/Widgets/customToast.dart';

/// Current and past order lists (My Orders tab and the home order strip).
/// Checkout lives in Cart.dart / checkout_services.dart, tracking in OrderDetails.dart.
class OrdersController extends GetxController {
  final RxBool _isLoading = false.obs;
  RxBool get isLoading => _isLoading;

  updateOrdersTab() {
    update(['orders']);
  }

  CurrentOrderModel? currentOrderModel;
  RxList<Order> orders = RxList();
  CurrentOrderModel? pastOrderModel;
  RxList<Order> pastorders = RxList();
  getcurrentorder({
    required context,
  }) async {
    _isLoading(true);
    Network.networkCheck(context).then((value) => value != null
        ? {
            OrderServices.getcurrentorders()
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            currentOrderModel = value,
                            orders(currentOrderModel?.orders),
                            _isLoading(false),
                            updateOrdersTab(),
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isLoading(false)
                      }
                    : {customToast(message: 'Error'), _isLoading(false)})
                .catchError((onError) {
              // debugPrint(onError.toString());
              // customToast(message: onError.toString());
              _isLoading(false);
            })
          }
        : {customToast(message: 'Network error'), _isLoading(false)});
  }

  getpastorder({
    required context,
  }) async {
    Future.delayed(
      Duration.zero,
      () => _isLoading(true),
    );
    Network.networkCheck(context).then((value) async => value != null
        ? {
            await OrderServices.getpastorders()
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            pastOrderModel = value,
                            pastorders(pastOrderModel?.orders),
                            _isLoading(false),
                            updateOrdersTab(),
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isLoading(false)
                      }
                    : {customToast(message: 'Error'), _isLoading(false)})
                .catchError((onError) {
              // debugPrint(onError.toString());
              // customToast(message: onError.toString());
              _isLoading(false);
            })
          }
        : {customToast(message: 'Network error'), _isLoading(false)});
  }
}
