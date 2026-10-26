import 'dart:convert';

import 'package:fav_app/constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;

/// Lets the customer switch push notifications for order updates and offers on or off.
/// The in-app notification list keeps every message either way.
class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  bool _loading = true;
  bool _orderUpdates = true;
  bool _offers = true;

  Uri get _url => Uri.parse('${Constants.baseUrl}/users/notification-preferences');

  Future<Map<String, String>> _headers() async => {
        'Content-Type': 'application/json',
        'Authorization': 'token ${await CommonServices.getToken()}',
      };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = jsonDecode((await http.get(_url, headers: await _headers())).body);
      if (res['Status'] == 1 && mounted) {
        setState(() {
          _orderUpdates = res['OrderUpdates'] != false;
          _offers = res['Offers'] != false;
        });
      }
    } catch (e) {
      debugPrint('Error loading notification settings: $e');
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _save({bool? orderUpdates, bool? offers}) async {
    final oldOrderUpdates = _orderUpdates;
    final oldOffers = _offers;
    setState(() {
      _orderUpdates = orderUpdates ?? _orderUpdates;
      _offers = offers ?? _offers;
    });
    try {
      final res = jsonDecode((await http.put(_url,
              headers: await _headers(),
              body: jsonEncode({
                if (orderUpdates != null) 'OrderUpdates': orderUpdates,
                if (offers != null) 'Offers': offers,
              })))
          .body);
      if (res['Status'] == 1) return;
      customToast(message: res['Message'] ?? 'Could not save your notification settings');
    } catch (e) {
      customToast(message: 'Could not save. Check your connection and try again.');
    }
    if (mounted) {
      setState(() {
        _orderUpdates = oldOrderUpdates;
        _offers = oldOffers;
      });
    }
  }

  Widget _tile(String title, String subtitle, bool value, ValueChanged<bool> onChanged) {
    return SwitchListTile.adaptive(
      value: value,
      onChanged: onChanged,
      activeColor: Appprimary,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      title: Text(title, style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle, style: GoogleFonts.poppins(fontSize: 12.5, color: Colors.grey[600])),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        surfaceTintColor: Colors.white,
        title: Text('Notification settings', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Appprimary))
          : ListView(
              padding: const EdgeInsets.all(12),
              children: [
                Container(
                  decoration: BoxDecoration(color: white, borderRadius: BorderRadius.circular(12)),
                  child: Column(children: [
                    _tile('Order updates', 'Order confirmed, out for delivery, delivered, refunds and wallet credits',
                        _orderUpdates, (v) => _save(orderUpdates: v)),
                    const Divider(height: 1),
                    _tile('Offers & reminders', 'Deals, new arrivals and items left in your cart', _offers,
                        (v) => _save(offers: v)),
                  ]),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(8, 12, 8, 0),
                  child: Text(
                    'These control phone notifications. You can still see every message under Notifications. '
                    'Login OTPs are always sent by SMS.',
                    style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600]),
                  ),
                ),
              ],
            ),
    );
  }
}
