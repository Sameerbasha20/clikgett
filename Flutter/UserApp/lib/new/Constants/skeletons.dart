import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

/// Page shapes a skeleton can take while the real content loads.
enum SkeletonKind { list, productGrid, home, productDetail, categories, orderDetail, checkout, form, cards }

const _base = Color(0xFFE9EEF2);
const _highlight = Color(0xFFF7F9FB);

/// One grey placeholder block.
class Bone extends StatelessWidget {
  final double? width;
  final double height;
  final double radius;
  final bool circle;
  const Bone({super.key, this.width, this.height = 12, this.radius = 8, this.circle = false});

  @override
  Widget build(BuildContext context) => Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: _base,
          shape: circle ? BoxShape.circle : BoxShape.rectangle,
          borderRadius: circle ? null : BorderRadius.circular(radius),
        ),
      );
}

/// Shimmering placeholder shaped like the page that is loading. Replaces spinners.
class Skeleton extends StatelessWidget {
  final SkeletonKind kind;
  final EdgeInsets padding;

  /// Use inside a scroll view (lists that already scroll).
  final bool shrinkWrap;
  const Skeleton({super.key, this.kind = SkeletonKind.list, this.padding = const EdgeInsets.all(14), this.shrinkWrap = false});

  @override
  Widget build(BuildContext context) {
    final calm = MediaQuery.maybeOf(context)?.disableAnimations ?? false;
    final body = SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: padding,
      child: _shape(context),
    );
    final content = shrinkWrap ? Padding(padding: padding, child: _shape(context)) : body;
    return Semantics(
      label: 'Loading',
      child: calm ? content : Shimmer.fromColors(baseColor: _base, highlightColor: _highlight, period: const Duration(milliseconds: 1300), child: content),
    );
  }

  /// Shimmering wrapper for a single placeholder widget.
  static Widget _shimmer(Widget child) => Builder(
        builder: (context) => (MediaQuery.maybeOf(context)?.disableAnimations ?? false)
            ? child
            : Shimmer.fromColors(baseColor: _base, highlightColor: _highlight, child: child),
      );

  /// Fills its box with a shimmering block (image placeholders).
  static Widget image() => _shimmer(Container(decoration: BoxDecoration(color: _base, borderRadius: BorderRadius.circular(6))));

  /// One product card placeholder (e.g. "loading more" at the end of a grid).
  static Widget tile() => _shimmer(_productTile());

  /// Narrow side rail of round category tiles (category page).
  static Widget sideRail() => _shimmer(SingleChildScrollView(physics: const NeverScrollableScrollPhysics(), child: Column(children: [
        for (var i = 0; i < 7; i++)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Column(children: const [Bone(width: 50, height: 50, circle: true), SizedBox(height: 6), Bone(width: 44, height: 8)]),
          ),
      ])));

  Widget _shape(BuildContext context) {
    switch (kind) {
      case SkeletonKind.productGrid:
        return _grid(6);
      case SkeletonKind.home:
        return _home();
      case SkeletonKind.productDetail:
        return _detail();
      case SkeletonKind.categories:
        return _categories();
      case SkeletonKind.orderDetail:
        return _orderDetail();
      case SkeletonKind.checkout:
        return _checkout();
      case SkeletonKind.form:
        return _form();
      case SkeletonKind.cards:
        return Column(children: List.generate(4, (_) => _card(height: 96)));
      case SkeletonKind.list:
        return Column(children: List.generate(7, (_) => _row()));
    }
  }

  static Widget _card({double height = 80, Widget? child}) => Container(
        height: child == null ? height : null,
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: _base)),
        child: child,
      );

  static Widget _row() => _card(
        child: Row(children: const [
          Bone(width: 56, height: 56, radius: 12),
          SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Bone(width: 160, height: 13),
              SizedBox(height: 8),
              Bone(width: 110, height: 11),
              SizedBox(height: 8),
              Bone(width: 70, height: 11),
            ]),
          ),
        ]),
      );

  static Widget _productTile() => Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: _base)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
          Bone(height: 100, radius: 10),
          SizedBox(height: 10),
          Bone(height: 12),
          SizedBox(height: 6),
          Bone(width: 70, height: 10),
          SizedBox(height: 14),
          Row(children: [Bone(width: 50, height: 14), Spacer(), Bone(width: 56, height: 28, radius: 8)]),
        ]),
      );

  static Widget _grid(int n) => GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 0.66,
        children: List.generate(n, (_) => _productTile()),
      );

  static Widget _rail() => SizedBox(
        height: 220,
        child: Row(children: [
          for (var i = 0; i < 3; i++) ...[
            if (i > 0) const SizedBox(width: 10),
            Expanded(child: _productTile()),
          ],
        ]),
      );

  static Widget _categories() => GridView.count(
        crossAxisCount: 4,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 14,
        crossAxisSpacing: 10,
        childAspectRatio: 0.72,
        children: List.generate(
          12,
          (_) => Column(children: const [
            Expanded(child: Bone(radius: 16)),
            SizedBox(height: 8),
            Bone(width: 56, height: 10),
          ]),
        ),
      );

  static Widget _home() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Bone(height: 54, radius: 14),
        const SizedBox(height: 12),
        const Bone(height: 150, radius: 18),
        const SizedBox(height: 20),
        const Bone(width: 150, height: 16),
        const SizedBox(height: 12),
        _categories(),
        const SizedBox(height: 20),
        const Bone(width: 130, height: 16),
        const SizedBox(height: 12),
        _rail(),
      ]);

  static Widget _detail() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
        Bone(height: 300, radius: 18),
        SizedBox(height: 18),
        Bone(height: 20),
        SizedBox(height: 8),
        Bone(width: 200, height: 20),
        SizedBox(height: 14),
        Bone(width: 60, height: 12),
        SizedBox(height: 10),
        Row(children: [Bone(width: 90, height: 24), Spacer(), Bone(width: 110, height: 42, radius: 10)]),
        SizedBox(height: 22),
        Bone(width: 100, height: 14),
        SizedBox(height: 10),
        Row(children: [Expanded(child: Bone(height: 80, radius: 14)), SizedBox(width: 10), Expanded(child: Bone(height: 80, radius: 14))]),
      ]);

  static Widget _orderDetail() => Column(children: [
        _card(height: 120),
        _card(height: 150),
        _card(height: 110),
        _card(child: Column(children: List.generate(3, (_) => Padding(padding: const EdgeInsets.only(bottom: 10), child: _lineRow())))),
        _card(height: 140),
      ]);

  static Widget _lineRow() => Row(children: const [
        Bone(width: 44, height: 44, radius: 10),
        SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Bone(height: 12), SizedBox(height: 6), Bone(width: 80, height: 10)])),
        SizedBox(width: 10),
        Bone(width: 44, height: 14),
      ]);

  static Widget _checkout() => Column(children: [
        _card(height: 70),
        _card(child: Column(children: List.generate(3, (_) => Padding(padding: const EdgeInsets.only(bottom: 12), child: _lineRow())))),
        _card(height: 64),
        _card(height: 64),
        _card(
          child: Column(children: List.generate(
            5,
            (i) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(children: [Bone(width: i == 4 ? 70 : 110, height: 12), const Spacer(), const Bone(width: 50, height: 12)]),
            ),
          )),
        ),
      ]);

  static Widget _form() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (var i = 0; i < 4; i++) ...[
            const Bone(width: 110, height: 12),
            const SizedBox(height: 8),
            const Bone(height: 50, radius: 12),
            const SizedBox(height: 18),
          ],
          const Bone(height: 52, radius: 14),
        ],
      );
}
