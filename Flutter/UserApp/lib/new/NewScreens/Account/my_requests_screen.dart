import 'package:fav_app/new/Constants/colors.dart';
import 'package:fav_app/new/NewScreens/Account/account_widgets.dart';
import 'package:fav_app/new/NewScreens/Homepage/ProductRequestScreen.dart';
import 'package:fav_app/new/NewScreens/Support/EnquiryScreen.dart';
import 'package:fav_app/new/Services/account_services.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

/// The customer's product requests and support enquiries, with the store's replies.
class MyRequestsScreen extends StatefulWidget {
  const MyRequestsScreen({super.key, this.initialTab = 0});

  final int initialTab;

  @override
  State<MyRequestsScreen> createState() => _MyRequestsScreenState();
}

class _MyRequestsScreenState extends State<MyRequestsScreen> {
  List<CustomerRequest>? _requests;
  List<CustomerRequest>? _enquiries;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final results = await Future.wait([AccountServices.myProductRequests(), AccountServices.myEnquiries()]);
    if (!mounted) return;
    setState(() {
      _requests = results[0];
      _enquiries = results[1];
    });
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      initialIndex: widget.initialTab,
      child: Scaffold(
        backgroundColor: bg1,
        appBar: AppBar(
          backgroundColor: white,
          foregroundColor: tColor,
          elevation: 0.5,
          titleSpacing: 0,
          title: Text('My requests', style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w700)),
          bottom: TabBar(
            labelColor: primaryDark,
            unselectedLabelColor: tColor3,
            indicatorColor: primary,
            labelStyle: GoogleFonts.poppins(fontSize: 13.5, fontWeight: FontWeight.w600),
            tabs: const [Tab(text: 'Product requests'), Tab(text: 'Messages')],
          ),
        ),
        body: TabBarView(children: [
          _list(
            _requests,
            empty: const EmptyState(
              icon: Icons.add_shopping_cart_rounded,
              title: 'No product requests',
              message: "Can't find something? Ask us to stock it and we'll let you know when it's available.",
            ),
            newLabel: 'Request a product',
            onNew: () => const ProductRequestScreen(),
          ),
          _list(
            _enquiries,
            empty: const EmptyState(
              icon: Icons.forum_outlined,
              title: 'No messages yet',
              message: 'Questions or problems with an order? Send us a message.',
            ),
            newLabel: 'Send a message',
            onNew: () => const EnquiryScreen(),
          ),
        ]),
      ),
    );
  }

  Widget _list(List<CustomerRequest>? items, {required Widget empty, required String newLabel, required Widget Function() onNew}) {
    final button = Padding(
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          style: primaryButtonStyle(),
          onPressed: () async {
            await Navigator.of(context).push(MaterialPageRoute(builder: (_) => onNew()));
            _load();
          },
          icon: const Icon(Icons.add_rounded),
          label: Text(newLabel),
        ),
      ),
    );
    if (items == null) return const Center(child: CircularProgressIndicator(color: primary));
    return Column(children: [
      Expanded(
        child: RefreshIndicator(
          color: primary,
          onRefresh: _load,
          child: items.isEmpty
              ? ListView(children: [const SizedBox(height: 60), empty])
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: items.length,
                  itemBuilder: (_, i) => _card(items[i]),
                ),
        ),
      ),
      SafeArea(top: false, child: button),
    ]);
  }

  Widget _card(CustomerRequest r) {
    final status = r.status.trim();
    final s = status.toLowerCase();
    final done = s.contains('available') || s.contains('resolved') || s.contains('closed') || s.contains('completed');
    final rejected = s.contains('reject') || s.contains('unavailable') || s.contains('declined');
    final color = rejected ? red : (done ? primaryDark : amberWarning);
    return SectionCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(r.title, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, color: tColor))),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
            child: Text(status.isEmpty ? 'Pending' : status, style: GoogleFonts.poppins(fontSize: 11.5, fontWeight: FontWeight.w600, color: color)),
          ),
        ]),
        if (r.details.trim().isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(r.details, maxLines: 3, overflow: TextOverflow.ellipsis, style: GoogleFonts.poppins(fontSize: 12.5, color: tColor4)),
          ),
        if (r.createdAt != null)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(DateFormat('d MMM yyyy, h:mm a').format(r.createdAt!), style: GoogleFonts.poppins(fontSize: 11, color: grey70)),
          ),
        if (r.adminReply != null)
          Container(
            width: double.infinity,
            margin: const EdgeInsets.only(top: 8),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: primaryGhost, borderRadius: BorderRadius.circular(10)),
            child: Text.rich(TextSpan(children: [
              const TextSpan(text: 'ClikGett: ', style: TextStyle(fontWeight: FontWeight.w700, color: primaryDark)),
              TextSpan(text: r.adminReply),
            ]), style: GoogleFonts.poppins(fontSize: 12.5, color: tColor4)),
          ),
      ]),
    );
  }
}
