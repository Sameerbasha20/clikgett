import 'dart:convert';

import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/NewScreens/Account/account_widgets.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/common/intercepter.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http_interceptor/http/intercepted_client.dart';
import 'package:intl/intl.dart';
import 'package:fav_app/new/Services/common/server_date.dart';

class _Offer {
  final String code;
  final String description;
  final double minOrder;
  final double value;
  final double maxDiscount;
  final bool flat;
  final DateTime? endDate;

  _Offer.fromJson(Map j)
      : code = '${j['PromoCode'] ?? ''}',
        description = '${j['Description'] ?? ''}'.trim(),
        minOrder = double.tryParse('${j['MinOrderValue'] ?? 0}') ?? 0,
        value = double.tryParse('${j['OfferValue'] ?? 0}') ?? 0,
        maxDiscount = double.tryParse('${j['MaxDiscount'] ?? 0}') ?? 0,
        flat = '${j['Type']}' == '2',
        endDate = serverDate(j['EndDate']);

  String get headline {
    if (flat) return '${rupees(value)} off';
    final cap = maxDiscount > 0 ? ' up to ${rupees(maxDiscount)}' : '';
    return '${value % 1 == 0 ? value.toInt() : value}% off$cap';
  }
}

/// Coupons customers can use right now. They are applied from checkout.
class Offers extends StatefulWidget {
  const Offers({super.key});

  @override
  State<Offers> createState() => _OffersState();
}

class _OffersState extends State<Offers> {
  List<_Offer>? _offers;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    List<_Offer> offers = [];
    try {
      final client = InterceptedClient.build(interceptors: [ApiInterceptor()]);
      final response = await client.get(Uri.parse('${Constants.baseUrl}/promocodes/active'));
      final data = jsonDecode(response.body);
      if (data is Map && data['PromoCodes'] is List) {
        offers = (data['PromoCodes'] as List).whereType<Map>().map((e) => _Offer.fromJson(e)).where((o) => o.code.isNotEmpty).toList();
      }
    } catch (_) {}
    if (mounted) setState(() => _offers = offers);
  }

  @override
  Widget build(BuildContext context) {
    final offers = _offers;
    return AccountScaffold(
      title: 'Offers & coupons',
      body: offers == null
          ? const Center(child: CircularProgressIndicator(color: primary))
          : RefreshIndicator(
              color: primary,
              onRefresh: _load,
              child: offers.isEmpty
                  ? ListView(children: const [
                      SizedBox(height: 60),
                      EmptyState(icon: Icons.local_offer_outlined, title: 'No offers right now', message: 'New coupons will show up here.'),
                    ])
                  : ListView(
                      padding: const EdgeInsets.all(12),
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(4, 0, 4, 10),
                          child: Text('Apply a coupon at checkout. Tap a code to copy it.',
                              style: GoogleFonts.poppins(fontSize: 12.5, color: tColor3)),
                        ),
                        for (final o in offers) _card(o),
                      ],
                    ),
            ),
    );
  }

  Widget _card(_Offer o) => SectionCard(
        child: Row(children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: primaryGhost, borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.local_offer_rounded, color: primaryDark),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(o.headline, style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w800, color: tColor)),
              if (o.description.isNotEmpty) Text(o.description, style: GoogleFonts.poppins(fontSize: 12, color: tColor4)),
              Text(
                [
                  if (o.minOrder > 0) 'On orders above ${rupees(o.minOrder)}',
                  if (o.endDate != null) 'Valid till ${DateFormat('d MMM').format(o.endDate!)}',
                ].join(' · '),
                style: GoogleFonts.poppins(fontSize: 11.5, color: tColor3),
              ),
            ]),
          ),
          InkWell(
            onTap: () {
              Clipboard.setData(ClipboardData(text: o.code));
              customToast(message: '${o.code} copied');
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: primary, style: BorderStyle.solid),
              ),
              child: Text(o.code, style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w800, color: primaryDark, letterSpacing: 0.5)),
            ),
          ),
        ]),
      );
}
