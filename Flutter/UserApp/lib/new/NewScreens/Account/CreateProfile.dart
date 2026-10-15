// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Controllers/profile_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/Homepage.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/NewScreens/Widgets/textfieldWidget.dart';
import 'package:flutter/material.dart';
import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:get/get.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class CreateProfile extends StatefulWidget {
  const CreateProfile({super.key, required this.number});
  final String number;

  @override
  State<CreateProfile> createState() => _CreateProfileState();
}

class _CreateProfileState extends State<CreateProfile> {
  final createProfileKey = GlobalKey<FormState>();

  TextEditingController firstName = TextEditingController();
  FocusNode firstNameFocus = FocusNode();
  final List<String> _firstName = List.filled(1, '');

  TextEditingController lastName = TextEditingController();
  FocusNode lastNameFocus = FocusNode();
  final List<String> _lastName = List.filled(1, '');

  TextEditingController mobileNumber = TextEditingController();
  FocusNode mobileNumberFocus = FocusNode();
  final List<String> _mobileNumber = List.filled(1, '');

  TextEditingController email = TextEditingController();
  FocusNode emailFocus = FocusNode();
  final List<String> _email = List.filled(1, '');

  TextEditingController referralCode = TextEditingController();
  FocusNode referralCodeFocus = FocusNode();
  final List<String> _referralCode = List.filled(1, '');
  final ProfileController profileController = Get.find();
  @override
  void initState() {
    super.initState();
    mobileNumber.text = widget.number;
  }

  @override
  void dispose() {
    profileController.resetLoadingBtn();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        Navigator.of(context)
            .push(MaterialPageRoute(builder: (context) => Homepage()));
        return false;
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            "Create Profile",
            style: customTextstyle(fontWeight: FontWeight.w600, fontSize: 20),
          ),
          leading: IconButton(
              padding: EdgeInsets.zero,
              onPressed: () {
                Navigator.of(context)
                    .push(MaterialPageRoute(builder: (context) => Homepage()));
              },
              icon: Image.asset(
                backbutton,
                height: 5.h,
                width: 10.w,
                fit: BoxFit.cover,
              )),
        ),
        backgroundColor: bg,
        body: Form(
          key: createProfileKey,
          child: SingleChildScrollView(
            padding: EdgeInsets.all(5.w),
            physics: BouncingScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                customText(
                  text: "First Name",
                  fontWeight: FontWeight.w600,
                ),
                SizedBox(
                  height: 1.h,
                ),
                textFieldWidget(
                  context: context,
                  prefixIcon: ImageIcon(
                    AssetImage(userIcon),
                    color: black,
                  ),
                  textColor: black.withOpacity(0.50),
                  hint: "First Name",
                  hinttext: 'Enter First Name',
                  controller: firstName,
                  onChanged: (p0) {
                    if (p0 == ' ') {
                      firstName.clear();
                    }
                  },
                  holder: _firstName,
                  textCapitalization: TextCapitalization.words,
                  currentFocus: firstNameFocus,
                  nextFocus: lastNameFocus,
                  fillColor: bg1,
                ),
                SizedBox(
                  height: 3.h,
                ),
                customText(
                  text: "Last Name",
                  fontWeight: FontWeight.w600,
                ),
                SizedBox(
                  height: 1.h,
                ),
                textFieldWidget(
                  context: context,
                  prefixIcon: ImageIcon(
                    AssetImage(userIcon),
                    color: black,
                  ),
                  textColor: black.withOpacity(0.50),
                  hint: "Last Name",
                  hinttext: 'Enter Last Name',
                  controller: lastName,
                  holder: _lastName,
                  currentFocus: lastNameFocus,
                  textCapitalization: TextCapitalization.words,
                  nextFocus: mobileNumberFocus,
                  fillColor: bg1,
                  onChanged: (p0) {
                    if (p0 == ' ') {
                      lastName.clear();
                    }
                  },
                ),
                SizedBox(
                  height: 3.h,
                ),
                customText(
                  text: "Mobile Number",
                  fontWeight: FontWeight.w600,
                ),
                SizedBox(
                  height: 1.h,
                ),
                NumbertextFieldWidget(
                  context: context,
                  prefixIcon: ImageIcon(
                    AssetImage(phoneIcon),
                    color: black,
                  ),
                  textColor: black.withOpacity(0.50),
                  hint: "Mobile Number",
                  hinttext: 'Enter Mobile Number',
                  controller: mobileNumber,
                  holder: _mobileNumber,
                  readOnly: true,
                  currentFocus: mobileNumberFocus,
                  nextFocus: emailFocus,
                  isPhoneNumber: true,
                  validationLength: 10,
                  onChanged: (p0) {
                    if (p0.isNotEmpty) {
                      if (int.parse(p0) <= 5) {
                        mobileNumber.clear();
                        customToast(
                            message: 'Mobile Number Cannot Be Start With $p0');
                      }
                    }
                  },
                  fillColor: bg1,
                ),
                SizedBox(
                  height: 3.h,
                ),
                customText(
                  text: "Email",
                  fontWeight: FontWeight.w600,
                ),
                SizedBox(
                  height: 1.h,
                ),
                textFieldWidget(
                    context: context,
                    prefixIcon: ImageIcon(
                      AssetImage(mailIcon),
                      color: black,
                    ),
                    textColor: black.withOpacity(0.50),
                    hint: "Email",
                    hinttext: 'Enter Your Email (Optional)',
                    controller: email,
                    holder: _email,
                    currentFocus: emailFocus,
                    validation: false,
                    nextFocus: null,
                    fillColor: bg1,
                    isEmail: true),
                SizedBox(
                  height: 3.h,
                ),
                customText(
                  text: "Referral Code",
                ),
                SizedBox(
                  height: 1.h,
                ),
                textFieldWidget(
                  context: context,
                  prefixIcon: ImageIcon(
                    AssetImage(referralIcon),
                    color: black,
                  ),
                  textColor: black.withOpacity(0.50),
                  hint: "Referral Code",
                  hinttext: 'Enter Referral Code',
                  controller: referralCode,
                  holder: _referralCode,
                  validation: false,
                  currentFocus: referralCodeFocus,
                  nextFocus: null,
                  fillColor: bg1,
                ),
                SizedBox(
                  height: 5.h,
                ),
                Obx(
                  () => Stack(
                    alignment: Alignment.center,
                    children: [
                      profileController.isLoading.isTrue
                          ? Center(child: CircularProgressIndicator.adaptive())
                          : buttonWidget(
                              onTap: () {
                                validate();
                              },
                              context: context,
                              text: "Create Account"),
                    ],
                  ),
                )
              ],
            ),
          ),
        ),
        // bottomNavigationBar: BottomAppBar(
        //   padding: EdgeInsets.all(5.w),
        //   child: ,
        // ),
      ),
    );
  }

  validate() {
    if (createProfileKey.currentState!.validate()) {
      if (email.text.isEmpty || Constants().regex.hasMatch(email.text)) {
        Map<String, dynamic> body = <String, dynamic>{};

        body['FirstName'] = firstName.text;
        body['LastName'] = lastName.text;
        if (referralCode.text.isNotEmpty) {
          body['ReferredByCode'] = referralCode.text;
        }

        if (email.text.isNotEmpty) {
          body['EmailID'] = email.text;
        }

        body['MobileNumber'] = mobileNumber.text;

        profileController.updateUser(context: context, body: body);
      } else {
        customToast(message: 'Inavlid Email-ID');
      }
    }
  }
}
