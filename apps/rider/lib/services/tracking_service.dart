import 'dart:async';

import 'package:battery_plus/battery_plus.dart';
import 'package:geolocator/geolocator.dart';

import '../models.dart';
import 'geofence_service.dart';
import 'position_queue.dart';
import 'session_store.dart';

typedef CheckinCallback = void Function(ControlPoint control);

/// Tracking loop with adaptive sampling, offline queue, and geofence check-in.
/// Uses a persistent notification permission + high-accuracy stream; pair with
/// Android FOREGROUND_SERVICE_LOCATION for production battery survival.
class TrackingService {
  TrackingService({
    PositionQueue? queue,
    SessionStore? sessions,
    GeofenceService? geofence,
  })  : _queue = queue ?? PositionQueue(),
        _sessions = sessions ?? SessionStore(),
        _geofence = geofence ?? GeofenceService();

  final PositionQueue _queue;
  final SessionStore _sessions;
  final GeofenceService _geofence;
  final Battery _battery = Battery();

  StreamSubscription<Position>? _sub;
  Timer? _flushTimer;
  bool _running = false;
  RideSession? _session;
  DateTime? _lastSampleAt;
  QueuedPosition? lastPosition;
  int queuedCount = 0;
  CheckinCallback? onAutoCheckin;

  bool get isRunning => _running;
  RideSession? get session => _session;

  Future<bool> ensurePermission() async {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse;
  }

  Future<void> start(RideSession session) async {
    if (_running) return;
    final ok = await ensurePermission();
    if (!ok) throw StateError('Location permission denied');

    _session = session;
    _running = true;

    const settings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 20,
    );

    _sub = Geolocator.getPositionStream(locationSettings: settings).listen((
      pos,
    ) async {
      await _maybeRecord(pos);
    });

    _flushTimer = Timer.periodic(const Duration(minutes: 2), (_) async {
      await flush();
    });
  }

  Future<void> _maybeRecord(Position pos) async {
    final now = DateTime.now();
    final interval = _adaptiveIntervalSeconds(pos);
    if (_lastSampleAt != null &&
        now.difference(_lastSampleAt!).inSeconds < interval) {
      return;
    }
    _lastSampleAt = now;

    int? batteryPct;
    try {
      batteryPct = await _battery.batteryLevel;
    } catch (_) {}

    final sample = QueuedPosition(
      recordedAt: now,
      lat: pos.latitude,
      lng: pos.longitude,
      accuracyM: pos.accuracy,
      batteryPct: batteryPct,
    );
    lastPosition = sample;
    await _queue.enqueue(sample);
    queuedCount = await _queue.length();

    final session = _session;
    if (session != null) {
      final hits = _geofence.detectArrivals(
        session: session,
        lat: pos.latitude,
        lng: pos.longitude,
      );
      if (hits.isNotEmpty) {
        await _sessions.save(session);
        for (final c in hits) {
          onAutoCheckin?.call(c);
        }
      }
    }
  }

  int _adaptiveIntervalSeconds(Position pos) {
    final session = _session;
    if (session == null) return 30;
    for (final c in session.controls) {
      if (c.lat == null || c.lng == null || c.checkedIn) continue;
      final metres = Geolocator.distanceBetween(
        pos.latitude,
        pos.longitude,
        c.lat!,
        c.lng!,
      );
      if (metres < 1000) return 8;
    }
    return 40;
  }

  Future<int> flush() async {
    final session = _session;
    if (session == null) return 0;
    return _queue.flushToBackend(
      apiBaseUrl: session.apiBaseUrl,
      entryId: session.entryId,
      deviceId: session.deviceId,
    );
  }

  Future<void> stop() async {
    await _sub?.cancel();
    _sub = null;
    _flushTimer?.cancel();
    _flushTimer = null;
    await flush();
    _running = false;
  }

  /// Crow-flies time-in-hand vs next control close.
  int? timeInHandMinutes() {
    final session = _session;
    final next = session?.nextControl;
    final last = lastPosition;
    if (session == null || next == null) return null;

    final minutesUntilClose =
        next.closeAt.difference(DateTime.now()).inMinutes;
    double remainingKm = next.km;
    if (last != null && next.lat != null && next.lng != null) {
      remainingKm =
          Geolocator.distanceBetween(
            last.lat,
            last.lng,
            next.lat!,
            next.lng!,
          ) /
          1000.0;
    }
    final need = (remainingKm / 15.0 * 60).round();
    return minutesUntilClose - need;
  }
}
