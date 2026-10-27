// ignore_for_file: prefer_const_constructors
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/empty_data.dart';
import 'package:fav_app/new/Constants/static_loader.dart';
import 'package:fav_app/new/Constants/textStyles.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:fav_app/old/Models/Home/notification_model.dart' as notif;
import '../Constants/imageslist.dart';
import '../Controllers/notification_controller.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/Orders/OrderDetails.dart';

class Notifications extends StatefulWidget {
  const Notifications({super.key});

  @override
  State<Notifications> createState() => _NotificationsState();
}

class _NotificationsState extends State<Notifications> {
  DateTime today = DateTime.now();

  @override
  initState() {
    super.initState();
    notificationController.getnotification(context: context);
  }

  final NotificationController notificationController = Get.find();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        surfaceTintColor: Colors.white,
        title: Text(
          "Notifications",
          style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w600),
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
      body: Obx(
        () => notificationController.isLoading.isTrue
            ? CustomLoader()
            : notificationController.notifications.isEmpty
                ? EmptyDataWidget(message: 'No Notifications Found')
                : ListView.builder(
                    padding: EdgeInsets.all(4.w),
                    itemCount: notificationController.notifications.length,
                    physics: BouncingScrollPhysics(),
                    itemBuilder: (context, index) {
                      var notification =
                          notificationController.notifications[index];
                      return listTile(notification, index);
                    },
                  ),
      ),
    );
  }

//   Widget listTile(notif.Notification notification, index) {
//     return InkWell(
//       child: Card(
//         elevation: 0,
//         child: Container(
//           padding: EdgeInsets.all(2.h),
//           decoration: BoxDecoration(
//               color: bg1, borderRadius: BorderRadius.circular(1.h)),
//           child: Row(
//             crossAxisAlignment: CrossAxisAlignment.center,
//             children: [
//               Padding(
//                 padding: EdgeInsets.only(right: 3.w),
//                 child: CircleAvatar(
//                   radius: 20,
//                   backgroundColor: primary,
//                   child: Text(
//                     notification.title != null && notification.title!.isNotEmpty
//                         ? notification.title![0].toUpperCase()
//                         : '', // Check if title is not null and not empty
//                     style: GoogleFonts.poppins(
//                       color: white,
//                       fontSize: 20,
//                       fontWeight: FontWeight.w600
//                     ),
//                   ),
//                 ),
//               )
// ,
//               Expanded(
//                 flex: 8,
//                 child: Column(
//                   crossAxisAlignment: CrossAxisAlignment.start,
//                   children: [
//                     Row(
//                       mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                       children: [
//                         customText(
//                           text: notification.title ?? '',
//                           fontWeight: FontWeight.w600,
//                           color: tColor5,
//                           fontSize: 18.sp,
//                         ),
//                         DateFormat("dd/MM/yy").format(today) ==
//                             DateFormat("dd/MM/yy").format(notification.createdAt!)
//                             ? customText(
//                           text: DateFormat("h:mm:ss a")
//                               .format(notification.createdAt!),
//                           fontSize: 14.sp,
//                           color: black.withOpacity(0.50),
//                         )
//                             : (today.difference(notification.createdAt!).inDays == 1
//                             ? customText(
//                           text: "Yesterday",
//                           fontSize: 14.sp,
//                           color: black.withOpacity(0.50),
//                         )
//                             : customText(
//                           text: DateFormat("dd/MM/yy")
//                               .format(notification.createdAt!),
//                           fontSize: 14.sp,
//                           color: black.withOpacity(0.50),
//                         )),
//                       ],
//                     ),
//                     SizedBox(
//                       height: 0.2.h,
//                     ),
//                     customText(
//                       text: notification.message.toString(),
//                       fontSize: 14.sp,
//                       fontWeight: FontWeight.w400,
//                     ),
//                     notification.isRead == 0
//                         ? Container()
//                         : Container(
//                       alignment: Alignment.centerRight,
//                       child: CircleAvatar(
//                         radius: 1.w,
//                         backgroundColor: green,
//                       ),
//                     )
//                   ],
//                 ),
//               )
//             ],
//           ),
//         ),
//       ),
//       onTap: () {
//         Map<String, dynamic> body = <String, dynamic>{};
//         body['IsRead'] = 0;

//         notificationController.readNotifications(
//             context: context, body: body, uid: notification.notificationID);
//       },
//     );
//   }

  Widget listTile(notif.Notification notification, int index) {
    bool isUnread = notification.isRead == 0;
    DateTime createdAt = notification.createdAt!;
    String formattedTime = DateFormat("dd/MM/yy").format(createdAt) ==
            DateFormat("dd/MM/yy").format(DateTime.now())
        ? DateFormat("h:mm a").format(createdAt)
        : (DateTime.now().difference(createdAt).inDays == 1
            ? "Yesterday"
            : DateFormat("dd/MM/yy").format(createdAt));

    return InkWell(
      onTap: () {
        Map<String, dynamic> body = {'IsRead': 0};
        notificationController.readNotifications(
          context: context,
          body: body,
          uid: notification.notificationID,
        );
        // Order updates open that order.
        final orderId = notification.orderId;
        if (orderId != null && orderId > 0) {
          Navigator.of(context).push(MaterialPageRoute(builder: (_) => OrderDetailsScreen(orderNo: orderId)));
        }
      },
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 1.h),
        padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 2.h),
        decoration: BoxDecoration(
          color: isUnread ? const Color(0xFFF1F8E9) : bg1,
          borderRadius: BorderRadius.circular(1.5.h),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 6,
              offset: const Offset(0, 2),
            )
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar
            CircleAvatar(
              radius: 22,
              backgroundColor: primary,
              child: Text(
                (notification.title?.isNotEmpty ?? false)
                    ? notification.title![0].toUpperCase()
                    : '',
                style: GoogleFonts.poppins(
                  color: white,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            SizedBox(width: 3.w),

            // Notification content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title & Time
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: customText(
                          text: notification.title ?? '',
                          fontWeight: FontWeight.w600,
                          color: tColor5,
                          fontSize: 15.sp,
                        ),
                      ),
                      customText(
                        text: formattedTime,
                        fontSize: 11.5.sp,
                        color: black.withOpacity(0.5),
                      ),
                    ],
                  ),
                  SizedBox(height: 0.5.h),

                  // Message
                  customText(
                    text: notification.message.toString(),
                    fontSize: 13.sp,
                    fontWeight: FontWeight.w400,
                    color: tColor5,
                  ),
                  if ((notification.orderId ?? 0) > 0)
                    Padding(
                      padding: EdgeInsets.only(top: 0.6.h),
                      child: Row(children: [
                        Text('View order #${notification.orderId}',
                            style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w600, color: primaryDark)),
                        const Icon(Icons.chevron_right_rounded, size: 18, color: primaryDark),
                      ]),
                    ),

                  // Unread indicator
                  // if (isUnread)
                  //   Align(
                  //     alignment: Alignment.centerRight,
                  //     child: Padding(
                  //       padding: EdgeInsets.only(top: 0.5.h),
                  //       child: CircleAvatar(
                  //         radius: 0.8.h,
                  //         backgroundColor: green,
                  //       ),
                  //     ),
                  //   )
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}
