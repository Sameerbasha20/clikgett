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
