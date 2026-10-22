import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/NewScreens/Auth/Login.dart';
import 'package:fav_app/new/NewScreens/Homepage/Tabs/home_sections/clikgett_product_card.dart';
import 'package:fav_app/new/NewScreens/PhotoOrders/PhotoOrderUploadScreen.dart';
import 'package:fav_app/new/NewScreens/Widgets/floating_cart_bar.dart';
import 'package:fav_app/new/Services/common/common_services.dart';
import 'package:fav_app/new/Services/storefront_services.dart';
import 'package:fav_app/old/Models/Home/home_model.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Two shortcut cards under the search bar: order with a photo of your list,
/// and products that get cheaper when you buy more.
class QuickActionsRow extends StatefulWidget {
  const QuickActionsRow({super.key});

  @override
  State<QuickActionsRow> createState() => _QuickActionsRowState();
}

class _QuickActionsRowState extends State<QuickActionsRow> {
  List<BestItem> _bulk = [];

  @override
  void initState() {
    super.initState();
    StorefrontServices.bulkDeals().then((items) {
      if (mounted) setState(() => _bulk = items);
    });
  }

  Future<void> _photoOrder() async {
    final token = await CommonServices.getToken();
    if (!mounted) return;
    if (token.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please login to order with a photo')));
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => Login()));
      return;
    }
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PhotoOrderUploadScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
      child: Row(children: [
        Expanded(
          child: _ActionCard(
            icon: Icons.photo_camera_rounded,
            iconBg: const Color(0xFFE0F2FE),
            iconColor: const Color(0xFF0369A1),
            title: 'Order with a photo',
            subtitle: 'Snap your list, we pack it',
            onTap: _photoOrder,
          ),
        ),
        if (_bulk.isNotEmpty) ...[
          const SizedBox(width: 10),
          Expanded(
            child: _ActionCard(
              icon: Icons.local_offer_rounded,
              iconBg: primaryGhost,
              iconColor: primaryDark,
              title: 'Buy more, save more',
              subtitle: '${_bulk.length} item${_bulk.length == 1 ? '' : 's'} cheaper in bulk',
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => BulkDealsScreen(initial: _bulk))),
            ),
          ),
        ],
      ]),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: cardBorder)),
          child: Row(children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: iconColor, size: 21),
            ),
            const SizedBox(width: 9),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w700, color: tColor, height: 1.2)),
                Text(subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(fontSize: 10.5, color: tColor3, height: 1.3)),
              ]),
            ),
            const Icon(Icons.chevron_right_rounded, color: grey70, size: 20),
          ]),
        ),
      ),
    );
  }
}

/// All products with bulk prices, as a 2-column grid.
class BulkDealsScreen extends StatefulWidget {
  final List<BestItem> initial;

  const BulkDealsScreen({super.key, this.initial = const []});

  @override
  State<BulkDealsScreen> createState() => _BulkDealsScreenState();
}

class _BulkDealsScreenState extends State<BulkDealsScreen> {
  late List<BestItem> _items = widget.initial;

  Future<void> _refresh() async {
    final items = await StorefrontServices.bulkDeals();
    if (mounted) setState(() => _items = items);
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
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Buy more, save more', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700)),
          Text('The price drops when you add more to your cart', style: GoogleFonts.poppins(fontSize: 11.5, color: tColor3)),
        ]),
      ),
      body: Stack(children: [
        RefreshIndicator(
          color: primary,
          onRefresh: _refresh,
          child: _items.isEmpty
              ? ListView(children: [
                  const SizedBox(height: 120),
                  Center(child: Text('No bulk offers right now', style: GoogleFonts.poppins(color: tColor3))),
                ])
              : GridView.builder(
                  padding: const EdgeInsets.fromLTRB(10, 10, 10, 110),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    mainAxisExtent: 258,
                  ),
                  itemCount: _items.length,
                  itemBuilder: (_, i) => ClikgettProductCard(key: ValueKey('bulk-${_items[i].productId}'), product: _items[i], width: null),
                ),
        ),
        const Positioned(left: 0, right: 0, bottom: 12, child: FloatingCartBar()),
      ]),
    );
  }
}
