import 'package:flutter_test/flutter_test.dart';
import 'package:rider/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('role picker shows rider and volunteer', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const BrmTrackerApp());
    await tester.pump();
    await tester.pump();
    expect(find.text('BRM Tracker'), findsOneWidget);
    expect(find.text('I am a rider'), findsOneWidget);
    expect(find.text('I am a volunteer'), findsOneWidget);
  });

  testWidgets('rider path reaches sign-in', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const BrmTrackerApp());
    await tester.pump();
    await tester.pump();
    await tester.tap(find.text('I am a rider'));
    await tester.pumpAndSettle();
    expect(find.text('Sign in'), findsWidgets);
    expect(find.text('Rider sign-in. Same accounts work when Supabase is connected later.'),
        findsOneWidget);
  });
}
