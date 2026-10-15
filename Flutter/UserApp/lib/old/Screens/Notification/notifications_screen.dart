import 'package:fav_app/old/Constants/colors.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/ViewModels/Home/notification.dart';
import 'package:fav_app/old/constants.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

import '../../../new/Constants/imageslist.dart';

class NotificationScreen extends StatefulWidget {
  NotificationScreen({Key? key}) : super(key: key);

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  NotificationViewModel? notificationViewModel;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((timeStamp) {
      if (notificationViewModel != null) {
        notificationViewModel!.getnotification(context: context);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (mounted) {
      notificationViewModel = context.watch<NotificationViewModel>();
    }
    return Material(
      color: tWhite,
      child: Scaffold(
        backgroundColor: tWhite,
        appBar: appBar(),
        body: Container(
          child: textBoxWidget(),
        ),
      ),
    );
  }

  Widget textBoxWidget() {
    return notificationViewModel!.isLoading == true
        ? Container(
            height: MediaQuery.of(context).size.height * .7,
            child: const Center(
              child: CircularProgressIndicator(),
            ),
          )
        : notificationViewModel!.notifications == null
            ? Center(
                child: Text(
                  'Error Loading Data',
                  style: normalTextstyle(color: tGrey),
                ),
              )
            : notificationViewModel!.notifications!.isEmpty
                ? Center(
                    child: Text(
                      'No Notifications Found',
                      style: normalTextstyle(color: tGrey),
                    ),
                  )
                : ListView.builder(
                    itemCount: notificationViewModel!.notifications!.length,
                    shrinkWrap: true,
                    itemBuilder: (BuildContext context, int index) {
                      var notifications =
                          notificationViewModel!.notifications![index];
                      return Container(
                        margin:
                            EdgeInsets.symmetric(vertical: 10, horizontal: 20),
                        padding:
                            EdgeInsets.symmetric(vertical: 20, horizontal: 20),
                        decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            color: tLightGrey),
                        // child: Text(
                        //   notifications ?? '',
                        //   style: normalTextstyle(color: tBlack),
                        // ),
                      );
                    },
                  );
  }

  PreferredSizeWidget appBar() {
    return AppBar(
      elevation: 0,
      backgroundColor: tWhite,
      centerTitle: true,
      title: Text(
        'Notification',
        style: normalTextstyle(fontFamily: Constants().segeo, fontSize: 20),
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
    );
  }
}
