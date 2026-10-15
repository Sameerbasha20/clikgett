// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:fav_app/new/Controllers/profile_controller.dart';
import 'package:fav_app/new/NewScreens/Widgets/buttonWidget.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/NewScreens/Widgets/textfieldWidget.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../../old/Models/Users/usersDetails.dart';
import '../../../old/constants.dart';

class EditProfile extends StatefulWidget {
  const EditProfile(
      {super.key, required this.users, required this.profileController});
  final ProfileController profileController;
  final Users? users;
  @override
  State<EditProfile> createState() => _EditProfileState();
}

class _EditProfileState extends State<EditProfile> {
  final editProfileKey = GlobalKey<FormState>();

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
  @override
  void initState() {
    super.initState();
    profileController = widget.profileController;
    updateUser();
  }

  late ProfileController profileController;

  updateUser() {
    var user = widget.users;
    firstName.text = user?.firstName ?? '';
    lastName.text = user?.lastName ?? '';
    mobileNumber.text = user?.mobileNumber ?? '';
    if (user?.emailId != 'NA') {
      email.text = user?.emailId ?? '';
    }
  }

  @override
  void dispose() {
    profileController.resetLoadingBtn();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          "Edit Profile",
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
      body: Form(
        key: editProfileKey,
        child: SingleChildScrollView(
          padding: EdgeInsets.all(5.w),
          physics: BouncingScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              profileTile(),
              SizedBox(
                height: 4.h,
              ),
              customText(
                text: "User Name",
                fontWeight: FontWeight.w600,
              ),
              SizedBox(
                height: 1.h,
              ),
              textFieldWidget(
                inputFormatters: [
                  LengthLimitingTextInputFormatter(25),   // Restrict length to 7
                ],
                context: context,
                prefixIcon: ImageIcon(
                  AssetImage(userIcon),
                  color: black,
                ),
                hint: "Userddd Name",
                // hintStyle:

                //     customTextstyle(color: ordersPrimaryColor.withOpacity(.6)),
                hinttext: 'User Name',
                textColor: ordersPrimaryColor.withOpacity(.6),
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
              // SizedBox(
              //   height: 3.h,
              // ),
              // customText(
              //   text: "Last Name",
              //   fontWeight: FontWeight.w600,
              // ),
              SizedBox(
                height: 1.h,
              ),
              // textFieldWidget(
              //   context: context,
              //   prefixIcon: ImageIcon(
              //     AssetImage(userIcon),
              //     color: black,
              //   ),
              //   hint: "Last Name",
              //   textColor: ordersPrimaryColor.withOpacity(.6),
              //   hinttext: 'Last Name',
              //   controller: lastName,
              //   holder: _lastName,
              //   onChanged: (p0) {
              //     if (p0 == ' ') {
              //       lastName.clear();
              //     }
              //   },
              //   textCapitalization: TextCapitalization.words,
              //   currentFocus: lastNameFocus,
              //   nextFocus: mobileNumberFocus,
              //   fillColor: bg1,
              // ),
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
                hint: "Mobile Number",
                hinttext: 'Mobile Number',
                textColor: ordersPrimaryColor.withOpacity(.6),
                controller: mobileNumber,
                holder: _mobileNumber,
                readOnly: true,
                currentFocus: mobileNumberFocus,
                nextFocus: emailFocus,
                validation: false,
                isPhoneNumber: true,
                validationLength: 10,
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
                  hint: "Email(Optional)",
                  hinttext: 'Email(Optional)',
                  controller: email,
                  keyboardType: TextInputType.emailAddress,
                  validation: false,
                  textColor: ordersPrimaryColor.withOpacity(.6),
                  onChanged: (p0) {
                    if (p0 == ' ') {
                      email.clear();
                    }
                  },
                  holder: _email,
                  currentFocus: emailFocus,
                  nextFocus: null,
                  fillColor: bg1,
                  isEmail: true),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomAppBar(
        padding: EdgeInsets.fromLTRB(5.w, 0, 5.w, 2.h),
        child: Obx(
          () => Stack(
            alignment: Alignment.center,
            children: [
              profileController.isLoading.isTrue
                  ? CircularProgressIndicator.adaptive()
                  : buttonWidget(
                      onTap: () {
                        if (editProfileKey.currentState!.validate()) {
                          if (email.text.isEmpty ||
                              Constants().regex.hasMatch(email.text)) {
                            Map<String, dynamic> body = <String, dynamic>{};

                            body['FirstName'] = firstName.text;
                            body['LastName'] = lastName.text;

                            if (email.text.isNotEmpty) {
                              body['EmailID'] = email.text;
                            }

                            body['MobileNumber'] = mobileNumber.text;

                            profileController.updateUser(
                                context: context,
                                body: body,
                                isUpdateUser: true);
                          } else {
                            customToast(message: 'Invalid Email Id');
                          }
                        }
                      },
                      context: context,
                  borderRadius: 25,
                      text: "Save"),
            ],
          ),
        ),
      ),
    );
  }

  Widget profileTile() {
    return Container(
      width: 90.w,
      height: 13.h,
      alignment: Alignment.center,
      child: CircleAvatar(
        radius: 6.5.h,
        backgroundColor: green.withOpacity(0.8),
        child:
        customText(
          text: '${widget.users?.firstName[0]}${widget.users?.lastName[0]}',
          color: white,
          fontSize: 28.sp,
        ),
      ),
    );
  }
}
