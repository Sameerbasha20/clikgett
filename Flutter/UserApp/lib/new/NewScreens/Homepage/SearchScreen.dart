import 'package:fav_app/old/Services/Home/search.dart';
// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/Controllers/kits_controller.dart';
import 'package:fav_app/new/Controllers/searchandrecomend_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/Homepage.dart';
import 'package:fav_app/new/NewScreens/Homepage/ItemDescription.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Combo.dart/Combo.dart';
import 'package:fav_app/new/NewScreens/Widgets/ItemHorizontalTile.dart';
import 'package:fav_app/new/NewScreens/Widgets/ItemTile.dart';
import 'package:fav_app/new/NewScreens/Widgets/textfieldWidget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../NewModel/product_details_model.dart';
import '../Widgets/customToast.dart';
import 'package:fav_app/new/NewScreens/Widgets/purchase_options_sheet.dart';
import 'package:fav_app/new/NewScreens/Support/widgets/search_product_request_card.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key, this.isFromHomeScreen = false});

  final bool isFromHomeScreen;

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final CartController cartController = Get.find();
  FocusNode currentFocus = FocusNode();
  ScrollController scrollController = ScrollController();
  List<String> search = List.filled(1, '');
  final SearchAndRecommendController searchAndRecommendController = Get.find();
  TextEditingController searchController = TextEditingController();

  @override
  void dispose() {
    cartController.removeLoaders();
    searchAndRecommendController.clearSearchString();
    searchAndRecommendController.clearViewAll();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    searchAndRecommendController.getSearchList();
    searchAndRecommendController.getRecomendedProducts(context: context);
  }

  Widget searchBar(context) {
    return Padding(
      padding: EdgeInsets.only(left: 0),
      child: textFieldWidget(
        context: context,
        controller: searchController,
        holder: search,
        hint: "search",
        currentFocus: currentFocus,
        autofocus: true,
        hinttext: "Search",
        hintStyle: customTextstyle(color: ordersPrimaryColor.withOpacity(.5)),
        fillColor: bg1,
        prefixIcon: ImageIcon(
          AssetImage(searchIcon),
          color: ordersPrimaryColor.withOpacity(.5),
        ),
        onsubmit: () {
          if (searchController.text.isNotEmpty) {
            searchAndRecommendController.storeSearchList(searchController.text);
            searchAndRecommendController.getsearchProducts(
                context: context, query: searchController.text);
          }
        },
        onChanged: (p0) {
          searchAndRecommendController.onSearchTextChanged(p0, context);
        },
      ),
    );
  }

  Widget recentSearchWidget() {
    return Obx(
      () => searchAndRecommendController.searchList.isEmpty
          ? Container()
          : SizedBox(
              // height: 100.h,
              child: Column(
                children: [
                  SizedBox(
                    height: 0.5.h,
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Recent Searches",
                        style: customTextstyle(
                            fontSize: 17.sp, fontWeight: FontWeight.w600),
                      ),
                      InkWell(
                        child: Text(
                          searchAndRecommendController.viewAll.isTrue
                              ? "View Less"
                              : "View All",
                          style: customTextstyle(
                              fontSize: 17.sp,
                              color: primary,
                              fontWeight: FontWeight.w600),
                        ),
                        onTap: () {
                          searchAndRecommendController.updateViewAll();
                        },
                      ),
                    ],
                  ),
                  SizedBox(
                    height: 2.h,
                  ),
                  searchAndRecommendController.searchList.isEmpty
                      ? Container()
                      : ListView.builder(
                          shrinkWrap: true,
                          controller: scrollController,
                          itemCount: searchAndRecommendController.viewAll.isTrue
                              ? searchAndRecommendController.searchList.length
                              : searchAndRecommendController
                                          .searchList.length <=
                                      4
                                  ? searchAndRecommendController
                                      .searchList.length
                                  : 4,
                          itemBuilder: (context, index) {
                            var searchList =
                                searchAndRecommendController.searchList[index];
                            return recentlistTile(searchList);
                          },
                        ),
                  recommendedWidget(),
                ],
              ),
            ),
    );
  }

  Widget recentlistTile(String searchList) {
    return Padding(
      padding: EdgeInsets.only(top: 0.5.h, bottom: 0.5.h),
      child: Column(
        children: [
          Row(
            children: [
              ImageIcon(
                AssetImage(searchIcon),
                size: 2.5.h,
                color: black.withOpacity(0.50),
              ),
              SizedBox(
                width: 2.w,
              ),
              Text(
                searchList,
                style: customTextstyle(
                    fontSize: 16.sp,
                    color: black.withOpacity(0.8),
                    fontWeight: FontWeight.w400),
              ),
            ],
          ),
          Divider(
            color: black.withOpacity(0.05),
            thickness: 2,
          ),
        ],
      ),
    );
  }

  Widget recommendedWidget() {
    return Obx(
      () => searchAndRecommendController.isRecomendedLoading.isTrue
          ? CustomLoader()
          : searchAndRecommendController.recommendedProducts.isEmpty
              ? Container()
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      height: 1.h,
                    ),
                    Text(
                      "Recommended For You",
                      style: customTextstyle(
                          fontSize: 17.sp, fontWeight: FontWeight.w600),
                    ),
                    SizedBox(
                      height: 2.h,
                    ),
                    GridView.builder(
                      shrinkWrap: true,
                      physics: NeverScrollableScrollPhysics(),
                      controller: scrollController,
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.76,
                          mainAxisSpacing: 2.h,
                          crossAxisSpacing: 1.5.h),
                      itemCount: searchAndRecommendController
                          .recommendedProducts.length,
                      itemBuilder: (context, index) {
                        var recomend = searchAndRecommendController
                            .recommendedProducts[index];
                        double discount = 0;
                        if (recomend.productVariants != null) {
                          var varient = recomend.productVariants?.first;
                          discount = discountCalculate(
                              varient!.price!, varient.offerPrice!);
                        }
                        return ItemTile(
                          context: context,
                          itemimage: recomend.imageUrl ?? '',
                          item_name: recomend.productName ?? '',
                          weight: [
                            '${recomend.productVariants?.first.metricvalue} ${recomend.productVariants?.first.metrictype}'
                          ],
                          item_price: recomend.productVariants?.first.offerPrice
                                  .toString() ??
                              '',
                          item_OriginalPrice: recomend
                                  .productVariants?.first.price
                                  .toString() ??
                              '',
                          discount: discount,
                          variantsTap: () {},
                          onTap: () {
                            FocusManager.instance.primaryFocus?.unfocus();
                            // Navigator.of(context).push(MaterialPageRoute(
                            //     builder: (context) => ItemDescription(
                            //           id: recomend.productId ?? 0,
                            //           title: recomend.productName ?? '', percent: percent,
                            //         )));
                          },
                        );
                      },
                    )
                  ],
                ),
    );
  }

  Widget searchResult() {
    return Obx(
      () => searchAndRecommendController.products.isEmpty
          ? searchAndRecommendController.isLoading.isTrue
              ? CustomLoader()
              : SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.h),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        SizedBox(height: 1.h),

                        /// 🔍 Title
                        Center(
                          child: Text(
                            "No Results Found",
                            style: customTextstyle(
                              fontSize: 20.sp,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),

                        SizedBox(height: 1.h),

                        /// 🧾 Subtitle
                        Text(
                          searchController.text.trim().isNotEmpty
                              ? "We couldn't find any items matching \"${searchController.text.trim()}\"."
                              : "We couldn't find any items matching your search.",
                          style: customTextstyle(
                            fontSize: 14.sp,
                            color: ordersPrimaryColor.withOpacity(0.6),
                          ),
                          textAlign: TextAlign.center,
                        ),

                        SizedBox(height: 1.5.h),

                        /// 📨 Product Request Prompt Card (Request Product & Request with Camera -> EnquiryScreen)
                        SearchProductRequestCard(
                          searchQuery: searchController.text.trim(),
                          onClearSearch: () {
                            searchController.clear();
                            searchAndRecommendController.clearSearchString();
                          },
                        ),

                        SizedBox(height: 1.5.h),

                        /// 🏠 Go to Homepage Button
                        TextButton.icon(
                          onPressed: () {
                            if (widget.isFromHomeScreen == true) {
                              Navigator.pop(context);
                            } else {
                              Navigator.of(context).pushAndRemoveUntil(
                                MaterialPageRoute(
                                    builder: (context) => Homepage()),
                                (route) => false,
                              );
                            }
                          },
                          icon: const Icon(Icons.home_outlined, size: 20, color: Appprimary),
                          label: Text(
                            "Back to Homepage",
                            style: customTextstyle(
                              fontSize: 14.sp,
                              fontWeight: FontWeight.w500,
                              color: Appprimary,
                            ),
                          ),
                        ),

                        SizedBox(height: 2.h),

                        /// 🖼️ Empty State Illustration
                        Image.asset(
                          nosearchImage,
                          width: 65.w,
                          height: 24.h,
                          fit: BoxFit.contain,
                        ),
                      ],
                    ),
                  ),
                )
          : resultListWidget(),
    );
  }

  Widget resultListWidget() {
    return SizedBox(
      height: 100.h, // Set a fixed height for the widget
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          Padding(
            padding: EdgeInsets.only(
              bottom: cartController.quantity.value != 0 ? 12.h : 0,
            ),
            child: ListView.builder(
              itemCount: searchAndRecommendController.products.length,
              physics: BouncingScrollPhysics(),
              padding: EdgeInsets.all(5.w),
              itemBuilder: (context, index) {
                var searcList = searchAndRecommendController.products[index];

                return SearchItems(
                  searcList: searcList,
                );
              },
            ),
          ),
          if (cartController.quantity.value != 0)
            bottomQuantityViewer(
              throughSearchScreen: true,
              cartController: cartController,
              context: context,
            ),
        ],
      ),
    );
  }


  Widget highlightMatchText(String source, String query) {
    if (query.isEmpty) return Text(source, style: customTextstyle(fontSize: 15.sp, fontWeight: FontWeight.w500));
    final lowerSource = source.toLowerCase();
    final lowerQuery = query.toLowerCase();
    final index = lowerSource.indexOf(lowerQuery);
    if (index == -1) {
      return Text(source, style: customTextstyle(fontSize: 15.sp, fontWeight: FontWeight.w500));
    }
    return RichText(
      maxLines: 2,
      overflow: TextOverflow.ellipsis,
      text: TextSpan(
        children: [
          if (index > 0)
            TextSpan(
              text: source.substring(0, index),
              style: customTextstyle(fontSize: 15.sp, color: Colors.black87, fontWeight: FontWeight.w400),
            ),
          TextSpan(
            text: source.substring(index, index + query.length),
            style: customTextstyle(fontSize: 15.sp, color: Appprimary, fontWeight: FontWeight.w700),
          ),
          if (index + query.length < source.length)
            TextSpan(
              text: source.substring(index + query.length),
              style: customTextstyle(fontSize: 15.sp, color: Colors.black87, fontWeight: FontWeight.w400),
            ),
        ],
      ),
    );
  }

  Widget suggestionTile(SuggestionItem item) {
    double percent = 0.0;
    if (item.price > 0 && item.offerPrice < item.price) {
      percent = ((item.price - item.offerPrice) / item.price) * 100;
    }
    return InkWell(
      onTap: () {
        searchAndRecommendController.storeSearchList(item.productName);
        searchController.text = item.productName;
        searchAndRecommendController.clearSuggestions();
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ItemDescription(
              title: item.productName,
              id: item.productId,
              percent: percent,
              throughSearchScreen: true,
            ),
          ),
        );
      },
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.2.h),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: Colors.grey.shade200, width: 0.8)),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: item.imageUrl.isNotEmpty
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        item.imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const Icon(Icons.search, color: Colors.grey, size: 22),
                      ),
                    )
                  : const Icon(Icons.search, color: Colors.grey, size: 22),
            ),
            SizedBox(width: 3.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  highlightMatchText(item.productName, searchController.text),
                  if (item.categoryName.isNotEmpty) ...[
                    SizedBox(height: 0.3.h),
                    Text(
                      "${item.categoryName}${item.subCategoryName.isNotEmpty ? ' • ${item.subCategoryName}' : ''}",
                      style: customTextstyle(fontSize: 12.sp, color: Colors.grey.shade600),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            if (item.offerPrice > 0)
              Padding(
                padding: EdgeInsets.only(left: 2.w),
                child: Text(
                  "₹${item.offerPrice.toStringAsFixed(0)}",
                  style: customTextstyle(fontSize: 14.sp, fontWeight: FontWeight.w700, color: Appprimary),
                ),
              ),
            const SizedBox(width: 6),
            const Icon(Icons.north_west, size: 14, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget suggestionsWidget() {
    if (searchAndRecommendController.isSuggestionLoading.isTrue) {
      return Padding(
        padding: EdgeInsets.all(5.w),
        child: Row(
          children: [
            const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2, color: Appprimary),
            ),
            SizedBox(width: 3.w),
            Text("Searching suggestions...", style: customTextstyle(fontSize: 14.sp, color: Colors.grey)),
          ],
        ),
      );
    }

    if (searchAndRecommendController.suggestions.isNotEmpty) {
      return ListView.builder(
        itemCount: searchAndRecommendController.suggestions.length,
        physics: const BouncingScrollPhysics(),
        itemBuilder: (context, index) {
          final item = searchAndRecommendController.suggestions[index];
          return suggestionTile(item);
        },
      );
    }

    if (searchAndRecommendController.hasNoSuggestions.isTrue && searchController.text.length >= 2) {
      return Container(
        padding: EdgeInsets.all(5.w),
        alignment: Alignment.center,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(height: 4.h),
            Icon(Icons.search_off, size: 54, color: Colors.grey.shade400),
            SizedBox(height: 1.5.h),
            Text(
              "No suggestions found",
              style: customTextstyle(fontSize: 16.sp, fontWeight: FontWeight.w600, color: Colors.black87),
            ),
            SizedBox(height: 0.5.h),
            Text(
              "Continue with full catalogue search",
              style: customTextstyle(fontSize: 13.sp, color: Colors.grey),
            ),
            SizedBox(height: 2.h),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Appprimary,
                foregroundColor: Colors.white,
                padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 1.2.h),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () {
                searchAndRecommendController.getsearchProducts(
                  context: context,
                  query: searchController.text,
                );
              },
              child: Text(
                "Search '${searchController.text}'",
                style: customTextstyle(fontSize: 14.sp, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      );
    }

    return Container();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        surfaceTintColor: Colors.transparent,
        backgroundColor: white,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: cardBorder,
            height: 1,
          ),
        ),
        title: searchBar(context),
        leading: IconButton(
          padding: EdgeInsets.zero,
          onPressed: () {
            Navigator.of(context).pop();
          },
          icon: Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20,
            color: tColor,
          ),
        ),
      ),
      backgroundColor: bg1,
      body: GetBuilder<SearchAndRecommendController>(
        id: 'search-ui',
        builder: (controller) => searchController.text.isEmpty
            ? SizedBox(
                height: 100.h,
                child: Stack(
                  alignment: Alignment.bottomCenter,
                  children: [
                    SingleChildScrollView(
                      padding: EdgeInsets.only(
                          bottom:
                              cartController.quantity.value != 0 ? 13.h : 0),
                      physics: BouncingScrollPhysics(),
                      child: Container(
                          padding: EdgeInsets.all(5.w),
                          child: Column(
                            children: [
                              recentSearchWidget(),
                            ],
                          )),
                    ),
                    cartController.quantity.value != 0 &&
                            searchAndRecommendController.searchList.isNotEmpty
                        ? bottomQuantityViewer(
                            throughSearchScreen: true,
                            cartController: cartController,
                            context: context)
                        : Container()
                  ],
                ),
              )
            : (searchAndRecommendController.products.isNotEmpty
                ? searchResult()
                : suggestionsWidget()),
      ),
    );
  }
}

class SearchItems extends StatefulWidget {
  const SearchItems({super.key, required this.searcList});

  final Products searcList;

  @override
  State<SearchItems> createState() => _SearchItemsState();
}

class _SearchItemsState extends State<SearchItems> {
  final CartController cartController = Get.find();
  int initialSelectedIndex = 0;
  final KitsController kitsController = Get.find();
  double percent = 0;
  int quantity = 0;
  late Products searcList;
  ProductVariant? selectedVarients;

  @override
  void initState() {
    super.initState();
    searcList = widget.searcList;

    filterAndSetAddedQuantity();
  }

  filterAndSetAddedQuantity() {
    if (cartController.cartItems.isNotEmpty) {
      for (var i = 0; i < cartController.cartItems.length; i++) {
        var item = cartController.cartItems[i];

        for (var j = 0; j < searcList.productVariants!.length; j++) {
          var variants = searcList.productVariants?[j];
          if (variants?.variantId == item.variantId &&
              item.productId == searcList.productId) {
            selectedVarients = variants;
            quantity = item.quantity ?? 0;
          }
        }
      }
    } else {
      quantity = 0;
    }
  }

  bool filterQuantityAfterBottomsheet(ProductVariant? selectedVarients) {
    bool isValueFound = false;
    for (var i = 0; i < cartController.cartItems.length; i++) {
      var item = cartController.cartItems[i];

      if (item.productId == searcList.productId) {
        if (searcList.productVariants?.length != null) {
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

  quantityAdd({required bool addOrRemove, bool isToastRemove = false}) {
    selectedVarients ??= searcList.productVariants?.first;
    // if(selectedVarients!.availableQty!<selectedVarients!.maxQty!){
    //   customToast(message: 'Quantity not available ');
    //
    // }else{
    //   if (quantity < selectedVarients!.maxQty! || addOrRemove == false) {
    //     if (addOrRemove) {
    //       quantity++;
    //     } else {
    //       if (quantity > 0) {
    //         quantity--;
    //       }
    //     }
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
      cartController
          .updateQuantity(
              productId: selectedVarients?.productId ?? 0,
              variantId: selectedVarients?.variantId ?? 0,
              quantity: quantity,
              removeToast: isToastRemove,
              isFromSearchScreen: false,
              categoryId: searcList.categoryId,
              subCategoryId: searcList.subCategoryId,
              context: context)
          .then((value) {
        if (value == false) {
          if (addOrRemove) {
            quantity--;
          } else {
            quantity++;
          }
        }
      });

      kitsController.updateComboList();
    } else {
      customToast(message: 'Quantity not available');
    }
  }

  /// Shows the Buy 1 / Buy 2 purchase options sheet.
  /// Triggered when the customer taps 'Add' on a search item with qty == 0.
  void _showPurchaseOptions(BuildContext context) {
    selectedVarients ??= searcList.productVariants?.first;
    if (selectedVarients == null) return;

    showPurchaseOptionsSheet(
      context: context,
      selectedVariant: selectedVarients!,
      variants: searcList.productVariants,
      productImages: searcList.productImages ?? [],
      productName: searcList.productName ?? '',
      currentQuantityInCart: quantity,
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

  @override
  Widget build(BuildContext context) {
    selectedVarients ??= searcList.productVariants?.first;
    if (selectedVarients != null) {
      percent = discountCalculate(
          selectedVarients!.price!, selectedVarients!.offerPrice!);
    }
    return GestureDetector(
      onTap: () {
        FocusManager.instance.primaryFocus?.unfocus();
        Navigator.push(
            context,
            MaterialPageRoute(
                builder: (_) => ItemDescription(
                      throughSearchScreen: true,
                      title: searcList.productName ?? '',
                      id: searcList.productId ?? 0,
                      percent: percent,
                    )));
      },
      child: GetBuilder<KitsController>(
        id: 'combo-list',
        builder: (_) {
          return Padding(
            padding: EdgeInsets.only(bottom: 1.h),
            child: ItemHorizontalTile(
              context: context,
              quantity: quantity,
              onTap: () {
                _showPurchaseOptions(context);
              },
              decrement: () {
                quantityAdd(addOrRemove: false, isToastRemove: true);
              },
              increment: () {
                quantityAdd(addOrRemove: true, isToastRemove: true);
              },
              itemimage: searcList.imageUrl ?? '',
              item_name: searcList.productName ?? '',
              item_images: searcList.productImages ?? [],
              isMultipleVarients:
                  searcList.productVariants!.length > 1 ? true : false,
              weight: [
                '${selectedVarients?.metricvalue} ${selectedVarients?.metrictype}'
              ],
              item_price:
                  selectedVarients?.offerPrice?.toStringAsFixed(2) ?? '',
              maxquantity: selectedVarients?.maxQty,
              availableQty: selectedVarients?.availableQty,
              item_OriginalPrice:
                  selectedVarients?.price?.toStringAsFixed(2) ?? '',
              discount: percent.toStringAsFixed(2),
              onTapImage: () {
                // Navigator.of(context).push(
                //     MaterialPageRoute(builder: (context) => ItemDescription()));
              },
              onTapWeight: () {
                bottomsheet(searcList, context, selectedVarients,
                        initialSelectedIndex)
                    .then((value) {
                  if (value != null) {
                    FocusManager.instance.primaryFocus?.unfocus();
                    selectedVarients = value['productVariant'];
                    initialSelectedIndex = value['Index'];
                    quantity = 0;
                    percent = discountCalculate(selectedVarients!.price!,
                        selectedVarients!.offerPrice!);

                    var checkValuesExistOrnot =
                        filterQuantityAfterBottomsheet(selectedVarients);
                    if (!checkValuesExistOrnot) {
                      quantityAdd(addOrRemove: true);
                    }
                    kitsController.updateComboList();
                  }
                });
              },
            ),
          );
        },
      ),
    );
  }
}
