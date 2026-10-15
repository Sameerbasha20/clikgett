/// Helper for authoritative identification of products belonging to the Fruits category.
///
/// Ensures compliance with ClikGett category architecture:
/// - Fresh Fruits: CategoryID 24 ("Vegetables & Fruits "), SubCategoryID 84 ("All Fruits")
/// - Dried Fruits: CategoryID 6 ("Dry Fruits"), SubCategoryID 17 ("Dried Fruits")
/// - Excludes Vegetables (SubCategoryID 87) even though they share CategoryID 24
/// - Excludes non-fruit categories (beverages, soaps, bakery, etc.)
/// - Does NOT use product-name matching to avoid false positives.
/// - Never assumes fruit if category data is missing or indeterminate.
class FruitCategoryHelper {
  static const int allFruitsSubCategoryId = 84;
  static const int vegetablesSubCategoryId = 87;
  static const int vegAndFruitsCategoryId = 24;
  static const int dryFruitsCategoryId = 6;
  static const int driedFruitsSubCategoryId = 17;

  /// Returns true if the provided category / subcategory data authoritatively
  /// identifies a fruit product.
  static bool isFruitCategory({
    int? categoryId,
    int? subCategoryId,
    String? categoryName,
    String? subCategoryName,
  }) {
    // 1. Missing or uninitialized data cannot be assumed to be fruit
    if ((categoryId == null || categoryId == 0) &&
        (subCategoryId == null || subCategoryId == 0) &&
        (categoryName == null || categoryName.trim().isEmpty) &&
        (subCategoryName == null || subCategoryName.trim().isEmpty)) {
      return false;
    }

    // 2. Explicitly reject vegetables (which share CategoryID 24)
    if (subCategoryId == vegetablesSubCategoryId) {
      return false;
    }
    if (subCategoryName != null &&
        subCategoryName.trim().toLowerCase() == 'vegetables') {
      return false;
    }

    // 3. Authoritative fruit subcategory IDs
    if (subCategoryId == allFruitsSubCategoryId ||
        subCategoryId == driedFruitsSubCategoryId) {
      return true;
    }

    // 4. Subcategory name matching
    if (subCategoryName != null &&
        subCategoryName.toLowerCase().contains('fruit')) {
      return true;
    }

    // 5. Category 24 ("Vegetables & Fruits ")
    if (categoryId == vegAndFruitsCategoryId) {
      // Under Category 24, must be All Fruits (SubCategory 84) or fruit subcategory
      if (subCategoryId == allFruitsSubCategoryId) {
        return true;
      }
      if (subCategoryName != null &&
          subCategoryName.toLowerCase().contains('fruit')) {
        return true;
      }
      // If subcategory is missing or non-fruit under Category 24, do not assume fruit
      return false;
    }

    // 6. Category 6 ("Dry Fruits")
    if (categoryId == dryFruitsCategoryId) {
      return true;
    }

    // 7. Authoritative category name check
    if (categoryName != null) {
      final cleanCat = categoryName.trim().toLowerCase();
      if (cleanCat == 'fruits' ||
          cleanCat == 'fresh fruits' ||
          cleanCat == 'dry fruits' ||
          cleanCat == 'all fruits') {
        return true;
      }
    }

    return false;
  }
}
