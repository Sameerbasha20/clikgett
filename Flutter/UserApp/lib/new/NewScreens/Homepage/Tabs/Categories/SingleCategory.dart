import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/NewScreens/Homepage/SearchScreen.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/clikgett_product_card.dart';
import 'package:fav_app/new/NewScreens/Widgets/floating_cart_bar.dart';
import 'package:fav_app/new/Services/storefront_services.dart';
import 'package:fav_app/old/Models/Home/home_model.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Category browser: subcategories on a left rail, products of the selected
/// subcategory in a 2-column grid on the right (Blinkit layout).
class SingleCategory extends StatefulWidget {
  const SingleCategory(
      {super.key,
      required this.categories,
      this.isFromHomeScreen = false,
      this.subCategory = false,
      this.backtoCategories = false,
      this.initialSubCategoryId});

  final SpecialCategory categories;
  final bool? isFromHomeScreen;
  final bool? subCategory;
  final bool? backtoCategories;

  /// Opens with this subcategory selected (e.g. from a banner).
  final int? initialSubCategoryId;

  @override
  State<SingleCategory> createState() => _SingleCategoryState();
}

class _SingleCategoryState extends State<SingleCategory> {
  static const _sortOptions = {
    '': 'Relevance',
    'price_asc': 'Price: low to high',
    'price_desc': 'Price: high to low',
    'discount': 'Biggest discount',
  };

  final ScrollController _scroll = ScrollController();
  List<SubCategoryItem> _subcategories = [];
  SubCategoryItem? _selected; // null = all products in the category
  final List<BestItem> _products = [];
  int _nextOffset = 0;
  bool _loadingSubs = true;
  bool _loadingPage = false;
  bool _error = false;
  String _sort = '';

  int get _categoryId => widget.categories.categoryId ?? 0;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 400) _loadMore();
    });
    _loadSubcategories();
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _loadSubcategories() async {
    try {
      final subs = await StorefrontServices.subcategories(_categoryId);
      if (!mounted) return;
      setState(() {
        _subcategories = subs;
        _loadingSubs = false;
        for (final sub in subs) {
          if (sub.id == widget.initialSubCategoryId) _selected = sub;
        }
      });
    } catch (_) {
      if (mounted) setState(() => _loadingSubs = false);
    }
    _reload();
  }

  void _reload() {
    _products.clear();
    _nextOffset = 0;
    _error = false;
    if (_scroll.hasClients) _scroll.jumpTo(0);
    _loadMore();
  }

  Future<void> _loadMore() async {
    if (_loadingPage || _nextOffset < 0) return;
    setState(() => _loadingPage = true);
    try {
      final page = await StorefrontServices.categoryProducts(
        categoryId: _categoryId,
        subCategoryId: _selected?.id,
        offset: _nextOffset,
        sort: _sort,
      );
      if (!mounted) return;
      setState(() {
        _products.addAll(page.products);
        _nextOffset = page.nextOffset;
        _loadingPage = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = true;
          _loadingPage = false;
        });
      }
    }
  }

  void _select(SubCategoryItem? sub) {
    if (sub?.id == _selected?.id) return;
    setState(() => _selected = sub);
    _reload();
  }

  @override
  Widget build(BuildContext context) {
    final title = (widget.categories.categoryName ?? '').trim();
    return Scaffold(
      backgroundColor: white,
      appBar: AppBar(
        backgroundColor: white,
        foregroundColor: tColor,
        elevation: 0.5,
        titleSpacing: 0,
        title: Text(title, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700)),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SearchScreen())),
          ),
          PopupMenuButton<String>(
            tooltip: 'Sort',
            icon: const Icon(Icons.sort_rounded),
            initialValue: _sort,
            onSelected: (v) {
              setState(() => _sort = v);
              _reload();
            },
            itemBuilder: (_) => _sortOptions.entries
                .map((e) => PopupMenuItem(
                      value: e.key,
                      child: Text(e.value, style: GoogleFonts.poppins(fontSize: 13, fontWeight: e.key == _sort ? FontWeight.w700 : FontWeight.w400)),
                    ))
                .toList(),
          ),
        ],
      ),
      body: Stack(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _rail(),
              Expanded(child: _grid()),
            ],
          ),
          const Positioned(left: 0, right: 0, bottom: 12, child: FloatingCartBar()),
        ],
      ),
    );
  }

  static const _railTints = [
    Color(0xFFE8F5E9), Color(0xFFFFF3E0), Color(0xFFE3F2FD), Color(0xFFFCE4EC),
    Color(0xFFF3E5F5), Color(0xFFFFFDE7), Color(0xFFE0F7FA), Color(0xFFEFEBE9),
  ];

  /// An icon that fits the subcategory name, for subcategories without a picture.
  static IconData _railIcon(String name) {
    final n = name.toLowerCase();
    const map = <String, IconData>{
      'oil': Icons.water_drop_outlined,
      'ghee': Icons.water_drop_outlined,
      'shampoo': Icons.soap_outlined,
      'soap': Icons.soap_outlined,
      'wash': Icons.local_laundry_service_outlined,
      'detergent': Icons.local_laundry_service_outlined,
      'clean': Icons.cleaning_services_outlined,
      'colour': Icons.palette_outlined,
      'color': Icons.palette_outlined,
      'hair': Icons.face_retouching_natural_outlined,
      'tea': Icons.emoji_food_beverage_outlined,
      'coffee': Icons.coffee_outlined,
      'juice': Icons.local_drink_outlined,
      'drink': Icons.local_drink_outlined,
      'milk': Icons.local_drink_outlined,
      'biscuit': Icons.cookie_outlined,
      'cookie': Icons.cookie_outlined,
      'chocolate': Icons.cookie_outlined,
      'rice': Icons.rice_bowl_outlined,
      'atta': Icons.bakery_dining_outlined,
      'flour': Icons.bakery_dining_outlined,
      'bread': Icons.bakery_dining_outlined,
      'masala': Icons.local_fire_department_outlined,
      'spice': Icons.local_fire_department_outlined,
      'fruit': Icons.apple,
      'vegetable': Icons.eco_outlined,
      'dal': Icons.grain_outlined,
      'pulse': Icons.grain_outlined,
      'snack': Icons.fastfood_outlined,
      'namkeen': Icons.fastfood_outlined,
      'noodle': Icons.ramen_dining_outlined,
      'sugar': Icons.icecream_outlined,
      'salt': Icons.grain_outlined,
      'dry': Icons.spa_outlined,
      'nut': Icons.spa_outlined,
      'baby': Icons.child_care_outlined,
      'tooth': Icons.clean_hands_outlined,
      'skin': Icons.face_outlined,
      'cream': Icons.face_outlined,
    };
    for (final e in map.entries) {
      if (n.contains(e.key)) return e.value;
    }
    return Icons.shopping_basket_outlined;
  }

  /// Subcategory rail: tinted tiles, the selected one lifted onto white with a green bar.
  Widget _rail() {
    if (_loadingSubs) {
      return const SizedBox(width: 88, child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: primary)));
    }
    final items = <SubCategoryItem?>[null, ..._subcategories];
    final categoryImage = widget.categories.imageUrl;
    return Container(
      width: 88,
      color: bg1,
      child: ListView.builder(
        padding: const EdgeInsets.only(top: 6, bottom: 100),
        itemCount: items.length,
        itemBuilder: (_, i) {
          final sub = items[i];
          final selected = sub?.id == _selected?.id;
          final label = sub?.name ?? 'All';
          final image = sub == null ? categoryImage : sub.imageUrl;
          final tint = _railTints[i % _railTints.length];
          return GestureDetector(
            onTap: () => _select(sub),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOut,
              margin: const EdgeInsets.only(bottom: 4, right: 6),
              padding: const EdgeInsets.fromLTRB(8, 10, 6, 10),
              decoration: BoxDecoration(
                color: selected ? white : Colors.transparent,
                borderRadius: const BorderRadius.horizontal(right: Radius.circular(16)),
                boxShadow: selected ? softCardShadow : null,
              ),
              child: Stack(clipBehavior: Clip.none, children: [
                Column(children: [
                  AnimatedScale(
                    scale: selected ? 1.08 : 1,
                    duration: const Duration(milliseconds: 220),
                    child: Container(
                      width: 54,
                      height: 54,
                      clipBehavior: Clip.antiAlias,
                      decoration: BoxDecoration(
                        color: selected ? primaryGhost : tint,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: selected ? primary : Colors.transparent, width: 1.5),
                      ),
                      child: image != null && image.isNotEmpty
                          ? Padding(padding: const EdgeInsets.all(4), child: CustomNetworkImage(url: image, fit: BoxFit.contain))
                          : Icon(sub == null ? Icons.grid_view_rounded : _railIcon(label),
                              color: selected ? primaryDark : tColor4, size: 26),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(label,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(
                          fontSize: 10.5,
                          height: 1.2,
                          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                          color: selected ? primaryDark : tColor3)),
                ]),
                Positioned(
                  left: -8,
                  top: 6,
                  bottom: 6,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    width: 4,
                    decoration: BoxDecoration(
                      color: selected ? primary : Colors.transparent,
                      borderRadius: const BorderRadius.horizontal(right: Radius.circular(4)),
                    ),
                  ),
                ),
              ]),
            ),
          );
        },
      ),
    );
  }

  Widget _grid() {
    if (_products.isEmpty && _loadingPage) {
      return const Center(child: CircularProgressIndicator(color: primary));
    }
    if (_products.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(_error ? Icons.wifi_off_rounded : Icons.inventory_2_outlined, size: 44, color: grey70),
              const SizedBox(height: 10),
              Text(_error ? 'Could not load products' : 'No products here yet',
                  textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 13.5, color: tColor3)),
              if (_error) TextButton(onPressed: _reload, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }
    return GridView.builder(
      controller: _scroll,
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 110),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        mainAxisExtent: ClikgettProductCard.heightFor(context),
      ),
      itemCount: _products.length + (_nextOffset >= 0 ? 1 : 0),
      itemBuilder: (_, i) {
        if (i >= _products.length) {
          return const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator(strokeWidth: 2, color: primary)));
        }
        final p = _products[i];
        return ClikgettProductCard(key: ValueKey('cat-${p.productId}'), product: p, width: null);
      },
    );
  }
}
