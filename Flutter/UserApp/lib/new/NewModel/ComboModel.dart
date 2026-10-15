import 'package:fav_app/new/NewModel/itemTileModel.dart';

class ComboModel {
  String name;
  String image;
  String price;
  String originalPrice;
  String discount;
  String combo;
  List<itemTileModel> comboItems;
  String description;
  ComboModel(
      {required this.name,
      required this.image,
      required this.price,
      required this.originalPrice,
      required this.discount,
      required this.comboItems,
      required this.combo,
      required this.description});
}
