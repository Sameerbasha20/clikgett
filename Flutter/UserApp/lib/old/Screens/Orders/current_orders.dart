import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../new/Controllers/orders_controller.dart';

class CurrentOrdersScreen extends StatefulWidget {
  CurrentOrdersScreen({Key? key}) : super(key: key);

  @override
  State<CurrentOrdersScreen> createState() => _CurrentOrdersScreenState();
}

class _CurrentOrdersScreenState extends State<CurrentOrdersScreen> {
  @override
  void initState() {
    super.initState();
    ordersController.getcurrentorder(context: context);
  }

  final OrdersController ordersController = Get.find();
  @override
  Widget build(BuildContext context) {
    return Material(
        // child: GetBuilder<OrdersController>(
        //   id: 'orders',
        // builder: (controller) => ordersController.isLoading.isTrue
        //     ? const CustomLoader()
        //     : ordersController.orders.isEmpty
        //         ? Center(
        //             child: Text(
        //               'No records found',
        //               style: normalTextstyle(color: tGrey),
        //             ),
        //           )
        //         : ListView.builder(
        //               itemCount: ordersController.orders.length,
        //               physics: const BouncingScrollPhysics(),
        //               itemBuilder: (context, index) {
        //                 var currentOrders = ordersController.orders[index];

        //                 return OrdersTile(
        //                   userId: currentOrders.userId,
        //                   id: currentOrders.userId,
        //                   estimateddeliveryTime: currentOrders.estimateDateTime,
        //                   grandtotal: currentOrders.grandTotal,
        //                   orderStatus: currentOrders.orderStatus,
        //                   orderno: currentOrders.orderId,
        //                 );
        //               }),
        // ),

        );
  }
}
