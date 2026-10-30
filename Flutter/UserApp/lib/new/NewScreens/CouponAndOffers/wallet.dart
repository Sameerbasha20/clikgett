import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Controllers/profile_controller.dart';
import 'package:fav_app/new/Controllers/wallet.dart';
import 'package:fav_app/new/NewModel/wallet.dart';
import 'package:fav_app/new/NewScreens/Account/account_widgets.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/account_services.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

/// Wallet balance, top-up via Razorpay and transaction history.
class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  final WalletController wallet = Get.find<WalletController>();
  final TextEditingController _amount = TextEditingController();
  AppConfig _config = const AppConfig();
  Razorpay? _razorpay;
  String? _pendingOrderId;
  bool _busy = false;

  static const _maxTopup = 10000;

  @override
  void initState() {
    super.initState();
    wallet.getWallet(context: context);
    AccountServices.config().then((c) {
      if (mounted) setState(() => _config = c);
    });
  }

  @override
  void dispose() {
    _amount.dispose();
    _razorpay?.clear();
    super.dispose();
  }

  Future<void> _topUp() async {
    final amount = int.tryParse(_amount.text.trim()) ?? 0;
    if (amount < 1) {
      customToast(message: 'Enter an amount to add');
      return;
    }
    if (amount > _maxTopup) {
      customToast(message: 'You can add up to ${rupees(_maxTopup)} at a time');
      return;
    }
    setState(() => _busy = true);
    final start = await AccountServices.startTopup(amount);
    final orderId = start.data['RazorpayOrderID'];
    if (!mounted) return;
    if (!start.ok || orderId == null) {
      setState(() => _busy = false);
      customToast(message: start.message.isNotEmpty ? start.message : 'Could not start the payment');
      return;
    }
    _pendingOrderId = '$orderId';
    final key = await AccountServices.razorpayKey();
    final profile = Get.find<ProfileController>().users;
    _razorpay?.clear();
    _razorpay = Razorpay()
      ..on(Razorpay.EVENT_PAYMENT_SUCCESS, _onSuccess)
      ..on(Razorpay.EVENT_PAYMENT_ERROR, _onError)
      ..on(Razorpay.EVENT_EXTERNAL_WALLET, (_) {});
    try {
      _razorpay!.open({
        'key': key,
        'amount': amount * 100,
        'order_id': orderId,
        'name': 'ClikGett',
        'description': 'Add money to wallet',
        'prefill': {'contact': profile?.mobileNumber, 'email': profile?.emailId},
      });
    } catch (e) {
      setState(() => _busy = false);
      customToast(message: 'Could not open the payment page');
    }
  }

  Future<void> _onSuccess(PaymentSuccessResponse r) async {
    final result = await AccountServices.confirmTopup({
      'RazorpayOrderID': _pendingOrderId,
      'razorpay_payment_id': r.paymentId,
      'razorpay_signature': r.signature,
    });
    if (!mounted) return;
    setState(() => _busy = false);
    customToast(message: result.ok ? 'Money added to your wallet' : result.message);
    if (result.ok) {
      _amount.clear();
      wallet.getWallet(context: context);
    }
  }

  void _onError(PaymentFailureResponse r) {
    if (!mounted) return;
    setState(() => _busy = false);
    customToast(message: 'Payment was not completed');
  }

  @override
  Widget build(BuildContext context) {
    return AccountScaffold(
      title: 'Wallet',
      body: RefreshIndicator(
        color: primary,
        onRefresh: () async => wallet.getWallet(context: context),
        child: ListView(
          padding: const EdgeInsets.all(12),
          children: [
            Obx(() => SectionCard(
                  color: primaryGhost,
                  child: Row(children: [
                    const Icon(Icons.account_balance_wallet_rounded, color: primaryDark, size: 34),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Wallet balance', style: GoogleFonts.poppins(fontSize: 12.5, color: tColor3)),
                        Text(rupees(wallet.walletAmount.value),
                            style: GoogleFonts.poppins(fontSize: 26, fontWeight: FontWeight.w800, color: tColor)),
                      ]),
                    ),
                  ]),
                )),
            SectionCard(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Add money', style: GoogleFonts.poppins(fontSize: 14.5, fontWeight: FontWeight.w700, color: tColor)),
                const SizedBox(height: 10),
                TextField(
                  controller: _amount,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(5)],
                  decoration: InputDecoration(
                    prefixText: '₹ ',
                    hintText: 'Enter amount',
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: primary)),
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(spacing: 8, runSpacing: 8, children: [
                  for (final a in _config.walletTopupAmounts)
                    ActionChip(
                      backgroundColor: white,
                      side: const BorderSide(color: cardBorder),
                      label: Text('+ ${rupees(a)}', style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w600, color: primaryDark)),
                      onPressed: () {
                        final current = int.tryParse(_amount.text) ?? 0;
                        _amount.text = '${current + a}';
                      },
                    ),
                ]),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: primaryButtonStyle(),
                    onPressed: _busy ? null : _topUp,
                    child: _busy
                        ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: white))
                        : const Text('Add money'),
                  ),
                ),
                const SizedBox(height: 8),
                Text('Wallet money can be used at checkout. Cashback, refunds and referral rewards are added here too.',
                    style: GoogleFonts.poppins(fontSize: 11.5, color: tColor3)),
              ]),
            ),
            const SectionTitle('Transactions'),
            Obx(() {
              final list = wallet.walletList.toList();
              if (wallet.isLoading.value && list.isEmpty) {
                return const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator(color: primary)));
              }
              if (list.isEmpty) {
                return const EmptyState(
                  icon: Icons.receipt_long_outlined,
                  title: 'No transactions yet',
                  message: 'Cashback, refunds and top-ups will show up here.',
                );
              }
              return SectionCard(
                padding: EdgeInsets.zero,
                child: Column(children: [
                  for (var i = 0; i < list.length; i++) ...[
                    if (i > 0) const Divider(height: 1, color: cardBorder),
                    _transaction(list[i]),
                  ],
                ]),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _transaction(Wallet w) {
    final credit = w.creditedDebited == 1;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(color: credit ? primaryGhost : redLight, shape: BoxShape.circle),
          child: Icon(credit ? Icons.south_west_rounded : Icons.north_east_rounded, size: 18, color: credit ? primaryDark : red),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(_label(w), maxLines: 2, overflow: TextOverflow.ellipsis,
                style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: tColor)),
            if (w.createdAt != null)
              Text(DateFormat('d MMM yyyy, h:mm a').format(w.createdAt!), style: GoogleFonts.poppins(fontSize: 11.5, color: tColor3)),
            if (_expiresSoon(w))
              Text('Use by ${DateFormat('d MMM, h:mm a').format(w.expiryDate!)}',
                  style: GoogleFonts.poppins(fontSize: 11.5, fontWeight: FontWeight.w600, color: amberWarning)),
          ]),
        ),
        Text('${credit ? '+' : '-'}${rupees(w.amount ?? 0)}',
            style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, color: credit ? primaryDark : red)),
      ]),
    );
  }

  /// Unexpired reward money (comeback cash, birthday gift) shows when it runs out.
  bool _expiresSoon(Wallet w) =>
      w.creditedDebited == 1 &&
      (w.contentType == 6 || w.contentType == 7) &&
      !w.isExpired &&
      w.expiryDate != null &&
      w.expiryDate!.isAfter(DateTime.now());

  /// Many older entries have no description; fall back to the entry type.
  String _label(Wallet w) {
    final d = (w.description ?? '').trim();
    if (d.isNotEmpty && d != 'NA' && !RegExp(r'^\d+$').hasMatch(d)) return d;
    final credit = w.creditedDebited == 1;
    switch (w.contentType) {
      case 1:
        return credit ? 'Bonus credited' : 'Adjustment';
      case 2:
        return credit ? 'Referral reward' : 'Referral adjustment';
      case 3:
        return credit ? 'Money added' : 'Paid for an order';
      case 4:
        return credit ? 'Cashback / refund' : 'Cashback reversed';
      case 6:
        return credit ? 'Comeback reward' : 'Comeback reward expired';
      case 7:
        return credit ? 'Birthday gift' : 'Birthday gift expired';
      default:
        return credit ? 'Credited' : 'Debited';
    }
  }
}
