import 'dart:async';
import 'package:fav_app/new/NewModel/recomended_model.dart';
import 'package:fav_app/old/Models/Home/products_model.dart';
import 'package:fav_app/old/Services/Home/search.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../old/Constants/toast.dart';
import '../NewModel/product_details_model.dart';
import '../Services/common/network_check.dart';

class SearchAndRecommendController extends GetxController {
  final RxBool _isLoading = false.obs;
  RxBool get isLoading => _isLoading;
  final RxBool _isRecomendedLoading = false.obs;
  RxBool get isRecomendedLoading => _isRecomendedLoading;
  RxList<String> searchList = RxList();
  ProductsModel? productsModel;
  RxList<Products> products = RxList();
  RxBool viewAll = false.obs;

  // Search Suggestions State
  RxList<SuggestionItem> suggestions = RxList();
  RxList<String> popularSearches = RxList();
  RxBool isSuggestionLoading = false.obs;
  RxBool hasNoSuggestions = false.obs;
  Timer? _debounceTimer;

  updateViewAll() {
    viewAll.value = !viewAll.value;
  }

  updateUi() {
    update(['search-ui']);
  }

  clearViewAll() {
    Future.delayed(
      Duration.zero,
      () => viewAll(false),
    );
  }

  storeSearchList(String value) async {
    final SharedPreferences pref = await SharedPreferences.getInstance();
    if (!searchList.contains(value)) {
      searchList.add(value);
      pref.setStringList('searchList', searchList);
      getSearchList();
    }
  }

  getSearchList() async {
    final SharedPreferences pref = await SharedPreferences.getInstance();
    searchList(pref.getStringList('searchList') ?? []);
  }

  clearAllSearchHistory() async {
    final SharedPreferences pref = await SharedPreferences.getInstance();
    await pref.remove('searchList');
    searchList.clear();
    await SearchServices.clearSearchHistory();
    updateUi();
  }

  clearSearchProducts() {
    products.clear();
  }

  clearSuggestions() {
    _debounceTimer?.cancel();
    suggestions.clear();
    hasNoSuggestions(false);
    isSuggestionLoading(false);
  }

  clearSearchString() {
    clearSuggestions();
    Future.delayed(
      Duration.zero,
      () => searchString(''),
    );
  }

  RxString searchString = ''.obs;

  /// Debounced Search Input Handler (300ms debounce, min 2 chars)
  void onSearchTextChanged(String text, BuildContext context) {
    _debounceTimer?.cancel();
    String query = text.trim();

    if (query.isEmpty) {
      clearSuggestions();
      clearSearchProducts();
      searchString('');
      updateUi();
      return;
    }

    if (query.length < 2) {
      clearSuggestions();
      updateUi();
      return;
    }

    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      fetchSuggestions(query);
    });
  }

  Future<void> fetchSuggestions(String query) async {
    if (query.length < 2) return;
    isSuggestionLoading(true);
    hasNoSuggestions(false);

    try {
      final res = await SearchServices.getSuggestions(query);
      if (res.status == 1) {
        suggestions(res.suggestions);
        popularSearches(res.popularSearches);
        hasNoSuggestions(res.suggestions.isEmpty);
      } else {
        suggestions.clear();
        hasNoSuggestions(true);
      }
    } catch (_) {
      suggestions.clear();
      hasNoSuggestions(true);
    } finally {
      isSuggestionLoading(false);
      updateUi();
    }
  }

  getsearchProducts({required context, required String query}) async {
    clearSearchProducts();
    clearSuggestions();
    Future.delayed(
      Duration.zero,
      () {
        _isLoading(true);
      },
    );
    Network.networkCheck(context).then((value) => value != null
        ? {
            SearchServices.searchProducts(query)
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            if (value.products != null)
                              {
                                searchString(query),
                                productsModel = value,
                                products(productsModel?.products)
                              }
                          }
                        else
                          {
                            customToast(message: 'Error'),
                          },
                        _isLoading(false)
                      }
                    : {customToast(message: 'Error'), _isLoading(false)})
                .catchError((onError) {
              debugPrint(onError.toString());
              customToast(message: onError.toString());
              _isLoading(false);
            })
          }
        : {customToast(message: 'Network error'), _isLoading(false)});
  }

  RecomendedModel? recomendedModel;
  RxList<BestItem> recommendedProducts = RxList();
  getRecomendedProducts({required context}) async {
    Future.delayed(
      Duration.zero,
      () {
        _isRecomendedLoading(true);
      },
    );
    Network.networkCheck(context).then((value) => value != null
        ? {
            SearchServices.recomendedProducts()
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            recomendedModel = value,
                            recommendedProducts(recomendedModel?.bestItems)
                          }
                        else
                          {
                            customToast(message: 'Error'),
                          },
                        _isRecomendedLoading(false)
                      }
                    : {
                        customToast(message: 'Error'),
                        _isRecomendedLoading(false)
                      })
                .catchError((onError) {
              debugPrint(onError.toString());
              customToast(message: onError.toString());
              _isRecomendedLoading(false);
            })
          }
        : {customToast(message: 'Network error'), _isRecomendedLoading(false)});
  }

  @override
  void onClose() {
    _debounceTimer?.cancel();
    super.onClose();
  }
}
