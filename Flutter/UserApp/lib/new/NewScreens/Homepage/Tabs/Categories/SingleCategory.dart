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
              const VerticalDivider(width: 1, color: cardBorder),
              Expanded(child: _grid()),
            ],
          ),
          const Positioned(left: 0, right: 0, bottom: 12, child: FloatingCartBar()),
        ],
      ),
    );
  }

  Widget _rail() {
    if (_loadingSubs) {
      return const SizedBox(width: 84, child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: primary)));
    }
    final items = <SubCategoryItem?>[null, ..._subcategories];
    return SizedBox(
      width: 84,
      child: ListView.builder(
        padding: const EdgeInsets.only(bottom: 100),
        itemCount: items.length,
        itemBuilder: (_, i) {
          final sub = items[i];
          final selected = sub?.id == _selected?.id;
          final label = sub?.name ?? 'All';
          return InkWell(
            onTap: () => _select(sub),
            child: Container(
              padding: const EdgeInsets.fromLTRB(6, 10, 6, 10),
              decoration: BoxDecoration(
                color: selected ? primaryGhost : null,
                border: Border(right: BorderSide(color: selected ? primary : Colors.transparent, width: 3)),
              ),
              child: Column(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    clipBehavior: Clip.antiAlias,
                    decoration: BoxDecoration(color: selected ? white : bg3, shape: BoxShape.circle),
                    child: sub?.imageUrl != null
                        ? CustomNetworkImage(url: sub!.imageUrl!, fit: BoxFit.cover)
                        : Center(
                            child: sub == null
                                ? const Icon(Icons.grid_view_rounded, color: primaryDark, size: 22)
                                : Text(label.isNotEmpty ? label[0].toUpperCase() : '?',
                                    style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700, color: primaryDark)),
                          ),
                  ),
                  const SizedBox(height: 5),
                  Text(label,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(
                          fontSize: 10.5,
                          height: 1.2,
                          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                          color: selected ? tColor : tColor3)),
                ],
              ),
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
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        mainAxisExtent: 258,
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
