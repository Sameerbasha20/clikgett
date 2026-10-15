import 'package:fav_app/Constants/colors.dart';
import 'package:fav_app/Screens/Widgets/grid_item_tile.dart';
import 'package:fav_app/ViewModels/Categories/Categories_view_model.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';

import '../../Constants/text.dart';
import 'expanded_categories_listtile.dart';

class CategoryTab extends StatefulWidget {
  CategoryTab({Key? key}) : super(key: key);

  @override
  State<CategoryTab> createState() => _CategoryTabState();
}

class _CategoryTabState extends State<CategoryTab> {
  CategoriesViewModel? categoriesViewModel;

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (mounted) {
      categoriesViewModel = context.watch<CategoriesViewModel>();
    }
    var size = MediaQuery.of(context).size;
    return Material(
        child: categoriesViewModel!.showCategoriesExpandedList == true
            ? ExpandedCategoriesList()
            : unExpandedCategoriesScreen());
  }

  Widget unExpandedCategoriesScreen() {
    return SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          categoriesListWidget(),
          subCategoriesListWidget(),
          itemsList(),
        ],
      ),
    );
  }

  Widget categoriesListWidget() {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: lGColor),
      ),
      height: 50,
      child: ListView.builder(
          physics: BouncingScrollPhysics(),
          scrollDirection: Axis.horizontal,
          itemCount: categoriesViewModel!.catgoriesList.length,
          itemBuilder: (context, index) {
            return InkWell(
              onTap: () {
                categoriesViewModel!.setSelectedCategory(index);
                categoriesViewModel!.setSelectedSubCategory(0);
              },
              child: Container(
                decoration: BoxDecoration(
                    color: categoriesViewModel!.selectedCategory == index
                        ? tWhite
                        : primaryColor,
                    border: Border.all(
                        color: categoriesViewModel!.selectedCategory == index
                            ? primaryColor
                            : tWhite),
                    borderRadius: BorderRadius.circular(10)),
                alignment: Alignment.center,
                margin: EdgeInsets.symmetric(horizontal: 5),
                padding: EdgeInsets.symmetric(horizontal: 10),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  SvgPicture.asset(
                    'Assets/Images/categories/${categoriesViewModel!.catgoriesList[index]['icon']}.svg',
                    height: 15,
                    color: categoriesViewModel!.selectedCategory == index
                        ? primaryColor
                        : tWhite,
                  ),
                  const SizedBox(
                    width: 3,
                  ),
                  Text(
                    categoriesViewModel!.catgoriesList[index]['CategoryName'],
                    style: normalTextstyle(
                      color: categoriesViewModel!.selectedCategory == index
                          ? primaryColor
                          : tWhite,
                    ),
                  )
                ]),
              ),
            );
          }),
    );
  }

  Widget subCategoriesListWidget() {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 10),
      decoration: const BoxDecoration(color: tWhite),
      height: 50,
      child: ListView.builder(
          physics: BouncingScrollPhysics(),
          scrollDirection: Axis.horizontal,
          itemCount: categoriesViewModel!
              .catgoriesList[categoriesViewModel!.selectedCategory]
                  ['SubCategories']
              .length,
          itemBuilder: (context, index) {
            return InkWell(
              onTap: () {
                categoriesViewModel!.setSelectedSubCategory(index);
              },
              child: Container(
                decoration: BoxDecoration(
                    color: categoriesViewModel!.selectedSubCategory == index
                        ? tWhite
                        : tGreen,
                    border: Border.all(
                        color: categoriesViewModel!.selectedSubCategory == index
                            ? tGreen
                            : tWhite),
                    borderRadius: BorderRadius.circular(10)),
                alignment: Alignment.center,
                margin: EdgeInsets.symmetric(horizontal: 5),
                padding: EdgeInsets.symmetric(horizontal: 10),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Text(
                    categoriesViewModel!.catgoriesList[categoriesViewModel!
                        .selectedCategory]['SubCategories'][index]['Name'],
                    style: normalTextstyle(
                      color: categoriesViewModel!.selectedSubCategory == index
                          ? tGreen
                          : tWhite,
                    ),
                  )
                ]),
              ),
            );
          }),
    );
  }

  Widget itemsList() {
    return Container(
      child: GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: EdgeInsets.all(0),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              childAspectRatio: 1.5,
              crossAxisCount: 2,
              crossAxisSpacing: 0.0,
              mainAxisSpacing: 0.0),
          itemCount: 10,
          itemBuilder: (BuildContext ctx, index) {
            return GridTile(
                child: Container(
                    decoration: BoxDecoration(
                        border: Border.all(color: Colors.black12, width: 0.5)),
                    child: GridItemTile()));
          }),
    );
  }

  Widget ExpandedCategoriesList() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10.0),
      child: ListView.separated(
          itemBuilder: (context, index) {
            return ExpandedCategoriesListTile(
              categoryIndex: index,
            );
          },
          separatorBuilder: (context, index) {
            return const Divider();
          },
          itemCount: categoriesViewModel!.catgoriesList.length),
    );
  }
}
