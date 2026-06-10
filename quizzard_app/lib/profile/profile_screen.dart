import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../bgm.dart';
import '../leveling.dart';
import '../models/firestore_models.dart';
import '../services/database_service.dart';
import '../theme.dart';

const Color _kAccent = kNeonBlue;

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _soundEnabled = true;
  bool _bgmEnabled = Bgm.instance.enabled;

  @override
  void initState() {
    super.initState();
    _loadSoundSetting();
  }

  Future<void> _loadSoundSetting() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() => _soundEnabled = prefs.getBool('sound_enabled') ?? true);
    }
  }

  Future<void> _updateSoundSetting(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('sound_enabled', value);
    if (mounted) {
      setState(() => _soundEnabled = value);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return const Scaffold(body: Center(child: Text('Sign in to view your profile.')));
    }
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.black87,
        title: const Text('Profile'),
        actions: [
          IconButton(
            onPressed: () => FirebaseAuth.instance.signOut(),
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
          ),
        ],
      ),
      body: StreamBuilder<UserProfileDoc?>(
        stream: DatabaseService.instance.streamUserProfile(user.uid),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final profile = snapshot.data;
          if (profile == null) {
            return const Center(child: Text('No profile data found.'));
          }
          final stats = profile.stats;
          final categories = profile.categoryStats.values.toList()
            ..sort((a, b) => _acc(b).compareTo(_acc(a)));

          return Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _heroCard(profile),
                  const SizedBox(height: 16),
                  _sectionTitle('Performance'),
                  const SizedBox(height: 8),
                  _card(
                    Row(
                      children: [
                        _pctRing(stats.accuracy / 100, 'accuracy', _kAccent),
                        const SizedBox(width: 18),
                        Expanded(
                          child: Column(
                            children: [
                              Row(children: [
                                _miniStat('Games', '${stats.gamesPlayed}'),
                                const SizedBox(width: 10),
                                _miniStat('Correct', '${stats.totalCorrect}'),
                              ]),
                              const SizedBox(height: 10),
                              Row(children: [
                                _miniStat('Answered', '${stats.totalAnswered}'),
                                const SizedBox(width: 10),
                                _miniStat('Total XP', '${stats.totalXp}'),
                              ]),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _streakChip('🔥', 'Best Streak', stats.maxStreak, kNeonGreen),
                      const SizedBox(width: 10),
                      _streakChip('🏆', 'Win Streak', stats.winStreakBest, kNeonAmber),
                      const SizedBox(width: 10),
                      _streakChip('💀', 'Worst Run', stats.loseStreakBest, kNeonRed),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _sectionTitle('Multiplayer'),
                  const SizedBox(height: 8),
                  _card(
                    Row(
                      children: [
                        _pctRing(profile.mp.winRate / 100, 'win rate', kNeonPink),
                        const SizedBox(width: 18),
                        Expanded(
                          child: Column(
                            children: [
                              Row(children: [
                                _miniStat('Matches', '${profile.mp.played}'),
                                const SizedBox(width: 10),
                                _miniStat('Wins', '${profile.mp.wins}'),
                              ]),
                              const SizedBox(height: 10),
                              Row(children: [
                                _miniStat('Losses', '${profile.mp.losses}'),
                                const SizedBox(width: 10),
                                _miniStat('Draws', '${profile.mp.draws}'),
                              ]),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  _sectionTitle('Category Mastery'),
                  const SizedBox(height: 8),
                  if (categories.isEmpty)
                    _card(Text('No category stats yet — play a round to see your breakdown.',
                        style: body(14, color: kTextLo)))
                  else
                    _card(
                      Column(
                        children: [
                          for (final c in categories) ...[
                            _categoryBar(c),
                            if (c != categories.last) const SizedBox(height: 14),
                          ],
                        ],
                      ),
                    ),
                  const SizedBox(height: 20),
                  _sectionTitle('Settings'),
                  const SizedBox(height: 8),
                  _card(
                    Column(
                      children: [
                        SwitchListTile(
                          value: _soundEnabled,
                          onChanged: _updateSoundSetting,
                          activeColor: _kAccent,
                          title: const Text('Sound effects'),
                          subtitle: Text('Correct / wrong / tick sounds', style: body(11, color: kTextLo)),
                          contentPadding: EdgeInsets.zero,
                        ),
                        SwitchListTile(
                          value: _bgmEnabled,
                          onChanged: (v) {
                            setState(() => _bgmEnabled = v);
                            Bgm.instance.setEnabled(v);
                          },
                          activeColor: _kAccent,
                          title: const Text('Background music'),
                          subtitle: Text('Magical theme', style: body(11, color: kTextLo)),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _heroCard(UserProfileDoc profile) {
    final stats = profile.stats;
    final span = xpSpanForLevel(stats.level);
    final progress = (stats.xpInLevel / span).clamp(0.0, 1.0);
    final league = leagueForLevel(stats.level);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [_kAccent, Color(0xFF24306A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: _kAccent.withOpacity(0.35), blurRadius: 16, offset: const Offset(0, 6))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const CircleAvatar(
                radius: 28,
                backgroundColor: Colors.white24,
                child: Icon(Icons.person, color: Colors.white, size: 30),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      profile.displayName.isEmpty ? 'Player' : profile.displayName,
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    Text(profile.email, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('${league.emoji} LV ${stats.level}',
                      style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                  Text('${league.name} League', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${stats.totalXp} XP total', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              Text('${stats.xpInLevel}/$span to LV ${stats.level + 1}',
                  style: const TextStyle(color: Colors.white70, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 10,
              backgroundColor: Colors.white24,
              valueColor: const AlwaysStoppedAnimation(Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String text) =>
      Text(text, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: kTextHi));

  Widget _card(Widget child) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: kSurface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: kStroke),
        ),
        child: child,
      );

  static double _acc(CategoryStats c) =>
      c.totalAnswered == 0 ? 0.0 : (c.totalCorrect / c.totalAnswered).clamp(0.0, 1.0).toDouble();

  // Big animated percentage donut (accuracy, win rate, ...).
  Widget _pctRing(double pct, String label, Color color) {
    final p = pct.clamp(0.0, 1.0);
    return SizedBox(
      width: 96,
      height: 96,
      child: Stack(
        alignment: Alignment.center,
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: p),
            duration: const Duration(milliseconds: 900),
            curve: Curves.easeOutCubic,
            builder: (_, v, __) => SizedBox(
              width: 96,
              height: 96,
              child: CircularProgressIndicator(
                value: v,
                strokeWidth: 9,
                backgroundColor: kStroke,
                valueColor: AlwaysStoppedAnimation(color),
              ),
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('${(p * 100).round()}%', style: display(22, color: color)),
              Text(label, style: body(10, color: kTextLo)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _miniStat(String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
        decoration: BoxDecoration(
          color: kSurfaceAlt,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: display(16)),
            Text(label, style: body(10, color: kTextLo)),
          ],
        ),
      ),
    );
  }

  Widget _streakChip(String emoji, String label, int value, Color accent) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: kSurface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: accent.withOpacity(0.4)),
        ),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 20)),
            const SizedBox(height: 4),
            Text('$value', style: display(18, color: accent)),
            Text(label, style: body(10, color: kTextLo), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  // Clean horizontal mastery bar coloured by the category's accent.
  Widget _categoryBar(CategoryStats c) {
    final acc = _acc(c);
    final accent = categoryAccent(c.categoryName);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: Text(c.categoryName, style: body(14, w: FontWeight.w600))),
            Text('${(acc * 100).toStringAsFixed(0)}%', style: body(13, color: accent, w: FontWeight.w800)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: acc),
            duration: const Duration(milliseconds: 800),
            curve: Curves.easeOutCubic,
            builder: (_, v, __) => LinearProgressIndicator(
              value: v,
              minHeight: 9,
              backgroundColor: kStroke,
              valueColor: AlwaysStoppedAnimation(accent),
            ),
          ),
        ),
      ],
    );
  }
}
