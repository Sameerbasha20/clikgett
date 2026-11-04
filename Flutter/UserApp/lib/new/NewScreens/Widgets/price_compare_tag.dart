import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// "⊂⊃ Our app: 40% lower" under a product's price (percentage set in admin > Price Compare).
class PriceCompareTag extends StatelessWidget {
  final int percent;
  final double fontSize;

  const PriceCompareTag({super.key, required this.percent, this.fontSize = 10.5});

  static const _red = Color(0xFFDC2626);
  static const _pink = Color(0xFFDB2777);

  @override
  Widget build(BuildContext context) {
    final ring = fontSize * 1.05;
    return Row(mainAxisSize: MainAxisSize.min, children: [
      // Two linked rings: "compared with".
      SizedBox(
        width: ring * 1.7,
        height: ring,
        child: Stack(children: [
          Positioned(left: 0, child: _ring(ring)),
          Positioned(left: ring * 0.7, child: _ring(ring)),
        ]),
      ),
      SizedBox(width: fontSize * 0.35),
      Flexible(
        child: Text('Our app: $percent% lower',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.poppins(fontSize: fontSize, fontWeight: FontWeight.w800, color: _red, height: 1.2)),
      ),
    ]);
  }

  Widget _ring(double size) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: _pink, width: 1.4)),
      );
}
