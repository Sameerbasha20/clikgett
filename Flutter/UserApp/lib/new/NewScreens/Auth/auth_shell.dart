import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/imageslist.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

const _leaf = Color(0xFF14532D);
const _fresh = Color(0xFF16A34A);

/// Login / sign-up layout: a green hero with the logo and floating produce, and a
/// white sheet that holds the form.
class AuthShell extends StatelessWidget {
  final String title;
  final String subtitle;
  final List<Widget> children;

  const AuthShell({super.key, required this.title, required this.subtitle, required this.children});

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Scaffold(
      backgroundColor: _leaf,
      body: SingleChildScrollView(
        physics: const ClampingScrollPhysics(),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: MediaQuery.of(context).size.height),
          child: Column(children: [
            _hero(top),
            Container(
              width: double.infinity,
              constraints: BoxConstraints(minHeight: MediaQuery.of(context).size.height - top - 260),
              padding: const EdgeInsets.fromLTRB(22, 26, 22, 24),
              decoration: const BoxDecoration(
                color: white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: GoogleFonts.poppins(fontSize: 26, fontWeight: FontWeight.w800, color: tColor, height: 1.15)),
                const SizedBox(height: 4),
                Text(subtitle, style: GoogleFonts.poppins(fontSize: 14, color: tColor3)),
                const SizedBox(height: 22),
                ...children,
              ]),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _hero(double top) => Container(
        height: 260 + top,
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [_leaf, _fresh]),
        ),
        child: Stack(children: [
          // Floating produce, like items dropping into a basket.
          ..._bubbles.map((b) => Positioned(
                left: b.left,
                right: b.right,
                top: top + b.top,
                child: Transform.rotate(
                  angle: b.angle,
                  child: Container(
                    width: b.size,
                    height: b.size,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: white.withOpacity(0.14), shape: BoxShape.circle),
                    child: Text(b.emoji, style: TextStyle(fontSize: b.size * 0.48)),
                  ),
                ),
              )),
          Positioned.fill(
            top: top,
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Container(
                width: 78,
                height: 78,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.25), blurRadius: 18, offset: const Offset(0, 8))],
                ),
                clipBehavior: Clip.antiAlias,
                child: Image.asset(logo, fit: BoxFit.cover),
              ),
              const SizedBox(height: 12),
              Text('ClikGett', style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.w800, color: white, letterSpacing: 0.3)),
              Text('Fresh groceries at your door in minutes',
                  style: GoogleFonts.poppins(fontSize: 13, color: white.withOpacity(0.88))),
            ]),
          ),
        ]),
      );
}

class _Bubble {
  final String emoji;
  final double? left;
  final double? right;
  final double top;
  final double size;
  final double angle;
  const _Bubble(this.emoji, {this.left, this.right, required this.top, required this.size, this.angle = 0});
}

const _bubbles = [
  _Bubble('🥦', left: 18, top: 26, size: 58, angle: -0.2),
  _Bubble('🍎', right: 24, top: 18, size: 50, angle: 0.25),
  _Bubble('🥕', left: 34, top: 176, size: 46, angle: 0.4),
  _Bubble('🥛', right: 30, top: 170, size: 54, angle: -0.15),
  _Bubble('🍞', right: 110, top: 8, size: 36, angle: 0.1),
];

/// Rounded input with a leading icon, used for name, phone and referral code.
class AuthField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final bool phone;
  final TextInputAction action;
  final FocusNode? focusNode;
  final ValueChanged<String>? onSubmitted;
  final String? Function(String?)? validator;
  final List<TextInputFormatter>? formatters;
  final TextCapitalization capitalization;

  const AuthField({
    super.key,
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    this.phone = false,
    this.action = TextInputAction.next,
    this.focusNode,
    this.onSubmitted,
    this.validator,
    this.formatters,
    this.capitalization = TextCapitalization.none,
  });

  @override
  Widget build(BuildContext context) {
    final border = OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: cardBorder));
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: tColor4)),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          focusNode: focusNode,
          keyboardType: phone ? TextInputType.phone : TextInputType.text,
          textInputAction: action,
          textCapitalization: capitalization,
          onFieldSubmitted: onSubmitted,
          validator: validator,
          inputFormatters: formatters ?? (phone ? [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)] : null),
          style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600, color: tColor, letterSpacing: phone ? 1.2 : 0),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w400, color: grey70, letterSpacing: 0),
            filled: true,
            fillColor: const Color(0xFFF6FBF7),
            contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 14),
            prefixIcon: Padding(
              padding: const EdgeInsets.only(left: 12, right: 8),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(icon, color: _fresh, size: 22),
                if (phone) ...[
                  const SizedBox(width: 8),
                  Text('+91', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600, color: tColor)),
                  Container(width: 1, height: 22, margin: const EdgeInsets.only(left: 10), color: cardBorder),
                ],
              ]),
            ),
            enabledBorder: border,
            border: border,
            focusedBorder: border.copyWith(borderSide: const BorderSide(color: _fresh, width: 1.6)),
            errorBorder: border.copyWith(borderSide: const BorderSide(color: red)),
            focusedErrorBorder: border.copyWith(borderSide: const BorderSide(color: red, width: 1.6)),
          ),
        ),
      ]),
    );
  }
}

/// Indian mobile number: 10 digits starting with 6-9.
String? validateMobile(String? v) {
  final value = (v ?? '').trim();
  if (value.isEmpty) return 'Enter your mobile number';
  if (!RegExp(r'^[6-9]\d{9}$').hasMatch(value)) return 'Enter a valid 10-digit mobile number';
  return null;
}

/// Full-width gradient button with a trailing arrow and a loading state.
class AuthButton extends StatelessWidget {
  final String text;
  final bool loading;
  final VoidCallback onTap;

  const AuthButton({super.key, required this.text, required this.onTap, this.loading = false});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [_fresh, Color(0xFF22C55E)]),
          borderRadius: BorderRadius.circular(18),
          boxShadow: [BoxShadow(color: _fresh.withOpacity(0.35), blurRadius: 16, offset: const Offset(0, 6))],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: loading ? null : onTap,
            child: Center(
              child: loading
                  ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2.6, color: white))
                  : Row(mainAxisSize: MainAxisSize.min, children: [
                      Text(text, style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w700, color: white)),
                      const SizedBox(width: 8),
                      const Icon(Icons.arrow_forward_rounded, color: white),
                    ]),
            ),
          ),
        ),
      ),
    );
  }
}

/// "Don't have an account? Register" style footer link.
class AuthSwitch extends StatelessWidget {
  final String question;
  final String action;
  final VoidCallback onTap;

  const AuthSwitch({super.key, required this.question, required this.action, required this.onTap});

  @override
  Widget build(BuildContext context) => Center(
        child: TextButton(
          onPressed: onTap,
          child: Text.rich(TextSpan(children: [
            TextSpan(text: '$question ', style: GoogleFonts.poppins(fontSize: 14.5, color: tColor3)),
            TextSpan(text: action, style: GoogleFonts.poppins(fontSize: 14.5, fontWeight: FontWeight.w700, color: _fresh)),
          ])),
        ),
      );
}
