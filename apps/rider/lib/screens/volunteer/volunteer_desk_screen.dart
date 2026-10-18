import 'package:flutter/material.dart';

import '../../services/demo_event_store.dart';

class VolunteerDeskScreen extends StatefulWidget {
  const VolunteerDeskScreen({
    super.key,
    required this.event,
    required this.volunteerName,
    required this.onVolunteerNameChanged,
    required this.onConfirm,
    required this.onUndo,
  });

  final DemoEvent event;
  final String volunteerName;
  final ValueChanged<String> onVolunteerNameChanged;
  final Future<void> Function(String entryId, String controlId) onConfirm;
  final Future<void> Function(String checkinId) onUndo;

  @override
  State<VolunteerDeskScreen> createState() => _VolunteerDeskScreenState();
}

class _VolunteerDeskScreenState extends State<VolunteerDeskScreen> {
  late String _controlId;
  String _query = '';
  late final TextEditingController _nameCtrl;

  @override
  void initState() {
    super.initState();
    _controlId = widget.event.controls.length > 1
        ? widget.event.controls[1].id
        : widget.event.controls.first.id;
    _nameCtrl = TextEditingController(text: widget.volunteerName);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  DemoCheckin? _activeFor(String entryId) {
    for (final c in widget.event.checkins) {
      if (c.undoneAt == null &&
          c.entryId == entryId &&
          c.controlId == _controlId) {
        return c;
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final filtered = widget.event.entries.where((e) {
      final q = _query.trim().toLowerCase();
      if (q.isEmpty) return true;
      return e.bib.toLowerCase().contains(q) ||
          e.nickname.toLowerCase().contains(q);
    }).toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(widget.event.name, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 4),
        Text(
          'Code ${widget.event.joinCode} · field desk (app)',
          style: const TextStyle(color: Colors.black54),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _nameCtrl,
          decoration: const InputDecoration(
            labelText: 'Your name (audit)',
            border: OutlineInputBorder(),
          ),
          onChanged: widget.onVolunteerNameChanged,
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          // ignore: deprecated_member_use
          value: _controlId,
          decoration: const InputDecoration(
            labelText: 'This control',
            border: OutlineInputBorder(),
          ),
          items: widget.event.controls
              .map(
                (c) => DropdownMenuItem(
                  value: c.id,
                  child: Text(
                    '${c.seq}. ${c.name} (${c.km.toStringAsFixed(0)} km)',
                  ),
                ),
              )
              .toList(),
          onChanged: (v) => setState(() => _controlId = v ?? _controlId),
        ),
        const SizedBox(height: 12),
        TextField(
          autofocus: true,
          decoration: const InputDecoration(
            labelText: 'Find bib or nickname',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.search),
          ),
          onChanged: (v) => setState(() => _query = v),
        ),
        const SizedBox(height: 16),
        ...filtered.map((e) {
          final already = _activeFor(e.id);
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    '#${e.bib}  ${e.nickname}',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 10),
                  if (already != null) ...[
                    Text(
                      'Confirmed ${TimeOfDay.fromDateTime(already.checkedAt).format(context)}'
                      '${already.late ? ' (late)' : ''} by ${already.confirmedBy}',
                      style: TextStyle(color: Colors.green.shade800),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                      ),
                      onPressed: () => widget.onUndo(already.id),
                      child: const Text('Undo'),
                    ),
                  ] else
                    FilledButton(
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(52),
                      ),
                      onPressed: () => widget.onConfirm(e.id, _controlId),
                      child: const Text('Confirm arrival'),
                    ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}
