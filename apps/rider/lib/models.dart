class ControlPoint {
  ControlPoint({
    required this.id,
    required this.seq,
    required this.name,
    required this.km,
    required this.openAt,
    required this.closeAt,
    this.lat,
    this.lng,
    this.radiusM = 250,
    this.checkedIn = false,
  });

  final String id;
  final int seq;
  final String name;
  final double km;
  final DateTime openAt;
  final DateTime closeAt;
  final double? lat;
  final double? lng;
  final int radiusM;
  bool checkedIn;

  Map<String, dynamic> toJson() => {
        'id': id,
        'seq': seq,
        'name': name,
        'km': km,
        'openAt': openAt.toIso8601String(),
        'closeAt': closeAt.toIso8601String(),
        'lat': lat,
        'lng': lng,
        'radiusM': radiusM,
        'checkedIn': checkedIn,
      };

  factory ControlPoint.fromJson(Map<String, dynamic> m) => ControlPoint(
        id: m['id'] as String,
        seq: m['seq'] as int,
        name: m['name'] as String,
        km: (m['km'] as num).toDouble(),
        openAt: DateTime.parse(m['openAt'] as String),
        closeAt: DateTime.parse(m['closeAt'] as String),
        lat: (m['lat'] as num?)?.toDouble(),
        lng: (m['lng'] as num?)?.toDouble(),
        radiusM: m['radiusM'] as int? ?? 250,
        checkedIn: m['checkedIn'] as bool? ?? false,
      );
}

class RideSession {
  RideSession({
    required this.eventId,
    required this.eventName,
    required this.joinCode,
    required this.nickname,
    required this.distanceKm,
    required this.startAt,
    required this.controls,
    required this.consentTracking,
    required this.visibility,
    required this.deviceId,
    this.entryId,
    this.apiBaseUrl,
  });

  final String eventId;
  final String eventName;
  final String joinCode;
  final String nickname;
  final int distanceKm;
  final DateTime startAt;
  final List<ControlPoint> controls;
  final bool consentTracking;
  final String visibility;
  final String deviceId;
  final String? entryId;
  final String? apiBaseUrl;

  ControlPoint? get nextControl {
    for (final c in controls) {
      if (!c.checkedIn) return c;
    }
    return controls.isEmpty ? null : controls.last;
  }

  Map<String, dynamic> toJson() => {
        'eventId': eventId,
        'eventName': eventName,
        'joinCode': joinCode,
        'nickname': nickname,
        'distanceKm': distanceKm,
        'startAt': startAt.toIso8601String(),
        'controls': controls.map((c) => c.toJson()).toList(),
        'consentTracking': consentTracking,
        'visibility': visibility,
        'deviceId': deviceId,
        'entryId': entryId,
        'apiBaseUrl': apiBaseUrl,
      };

  factory RideSession.fromJson(Map<String, dynamic> m) => RideSession(
        eventId: m['eventId'] as String,
        eventName: m['eventName'] as String,
        joinCode: m['joinCode'] as String,
        nickname: m['nickname'] as String,
        distanceKm: m['distanceKm'] as int,
        startAt: DateTime.parse(m['startAt'] as String),
        controls: (m['controls'] as List)
            .map((c) => ControlPoint.fromJson(c as Map<String, dynamic>))
            .toList(),
        consentTracking: m['consentTracking'] as bool? ?? true,
        visibility: m['visibility'] as String? ?? 'public',
        deviceId: m['deviceId'] as String,
        entryId: m['entryId'] as String?,
        apiBaseUrl: m['apiBaseUrl'] as String?,
      );
}

class QueuedPosition {
  QueuedPosition({
    required this.recordedAt,
    required this.lat,
    required this.lng,
    this.accuracyM,
    this.batteryPct,
  });

  final DateTime recordedAt;
  final double lat;
  final double lng;
  final double? accuracyM;
  final int? batteryPct;

  Map<String, dynamic> toJson() => {
        'recorded_at': recordedAt.toIso8601String(),
        'lat': lat,
        'lng': lng,
        'accuracy_m': accuracyM,
        'battery_pct': batteryPct,
      };
}
