import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import 'models.dart';
import 'services/join_service.dart';
import 'services/session_store.dart';
import 'services/tracking_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const BrmRiderApp());
}

class BrmRiderApp extends StatelessWidget {
  const BrmRiderApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BRM Tracker',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0B6E4F),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      home: const GateScreen(),
    );
  }
}

class GateScreen extends StatefulWidget {
  const GateScreen({super.key});

  @override
  State<GateScreen> createState() => _GateScreenState();
}

class _GateScreenState extends State<GateScreen> {
  final _sessions = SessionStore();
  RideSession? _session;
  bool _loading = true;
  bool _batteryDone = false;

  @override
  void initState() {
    super.initState();
    _restore();
  }

  Future<void> _restore() async {
    final s = await _sessions.load();
    setState(() {
      _session = s;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_session == null) {
      return JoinScreen(
        sessions: _sessions,
        onJoined: (session) => setState(() {
          _session = session;
          _batteryDone = false;
        }),
      );
    }
    if (!_batteryDone) {
      return BatteryChecklistScreen(
        onContinue: () => setState(() => _batteryDone = true),
      );
    }
    return RideScreen(
      session: _session!,
      sessions: _sessions,
      onLeave: () async {
        await _sessions.clear();
        setState(() {
          _session = null;
          _batteryDone = false;
        });
      },
    );
  }
}

class JoinScreen extends StatefulWidget {
  const JoinScreen({super.key, required this.sessions, required this.onJoined});

  final SessionStore sessions;
  final ValueChanged<RideSession> onJoined;

  @override
  State<JoinScreen> createState() => _JoinScreenState();
}

class _JoinScreenState extends State<JoinScreen> {
  final _code = TextEditingController(text: 'BRM200');
  final _nick = TextEditingController();
  bool _consent = false;
  String _visibility = 'public';
  String? _error;

  @override
  void dispose() {
    _code.dispose();
    _nick.dispose();
    super.dispose();
  }

  Future<void> _join() async {
    setState(() => _error = null);
    try {
      final join = JoinService(widget.sessions);
      final session = await join.join(
        code: _code.text,
        nickname: _nick.text,
        visibility: _visibility,
        consentTracking: _consent,
      );
      widget.onJoined(session);
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              'BRM Tracker',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Join once. Tracking continues with the screen off.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.black54,
                  ),
            ),
            const SizedBox(height: 28),
            TextField(
              controller: _code,
              textCapitalization: TextCapitalization.characters,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                labelText: 'Event join code',
                helperText: 'Try BRM200',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _nick,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                labelText: 'Nickname (public)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              // ignore: deprecated_member_use
              value: _visibility,
              decoration: const InputDecoration(
                labelText: 'Who can see my position',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: 'public', child: Text('Public (delayed)')),
                DropdownMenuItem(
                  value: 'followers',
                  child: Text('Followers only'),
                ),
                DropdownMenuItem(
                  value: 'organiser',
                  child: Text('Organiser only'),
                ),
              ],
              onChanged: (v) => setState(() => _visibility = v ?? 'public'),
            ),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              value: _consent,
              onChanged: (v) => setState(() => _consent = v ?? false),
              title: const Text(
                'I consent to location tracking for this event only',
              ),
            ),
            if (_error != null)
              Text(_error!, style: const TextStyle(color: Colors.red)),
            FilledButton(
              onPressed: _consent &&
                      _code.text.trim().isNotEmpty &&
                      _nick.text.trim().isNotEmpty
                  ? _join
                  : null,
              child: const Text('Join event'),
            ),
            const SizedBox(height: 12),
            const Text(
              'Does not replace emergency services (112) or club procedures.',
              style: TextStyle(color: Colors.black45, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}

class BatteryChecklistScreen extends StatefulWidget {
  const BatteryChecklistScreen({super.key, required this.onContinue});

  final VoidCallback onContinue;

  @override
  State<BatteryChecklistScreen> createState() => _BatteryChecklistScreenState();
}

class _BatteryChecklistScreenState extends State<BatteryChecklistScreen> {
  bool _unrestricted = false;
  bool _autostart = false;
  bool _lock = false;

  @override
  Widget build(BuildContext context) {
    final ready = _unrestricted && _autostart && _lock;
    return Scaffold(
      appBar: AppBar(title: const Text('Keep tracking alive')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Budget Android phones often kill GPS when the screen locks. '
            'Do this once per phone:',
          ),
          const SizedBox(height: 12),
          CheckboxListTile(
            value: _unrestricted,
            onChanged: (v) => setState(() => _unrestricted = v ?? false),
            title: const Text('Battery: Unrestricted / no optimisation'),
            subtitle: const Text('Xiaomi, Vivo, Oppo, Samsung: app battery settings'),
          ),
          CheckboxListTile(
            value: _autostart,
            onChanged: (v) => setState(() => _autostart = v ?? false),
            title: const Text('Allow autostart / background activity'),
          ),
          CheckboxListTile(
            value: _lock,
            onChanged: (v) => setState(() => _lock = v ?? false),
            title: const Text('Lock app in Recents (if available)'),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: ready ? widget.onContinue : null,
            child: const Text('Start ride screen'),
          ),
        ],
      ),
    );
  }
}

class RideScreen extends StatefulWidget {
  const RideScreen({
    super.key,
    required this.session,
    required this.sessions,
    required this.onLeave,
  });

  final RideSession session;
  final SessionStore sessions;
  final VoidCallback onLeave;

  @override
  State<RideScreen> createState() => _RideScreenState();
}

class _RideScreenState extends State<RideScreen> {
  late final TrackingService _tracking;
  String? _error;
  String? _toast;

  @override
  void initState() {
    super.initState();
    _tracking = TrackingService(sessions: widget.sessions);
    _tracking.onAutoCheckin = (c) {
      setState(() {
        _toast = 'Auto check-in: ${c.name}';
      });
    };
  }

  ControlPoint get _next =>
      widget.session.nextControl ?? widget.session.controls.last;

  Future<void> _toggleTrack() async {
    setState(() => _error = null);
    try {
      if (_tracking.isRunning) {
        await _tracking.stop();
      } else {
        await _tracking.start(widget.session);
      }
      setState(() {});
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  @override
  void dispose() {
    _tracking.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final timeFmt = DateFormat.Hm();
    final tih = _tracking.timeInHandMinutes();
    final next = _next;

    return Scaffold(
      backgroundColor: const Color(0xFFF3F0E8),
      appBar: AppBar(
        title: Text(widget.session.eventName),
        actions: [
          TextButton(onPressed: widget.onLeave, child: const Text('Leave')),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              color: Colors.white,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Text(
                      'Time in hand',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    Text(
                      tih == null
                          ? '—'
                          : '${tih >= 0 ? '+' : ''}$tih min',
                      style: Theme.of(context).textTheme.displayMedium?.copyWith(
                            color: (tih ?? 99) < 20
                                ? Colors.deepOrange.shade800
                                : const Color(0xFF0B6E4F),
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Next: ${next.name}',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    Text(
                      '${next.km.toStringAsFixed(0)} km · closes ${timeFmt.format(next.closeAt)}',
                      style: const TextStyle(color: Colors.black54, fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              _tracking.isRunning
                  ? 'Tracking on · ${_tracking.queuedCount} points queued · last seen preserved offline'
                  : 'Tracking off — tap start once, then put the phone away',
              textAlign: TextAlign.center,
            ),
            if (_toast != null) ...[
              const SizedBox(height: 8),
              Text(_toast!, textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF0B6E4F))),
            ],
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 12),
            FilledButton.icon(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
              onPressed: _toggleTrack,
              icon: Icon(_tracking.isRunning ? Icons.stop : Icons.play_arrow),
              label: Text(
                _tracking.isRunning ? 'Pause tracking' : 'Start tracking',
              ),
            ),
            const Spacer(),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(52),
                      foregroundColor: Colors.red.shade800,
                    ),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'SOS queued for organisers when online. Call 112 if in danger.',
                          ),
                        ),
                      );
                    },
                    child: const Text('SOS'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(52),
                    ),
                    onPressed: () async {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Abandon recorded locally.')),
                      );
                      await _tracking.stop();
                    },
                    child: const Text('Abandon'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
              'Supports safety awareness — does not replace 112 or club procedures.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: Colors.black45),
            ),
          ],
        ),
      ),
    );
  }
}
