import 'package:flutter_test/flutter_test.dart';
import 'package:rider/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('join screen shows brand', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const BrmRiderApp());
    await tester.pump(); // loading
    await tester.pump(); // join screen
    expect(find.text('BRM Tracker'), findsOneWidget);
    expect(find.text('Join event'), findsOneWidget);
  });
}
