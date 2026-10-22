import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Controllers/profile_controller.dart';
import 'package:fav_app/new/NewScreens/Account/account_widgets.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/account_services.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

/// Membership plans with their benefits; buying is paid online.
class MembershipScreen extends StatefulWidget {
  const MembershipScreen({super.key});

  @override
  State<MembershipScreen> createState() => _MembershipScreenState();
}

class _MembershipScreenState extends State<MembershipScreen> {
  MembershipPage? _page;
  bool _loading = true;
  int? _buyingPlan;
  String? _pendingOrderId;
  Razorpay? _razorpay;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _razorpay?.clear();
    super.dispose();
  }

  Future<void> _load() async {
    final page = await AccountServices.membershipPlans();
    if (!mounted) return;
    setState(() {
      _page = page;
      _loading = false;
    });
  }

  Future<void> _buy(MembershipPlan plan) async {
    setState(() => _buyingPlan = plan.id);
    final start = await AccountServices.buyMembership(plan.id);
    final orderId = start.data['RazorpayOrderID'];
    if (!mounted) return;
    if (!start.ok || orderId == null) {
      setState(() => _buyingPlan = null);
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
        'amount': (plan.price * 100).round(),
        'order_id': orderId,
        'name': 'ClikGett',
        'description': plan.name,
        'prefill': {'contact': profile?.mobileNumber, 'email': profile?.emailId},
      });
    } catch (e) {
      setState(() => _buyingPlan = null);
      customToast(message: 'Could not open the payment page');
    }
  }

  Future<void> _onSuccess(PaymentSuccessResponse r) async {
    final result = await AccountServices.confirmMembership({
      'RazorpayOrderID': _pendingOrderId,
      'razorpay_payment_id': r.paymentId,
      'razorpay_signature': r.signature,
    });
    if (!mounted) return;
    setState(() => _buyingPlan = null);
    customToast(message: result.message.isNotEmpty ? result.message : (result.ok ? 'Membership activated' : 'Could not activate'));
    _load();
  }

  void _onError(PaymentFailureResponse r) {
    if (!mounted) return;
    setState(() => _buyingPlan = null);
    customToast(message: 'Payment was not completed');
  }

  @override
  Widget build(BuildContext context) {
    final page = _page;
    return AccountScaffold(
      title: 'Membership',
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: primary))
          : page == null
              ? EmptyState(
                  icon: Icons.wifi_off_rounded,
                  title: 'Could not load plans',
                  message: 'Check your internet and try again.',
                  action: TextButton(onPressed: () {
                    setState(() => _loading = true);
                    _load();
                  }, child: const Text('Retry')),
                )
              : page.plans.isEmpty
                  ? const EmptyState(icon: Icons.workspace_premium_outlined, title: 'No plans right now', message: 'Membership plans will appear here.')
                  : ListView(
                      padding: const EdgeInsets.all(12),
                      children: [
                        if (page.current != null)
                          SectionCard(
                            color: primaryGhost,
                            child: Row(children: [
                              const Icon(Icons.verified_rounded, color: primaryDark, size: 30),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text('You are a ${page.current!.planName} member',
                                      style: GoogleFonts.poppins(fontSize: 14.5, fontWeight: FontWeight.w700, color: tColor)),
                                  if (page.current!.endDate != null)
                                    Text('Active until ${DateFormat('d MMM yyyy').format(page.current!.endDate!)}',
                                        style: GoogleFonts.poppins(fontSize: 12.5, color: tColor3)),
                                ]),
                              ),
                            ]),
                          ),
                        for (final plan in page.plans) _planCard(plan, page.current),
                        Padding(
                          padding: const EdgeInsets.all(4),
                          child: Text(
                            'Membership starts right after payment. Buying again while a plan is active adds the days to your current membership.',
                            style: GoogleFonts.poppins(fontSize: 11.5, color: grey70),
                          ),
                        ),
                      ],
                    ),
    );
  }

  Widget _planCard(MembershipPlan plan, ActiveMembership? current) {
    final isCurrent = current?.planId == plan.id;
    final benefits = <String>[
      if (plan.freeDelivery) 'Free delivery on every order (long-distance fee still applies)',
      if (plan.extraCashback > 0) '${plan.extraCashback % 1 == 0 ? plan.extraCashback.toInt() : plan.extraCashback}% extra cashback',
    ];
    return SectionCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.workspace_premium_rounded, color: amberWarning),
          const SizedBox(width: 8),
          Expanded(child: Text(plan.name, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w800, color: tColor))),
          Text.rich(TextSpan(children: [
            TextSpan(text: rupees(plan.price), style: const TextStyle(fontWeight: FontWeight.w800, color: tColor)),
            TextSpan(text: ' / ${plan.days} days', style: const TextStyle(color: tColor3)),
          ]), style: GoogleFonts.poppins(fontSize: 13.5)),
        ]),
        const SizedBox(height: 10),
        for (final b in benefits)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(children: [
              const Icon(Icons.check_circle_rounded, size: 16, color: primary),
              const SizedBox(width: 8),
              Expanded(child: Text(b, style: GoogleFonts.poppins(fontSize: 12.5, color: tColor4))),
            ]),
          ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            style: primaryButtonStyle(),
            onPressed: _buyingPlan != null ? null : () => _buy(plan),
            child: _buyingPlan == plan.id
                ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: white))
                : Text(isCurrent ? 'Extend for ${rupees(plan.price)}' : 'Join for ${rupees(plan.price)}'),
          ),
        ),
      ]),
    );
  }
}
