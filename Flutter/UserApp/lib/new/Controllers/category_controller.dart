import 'package:fav_app/new/NewModel/product_details_model.dart';
import 'package:fav_app/new/NewModel/sub_category_model.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/common/network_check.dart';
import 'package:fav_app/old/Models/Categories/categories_model.dart';
import 'package:fav_app/old/Models/Home/cart_model.dart';
import 'package:fav_app/old/Models/Home/products_model.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../old/Models/Home/home_model.dart' as home;
// import '../../old/Models/Kits/kits_model.dart' as kitsModel;
import '../../old/Services/Catgories/categories_services.dart';
import '../../old/Services/Products/product_services.dart';

class CategoryController extends GetxController {
  final RxBool _isCategoryLoading = false.obs;
  RxBool get isCategoryLoading => _isCategoryLoading;
  final RxBool _isProductDetialLoading = false.obs;
  RxBool get isProductDetialLoading => _isProductDetialLoading;
  final RxBool _isLoading = false.obs;
  RxBool get isLoading => _isLoading;
  final RxBool _isproductsLoading = false.obs;
  RxBool get isproductsLoading => _isproductsLoading;
  CategoriesModel? categoriesModel;
  RxList<home.SpecialCategory> categories = RxList();
  SubCategoriesModel? subCategoriesModel;
  RxList<SubCategory> subCategories = RxList();
  ProductsModel? productsModel;
  RxList<Products> products = RxList();
  ProductDetailsModel? productDetailsModel;
  Products? productsDetails;
  ProductVariant? productVariant;
  RxList<Products> similarProducts = <Products>[].obs;
  final RxBool _isSimilarProductsLoading = false.obs;
  RxBool get isSimilarProductsLoading => _isSimilarProductsLoading;

  updateTab() {
    update(['update-tab']);
  }

  clearProducts() {
    Future.delayed(
      Duration.zero,
      () {
        products.clear();
        _isproductsLoading(true);
      },
    );
  }

  Future<void> getCategories(
      {required context, required categoryId, required bool isfromHome}) async {
    Future.delayed(
      Duration.zero,
      () {
        _isCategoryLoading(true);
      },
    );
    Network.networkCheck(context).then((value) => value != null
        ? {
            CategoriesServices.getCategories()
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            categoriesModel = value,
                            categories(categoriesModel?.categories),
                          }
                        else
                          {
                            // customToast(message: value.message),
                          },
                        _isCategoryLoading(false)
                      }
                    : {
                        // customToast(message: 'Error'),
                        _isCategoryLoading(false)
                      })
                .catchError((onError) {
              _isCategoryLoading(false);
              return <Object>{};
            })
          }
        : {
            // customToast(message: 'Network error'), _isCategoryLoading(false)
          });
  }

  clearSubCategories() {
    subCategories.clear();
    subCategoriesModel = null;
    _isLoading(true);
  }

  Future<void> getSubCategories({required context, required categoryId}) async {
    _isLoading(true);

    try {
      final networkVal = await Network.networkCheck(context);
      if (networkVal == null) {
        customToast(message: 'Network error');
        _isLoading(false);
        return;
      }

      final value = await CategoriesServices.getsubCategoriesList(categoryId);
      if (value != null && value.status == 1) {
        subCategoriesModel = value;
        subCategories.assignAll(subCategoriesModel?.subCategories ?? []);
        if (subCategories.isNotEmpty) {
          await getProducts(
            context: context,
            categoryId: categoryId,
            storeOffsetIfItFromProducts: true,
            subcategoryId: subCategories.first.subCategoryId ?? 0,
          );
        }
      }
    } catch (onError) {
      debugPrint("Error in getSubCategories: $onError");
    } finally {
      _isLoading(false);
    }
  }

  updateProductLoader() {
    Future.delayed(
      Duration.zero,
      () {
        _isproductsLoading(true);
      },
    );
  }

  RxInt categoryIDforsubcategory = 0.obs;
  RxInt subCatIDforsubcategory = 0.obs;
  RxInt productIDforsubcategory = 0.obs;
  RxInt storedLimit = 10.obs;
  RxInt storedOffset = 0.obs;
  RxBool checkOffsetLimitExistornot = false.obs;

  removeLimitAndOffset() {
    Future.delayed(
      Duration.zero,
      () {
        storedLimit(10);
        storedOffset(0);
        checkOffsetLimitExistornot(false);
        tabIndexValue(0);
      },
    );
  }

  clearProductspagination() {
    _isproductsLoading(true);
    products.clear();
  }

  updateLimitAndOffset({
    required int limit,
  }) {
    storedLimit(limit);
  }

  updateOffset({
    required int offset,
  }) {
    storedOffset(offset);
  }

  RxInt tabIndexValue = 0.obs;

  updateTabIndex(int val) {
    tabIndexValue(val);
  }

  Future<void> getProducts({
    required context,
    required int categoryId,
    required int subcategoryId,
    bool removeLoader = false,
    bool storeOffsetIfItFromProducts = false,
  }) async {
    if (!removeLoader) {
      updateProductLoader();
    }

    print(
        "🔄 API call → category: $categoryId, subCat: $subcategoryId, offset: $storedOffset, limit: $storedLimit");

    Network.networkCheck(context).then((value) async {
      if (value == null) {
        customToast(message: 'Network error');
        _isproductsLoading(false);
        return;
      }

      try {
        final value = await ProductServices.getProductsFromCategories(
          limit: storedLimit,
          offset: storedOffset,
          categoryId: categoryId,
          subCategoryId: subcategoryId,
        );

        if (value == null) {
          customToast(message: 'Error');
          _isproductsLoading(false);
          return;
        }

        if (value.status == 1) {
          final isFirstPage = storedOffset == 0;

          if (value.products != null) {
            categoryIDforsubcategory(categoryId);
            subCatIDforsubcategory(subcategoryId);
            productsModel = value;

            // ✅ Clear products list only on first page
            if (isFirstPage && storeOffsetIfItFromProducts) {
              products.clear();
            }

            // ✅ Prevent duplicate addition
            final newProducts = value.products!;
            for (var prod in newProducts) {
              if (!products.any((p) => p.productId == prod.productId)) {
                products.add(prod);
              }
            }

            // ✅ Offset handling
            if (value.offset != -1) {
              if (storeOffsetIfItFromProducts) {
                storedOffset(value.offset);
              }
            } else {
              checkOffsetLimitExistornot(true);
            }
          }
        } else {
          customToast(message: value.message);
        }
      } catch (onError) {
        // debugPrint(onError.toString());
        customToast(message: onError.toString());
      } finally {
        _isproductsLoading(false);
      }
    });
  }

  // Future<void> getProducts({
  //   required context,
  //   required int categoryId,
  //   required int subcategoryId,
  //   bool removeLoader = false,
  //   bool storeOffsetIfItFromProducts = false,
  // }) async {
  //   if (!removeLoader) {
  //     updateProductLoader();
  //   }
  //   Network.networkCheck(context).then((value) async => value != null
  //       ? {
  //           await ProductServices.getProductsFromCategories(
  //                   limit: storedLimit,
  //                   offset: storedOffset,
  //                   categoryId: categoryId,
  //                   subCategoryId: subcategoryId)
  //               .then((value) => value != null
  //                   ? {
  //                       if (value.status == 1)
  //                         {
  //                           if (value.products != null)
  //                             {
  //                               categoryIDforsubcategory(categoryId),
  //                               subCatIDforsubcategory(subcategoryId),
  //                               productsModel = value,

  //                               // if (checkOffsetLimitExistornot.isFalse)
  //                               //   {
  //                               if (storeOffsetIfItFromProducts == true)
  //                                 {
  //                                   products
  //                                       .addAll(productsModel?.products ?? []),
  //                                 },
  //                               // },
  //                               if (value.offset != -1)
  //                                 {
  //                                   if (storeOffsetIfItFromProducts == true)
  //                                     {
  //                                       storedOffset(value.offset),
  //                                     },
  //                                 }
  //                               else
  //                                 {
  //                                   checkOffsetLimitExistornot(true),
  //                                 },
  //                             }
  //                         }
  //                       else
  //                         {
  //                           customToast(message: value.message),
  //                         },
  //                       _isproductsLoading(false)
  //                     }
  //                   : {
  //                       customToast(message: 'Error'),
  //                       _isproductsLoading(false)
  //                     })
  //               .catchError((onError) {
  //             debugPrint(onError.toString());
  //             customToast(message: onError.toString());
  //             _isproductsLoading(false);
  //           })
  //         }
  //       : {customToast(message: 'Network error'), _isproductsLoading(false)});
  // }

  Future<void> getProductsDetails(
      {required context,
      required int productId,
      bool removeLoader = false}) async {
    if (removeLoader == false) {
      _isProductDetialLoading(true);
    }

    Network.networkCheck(context).then((value) async => value != null
        ? {
            await ProductServices.getProductDetails(productId)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            if (value.products != null)
                              {
                                productIDforsubcategory(productId),
                                productDetailsModel = value,
                                productsDetails = productDetailsModel?.products,
                                filterAndSetAddedQuantity(),
                                updateProductsWhenQuantityNull(
                                    productsDetails?.productVariants),
                              }
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        _isProductDetialLoading(false)
                      }
                    : {
                        customToast(message: 'Error'),
                        _isProductDetialLoading(false)
                      })
                .catchError((onError) {
              debugPrint(onError.toString());
              customToast(message: onError.toString());
              _isProductDetialLoading(false);
              return <dynamic>{};
            })
          }
        : {
            customToast(message: 'Network error'),
            _isProductDetialLoading(false)
          });
  }

  updateProductsWhenQuantityNull(List<ProductVariant>? productVariants) {
    if (productsDetails?.productVariants != null) {
      if (varientsCheckwithcart == null) {
        updateVariant(productsDetails!.productVariants!.first);
      }
    }
  }

  clearValues() {
    Future.delayed(
      Duration.zero,
      () {
        _ammount(0);
        _quantity(0);
        // _offerammount(0);
        _varientID(0);
        varientsCheckwithcart = null;
        similarProducts.clear();
        _isSimilarProductsLoading(false);
      },
    );
  }

  Future<void> getSimilarProducts({required int productId}) async {
    _isSimilarProductsLoading(true);
    try {
      final value = await ProductServices.getSimilarProducts(productId);
      if (value.status == 1) {
        similarProducts.assignAll(value.products);
      } else {
        similarProducts.clear();
      }
    } catch (e) {
      debugPrint("Error fetching similar products: $e");
      similarProducts.clear();
    } finally {
      _isSimilarProductsLoading(false);
    }
  }

  removeQuantity() {
    _quantity(0);
  }

  updateQuantity(int value) {
    _quantity(value);
  }

  /// Order Details
  final RxString _selectedMetricTypeandValue = ''.obs;

  RxString get selectedMetricTypeandValue => _selectedMetricTypeandValue;
  final RxString _selectedExpire = ''.obs;

  RxString get selectedExpire => _selectedExpire;

  final RxInt _quantity = 0.obs;

  RxInt get quantity => _quantity;
  final RxInt _varientID = 0.obs;

  RxInt get varientID => _varientID;
  final RxDouble _ammount = 0.0.obs;

  RxDouble get ammount => _ammount;
  final RxDouble _offerammount = 0.0.obs;

  RxDouble get offerammount => _offerammount;
  final RxInt _availableQty = 0.obs;
  final RxInt _maxavailableQty = 0.obs;

  RxInt get availableQty => _availableQty;
  RxInt get maxavailableQty => _maxavailableQty;

  updateVariant(ProductVariant productVariant) {
    _selectedMetricTypeandValue(
        '${productVariant.metricvalue} ${productVariant.metrictype}');

    _selectedExpire(productVariant.ExpiryDate);

    _ammount(productVariant.price);
    _offerammount(productVariant.sellingPrice);
    _varientID(productVariant.variantId);
    _availableQty(productVariant.availableQty);
    _maxavailableQty(productVariant.maxQty);
  }

  addAndRemoveQuantity(bool isAdd) {
    if (isAdd) {
      if (quantity < varientsCheckwithcart!.availableQty! &&
          quantity < varientsCheckwithcart!.maxQty!) {
        _quantity.value++;
      } else {
        customToast(message: 'Maximum quantity reached');
      }
    } else {
      // Decrease quantity but ensure it's above 0
      if (_quantity > 0) {
        _quantity.value--;
      }

      //
      // if (isAdd) {
      //   _quantity.value++;
      // } else {
      //   if (quantity.value >= 0) {
      //     _quantity.value--;
      //   }
      // }
      // }
    }
  }

  updateselectedProductVarient(ProductVariant? val) {
    varientsCheckwithcart = val;
  }

  ProductVariant? varientsCheckwithcart;
  RxList<CartItem> cartItems = RxList();
  addCartItemsFromCart(List<CartItem> carts) {
    cartItems(carts);
  }

  filterAndSetAddedQuantity() {
    for (var i = 0; i < cartItems.length; i++) {
      var item = cartItems[i];
      for (var j = 0; j < productsDetails!.productVariants!.length; j++) {
        var varients = productsDetails?.productVariants?[j];
        if (item.variantId == varients?.variantId &&
            item.productId == varients?.productId) {
          _quantity(item.quantity ?? 0);
          updateVariant(varients!);
          varientsCheckwithcart = varients;
          break;
        }
      }
    }
  }
}
