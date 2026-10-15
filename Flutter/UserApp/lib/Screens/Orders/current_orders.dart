import 'package:fav_app/Screens/Orders/orders_tile.dart';
import 'package:fav_app/ViewModels/Orders/orders.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../Constants/colors.dart';
import '../../Constants/text.dart';

class CurrentOrdersScreen extends StatefulWidget {
  CurrentOrdersScreen({Key? key}) : super(key: key);

  @override
  State<CurrentOrdersScreen> createState() => _CurrentOrdersScreenState();
}

class _CurrentOrdersScreenState extends State<CurrentOrdersScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance!.addPostFrameCallback((timeStamp) {
      if (ordersViewModel != null) {
        ordersViewModel!.getcurrentorder(context: context);
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
                        var currentOrders =
                            ordersViewModel?.currentOrderModel?.orders[index];

                        return OrdersTile(
                          userId: currentOrders?.userId,
                          id: currentOrders?.userId,
                          estimateddeliveryTime:
                              currentOrders?.estimateDateTime,
                          grandtotal: currentOrders?.grandTotal,
                          orderStatus: currentOrders?.orderStatus,
                          orderno: currentOrders?.orderId,
                        );
                      }),
    );
  }
}
