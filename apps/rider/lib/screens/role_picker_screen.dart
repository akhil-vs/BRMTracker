import 'package:flutter/material.dart';

enum AppRole { rider, volunteer }

class RolePickerScreen extends StatelessWidget {
  const RolePickerScreen({super.key, required this.onPicked});

  final ValueChanged<AppRole> onPicked;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              Text(
                'BRM Tracker',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'One app for the event. Admins set up events on the web.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.black54,
                    ),
              ),
              const Spacer(),
              _RoleCard(
                icon: Icons.pedal_bike,
                title: 'I am a rider',
                subtitle: 'Join, track in the background, glance for time in hand',
                onTap: () => onPicked(AppRole.rider),
              ),
              const SizedBox(height: 16),
              _RoleCard(
                icon: Icons.fact_check,
                title: 'I am a volunteer',
                subtitle: 'Confirm riders at a control · see SOS and risk alerts',
                onTap: () => onPicked(AppRole.volunteer),
              ),
              const Spacer(),
              const Text(
                'Supports safety awareness — does not replace 112 or club procedures.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Colors.black45),
              ),
            ],
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
      elevation: 1,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: const Color(0xFFD8EFE6),
                child: Icon(icon, color: const Color(0xFF0B6E4F), size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(subtitle, style: const TextStyle(color: Colors.black54)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }
}
