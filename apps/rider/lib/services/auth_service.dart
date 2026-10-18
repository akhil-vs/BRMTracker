import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../screens/role_picker_screen.dart';

class AppUser {
  AppUser({
    required this.id,
    required this.email,
    required this.displayName,
    required this.role,
    this.clubName,
  });

  final String id;
  final String email;
  final String displayName;
  final AppRole role;
  final String? clubName;

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'displayName': displayName,
        'role': role == AppRole.rider ? 'rider' : 'volunteer',
        'clubName': clubName,
      };

  factory AppUser.fromJson(Map<String, dynamic> m) => AppUser(
        id: m['id'] as String,
        email: m['email'] as String,
        displayName: m['displayName'] as String,
        role: (m['role'] as String?) == 'volunteer'
            ? AppRole.volunteer
            : AppRole.rider,
        clubName: m['clubName'] as String?,
      );
}

class _StoredAccount {
  _StoredAccount({
    required this.id,
    required this.email,
    required this.password,
    required this.displayName,
    required this.role,
    this.clubName,
  });

  final String id;
  final String email;
  final String password;
  final String displayName;
  final AppRole role;
  final String? clubName;

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'password': password,
        'displayName': displayName,
        'role': role == AppRole.rider ? 'rider' : 'volunteer',
        'clubName': clubName,
      };

  factory _StoredAccount.fromJson(Map<String, dynamic> m) => _StoredAccount(
        id: m['id'] as String,
        email: m['email'] as String,
        password: m['password'] as String,
        displayName: m['displayName'] as String,
        role: (m['role'] as String?) == 'volunteer'
            ? AppRole.volunteer
            : AppRole.rider,
        clubName: m['clubName'] as String?,
      );

  AppUser toUser() => AppUser(
        id: id,
        email: email,
        displayName: displayName,
        role: role,
        clubName: clubName,
      );
}

/// Local demo auth for the rider/volunteer APK (mirrors web seeded accounts).
class AuthService {
  static const sessionKey = 'brmtracker.app.user';
  static const registryKey = 'brmtracker.app.accounts';
  static const demoPassword = 'demo-password';

  static final List<_StoredAccount> seedAccounts = [
    _StoredAccount(
      id: 'demo-rider',
      email: 'rider@club.example',
      password: demoPassword,
      displayName: 'Demo Rider',
      role: AppRole.rider,
      clubName: 'Pune Randonneurs',
    ),
    _StoredAccount(
      id: 'demo-volunteer',
      email: 'volunteer@club.example',
      password: demoPassword,
      displayName: 'Control Volunteer',
      role: AppRole.volunteer,
      clubName: 'Pune Randonneurs',
    ),
  ];

  Future<List<_StoredAccount>> _registry() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(registryKey);
    if (raw == null) {
      await prefs.setString(
        registryKey,
        jsonEncode(seedAccounts.map((a) => a.toJson()).toList()),
      );
      return List.of(seedAccounts);
    }
    final list = (jsonDecode(raw) as List)
        .map((e) => _StoredAccount.fromJson(e as Map<String, dynamic>))
        .toList();
    final emails = list.map((a) => a.email.toLowerCase()).toSet();
    for (final seed in seedAccounts) {
      if (!emails.contains(seed.email.toLowerCase())) {
        list.add(seed);
      }
    }
    return list;
  }

  Future<void> _saveRegistry(List<_StoredAccount> accounts) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      registryKey,
      jsonEncode(accounts.map((a) => a.toJson()).toList()),
    );
  }

  Future<AppUser?> currentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(sessionKey);
    if (raw == null) return null;
    return AppUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  Future<AppUser> signIn({
    required String email,
    required String password,
    required AppRole expectedRole,
  }) async {
    final normalized = email.trim().toLowerCase();
    if (normalized.isEmpty || password.isEmpty) {
      throw Exception('Email and password are required');
    }
    final accounts = await _registry();
    _StoredAccount? match;
    for (final a in accounts) {
      if (a.email.toLowerCase() == normalized && a.password == password) {
        match = a;
        break;
      }
    }
    if (match == null) {
      throw Exception('Invalid email or password');
    }
    if (match.role != expectedRole) {
      throw Exception(
        'This account is a ${match.role == AppRole.rider ? 'rider' : 'volunteer'}. '
        'Go back and pick the matching role.',
      );
    }
    final user = match.toUser();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(sessionKey, jsonEncode(user.toJson()));
    return user;
  }

  Future<AppUser> signUp({
    required String email,
    required String password,
    required String displayName,
    required AppRole role,
  }) async {
    final normalized = email.trim().toLowerCase();
    final name = displayName.trim();
    if (normalized.isEmpty || password.isEmpty || name.isEmpty) {
      throw Exception('Name, email, and password are required');
    }
    if (password.length < 8) {
      throw Exception('Password must be at least 8 characters');
    }
    final accounts = await _registry();
    if (accounts.any((a) => a.email.toLowerCase() == normalized)) {
      throw Exception('An account with this email already exists');
    }
    final account = _StoredAccount(
      id: const Uuid().v4(),
      email: normalized,
      password: password,
      displayName: name,
      role: role,
      clubName: 'My Club',
    );
    accounts.add(account);
    await _saveRegistry(accounts);
    final user = account.toUser();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(sessionKey, jsonEncode(user.toJson()));
    return user;
  }

  Future<void> signOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(sessionKey);
  }

  List<({String email, String label})> quickAccountsFor(AppRole role) {
    return seedAccounts
        .where((a) => a.role == role)
        .map((a) => (email: a.email, label: a.displayName))
        .toList();
  }
}
