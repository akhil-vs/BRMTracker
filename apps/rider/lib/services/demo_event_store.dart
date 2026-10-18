import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../acp_times.dart';
import '../models.dart';

/// Shared offline demo event for rider + volunteer modes (join code BRM200).
/// Replaced by Supabase when apiBaseUrl is configured.
class DemoEventStore {
  static const _key = 'demo_event_v1';
  static const joinCode = 'BRM200';

  Future<DemoEvent> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw != null) {
      return DemoEvent.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    }
    final seeded = _seed();
    await save(seeded);
    return seeded;
  }

  Future<void> save(DemoEvent event) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(event.toJson()));
  }

  Future<DemoEvent> reset() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
    return load();
  }

  Future<DemoEvent> confirmCheckin({
    required String entryId,
    required String controlId,
    required String volunteerName,
  }) async {
    final event = await load();
    final control = event.controls.firstWhere((c) => c.id == controlId);
    final entry = event.entries.firstWhere((e) => e.id == entryId);
    final now = DateTime.now();
    final late = now.isAfter(control.closeAt);

    event.checkins.removeWhere(
      (c) =>
          c.entryId == entryId && c.controlId == controlId && c.undoneAt == null,
    );
    event.checkins.add(
      DemoCheckin(
        id: 'chk_${now.millisecondsSinceEpoch}',
        entryId: entryId,
        controlId: controlId,
        checkedAt: now,
        confirmedBy: volunteerName,
        late: late,
      ),
    );

    entry.lastLat = control.lat;
    entry.lastLng = control.lng;
    entry.lastSeenAt = now;
    entry.status =
        control.seq == event.controls.length - 1 ? 'finished' : 'started';

    await save(event);
    return event;
  }

  Future<DemoEvent> undoCheckin(String checkinId) async {
    final event = await load();
    for (final c in event.checkins) {
      if (c.id == checkinId) c.undoneAt = DateTime.now();
    }
    await save(event);
    return event;
  }

  Future<DemoEvent> raiseSos({
    required String entryId,
    String message = 'SOS',
  }) async {
    final event = await load();
    event.alerts.add(
      DemoAlert(
        id: 'sos_${DateTime.now().millisecondsSinceEpoch}',
        entryId: entryId,
        type: 'sos',
        message: message,
        active: true,
      ),
    );
    await save(event);
    return event;
  }

  Future<DemoEvent> acknowledgeSos(String alertId) async {
    final event = await load();
    for (final a in event.alerts) {
      if (a.id == alertId) a.active = false;
    }
    await save(event);
    return event;
  }

  DemoEvent _seed() {
    final start = DateTime.now().subtract(const Duration(hours: 1));
    const distance = 200;
    final points = <(String, double)>[
      ('Start', 0),
      ('Control 1', 60),
      ('Control 2', 120),
      ('Finish', 200),
    ];
    final controls = <ControlPoint>[];
    for (var i = 0; i < points.length; i++) {
      final p = points[i];
      final t = controlTimes(
        start,
        p.$2,
        distance,
        isFinish: i == points.length - 1,
      );
      controls.add(
        ControlPoint(
          id: 'c$i',
          seq: i,
          name: p.$1,
          km: p.$2,
          openAt: t.openAt,
          closeAt: t.closeAt,
          lat: 12.97 + p.$2 * 0.001,
          lng: 77.59 + p.$2 * 0.0015,
        ),
      );
    }

    return DemoEvent(
      id: 'demo-brm200',
      name: 'BRM 200 — Demo',
      joinCode: joinCode,
      distanceKm: distance,
      startAt: start,
      controls: controls,
      entries: [
        DemoEntry(
          id: 'e1',
          bib: '101',
          nickname: 'Ghat Hopper',
          status: 'started',
          lastLat: 12.98,
          lastLng: 77.60,
          lastSeenAt: DateTime.now().subtract(const Duration(minutes: 8)),
          timeInHandMinutes: 42,
          batteryPct: 72,
        ),
        DemoEntry(
          id: 'e2',
          bib: '102',
          nickname: 'Dawn Rider',
          status: 'started',
          lastLat: 12.99,
          lastLng: 77.62,
          lastSeenAt: DateTime.now().subtract(const Duration(minutes: 18)),
          timeInHandMinutes: 12,
          batteryPct: 40,
        ),
        DemoEntry(
          id: 'e3',
          bib: '103',
          nickname: 'Private Pilot',
          status: 'registered',
          timeInHandMinutes: 90,
        ),
      ],
      checkins: [],
      alerts: [],
    );
  }
}

class DemoEvent {
  DemoEvent({
    required this.id,
    required this.name,
    required this.joinCode,
    required this.distanceKm,
    required this.startAt,
    required this.controls,
    required this.entries,
    required this.checkins,
    required this.alerts,
  });

  final String id;
  final String name;
  final String joinCode;
  final int distanceKm;
  final DateTime startAt;
  final List<ControlPoint> controls;
  final List<DemoEntry> entries;
  final List<DemoCheckin> checkins;
  final List<DemoAlert> alerts;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'joinCode': joinCode,
        'distanceKm': distanceKm,
        'startAt': startAt.toIso8601String(),
        'controls': controls.map((c) => c.toJson()).toList(),
        'entries': entries.map((e) => e.toJson()).toList(),
        'checkins': checkins.map((c) => c.toJson()).toList(),
        'alerts': alerts.map((a) => a.toJson()).toList(),
      };

  factory DemoEvent.fromJson(Map<String, dynamic> m) => DemoEvent(
        id: m['id'] as String,
        name: m['name'] as String,
        joinCode: m['joinCode'] as String,
        distanceKm: m['distanceKm'] as int,
        startAt: DateTime.parse(m['startAt'] as String),
        controls: (m['controls'] as List)
            .map((c) => ControlPoint.fromJson(c as Map<String, dynamic>))
            .toList(),
        entries: (m['entries'] as List)
            .map((e) => DemoEntry.fromJson(e as Map<String, dynamic>))
            .toList(),
        checkins: (m['checkins'] as List? ?? [])
            .map((c) => DemoCheckin.fromJson(c as Map<String, dynamic>))
            .toList(),
        alerts: (m['alerts'] as List? ?? [])
            .map((a) => DemoAlert.fromJson(a as Map<String, dynamic>))
            .toList(),
      );
}

class DemoEntry {
  DemoEntry({
    required this.id,
    required this.bib,
    required this.nickname,
    required this.status,
    this.lastLat,
    this.lastLng,
    this.lastSeenAt,
    this.timeInHandMinutes,
    this.batteryPct,
  });

  final String id;
  final String bib;
  final String nickname;
  String status;
  double? lastLat;
  double? lastLng;
  DateTime? lastSeenAt;
  int? timeInHandMinutes;
  int? batteryPct;

  Map<String, dynamic> toJson() => {
        'id': id,
        'bib': bib,
        'nickname': nickname,
        'status': status,
        'lastLat': lastLat,
        'lastLng': lastLng,
        'lastSeenAt': lastSeenAt?.toIso8601String(),
        'timeInHandMinutes': timeInHandMinutes,
        'batteryPct': batteryPct,
      };

  factory DemoEntry.fromJson(Map<String, dynamic> m) => DemoEntry(
        id: m['id'] as String,
        bib: m['bib'] as String,
        nickname: m['nickname'] as String,
        status: m['status'] as String,
        lastLat: (m['lastLat'] as num?)?.toDouble(),
        lastLng: (m['lastLng'] as num?)?.toDouble(),
        lastSeenAt: m['lastSeenAt'] != null
            ? DateTime.parse(m['lastSeenAt'] as String)
            : null,
        timeInHandMinutes: m['timeInHandMinutes'] as int?,
        batteryPct: m['batteryPct'] as int?,
      );
}

class DemoCheckin {
  DemoCheckin({
    required this.id,
    required this.entryId,
    required this.controlId,
    required this.checkedAt,
    required this.confirmedBy,
    required this.late,
    this.undoneAt,
  });

  final String id;
  final String entryId;
  final String controlId;
  final DateTime checkedAt;
  final String confirmedBy;
  final bool late;
  DateTime? undoneAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'entryId': entryId,
        'controlId': controlId,
        'checkedAt': checkedAt.toIso8601String(),
        'confirmedBy': confirmedBy,
        'late': late,
        'undoneAt': undoneAt?.toIso8601String(),
      };

  factory DemoCheckin.fromJson(Map<String, dynamic> m) => DemoCheckin(
        id: m['id'] as String,
        entryId: m['entryId'] as String,
        controlId: m['controlId'] as String,
        checkedAt: DateTime.parse(m['checkedAt'] as String),
        confirmedBy: m['confirmedBy'] as String,
        late: m['late'] as bool? ?? false,
        undoneAt: m['undoneAt'] != null
            ? DateTime.parse(m['undoneAt'] as String)
            : null,
      );
}

class DemoAlert {
  DemoAlert({
    required this.id,
    required this.entryId,
    required this.type,
    required this.message,
    required this.active,
  });

  final String id;
  final String entryId;
  final String type;
  final String message;
  bool active;

  Map<String, dynamic> toJson() => {
        'id': id,
        'entryId': entryId,
        'type': type,
        'message': message,
        'active': active,
      };

  factory DemoAlert.fromJson(Map<String, dynamic> m) => DemoAlert(
        id: m['id'] as String,
        entryId: m['entryId'] as String,
        type: m['type'] as String,
        message: m['message'] as String,
        active: m['active'] as bool? ?? true,
      );
}
