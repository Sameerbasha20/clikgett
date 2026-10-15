// ignore_for_file: prefer_const_constructors_in_immutables, prefer_const_constructors, avoid_unnecessary_containers
import 'package:fav_app/new/Controllers/auth_controller.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/new/NewScreens/Auth/LoginIntro.dart';
import 'package:fav_app/new/NewScreens/Intro/IntroScreen1.dart';
import 'package:fav_app/new/NewScreens/Intro/IntroScreen2.dart';
import 'package:fav_app/new/NewScreens/Intro/IntroScreen3.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

class IntroScreen extends StatelessWidget {
  IntroScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AuthController controller = Get.find();
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        padding: EdgeInsets.all(20),
        child: GetBuilder<AuthController>(
          id: 'update-splash',
          initState: (_) {
            controller.startPageTransition();
          },
          dispose: (_) {
            controller.resetValues();
          },
          builder: (_) {
            return Column(
              children: [
                Expanded(flex: 1, child: Container()),
                Expanded(
                  flex: 13,
                  child: PageView(
                      controller: controller.pageController,
                      onPageChanged: (value) {
                        controller.updatePageCount(value);
                        controller.updateUi();
                      },
                      physics: BouncingScrollPhysics(),
                      children: const [
                        IntroScreen1(),
                        IntroScreen2(),
                        IntroScreen3(),
                      ]),
                ),
                Expanded(
                    flex: 3,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          flex: 2,
                          child: SmoothPageIndicator(
                            controller: controller.pageController,
                            count: 3,
                            effect: ExpandingDotsEffect(
                              activeDotColor: primary,
                              dotColor: primary.withOpacity(.45),
                              dotWidth: 3.w,
                              dotHeight: 3.w,
                            ),
                          ),
                        ),
                        Obx(
                          () => controller.pageCount.value == 2
                              ? Flexible(
                                  flex: 2,
                                  child: buttonWidget(
                                      height: 40,
                                      fontSize: 15,
                                      onTap: () {
                                        Navigator.of(context).push(
                                            MaterialPageRoute(
                                                builder: (context) =>
                                                    LoginIntro()));
                                      },
                                      context: context,
                                      text: 'Get Started'),
                                )
                              : Expanded(
                                  flex: 7,
                                  child: Container(
                                    alignment: Alignment.centerRight,
                                    child: skipButton(controller, context),
                                  )),
                        ),
                      ],
                    ))
              ],
            );
          },
        ),
      ),
    );
  }

  Widget skipButton(AuthController controller, context) {
    return TextButton(
        onPressed: () {
          // controller.resetValues();
          Navigator.of(context)
              .push(MaterialPageRoute(builder: (context) => LoginIntro()));
        },
        child: Text("Skip",
            style: customTextstyle(
              fontSize: 18.sp,
              fontWeight: FontWeight.w600,
            )));
  }
}
