import 'package:fav_app/old/Constants/colors.dart';
import 'package:fluttertoast/fluttertoast.dart';

customToast({String? message, ToastGravity? gravity}) {
  return Fluttertoast.showToast(
      msg: message!,
      toastLength: Toast.LENGTH_SHORT,
      gravity: gravity ?? ToastGravity.BOTTOM,
      timeInSecForIosWeb: 1,
      backgroundColor: tWhite,
      textColor: tButtontextcolor,
      fontSize: 15);
}
