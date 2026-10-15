import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:fav_app/new/NewScreens/location/enteraddress.dart';
import 'package:fav_app/new/NewScreens/location/locationaccess.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../Constants/colors.dart';
import '../../Constants/imageslist.dart';

class GrantLocation extends StatelessWidget {
  const GrantLocation({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bg,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment:
                MainAxisAlignment.center, // Centers content vertically
            crossAxisAlignment:
                CrossAxisAlignment.center, // Centers content horizontally
            children: [
              Container(
                child: Image(
                  height: 30.h,
                  image: AssetImage(grantmap),
                  fit: BoxFit.contain,
                ),
              ),
              SizedBox(
                height: 6.h,
              ),
              customText(
                text: "Grant Current Location",
                color: tblack1c,
                fontSize: 19.sp,
                fontWeight: FontWeight.w600,
              ),
              SizedBox(
                height: 1.5.h, // Add spacing between text
              ),
              Padding(
                padding: const EdgeInsets.only(left: 0, right: 0),
                child: Text(
                  "This let us show nearby restaurants\n stores you can order from",
                  textAlign: TextAlign.center,
                  style: GoogleFonts.montserrat(
                    textStyle: TextStyle(
                      fontSize: 16.sp, // Use responsive size here
                      fontWeight: FontWeight.w500,
                      color: const Color(0xff676a6c),
                    ),
                  ),
                ),
              ),
              SizedBox(
                height: 6.h, // Add some space before the button
              ),
              buttons(context)
            ],
          ),
        ),
      ),
    );
  }

  Widget buttons(context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        buttonWidget(
          onTap: () {
            Navigator.of(context).push(MaterialPageRoute(
                builder: (context) =>  LocationPickerPage()));
          },
          context: context,
          borderRadius: 26,
          text: "Use Current Location",
        ),
        SizedBox(
          height: 2.h,
        ),
        // buttonWidget(
        //     onTap: () {
        //       Navigator.of(context).push(MaterialPageRoute(
        //           builder: (context) => const Confirmlocation()));
        //     },
        //     context: context,
        //     borderRadius: 50,
        //     text: "Enter Manually",
        //     buttonColor: white,
        //     textColor: primary),
      ],
    );
  }
}
