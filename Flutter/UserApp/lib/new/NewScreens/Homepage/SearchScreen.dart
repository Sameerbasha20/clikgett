import 'package:fav_app/new/Constants/number_format.dart';
import 'dart:async';
import 'dart:convert';

import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/Constants/network_image.dart';
import 'package:fav_app/new/NewScreens/Homepage/ItemDescription.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/clikgett_product_card.dart';
import 'package:fav_app/new/NewScreens/Support/widgets/search_product_request_card.dart';
import 'package:fav_app/new/NewScreens/Widgets/floating_cart_bar.dart';
import 'package:fav_app/new/Services/common/intercepter.dart';
import 'package:fav_app/old/Models/Home/home_model.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart';
import 'package:http_interceptor/http/intercepted_client.dart';
import 'package:shared_preferences/shared_preferences.dart';

final Client _client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

/// Product search: live suggestions while typing, full results on submit,
/// recent + popular searches and recommendations when the box is empty.
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key, this.isFromHomeScreen = false});

  final bool isFromHomeScreen;

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _Suggestion {
  final int productId;
  final String name;
  final String category;
  final String imageUrl;
  final double price;

  _Suggestion.fromJson(Map<String, dynamic> j)
      : productId = (j['ProductID'] as num?)?.toInt() ?? 0,
        name = '${j['ProductName'] ?? ''}'.trim(),
        category = '${j['CategoryName'] ?? ''}'.trim(),
        imageUrl = '${j['ImageUrl'] ?? ''}',
        price = (j['OfferPrice'] as num?)?.toDouble() ?? 0;
}

class _SearchScreenState extends State<SearchScreen> {
  static const _recentKey = 'recent_searches';

  final TextEditingController _query = TextEditingController();
  final FocusNode _focus = FocusNode();
  Timer? _debounce;

  List<String> _recent = [];
  List<String> _popular = [];
  List<BestItem> _recommended = [];
  List<_Suggestion> _suggestions = [];
  List<BestItem>? _results; // null = not searched yet
  String _resultsFor = '';
  bool _searching = false;

  @override
  void initState() {
    super.initState();
    _loadEmptyState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _focus.requestFocus());
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _query.dispose();
    _focus.dispose();
    super.dispose();
  }

  Future<void> _loadEmptyState() async {
    final prefs = await SharedPreferences.getInstance();
    _recent = prefs.getStringList(_recentKey) ?? [];
    if (mounted) setState(() {});
    try {
      final popular = await _getJson('/products/suggestions?q=');
      final rec = await _getJson('/products/recommendedproducts');
      if (!mounted) return;
      setState(() {
        _popular = ((popular['PopularSearches'] as List?) ?? []).map((e) => '$e').toList();
        _recommended = ((rec['BestItems'] as List?) ?? [])
            .map((e) => BestItem.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      });
    } catch (_) {
      // Empty state stays minimal if these fail.
    }
  }

  Future<Map<String, dynamic>> _getJson(String path) async {
    final res = await _client.get(Uri.parse('${Constants.baseUrl}$path'));
    final data = jsonDecode(res.body);
    return data is Map<String, dynamic> ? data : {};
  }

  void _onChanged(String text) {
    _debounce?.cancel();
    setState(() {
      if (text.trim() != _resultsFor) _results = null;
    });
    if (text.trim().length < 2) {
      setState(() => _suggestions = []);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 300), () async {
      try {
        final data = await _getJson('/products/suggestions?q=${Uri.encodeQueryComponent(text.trim())}');
        if (!mounted || _query.text.trim() != text.trim()) return;
        setState(() {
          _suggestions = ((data['Suggestions'] as List?) ?? [])
              .map((e) => _Suggestion.fromJson(Map<String, dynamic>.from(e)))
              .toList();
        });
      } catch (_) {}
    });
  }

  Future<void> _search(String text) async {
    final q = text.trim();
    if (q.isEmpty) return;
    _debounce?.cancel();
    _query.text = q;
    _query.selection = TextSelection.collapsed(offset: q.length);
    _focus.unfocus();
    setState(() {
      _searching = true;
      _suggestions = [];
    });
    _remember(q);
    try {
      final data = await _getJson('/products/search/${Uri.encodeComponent(q)}');
      final list = ((data['Products'] as List?) ?? [])
          .map((e) => BestItem.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      if (!mounted) return;
      setState(() {
        _results = list;
        _resultsFor = q;
        _searching = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _results = [];
        _resultsFor = q;
        _searching = false;
      });
    }
  }

  Future<void> _remember(String q) async {
    _recent.removeWhere((r) => r.toLowerCase() == q.toLowerCase());
    _recent.insert(0, q);
    if (_recent.length > 8) _recent = _recent.sublist(0, 8);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_recentKey, _recent);
  }

  Future<void> _clearRecent() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_recentKey);
    setState(() => _recent = []);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: white,
      appBar: AppBar(
        backgroundColor: white,
        foregroundColor: tColor,
        elevation: 0.5,
        titleSpacing: 0,
        title: Container(
          height: 42,
          margin: const EdgeInsets.only(right: 12),
          decoration: BoxDecoration(color: bg3, borderRadius: BorderRadius.circular(10)),
          child: TextField(
            controller: _query,
            focusNode: _focus,
            textInputAction: TextInputAction.search,
            onChanged: _onChanged,
            onSubmitted: _search,
            style: GoogleFonts.poppins(fontSize: 14, color: tColor),
            decoration: InputDecoration(
              border: InputBorder.none,
              hintText: 'Search for products',
              hintStyle: GoogleFonts.poppins(fontSize: 14, color: grey70),
              prefixIcon: const Icon(Icons.search_rounded, color: tColor3),
              suffixIcon: _query.text.isEmpty
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.close_rounded, color: tColor3, size: 20),
                      onPressed: () {
                        _query.clear();
                        _onChanged('');
                        _focus.requestFocus();
                      },
                    ),
              contentPadding: const EdgeInsets.symmetric(vertical: 11),
            ),
          ),
        ),
      ),
      body: Stack(
        children: [
          _body(),
          const Positioned(left: 0, right: 0, bottom: 12, child: FloatingCartBar()),
        ],
      ),
    );
  }

  Widget _body() {
    if (_searching) return const Center(child: CircularProgressIndicator(color: primary));
    if (_suggestions.isNotEmpty && _results == null) return _suggestionList();
    if (_results != null) return _resultsView();
    return _emptyState();
  }

  Widget _suggestionList() {
    return ListView.separated(
      padding: const EdgeInsets.only(bottom: 100),
      itemCount: _suggestions.length + 1,
      separatorBuilder: (_, __) => const Divider(height: 1, indent: 68),
      itemBuilder: (_, i) {
        if (i == _suggestions.length) {
          return ListTile(
            leading: const Icon(Icons.search_rounded, color: primaryDark),
            title: Text('See all results for "${_query.text.trim()}"',
                style: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w600, color: primaryDark)),
            onTap: () => _search(_query.text),
          );
        }
        final s = _suggestions[i];
        return ListTile(
          leading: Container(
            width: 44,
            height: 44,
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(color: bg1, borderRadius: BorderRadius.circular(8)),
            child: CustomNetworkImage(url: s.imageUrl, fit: BoxFit.contain),
          ),
          title: Text(s.name, maxLines: 1, overflow: TextOverflow.ellipsis,
              style: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w500, color: tColor)),
          subtitle: Text(s.category, style: GoogleFonts.poppins(fontSize: 11.5, color: grey70)),
          trailing: Text('${money(s.price)}',
              style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: tColor)),
          onTap: () {
            _remember(s.name);
            Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => ItemDescription(id: s.productId, title: s.name, percent: 0, throughSearchScreen: true),
            ));
          },
        );
      },
    );
  }

  Widget _resultsView() {
    final results = _results!;
    if (results.isEmpty) {
      return ListView(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 100),
        children: [
          const Icon(Icons.search_off_rounded, size: 52, color: grey70),
          const SizedBox(height: 10),
          Text('No results for "$_resultsFor"',
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600, color: tColor)),
          const SizedBox(height: 16),
          SearchProductRequestCard(searchQuery: _resultsFor, onClearSearch: () {
            _query.clear();
            setState(() => _results = null);
          }),
        ],
      );
    }
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
            child: Text('${results.length} results for "$_resultsFor"',
                style: GoogleFonts.poppins(fontSize: 13, color: tColor3)),
          ),
        ),
        _productGrid(results, 'res'),
        const SliverToBoxAdapter(child: SizedBox(height: 110)),
      ],
    );
  }

  Widget _emptyState() {
    return CustomScrollView(
      slivers: [
        if (_recent.isNotEmpty) ...[
          SliverToBoxAdapter(child: _heading('Recent searches', action: TextButton(onPressed: _clearRecent, child: const Text('Clear')))),
          SliverToBoxAdapter(child: _chips(_recent, Icons.history_rounded)),
        ],
        if (_popular.isNotEmpty) ...[
          SliverToBoxAdapter(child: _heading('Popular searches')),
          SliverToBoxAdapter(child: _chips(_popular, Icons.trending_up_rounded)),
        ],
        if (_recommended.isNotEmpty) ...[
          SliverToBoxAdapter(child: _heading('Recommended for you')),
          _productGrid(_recommended, 'rec'),
        ],
        const SliverToBoxAdapter(child: SizedBox(height: 110)),
      ],
    );
  }

  Widget _heading(String text, {Widget? action}) => Padding(
        padding: const EdgeInsets.fromLTRB(14, 16, 6, 6),
        child: Row(
          children: [
            Expanded(child: Text(text, style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: tColor))),
            if (action != null) action,
          ],
        ),
      );

  Widget _chips(List<String> items, IconData icon) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Wrap(
          spacing: 8,
          runSpacing: 8,
          children: items
              .map((q) => ActionChip(
                    avatar: Icon(icon, size: 16, color: tColor3),
                    label: Text(q, style: GoogleFonts.poppins(fontSize: 12.5, color: tColor4)),
                    backgroundColor: white,
                    side: const BorderSide(color: cardBorder),
                    onPressed: () => _search(q),
                  ))
              .toList(),
        ),
      );

  Widget _productGrid(List<BestItem> items, String keyPrefix) => SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        sliver: SliverGrid(
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            mainAxisExtent: ClikgettProductCard.heightFor(context),
          ),
          delegate: SliverChildBuilderDelegate(
            (_, i) => ClikgettProductCard(key: ValueKey('$keyPrefix-${items[i].productId}'), product: items[i], width: null),
            childCount: items.length,
          ),
        ),
      );
}
