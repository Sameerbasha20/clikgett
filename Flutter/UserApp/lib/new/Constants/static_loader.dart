import 'package:fav_app/new/Constants/skeletons.dart';
import 'package:flutter/material.dart';

export 'package:fav_app/new/Constants/skeletons.dart' show SkeletonKind, Skeleton, Bone;

/// Page loading placeholder: a shimmering skeleton shaped like the page
/// (was a spinner).
class CustomLoader extends StatelessWidget {
  final SkeletonKind kind;
  const CustomLoader({super.key, this.kind = SkeletonKind.list});

  @override
  Widget build(BuildContext context) => Skeleton(kind: kind);
}
