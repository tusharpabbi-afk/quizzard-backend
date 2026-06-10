import 'dart:async';
import 'dart:convert';

import 'package:audioplayers/audioplayers.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show HapticFeedback;
import 'package:flutter_animate/flutter_animate.dart';
import 'package:http/http.dart' as http;

import 'config.dart';
import 'seen.dart';
import 'services/database_service.dart';
import 'services/match_service.dart';
import 'theme.dart';

/// Pulls a candidate pool (text + image only — audio/video need playback),
/// optionally excluding already-seen question ids.
Future<List<Map<String, dynamic>>> _fetchMatchPool(String? category, String? level, List<String> exclude) async {
  http.Response res;
  if (category != null && category.isNotEmpty) {
    res = await http.post(
      Uri.parse('$kApiBaseUrl/api/questions'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'category': category, 'level': level, 'limit': 40, 'exclude': exclude}),
    );
  } else {
    res = await http.get(Uri.parse('$kApiBaseUrl/api/questions?limit=40'));
  }
  if (res.statusCode < 200 || res.statusCode >= 300) return [];
  final list = (jsonDecode(res.body)['questions'] as List<dynamic>? ?? []);
  final cleaned = <Map<String, dynamic>>[];
  final seenText = <String>{};
  for (final raw in list) {
    final q = raw as Map<String, dynamic>;
    final mt = (q['mediaType'] ?? 'text').toString();
    if (mt != 'text' && mt != 'image') continue;
    final text = (q['question'] ?? '').toString();
    if (text.isEmpty || seenText.contains(text)) continue;
    seenText.add(text);
    cleaned.add({
      'id': q['id']?.toString() ?? '',
      'question': text,
      'options': (q['options'] as List<dynamic>? ?? []).map((e) => e.toString()).toList(),
      'correctIndex': (q['correctIndex'] as num?)?.toInt() ?? 0,
      'mediaUrl': (q['mediaUrl'] ?? '').toString(),
      'mediaType': mt,
    });
  }
  return cleaned;
}

/// Fetches a self-contained match set, avoiding questions already seen on this
/// device for the chosen category (so rematches bring new questions till exhausted).
Future<List<Map<String, dynamic>>> fetchMatchQuestions({String? category, String? level, int count = 10}) async {
  final useCat = category != null && category.isNotEmpty;
  final exclude = useCat ? await Seen.load(category) : <String>[];
  var cleaned = await _fetchMatchPool(category, level, exclude);
  if (cleaned.length < count && useCat) {
    await Seen.clear(category); // exhausted -> fresh cycle
    cleaned = await _fetchMatchPool(category, level, const []);
  }
  final result = cleaned.take(count).toList();
  if (useCat) {
    await Seen.add(category, result.map((q) => (q['id'] ?? '').toString()).where((s) => s.isNotEmpty));
  }
  return result;
}

// ---------------- Lobby ----------------
class MultiplayerLobbyScreen extends StatefulWidget {
  const MultiplayerLobbyScreen({super.key});
  @override
  State<MultiplayerLobbyScreen> createState() => _MultiplayerLobbyScreenState();
}

class _MultiplayerLobbyScreenState extends State<MultiplayerLobbyScreen> {
  final _codeCtrl = TextEditingController();
  bool _busy = false;
  String? _error;
  List<String> _categories = [];
  String? _selectedCategory; // null = Random Mix
  String _level = 'medium'; // easy | medium | hard

  // Media-only categories can't be played in multiplayer (no playback there).
  static const _excluded = {'Anthems', 'Nature Clips'};

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    try {
      final res = await http.get(Uri.parse('$kApiBaseUrl/api/categories'));
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        final names = (data['categories'] as List<dynamic>? ?? [])
            .map((e) => (e is Map ? e['name'] : e).toString())
            .where((n) => !_excluded.contains(n))
            .toList();
        if (mounted) setState(() => _categories = names);
      }
    } catch (_) {}
  }

  String get _categoryLabel => _selectedCategory ?? 'Random Mix';

  @override
  void dispose() {
    _codeCtrl.dispose();
    super.dispose();
  }

  Future<void> _create() async {
    setState(() { _busy = true; _error = null; });
    try {
      final qs = await fetchMatchQuestions(category: _selectedCategory, level: _level);
      if (qs.length < 4) throw 'Not enough questions for "$_categoryLabel"';
      final code = await MatchService.instance.createRoom(qs, _categoryLabel, _level);
      if (mounted) _open(code);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _join() async {
    final code = _codeCtrl.text.trim();
    if (code.isEmpty) return;
    setState(() { _busy = true; _error = null; });
    try {
      final id = await MatchService.instance.joinByCode(code);
      if (id == null) throw 'Room not found or already full';
      if (mounted) _open(id);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _random() async {
    setState(() { _busy = true; _error = null; });
    try {
      final qs = await fetchMatchQuestions(category: _selectedCategory, level: _level);
      if (qs.length < 4) throw 'Not enough questions for "$_categoryLabel"';
      final id = await MatchService.instance.findOrCreateRandom(qs, _categoryLabel, _level);
      if (mounted) _open(id);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _open(String id) {
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => MatchScreen(matchId: id)));
  }

  Widget _lvlChip(String label, String value) {
    final selected = _level == value;
    const colors = {'easy': kNeonGreen, 'medium': kNeonAmber, 'hard': kNeonRed};
    final c = colors[value]!;
    return Expanded(
      child: GestureDetector(
        onTap: _busy ? null : () => setState(() => _level = value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? c : kSurfaceAlt,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: selected ? c : kStroke),
          ),
          child: Text(label, style: body(13, color: selected ? Colors.black : kTextLo, w: FontWeight.w700)),
        ),
      ),
    );
  }

  Widget _catChip(String label, String? value) {
    final selected = _selectedCategory == value;
    return GestureDetector(
      onTap: _busy ? null : () => setState(() => _selectedCategory = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? kNeonBlue : kSurfaceAlt,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? kNeonBlue : kStroke),
        ),
        child: Text(label,
            style: body(13, color: selected ? Colors.white : kTextLo, w: FontWeight.w600)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Multiplayer')),
      body: NeonBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('⚔️', style: TextStyle(fontSize: 56)),
                      const SizedBox(height: 8),
                      Text('Head to Head', style: display(26)),
                      Text('10 questions • highest score wins', style: body(13, color: kTextLo)),
                      const SizedBox(height: 18),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text('Category', style: body(13, color: kTextLo, w: FontWeight.w700)),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _catChip('Random Mix', null),
                          for (final c in _categories) _catChip(c, c),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text('Difficulty', style: body(13, color: kTextLo, w: FontWeight.w700)),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _lvlChip('Easy', 'easy'),
                          const SizedBox(width: 8),
                          _lvlChip('Medium', 'medium'),
                          const SizedBox(width: 8),
                          _lvlChip('Hard', 'hard'),
                        ],
                      ),
                      const SizedBox(height: 22),
                      if (_busy) const Padding(padding: EdgeInsets.all(8), child: CircularProgressIndicator()),
                      if (_error != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Text(_error!, style: body(13, color: kNeonRed), textAlign: TextAlign.center),
                        ),
                      NeonButton(label: 'Find Opponent', icon: Icons.public, color: kNeonGreen, onTap: _busy ? null : _random),
                      const SizedBox(height: 14),
                      NeonButton(label: 'Create Room', icon: Icons.add, color: kNeonBlue, onTap: _busy ? null : _create),
                      const SizedBox(height: 18),
                      Row(children: [
                        Expanded(
                          child: TextField(
                            controller: _codeCtrl,
                            textCapitalization: TextCapitalization.characters,
                            decoration: const InputDecoration(labelText: 'Room code'),
                            onSubmitted: (_) => _busy ? null : _join(),
                          ),
                        ),
                        const SizedBox(width: 10),
                        NeonButton(label: 'Join', color: kNeonPurple, expand: false, onTap: _busy ? null : _join),
                      ]),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------- Match ----------------
class MatchScreen extends StatefulWidget {
  final String matchId;
  const MatchScreen({super.key, required this.matchId});
  @override
  State<MatchScreen> createState() => _MatchScreenState();
}

class _MatchScreenState extends State<MatchScreen> {
  final _svc = MatchService.instance;
  final AudioPlayer _sfx = AudioPlayer();
  List<Map<String, dynamic>> _questions = [];
  bool _started = false;
  int _idx = 0;
  int _myScore = 0;
  int _answered = 0;
  bool _locked = false;
  int? _selected;
  bool _finishedLocal = false;
  bool _recorded = false;
  int _round = 1;
  bool _resetting = false;
  int _timeLeft = 12;
  Timer? _timer;
  // Abandonment escape: once finished, after a grace period we let the waiting
  // player force the match to results so a vanished opponent can't hang it.
  Timer? _forceTimer;
  bool _canForceFinish = false;

  void _resetForRound(int round) {
    _round = round;
    _started = false;
    _idx = 0;
    _myScore = 0;
    _answered = 0;
    _locked = false;
    _selected = null;
    _finishedLocal = false;
    _recorded = false;
    _resetting = false;
    _questions = [];
    _forceTimer?.cancel();
    _canForceFinish = false;
  }

  void _maybeRecordResult(Map<String, dynamic> players) {
    if (_recorded) return;
    _recorded = true;
    final myScore = (players[_svc.uid]?['score'] ?? _myScore) as int;
    final scores = players.values.map((p) => ((p as Map)['score'] ?? 0) as int).toList();
    final top = scores.reduce((a, b) => a > b ? a : b);
    final topCount = scores.where((s) => s == top).length;
    final won = myScore == top && topCount == 1;
    final draw = myScore == top && topCount > 1;
    DatabaseService.instance.recordMultiplayerResult(uid: _svc.uid, won: won, draw: draw);
  }

  String _ordinal(int n) {
    if (n == 1) return '1st';
    if (n == 2) return '2nd';
    if (n == 3) return '3rd';
    return '${n}th';
  }

  // When both players have asked for a rematch, the host reloads fresh questions.
  void _maybeHostRematch(Map<String, dynamic> data, Map<String, dynamic> players) {
    if (_resetting) return;
    if ((data['hostUid'] ?? '').toString() != _svc.uid) return;
    final reqs = ((data['rematchRequests'] as List?) ?? []).map((e) => e.toString()).toSet();
    if (players.length >= 2 && reqs.containsAll(players.keys.toSet())) {
      _resetting = true;
      final cat = (data['categoryName'] ?? 'Random Mix').toString();
      () async {
        try {
          final qs = await fetchMatchQuestions(category: cat == 'Random Mix' ? null : cat);
          if (qs.length >= 4) await _svc.resetForRematch(widget.matchId, qs);
        } catch (_) {
          _resetting = false;
        }
      }();
    }
  }

  @override
  void initState() {
    super.initState();
    _sfx.setPlayerMode(PlayerMode.lowLatency);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _forceTimer?.cancel();
    _sfx.dispose();
    super.dispose();
  }

  void _beginIfNeeded(Map<String, dynamic> data) {
    if (_started) return;
    if (data['status'] != 'active') return;
    final raw = (data['questions'] as List<dynamic>? ?? []);
    if (raw.isEmpty) return;
    // Shuffle each question's options locally (recomputing the correct index),
    // so answer positions vary every play. Each client shuffles independently.
    _questions = raw.map((e) {
      final q = Map<String, dynamic>.from(e as Map);
      final opts = (q['options'] as List).map((o) => o.toString()).toList();
      final correct = opts[(q['correctIndex'] as num).toInt()];
      opts.shuffle();
      q['options'] = opts;
      q['correctIndex'] = opts.indexOf(correct);
      return q;
    }).toList();
    _started = true;
    WidgetsBinding.instance.addPostFrameCallback((_) => _startQuestionTimer());
  }

  void _startQuestionTimer() {
    _timer?.cancel();
    setState(() => _timeLeft = 12);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;
      if (_timeLeft <= 0) {
        t.cancel();
        _answer(-1); // timeout
      } else {
        setState(() => _timeLeft--);
      }
    });
  }

  Future<void> _answer(int i) async {
    if (_locked) return;
    final q = _questions[_idx];
    final correctIndex = q['correctIndex'] as int;
    final isCorrect = i == correctIndex;
    _timer?.cancel();
    HapticFeedback.lightImpact();
    setState(() {
      _locked = true;
      _selected = i;
      if (isCorrect) _myScore += 100 + _timeLeft * 10; // speed-weighted
      _answered++;
    });
    if (_soundEnabled) _sfx.play(AssetSource(isCorrect ? 'sounds/correct.mp3' : 'sounds/wrong.mp3'));
    HapticFeedback.mediumImpact();
    // Fire-and-forget: never block advancing on a Firestore write (was the "stuck" cause).
    _svc.recordAnswer(widget.matchId, score: _myScore, answered: _answered);
    Timer(const Duration(milliseconds: 850), _next);
  }

  // Sound effects always on for multiplayer simplicity (no per-screen setting wired here).
  bool get _soundEnabled => true;

  Future<void> _next() async {
    if (!mounted) return;
    if (_idx < _questions.length - 1) {
      setState(() {
        _idx++;
        _locked = false;
        _selected = null;
      });
      _startQuestionTimer();
    } else {
      setState(() => _finishedLocal = true);
      // Offer a manual "show results" escape if an opponent never finishes.
      _forceTimer?.cancel();
      _canForceFinish = false;
      _forceTimer = Timer(const Duration(seconds: 18), () {
        if (mounted) setState(() => _canForceFinish = true);
      });
      try {
        await _svc.finishPlayer(widget.matchId);
      } catch (_) {}
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: NeonBackground(
        child: SafeArea(
          child: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
            stream: _svc.streamMatch(widget.matchId),
            builder: (context, snap) {
              final data = snap.data?.data();
              if (data == null) {
                return const Center(child: CircularProgressIndicator());
              }
              final status = data['status'] as String? ?? 'waiting';
              final players = Map<String, dynamic>.from(data['players'] ?? {});
              final round = (data['round'] as num?)?.toInt() ?? 1;
              // A new round started (rematch) -> reset local play state.
              if (round != _round) _resetForRound(round);
              _beginIfNeeded(data);

              // Both players done -> results, even if the status-flip transaction lagged.
              final bothFinished = players.length >= 2 &&
                  players.values.every((p) => (p as Map)['finished'] == true);

              if (status == 'waiting') return _waitingView(data);
              if (status == 'finished' || bothFinished) {
                _maybeRecordResult(players);
                _maybeHostRematch(data, players);
                return _resultView(data, players);
              }
              // active
              if (_finishedLocal) return _waitingForOpponentView(players);
              return _playView(data, players);
            },
          ),
        ),
      ),
    );
  }

  Widget _waitingView(Map<String, dynamic> data) {
    final code = (data['code'] ?? '').toString();
    final isRandom = data['isRandom'] == true;
    final players = Map<String, dynamic>.from(data['players'] ?? {});
    final isHost = (data['hostUid'] ?? '').toString() == _svc.uid;
    final canStart = players.length >= 2;
    return Center(
      child: SingleChildScrollView(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (isRandom) ...[
                  const CircularProgressIndicator(),
                  const SizedBox(height: 24),
                  Text('Finding an opponent…', style: display(20), textAlign: TextAlign.center),
                ] else ...[
                  Text('Game Room', style: display(24)),
                  if (code.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    Text('Share this code', style: body(13, color: kTextLo)),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      decoration: BoxDecoration(
                        color: kSurface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: kNeonBlue),
                        boxShadow: neonGlow(kNeonBlue, blur: 16),
                      ),
                      child: Text(code, style: display(40, color: kNeonBlue)),
                    ),
                  ],
                  const SizedBox(height: 20),
                  Text('${players.length}/${MatchService.maxPlayers} players', style: body(13, color: kTextLo)),
                  const SizedBox(height: 10),
                  ...players.values.map((p) {
                    final name = (p as Map)['name']?.toString() ?? 'Player';
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        const Icon(Icons.person, size: 18, color: kNeonGreen),
                        const SizedBox(width: 8),
                        Text(name, style: body(15)),
                      ]),
                    );
                  }),
                  const SizedBox(height: 22),
                  if (isHost)
                    NeonButton(
                      label: canStart ? 'Start Game' : 'Waiting for players…',
                      icon: canStart ? Icons.play_arrow_rounded : null,
                      color: canStart ? kNeonGreen : kStroke,
                      onTap: canStart ? () => _svc.startMatch(widget.matchId) : null,
                    )
                  else
                    Column(children: [
                      const CircularProgressIndicator(),
                      const SizedBox(height: 8),
                      Text('Waiting for host to start…', style: body(13, color: kTextLo)),
                    ]),
                ],
                const SizedBox(height: 24),
                TextButton(onPressed: _leave, child: const Text('Leave')),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Live ranked strip of all players (scrollable for up to 5).
  Widget _scoreBar(Map<String, dynamic> players) {
    final entries = players.entries.toList()
      ..sort((a, b) => ((b.value['score'] ?? 0) as int).compareTo((a.value['score'] ?? 0) as int));
    return SizedBox(
      height: 64,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: entries.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final e = entries[i];
          final p = e.value as Map;
          final isMe = e.key == _svc.uid;
          // Live score uses my local value for myself (snappier than waiting for the write).
          final score = isMe ? _myScore : (p['score'] ?? 0) as int;
          final color = isMe ? kNeonBlue : kNeonPink;
          return Container(
            width: 110,
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
            decoration: BoxDecoration(
              color: isMe ? color.withOpacity(0.16) : kSurface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: color.withOpacity(0.5)),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(isMe ? 'You' : (p['name'] ?? 'Player').toString(),
                    maxLines: 1, overflow: TextOverflow.ellipsis, style: body(11, color: kTextLo)),
                Text('$score', style: display(20, color: color)),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _playView(Map<String, dynamic> data, Map<String, dynamic> players) {
    if (_questions.isEmpty) return const Center(child: CircularProgressIndicator());
    final q = _questions[_idx];
    final options = (q['options'] as List).cast<String>();
    final correctIndex = q['correctIndex'] as int;
    final mediaUrl = (q['mediaUrl'] ?? '').toString();
    final isImage = (q['mediaType'] == 'image') && mediaUrl.isNotEmpty;
    final category = (data['categoryName'] ?? '').toString();

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _scoreBar(players),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('$category · Q ${_idx + 1}/${_questions.length}', style: body(13, color: kTextLo)),
              Text('⏱ $_timeLeft s', style: body(13, color: _timeLeft <= 3 ? kNeonRed : kTextLo, w: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 10),
          GlowCard(
            child: Text(q['question'].toString(), style: display(17), textAlign: TextAlign.center),
          ),
          if (isImage)
            Flexible(
              child: Padding(
                padding: const EdgeInsets.only(top: 10),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(mediaUrl, fit: BoxFit.contain, width: double.infinity),
                ),
              ),
            ),
          const SizedBox(height: 12),
          ...List.generate(options.length, (i) {
            Color fill = kSurfaceAlt;
            Color border = kStroke;
            Color text = kTextHi;
            if (_locked) {
              if (i == correctIndex) { fill = kCorrect.withOpacity(0.16); border = kCorrect; text = kCorrect; }
              else if (i == _selected) { fill = kWrong.withOpacity(0.16); border = kWrong; text = kWrong; }
            }
            return GestureDetector(
              onTap: () => _answer(i),
              child: Container(
                width: double.infinity,
                margin: const EdgeInsets.symmetric(vertical: 5),
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                decoration: BoxDecoration(
                  color: fill,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: border, width: _locked && (i == correctIndex || i == _selected) ? 2 : 1),
                ),
                child: Text(options[i], style: body(15, color: text, w: FontWeight.w600)),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _waitingForOpponentView(Map<String, dynamic> players) {
    final stillPlaying = players.values.where((p) => (p as Map)['finished'] != true).length;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('You finished! 🎉', style: display(22)),
          const SizedBox(height: 8),
          Text('Your score: $_myScore', style: body(16, color: kNeonBlue)),
          const SizedBox(height: 24),
          const CircularProgressIndicator(),
          const SizedBox(height: 12),
          Text(
            stillPlaying == 1
                ? 'Waiting for opponent to finish…'
                : 'Waiting for $stillPlaying players to finish…',
            style: body(13, color: kTextLo),
          ),
          if (_canForceFinish) ...[
            const SizedBox(height: 22),
            Text('Taking too long?', style: body(12, color: kTextLo)),
            const SizedBox(height: 8),
            NeonButton(
              label: 'Show results now',
              icon: Icons.flag_rounded,
              color: kNeonAmber,
              expand: false,
              onTap: () => _svc.forceFinish(widget.matchId),
            ),
          ],
          const SizedBox(height: 20),
          TextButton(
            onPressed: _leave,
            child: const Text('Leave'),
          ),
        ],
      ),
    );
  }

  Widget _resultView(Map<String, dynamic> data, Map<String, dynamic> players) {
    final entries = players.entries.toList()
      ..sort((a, b) => ((b.value['score'] ?? 0) as int).compareTo((a.value['score'] ?? 0) as int));
    final myScore = (players[_svc.uid]?['score'] ?? _myScore) as int;
    final topScore = entries.isEmpty ? 0 : (entries.first.value['score'] ?? 0) as int;
    final topCount = entries.where((e) => ((e.value['score'] ?? 0) as int) == topScore).length;
    final place = 1 + entries.where((e) => ((e.value['score'] ?? 0) as int) > myScore).length;
    final isTop = myScore == topScore;
    final tiedTop = isTop && topCount > 1;
    final won = isTop && !tiedTop;
    final color = won ? kNeonGreen : (tiedTop ? kNeonAmber : (place == 2 ? kNeonAmber : kNeonRed));
    final headline = won ? 'You win! 🏆' : (tiedTop ? 'Tied for 1st!' : 'You placed ${_ordinal(place)}');
    final xp = won ? 250 : (tiedTop ? 100 : 50);

    final reqs = ((data['rematchRequests'] as List?) ?? []).map((e) => e.toString()).toSet();
    final iAsked = reqs.contains(_svc.uid);

    return Center(
      child: SingleChildScrollView(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(headline, style: display(30, color: color))
                    .animate()
                    .fadeIn()
                    .scale(begin: const Offset(0.6, 0.6), curve: Curves.easeOutBack),
                Text('+$xp XP', style: body(13, color: kNeonAmber, w: FontWeight.w700)),
                const SizedBox(height: 20),
                // Ranked standings.
                for (var i = 0; i < entries.length; i++)
                  _rankRow(i + 1, entries[i], entries[i].key == _svc.uid, myScore),
                const SizedBox(height: 24),
                if (iAsked)
                  Column(children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 8),
                    Text('Rematch: ${reqs.length}/${players.length} ready…', style: body(13, color: kTextLo)),
                    const SizedBox(height: 14),
                  ])
                else
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: NeonButton(
                      label: 'Rematch',
                      icon: Icons.refresh_rounded,
                      color: kNeonGreen,
                      onTap: () => _svc.requestRematch(widget.matchId),
                    ),
                  ),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _leave,
                    icon: const Icon(Icons.home_rounded),
                    label: const Text('Back to Home'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _rankRow(int rank, MapEntry<String, dynamic> e, bool isMe, int myScore) {
    final p = e.value as Map;
    final score = isMe ? myScore : (p['score'] ?? 0) as int;
    final color = rank == 1 ? kNeonGreen : kTextLo;
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isMe ? kNeonBlue.withOpacity(0.14) : kSurface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isMe ? kNeonBlue : kStroke),
      ),
      child: Row(
        children: [
          Text('#$rank', style: body(14, color: color, w: FontWeight.w800)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(isMe ? 'You' : (p['name'] ?? 'Player').toString(),
                maxLines: 1, overflow: TextOverflow.ellipsis, style: body(14, w: FontWeight.w600)),
          ),
          Text('$score', style: display(18, color: isMe ? kNeonBlue : kTextHi)),
        ],
      ),
    );
  }

  Future<void> _leave() async {
    await _svc.leave(widget.matchId);
    if (mounted) Navigator.popUntil(context, (r) => r.isFirst);
  }
}
