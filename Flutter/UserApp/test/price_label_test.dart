import 'package:fav_app/new/Services/checkout_services.dart';
import 'package:flutter_test/flutter_test.dart';

BillItem item(String? rule, {String name = 'Durga Ghee Pouch 1 L', String type = 'Ltr', String value = '1'}) =>
    BillItem.fromJson({'ProductName': name, 'metrictype': type, 'metricvalue': value, 'AppliedRule': rule});

void main() {
  test('multi-buy offers are called Max Saver', () {
    expect(item('Buy More Slab (2-5 @ ₹10.00/unit)').priceLabel, 'Max Saver price');
    expect(item('Buy 2 Special Price (2 for ₹77.00)').priceLabel, 'Max Saver price');
  });
  test('a multi-pack at its normal offer price is a Max Saver pack', () {
    expect(item('Standard Offer Price', type: 'Ltr x 2').priceLabel, 'Max Saver pack');
  });
  test('words that only contain an x are not packs', () {
    expect(item('Standard Offer Price', name: 'Tissue Box 2 ply', type: 'pcs').priceLabel, isNull);
  });
  test('a plain offer price has no label', () {
    expect(item('Standard Offer Price').priceLabel, isNull);
    expect(item(null).priceLabel, isNull);
  });
  test('other offers get plain names', () {
    expect(item('Flash Sale: Diwali (10% off)').priceLabel, 'Flash sale price');
    expect(item('Membership Exclusive Price (Gold)').priceLabel, 'Member price');
    expect(item('Special Unlock Price (₹1.00)').priceLabel, 'Unlocked deal price');
  });
}
