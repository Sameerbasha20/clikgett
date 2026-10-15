import 'package:cached_network_image/cached_network_image.dart';
// import 'package:carousel_slider/carousel_slider.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Screens/Widgets/vertical_item_tile.dart';
import 'package:fav_app/old/ViewModels/Home/cart_view_model.dart';
import 'package:fav_app/old/ViewModels/Home/home_view_model.dart';
import 'package:fav_app/old/ViewModels/Home/product_view_model.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';

import '../../Constants/text.dart';

class HomeTab extends StatefulWidget {
  HomeTab({Key? key}) : super(key: key);

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  List<String> categoriesList = ['Fruits', 'Vegetables', 'Cereals', 'Grains'];
  List<String> categoriesIconsList = [
    'fruits',
    'vegtables',
    'cereals',
    'grains'
  ];

  HomeViewModel? homeViewModel;
  CartViewModel? cartViewModel;

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((timeStamp) {
      if (cartViewModel != null) {
        cartViewModel!.getCart(context: context);
      }
      if (homeViewModel != null) {
        homeViewModel!.getHome(context: context);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (mounted) {
      homeViewModel = context.watch<HomeViewModel>();
      cartViewModel = context.watch<CartViewModel>();
    }
    var size = MediaQuery.of(context).size;
    return Material(
      child: homeViewModel!.isLoading == true
          ? const Center(
              child: CircularProgressIndicator(color: primaryColor),
            )
          : homeViewModel!.homeData == null
              ? Center(
                  child: Text(
                    'Error Loading Data',
                    style: normalTextstyle(color: tGrey),
                  ),
                )
              : SingleChildScrollView(
                  // physics: NeverScrollableScrollPhysics(),
                  child: Container(
                    // padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // categoriesListWidget(),
                        bannerWidget(),
                        bestSellingHeadingWidget(),
                        bestSellingsWidget(),
                        bottomCategoriesList()
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget bottomCategoriesList() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      color: tWhite,
      child: GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        childAspectRatio: 1.8,
        children: [
          bigCategoriesButton(
              title: 'Fresh & Organic', subtitle: 'Fruits', image: 'fruits'),
          bigCategoriesButton(
              title: 'Fresh & Organic',
              subtitle: 'Vegtables',
              image: 'vegtables'),
          bigCategoriesButton(
              title: 'The Best Quality', subtitle: 'Cereals', image: 'cereals'),
          bigCategoriesButton(
              title: 'The Best Quality', subtitle: 'Grains', image: 'grains'),
        ],
      ),
    );
  }

  Widget bigCategoriesButton({String? title, String? subtitle, String? image}) {
    return InkWell(
      onTap: () {},
      child: Card(
        child: Container(
          // decoration: BoxDecoration(
          //     border: Border.all(color: tGrey),
          //     borderRadius: BorderRadius.circular(5)),
          child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                SvgPicture.asset('Assets/Images/categories/$image.svg'),
                RichText(
                    text: TextSpan(
                        text: '$title\n',
                        style: normalTextstyle(fontSize: 13),
                        children: [
                      TextSpan(
                          text: subtitle,
                          style: normalTextstyle(color: tGreen, fontSize: 13))
                    ]))
              ]),
        ),
      ),
    );
  }

  Widget categoriesListWidget() {
    return homeViewModel!.homeData!.specialCategories == null
        ? Container()
        : Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: lGColor),
            ),
            height: 50,
            child: ListView.builder(
                physics: const BouncingScrollPhysics(),
                scrollDirection: Axis.horizontal,
                itemCount: homeViewModel!.homeData!.specialCategories!.length,
                itemBuilder: (context, index) {
                  return Container(
                    decoration: BoxDecoration(
                        color: primaryColor,
                        border: Border.all(color: tWhite),
                        borderRadius: BorderRadius.circular(10)),
                    alignment: Alignment.center,
                    margin: const EdgeInsets.symmetric(horizontal: 5),
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      // SvgPicture.asset(
                      //   'Assets/Images/categories/${categoriesIconsList[index]}.svg',
                      //   height: 15,
                      //   color: tWhite,
                      // ),
                      // CachedNetworkImage(
                      //   imageUrl: homeViewModel!
                      //       .homeData!.categories![index].imageUrl!,
                      //   placeholder: (context, value) {
                      //     return Container(
                      //       height: 15,
                      //       width: 15,
                      //     );
                      //   },
                      //   height: 15,
                      // ),
                      // const SizedBox(
                      //   width: 3,
                      // ),
                      Text(
                        homeViewModel!.homeData!.specialCategories![index]
                                .categoryName ??
                            "",
                        style: normalTextstyle(color: tWhite),
                      )
                    ]),
                  );
                }),
          );
  }

  Widget bannerWidget() {
    return homeViewModel!.homeData!.banners!.isEmpty
        ? Container()
        : Container(
            height: MediaQuery.of(context).size.height / 4.5,
            width: double.maxFinite,
            child:Container() ); 
            // CarouselSlider(
            //   items: homeViewModel!.homeData!.banners!.map((banner) {
            //     return CachedNetworkImage(imageUrl: banner.imageUrl!);
            //     // homeViewModel!.homeData!.banners![index].imageUrl!);
            //   }).toList(),
            //   options: CarouselOptions(
            //       aspectRatio: 1.5,
            //       viewportFraction: 1,
            //       // enlargeCenterPage: true,
            //       scrollDirection: Axis.horizontal,
            //       autoPlay: homeViewModel!.homeData!.banners!.length == 1
            //           ? false
            //           : true,
            //       onPageChanged: (index, reason) {
            //         // setState(() {
            //         //   bannerCurrentINdex = index;
            //         // });
            //       }),
            // ));
  }

  Widget bestSellingHeadingWidget() {
    return Container(
      margin: const EdgeInsets.only(top: 20),
      child: Row(
        children: [
          const Expanded(
            child: Divider(
              color: tGreen,
              thickness: 1,
              indent: 10,
              endIndent: 10,
            ),
          ),
          Text(
            'Best Selling Items',
            style: normalTextstyle(fontSize: 20),
          ),
          const Expanded(
            child: Divider(
              color: tGreen,
              thickness: 1,
              indent: 10,
              endIndent: 10,
            ),
          ),
        ],
      ),
    );
  }

  Widget bestSellingsWidget() {
    return homeViewModel!.homeData!.bestItems!.isEmpty
        ? Container()
        : Container(
            height: MediaQuery.of(context).size.height / 3.5,
            width: double.maxFinite,
            alignment: Alignment.center,
            child: ListView.builder(
                physics: const BouncingScrollPhysics(),
                scrollDirection: Axis.horizontal,
                itemCount: homeViewModel!.homeData!.bestItems!.length,
                // itemCount: 1,
                itemBuilder: (context, index) {
                  // return VerticalItemTile(
                  //   product: homeViewModel!.homeData!.bestItems![index],
                  // );

                  return ChangeNotifierProvider<ProductViewModel>(
                    create: (_) => ProductViewModel(),
                    child: VerticalItemTile(
                      product: homeViewModel!.homeData!.bestItems![index],
                      cartViewModel: cartViewModel,
                    ),
                  );

                  // return ChangeNotifierProxyProvider(
                  //     create: (_) => ProductViewModel(),
                  //     update: (context, CartViewModel? cartViewModel, productViewModel) => );
                }),
          );
  }
}
