import 'package:flutter/material.dart';

import '../../services/demo_event_store.dart';

class VolunteerLiveScreen extends StatelessWidget {
  const VolunteerLiveScreen({
    super.key,
    required this.event,
    required this.onRefresh,
    this.onAckSos,
  });

  final DemoEvent event;
  final Future<void> Function() onRefresh;
  final Future<void> Function(String alertId)? onAckSos;

  @override
  Widget build(BuildContext context) {
    final sorted = [...event.entries]
      ..sort(
        (a, b) =>
            (a.timeInHandMinutes ?? 999).compareTo(b.timeInHandMinutes ?? 999),
      );

    final sos = event.alerts.where((a) => a.active && a.type == 'sos');

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (sos.isNotEmpty) ...[
            Text('SOS', style: TextStyle(color: Colors.red.shade800, fontSize: 18, fontWeight: FontWeight.bold)),
            ...sos.map((a) {
              DemoEntry? e;
              for (final x in event.entries) {
                if (x.id == a.entryId) e = x;
              }
              return Card(
                color: Colors.red.shade50,
                child: ListTile(
                  title: Text('#${e?.bib ?? '?'} ${e?.nickname ?? a.entryId}'),
                  subtitle: Text(a.message),
                  trailing: onAckSos == null
                      ? null
                      : TextButton(
                          onPressed: () => onAckSos!(a.id),
                          child: const Text('Ack'),
                        ),
                ),
              );
            }),
            const SizedBox(height: 12),
          ],
          Text('By risk (time in hand)', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          ...sorted.map((e) {
            final tih = e.timeInHandMinutes;
            final color = tih == null
                ? Colors.black54
                : tih < 0
                    ? Colors.red.shade800
                    : tih < 20
                        ? Colors.deepOrange.shade800
                        : Colors.green.shade800;
            return Card(
              child: ListTile(
                title: Text('#${e.bib} ${e.nickname}'),
                subtitle: Text(
                  [
                    e.status,
                    if (e.batteryPct != null) '${e.batteryPct}% battery',
                    if (e.lastSeenAt != null)
                      'last ${TimeOfDay.fromDateTime(e.lastSeenAt!).format(context)}',
                  ].join(' · '),
                ),
                trailing: Text(
                  tih == null ? '—' : '$tih m',
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
              ),
            );
          }),
          const SizedBox(height: 16),
          const Text(
            'Full map HQ view is on the admin web. This list is for the control phone.',
            style: TextStyle(color: Colors.black45, fontSize: 13),
          ),
        ],
      ),
    );
  }
}
