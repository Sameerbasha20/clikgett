import 'package:fav_app/old/Constants/button.dart';
import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Screens/Account/edit_profile.dart';
import 'package:fav_app/old/ViewModels/Users/usersDetails.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../Constants/text.dart';

class AccountTab extends StatefulWidget {
  AccountTab({Key? key}) : super(key: key);

  @override
  State<AccountTab> createState() => _AccountTabState();
}

class _AccountTabState extends State<AccountTab> {
  UsersViewModel? usersViewModel;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((timeStamp) {
      if (usersViewModel != null) {
        usersViewModel!.getuserDetails(context: context);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (mounted) {
      usersViewModel = context.watch<UsersViewModel>();
    }
    var user = usersViewModel?.userDetailsModel?.users;
    var size = MediaQuery.of(context).size;
    return Material(
      child: Scaffold(
        body: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(
                height: 10,
              ),
              Text(
                'My Profile',
                style: normalTextstyle(color: primaryColor),
              ),
              propicWidget(user?.profilePic ?? ''),
              detailsWidget(text: user?.firstName ?? ''),
              detailsWidget(text: user?.lastName ?? ''),
              detailsWidget(text: user?.emailId ?? ''),
              detailsWidget(text: user?.mobileNumber ?? ''),
              // detailsWidget(text: user?.firstName??''),
              const SizedBox(
                height: 10,
              ),
              EditButton(
                email: user?.emailId,
                firstname: user?.firstName,
                lastname: user?.lastName,
                number: user?.mobileNumber,
                profilepic: user?.profilePic,
                // fcmToken: user?.fcmToken,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget EditButton(
      {String? firstname,
      String? lastname,
      String? number,
      String? fcmToken,
      String? email,
      String? profilepic}) {
    return Container(
      width: double.maxFinite,
      alignment: Alignment.centerRight,
      child: buttonWidget(
          onTap: () {
            Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (context) => EditProfile(
                          Lastname: lastname,
                          email: email,
                          firstname: firstname,
                          mobileNumber: number,
                          profilepic: profilepic,
                        ))).then((value) {
              setState(() {
                usersViewModel?.getuserDetails(context: context);
              });
            });
          },
          text: 'Edit',
          textColor: tWhite,
          buttonColor: primaryColor,
          borderRadius: BorderRadius.circular(5),
          width: 80,
          height: 30),
    );
  }

  Widget detailsWidget({required String text}) {
    return Container(
      width: double.maxFinite,
      decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10), color: tLightWhite),
      padding: EdgeInsets.symmetric(vertical: 20, horizontal: 20),
      margin: EdgeInsets.symmetric(
        vertical: 5,
      ),
      child: Text(
        text,
        style: normalTextstyle(color: tBlack),
      ),
    );
  }

  Widget propicWidget(String image) {
    return Container(
      margin: EdgeInsets.symmetric(vertical: 10),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(100),
        child: image != 'NA'
            ? Image.network(
                image,
                fit: BoxFit.cover,
                height: 100,
                width: 100,
              )
            : Text('No Image'),
      ),
    );
  }
}
