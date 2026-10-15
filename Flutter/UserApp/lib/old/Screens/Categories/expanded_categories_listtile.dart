import 'package:cached_network_image/cached_network_image.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/ViewModels/Categories/categories_view_model.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class ExpandedCategoriesListTile extends StatefulWidget {
  int categoryIndex;
  ExpandedCategoriesListTile({Key? key, required this.categoryIndex})
      : super(key: key);

  @override
  State<ExpandedCategoriesListTile> createState() =>
      _ExpandedCategoriesListTileState(categoryIndex: categoryIndex);
}

class _ExpandedCategoriesListTileState
    extends State<ExpandedCategoriesListTile> {
  CategoriesViewModel? categoriesViewModel;
  int categoryIndex;

  ValueNotifier<bool> isExpanded = ValueNotifier(false);

  _ExpandedCategoriesListTileState({required this.categoryIndex});

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
    return Container(
      padding: EdgeInsets.symmetric(vertical: 5),
      child: ValueListenableBuilder(
        valueListenable: isExpanded,
        builder: (BuildContext context, dynamic value, Widget? child) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              header(),
              Visibility(
                visible: isExpanded.value,
                child: Divider(),
              ),
              Visibility(
                visible: isExpanded.value,
                child: body(),
              )
            ],
          );
        },
      ),
    );
  }

  Widget body() {
    return Container(
      padding: const EdgeInsets.only(left: 50),
      child: ListView.separated(
          shrinkWrap: true,
          physics: NeverScrollableScrollPhysics(),
          itemBuilder: (context, subCategoryIndex) {
            return InkWell(
              onTap: () {
                categoriesViewModel!.setSelectedCategory(categoryIndex);
                categoriesViewModel!
                    .setSelectedSubCategory(subCategoryIndex, context);
                categoriesViewModel!.setShowCategoriesExpandedList(false);
              },
              child: Container(
                padding: EdgeInsets.symmetric(vertical: 5),
                child: Text(
                  '',
                  style: normalTextstyle(color: tBlack, fontSize: 20),
                ),
              ),
            );
          },
          separatorBuilder: (context, index) {
            return const Divider();
          },
          itemCount: 1),
    );
  }

  Widget header() {
    return InkWell(
      onTap: () {
        isExpanded.value = !isExpanded.value;
        // debugPrint("${}");
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Row(children: [
          Expanded(
            flex: 1,
            child: CachedNetworkImage(
              imageUrl:
                  categoriesViewModel!.catgoriesList[categoryIndex].imageUrl!,
              height: 20,
            ),
          ),
          Expanded(
            flex: 8,
            child: Text(
              categoriesViewModel!.catgoriesList[categoryIndex].categoryName!,
              style: normalTextstyle(fontSize: 20),
            ),
          ),
          Expanded(
              flex: 1,
              child: Icon(
                isExpanded.value == true
                    ? Icons.keyboard_arrow_down
                    : Icons.keyboard_arrow_right,
                color: primaryColor,
              )),
        ]),
      ),
    );
  }
}
