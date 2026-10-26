import 'dart:convert';
import 'dart:io';

import 'package:fav_app/new/Constants/Constants.dart';
import 'package:fav_app/new/Services/common/intercepter.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:http_interceptor/http/intercepted_client.dart';

final http.Client _client = InterceptedClient.build(interceptors: [ApiInterceptor()]);

double _d(dynamic v) => v is num ? v.toDouble() : double.tryParse('${v ?? ''}') ?? 0;
int _i(dynamic v) => v is num ? v.toInt() : int.tryParse('${v ?? ''}') ?? 0;

/// Print store prices and rules (Backend services/PrintStore.js).
class PrintConfig {
  final bool enabled;
  final double priceBW;
  final double priceColor;
  final int paperGsm;
  final int maxFileMb;
  final int maxCopies;
  final int printOnlyMinutes;
  final int extraMinutesWithItems;

  const PrintConfig({
    this.enabled = true,
    this.priceBW = 3,
    this.priceColor = 10,
    this.paperGsm = 70,
    this.maxFileMb = 20,
    this.maxCopies = 50,
    this.printOnlyMinutes = 20,
    this.extraMinutesWithItems = 10,
  });

  factory PrintConfig.fromJson(Map<String, dynamic> j) => PrintConfig(
        enabled: j['Enabled'] != false,
        priceBW: _d(j['PriceBW']),
        priceColor: _d(j['PriceColor']),
        paperGsm: _i(j['PaperGSM']),
        maxFileMb: _i(j['MaxFileMB']),
        maxCopies: _i(j['MaxCopies']),
        printOnlyMinutes: _i(j['PrintOnlyMinutes']),
        extraMinutesWithItems: _i(j['ExtraMinutesWithItems']),
      );

  double priceFor(bool color) => color ? priceColor : priceBW;
}

/// One uploaded file to print.
class PrintJob {
  final int id;
  final String fileName;
  final String mimeType;
  final int pages;
  final int copies;
  final String colorMode;
  final String orientation;
  final double lineTotal;
  final String fileUrl;

  const PrintJob({
    required this.id,
    required this.fileName,
    required this.mimeType,
    required this.pages,
    this.copies = 1,
    this.colorMode = 'BW',
    this.orientation = 'PORTRAIT',
    this.lineTotal = 0,
    this.fileUrl = '',
  });

  factory PrintJob.fromJson(Map<String, dynamic> j) => PrintJob(
        id: _i(j['PrintJobID']),
        fileName: '${j['FileName'] ?? ''}',
        mimeType: '${j['MimeType'] ?? ''}',
        pages: _i(j['Pages']),
        copies: _i(j['Copies']) == 0 ? 1 : _i(j['Copies']),
        colorMode: '${j['ColorMode'] ?? 'BW'}',
        orientation: '${j['Orientation'] ?? 'PORTRAIT'}',
        lineTotal: _d(j['LineTotal']),
        fileUrl: '${j['FileUrl'] ?? ''}',
      );

  bool get isPdf => mimeType == 'application/pdf';
  bool get isColor => colorMode == 'COLOR';

  /// "3 pages · 2 copies · B&W"
  String get summary => [
        '$pages page${pages == 1 ? '' : 's'}',
        '$copies cop${copies == 1 ? 'y' : 'ies'}',
        isColor ? 'Colour' : 'B&W',
        orientation == 'LANDSCAPE' ? 'Landscape' : 'Portrait',
      ].join(' · ');
}

class PrintResult<T> {
  final T? value;
  final String? error;
  const PrintResult.ok(this.value) : error = null;
  const PrintResult.fail(this.error) : value = null;
  bool get ok => error == null;
}

class PrintStoreService {
  static const mimeTypes = {'pdf': 'application/pdf', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png'};

  static PrintConfig? _config;

  static Future<PrintConfig> config({bool refresh = false}) async {
    if (_config != null && !refresh) return _config!;
    try {
      final res = await _client.get(Uri.parse('${Constants.baseUrl}/print/config'));
      final data = jsonDecode(res.body);
      if (data is Map && data['Config'] is Map) _config = PrintConfig.fromJson(Map<String, dynamic>.from(data['Config']));
    } catch (e) {
      debugPrint('print config failed: $e');
    }
    return _config ?? const PrintConfig();
  }

  static Future<Map<String, dynamic>> _send(String method, String path, [Map<String, dynamic>? body]) async {
    final uri = Uri.parse('${Constants.baseUrl}$path');
    final headers = {'Content-Type': 'application/json'};
    final encoded = body == null ? null : jsonEncode(body);
    final http.Response res;
    switch (method) {
      case 'GET':
        res = await _client.get(uri, headers: headers);
        break;
      case 'PATCH':
        res = await _client.patch(uri, headers: headers, body: encoded);
        break;
      case 'DELETE':
        res = await _client.delete(uri, headers: headers);
        break;
      default:
        res = await _client.post(uri, headers: headers, body: encoded);
    }
    final data = jsonDecode(res.body);
    return data is Map ? Map<String, dynamic>.from(data) : <String, dynamic>{};
  }

  static String _message(Map<String, dynamic> data, String fallback) => '${data['Message'] ?? fallback}';

  /// Uploads one file and returns it as a draft print job with its page count.
  static Future<PrintResult<PrintJob>> upload(File file, String fileName) async {
    final ext = fileName.split('.').last.toLowerCase();
    final mime = mimeTypes[ext];
    if (mime == null) return const PrintResult.fail('Only PDF, JPG and PNG files can be printed.');
    try {
      final cfg = await config();
      final size = await file.length();
      if (size > cfg.maxFileMb * 1024 * 1024) return PrintResult.fail('$fileName is larger than ${cfg.maxFileMb} MB.');

      final link = await _send('POST', '/print/upload-url', {'ContentType': mime, 'FileName': fileName});
      if (link['Status'] != 1) return PrintResult.fail(_message(link, 'Could not start the upload.'));

      // The signed link takes the raw file (no token needed).
      final put = await http.put(Uri.parse('${link['UploadUrl']}'), headers: {'Content-Type': mime}, body: await file.readAsBytes());
      if (put.statusCode != 200) return const PrintResult.fail('Upload failed. Please check your internet and try again.');

      final added = await _send('POST', '/print/files', {'Key': link['Key'], 'FileName': fileName});
      if (added['Status'] != 1 || added['PrintJob'] is! Map) return PrintResult.fail(_message(added, 'Could not read the file.'));
      return PrintResult.ok(PrintJob.fromJson(Map<String, dynamic>.from(added['PrintJob'])));
    } catch (e) {
      debugPrint('print upload failed: $e');
      return const PrintResult.fail('Upload failed. Please check your internet and try again.');
    }
  }

  static Future<PrintResult<List<PrintJob>>> addToCart(List<Map<String, dynamic>> jobs) async {
    try {
      final data = await _send('POST', '/print/cart', {'Jobs': jobs});
      if (data['Status'] != 1) return PrintResult.fail(_message(data, 'Could not add to cart.'));
      final list = (data['PrintJobs'] is List ? data['PrintJobs'] as List : const [])
          .whereType<Map>()
          .map((e) => PrintJob.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      return PrintResult.ok(list);
    } catch (e) {
      debugPrint('print add to cart failed: $e');
      return const PrintResult.fail('Could not reach the store. Please try again.');
    }
  }

  static Future<List<PrintJob>> cart() async {
    try {
      final data = await _send('GET', '/print/cart');
      return (data['PrintJobs'] is List ? data['PrintJobs'] as List : const [])
          .whereType<Map>()
          .map((e) => PrintJob.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } catch (e) {
      debugPrint('print cart failed: $e');
      return [];
    }
  }

  static Future<PrintResult<bool>> setCopies(int jobId, int copies) async {
    try {
      final data = await _send('PATCH', '/print/cart/$jobId', {'Copies': copies});
      return data['Status'] == 1 ? const PrintResult.ok(true) : PrintResult.fail(_message(data, 'Could not update.'));
    } catch (_) {
      return const PrintResult.fail('Could not reach the store. Please try again.');
    }
  }

  static Future<PrintResult<bool>> remove(int jobId) async {
    try {
      final data = await _send('DELETE', '/print/cart/$jobId');
      return data['Status'] == 1 ? const PrintResult.ok(true) : PrintResult.fail(_message(data, 'Could not remove.'));
    } catch (_) {
      return const PrintResult.fail('Could not reach the store. Please try again.');
    }
  }
}
