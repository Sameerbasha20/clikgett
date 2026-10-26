import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/Widgets/customToast.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:fav_app/old/Models/Home/home_model.dart' as home_model show BulkTier;
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

String _rs(double v) => '₹${v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(2)}';

class _Pack {
  final int quantity;
  final String label;
  final double total;
  final double mrp;
  final String? note;
  const _Pack(this.quantity, this.label, this.total, this.mrp, {this.note});
}

/// "Select unit" on the product page (Blinkit style): the single pack plus its
/// buy-more options, e.g. "750 ml ₹39" | "2 x 750 ml ₹77". Tapping a card puts that
/// many in the cart. Hidden when the pack has no buy-more price.
class PackOptions extends StatelessWidget {
  final int productId;
  final int variantId;
  final String unit;
  final double price;
  final double mrp;
  final List<home_model.BulkTier> tiers;
  final double? buy2Price;
  final int maxQty;
  final int? categoryId;
  final int? subCategoryId;

  const PackOptions({
    super.key,
    required this.productId,
    required this.variantId,
    required this.unit,
    required this.price,
    required this.mrp,
    required this.tiers,
    this.buy2Price,
    this.maxQty = 0,
    this.categoryId,
    this.subCategoryId,
  });

  List<_Pack> get _packs {
    final base = unit.trim().isEmpty ? '1 unit' : unit.trim();
    final unitMrp = mrp > price ? mrp : price;
    final byQty = <int, _Pack>{1: _Pack(1, base, price, unitMrp)};
    for (final t in tiers) {
      if (t.variantId != null && t.variantId != variantId) continue;
      if (t.minQuantity < 2) continue;
      final n = t.minQuantity;
      final pack = t.isBundle
          ? _Pack(n, '$n x $base', t.price, unitMrp * n)
          : _Pack(n, '$n+ x $base', t.price * n, unitMrp * n, note: '${_rs(t.price)} each');
      if (pack.total < price * n && (byQty[n] == null || pack.total < byQty[n]!.total)) byQty[n] = pack;
    }
    final b2 = buy2Price ?? 0;
    if (b2 > 0 && b2 < price && byQty[2] == null) byQty[2] = _Pack(2, '2 x $base', b2 * 2, unitMrp * 2);
    return byQty.values.toList()..sort((a, b) => a.quantity.compareTo(b.quantity));
  }

  Future<void> _choose(BuildContext context, _Pack pack) async {
    final token = await CommonServices.getToken();
    if (!context.mounted) return;
    if (token.isEmpty) {
      customToast(message: 'Please login to add items to your cart');
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => Login()));
      return;
    }
    if (maxQty > 0 && pack.quantity > maxQty) {
      customToast(message: 'Only $maxQty available');
      return;
    }
    await Get.find<CartController>().updateQuantity(
      productId: productId,
      variantId: variantId,
      quantity: pack.quantity,
      removeToast: true,
      isThroughDescriptionScreen: true,
      isFromCartScreen: true,
      categoryId: categoryId,
      subCategoryId: subCategoryId,
      context: context,
    );
  }

  @override
  Widget build(BuildContext context) {
    final packs = _packs;
    if (packs.length < 2) return const SizedBox.shrink();
    final cart = Get.find<CartController>();
    return Padding(
      padding: const EdgeInsets.only(top: 14, bottom: 6),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Select unit', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: tColor)),
        const SizedBox(height: 10),
        Obx(() {
          final inCart = cart.cartItems.firstWhereOrNull((c) => c.productId == productId && c.variantId == variantId)?.quantity ?? 0;
          return SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              for (final p in packs) _card(context, p, selected: inCart == p.quantity, disabled: maxQty > 0 && p.quantity > maxQty),
            ]),
          );
        }),
      ]),
    );
  }

  Widget _card(BuildContext context, _Pack p, {required bool selected, required bool disabled}) {
    final saving = price * p.quantity - p.total;
    return GestureDetector(
      onTap: disabled ? null : () => _choose(context, p),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: 150,
        margin: const EdgeInsets.only(right: 10),
        padding: const EdgeInsets.fromLTRB(14, 10, 12, 10),
        decoration: BoxDecoration(
          color: selected ? primaryGhost : white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected ? primary : cardBorder, width: selected ? 1.6 : 1),
        ),
        child: Opacity(
          opacity: disabled ? 0.45 : 1,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(p.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: tColor)),
            const SizedBox(height: 4),
            Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text(_rs(p.total), style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w800, color: tColor)),
              const SizedBox(width: 6),
              if (p.mrp > p.total)
                Flexible(
                  child: Text('MRP ${_rs(p.mrp)}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(fontSize: 11, color: grey70, decoration: TextDecoration.lineThrough)),
                ),
            ]),
            if (p.note != null) Text(p.note!, style: GoogleFonts.poppins(fontSize: 11, color: tColor3)),
            if (p.quantity > 1 && saving > 0.5)
              Container(
                margin: const EdgeInsets.only(top: 4),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(5)),
                child: Text('Save ${_rs(saving)}',
                    style: GoogleFonts.poppins(fontSize: 10.5, fontWeight: FontWeight.w700, color: primaryDark)),
              ),
          ]),
        ),
      ),
    );
  }
}
