import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/NewModel/FAQModel.dart';
import 'package:flutter/material.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../Constants/imageslist.dart';

class TermsAndConditions extends StatefulWidget {
  TermsAndConditions({Key? key}) : super(key: key);

  @override
  State<TermsAndConditions> createState() => _TermsAndConditionsState();
}

class _TermsAndConditionsState extends State<TermsAndConditions> {
  bool isExapnds = false;
  List<FAQModel> list = [
    (FAQModel(
        heading: "Personal Information",
        description:
            'Services of the APP would be available to only select geographies in India. Persons who are "incompetent to contract" within the meaning of the Indian Contract Act, 1872 including un-discharged insolvents etc. are noteligible to use the APP. ')),
    (FAQModel(
        heading: "Services Overview",
        description:
            'Services of the APP would be available to only select geographies in India. Persons who are "incompetent to contract" within the meaning of the Indian Contract Act, 1872 including un-discharged insolvents etc. are noteligible to use the APP. ')),
    (FAQModel(
        heading: "Eligibility",
        description:
            'Services of the APP would be available to only select geographies in India. Persons who are "incompetent to contract" within the meaning of the Indian Contract Act, 1872 including un-discharged insolvents etc. are noteligible to use the APP. ')),
    (FAQModel(
        heading: "License & Site Obligations",
        description:
            'Services of the APP would be available to only select geographies in India. Persons who are "incompetent to contract" within the meaning of the Indian Contract Act, 1872 including un-discharged insolvents etc. are noteligible to use the APP. ')),
    (FAQModel(
        heading: "Access account & Registration",
        description:
            'Services of the APP would be available to only select geographies in India. Persons who are "incompetent to contract" within the meaning of the Indian Contract Act, 1872 including un-discharged insolvents etc. are noteligible to use the APP. ')),
    (FAQModel(
        heading: "Return & Refunds",
        description:
            'Services of the APP would be available to only select geographies in India. Persons who are "incompetent to contract" within the meaning of the Indian Contract Act, 1872 including un-discharged insolvents etc. are noteligible to use the APP. ')),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          "Terms & Conditions",
          style: customTextstyle(fontWeight: FontWeight.w600, fontSize: 20),
        ),
        leading: IconButton(
            padding: EdgeInsets.zero,
            onPressed: () {
              Navigator.of(context).pop();
            },
            icon: Image.asset(
              backbutton,
              height: 5.h,
              width: 10.w,
              fit: BoxFit.cover,
            )),
      ),
      backgroundColor: bg,
      body: Container(
        padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 1.h),
        child: ListView.builder(
          itemCount: list.length,
          shrinkWrap: true,
          physics: const BouncingScrollPhysics(),
          itemBuilder: (context, index) {
            return listTile(details: list[index]);
          },
        ),
      ),
    );
  }

  Widget listTile({required FAQModel details}) {
    return Container(
        // margin: EdgeInsets.zero,
        decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(1.h), color: white),
        margin: EdgeInsets.symmetric(vertical: 0.2.h),
        child: Theme(
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
          child: ExpansionTile(
            tilePadding: EdgeInsets.zero,
            childrenPadding: EdgeInsets.only(bottom: 1.h),
            iconColor: black,
            collapsedIconColor: black,
            // backgroundColor: tLightGrey,
            title: Column(
              children: [
                ListTile(
                  title: Text(
                    details.heading,
                    style: customTextstyle(fontSize: 17.sp, color: tColor),
                  ),
                )
              ],
            ),
            children: [
              Container(
                  padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 2.h),
                  decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(1.h), color: bg1),
                  child: Text(
                    details.description,
                    style: customTextstyle(
                        fontSize: 16.sp,
                        color: ordersPrimaryColor.withOpacity(.45)),
                  ))
            ],
          ),
        ));
  }
}
