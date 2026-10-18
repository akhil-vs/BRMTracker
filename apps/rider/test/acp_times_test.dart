import 'package:flutter_test/flutter_test.dart';
import 'package:rider/acp_times.dart';

void main() {
  test('opening 60km ≈ 1h46', () {
    expect(roundMinutes(openingElapsedHours(60)), 106);
  });

  test('closing 60km = 4h', () {
    expect(roundMinutes(closingElapsedHours(60)), 240);
  });

  test('200 finish closes 13h30', () {
    final t = controlTimes(
      DateTime(2026, 1, 1, 6),
      200,
      200,
      isFinish: true,
    );
    expect(t.closeMinutesFromStart, 13 * 60 + 30);
  });
}
