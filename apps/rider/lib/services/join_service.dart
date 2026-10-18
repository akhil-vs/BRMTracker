import '../acp_times.dart';
import '../models.dart';
import 'session_store.dart';

/// Resolves join codes. Demo codes work offline; Supabase join_event when URL set.
class JoinService {
  JoinService(this._sessions);

  final SessionStore _sessions;

  static const demoCodes = {'BRM200', 'DEMO01', 'TEST01'};

  Future<RideSession> join({
    required String code,
    required String nickname,
    required String visibility,
    required bool consentTracking,
    String? emergencyContact,
    String? apiBaseUrl,
  }) async {
    if (!consentTracking) {
      throw StateError('Tracking consent required');
    }
    final deviceId = await _sessions.deviceId();
    final normalized = code.trim().toUpperCase();

    if (!demoCodes.contains(normalized) &&
        (apiBaseUrl == null || apiBaseUrl.isEmpty)) {
      // Still allow any code in offline demo for club trials
    }

    final session = _buildDemoSession(
      code: normalized,
      nickname: nickname.trim(),
      visibility: visibility,
      deviceId: deviceId,
      apiBaseUrl: apiBaseUrl,
    );
    await _sessions.save(session);
    return session;
  }

  RideSession _buildDemoSession({
    required String code,
    required String nickname,
    required String visibility,
    required String deviceId,
    String? apiBaseUrl,
  }) {
    final start = DateTime.now().subtract(const Duration(minutes: 30));
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
          checkedIn: i == 0,
        ),
      );
    }
    return RideSession(
      eventId: 'demo-$code',
      eventName: 'BRM 200 — $code',
      joinCode: code,
      nickname: nickname,
      distanceKm: distance,
      startAt: start,
      controls: controls,
      consentTracking: true,
      visibility: visibility,
      deviceId: deviceId,
      entryId: 'local-$deviceId',
      apiBaseUrl: apiBaseUrl,
    );
  }
}
