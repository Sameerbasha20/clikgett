// // ignore_for_file: non_constant_identifier_names

// import 'package:fav_app/new/Constants/imageslist.dart';
// import 'package:fav_app/new/NewModel/itemTileModel.dart';
// import 'package:flutter/foundation.dart';

// class CategoryProvider extends ChangeNotifier {
//   List<String> categoriesList = ['Fruits', 'Vegetables', 'Cereals', 'Grains'];
//   List<String> categoriesImages = [
//     CategoryFruits,
//     CategoryVeg,
//     CategoryCerals,
//     CategoryGrains
//   ];

//   int selectedCategory = 0;
//   List selectedSubCategories = [];
//   List<itemTileModel> subcategoryList = [];
//   List subCategories1 = [
//     'Seasonal Fruits',
//     'Exotic Fruits',
//     'Fruits Combo',
//     'Fruits Basket',
//     'Freq Buy'
//   ];
//   List subCategories2 = [
//     'Leafy Vegetables',
//     'Exotic Vegetables',
//     'Ground Root Vegetables',
//     'Vegetables Basket',
//     'Freq Buy'
//   ];
//   List subCategories3 = [
//     'Wheat',
//     'Oats',
//     'Rice',
//     'Corn(Maize)',
//     'Barley',
//     'Grains',
//   ];
//   List subCategories4 = [
//     'Seasonal Fruits',
//     'Exotic Fruits',
//     'Fruits Combo',
//     'Fruits Basket',
//     'Freq Buy'
//   ];

//   List<itemTileModel> fruitsList = [
//     (itemTileModel(
//         name: "Blue Berry",
//         image: blueberry,
//         price: "82",
//         originalPrice: "112",
//         discount: "12",
//         weight: ['500 gm', '1 kg'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//     (itemTileModel(
//         name: "Guava",
//         image: guava,
//         price: "82",
//         originalPrice: "112",
//         discount: "10",
//         weight: ['1 kg', '500 gm'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//     (itemTileModel(
//         name: "kiwi",
//         image: kiwi,
//         price: "110",
//         originalPrice: "124",
//         discount: "11",
//         weight: ['1 piece(1.5kg-2.5kg)'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//     (itemTileModel(
//         name: "Banana",
//         image: banana,
//         price: "50",
//         originalPrice: "80",
//         discount: "30",
//         weight: ['1 kg', '500gm'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//     (itemTileModel(
//         name: "Grapes",
//         image: grapes,
//         price: "82",
//         originalPrice: "112",
//         discount: "10",
//         weight: ['400 gm', '500 gm', '1 kg', '250gm'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//     (itemTileModel(
//         name: "Green Apple",
//         image: greenapple,
//         price: "55",
//         originalPrice: "65",
//         discount: "20",
//         weight: ['1kg', '1/2kg'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//     (itemTileModel(
//         name: "Apple",
//         image: apple,
//         price: "85",
//         originalPrice: "100",
//         discount: "10",
//         weight: ['1kg'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//     (itemTileModel(
//         name: "Pineapple",
//         image: pineapple,
//         price: "50",
//         originalPrice: "80",
//         discount: "30",
//         weight: ['1piece'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//   ];

//   List<itemTileModel> vegList = [
//     (itemTileModel(
//         name: "Cabbage",
//         image: cabbage,
//         price: "53",
//         originalPrice: "65",
//         discount: "10",
//         weight: ['1kg', '500gm', '250gm'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//     (itemTileModel(
//         name: "Spinach",
//         image: spinach,
//         price: "3o",
//         originalPrice: "65",
//         discount: "16",
//         weight: ['250gm'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//     (itemTileModel(
//         name: "Broccoli",
//         image: broccoli,
//         price: "80",
//         originalPrice: "125",
//         discount: "35",
//         weight: ['1kg', '500gm'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//     (itemTileModel(
//         name: "Potato",
//         image: potato,
//         price: "53",
//         originalPrice: "65",
//         discount: "10",
//         weight: ['1kg'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//     (itemTileModel(
//         name: "Ladies Finger",
//         image: bindi,
//         price: "45",
//         originalPrice: "50",
//         discount: "15",
//         weight: ['1kg'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//     (itemTileModel(
//         name: "Brinjal",
//         image: brinjal,
//         price: "85",
//         originalPrice: "100",
//         discount: "16",
//         weight: ['1kg'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//   ];

//   List<itemTileModel> grains = [
//     (itemTileModel(
//         name: "Barley",
//         image: barley,
//         price: "84",
//         originalPrice: "114",
//         discount: "20",
//         weight: ['1kg'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//     (itemTileModel(
//         name: "Rice",
//         image: rice,
//         price: "100",
//         originalPrice: "150",
//         discount: "40",
//         weight: ['1kg'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//     (itemTileModel(
//         name: "BuckWheat",
//         image: buckwheat,
//         price: "85",
//         originalPrice: "100",
//         discount: "16",
//         weight: ['1kg'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//     (itemTileModel(
//         name: "Millet Rice",
//         image: rice,
//         price: "84",
//         originalPrice: "114",
//         discount: "20",
//         weight: ['1kg'],
//         description:
//             "Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available. Wikipedia")),
//   ];

//   void changeCategory(index) {
//     selectedCategory = index;
//     notifyListeners();
//     load();
//   }

//   load() {
//     if (selectedCategory == 0) {
//       selectedSubCategories = subCategories1;

//       subcategoryList = fruitsList;
//       notifyListeners();
//     } else if (selectedCategory == 1) {
//       selectedSubCategories = subCategories2;

//       subcategoryList = vegList;
//       notifyListeners();
//     } else if (selectedCategory == 2) {
//       selectedSubCategories = subCategories3;

//       subcategoryList = grains;
//       notifyListeners();
//     } else if (selectedCategory == 3) {
//       selectedSubCategories = subCategories4;

//       subcategoryList = grains;
//       notifyListeners();
//     }

//     notifyListeners();
//   }
// }
