import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:fav_app/constants.dart' as root_constants;
import 'package:fav_app/new/Constants/Constants.dart' as new_constants;
import 'package:fav_app/old/constants.dart' as old_constants;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Finds the ClikGett backend on the phone's Wi-Fi when the PC's IP has changed.
///
/// For a local build (API_BASE_URL is http on a private IP) only its port and path
/// matter: if the built-in address doesn't answer, the phone's /24 network is scanned
/// for a server on that port whose /health says it is the ClikGett backend. The
/// address found is remembered for the next launch. Builds pointing at a public
/// https domain are left alone.
class BackendDiscovery {
  static const _prefsKey = 'discovered_api_base_url';
  static const _service = 'clikgett-backend';

  static Future<void> ensureBackend() async {
    final built = Uri.parse(new_constants.Constants.baseUrlDev);
    if (built.scheme != 'http' || !_isPrivate(built.host)) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_prefsKey);
      final candidates = [if (saved != null) Uri.parse(saved), built];
      for (final candidate in candidates) {
        if (candidate.port == built.port && await _isClikGett(candidate.host, candidate.port)) {
          _apply(candidate);
          return;
        }
      }

      final host = await _scan(built.port);
      if (host == null) {
        debugPrint('[BackendDiscovery] no ClikGett backend found on port ${built.port}; using $built');
        return;
      }
      final found = built.replace(host: host);
      debugPrint('[BackendDiscovery] backend found at $found');
      _apply(found);
      await prefs.setString(_prefsKey, found.toString());
    } catch (e) {
      debugPrint('[BackendDiscovery] discovery failed: $e');
    }
  }

  static void _apply(Uri uri) {
    final url = uri.toString();
    root_constants.Constants.baseUrl = url;
    new_constants.Constants.baseUrl = url;
    old_constants.Constants.baseUrl = url;
  }

  static Future<bool> _isClikGett(String host, int port) async {
    try {
      final response = await http
          .get(Uri(scheme: 'http', host: host, port: port, path: '/health'))
          .timeout(const Duration(milliseconds: 1500));
      final body = jsonDecode(response.body);
      return body is Map && body['service'] == _service;
    } catch (_) {
      return false;
    }
  }

  /// Wi-Fi networks first; a quick TCP probe in batches, then /health to confirm.
  static Future<String?> _scan(int port) async {
    final interfaces = await NetworkInterface.list(type: InternetAddressType.IPv4);
    interfaces.sort((a, b) => (b.name.contains('wlan') ? 1 : 0) - (a.name.contains('wlan') ? 1 : 0));

    final prefixes = <String>{};
    for (final iface in interfaces) {
      for (final addr in iface.addresses) {
        if (_isPrivate(addr.address)) {
          prefixes.add(addr.address.substring(0, addr.address.lastIndexOf('.')));
        }
      }
    }

    const batchSize = 64;
    for (final prefix in prefixes) {
      final hosts = [for (var i = 1; i < 255; i++) '$prefix.$i'];
      for (var start = 0; start < hosts.length; start += batchSize) {
        final batch = hosts.sublist(start, min(start + batchSize, hosts.length));
        final open = await Future.wait(batch.map((h) => _portOpen(h, port)));
        for (var i = 0; i < batch.length; i++) {
          if (open[i] && await _isClikGett(batch[i], port)) return batch[i];
        }
      }
    }
    return null;
  }

  static Future<bool> _portOpen(String host, int port) async {
    try {
      final socket = await Socket.connect(host, port, timeout: const Duration(milliseconds: 400));
      socket.destroy();
      return true;
    } catch (_) {
      return false;
    }
  }

  static bool _isPrivate(String host) {
    final parts = host.split('.').map(int.tryParse).toList();
    if (parts.length != 4 || parts.contains(null)) return false;
    final a = parts[0]!, b = parts[1]!;
    return a == 10 || (a == 172 && b >= 16 && b <= 31) || (a == 192 && b == 168);
  }
}
