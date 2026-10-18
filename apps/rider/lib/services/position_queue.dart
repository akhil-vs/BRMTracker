import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

import '../models.dart';

class PositionQueue {
  static const _fileName = 'position_queue.jsonl';

  Future<File> _file() async {
    final dir = await getApplicationDocumentsDirectory();
    return File('${dir.path}/$_fileName');
  }

  Future<void> enqueue(QueuedPosition position) async {
    final file = await _file();
    await file.writeAsString(
      '${jsonEncode(position.toJson())}\n',
      mode: FileMode.append,
    );
  }

  Future<List<QueuedPosition>> peekAll() async {
    final file = await _file();
    if (!await file.exists()) return [];
    final lines = await file.readAsLines();
    return lines.where((l) => l.trim().isNotEmpty).map((line) {
      final m = jsonDecode(line) as Map<String, dynamic>;
      return QueuedPosition(
        recordedAt: DateTime.parse(m['recorded_at'] as String),
        lat: (m['lat'] as num).toDouble(),
        lng: (m['lng'] as num).toDouble(),
        accuracyM: (m['accuracy_m'] as num?)?.toDouble(),
        batteryPct: m['battery_pct'] as int?,
      );
    }).toList();
  }

  Future<int> length() async => (await peekAll()).length;

  Future<void> clear() async {
    final file = await _file();
    if (await file.exists()) await file.delete();
  }

  /// Upload batch to Supabase RPC or custom API; clears on success.
  Future<int> flushToBackend({
    required String? apiBaseUrl,
    required String? entryId,
    required String deviceId,
  }) async {
    final pending = await peekAll();
    if (pending.isEmpty) return 0;

    if (apiBaseUrl == null ||
        apiBaseUrl.isEmpty ||
        entryId == null ||
        entryId.isEmpty) {
      // Offline demo: keep queue; organiser demo store is separate.
      return pending.length;
    }

    final uri = Uri.parse('$apiBaseUrl/rest/v1/rpc/upload_positions');
    final res = await http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'apikey': const String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: ''),
        'Authorization':
            'Bearer ${const String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: '')}',
      },
      body: jsonEncode({
        'p_entry_id': entryId,
        'p_device_id': deviceId,
        'p_points': pending.map((p) => p.toJson()).toList(),
      }),
    );

    if (res.statusCode >= 200 && res.statusCode < 300) {
      await clear();
      return pending.length;
    }
    return 0;
  }
}
