import 'dart:io';
import 'package:fav_app/old/Constants/toast.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

class CommonFunctions {
  make_phonecall({required String mobileNumber}) async {
    final Uri launchUri = Uri(
      scheme: 'tel',
      path: mobileNumber,
    );
    if (await canLaunchUrl(launchUri)) {
      await launchUrl(launchUri);
    } else {
      print("Can't Make a Call to $mobileNumber");
    }
  }

  send_sms({Code}) async {
    // String telephoneNumber = mobileNumber;
    // String smsUrl = "sms:$telephoneNumber";
    const String Code = "Y86HJNHYDR";
    if (Platform.isAndroid) {
      const uri = 'sms:?body=$Code';
      await launchUrl(Uri.parse(uri));
    } else if (Platform.isIOS) {
      // iOS
      const uri = 'sms:&body=$Code';
      await launchUrl(Uri.parse(uri));
    } else {
      throw "Error occured trying to send a message to the number.";
    }
  }

  sendemail() async {
    String? encodeQueryParameters(Map<String, String> params) {
      return params.entries
          .map((MapEntry<String, String> e) =>
              '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
          .join('&');
    }

    final Uri emailLaunchUri = Uri(
      scheme: 'mailto',
      path: 'contact@mtouchlabs.com',
      query: encodeQueryParameters(<String, String>{
        'subject': 'Query',
      }),
    );

    if (await canLaunchUrl(emailLaunchUri)) {
      launchUrl(emailLaunchUri);
    } else {
      print("canit send to an email.");
    }
  }

  openprivacy() async {
    const url = 'https://www.clikgett.com/privacy';

    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.platformDefault)) {
      throw 'Could not open';
    }
  }


  openTerms() async {
    const url = 'https://www.clikgett.com/terms';

    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.platformDefault)) {
      throw 'Could not open';
    }
  }

  whatsapp({required String Code}) async {
    // var contact = mobileNumber;
    // var androidUrl = "whatsapp://send?phone=$contact&text=Hi,";
    // var iosUrl = "https://wa.me/$contact?text=${Uri.parse('hi')}";
    var androidUrl = "whatsapp://send?phone=&text=$Code";
    var iosUrl = "https://wa.me/?text=${Uri.parse(Code)}";

    try {
      if (Platform.isIOS) {
        await launchUrl(Uri.parse(iosUrl));
      } else {
        await launchUrl(Uri.parse(androidUrl));
      }
    } on Exception {
      customToast(message: 'whatsapp is not installed.');
    }
  }

  static Future copyText({required text, required bool applied}) async {
    await Clipboard.setData(ClipboardData(text: text)).then((value) {
      // print("\ncode $text");
      // applied == true
      //     ? customToast(message: '$text Applied')
      //     : customToast(message: '$text Copied');
    });
  }

  static Future pasteText() async {
    final ClipboardData? code = await Clipboard.getData('text/plain');
    return code!.text;
  }


}
