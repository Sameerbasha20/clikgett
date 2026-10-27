// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/number_format.dart';
import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/empty_data.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/category_controller.dart';
import 'package:fav_app/new/Controllers/home_controller.dart';
import 'package:fav_app/new/NewModel/product_details_model.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Cart/Cart.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:flutter/material.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:fav_app/new/Constants/stock_helper.dart';
import 'package:fav_app/new/NewScreens/Widgets/purchase_options_sheet.dart';
import 'package:fav_app/new/NewScreens/Homepage/widgets/similar_products_widget.dart';
import 'package:fav_app/new/NewScreens/Homepage/widgets/pack_options.dart';

class ItemDescription extends StatefulWidget {
  const ItemDescription({
    super.key,
    required this.title,
    required this.id,
    this.throughSearchScreen = false,
    required this.percent,
  });

  final String title;
  final int id;
  final double percent;
  final bool throughSearchScreen;

  @override
  State<ItemDescription> createState() => _ItemDescriptionState();
}

class _ItemDescriptionState extends State<ItemDescription> {
  /// The description shows one line until "Read more" is tapped.
  bool _descriptionExpanded = false;

  @override
  void initState() {
    super.initState();
    print(widget.percent);
    print("mmmmmmmmmmmm");
    Future.wait([
      cartController
          .getCart(
              context: context,
              longitude: homeController.longitude,
              latitude: homeController.latitude)
          .then((value) async {
        await categoryController.getProductsDetails(
            context: context, productId: widget.id);
      }),
      categoryController.getSimilarProducts(productId: widget.id),
    ]);
  }

  @override
  void dispose() {
    categoryController.clearValues();
    super.dispose();
  }

  final CategoryController categoryController = Get.find();
  final CartController cartController = Get.find();
  final HomeController homeController = Get.find();

  // ProductVariant? selectedvarients;
  int count = 0;
  int initialSelectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          elevation: 0,
          backgroundColor: Colors.white,
          surfaceTintColor: Colors.transparent,
          title: Text(
            widget.title,
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 17,
              color: const Color(0xFF0F172A),
            ),
          ),
          leading: IconButton(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Color(0xFF0F172A),
              size: 20,
            ),
          ),
        ),
        backgroundColor: Colors.white,
        body: Stack(
          alignment: Alignment.bottomCenter,
          children: [
            SafeArea(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.h),
                child: Obx(
                  () => categoryController.isProductDetialLoading.isTrue
                      ? const CustomLoader()
                      : categoryController.productsDetails == null
                          ? const EmptyDataWidget(message: 'No Product Details Found')
                          : SingleChildScrollView(
                              physics: const BouncingScrollPhysics(),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.start,
                                children: [
                                  if (widget.percent > 0)
                                    Padding(
                                      padding: const EdgeInsets.only(bottom: 8.0),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: primaryLight,
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: primary.withOpacity(0.3), width: 1),
                                        ),
                                        child: Text(
                                          "${widget.percent.round()}% OFF",
                                          style: customTextstyle(
                                            fontSize: 12.sp,
                                            color: primaryDark,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ItemImages(
                                    productImages: categoryController
                                            .productsDetails?.productImages ??
                                        [],
                                  ),
                                  const SizedBox(height: 16),
                                  itemName(
                                      name: categoryController
                                          .productsDetails?.productName),
                                  itemWeight(
                                      isMultiVarients: categoryController
                                                  .productsDetails!
                                                  .productVariants!
                                                  .length >
                                              1
                                          ? true
                                          : false,
                                      weight: categoryController
                                          .selectedMetricTypeandValue.value),
                                  itemPrice(
                                    price:
                                        categoryController.offerammount.value,
                                    OriginalPrice:
                                        categoryController.ammount.value,
                                    maxavailableQty: categoryController
                                        .maxavailableQty.value,
                                    availableQty:
                                        categoryController.availableQty.value,
                                    discount: widget.percent,
                                  ),
                                  // Buy-more packs ("2 x 750 ml ₹77") for the selected size.
                                  PackOptions(
                                    key: ValueKey('packs-${categoryController.varientID.value}'),
                                    productId: categoryController.productsDetails?.productId ?? 0,
                                    // Same pack id the Add button uses.
                                    variantId: categoryController.varientID.value,
                                    unit: categoryController.selectedMetricTypeandValue.value,
                                    price: categoryController.offerammount.value,
                                    mrp: categoryController.ammount.value,
                                    tiers: categoryController.productsDetails?.bulkTiers ?? const [],
                                    buy2Price: categoryController.productsDetails?.productVariants
                                        ?.firstWhereOrNull((v) => v.variantId == categoryController.varientID.value)
                                        ?.buy2Price,
                                    maxQty: categoryController.maxavailableQty.value,
                                    categoryId: categoryController.productsDetails?.categoryId,
                                    subCategoryId: categoryController.productsDetails?.subCategoryId,
                                  ),
                                  // Blank dates come back as 0000-00-00 / 1899; only show a real one.
                                  if ((DateTime.tryParse(categoryController.productsDetails?.productVariants?.first.ExpiryDate ?? '')?.year ?? 0) >= 2000)
                                    Text(
                                      'Expire Date: ${formatDateString(categoryController.productsDetails?.productVariants?.first.ExpiryDate ?? '')}',
                                      style: customTextstyle(
                                        fontSize: 16.sp,
                                        color: tColor.withOpacity(.5),
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  // SizedBox(
                                  //   height: 5,
                                  // ),
                                  descrptionWidget(
                                      description: categoryController
                                          .productsDetails?.description),
                                  SimilarProductsWidget(
                                    parentProductId: widget.id,
                                  ),
                                  const SizedBox(height: 100),
                                ],
                              ),
                            ),
                ),
              ),
            ),
          ],
        ),
        bottomNavigationBar: Obx(
          () => cartController.quantity.value == 0
              ? SizedBox.shrink()
              : Container(
                  height: 80,
                  child: Obx(() => cartController.quantity.value != 0
                      ? bottomQuantityViewer(
                          throughSearchScreen: widget.throughSearchScreen,
                          cartController: cartController,
                          throughProductsDetailsScreen: true,
                          context: context)
                      : Container()),
                ),
        ));
  }

  Widget itemImages({required List<String> productImages}) {
    final devicePixelRatio = MediaQuery.of(context).devicePixelRatio;

    return Expanded(
      flex: 7,
      child: Container(
        alignment: Alignment.center,
        child: productImages.isNotEmpty
            ? PageView.builder(
                itemCount: productImages.length,
                itemBuilder: (context, index) {
                  return Container(
                    alignment: Alignment.center, // Center the image container
                    padding: const EdgeInsets.all(4.0),
                    child: CustomNetworkImage(
                      url: productImages[index],
                      fit: BoxFit.contain,
                    ),
                  );
                },
              )
            : Container(
                alignment: Alignment.center,
                child: Text(
                    'No Images Available'), // Placeholder when no images are available
              ),
      ),
    );
  }

  Widget itemName({required name}) {
    return customText(
      text: "$name",
      fontSize: 20.sp,
      color: tColor,
      fontWeight: FontWeight.w600,
    );
  }

  Widget itemWeight({required weight, bool isMultiVarients = false}) {
    return isMultiVarients
        ? InkWell(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(categoryController.selectedMetricTypeandValue.value,
                    style: customTextstyle(
                      fontSize: 16.sp,
                      color: tColor2,
                      fontWeight: FontWeight.w600,
                    )),
                Icon(
                  Icons.keyboard_arrow_down,
                  size: 3.h,
                  color: green,
                )
              ],
            ),
            onTap: () {
              bottomsheet(
                      categoryController.productsDetails!,
                      context,
                      categoryController.varientsCheckwithcart,
                      initialSelectedIndex)
                  .then((value) {
                if (value != null) {
                  ProductVariant varient = value['productVariant'];
                  categoryController.updateselectedProductVarient(varient);

                  initialSelectedIndex = value['Index'];
                  categoryController.removeQuantity();
                  var checkValuesExistOrnot =
                      filterQuantityAfterBottomsheet(varient);
                  categoryController.updateVariant(varient);
                  if (!checkValuesExistOrnot) {
                    quantityAdd(addOrRemove: true);
                  }
                }
              });
            },
          )
        : Padding(
            padding: const EdgeInsets.only(top: 5),
            child: Text(categoryController.selectedMetricTypeandValue.value,
                style: customTextstyle(
                  fontSize: 16.sp,
                  color: tColor.withOpacity(0.7),
                  fontWeight: FontWeight.w600,
                )),
          );
  }

  bool filterQuantityAfterBottomsheet(ProductVariant? selectedVarients) {
    bool isValueFound = false;
    for (var i = 0; i < cartController.cartItems.length; i++) {
      var item = cartController.cartItems[i];

      if (item.productId == categoryController.productsDetails?.productId) {
        var variants = selectedVarients;
        if (variants?.variantId == item.variantId) {
          isValueFound = true;
          categoryController.updateQuantity(item.quantity ?? 0);
          categoryController.updateVariant(variants!);
        }
      }
    }
    return isValueFound;
  }

  Widget itemPrice(
      {required price,
      required OriginalPrice,
      required availableQty,
      required int maxavailableQty,
      required double discount}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            constantText(
              text: "${shelfPrice(price)}  ",
              textStyle: robotocustomTextstyle(
                fontSize: 18.sp,
                color: tColor2,
                fontWeight: FontWeight.w600,
              ),
              children: [
                // Only strike through a higher MRP; "₹44 ₹44" says nothing.
                if (shelfHasDiscount(OriginalPrice, price))
                TextSpan(
                  text: shelfPrice(OriginalPrice),
                  style: robotocustomTextstyle(
                    fontSize: 14.sp,
                    color: tColor.withOpacity(0.5),
                    fontWeight: FontWeight.w600,
                    textDecoration: TextDecoration.lineThrough,
                  ),
                ),
              ],
            ),

            // Conditional rendering based on availableQty
            Align(
              child: (availableQty != null && availableQty > 0)
                  ? addRemoveButtons()
                  : Container(
                      alignment: Alignment.center,
                      child: Text(
                        "Out of Stock", // Message to show when out of stock
                        style: TextStyle(
                          color: Colors.red, // Customize the color as needed
                          fontWeight: FontWeight.bold,
                          fontSize: 16, // Adjust font size as necessary
                        ),
                      ),
                    ),
            ),
          ],
        ),
        if (StockHelper.isLowStock(availableQty))
          LowStockBadge(availableQty: availableQty),
      ],
    );
  }

  Widget descrptionWidget({required description}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 1.h,
        ),
        Text(
          "Description",
          style: GoogleFonts.montserrat(
              fontSize: 18.sp, fontWeight: FontWeight.w800),
        ),
        SizedBox(
          height: 0.5.h,
        ),
        _descriptionExpanded
            ? customTextWidget(description)
            : _collapsedDescription('$description'),
        if (_descriptionIsLong('$description'))
          GestureDetector(
            onTap: () => setState(() => _descriptionExpanded = !_descriptionExpanded),
            child: Padding(
              padding: EdgeInsets.only(top: 0.5.h),
              child: Text(
                _descriptionExpanded ? 'Read less' : 'Read more',
                style: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w600, color: primary),
              ),
            ),
          ),
      ],
    );
  }

  /// Description as plain text (HTML tags removed) for the one-line preview.
  String _plainDescription(String description) => description
      .replaceAll(RegExp(r'<[^>]+>'), ' ')
      .replaceAll('&nbsp;', ' ')
      .replaceAll('&amp;', '&')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();

  bool _descriptionIsLong(String description) => _plainDescription(description).length > 45;

  Widget _collapsedDescription(String description) => Text(
        _plainDescription(description),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(fontSize: 14, color: ordersPrimaryColor.withOpacity(0.65), fontWeight: FontWeight.w500),
      );

  Widget customTextWidget(String description) {
    final bool isHtml = RegExp(r"<[^>]+>").hasMatch(description);

    if (isHtml) {
      return Html(
        data: description,
        style: {
          "*": Style(
            fontSize: FontSize(14),
            color: ordersPrimaryColor.withOpacity(0.65),
            // fontWeight: FontWeight.w500,
          ),
        },
      );
    } else {
      return customText(
        text: description,
        fontSize: 14,
        color: ordersPrimaryColor.withOpacity(0.65),
        fontWeight: FontWeight.w500,
      );
    }
  }

  quantityAdd({
    required bool addOrRemove,
    bool isToastRemove = false,
    bool moveLoaderForDataUpdateOnParentWidget = true,
  }) {
    categoryController.varientsCheckwithcart ??=
        categoryController.productsDetails?.productVariants?.first;
    // if(categoryController.varientsCheckwithcart!.availableQty!<categoryController.varientsCheckwithcart!.maxQty!){
    //   customToast(message: 'Quantity not available ');
    //
    // }else{
    if (categoryController.quantity.value <
            categoryController.varientsCheckwithcart!.availableQty! ||
        addOrRemove == false) {
      categoryController.addAndRemoveQuantity(addOrRemove);

      cartController
          .updateQuantity(
        isFromProductsScreen: widget.throughSearchScreen ? false : true,
        isFromSearchScreen: widget.throughSearchScreen ? true : false,
        productId: categoryController.productsDetails?.productId ?? 0,
        variantId: categoryController.varientID.value,
        quantity: categoryController.quantity.value,
        isThroughDescriptionScreen: true,
        removeToast: isToastRemove,
        categoryId: categoryController.productsDetails?.categoryId,
        subCategoryId: categoryController.productsDetails?.subCategoryId,
        context: context,
      )
          .then((value) {
        if (value == false) {
          if (addOrRemove) {
            categoryController.addAndRemoveQuantity(false);
          } else {
            categoryController.addAndRemoveQuantity(true);
          }
        }
      });
    } else {
      // Show a custom toast message if quantity exceeds available or max quantity
      customToast(message: 'Quantity not available');
    }
  }

  Widget bottomBar({required count, required price}) {
    return BottomAppBar(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            flex: 6,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                ImageIcon(
                  AssetImage(cart2),
                  color: primary,
                ),
                Text(
                  "$count Items",
                  style: customTextstyle(
                      color: black,
                      fontSize: 18.sp,
                      fontWeight: FontWeight.w600),
                ),
                Icon(
                  Icons.circle,
                  color: primary,
                  size: 2.w,
                ),
                Text(shelfPrice(price),
                    style: robotocustomTextstyle(
                      fontSize: 18.sp,
                      color: primary,
                      fontWeight: FontWeight.w600,
                    )),
              ],
            ),
          ),
          Expanded(
            flex: 7,
            child: Container(
              alignment: Alignment.centerRight,
              child: buttonWidget(
                  width: 2.w,
                  height: 4.h,
                  fontSize: 16.sp,
                  borderRadius: 0.5.h,
                  onTap: () {
                    Navigator.of(context).push(MaterialPageRoute(
                        builder: (context) => Cart(
                              throughDescriptionScreen: true,
                            )));
                  },
                  context: context,
                  text: "View Cart"),
            ),
          ),
        ],
      ),
    );
  }

  /// Shows the Buy 1 / Buy 2 purchase options sheet for this item.
  void _showPurchaseOptions(BuildContext context) {
    final variant = categoryController.productVariant ??
        categoryController.productsDetails?.productVariants?.first;
    final product = categoryController.productsDetails;
    if (variant == null || product == null) {
      quantityAdd(addOrRemove: true);
      return;
    }

    showPurchaseOptionsSheet(
      context: context,
      selectedVariant: variant,
      variants: product.productVariants,
      productImages: product.productImages,
      productName: product.productName ?? widget.title,
      currentQuantityInCart: categoryController.quantity.value,
      categoryId: product.categoryId,
      subCategoryId: product.subCategoryId,
    ).then((result) {
      if (result != null && result['added'] == true) {
        if (result['variant'] != null && result['variant'] is ProductVariant) {
          categoryController.updateVariant(result['variant'] as ProductVariant);
          filterQuantityAfterBottomsheet(result['variant'] as ProductVariant);
        }
        setState(() {});
      }
    });
  }

  Widget addRemoveButtons() {
    return categoryController.quantity <= 0
        ? buttonWidget(
            width: 2.w,
            height: 4.h,
            borderRadius: 0.5.h,
            onTap: () async {
              // One tap adds a single unit; guests are asked to log in first.
              final token = await CommonServices.getToken();
              if (token.isEmpty) {
                customToast(message: 'Please login to add items to your cart');
                if (context.mounted) {
                  Navigator.of(context).push(MaterialPageRoute(builder: (_) => Login()));
                }
                return;
              }
              quantityAdd(addOrRemove: true);
            },
            context: context,
            borderColor: primary,
            buttonColor: primary,
            borderWidth: 1.5,
            textColor: Colors.white,
            text: "Add")
        : Container(
            decoration: BoxDecoration(
                border: Border.all(color: primary),
                borderRadius: BorderRadius.circular(0.5.h)),
            child: Row(
              children: [
                IconButton(
                    onPressed: () {
                      quantityAdd(addOrRemove: false, isToastRemove: true);
                    },
                    icon: Icon(
                      Icons.remove,
                      color: primary,
                      size: 2.h,
                    )),
                Text(categoryController.quantity.value.toString(),
                    style: robotocustomTextstyle(
                      color: primary,
                      fontWeight: FontWeight.w600,
                    )),
                IconButton(
                    onPressed: () {
                      quantityAdd(addOrRemove: true, isToastRemove: true);
                    },
                    icon: Icon(
                      Icons.add,
                      color: primary,
                      size: 2.h,
                    )),
              ],
            ),
          );
  }

  Widget alertBottomWidget({setState, totalPrice}) {
    return Material(
      elevation: 5,
      color: white,
      child: Container(
        width: double.infinity,
        decoration:
            BoxDecoration(border: Border.all(color: white.withOpacity(0.20))),
        padding: EdgeInsets.only(
          left: 5.w,
          top: 1.h,
          right: 5.w,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              categoryController.selectedMetricTypeandValue.value,
              style: customTextstyle(
                  fontSize: 16.sp, color: tColor2, fontWeight: FontWeight.w600),
            ),
            Divider(
              color: black.withOpacity(0.20),
              thickness: 1.5,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  flex: 7,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      ImageIcon(
                        AssetImage(cart2),
                        color: primary,
                      ),
                      Text(
                        "Item Total",
                        style: customTextstyle(
                            color: black.withOpacity(0.70),
                            fontSize: 18.sp,
                            fontWeight: FontWeight.w600),
                      ),
                      Icon(
                        Icons.circle,
                        color: primary,
                        size: 2.w,
                      ),
                      // Text(
                      //   "${Constants.rupee}${double.parse(totalPrice.value).toStringAsFixed(2)}", // Convert RxString to double and format to 2 decimal places
                      //   style: robotocustomTextstyle(
                      //     fontWeight: FontWeight.w600,
                      //   ),
                      // )

                      Text(
                          money(totalPrice.value),
                          // Convert RxString to double and format to 2 decimal places

                          // "${Constants.rupee}$totalPrice",
                          style: robotocustomTextstyle(
                            fontSize: 18.sp,
                            color: primary,
                            fontWeight: FontWeight.w600,
                          )),
                    ],
                  ),
                ),
                Expanded(
                  flex: 7,
                  child: Container(
                    alignment: Alignment.centerRight,
                    child: buttonWidget(
                        width: 2.w,
                        height: 4.h,
                        fontSize: 14.sp,
                        borderRadius: 0.5.h,
                        onTap: () {
                          Navigator.of(context).pop();
                        },
                        context: context,
                        text: "Add to Cart"),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String formatDateString(String? expiryDate) {
    if (expiryDate == null || expiryDate.isEmpty) {
      return 'Invalid date'; // Or any default value/message for null or empty expiryDate
    }

    DateTime dateTime = DateTime.parse(expiryDate);
    return DateFormat('dd/MM/yyyy').format(dateTime);
  }
}

class ItemImages extends StatefulWidget {
  final List<String> productImages;

  const ItemImages({Key? key, required this.productImages}) : super(key: key);

  @override
  _ItemImagesState createState() => _ItemImagesState();
}

class _ItemImagesState extends State<ItemImages> {
  late PageController _pageController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentPage = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.productImages.isEmpty) {
      return Container(
        height: 220,
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: cardBorder, width: 1),
        ),
        alignment: Alignment.center,
        child: const Text('No Images Available'),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorder, width: 1),
      ),
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            height: 220,
            child: PageView.builder(
              controller: _pageController,
              itemCount: widget.productImages.length,
              onPageChanged: _onPageChanged,
              itemBuilder: (context, index) {
                return Container(
                  alignment: Alignment.center,
                  padding: const EdgeInsets.all(8.0),
                  child: CustomNetworkImage(
                    url: widget.productImages[index],
                    fit: BoxFit.contain,
                  ),
                );
              },
            ),
          ),
          if (widget.productImages.length > 1)
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(widget.productImages.length, (index) {
                  final bool isSelected = _currentPage == index;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 2.5),
                    width: isSelected ? 14.0 : 5.0,
                    height: 5.0,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(3),
                      color: isSelected ? primary : const Color(0xFFCBD5E1),
                    ),
                  );
                }),
              ),
            ),
        ],
      ),
    );
  }
}

bottomQuantityViewer({
  required CartController cartController,
  required context,
  bool throughSearchScreen = false,
  bool throughProductsScreen = false,
  bool throughProductsDetailsScreen = false,
}) {
  return Obx(() {
    if (cartController.quantity.value <= 0) return const SizedBox.shrink();
    
    final formattedPrice = double.tryParse(cartController.ammount.value)?.toStringAsFixed(0) ?? cartController.ammount.value;
    
    return SafeArea(
      child: Container(
        height: 56,
        margin: EdgeInsets.symmetric(horizontal: 4.w, vertical: 8),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(28),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => Cart(
                    isFromHomeScreen: false,
                    throughProductScreen: throughProductsScreen,
                    throughSearchScreen: throughSearchScreen,
                    throughDescriptionScreen: throughProductsDetailsScreen,
                  ),
                ),
              );
            },
            child: Ink(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [primaryDark, primary],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(28),
                boxShadow: [
                  BoxShadow(
                    color: primary.withOpacity(0.35),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.shopping_bag_outlined,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    '${cartController.quantity.value} ${cartController.quantity.value == 1 ? "item" : "items"}',
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 13.5.sp,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Text(
                      '•',
                      style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 16),
                    ),
                  ),
                  Text(
                    '${Constants.rupee}$formattedPrice',
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 14.5.sp,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    'View Cart',
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 13.sp,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(
                    Icons.arrow_forward_rounded,
                    color: Colors.white,
                    size: 18,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  });
}

Future bottomsheet(Products products, context, ProductVariant? selectedvarients,
    int initialSelectedIndex) {
  selectedvarients ??= products.productVariants?.first;
  if (selectedvarients != null) {
    initialSelectedIndex = -1;
  }

  return showModalBottomSheet<void>(
      context: context,
      builder: (BuildContext context) => StatefulBuilder(builder: (context, setSheetState) {
        return Stack(
          alignment: Alignment.bottomCenter,
          children: [
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 2.5.h),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  GestureDetector(
                    onTap: () {
                      Navigator.pop(context);
                    },
                    child: Padding(
                      padding: EdgeInsets.only(top: 2.5.h),
                      child: Align(
                        alignment: Alignment.topRight,
                        child: Image.asset(
                          removeIcon,
                          height: 3.h,
                        ),
                      ),
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.symmetric(vertical: 2.h),
                    child: Text(
                      'Select A Quantity',
                      style: customTextstyle(
                          fontSize: 18.sp,
                          color: black,
                          fontWeight: FontWeight.w500),
                    ),
                  ),
                  Text(
                    products.productName ?? '',
                    style: customTextstyle(
                        fontSize: 17.sp,
                        color: black.withOpacity(.5),
                        fontWeight: FontWeight.w600),
                  ),
                  Padding(
                    padding: EdgeInsets.only(top: 3.h),
                    child: Text(
                      'Choose Variant',
                      style: customTextstyle(
                          fontSize: 18.sp,
                          color: black,
                          fontWeight: FontWeight.w600),
                    ),
                  ),
                  Flexible(
                    child: ListView.builder(
                      itemCount: products.productVariants?.length,
                      physics: BouncingScrollPhysics(),
                      padding: EdgeInsets.only(bottom: 16.h, top: 1.h),
                      shrinkWrap: true,
                      itemBuilder: (BuildContext context, int index) {
                        var varients = products.productVariants?[index];
                        return GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onTap: () {
                            selectedvarients = varients;
                            setSheetState(() {});
                            initialSelectedIndex = index;
                          },
                          child: Padding(
                            padding: EdgeInsets.symmetric(vertical: 1.2.h),
                            child: Row(
                              children: [
                                Builder(builder: (_) {
                                    return Container(
                                      margin: EdgeInsets.only(right: 3.w),
                                      padding: EdgeInsets.all(3),
                                      decoration: BoxDecoration(
                                          border: Border.all(
                                              color: green, width: 2),
                                          shape: BoxShape.circle),
                                      child: CircleAvatar(
                                        radius: 5,
                                        backgroundColor: selectedvarients
                                                        ?.variantId ==
                                                    varients?.variantId ||
                                                initialSelectedIndex == index
                                            ? green
                                            : white,
                                      ),
                                    );
                                  },
                                ),
                                Text(
                                  packSize(varients?.metricvalue, varients?.metrictype),
                                  style: customTextstyle(
                                      fontSize: 17.sp,
                                      color: black,
                                      fontWeight: FontWeight.w600),
                                ),
                                Padding(
                                  padding: EdgeInsets.only(left: 3.w),
                                  child: Row(
                                    children: [
                                      Padding(
                                        padding: EdgeInsets.only(right: 2.w),
                                        child: Text(
                                          shelfPrice(varients?.sellingPrice),
                                          style: customTextstyle(
                                              fontSize: 16.sp,
                                              color: black,
                                              fontWeight: FontWeight.w600),
                                        ),
                                      ),
                                      if (shelfHasDiscount(varients?.price, varients?.sellingPrice))
                                      Text(
                                        shelfPrice(varients?.price),
                                        style: customTextstyle(
                                            fontSize: 16.sp,
                                            color: tColor.withOpacity(.5),
                                            textDecoration:
                                                TextDecoration.lineThrough,
                                            fontWeight: FontWeight.w600),
                                      ),
                                    ],
                                  ),
                                ),
                                const Spacer(),
                                StockStatusText(
                                  availableQty: varients?.availableQty,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 100.w,
              height: 15.h,
              padding: EdgeInsets.symmetric(horizontal: 2.5.h),
              decoration: BoxDecoration(
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black, //New
                    blurRadius: 20.0,
                    spreadRadius: 7,
                    offset: Offset(
                      20,
                      20,
                    ),
                  ),
                ],
                color: white,
              ),
              child: Builder(builder: (_) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 10),
                        child: Text(
                          packSize(selectedvarients?.metricvalue, selectedvarients?.metrictype),
                          style: customTextstyle(
                              fontSize: 16.sp,
                              color: green,
                              fontWeight: FontWeight.w600),
                        ),
                      ),
                      Divider(
                        thickness: 1,
                        color: black.withOpacity(.2),
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Image.asset(
                                deletecartIcon,
                                height: 2.5.h,
                                color: primary,
                              ),
                              Padding(
                                padding: EdgeInsets.symmetric(horizontal: 2.w),
                                child: Text(
                                  'Item Total',
                                  style: customTextstyle(
                                      fontSize: 16.sp,
                                      color: green,
                                      fontWeight: FontWeight.w600),
                                ),
                              ),
                              Padding(
                                padding: EdgeInsets.only(right: 2.w),
                                child: CircleAvatar(
                                  radius: 2,
                                  backgroundColor: primary,
                                ),
                              ),
                              Text(
                                shelfPrice(selectedvarients?.sellingPrice),
                                style: customTextstyle(
                                    fontSize: 16.sp,
                                    color: primary,
                                    fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                          buttonWidget(
                              height: 4.5.h,
                              width: 9.w,
                              fontSize: 13,
                              borderRadius: 5,
                              onTap: () {
                                Navigator.pop(context, {
                                  "productVariant": selectedvarients,
                                  "Index": initialSelectedIndex,
                                });
                              },
                              context: context,
                              text: 'Add To Cart')
                        ],
                      )
                    ],
                  );
                },
              ),
            ),
          ],
        );
      }));
}
