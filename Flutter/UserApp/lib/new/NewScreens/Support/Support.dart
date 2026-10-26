import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/NewScreens/Account/account_widgets.dart';
import 'package:fav_app/new/NewScreens/Account/my_requests_screen.dart';
import 'package:fav_app/new/NewScreens/Support/EnquiryScreen.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/account_services.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

/// Help & support: contacts and FAQs come from admin Settings.
class Support extends StatefulWidget {
  const Support({super.key});

  @override
  State<Support> createState() => _SupportState();
}

class _SupportState extends State<Support> {
  AppConfig? _config;

  @override
  void initState() {
    super.initState();
    AccountServices.config(refresh: true).then((c) {
      if (mounted) setState(() => _config = c);
    });
  }

  Future<void> _open(Uri uri) async {
    if (!await launchUrl(uri)) customToast(message: 'Could not open this on your phone');
  }

  @override
  Widget build(BuildContext context) {
    final c = _config;
    return AccountScaffold(
      title: 'Help & support',
      body: c == null
          ? const Center(child: CircularProgressIndicator(color: primary))
          : ListView(
              padding: const EdgeInsets.all(12),
              children: [
                MenuGroup([
                  if (c.supportEmail.isNotEmpty)
                    MenuTile(
                      icon: Icons.mail_outline_rounded,
                      title: 'Email us',
                      subtitle: c.supportEmail,
                      onTap: () => _open(Uri(scheme: 'mailto', path: c.supportEmail, query: 'subject=ClikGett%20support')),
                    ),
                  MenuTile(
                    icon: Icons.edit_note_rounded,
                    title: 'Send us a message',
                    subtitle: 'Missing items, refunds, anything else',
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EnquiryScreen())),
                  ),
                  MenuTile(
                    icon: Icons.forum_outlined,
                    title: 'My requests',
                    subtitle: 'Replies to your messages and product requests',
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const MyRequestsScreen())),
                  ),
                ]),
                if (c.faqs.isNotEmpty) ...[
                  const SectionTitle('Frequently asked questions'),
                  for (final group in c.faqs)
                    SectionCard(
                      padding: const EdgeInsets.fromLTRB(4, 8, 4, 4),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(12, 4, 12, 4),
                          child: Text(group.title, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, color: tColor)),
                        ),
                        for (final e in group.entries)
                          Theme(
                            data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                            child: ExpansionTile(
                              tilePadding: const EdgeInsets.symmetric(horizontal: 12),
                              childrenPadding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                              iconColor: primaryDark,
                              collapsedIconColor: grey70,
                              title: Text(e.question, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: tColor4)),
                              children: [
                                Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(e.answer, style: GoogleFonts.poppins(fontSize: 12.5, color: tColor3, height: 1.45)),
                                ),
                              ],
                            ),
                          ),
                      ]),
                    ),
                ],
              ],
            ),
    );
  }
}
