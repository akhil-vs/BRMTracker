/// ACP / BRM control open & close times (Dart port of packages/acp-times).
library;

const overallLimitMinutes = {
  200: 13 * 60 + 30,
  300: 20 * 60,
  400: 27 * 60,
  600: 40 * 60,
  1000: 75 * 60,
};

int roundMinutes(double hours) => (hours * 60).round();

double openingElapsedHours(double distanceKm) {
  var remaining = distanceKm < 0 ? 0.0 : distanceKm;
  var prev = 0.0;
  var hours = 0.0;
  const segments = [
    (200.0, 34.0),
    (400.0, 32.0),
    (600.0, 30.0),
    (1000.0, 28.0),
  ];
  for (final seg in segments) {
    if (remaining <= 0) break;
    final span = remaining < (seg.$1 - prev) ? remaining : (seg.$1 - prev);
    hours += span / seg.$2;
    remaining -= span;
    prev = seg.$1;
  }
  if (remaining > 0) hours += remaining / 28;
  return hours;
}

double closingElapsedHours(double distanceKm) {
  final d = distanceKm < 0 ? 0.0 : distanceKm;
  if (d <= 60) return 1 + d / 20;
  var hours = 4.0;
  if (d <= 600) return hours + (d - 60) / 15;
  hours += (600 - 60) / 15;
  return hours + (d - 600) / 11.428;
}

int nearestBrevetDistance(num distanceKm) {
  const options = [200, 300, 400, 600, 1000];
  var best = 200;
  var bestDiff = (distanceKm - 200).abs();
  for (final o in options) {
    final diff = (distanceKm - o).abs();
    if (diff < bestDiff) {
      best = o;
      bestDiff = diff;
    }
  }
  return best;
}

class ControlTimes {
  ControlTimes({
    required this.openMinutesFromStart,
    required this.closeMinutesFromStart,
    required this.openAt,
    required this.closeAt,
  });

  final int openMinutesFromStart;
  final int closeMinutesFromStart;
  final DateTime openAt;
  final DateTime closeAt;
}

ControlTimes controlTimes(
  DateTime startAt,
  double controlKm,
  int brevetDistanceKm, {
  bool isFinish = false,
}) {
  final brevet = nearestBrevetDistance(brevetDistanceKm);
  final calcKm = controlKm < brevet ? controlKm : brevet.toDouble();

  var openMin = roundMinutes(openingElapsedHours(calcKm));
  var closeMin = roundMinutes(closingElapsedHours(calcKm));
  final overall = overallLimitMinutes[brevet]!;

  final finish =
      isFinish ||
      controlKm >= brevetDistanceKm - 0.5 ||
      controlKm >= brevet - 0.5;

  if (finish) {
    closeMin = overall;
  } else {
    closeMin = closeMin < overall ? closeMin : overall;
  }

  if (controlKm <= 0.01) {
    openMin = 0;
    closeMin = 60;
  }

  return ControlTimes(
    openMinutesFromStart: openMin,
    closeMinutesFromStart: closeMin,
    openAt: startAt.add(Duration(minutes: openMin)),
    closeAt: startAt.add(Duration(minutes: closeMin)),
  );
}

String formatDuration(int totalMinutes) {
  final h = totalMinutes ~/ 60;
  final m = totalMinutes % 60;
  return '${h}h${m.toString().padLeft(2, '0')}';
}
