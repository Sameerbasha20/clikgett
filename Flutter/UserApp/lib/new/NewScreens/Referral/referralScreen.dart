import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/NewScreens/Account/account_widgets.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/account_services.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';

const _playStoreLink = 'https://play.google.com/store/apps/details?id=com.app.clikget';
const _appStoreLink = 'https://apps.apple.com/in/app/clikgett/id6746932740';

/// Refer & earn: the customer's code, reward amounts from the referral settings
/// and how many friends joined / ordered.
class ReferralScreen extends StatefulWidget {
  const ReferralScreen({super.key});

  @override
  State<ReferralScreen> createState() => _ReferralScreenState();
}

class _ReferralScreenState extends State<ReferralScreen> {
  ReferralInfo? _info;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final info = await AccountServices.referral();
    if (!mounted) return;
    setState(() {
      _info = info;
      _loading = false;
    });
  }

  String _shareText(ReferralInfo i) =>
      'Get groceries delivered fast with ClikGett! Sign up with my code ${i.code} and get ${rupees(i.friendReward)} '
      'in your wallet after your first order.\n\nAndroid: $_playStoreLink\niPhone: $_appStoreLink';

  @override
  Widget build(BuildContext context) {
    final info = _info;
    return AccountScaffold(
      title: 'Refer & earn',
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: primary))
          : info == null || info.code == null
              ? EmptyState(
                  icon: Icons.card_giftcard_rounded,
                  title: 'Referral not available',
                  message: 'We could not load your referral code. Please try again.',
                  action: TextButton(onPressed: () {
                    setState(() => _loading = true);
                    _load();
                  }, child: const Text('Retry')),
                )
              : ListView(
                  padding: const EdgeInsets.all(12),
                  children: [
                    SectionCard(
                      color: primaryGhost,
                      child: Column(children: [
                        const Icon(Icons.card_giftcard_rounded, color: primaryDark, size: 44),
                        const SizedBox(height: 8),
                        Text('Earn ${rupees(info.referrerReward)} for every friend',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(fontSize: 19, fontWeight: FontWeight.w800, color: tColor)),
                        const SizedBox(height: 4),
                        Text(
                          'Your friend gets ${rupees(info.friendReward)} too, after their first order'
                          '${info.minOrderValue > 0 ? ' of ${rupees(info.minOrderValue)} or more' : ''} is delivered.',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(fontSize: 13, color: tColor4),
                        ),
                        const SizedBox(height: 14),
                        InkWell(
                          onTap: () {
                            Clipboard.setData(ClipboardData(text: info.code!));
                            customToast(message: 'Code copied');
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                            decoration: BoxDecoration(
                              color: white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: primary, width: 1.4),
                            ),
                            child: Row(mainAxisSize: MainAxisSize.min, children: [
                              Text(info.code!,
                                  style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w800, color: primaryDark, letterSpacing: 2)),
                              const SizedBox(width: 10),
                              const Icon(Icons.copy_rounded, size: 18, color: primaryDark),
                            ]),
                          ),
                        ),
                        const SizedBox(height: 14),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            style: primaryButtonStyle(),
                            onPressed: () => Share.share(_shareText(info)),
                            icon: const Icon(Icons.share_rounded),
                            label: const Text('Invite friends'),
                          ),
                        ),
                      ]),
                    ),
                    SectionCard(
                      child: Row(children: [
                        _stat('${info.friendsJoined}', 'Friends joined'),
                        _stat('${info.friendsOrdered}', 'Ordered'),
                        _stat(rupees(info.earned), 'Earned'),
                      ]),
                    ),
                    SectionCard(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('How it works', style: GoogleFonts.poppins(fontSize: 14.5, fontWeight: FontWeight.w700, color: tColor)),
                        const SizedBox(height: 8),
                        _step('1', 'Share your code with friends and family.'),
                        _step('2', 'They sign up on ClikGett using your code.'),
                        _step('3', 'When their first order is delivered, you both get wallet money.'),
                      ]),
                    ),
                  ],
                ),
    );
  }

  Widget _stat(String value, String label) => Expanded(
        child: Column(children: [
          Text(value, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w800, color: tColor)),
          Text(label, style: GoogleFonts.poppins(fontSize: 11.5, color: tColor3)),
        ]),
      );

  Widget _step(String n, String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(children: [
          CircleAvatar(radius: 12, backgroundColor: primaryGhost, child: Text(n, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w700, color: primaryDark))),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: GoogleFonts.poppins(fontSize: 13, color: tColor4))),
        ]),
      );
}
