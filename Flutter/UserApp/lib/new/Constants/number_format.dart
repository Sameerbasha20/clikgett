/// Number display for prices and pack sizes: no trailing ".0" / ".000".
///   44.0 -> "44", "50.000" -> "50", 167.24 -> "167.24", 0.5 -> "0.5"
String cleanNumber(dynamic value) {
  if (value == null) return '';
  final n = value is num ? value.toDouble() : double.tryParse(value.toString().trim());
  if (n == null) return value.toString();
  if (n == n.roundToDouble()) return n.toStringAsFixed(0);
  return n.toStringAsFixed(2).replaceFirst(RegExp(r'0+$'), '');
}

/// "₹44", "₹4.80", "₹167.24": whole rupees without decimals, paise always as two digits.
String money(dynamic value) {
  if (value == null) return '₹';
  final n = value is num ? value.toDouble() : double.tryParse(value.toString().trim());
  if (n == null) return '₹$value';
  return '₹${n == n.roundToDouble() ? n.toStringAsFixed(0) : n.toStringAsFixed(2)}';
}

/// "50 gms", "1.5 kg"
String packSize(dynamic value, dynamic type) => '${cleanNumber(value)} ${type ?? ''}'.trim();

// ---- Product prices on the shelf (cards, product page, search) ----
// Shown in whole rupees, and a discount only counts when the rounded offer is
// lower than the rounded MRP: ₹5 MRP / ₹4.80 offer shows just "₹5";
// ₹20 MRP / ₹19 offer shows "₹19 ~₹20~". Bills keep exact paise (money()).

num? _num(dynamic v) => v is num ? v : double.tryParse('${v ?? ''}'.trim());

/// "₹5" for 4.80.
String shelfPrice(dynamic value) {
  final n = _num(value);
  return n == null ? '₹' : '₹${n.round()}';
}

/// Whole-rupee discount %, 0 when there is no real (rounded) saving.
int shelfDiscountPercent(dynamic mrp, dynamic price) {
  final m = _num(mrp)?.round() ?? 0;
  final p = _num(price)?.round() ?? 0;
  if (m <= 0 || p <= 0 || p >= m) return 0;
  return ((m - p) / m * 100).round();
}

bool shelfHasDiscount(dynamic mrp, dynamic price) => shelfDiscountPercent(mrp, price) > 0;
