// ignore_for_file: non_constant_identifier_names
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/empty_data.dart';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/NewModel/product_details_model.dart';
import 'package:fav_app/new/NewScreens/Homepage/ItemDescription.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Combo.dart/Combo.dart';
import 'package:fav_app/new/NewScreens/Widgets/ItemHorizontalTile.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import '../../../../Controllers/category_controller.dart';
import '../../../../Controllers/kits_controller.dart';
import '../../../Widgets/customToast.dart';
import 'package:fav_app/new/NewScreens/Widgets/purchase_options_sheet.dart';
import 'package:fav_app/new/NewScreens/Support/widgets/search_product_request_card.dart';

class SubCategoryList extends StatefulWidget {
  const SubCategoryList(
      {super.key,
      required this.categoryController,
      required this.scrollController,
      required this.categoryId});

  final CategoryController categoryController;
  final ScrollController scrollController;
  final int categoryId;

  @override
  State<SubCategoryList> createState() => _SubCategoryListState();
}

class _SubCategoryListState extends State<SubCategoryList> {
  bool isFirstLoadDone = false;

  @override
  initState() {
    super.initState();
    categoryController = widget.categoryController;
    // Add scroll listener only after 1st frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      isFirstLoadDone = true;
      pagination();
    });
  }

  late final CategoryController categoryController;
  final CartController cartController = Get.find();
  final scrollController = ScrollController();

  @override
  void dispose() {
    scrollController.dispose();
    super.dispose();
  }

  final PageStorageBucket _bucket = PageStorageBucket();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bg,
      body: Obx(
        () => categoryController.isproductsLoading.isTrue
            ? const CustomLoader()
            : categoryController.products.isEmpty
                ? Center(
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: Padding(
                        padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 2.h),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const EmptyDataWidget(message: 'No Products Found!'),
                            SizedBox(height: 1.5.h),
                            const SearchProductRequestCard(searchQuery: ''),
                          ],
                        ),
                      ),
                    ),
                  )
                : Stack(
                    alignment: Alignment.bottomCenter,
                    children: [
                      Padding(
                        // Adjust the bottom padding based on whether the cart has items
                        padding: EdgeInsets.only(
                            bottom:
                                cartController.quantity.value != 0 ? 15.h : 0),
                        // Add extra bottom padding for the cart
                        child: PageStorage(
                          bucket: _bucket,
                          key: PageStorageKey(widget.categoryId),
                          child: SizedBox(
                            child: GridView.builder(
                              itemCount: categoryController.products.length + 1,
                              padding: EdgeInsets.symmetric(
                                  horizontal: 3.w, vertical: 1.h),
                              physics: const BouncingScrollPhysics(),
                              controller: scrollController,
                              gridDelegate:
                                  SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                // Number of columns
                                mainAxisExtent: 26.h,
                                crossAxisSpacing: 3.w,
                                // Spacing between columns
                                mainAxisSpacing: 2.h,
                                // Spacing between rows
                                childAspectRatio:
                                    0.75, // Adjust this to control item height relative to width
                              ),
                              // itemBuilder: (context, index) {
                              //   var product =
                              //       categoryController.products[index];
                              //   print({"best product": product.toJson()});

                              //   return CategorySingleProductItems(
                              //       products: product, index: index);
                              // },
                              itemBuilder: (context, index) {
                                if (index <
                                    categoryController.products.length) {
                                  var product =
                                      categoryController.products[index];
                                  print({"best product": product.toJson()});
                                  return CategorySingleProductItems(
                                      products: product, index: index);
                                } else {
                                  if (categoryController
                                      .checkOffsetLimitExistornot.isTrue) {
                                    // No more items
                                    return Padding(
                                      padding:
                                          EdgeInsets.symmetric(vertical: 2.h),
                                      child: Center(
                                        child: Text(
                                          "No more items",
                                          style: TextStyle(
                                              fontSize: 17.sp,
                                              color: Colors.grey),
                                        ),
                                      ),
                                    );
                                  } else {
                                    // Loader during pagination
                                    return Padding(
                                      padding:
                                          EdgeInsets.symmetric(vertical: 2.h),
                                      child: const Center(
                                        child: SizedBox(
                                          height: 32,
                                          width: 32,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Appprimary,
                                          ),
                                        ),
                                      ),
                                    );
                                  }
                                }
                              },
                            ),
                          ),
                        ),
                      ),
                      // Show the bottom quantity viewer if the cart has items
                      cartController.quantity.value != 0
                          ? bottomQuantityViewer(
                              throughProductsScreen: true,
                              cartController: cartController,
                              context: context,
                            )
                          : Container(),
                    ],
                  ),
      ),
    );
  }

  pagination() {
    scrollController.addListener(() {
      if (scrollController.position.pixels ==
          scrollController.position.maxScrollExtent) {
        if (!categoryController.isproductsLoading.isTrue &&
            categoryController.checkOffsetLimitExistornot.isFalse) {
          categoryController.updateLimitAndOffset(limit: 10);
          categoryController.getProducts(
            storeOffsetIfItFromProducts: true,
            removeLoader: true,
            context: context,
            categoryId: widget.categoryId,
            subcategoryId: categoryController
                    .subCategories[categoryController.tabIndexValue.value]
                    .subCategoryId ??
                0,
          );
        }
      }
    });
  }
}

// void pagination() {
//   widget.scrollController.addListener(() {
//     if (!isFirstLoadDone) return; // 👈 Prevent double call

//     if (widget.scrollController.position.pixels >=
//         widget.scrollController.position.maxScrollExtent - 100) {
//       if (!categoryController.isproductsLoading.isTrue &&
//           categoryController.checkOffsetLimitExistornot.isFalse) {
//         categoryController.updateLimitAndOffset(limit: 10);

//         final subCategoryId = categoryController
//                 .subCategories[categoryController.tabIndexValue.value]
//                 .subCategoryId ??
//             0;

//         categoryController.getProducts(
//           storeOffsetIfItFromProducts: true,
//           removeLoader: true,
//           context: context,
//           categoryId: widget.categoryId,
//           subcategoryId: subCategoryId,
//         );
//       }
//     }
//   });
// }

class CategorySingleProductItems extends StatefulWidget {
  CategorySingleProductItems(
      {super.key, required this.products, required this.index});

  final Products products;
  int index;
  @override
  State<CategorySingleProductItems> createState() =>
      _CategorySingleProductItemsState();
}

class _CategorySingleProductItemsState
    extends State<CategorySingleProductItems> {
  late Products products;

  int initialSelectedIndex = 0;
  final KitsController kitsController = Get.find();
  ProductVariant? selectedVarients;
  double percent = 0;

  @override
  void initState() {
    super.initState();

    products = widget.products;
    filterAndSetAddedQuantity();
  }

  filterAndSetAddedQuantity() {
    if (cartController.cartItems.isNotEmpty) {
      for (var i = 0; i < cartController.cartItems.length; i++) {
        var item = cartController.cartItems[i];

        for (var j = 0; j < products.productVariants!.length; j++) {
          var variants = products.productVariants?[j];
          if (variants?.variantId == item.variantId &&
              item.productId == products.productId) {
            selectedVarients = variants;
            quantity = item.quantity ?? 0;
          }
        }
      }
    } else {
      quantity = 0;
    }
  }

  int quantity = 0;
  final CartController cartController = Get.find();

  @override
  Widget build(BuildContext context) {
    return itemsList(products);
  }

  Widget itemsList(Products products) {
    selectedVarients ??= products.productVariants?.first;
    if (selectedVarients?.price != null) {
      percent = discountCalculate(
        selectedVarients!.price!,
        selectedVarients!.offerPrice!,
      );
    }

    print("Available quantity: ${selectedVarients!.availableQty}");

    bool isOutOfStock =
        selectedVarients!.availableQty! <= 0; // Check if out of stock

    return GestureDetector(
      onTap: () {
        Get.to(() => ItemDescription(
              id: products.productId ?? 0,
              title: products.productName ?? '',
              percent: percent,
            ));
      },
      child: GetBuilder<KitsController>(
        id: 'combo-list',
        builder: (_) {
          return Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: white,
              border: Border.all(color: cardBorder, width: 1),
              boxShadow: softCardShadow,
            ),
            clipBehavior: Clip.antiAlias,
            child: Stack(
              children: [
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          ImagePageView(
                            images: products.productImages ?? [],
                            index: widget.index,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(child: itemName(name: products.productName)),
                              itemWeight(
                                isMultipleVarients:
                                    products.productVariants!.length > 1,
                                weight: [
                                  '${selectedVarients?.metricvalue} ${selectedVarients?.metrictype}'
                                ],
                                onTapWeight: () {
                                  bottomsheet(
                                    products,
                                    context,
                                    selectedVarients,
                                    initialSelectedIndex,
                                  ).then((value) {
                                    if (value != null) {
                                      FocusManager.instance.primaryFocus
                                          ?.unfocus();
                                      selectedVarients =
                                          value['productVariant'];
                                      initialSelectedIndex = value['Index'];
                                      quantity = 0;
                                      percent = discountCalculate(
                                        selectedVarients!.price!,
                                        selectedVarients!.offerPrice!,
                                      );

                                      var checkValuesExistOrnot =
                                          filterQuantityAfterBottomsheet(
                                              selectedVarients);
                                      if (!checkValuesExistOrnot) {
                                        quantityAdd(addOrRemove: true);
                                      }
                                      kitsController.updateComboList();
                                    }
                                  });
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          itemPrice(
                            context: context,
                            quantity: quantity,
                            maxquantity: selectedVarients?.maxQty,
                            availableQty: selectedVarients!.availableQty,
                            decrement: () {
                              quantityAdd(
                                  addOrRemove: false, isToastRemove: true);
                            },
                            increment: () {
                              quantityAdd(
                                  addOrRemove: true, isToastRemove: true);
                            },
                            onTap: () {
                              _showPurchaseOptions(context);
                            },
                            price: selectedVarients?.offerPrice,
                            OriginalPrice: selectedVarients?.price,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                if (percent > 0)
                  Positioned(
                    top: 0,
                    left: 0,
                    child: discountWidget(context: context, discount: percent),
                  ),
                if (isOutOfStock)
                  Positioned(
                    bottom: 6,
                    left: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: redLight,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: red.withOpacity(0.3), width: 1),
                      ),
                      child: Text(
                        'Out of Stock',
                        style: customTextstyle(
                          textDecoration: TextDecoration.none,
                          fontSize: 10.5.sp,
                          color: red,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  bool filterQuantityAfterBottomsheet(ProductVariant? selectedVarients) {
    bool isValueFound = false;
    for (var i = 0; i < cartController.cartItems.length; i++) {
      var item = cartController.cartItems[i];

      if (item.productId == products.productId) {
        if (products.productVariants?.length != null) {
          var variants = selectedVarients;
          if (variants?.variantId == item.variantId) {
            isValueFound = true;
            quantity = item.quantity ?? 0;
          }
        }
      }
    }
    return isValueFound;
  }

  /// Shows the Buy 1 / Buy 2 purchase options sheet.
  /// Triggered when the customer taps 'Add' on a product with qty == 0.
  void _showPurchaseOptions(BuildContext context) {
    selectedVarients ??= products.productVariants?.first;
    if (selectedVarients == null) return;

    showPurchaseOptionsSheet(
      context: context,
      selectedVariant: selectedVarients!,
      variants: products.productVariants,
      productImages: products.productImages,
      productName: products.productName ?? '',
      currentQuantityInCart: quantity,
      categoryId: products.categoryId,
      subCategoryId: products.subCategoryId,
    ).then((result) {
      if (result != null && result['added'] == true) {
        if (result['variant'] != null && result['variant'] is ProductVariant) {
          selectedVarients = result['variant'] as ProductVariant;
        }
        filterAndSetAddedQuantity();
        kitsController.updateComboList();
        setState(() {});
      }
    });
  }

  quantityAdd({required bool addOrRemove, bool isToastRemove = false}) {
    selectedVarients ??= products.productVariants?.first;

    if (quantity < selectedVarients!.availableQty! || addOrRemove == false) {
      if (addOrRemove) {
        if (quantity < selectedVarients!.availableQty! &&
            quantity < selectedVarients!.maxQty!) {
          quantity++;
        } else {
          customToast(message: 'Maximum quantity reached');
        }
      } else {
        // Decrease quantity but ensure it's above 0
        if (quantity > 0) {
          quantity--;
        }
      }

      // Update the cart with the new quantity
      cartController
          .updateQuantity(
              productId: selectedVarients?.productId ?? 0,
              variantId: selectedVarients?.variantId ?? 0,
              quantity: quantity,
              isThroughProductsScreen: true,
              removeToast: isToastRemove,
              categoryId: products.categoryId,
              subCategoryId: products.subCategoryId,
              context: context)
          .then((value) {
        if (value == false) {
          // Revert the quantity if the update failed
          if (addOrRemove) {
            quantity--;
          } else {
            quantity++;
          }
        }
      });

      // Update the combo list if necessary
      kitsController.updateComboList();
    } else {
      // Show the max quantity toast if the quantity reaches the available stock limit or maxQty is less than 5
      customToast(message: 'Quantity not available');
    }
  }
// quantityAdd({required bool addOrRemove, bool isToastRemove = false}) {
//   selectedVarients ??= products.productVariants?.first;
//   if (quantity < selectedVarients!.availableQty! || addOrRemove == false) {
//     if (addOrRemove) {
//       quantity++;
//     } else {
//       if (quantity > 0) {
//         quantity--;
//       }
//     }
//     cartController
//         .updateQuantity(
//         productId: selectedVarients?.productId ?? 0,
//         variantId: selectedVarients?.variantId ?? 0,
//         quantity: quantity,
//         isThroughProductsScreen: true,
//         removeToast: isToastRemove,
//         context: context)
//         .then((value) {
//       if (value == false) {
//         if (addOrRemove) {
//           quantity--;
//         } else {
//           quantity++;
//         }
//       }
//     });
//
//     kitsController.updateComboList();
//   } else {
//     customToast(message: 'Quantity Not Available!');
//   }
// }
}
