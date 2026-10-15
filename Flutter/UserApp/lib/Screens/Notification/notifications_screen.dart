import 'package:fav_app/Constants/colors.dart';
import 'package:fav_app/Constants/text.dart';
import 'package:fav_app/ViewModels/Home/notification.dart';
import 'package:fav_app/constants.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

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
    WidgetsBinding.instance!.addPostFrameCallback((timeStamp) {
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
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [Center(child: textBoxWidget())],
            ),
          ),
        ),
      ),
    );
  }

  Widget textBoxWidget() {
    return notificationViewModel?.isLoading == true
        ? Container(
            height: MediaQuery.of(context).size.height * .7,
            child: const Center(
              child: CircularProgressIndicator(),
            ),
          )
        : notificationViewModel?.notificationsModel?.notifications == null
            ? Center(
                child: Text(
                  'Error Loading Data',
                  style: normalTextstyle(color: tGrey),
                ),
              )
            : ListView.builder(
                itemCount: notificationViewModel
                    ?.notificationsModel?.notifications.length,
                shrinkWrap: true,
                itemBuilder: (BuildContext context, int index) {
                  var notifications = notificationViewModel
                      ?.notificationsModel?.notifications[index];
                  return Container(
                    margin: EdgeInsets.symmetric(vertical: 10, horizontal: 20),
                    padding: EdgeInsets.symmetric(vertical: 20, horizontal: 20),
                    decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        color: tLightGrey),
                    child: Text(
                      notifications?.message ?? '',
                      style: normalTextstyle(color: tBlack),
                    ),
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
            onPressed: () {
              Navigator.pop(context);
            },
            icon: const Icon(
              Icons.arrow_back,
              color: tGrey,
            )));
  }
}
