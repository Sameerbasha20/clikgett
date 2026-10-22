import 'package:fav_app/old/Models/Home/cart_model.dart';
import 'package:flutter_test/flutter_test.dart';

// MySQL DECIMAL columns reach the app as text; the cart must still load.
void main() {
  test('cart parses decimals sent as text', () {
    final model = CartModel.fromJson({
      'Status': 1,
      'Cart': {
        'CartID': 1,
        'UserID': 1,
        'DeliveryCharges': '32.00',
        'LongDistanceFee': 0,
        'CartItems': [
          {
            'ProductID': 1110,
            'Type': 1,
            'ProductName': 'Cola Zero',
            'VariantID': 5,
            'Quantity': 2,
            'metricvalue': '750.000',
            'metrictype': 'ml',
            'Price': '45.00',
            'OfferPrice': 42,
            'KitID': 0,
            'AvailableQty': 10,
            'KitItems': [],
            'ProductImages': [],
          }
        ],
      },
    });
    final item = model.cart!.cartItems!.first;
    expect(item.metricvalue, 750);
    expect(item.price, 45);
    expect(item.offerPrice, 42);
    expect(model.cart!.DeliveryCharges, 32);
  });
}
