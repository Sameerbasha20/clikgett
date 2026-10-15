import 'dart:io';

import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/Homepage/Homepage.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../Constants/colors.dart';
import '../../Constants/imageslist.dart';
import 'Signup.dart';

class LoginIntro extends StatelessWidget {
  const LoginIntro({super.key});

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
                alignment: Alignment.bottomCenter,
                width: 50.w,
                height: 20.h,
                child: Image(
                  image: AssetImage(logo2),
                  fit: BoxFit.contain,
                ),
              ),
              SizedBox(
                height: 6.h,
              ),

              Text(
                "Welcome to ClikGett",
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 22.sp,
                ),
              ),
              SizedBox(
                height: 1.h, // Add spacing between text
              ),
              // Text(
              //     "Get Fresh Fruits, Vegetables And More",
              //   style: GoogleFonts.poppins(
              //     fontWeight: FontWeight.w500,
              //     fontSize: 18.sp,
              //   ),
              //
              //  )
// ,
              SizedBox(
                height: 8.h, // Add some space before the button
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
            Navigator.of(context)
                .push(MaterialPageRoute(builder: (context) => const Login()));
          },
          context: context,
          borderRadius: 26,
          text: "Login",
        ),
        SizedBox(
          height: 1.5.h,
        ),
        buttonWidget(
            onTap: () {
              Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const SignUp()));
            },
            context: context,
            borderRadius: 26,
            text: "Signup",
            buttonColor: white,
            textColor: primary),
        !Platform.isIOS
            ? const SizedBox()
            : SizedBox(
                height: 2.5.h,
              ),
        !Platform.isIOS
            ? const SizedBox()
            : buttonWidget(
                onTap: () {
                  Navigator.of(context).push(MaterialPageRoute(
                      builder: (context) => const Homepage()));
                },
                context: context,
                borderRadius: 26,
                text: "Continue as guest",
                buttonColor: white,
                borderColor: Colors.transparent,
                textColor: grey70),
      ],
    );
  }
}
