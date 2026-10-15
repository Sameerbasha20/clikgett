import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

class OptimizedNetworkImage extends StatelessWidget {
  final String url;
  final double height;
  final double width;
  final BoxFit fit;

  const OptimizedNetworkImage({
    Key? key,
    required this.url,
    required this.height,
    required this.width,
    this.fit = BoxFit.contain,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Calculate reasonable cache dimensions based on device pixel ratio
    final pixelRatio = MediaQuery.of(context).devicePixelRatio;
    final cacheWidth = (width * pixelRatio * 1.5).round();
    final cacheHeight = (height * pixelRatio * 1.5).round();

    return CachedNetworkImage(
      imageUrl: url,
      fit: fit,
      width: width,
      height: height,
      memCacheWidth: cacheWidth,
      memCacheHeight: cacheHeight,
      maxWidthDiskCache: cacheWidth,
      maxHeightDiskCache: cacheHeight,
      placeholder: (context, url) => Container(
        width: width,
        height: height,
        color: Colors.grey[200],
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      ),
      errorWidget: (context, url, error) => Container(
        width: width,
        height: height,
        color: Colors.grey[200],
        child: const Icon(Icons.error),
      ),
    );
  }
}