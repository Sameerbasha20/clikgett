import 'package:flutter/material.dart';

class CategoriesViewModel extends ChangeNotifier {
  List catgoriesList = [
    {
      "CategoryName": "Fruits",
      "icon": 'fruits',
      "SubCategories": [
        {"Name": "Seasonal Fruits"},
        {"Name": "Exotic Fruits"},
        {"Name": "Fruits Combo"},
        {"Name": "Fruit Basket"},
        {"Name": "(Freq.buy)"},
      ]
    },
    {
      "CategoryName": "Vegtables",
      "icon": 'vegtables',
      "SubCategories": [
        {"Name": "Seasonal Vegtables"},
        {"Name": "Exotic Vegtables"},
        {"Name": "Combo"},
        {"Name": "Basket"},
        {"Name": "(Freq.buy)"},
      ]
    },
    {
      "CategoryName": "Cereals",
      "icon": 'cereals',
      "SubCategories": [
        {"Name": "Oats"},
        {"Name": "(Freq.buy)"},
      ]
    },
    {
      "CategoryName": "Grains",
      "icon": 'grains',
      "SubCategories": [
        {"Name": "Rice"},
        {"Name": "Wheat"},
        {"Name": "(Freq.buy)"},
      ]
    }
  ];
  bool showCategoriesExpandedList = true;
  int selectedCategory = 0;
  int selectedSubCategory = 0;

  bool get _showCategoriesExpandedList => showCategoriesExpandedList;
  get _catergoriesList => catgoriesList;
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

  setSelectedSubCategory(int val) {
    selectedSubCategory = val;
    notifyListeners();
  }
}
