import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/clikgett_product_card.dart';
import 'package:fav_app/new/NewScreens/Widgets/floating_cart_bar.dart';
import 'package:fav_app/new/Services/storefront_services.dart';
import 'package:fav_app/old/Models/Home/home_model.dart' as home_model;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Section title row with an optional "See all" action.
class SectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final VoidCallback? onSeeAll;

  const SectionHeader({Key? key, required this.title, this.subtitle, this.onSeeAll}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 18, 8, 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700, color: tColor)),
                if (subtitle != null && subtitle!.trim().isNotEmpty)
                  Text(subtitle!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(fontSize: 11.5, color: grey70)),
              ],
            ),
          ),
          if (onSeeAll != null)
            TextButton(
              onPressed: onSeeAll,
              style: TextButton.styleFrom(foregroundColor: primaryDark, padding: const EdgeInsets.symmetric(horizontal: 8)),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('See all', style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w600)),
                  const Icon(Icons.chevron_right_rounded, size: 18),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Horizontal rail of product cards for one home section.
class SectionProductRail extends StatelessWidget {
  final String title;
  final String? subtitle;
  final List<home_model.BestItem> products;
  final int? homeSectionId;

  const SectionProductRail({
    Key? key,
    required this.title,
    required this.products,
    this.subtitle,
    this.homeSectionId,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (products.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: title,
          subtitle: subtitle,
          onSeeAll: homeSectionId == null
              ? null
              : () => Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => SectionProductsScreen(title: title, homeSectionId: homeSectionId!),
                  )),
        ),
        SizedBox(
          height: ClikgettProductCard.heightFor(context) + 4,
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            scrollDirection: Axis.horizontal,
            itemCount: products.length,
            itemBuilder: (_, i) => ClikgettProductCard(
              key: ValueKey('rail-$homeSectionId-${products[i].productId}'),
              product: products[i],
              width: 150,
            ),
          ),
        ),
      ],
    );
  }
}

/// "See all" for a home section: every product of that section in a grid.
class SectionProductsScreen extends StatefulWidget {
  final String title;
  final int homeSectionId;

  const SectionProductsScreen({Key? key, required this.title, required this.homeSectionId}) : super(key: key);

  @override
  State<SectionProductsScreen> createState() => _SectionProductsScreenState();
}

class _SectionProductsScreenState extends State<SectionProductsScreen> {
  late Future<List<home_model.BestItem>> _future;

  @override
  void initState() {
    super.initState();
    _future = StorefrontServices.sectionProducts(widget.homeSectionId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bg1,
      appBar: AppBar(
        backgroundColor: white,
        foregroundColor: tColor,
        elevation: 0.5,
        title: Text(widget.title, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700)),
      ),
      body: FutureBuilder<List<home_model.BestItem>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator(color: primary));
          }
          final products = snap.data ?? [];
          if (snap.hasError || products.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.inventory_2_outlined, size: 48, color: grey70),
                    const SizedBox(height: 12),
                    Text(snap.hasError ? 'Could not load products' : 'No products here yet',
                        style: GoogleFonts.poppins(fontSize: 14, color: tColor3)),
                    if (snap.hasError)
                      TextButton(
                        onPressed: () => setState(() => _future = StorefrontServices.sectionProducts(widget.homeSectionId)),
                        child: const Text('Retry'),
                      ),
                  ],
                ),
              ),
            );
          }
          return Stack(
            children: [
              GridView.builder(
                padding: const EdgeInsets.fromLTRB(10, 10, 10, 110),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  mainAxisExtent: ClikgettProductCard.heightFor(context),
                ),
                itemCount: products.length,
                itemBuilder: (_, i) => ClikgettProductCard(
                  key: ValueKey('grid-${products[i].productId}'),
                  product: products[i],
                  width: null,
                ),
              ),
              const Positioned(left: 0, right: 0, bottom: 12, child: FloatingCartBar()),
            ],
          );
        },
      ),
    );
  }
}
