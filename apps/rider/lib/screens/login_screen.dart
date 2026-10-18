import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import 'role_picker_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({
    super.key,
    required this.role,
    required this.auth,
    required this.onAuthenticated,
    required this.onBack,
  });

  final AppRole role;
  final AuthService auth;
  final ValueChanged<AppUser> onAuthenticated;
  final VoidCallback onBack;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late final TextEditingController _email;
  late final TextEditingController _password;
  final _name = TextEditingController();
  bool _signUp = false;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final seeded = widget.role == AppRole.rider
        ? 'rider@club.example'
        : 'volunteer@club.example';
    _email = TextEditingController(text: seeded);
    _password = TextEditingController(text: AuthService.demoPassword);
    _name.text =
        widget.role == AppRole.rider ? 'Demo Rider' : 'Control Volunteer';
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _name.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _error = null;
      _busy = true;
    });
    try {
      final user = _signUp
          ? await widget.auth.signUp(
              email: _email.text,
              password: _password.text,
              displayName: _name.text,
              role: widget.role,
            )
          : await widget.auth.signIn(
              email: _email.text,
              password: _password.text,
              expectedRole: widget.role,
            );
      widget.onAuthenticated(user);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final roleLabel =
        widget.role == AppRole.rider ? 'Rider' : 'Volunteer';
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: IconButton(
                onPressed: widget.onBack,
                icon: const Icon(Icons.arrow_back),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'BRM Tracker',
              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              '$roleLabel sign-in. Same accounts work when Supabase is connected later.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: const Color(0xFF5A6B75),
                  ),
            ),
            const SizedBox(height: 28),
            SegmentedButton<bool>(
              segments: const [
                ButtonSegment(value: false, label: Text('Sign in')),
                ButtonSegment(value: true, label: Text('Create')),
              ],
              selected: {_signUp},
              onSelectionChanged: (s) => setState(() => _signUp = s.first),
            ),
            const SizedBox(height: 20),
            if (_signUp) ...[
              TextField(
                controller: _name,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Display name',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
            ],
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              autocorrect: false,
              decoration: const InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _password,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Password',
                helperText: 'Demo accounts use demo-password',
                border: OutlineInputBorder(),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Color(0xFFB91C1C))),
            ],
            const SizedBox(height: 20),
            FilledButton(
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
              ),
              onPressed: _busy ? null : _submit,
              child: Text(_busy
                  ? 'Please wait…'
                  : _signUp
                      ? 'Create account'
                      : 'Sign in'),
            ),
            const SizedBox(height: 16),
            Text(
              'Demo: tap to fill ${widget.role == AppRole.rider ? 'rider' : 'volunteer'} account',
              style: const TextStyle(color: Color(0xFF5A6B75), fontSize: 13),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: widget.auth.quickAccountsFor(widget.role).map((a) {
                return OutlinedButton(
                  onPressed: () {
                    setState(() {
                      _signUp = false;
                      _email.text = a.email;
                      _password.text = AuthService.demoPassword;
                    });
                  },
                  child: Text(a.label),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}
