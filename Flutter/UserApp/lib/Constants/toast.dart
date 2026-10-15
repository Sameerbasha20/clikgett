import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Services/common/toast_guard.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

customToast({required String message, ToastGravity? gravity}) {
  if (ToastGuard.blockAllToasts) return;
  return Fluttertoast.showToast(
      msg: message,
      toastLength: Toast.LENGTH_SHORT,
      gravity: gravity ?? ToastGravity.BOTTOM,
      timeInSecForIosWeb: 1,
      backgroundColor: black,
      textColor: white,
      fontSize: 15.sp);
}
