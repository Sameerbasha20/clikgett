import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/Models/Home/products_model.dart';
import 'package:fav_app/old/Screens/Widgets/search_item_tile.dart';
import 'package:fav_app/old/Services/Home/search.dart';
import 'package:fav_app/old/ViewModels/Home/cart_view_model.dart';
import 'package:fav_app/old/ViewModels/Home/product_view_model.dart';
import 'package:fav_app/old/ViewModels/Home/search.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SearchBarFunctionality extends SearchDelegate {
  final List list;
  CartViewModel? cartViewModel;
  List<String> searchResults = [
    'apples',
    'banana',
    'mango',
    'pineapple',
  ];
  List<String> queryList = [];
  List<String> getList = [];

  SearchBarFunctionality(this.list);

  storedataLocally(String query) async {
    final SharedPreferences pref = await SharedPreferences.getInstance();
    var res = queryList.contains(query);
    if (res) {
    } else {
      queryList.toSet().toList();
      queryList.add(query);
    }

    pref.setStringList('queryList', queryList);
    getList = pref.getStringList('queryList')!;
  }

  double percenatge = 0;
  SearchViewModel? searchViewModel;
  @override
  ThemeData appBarTheme(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return theme.copyWith(
      textTheme: const TextTheme(
        titleLarge: TextStyle(
          color: Colors.black38,
        ),
      ),
      hintColor: Colors.black26,
      appBarTheme:
          theme.appBarTheme.copyWith(elevation: 0.5, backgroundColor: tWhite),
      inputDecorationTheme: theme.inputDecorationTheme
          .copyWith(focusedBorder: InputBorder.none, border: InputBorder.none),
    );
  }

  @override
  List<Widget>? buildActions(BuildContext context) => [
        IconButton(
          onPressed: () {
            query = '';
          },
          icon: const Icon(
            Icons.clear,
            color: Colors.black26,
          ),
        )
      ];

  @override
  Widget? buildLeading(BuildContext context) => IconButton(
        onPressed: () {
          close(context, null);
        },
        icon: const Icon(
          Icons.arrow_back,
          color: Colors.black26,
        ),
      );

  @override
  Widget buildResults(BuildContext context) {
    cartViewModel = context.watch<CartViewModel>();
    return FutureBuilder<ProductsModel>(
      future: SearchServices.searchProducts(query),
      builder: (context, snapshot) {
        storedataLocally(query);
        print(getList);
        print(list);
        print('listtttttttttttttttt');
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasData) {
          if (snapshot.data!.products.isNotEmpty) {
            return ListView.separated(
                separatorBuilder: (context, index) => const Divider(),
                itemCount: snapshot.data!.products.length,
                itemBuilder: (context, index) {
                  var products = snapshot.data?.products[index];
                  percenatge = (products!.productVariants![0].price! -
                          products.productVariants![0].offerPrice!)
                      .toDouble();
                  return ChangeNotifierProvider(
                    create: (_) => ProductViewModel(),
                    child: SearchItemTile(
                      cartViewModel: cartViewModel,
                      product: products,
                      // availableQuantity:
                      //     products.productVariants![0].availableQty,
                      // metricType: products.productVariants![0].metrictype,
                      // metricvalue: products.productVariants![0].metricvalue,
                      // offerPrice: products.productVariants![0].offerPrice,
                      // price: products.productVariants![0].price,
                      // productname: products.productName,
                      // profilePic: products.imageUrl,
                      // percentage: percenatge,
                    ),
                  );
                });
          } else {
            return const Center(
                child: Text(
              'No data',
              style: TextStyle(color: tBlack),
            ));
          }
        } else {
          return const Center(
              child: Text(
            'No data',
            style: TextStyle(color: tBlack),
          ));
        }
      },
    );
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    List<String> suggestions;

    if (query == '') {
      queryList.remove('');
      suggestions = queryList;
      print('object');
      print(suggestions);
    } else {
      suggestions = [];
      suggestions = queryList.where((queryList) {
        print(suggestions);
        final result = queryList.toLowerCase();
        final input = query.toLowerCase();
        print(result);
        print(input);
        return result.contains(input);
      }).toList();
    }
    return ListView.builder(
        itemCount: suggestions.length,
        itemBuilder: (context, index) {
          return InkWell(
            onTap: () {
              query = suggestions[index];
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              child: Row(children: [
                Expanded(
                  flex: 8,
                  child: Text(
                    suggestions[index],
                    style: normalTextstyle(color: tBlack),
                  ),
                ),
                Expanded(
                    flex: 1,
                    child: Image.asset(
                      'Assets/Images/recentIcon.png',
                      height: 15,
                    ))
              ]),
            ),
          );
        });
  }
}
