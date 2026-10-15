import 'package:fav_app/Screens/Orders/orders_tile.dart';
import 'package:fav_app/ViewModels/Orders/orders.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../Constants/colors.dart';
import '../../Constants/text.dart';

class PastOrdersScreen extends StatefulWidget {
  PastOrdersScreen({Key? key}) : super(key: key);

  @override
  State<PastOrdersScreen> createState() => _PastOrdersScreenState();
}

class _PastOrdersScreenState extends State<PastOrdersScreen> {
  void initState() {
    super.initState();
    WidgetsBinding.instance!.addPostFrameCallback((timeStamp) {
      if (ordersViewModel != null) {
        ordersViewModel!.getpastorder(context: context);
      }
    });
  }

  OrdersViewModel? ordersViewModel;
  @override
  Widget build(BuildContext context) {
    if (mounted) {
      ordersViewModel = context.watch<OrdersViewModel>();
    }
    return Material(
      child: ordersViewModel?.isLoading == true
          ? const Center(
              child: CircularProgressIndicator(),
            )
          : ordersViewModel?.currentOrderModel?.orders == null
              ? Center(
                  child: Text(
                    'No records found',
                    style: normalTextstyle(color: tGrey),
                  ),
                )
              : ordersViewModel!.currentOrderModel!.orders.isEmpty
                  ? Center(
                      child: Text(
                        'No records found',
                        style: normalTextstyle(color: tGrey),
                      ),
                    )
                  : ListView.builder(
                      itemCount:
                          ordersViewModel?.currentOrderModel?.orders.length,
                      itemBuilder: (context, index) {
                        var pastOrders =
                            ordersViewModel?.currentOrderModel?.orders[index];
                        return OrdersTile(
                          userId: pastOrders?.userId,
                          id: pastOrders?.orderId,
                          status: 2,
                          estimateddeliveryTime: pastOrders?.estimateDateTime,
                          grandtotal: pastOrders?.grandTotal,
                          orderStatus: pastOrders?.orderStatus,
                          orderno: pastOrders?.orderId,
                        );
                      }),
    );
  }
}
