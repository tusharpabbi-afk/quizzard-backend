import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import 'leveling.dart';
import 'models/firestore_models.dart';
import 'services/database_service.dart';
import 'theme.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});
  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  bool _mpMode = false; // false = XP, true = Multiplayer wins

  @override
  Widget build(BuildContext context) {
    final myUid = FirebaseAuth.instance.currentUser?.uid;
    return Scaffold(
      appBar: AppBar(title: const Text('Leaderboard')),
      body: NeonBackground(
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                children: [
                  // XP / Multiplayer toggle
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                    child: Row(
                      children: [
                        _tab('XP', !_mpMode, () => setState(() => _mpMode = false)),
                        const SizedBox(width: 8),
                        _tab('Multiplayer', _mpMode, () => setState(() => _mpMode = true)),
                      ],
                    ),
                  ),
                  Expanded(
                    child: StreamBuilder<List<UserProfileDoc>>(
                      stream: DatabaseService.instance.streamUsers(),
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const Center(child: CircularProgressIndicator());
                        }
                        if (snapshot.hasError) {
                          return Center(child: Text('Could not load leaderboard.\n${snapshot.error}', textAlign: TextAlign.center));
                        }
                        var users = (snapshot.data ?? []);
                        if (_mpMode) {
                          users = users.where((u) => u.mp.played > 0).toList()
                            ..sort((a, b) => b.mp.wins != a.mp.wins
                                ? b.mp.wins.compareTo(a.mp.wins)
                                : b.mp.winRate.compareTo(a.mp.winRate));
                        } else {
                          users = users.toList()..sort((a, b) => b.stats.totalXp.compareTo(a.stats.totalXp));
                        }
                        if (users.isEmpty) {
                          return Center(
                            child: Text(_mpMode ? 'No multiplayer games yet.' : 'No players yet. Be the first!',
                                style: body(15, color: kTextLo)),
                          );
                        }
                        return ListView.separated(
                          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                          itemCount: users.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, i) {
                            final u = users[i];
                            final rank = i + 1;
                            final isMe = u.uid == myUid;
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: isMe ? kNeonBlue.withOpacity(0.14) : kSurface,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: isMe ? kNeonBlue : kStroke),
                              ),
                              child: Row(
                                children: [
                                  _rankBadge(rank),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(u.displayName.isEmpty ? 'Player' : u.displayName,
                                            style: body(14, w: isMe ? FontWeight.w800 : FontWeight.w600)),
                                        Text(
                                          _mpMode
                                              ? '${u.mp.played} matches • ${u.mp.winRate.toStringAsFixed(0)}% win'
                                              : 'Level ${u.stats.level} • ${leagueForLevel(u.stats.level).name}',
                                          style: body(11, color: kTextLo),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Text(
                                    _mpMode ? '${u.mp.wins} W' : '${u.stats.totalXp} XP',
                                    style: body(15, color: _mpMode ? kNeonPink : kNeonAmber, w: FontWeight.w800),
                                  ),
                                ],
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _tab(String label, bool active, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: active ? kNeonBlue : kSurfaceAlt,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: active ? kNeonBlue : kStroke),
          ),
          child: Text(label, style: body(14, color: active ? Colors.white : kTextLo, w: FontWeight.w700)),
        ),
      ),
    );
  }

  Widget _rankBadge(int rank) {
    const medals = {1: Color(0xFFFFD700), 2: Color(0xFFC0C0C0), 3: Color(0xFFCD7F32)};
    final color = medals[rank] ?? kSurfaceAlt;
    return CircleAvatar(
      radius: 17,
      backgroundColor: color,
      child: Text('$rank',
          style: TextStyle(fontWeight: FontWeight.bold, color: rank <= 3 ? Colors.black : kTextLo, fontSize: 13)),
    );
  }
}
