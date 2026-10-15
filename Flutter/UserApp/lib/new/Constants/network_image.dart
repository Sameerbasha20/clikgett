import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

// class CustomNetworkImage extends StatelessWidget {
//   final String url;
//   final double? height;
//   final double? width;
//   final BoxFit? fit;

//   const CustomNetworkImage({
//     super.key,
//     required this.url,
//     this.height,
//     this.width,
//     this.fit = BoxFit.cover,
//   });

//   @override
//   Widget build(BuildContext context) {

//   //   final pixelRatio = MediaQuery.of(context).devicePixelRatio;
//   //   final cacheWidth = (width! * pixelRatio * 1.5).round();
//   //   final cacheHeight = (height! * pixelRatio * 1.5).round();
//   //   // return ClipRRect(
//   //   //   borderRadius: BorderRadius.all(Radius.circular(1.4.h)),
//   //   //   child: Image(
//   //   //     image: CachedNetworkImageProvider(url), // This is more memory efficient
//   //   //     height: height,
//   //   //     width: width,
//   //   //     fit: fit,
//   //   //     loadingBuilder: (context, child, loadingProgress) {
//   //   //       if (loadingProgress == null) {
//   //   //         return child;
//   //   //       }
//   //   //       return Center(child: CircularProgressIndicator(value: loadingProgress.expectedTotalBytes != null
//   //   //           ? loadingProgress.cumulativeBytesLoaded / (loadingProgress.expectedTotalBytes ?? 1)
//   //   //           : null));
//   //   //     },
//   //   //     errorBuilder: (context, error, stackTrace) {
//   //   //       return const Center(child: Icon(Icons.error));
//   //   //     },
//   //   //   ),
//   //   // );
//   //   return CachedNetworkImage(
//   //     imageUrl: url,
//   //     fit: fit,
//   //     width: width,
//   //     height: height,
//   //     memCacheWidth: cacheWidth,
//   //     memCacheHeight: cacheHeight,
//   //     maxWidthDiskCache: cacheWidth,
//   //     maxHeightDiskCache: cacheHeight,
//   //     placeholder: (context, url) => Container(
//   //       width: width,
//   //       height: height,
//   //       color: Colors.grey[200],
//   //       child: const Center(
//   //         child: CircularProgressIndicator(),
//   //       ),
//   //     ),
//   //     errorWidget: (context, url, error) => Container(
//   //       width: width,
//   //       height: height,
//   //       color: Colors.grey[200],
//   //       child: const Icon(Icons.error),
//   //     ),
//   //   );
//   // }
//     if (url == null || url!.isEmpty) {
//       return Container(
//         height: height,
//         width: width,
//         color: Colors.grey[200],
//         child: const Icon(Icons.image_not_supported),
//       );
//     }

//     // Calculate cache dimensions only if the dimensions are finite
//     final pixelRatio = MediaQuery.of(context).devicePixelRatio;
//     final cacheWidth = width != null && width!.isFinite
//         ? (width! * pixelRatio * 1.2).round()
//         : null;
//     final cacheHeight = height != null && height!.isFinite
//         ? (height! * pixelRatio * 1.2).round()
//         : null;

//     return CachedNetworkImage(
//       imageUrl: url!,
//       height: height,
//       width: width,
//       fit: fit ?? BoxFit.cover,
//       memCacheWidth: cacheWidth,
//       memCacheHeight: cacheHeight,
//       maxWidthDiskCache: cacheWidth,
//       maxHeightDiskCache: cacheHeight,
//       placeholder: (context, url) => Container(
//         height: height,
//         width: width,
//         color: Colors.grey[200],
//         // child: const Center(
//         //   child: CircularProgressIndicator(),
//         // ),
//       ),
//       errorWidget: (context, url, error) => Container(
//         height: height,
//         width: width,
//         color: Colors.grey[200],
//         child: const Icon(Icons.image_not_supported),
//       ),
//     );
//   }

// }

class CustomNetworkImage extends StatelessWidget {
  final String url;
  final double? height;
  final double? width;
  final BoxFit? fit;

  const CustomNetworkImage({
    super.key,
    required this.url,
    this.height,
    this.width,
    this.fit = BoxFit.cover,
  });

  @override
  Widget build(BuildContext context) {
    if (url.isEmpty) {
      return Container(
        height: height,
        width: width,
        color: Colors.grey[200],
        child: const Icon(Icons.image_not_supported),
      );
    }

    final pixelRatio = MediaQuery.of(context).devicePixelRatio;
    final cacheWidth = (width != null && width!.isFinite)
        ? (width! * pixelRatio * 1.2).round()
        : null;
    final cacheHeight = (height != null && height!.isFinite)
        ? (height! * pixelRatio * 1.2).round()
        : null;

    return CachedNetworkImage(
      imageUrl: url,
      height: height,
      width: width,
      fit: fit,
      memCacheWidth: cacheWidth,
      memCacheHeight: cacheHeight,
      maxWidthDiskCache: cacheWidth,
      maxHeightDiskCache: cacheHeight,
      placeholder: (context, url) => Container(
        height: height,
        width: width,
        color: Colors.grey[200],
      ),
      errorWidget: (context, url, error) => Container(
        height: height,
        width: width,
        color: Colors.grey[200],
        child: const Icon(Icons.image_not_supported),
      ),
    );
  }
}
