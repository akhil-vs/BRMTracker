import 'package:flutter/material.dart';

enum AppRole { rider, volunteer }

class RolePickerScreen extends StatelessWidget {
  const RolePickerScreen({super.key, required this.onPicked});

  final ValueChanged<AppRole> onPicked;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF16352D),
              Color(0xFF0B6E4F),
              Color(0xFF1A4A3C),
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 32),
                Text(
                  'BRM Tracker',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: -1,
                      ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Sign in once. Riders track with the screen off. Volunteers run the desk.',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Colors.white70,
                        height: 1.4,
                      ),
                ),
                const Spacer(),
                _RoleCard(
                  icon: Icons.pedal_bike,
                  title: 'I am a rider',
                  subtitle: 'Sign in → join code → ride',
                  onTap: () => onPicked(AppRole.rider),
                ),
                const SizedBox(height: 14),
                _RoleCard(
                  icon: Icons.fact_check,
                  title: 'I am a volunteer',
                  subtitle: 'Sign in → confirm riders · SOS live',
                  onTap: () => onPicked(AppRole.volunteer),
                ),
                const Spacer(),
                const Text(
                  'Admins set up events on the web. Supports safety awareness — does not replace 112.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: Colors.white54),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              CircleAvatar(
                radius: 26,
                backgroundColor: const Color(0xFFD3EBE3),
                child: Icon(icon, color: const Color(0xFF0B6E4F), size: 26),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF0F1C24),
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(color: Color(0xFF5A6B75)),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Color(0xFF5A6B75)),
            ],
          ),
        ),
      ),
    );
  }
}
