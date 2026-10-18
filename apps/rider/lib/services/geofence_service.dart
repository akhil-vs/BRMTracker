import 'package:geolocator/geolocator.dart';

import '../models.dart';

class GeofenceService {
  /// Returns controls newly entered (not yet checked in).
  List<ControlPoint> detectArrivals({
    required RideSession session,
    required double lat,
    required double lng,
  }) {
    final hits = <ControlPoint>[];
    for (final c in session.controls) {
      if (c.checkedIn || c.lat == null || c.lng == null) continue;
      final metres = Geolocator.distanceBetween(lat, lng, c.lat!, c.lng!);
      if (metres <= c.radiusM) {
        c.checkedIn = true;
        hits.add(c);
      }
    }
    return hits;
  }
}
