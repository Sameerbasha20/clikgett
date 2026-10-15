import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/Screens/Kits/kits_item_tile.dart';
import 'package:fav_app/old/ViewModels/Home/cart_view_model.dart';
import 'package:fav_app/old/ViewModels/Home/product_view_model.dart';
import 'package:fav_app/old/ViewModels/Kits/kits_view_model.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class KitsScreen extends StatefulWidget {
  KitsScreen({Key? key}) : super(key: key);

  @override
  State<KitsScreen> createState() => _ComboScreenState();
}

class _ComboScreenState extends State<KitsScreen> {
  KitsViewModel? kitsViewModel;
  CartViewModel? cartViewModel;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((timings) {
      if (kitsViewModel != null) {
        kitsViewModel!.getData(context: context);
      }
    });
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (mounted) {
      kitsViewModel = context.watch<KitsViewModel>();
      cartViewModel = context.watch<CartViewModel>();
    }
    return kitsViewModel!.isLoading == true
        ? const Center(
            child: CircularProgressIndicator(),
          )
        : kitsViewModel!.products == null
            ? Center(
                child: Text(
                  'Unable to fetch data',
                  style: normalTextstyle(color: tGrey),
                ),
              )
            : kitsViewModel!.products.isEmpty
                ? Center(
                    child: Text(
                      'No Kits Available',
                      style: normalTextstyle(color: tGrey),
                    ),
                  )
                : Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 10),
                    child: ListView.builder(
                        itemCount: kitsViewModel!.products.length,
                        itemBuilder: (context, index) {
                          return ChangeNotifierProvider<ProductViewModel>(
                              create: (_) => ProductViewModel(),
                              child: KitsItemTile(
                                product: kitsViewModel!.products[index],
                                cartViewModel: cartViewModel,
                              ));
                        }),
                  );
  }
}
