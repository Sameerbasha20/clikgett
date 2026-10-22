import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

String rupees(num v) => '${Constants.rupee}${v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(2)}';

/// Plain white app bar + light background used by all account screens.
class AccountScaffold extends StatelessWidget {
  final String title;
  final Widget body;
  final Widget? bottom;
  final List<Widget>? actions;

  const AccountScaffold({super.key, required this.title, required this.body, this.bottom, this.actions});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bg1,
      appBar: AppBar(
        backgroundColor: white,
        foregroundColor: tColor,
        elevation: 0.5,
        titleSpacing: 0,
        title: Text(title, style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w700)),
        actions: actions,
      ),
      body: body,
      bottomNavigationBar: bottom,
    );
  }
}

class SectionCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets padding;
  final Color? color;

  const SectionCard({super.key, required this.child, this.padding = const EdgeInsets.all(14), this.color});

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: padding,
        decoration: BoxDecoration(
          color: color ?? white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: cardBorder),
        ),
        child: child,
      );
}

class SectionTitle extends StatelessWidget {
  final String text;
  const SectionTitle(this.text, {super.key});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 8, 4, 8),
        child: Text(text.toUpperCase(),
            style: GoogleFonts.poppins(fontSize: 11.5, fontWeight: FontWeight.w700, color: tColor3, letterSpacing: 0.6)),
      );
}

class MenuTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;
  final Color? color;
  final Widget? trailing;

  const MenuTile({super.key, required this.icon, required this.title, required this.onTap, this.subtitle, this.color, this.trailing});

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(color: (color ?? primaryDark).withOpacity(0.08), borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, size: 19, color: color ?? primaryDark),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: color ?? tColor)),
                if (subtitle != null) Text(subtitle!, style: GoogleFonts.poppins(fontSize: 11.5, color: tColor3)),
              ]),
            ),
            trailing ?? const Icon(Icons.chevron_right_rounded, color: grey70),
          ]),
        ),
      );
}

/// Group of [MenuTile]s in one card with dividers.
class MenuGroup extends StatelessWidget {
  final List<Widget> tiles;
  const MenuGroup(this.tiles, {super.key});

  @override
  Widget build(BuildContext context) => SectionCard(
        padding: EdgeInsets.zero,
        child: Column(children: [
          for (var i = 0; i < tiles.length; i++) ...[
            if (i > 0) const Divider(height: 1, indent: 62, color: cardBorder),
            tiles[i],
          ],
        ]),
      );
}

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final Widget? action;

  const EmptyState({super.key, required this.icon, required this.title, required this.message, this.action});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 56, color: grey70),
            const SizedBox(height: 10),
            Text(title, textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700, color: tColor)),
            const SizedBox(height: 4),
            Text(message, textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 13, color: tColor3)),
            if (action != null) ...[const SizedBox(height: 16), action!],
          ]),
        ),
      );
}

ButtonStyle primaryButtonStyle() => ElevatedButton.styleFrom(
      backgroundColor: primary,
      foregroundColor: white,
      disabledBackgroundColor: bg2,
      elevation: 0,
      minimumSize: const Size(0, 48),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      textStyle: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700),
    );
