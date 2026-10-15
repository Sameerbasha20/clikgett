import 'package:fav_app/new/NewModel/itemTileModel.dart';

class CartModel {
  String name;
  String image;
  String price;
  String originalPrice;
  String discount;
  String combo;
  bool isCombo;
  List<itemTileModel> comboItems;
  List<String> weight;
  String description;
  CartModel(
      {required this.name,
      required this.image,
      required this.price,
      required this.originalPrice,
      required this.discount,
      required this.isCombo,
      required this.weight,
      required this.comboItems,
      required this.combo,
      required this.description});
}
