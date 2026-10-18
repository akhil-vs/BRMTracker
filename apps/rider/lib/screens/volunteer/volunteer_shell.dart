import 'package:flutter/material.dart';

import '../../services/demo_event_store.dart';
import 'volunteer_desk_screen.dart';
import 'volunteer_live_screen.dart';

class VolunteerShell extends StatefulWidget {
  const VolunteerShell({super.key, required this.onLeave});

  final VoidCallback onLeave;

  @override
  State<VolunteerShell> createState() => _VolunteerShellState();
}

class _VolunteerShellState extends State<VolunteerShell> {
  final _store = DemoEventStore();
  DemoEvent? _event;
  String _volunteerName = 'Volunteer';
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  Future<void> _reload() async {
    final e = await _store.load();
    setState(() => _event = e);
  }

  @override
  Widget build(BuildContext context) {
    final event = _event;
    if (event == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_tab == 0 ? 'Control desk' : 'Live alerts'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: widget.onLeave,
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _reload,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: IndexedStack(
        index: _tab,
        children: [
          VolunteerDeskScreen(
            event: event,
            volunteerName: _volunteerName,
            onVolunteerNameChanged: (v) => setState(() => _volunteerName = v),
            onConfirm: (entryId, controlId) async {
              await _store.confirmCheckin(
                entryId: entryId,
                controlId: controlId,
                volunteerName: _volunteerName,
              );
              await _reload();
            },
            onUndo: (checkinId) async {
              await _store.undoCheckin(checkinId);
              await _reload();
            },
          ),
          VolunteerLiveScreen(
            event: event,
            onRefresh: _reload,
            onAckSos: (id) async {
              await _store.acknowledgeSos(id);
              await _reload();
            },
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.touch_app_outlined),
            selectedIcon: Icon(Icons.touch_app),
            label: 'Desk',
          ),
          NavigationDestination(
            icon: Icon(Icons.warning_amber_outlined),
            selectedIcon: Icon(Icons.warning_amber),
            label: 'Live',
          ),
        ],
      ),
    );
  }
}
