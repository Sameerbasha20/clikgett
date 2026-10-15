import 'dart:convert';

import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Controllers/wallet.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:responsive_sizer/responsive_sizer.dart';
import 'package:http/http.dart';

import '../../Constants/Constants.dart';
import '../../Constants/imageslist.dart';
import '../../Constants/textStyles.dart';
import '../../NewModel/wallet.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  String Token = '';
  String razorpay_payment_id = '';
  String razorpay_signature = '';
  String paymentTransaction = '';
  String razorpayOrderId = '';
  final TextEditingController _amountController = TextEditingController();
  Razorpay _razorpay = Razorpay();
  final WalletController walletController = Get.find<WalletController>();

  @override
  void initState() {
    CommonServices.getToken().then((onValue) {
      Token = onValue; // Store the token
    });
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    walletController.getWallet(context: context);

    super.initState();
  }

  @override
  void dispose() {
    _amountController.dispose();

    super.dispose();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    // Handle successful payment
    if (response != null) {
      razorpay_payment_id = response.paymentId!;
      razorpay_signature = response.signature!;
      addWalletAmount(_amountController.text.toString());
    } else {}
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    // Handle payment failure
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    // Handle external wallet response
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        backgroundColor: bg1,
        appBar: AppBar(
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          backgroundColor: white,
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(1),
            child: Container(
              color: cardBorder,
              height: 1,
            ),
          ),
          leading: IconButton(
            padding: EdgeInsets.zero,
            onPressed: () {
              Navigator.of(context).pop();
            },
            icon: Icon(
              Icons.arrow_back_ios_new_rounded,
              size: 20,
              color: tColor,
            ),
          ),
          title: Text(
            'Wallet',
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 18.5.sp,
              color: tColor,
            ),
          ),
          centerTitle: true,
        ),
        body: Obx(
          () => walletController.isLoading.isTrue
              ? const Center(
                  child: CircularProgressIndicator.adaptive(),
                )
              : walletController.walletModel != null
                  ? SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: double.infinity,
                            margin: EdgeInsets.all(4.w),
                            padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 2.5.h),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [primary, primaryDark],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: primary.withOpacity(0.3),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'ClikGett Cash',
                                      style: GoogleFonts.poppins(
                                        color: white.withOpacity(0.9),
                                        fontSize: 14.sp,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: white.withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.account_balance_wallet_rounded, color: white, size: 14),
                                          SizedBox(width: 4),
                                          Text(
                                            "Active",
                                            style: GoogleFonts.poppins(color: white, fontSize: 11.5.sp, fontWeight: FontWeight.w600),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                SizedBox(height: 1.2.h),
                                Text(
                                  '₹${walletController.walletModel?.walletAmount?.toStringAsFixed(2) ?? "0.00"}',
                                  style: GoogleFonts.poppins(
                                    color: white,
                                    fontSize: 26.sp,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Padding(
                            padding: EdgeInsets.symmetric(horizontal: 4.w),
                            child: Text(
                              'Add Money',
                              style: GoogleFonts.poppins(
                                color: tColor,
                                fontSize: 16.sp,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          SizedBox(height: 1.h),
                          Padding(
                            padding: EdgeInsets.symmetric(horizontal: 4.w),
                            child: Container(
                              decoration: BoxDecoration(
                                color: white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: cardBorder, width: 1),
                                boxShadow: softCardShadow,
                              ),
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  TextField(
                                    controller: _amountController,
                                    keyboardType: TextInputType.number,
                                    inputFormatters: [
                                      FilteringTextInputFormatter.digitsOnly,
                                      LengthLimitingTextInputFormatter(7),
                                      CustomInputFormatter()
                                    ],
                                    style: GoogleFonts.poppins(
                                      textStyle: TextStyle(
                                        color: tColor,
                                        fontSize: 18,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    decoration: InputDecoration(
                                      prefixIcon: Padding(
                                        padding: const EdgeInsets.only(top: 2, right: 6),
                                        child: Text("₹", style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w600, color: tColor)),
                                      ),
                                      prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
                                      hintText: "Enter Amount",
                                      hintStyle: GoogleFonts.poppins(color: tColor3, fontSize: 16),
                                      border: UnderlineInputBorder(
                                        borderSide: BorderSide(color: cardBorder),
                                      ),
                                      enabledBorder: UnderlineInputBorder(
                                        borderSide: BorderSide(color: cardBorder),
                                      ),
                                      focusedBorder: UnderlineInputBorder(
                                        borderSide: BorderSide(color: primary, width: 1.5),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 14),
                                  Text(
                                    'Recommended',
                                    style: GoogleFonts.poppins(color: tColor2, fontSize: 12.5.sp, fontWeight: FontWeight.w500),
                                  ),
                                  const SizedBox(height: 10),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      _buildMoneyButton('+ ₹100', '100'),
                                      _buildMoneyButton('+ ₹500', '500'),
                                      _buildMoneyButton('+ ₹1000', '1000'),
                                    ],
                                  ),
                                  const SizedBox(height: 18),
                                  SizedBox(
                                    width: double.infinity,
                                    height: 48,
                                    child: ElevatedButton(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: primary,
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                      ),
                                      onPressed: () {
                                        String amountText =
                                            _amountController.text.trim();
                                        if (amountText.isNotEmpty) {
                                          sendDataServer(
                                              _amountController.text.toString());
                                        } else {
                                          customToast(
                                              message: 'Please enter amount');
                                        }
                                      },
                                      child: Text(
                                        'Add Money to Wallet',
                                        style: GoogleFonts.poppins(
                                          color: white,
                                          fontSize: 15.sp,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          SizedBox(height: 2.h),
                          if (walletController.walletList.isNotEmpty) ...[
                            Padding(
                              padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 0.5.h),
                              child: Text(
                                'Transaction History',
                                style: GoogleFonts.poppins(
                                  color: tColor,
                                  fontSize: 16.sp,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            ListView.builder(
                              itemCount: walletController.walletList.length,
                              padding: EdgeInsets.only(bottom: 6.h, left: 4.w, right: 4.w),
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemBuilder: (BuildContext context, int index) {
                                var wallets =
                                    walletController.walletList[index];
                                return TransactionWidget(
                                  wallets: wallets,
                                );
                              },
                            ),
                          ],
                        ],
                      ),
                    )
                  : Center(
                      child: customText(text: 'Error Loading'),
                    ),
        ));
  }

  Widget _buildMoneyButton(String text, String value) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: () {
          setState(() {
            _amountController.text = value;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: primaryLight,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: primary.withOpacity(0.3)),
          ),
          child: Text(
            text,
            style: GoogleFonts.poppins(
              color: primary,
              fontSize: 13.5.sp,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHistoryButton(String text) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: ListTile(
        leading: const Icon(Icons.history, color: Colors.green),
        title: Text(text),
        onTap: () {},
      ),
    );
  }

  Future<void> sendDataServer(String amount) async {
    double totalAmount = double.parse(amount);
    var apiUrl = Uri.parse('${Constants.baseUrl}/orders/orderpayments');
    //     final String apiUrl = '${Constants.baseUrl}/orders/add_wallet_money';

    var data = {
      "OrderAmount": totalAmount,
      "Type": 2,
    };

    // Convert data to JSON
    var jsonData = jsonEncode(data);

    // Send POST request
    var response = await post(
      apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer $Token',
      },
      body: jsonData,
    );

    // Check the response status
    if (response.statusCode == 200) {
      var data = jsonDecode(response.body);
      // paymentTransaction = data['PaymentTransaction'].toString();
      razorpayOrderId = data['RazorpayOrderID'].toString();
      // print('PaymentTransaction: $paymentTransaction');
      _openCheckout(amount, razorpayOrderId);
      // {Status: 1, PaymentTransaction: 758776, razorpayOrderId: order_NakIcnw7dGybKw}
    } else {}
  }

  void _openCheckout(String amountText, String orderId) {
    double totalAmount = double.parse(amountText);
    double amount2 = 100;

    var options = {
      'key': Constants.razorPayKey,
      'amount': (totalAmount * amount2),
      // Replace with the amount you want to charge (in paisa)
      'name': 'Clikgett',
      'order_id': orderId,
      'description': 'Add Money Wallet',
      'prefill': {'contact': '', 'email': ''},
      'external': {
        'wallets': ['paytm'],
      },
    };

    try {
      _razorpay.open(options);
    } catch (e) {
      debugPrint('Error in opening Razorpay: $e');
    }
  }

  Future<void> addWalletAmount(String amount) async {
    try {
      final String apiUrl = '${Constants.baseUrl}/users/add_wallet_money';

      Map<String, dynamic> requestBody = {
        'Amount': amount,
        'RazorpayOrderID': razorpayOrderId,
        'razorpay_signature': razorpay_signature,
        'razorpay_payment_id': razorpay_payment_id
      };
      print('requestBody  Code: ${requestBody}');

      var response = await post(
        Uri.parse(apiUrl),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $Token',
        },
        body: jsonEncode(requestBody),
      );

      print('Response Status Code: ${response.statusCode}');
      print('Payment  Response Body: ${response.body}');

      // if (response.statusCode == 200) {
      var data = jsonDecode(response.body);
      int status = data['Status'];
      if (status == 1) {
        // Provider.of<WalletController>(context, listen: false).getWallet(context: context);
        walletController.getWallet(context: context);
        _amountController.clear();
        // Navigator.pop(context);
        String message = data['Message'];

        // print('Success: $message');

        // Navigate to the next screen (Homepage) after successful profile setup
      } else {
        String message = data['Message'];

        print('Error: $message');
      }
      // } else {
      //   print('Error: ${response.reasonPhrase}');
      // }
    } catch (e) {
      print('Exception during API call: $e');
    }
  }
}

class CustomInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    if (newValue.text.isEmpty) {
      return newValue;
    }
    // Prevent first character as `0`
    if (newValue.text.startsWith('0')) {
      return oldValue;
    }
    return newValue;
  }
}
//   @override
//   void initState() {
//     super.initState();
//     walletController.getWallet(context: context);
//   }
//
//   final WalletController walletController = Get.find<WalletController>();
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       backgroundColor: white,
//       appBar: AppBar(
//         title: Text(
//           "Wallet",
//           style: customTextstyle(fontWeight: FontWeight.w600, fontSize: 17.sp),
//         ),
//         leading: IconButton(
//             padding: EdgeInsets.zero,
//             onPressed: () {
//               Navigator.of(context).pop();
//             },
//             icon: Image.asset(
//               backbutton,
//               height: 5.h,
//               width: 10.w,
//               fit: BoxFit.cover,
//             )),
//       ),
//       body: Obx(
//         () => walletController.isLoading.isTrue
//             ? const Center(
//                 child: CircularProgressIndicator.adaptive(),
//               )
//             : walletController.walletModel != null
//                 ? Padding(
//                     padding: EdgeInsets.symmetric(horizontal: 3.w),
//                     child: Column(
//                       crossAxisAlignment: CrossAxisAlignment.start,
//                       children: [
//                         SizedBox(
//                           height: 3.h,
//                         ),
//                         Container(
//                           decoration: BoxDecoration(
//                             borderRadius: BorderRadius.circular(10),
//                             gradient: const LinearGradient(
//                               begin: Alignment.topLeft,
//                               end: Alignment.bottomRight,
//                               colors: [
//                                 Color(0XFFF9A76A),
//                                 Color(0XFFF45924),
//                               ],
//                             ),
//                           ),
//                           padding: const EdgeInsets.symmetric(vertical: 20),
//                           child: Row(
//                             mainAxisAlignment: MainAxisAlignment.center,
//                             children: [
//                               Padding(
//                                 padding: const EdgeInsets.only(right: 10),
//                                 child: CircleAvatar(
//                                   radius: 22,
//                                   backgroundColor: const Color(0XFFfaab7d),
//                                   child: Image.asset(
//                                     walletBalance,
//                                     height: 28,
//                                   ),
//                                 ),
//                               ),
//                               Column(
//                                 crossAxisAlignment: CrossAxisAlignment.start,
//                                 children: [
//                                   customText(
//                                     text: 'Balance',
//                                     color: white,
//                                     fontWeight: FontWeight.w400,
//                                     fontSize: 18.sp,
//                                   ),
//                                   customText(
//                                     text: walletController
//                                             .walletModel?.walletAmount
//                                             ?.toStringAsFixed(2) ??
//                                         '',
//                                     color: white,
//                                     fontWeight: FontWeight.w600,
//                                     fontSize: 17.sp,
//                                   ),
//                                 ],
//                               )
//                             ],
//                           ),
//                         ),
//                         Padding(
//                           padding: const EdgeInsets.only(top: 25, bottom: 15),
//                           child: customText(
//                             text: 'Wallet History',
//                             fontWeight: FontWeight.w600,
//                             color: const Color(0XFF212529),
//                             fontSize: 17.sp,
//                           ),
//                         ),
// if (walletController.walletList.isNotEmpty)
//   Flexible(
//     child: ListView.builder(
//       itemCount: walletController.walletList.length,
//       padding: const EdgeInsets.only(bottom: 50),
//       physics: const BouncingScrollPhysics(),
//       itemBuilder: (BuildContext context, int index) {
//         var wallets =
//             walletController.walletList[index];
//         return TransactionWidget(
//           wallets: wallets,
//         );
//       },
//     ),
//   ),
//                       ],
//                     ),
//                   )
//                 : Center(
//                     child: customText(text: 'Error Loading'),
//                   ),
//       ),
//     );
//   }
// }
//
// class TransactionWidget extends StatelessWidget {
//   const TransactionWidget({
//     super.key,
//     required this.wallets,
//   });
//   final Wallet wallets;
//   @override
//   Widget build(BuildContext context) {
//     return Container(
//       margin: const EdgeInsets.symmetric(vertical: 7),
//       decoration: BoxDecoration(
//           color: const Color(0XFFFFF3EF),
//           borderRadius: BorderRadius.circular(12)),
//       padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 15),
//       child: Row(
//         children: [
//           CircleAvatar(
//             radius: 16,
//             backgroundColor: white,
//             child: Image.asset(
//               transactionMoney,
//               height: 18,
//             ),
//           ),
//           Padding(
//             padding: const EdgeInsets.only(left: 15, right: 8),
//             child: customText(
//               text: '₹${wallets.amount?.toStringAsFixed(0)}',
//               fontWeight: FontWeight.w600,
//               fontSize: 15.5.sp,
//               color: const Color(0XFF212529),
//             ),
//           ),
//           customText(
//             text: getTransactionType(status: wallets.contentType),
//             fontWeight: FontWeight.w400,
//             fontSize: 15.5.sp,
//             color: wallets.creditedDebited == 1
//                 ? const Color(0XFF2A933B)
//                 : const Color(0XFFF72D2D),
//           ),
//           const Spacer(),
//           customText(
//             text: getFormateDate(dateTime: wallets.createdAt),
//             fontWeight: FontWeight.w600,
//             fontSize: 15.5.sp,
//             color: const Color(0XFF212529).withOpacity(.47),
//           ),
//         ],
//       ),
//     );
//   }

//   String getFormateDate({DateTime? dateTime}) {
//     if (dateTime == null) {
//       return 'Invalid DateTime';
//     }
//     return DateFormat('dd-MM-yyyy').format(dateTime);
//   }

//   String getTransactionType({int? status}) {
//     if (status == null) {
//       return 'Invalid Status';
//     }
//     String transcationName = '';
//     if (status == 1) {
//       transcationName = 'Signup';
//     } else if (status == 2) {
//       transcationName = 'Firstorder Referral';
//     } else if (status == 3) {
//       transcationName = 'Orderplace';
//     } else if (status == 4) {
//       transcationName = 'Ordercancel';
//     }

//   return transcationName;
// }

class TransactionWidget extends StatefulWidget {
  final Wallet wallets;

  const TransactionWidget({super.key, required this.wallets});

  @override
  State<TransactionWidget> createState() => _TransactionWidgetState();
}

class _TransactionWidgetState extends State<TransactionWidget> {
  bool isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final isCredit = widget.wallets.creditedDebited == 1;
    final icon =
        isCredit ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded;
    final iconColor =
        isCredit ? primary : Colors.red.shade600;
    final iconBg =
        isCredit ? primaryLight : const Color(0xFFFEE2E2);
    final prefix = isCredit ? "+" : "-";
    final title = isCredit ? "Wallet Credited" : "Wallet Debited";

    return Container(
      margin: EdgeInsets.only(bottom: 1.2.h),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorder, width: 1),
        boxShadow: softCardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: iconBg,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w600,
                        fontSize: 15.sp,
                        color: tColor,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      getFormattedDateTime(widget.wallets.createdAt),
                      style: GoogleFonts.poppins(
                        fontSize: 12.5.sp,
                        color: tColor3,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                '$prefix₹${widget.wallets.amount?.toStringAsFixed(0)}',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w700,
                  fontSize: 16.5.sp,
                  color: iconColor,
                ),
              ),
            ],
          ),
          if (widget.wallets.description != null &&
              widget.wallets.description != "NA" &&
              widget.wallets.description!.trim().isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: bg1,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                isCredit
                    ? "Cash credited from ClikGett: ${widget.wallets.description}"
                    : "${widget.wallets.description}",
                style: GoogleFonts.poppins(
                  fontSize: 12.5.sp,
                  color: tColor2,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String getFormattedDateTime(DateTime? dateTime) {
    if (dateTime == null) return 'Invalid date';
    final localTime = dateTime.toLocal();
    return DateFormat("d'th' MMM, yyyy - hh:mm a").format(localTime);
  }
}

  // String getTransactionType({int? status}) {
  //   if (status == null) {
  //     return 'Invalid Status';
  //   }
  //   String transcationName = '';
  //   if (status == 1) {
  //     transcationName = 'Signup';
  //   } else if (status == 2) {
  //     transcationName = 'Firstorder Referral';
  //   } else if (status == 3) {
  //     transcationName = 'Orderplace';
  //   } else if (status == 4) {
  //     transcationName = 'Ordercancel';
  //   }
