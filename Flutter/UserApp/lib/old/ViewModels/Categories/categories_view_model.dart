import 'package:fav_app/old/Constants/toast.dart';
import 'package:fav_app/old/Models/Categories/categories_model.dart';
import 'package:fav_app/old/Services/Catgories/categories_services.dart';
import 'package:fav_app/old/Services/Products/product_services.dart';
import 'package:fav_app/old/Services/common/network_check.dart';
import 'package:flutter/material.dart';

class CategoriesViewModel extends ChangeNotifier {
  // List catgoriesList = [
  //   {
  //     "CategoryName": "Fruits",
  //     "icon": 'fruits',
  //     "SubCategories": [
  //       {"Name": "Seasonal Fruits"},
  //       {"Name": "Exotic Fruits"},
  //       {"Name": "Fruits Combo"},
  //       {"Name": "Fruit Basket"},
  //       {"Name": "(Freq.buy)"},
  //     ]
  //   },
  // ];

  List<Category> catgoriesList = [];
  bool showCategoriesExpandedList = true;
  int selectedCategory = 0;
  int selectedSubCategory = 0;

  bool isLoadingCategories = false;
  bool isLoadingProducts = false;

  List<dynamic> products = [];

  bool get _isLoadingProducts => isLoadingProducts;
  List<dynamic> get _product => products;

  bool get _isLoadingCategories => isLoadingCategories;

  bool get _showCategoriesExpandedList => showCategoriesExpandedList;
  List<Category> get _catergoriesList => catgoriesList;
  int get _selectedCategory => selectedCategory;
  int get _SelectedSubCategory => selectedSubCategory;

  setShowCategoriesExpandedList(bool val) {
    showCategoriesExpandedList = val;
    notifyListeners();
  }

  setSelectedCategory(int val) {
    selectedCategory = val;
    notifyListeners();
  }

  setSelectedSubCategory(int val, context) {
    selectedSubCategory = val;
    notifyListeners();
    getProducts(context: context);
  }

  setIsLoadingCategories(val) {
    isLoadingCategories = val;
    notifyListeners();
  }

  setCatgoriesList(val) {
    catgoriesList = val;
    notifyListeners();
  }

  setData(val) {
    products = val;
    notifyListeners();
  }

  setisLoadingProducts(val) {
    isLoadingProducts = val;
    notifyListeners();
  }

  getCategories({
    required context,
  }) async {
    setIsLoadingCategories(true);
    // Timer(Duration(seconds: 2), () {
    Network.networkCheck(context).then((value) => value != null
        ? {
            CategoriesServices.getCategories().then((value) => value != null
                ? {
                    if (value.status == 1)
                      {
                        setCatgoriesList(value.categories),
                      }
                    else
                      {
                        customToast(message: value.message),
                      },
                    setIsLoadingCategories(false)
                  }
                : {
                    customToast(message: 'Error'),
                    setIsLoadingCategories(false)
                  })
          }
        : {
            customToast(message: 'Network error'),
            setIsLoadingCategories(false)
          });
    // });
  }

  getProducts({
    required context,
  }) async {
    setisLoadingProducts(true);
    // Timer(Duration(seconds: 2), () {
    Network.networkCheck(context).then((value) => value != null
        ? {
            ProductServices.getProductsFromCategories(
                    limit: 0,
                    offset: 0,
                    categoryId: 0
                    // catgoriesList[selectedCategory]
                    //     .subCategories![selectedSubCategory]
                    //     .categoryID
                    ,
                    subCategoryId: 0
                    //  catgoriesList[selectedCategory]
                    //     .subCategories![selectedSubCategory]
                    //     .subCategoryID
                    )
                .then((value) => value != null
                    ? {
                        if (value.status == 1)
                          {
                            if (value.products != null)
                              {
                                setData(value.products),
                              }
                          }
                        else
                          {
                            customToast(message: value.message),
                          },
                        setisLoadingProducts(false)
                      }
                    : {
                        customToast(message: 'Error'),
                        setisLoadingProducts(false)
                      })
          }
        : {customToast(message: 'Network error'), setisLoadingProducts(false)});
    // });
  }
}
