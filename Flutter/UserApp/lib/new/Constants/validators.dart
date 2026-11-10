/// Field rules shared by every form, so each field says exactly what is wrong
/// ("Name can only have letters and spaces"), not just "required".
class V {
  V._();

  static String _t(String? v) => (v ?? '').trim();

  /// Not empty.
  static String? required(String? v, String label) => _t(v).isEmpty ? 'Please enter $label' : null;

  /// A person's name: letters, spaces, dots and apostrophes; 2-50 characters.
  static String? name(String? v, {String label = 'your name'}) {
    final s = _t(v);
    if (s.isEmpty) return 'Please enter $label';
    if (s.length < 2) return 'Name is too short';
    if (s.length > 50) return 'Name can be at most 50 characters';
    if (RegExp(r'\d').hasMatch(s)) return 'Name cannot contain numbers';
    if (!RegExp(r"^[A-Za-zऀ-ൿ][A-Za-zऀ-ൿ .']*$").hasMatch(s)) {
      return 'Name can only have letters and spaces';
    }
    return null;
  }

  /// Indian mobile number: 10 digits starting 6-9.
  static String? mobile(String? v) {
    final s = _t(v).replaceAll(RegExp(r'[\s-]'), '');
    if (s.isEmpty) return 'Please enter a mobile number';
    if (RegExp(r'\D').hasMatch(s)) return 'Mobile number can only have digits';
    if (s.length != 10) return 'Mobile number must be 10 digits';
    if (!RegExp(r'^[6-9]').hasMatch(s)) return 'Mobile number must start with 6, 7, 8 or 9';
    return null;
  }

  /// Optional email; checked only when filled.
  static String? email(String? v, {bool required = false}) {
    final s = _t(v);
    if (s.isEmpty) return required ? 'Please enter your email' : null;
    if (s.contains(' ')) return 'Email cannot have spaces';
    if (!RegExp(r'^[\w.+-]+@[\w-]+(\.[\w-]+)*\.[A-Za-z]{2,}$').hasMatch(s)) return 'Enter a valid email, like name@example.com';
    return null;
  }

  /// House / flat / block number: anything with a letter or digit, up to 60 characters.
  static String? flatNo(String? v) {
    final s = _t(v);
    if (s.isEmpty) return 'Please enter your house / flat / block number';
    if (!RegExp(r'[A-Za-z0-9]').hasMatch(s)) return 'Enter a house or flat number, e.g. 402 or B-12';
    if (s.length > 60) return 'Keep it under 60 characters';
    return null;
  }

  /// Landmark: at least 3 characters and some letters (not just numbers or symbols).
  static String? landmark(String? v) {
    final s = _t(v);
    if (s.isEmpty) return 'Please enter a landmark near you';
    if (s.length < 3) return 'Landmark is too short';
    if (!RegExp(r'[A-Za-zऀ-ൿ]').hasMatch(s)) return 'Landmark must have some words, e.g. Near Balaji Temple';
    if (s.length > 100) return 'Keep it under 100 characters';
    return null;
  }

  /// A label like "Mom's house" for an "Other" address.
  static String? label(String? v, {String what = 'a name for this address'}) {
    final s = _t(v);
    if (s.isEmpty) return 'Please enter $what';
    if (s.length > 30) return 'Keep it under 30 characters';
    if (!RegExp(r'[A-Za-z]').hasMatch(s)) return 'Use letters, e.g. Mom\'s house';
    return null;
  }

  /// Free text with a minimum and maximum length.
  static String? text(String? v, String label, {int min = 1, int max = 500}) {
    final s = _t(v);
    if (s.isEmpty) return 'Please enter $label';
    if (s.length < min) return '${label[0].toUpperCase()}${label.substring(1)} must be at least $min characters';
    if (s.length > max) return 'Keep it under $max characters';
    return null;
  }

  /// Whole rupees between [min] and [max].
  static String? amount(String? v, {int min = 1, int max = 100000, String label = 'an amount'}) {
    final s = _t(v);
    if (s.isEmpty) return 'Please enter $label';
    final n = int.tryParse(s);
    if (n == null) return 'Enter a whole number, like 200';
    if (n < min) return 'Minimum is ₹$min';
    if (n > max) return 'Maximum is ₹$max';
    return null;
  }

  /// Coupon codes: letters and digits only.
  static String? coupon(String? v) {
    final s = _t(v);
    if (s.isEmpty) return 'Please enter a coupon code';
    if (!RegExp(r'^[A-Za-z0-9]{3,20}$').hasMatch(s.replaceAll(' ', ''))) return 'Coupon codes have only letters and numbers';
    return null;
  }
}
