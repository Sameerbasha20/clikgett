import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart' hide ModalBottomSheetRoute;
import 'package:fav_app/old/Constants/button.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/textfield.dart';
import 'package:fav_app/old/Screens/Widgets/appbar_widget.dart';
import 'package:fav_app/old/ViewModels/Users/usersDetails.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:modal_bottom_sheet/modal_bottom_sheet.dart';
import 'package:provider/provider.dart';

import '../../Constants/text.dart';

class EditProfile extends StatefulWidget {
  EditProfile(
      {Key? key,
      this.firstname,
      this.Lastname,
      this.profilepic,
      this.mobileNumber,
      this.email})
      : super(key: key);
  final firstname;
  final Lastname;
  final profilepic;
  final mobileNumber;
  final email;

  @override
  State<EditProfile> createState() => _EditProfileState();
}

class _EditProfileState extends State<EditProfile> {
  TextEditingController nameController = TextEditingController();
  TextEditingController lastNameController = TextEditingController();
  TextEditingController emailController = TextEditingController();
  TextEditingController numberController = TextEditingController();
  TextEditingController dOBController = TextEditingController();

  FocusNode nameFocus = FocusNode();
  FocusNode lastNameFocus = FocusNode();
  FocusNode emailFocus = FocusNode();
  FocusNode numberFocus = FocusNode();
  FocusNode dOBFocus = FocusNode();

  List<String> name = List<String>.filled(1, '');
  List<String> lastName = List<String>.filled(1, '');
  List<String> email = List<String>.filled(1, '');
  List<String> number = List<String>.filled(1, '');
  List<String> dOB = List<String>.filled(1, '');

  final formKey = GlobalKey<FormState>();

  File? imagepicker;
  String? base64Image;
  UsersViewModel? usersViewModel;
  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    nameController.text = widget.firstname;
    lastNameController.text = widget.Lastname;
    numberController.text = widget.mobileNumber;
    emailController.text = widget.email;
    dOBController.text = '12-Jan-1994';
  }

  @override
  void dispose() {
    // TODO: implement dispose
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (mounted) {
      usersViewModel = context.watch<UsersViewModel>();
    }
    var size = MediaQuery.of(context).size;
    return Material(
      child: Scaffold(
        backgroundColor: tWhite,
        appBar: FavAppBar(context: context, title: 'Profile Details'),
        body: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Form(
              key: formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(
                    height: 10,
                  ),
                  propicWidget(),
                  const SizedBox(
                    height: 10,
                  ),
                  textFieldWidget(
                    context: context,
                    hint: 'First Name',
                    holder: name,
                    controller: nameController,
                    currentFocus: nameFocus,
                    nextFocus: lastNameFocus,
                    fillColor: tLightWhite,
                  ),
                  textFieldWidget(
                      context: context,
                      hint: 'Last Name',
                      holder: lastName,
                      controller: lastNameController,
                      currentFocus: lastNameFocus,
                      nextFocus: dOBFocus,
                      fillColor: tLightWhite),
                  textFieldWidget(
                      enabled: true,
                      isEmail: true,
                      context: context,
                      hint: 'Email',
                      holder: email,
                      controller: emailController,
                      // validation: false,
                      currentFocus: emailFocus,
                      nextFocus: numberFocus,
                      fillColor: tLightWhite),
                  NumbertextFieldWidget(
                      enabled: false,
                      context: context,
                      hint: 'Mobile Number',
                      holder: number,
                      controller: numberController,
                      currentFocus: numberFocus,
                      nextFocus: null,
                      fillColor: tLightWhite),
                  // textFieldWidget(
                  //     context: context,
                  //     hint: 'Date Of Birth (dd-mmm-yyyy)',
                  //     holder: dOB,
                  //     controller: dOBController,
                  //     currentFocus: dOBFocus,
                  //     nextFocus: null,
                  //     fillColor: tLightWhite),
                  saveButton(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget saveButton() {
    return Container(
      width: double.maxFinite,
      alignment: Alignment.centerRight,
      child: buttonWidget(
          onTap: () {
            if (ValidateAndSave()) {
              Map<String, dynamic> body = <String, dynamic>{};

              body['FirstName'] = nameController.text;
              body['LastName'] = lastNameController.text;
              body['ProfilePic'] = base64Image;
              body['EmailID'] = emailController.text;
              usersViewModel?.updateuserDetails(context: context, body: body);
              // Navigator.pop(context);
            }
          },
          text: 'Save',
          textColor: tWhite,
          buttonColor: primaryColor,
          borderRadius: BorderRadius.circular(25),
          width: 80,
          height: 30),
    );
  }

  bool ValidateAndSave() {
    final form = formKey.currentState!;
    if (!form.validate()) {
      return false;
    } else {
      form.save();

      return true;
    }
  }

  Widget detailsWidget({required String text}) {
    return Container(
      width: double.maxFinite,
      decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10), color: Colors.grey[200]),
      padding: EdgeInsets.symmetric(vertical: 10, horizontal: 20),
      margin: EdgeInsets.symmetric(
        vertical: 5,
      ),
      child: Text(
        text,
        style: normalTextstyle(color: tBlack),
      ),
    );
  }

  Widget propicWidget() {
    return Container(
      margin: EdgeInsets.symmetric(vertical: 10),
      height: 120,
      width: 120,
      // color: Colors.red,
      alignment: Alignment.center,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 120,
            decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: tWhite),
                color: Colors.red),
            child: ClipRRect(
                borderRadius: BorderRadius.circular(100),
                child: imagepicker == null
                    ? widget.profilepic == 'NA'
                        ? Container(child: Center(child: Text('data')))
                        : CircleAvatar(
                            radius: 80,
                            backgroundImage: NetworkImage(
                              widget.profilepic,
                            ),
                          )
                    : CircleAvatar(
                        radius: 80,
                        backgroundImage: FileImage(imagepicker!),
                      )),
          ),
          Align(
            alignment: Alignment.bottomRight,
            child: InkWell(
              onTap: () {
                pickImagePopup();
              },
              child: Container(
                padding: EdgeInsets.all(5),
                decoration: BoxDecoration(
                    color: primaryColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: tWhite)),
                child: const Icon(
                  Icons.camera_alt_rounded,
                  color: tWhite,
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  pickImagePopup() {
    showBarModalBottomSheet(
      expand: false,
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.25,
        child: Padding(
          padding: EdgeInsets.only(left: 60, top: 30, right: 60),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              GestureDetector(
                onTap: () {
                  pickimage(ImageSource.camera);
                  Navigator.pop(context);
                },
                child: Column(
                  children: [
                    const Icon(
                      Icons.camera,
                      color: Color(0xFF445854),
                    ),
                    Text(
                      'Camera',
                      style: normalTextstyle(fontWeight: FontWeight.w500),
                    )
                  ],
                ),
              ),
              GestureDetector(
                onTap: () {
                  pickimage(ImageSource.gallery);
                  Navigator.pop(context);
                },
                child: Column(
                  children: [
                    const Icon(
                      Icons.photo,
                      color: Color(0xFF445854),
                    ),
                    Text(
                      'Gallary',
                      style: normalTextstyle(fontWeight: FontWeight.w500),
                    )
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future pickimage(ImageSource source) async {
    final _image = await ImagePicker().getImage(
        source: source, imageQuality: 50, maxHeight: 480, maxWidth: 640);
    if (_image == null) return null;
    final image = File(_image.path);

    setState(() {
      this.imagepicker = image;
    });
    final imageBytes = this.imagepicker!.readAsBytesSync();
    base64Image = base64Encode(imageBytes);
    print(base64Image);
  }
}
