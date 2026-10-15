import 'package:fav_app/Constants/colors.dart';
import 'package:fav_app/Constants/text.dart';
import 'package:fav_app/Constants/toast.dart';
import 'package:flutter/material.dart';

class GridItemTile extends StatefulWidget {
  GridItemTile({Key? key}) : super(key: key);

  @override
  State<GridItemTile> createState() => _GridItemTileState();
}

class _GridItemTileState extends State<GridItemTile> {
  List<String> categories = ['1 Kg', '2 Kg'];
  String? selectedCategory;
  int quantity = 0;

  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    if (categories.isNotEmpty) {
      selectedCategory = categories[0];
    }
  }

  @override
  void dispose() {
    // TODO: implement dispose
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
        padding: const EdgeInsets.all(8.0),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Expanded(flex: 4, child: imageWidget()),
            Expanded(flex: 7, child: bodyWidget())
          ],
        ));
  }

  Widget bodyWidget() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 3.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Apple - Red Delicious, Premium',
            overflow: TextOverflow.ellipsis,
            style: normalTextstyle(fontSize: 14),
          ),
          const SizedBox(
            height: 10,
          ),
          RichText(
            text: TextSpan(
                text: '₹45 ',
                style: normalTextstyle(color: tBlack, fontSize: 12),
                children: [
                  TextSpan(
                      text: '60',
                      style: normalTextstyle(
                          decoration: TextDecoration.lineThrough,
                          color: tGrey,
                          fontSize: 10)),
                  TextSpan(
                      text: ' ₹15 off',
                      style: normalTextstyle(fontSize: 12, color: tGreen)),
                ]),
          ),
          const SizedBox(
            height: 10,
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              categoriesWidget(),
              quantity == 0 ? addButton() : quantityButton()
            ],
          )
        ],
      ),
    );
  }

  Widget categoriesWidget() {
    return DropdownButtonHideUnderline(
      child: Container(
        height: 20,
        padding: const EdgeInsets.symmetric(horizontal: 2),
        decoration: BoxDecoration(
            border: Border.all(color: tBlack),
            borderRadius: BorderRadius.circular(5)),
        child: DropdownButton(
            isDense: true,
            elevation: 0,
            icon: Icon(
              Icons.keyboard_arrow_down_sharp,
              size: 15,
            ),
            hint: Text('Age'),
            style: normalTextstyle(fontSize: 12, color: tBlack),
            value: selectedCategory,
            items: categories.map((String val) {
              return DropdownMenuItem<String>(
                  value: val, child: Text(val.toString()));
            }).toList(),
            onChanged: (String? value) {
              setState(() {
                selectedCategory = value;
              });
            }),
      ),
    );
  }

  Widget imageWidget() {
    return Card(
        child: Padding(
      padding: const EdgeInsets.all(8.0),
      child: Image.asset(
        'Assets/Images/apple.png',
        fit: BoxFit.fill,
        // height: MediaQuery.of(context).size.width / 6,
        // width: MediaQuery.of(context).size.width / 6,
      ),
    ));
  }

  Widget quantityButton() {
    return Container(
      height: 20,
      decoration: BoxDecoration(
          border: Border.all(
            color: tGreen,
          ),
          color: tGreen,
          borderRadius: BorderRadius.circular(3)),
      child: Row(
        children: [
          InkWell(
            onTap: () {
              setState(() {
                quantity--;
              });
            },
            child: Container(
              child: const Icon(Icons.remove, color: tWhite, size: 15),
            ),
          ),
          Container(
            height: 20,
            width: 20,
            alignment: Alignment.center,
            // padding: EdgeInsets.symmetric(horizontal: 5),
            color: tWhite,
            child: Text(
              quantity.toString(),
              style: normalTextstyle(color: tGreen, fontSize: 14),
            ),
          ),
          InkWell(
            onTap: () {
              setState(() {
                if (quantity < 10) {
                  quantity++;
                } else {
                  customToast(message: 'Limit Exceed');
                }
              });
            },
            child: Container(
              child: const Icon(
                Icons.add,
                color: tWhite,
                size: 15,
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget addButton() {
    return InkWell(
      onTap: () {
        setState(() {
          quantity = 1;
        });
      },
      child: Container(
        height: 20,
        decoration: BoxDecoration(
            border: Border.all(
              color: tGreen,
            ),
            borderRadius: BorderRadius.circular(3)),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(
              horizontal: 5,
            ),
            height: 20,
            color: tGreen,
            child: Text(
              'ADD',
              style: normalTextstyle(color: tWhite, fontSize: 14),
            ),
          ),
          const Icon(
            Icons.add,
            color: tGreen,
            size: 10,
          )
        ]),
      ),
    );
  }
}
