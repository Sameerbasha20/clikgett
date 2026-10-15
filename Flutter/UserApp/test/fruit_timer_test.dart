import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:get/get.dart';
import 'package:fav_app/new/Constants/fruit_category_helper.dart';
import 'package:fav_app/new/Controllers/cart_controller.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Fruit Category Detection Tests', () {
    test('CASE 1: Fresh Fruit (SubCategoryID: 84 All Fruits, CategoryID: 24) -> Identified as Fruit', () {
      expect(
        FruitCategoryHelper.isFruitCategory(
          categoryId: 24,
          subCategoryId: 84,
          categoryName: 'Vegetables & Fruits',
          subCategoryName: 'All Fruits',
        ),
        isTrue,
      );
    });

    test('CASE 2: Vegetable (SubCategoryID: 87, CategoryID: 24) -> NOT Fruit', () {
      expect(
        FruitCategoryHelper.isFruitCategory(
          categoryId: 24,
          subCategoryId: 87,
          categoryName: 'Vegetables & Fruits',
          subCategoryName: 'Vegetables',
        ),
        isFalse,
      );
    });

    test('CASE 3: Dry Fruits (CategoryID: 6, SubCategoryID: 17 Dried Fruits) -> Identified as Fruit', () {
      expect(
        FruitCategoryHelper.isFruitCategory(
          categoryId: 6,
          subCategoryId: 17,
          categoryName: 'Dry Fruits',
          subCategoryName: 'Dried Fruits',
        ),
        isTrue,
      );
    });

    test('CASE 4: Non-Fruit Category (CategoryID: 1 Tea/Coffee, CategoryID: 3 Oils) -> NOT Fruit', () {
      expect(
        FruitCategoryHelper.isFruitCategory(
          categoryId: 1,
          subCategoryId: 1,
          categoryName: 'Tea, Coffee, Energy Drinks...',
          subCategoryName: 'Tea',
        ),
        isFalse,
      );
      expect(
        FruitCategoryHelper.isFruitCategory(
          categoryId: 3,
          subCategoryId: 5,
          categoryName: 'Oils & Ghee',
        ),
        isFalse,
      );
    });

    test('CASE 5: Missing or null category info -> Never assumed to be Fruit', () {
      expect(FruitCategoryHelper.isFruitCategory(), isFalse);
      expect(FruitCategoryHelper.isFruitCategory(categoryId: null, subCategoryId: null), isFalse);
      expect(FruitCategoryHelper.isFruitCategory(categoryId: 0, subCategoryId: 0), isFalse);
      expect(FruitCategoryHelper.isFruitCategory(categoryName: '', subCategoryName: ''), isFalse);
    });

    test('CASE 6: Authoritative category check ignores product name', () {
      // A fruit-flavored beverage (e.g. CategoryID 7 Cooldrinks, SubCategoryID 20 Fruit Juices vs soft drink)
      // Products named "Fruit" in non-fruit categories are not fruits unless their category indicates so
      expect(
        FruitCategoryHelper.isFruitCategory(
          categoryId: 2, // Oral Care
          subCategoryId: 4,
          categoryName: 'Oral Care',
          subCategoryName: 'Toothpaste',
        ),
        isFalse,
      );
    });
  });

  group('Cart Controller Fruit Timer Extension Tests', () {
    late CartController cartController;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      Get.reset();
      cartController = Get.put(CartController());
      await cartController.initTimerFromPreferences();
    });

    tearDown(() async {
      await cartController.resetTimer();
      Get.delete<CartController>();
    });

    test('1. Adding one fruit product extends the timer by 10 minutes', () async {
      expect(cartController.fruitExtensionMinutes.value, equals(0));
      expect(cartController.isTimerRunning.value, isFalse);

      // Simulate successful fruit addition
      await cartController.extendTimerForFruit(
        productId: 870, // Banana
        variantId: 870,
        quantity: 1,
      );

      expect(cartController.fruitExtensionMinutes.value, equals(10));
      expect(cartController.isTimerRunning.value, isTrue);
      expect(cartController.timerEndTime.value, isNotNull);
      // Baseline 30 mins + 10 mins extension = ~40 mins
      final remainingMins = cartController.remainingDeliveryDuration.value.inMinutes;
      expect(remainingMins >= 39 && remainingMins <= 40, isTrue);
    });

    test('2. Adding a second distinct fruit addition further extends by 10 minutes', () async {
      // First fruit addition
      await cartController.extendTimerForFruit(
        productId: 870,
        variantId: 870,
        quantity: 1,
      );
      final initialEndTime = cartController.timerEndTime.value!;
      expect(cartController.fruitExtensionMinutes.value, equals(10));

      // Second fruit addition (Apples)
      await cartController.extendTimerForFruit(
        productId: 872,
        variantId: 872,
        quantity: 1,
      );
      expect(cartController.fruitExtensionMinutes.value, equals(20));
      expect(
        cartController.timerEndTime.value!.difference(initialEndTime).inMinutes,
        equals(10),
      );
    });

    test('3. Repeated taps / duplicate callbacks do not cause unintended duplicate extensions', () async {
      // First addition
      await cartController.extendTimerForFruit(
        productId: 870,
        variantId: 870,
        quantity: 1,
      );
      expect(cartController.fruitExtensionMinutes.value, equals(10));

      // Duplicate callback with identical productId, variantId, and quantity
      await cartController.extendTimerForFruit(
        productId: 870,
        variantId: 870,
        quantity: 1,
      );
      // Must still be 10, not 20!
      expect(cartController.fruitExtensionMinutes.value, equals(10));
    });

    test('4. Timer continues counting down correctly and preserves persistence', () async {
      final now = DateTime.now();
      final targetEnd = now.add(const Duration(minutes: 40));

      // Persist state representing an existing active countdown across app restarts
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(CartController.kFruitTimerEndKey, targetEnd.toIso8601String());
      await prefs.setInt(CartController.kFruitExtensionMinutesKey, 10);

      // Reinitialize controller to simulate app reopen
      final reopenedController = CartController();
      await reopenedController.initTimerFromPreferences();

      expect(reopenedController.isTimerRunning.value, isTrue);
      expect(reopenedController.fruitExtensionMinutes.value, equals(10));
      expect(reopenedController.timerEndTime.value!.difference(targetEnd).inSeconds.abs() <= 1, isTrue);
      expect(reopenedController.remainingDeliveryDuration.value.inMinutes >= 39, isTrue);

      await reopenedController.resetTimer();
    });

    test('5. Reset behavior clears timer state and preferences', () async {
      await cartController.extendTimerForFruit(
        productId: 870,
        variantId: 870,
        quantity: 1,
      );
      expect(cartController.isTimerRunning.value, isTrue);

      await cartController.resetTimer();

      expect(cartController.isTimerRunning.value, isFalse);
      expect(cartController.fruitExtensionMinutes.value, equals(0));
      expect(cartController.timerEndTime.value, isNull);
      expect(cartController.remainingDeliveryDuration.value, equals(Duration.zero));

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString(CartController.kFruitTimerEndKey), isNull);
    });

    test('6. Non-fruit products do not trigger timer extension', () async {
      // Non-fruit category (Oral Care, Toothpaste: Cat 2, SubCat 4)
      final bool isFruit = FruitCategoryHelper.isFruitCategory(
        categoryId: 2,
        subCategoryId: 4,
        categoryName: 'Oral Care',
      );
      expect(isFruit, isFalse);

      // Verify timer remains unchanged
      expect(cartController.fruitExtensionMinutes.value, equals(0));
      expect(cartController.isTimerRunning.value, isFalse);
    });

    test('7. Missing category info does not trigger timer extension', () {
      final bool isFruit = FruitCategoryHelper.isFruitCategory(
        categoryId: null,
        subCategoryId: null,
      );
      expect(isFruit, isFalse);
      expect(cartController.fruitExtensionMinutes.value, equals(0));
    });
  });
}
