// This shows a CupertinoModalPopup which hosts a CupertinoAlertDialog.
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';

import 'colors.dart';

void logOutDialogue(BuildContext context) {
  showCupertinoModalPopup<void>(
    context: context,
    builder: (BuildContext context) => CupertinoAlertDialog(
      title: const Text('',
          style: TextStyle(fontWeight: FontWeight.w600, color: red)),
      content: const Text(
        'Are You Sure, You Want To Exit?',
        style: TextStyle(fontWeight: FontWeight.w600),
      ),
      actions: <CupertinoDialogAction>[
        CupertinoDialogAction(
          isDefaultAction: true,
          onPressed: () {
            Navigator.pop(context);
          },
          child: const Text('No'),
        ),
        CupertinoDialogAction(
          isDestructiveAction: true,
          onPressed: () {
            SystemNavigator.pop();
          },
          child: const Text('Yes'),
        ),
      ],
    ),
  );
}
