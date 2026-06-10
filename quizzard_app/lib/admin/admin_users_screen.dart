import 'package:flutter/material.dart';

import '../models/firestore_models.dart';
import '../services/database_service.dart';

class AdminUsersScreen extends StatelessWidget {
  const AdminUsersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<UserProfileDoc>>(
      stream: DatabaseService.instance.streamUsers(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        final users = snapshot.data ?? [];
        if (users.isEmpty) {
          return const Center(child: Text('No users yet.'));
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: users.length,
          separatorBuilder: (_, __) => const SizedBox(height: 16),
          itemBuilder: (context, index) {
            final user = users[index];
            final categories = user.categoryStats.values.toList()
              ..sort((a, b) => b.gamesPlayed.compareTo(a.gamesPlayed));
            final accuracy = user.stats.accuracy / 100;
            final maxAnswered = categories.isEmpty ? 1 : categories.map((c) => c.totalAnswered).reduce((a, b) => a > b ? a : b);
            return Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const CircleAvatar(child: Icon(Icons.person)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(user.displayName.isEmpty ? 'Player' : user.displayName,
                                  style: const TextStyle(fontWeight: FontWeight.bold)),
                              Text(user.email, style: const TextStyle(color: Colors.black54)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _statChip('Games', user.stats.gamesPlayed.toString()),
                        const SizedBox(width: 8),
                        _statChip('Answered', user.stats.totalAnswered.toString()),
                        const SizedBox(width: 8),
                        _statChip('Correct', user.stats.totalCorrect.toString()),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text('Accuracy • ${user.stats.accuracy.toStringAsFixed(1)}%'),
                    const SizedBox(height: 6),
                    LinearProgressIndicator(value: accuracy.isNaN ? 0 : accuracy),
                    const SizedBox(height: 10),
                    Text('Level ${user.stats.level} • XP ${user.stats.xpInLevel}/1000'),
                    const SizedBox(height: 6),
                    LinearProgressIndicator(value: (user.stats.xpInLevel / 1000).clamp(0, 1)),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        _statChip('Max Streak', user.stats.maxStreak.toString()),
                        const SizedBox(width: 8),
                        _statChip('5x', user.stats.streak5Count.toString()),
                        const SizedBox(width: 8),
                        _statChip('10x', user.stats.streak10Count.toString()),
                      ],
                    ),
                    const Divider(height: 24),
                    const Text('Category Stats', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    if (categories.isEmpty)
                      const Text('No category stats yet.')
                    else
                      ...categories.map(
                        (c) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(c.categoryName, style: const TextStyle(fontWeight: FontWeight.w600)),
                                  ),
                                  Text('${c.accuracy.toStringAsFixed(0)}%'),
                                ],
                              ),
                              const SizedBox(height: 6),
                              LinearProgressIndicator(
                                value: (c.totalAnswered == 0 ? 0.0 : c.totalCorrect / c.totalAnswered).clamp(0.0, 1.0).toDouble(),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Expanded(
                                    child: LinearProgressIndicator(
                                      value: (c.totalAnswered / maxAnswered).clamp(0, 1),
                                      minHeight: 6,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text('Answered ${c.totalAnswered}'),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text('Correct ${c.totalCorrect} • Wrong ${c.totalWrong}'),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _statRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.black54)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _statChip(String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.05),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          children: [
            Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 12, color: Colors.black54)),
          ],
        ),
      ),
    );
  }
}
