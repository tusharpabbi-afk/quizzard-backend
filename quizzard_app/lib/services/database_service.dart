import 'package:cloud_firestore/cloud_firestore.dart';

import '../leveling.dart';
import '../models/firestore_models.dart';

/// Identity, stats and multiplayer live in Firestore. Quiz *content*
/// (categories + questions) is served by the Node/MongoDB backend, not here —
/// the old Firestore content CRUD has been retired.
class DatabaseService {
  DatabaseService._();

  static final DatabaseService instance = DatabaseService._();

  final FirebaseFirestore _db = FirebaseFirestore.instance;

  CollectionReference<Map<String, dynamic>> get _users => _db.collection('users');

  Future<bool> isAdmin(String uid) async {
    try {
      final doc = await _db
          .collection('admins')
          .doc(uid)
          .get(const GetOptions(source: Source.server));
      if (!doc.exists) return false;
      final data = doc.data() ?? {};
      return data['role'] == 'admin';
    } on FirebaseException catch (e) {
      throw Exception('Firestore ${e.code}: ${e.message}');
    }
  }

  Future<void> ensureUserProfile({
    required String uid,
    required String email,
    required String displayName,
  }) async {
    final ref = _users.doc(uid);
    final snapshot = await ref.get();
    if (snapshot.exists) {
      await ref.update({
        'email': email,
        'displayName': displayName,
        'updatedAt': FieldValue.serverTimestamp(),
      });
      return;
    }
    await ref.set({
      'uid': uid,
      'email': email,
      'displayName': displayName,
      'stats': UserStats.empty().toMap(),
      'categoryStats': <String, dynamic>{},
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  Stream<UserProfileDoc?> streamUserProfile(String uid) {
    return _users.doc(uid).snapshots().map((doc) {
      if (!doc.exists) return null;
      return UserProfileDoc.fromDoc(doc);
    });
  }

  Stream<List<UserProfileDoc>> streamUsers() {
    return _users.snapshots().map(
          (snapshot) => snapshot.docs.map(UserProfileDoc.fromDoc).toList(),
        );
  }

  Future<void> updateUserStatsOnQuizFinish({
    required String uid,
    required String email,
    required String displayName,
    required String categoryId,
    required String categoryName,
    required int totalQuestions,
    required int correctCount,
    required int xpEarned,
    required int maxStreak,
    required int streak5Count,
    required int streak10Count,
  }) async {
    final ref = _users.doc(uid);
    await _db.runTransaction((tx) async {
      final snapshot = await tx.get(ref);
      final data = snapshot.data() ?? {};
      final statsMap = (data['stats'] as Map<String, dynamic>?) ?? {};
      final currentStats = UserStats.fromMap(statsMap);
      final updatedTotalXp = currentStats.totalXp + xpEarned;
      // A "win" = scored at least 60% in the game.
      final isWin = totalQuestions > 0 && correctCount / totalQuestions >= 0.6;
      final winCur = isWin ? currentStats.winStreakCurrent + 1 : 0;
      final loseCur = isWin ? 0 : currentStats.loseStreakCurrent + 1;
      final updatedStats = UserStats(
        gamesPlayed: currentStats.gamesPlayed + 1,
        totalAnswered: currentStats.totalAnswered + totalQuestions,
        totalCorrect: currentStats.totalCorrect + correctCount,
        totalWrong: currentStats.totalWrong + (totalQuestions - correctCount),
        totalXp: updatedTotalXp,
        level: levelForXp(updatedTotalXp),
        xpInLevel: xpIntoLevel(updatedTotalXp),
        maxStreak: maxStreak > currentStats.maxStreak ? maxStreak : currentStats.maxStreak,
        streak5Count: currentStats.streak5Count + streak5Count,
        streak10Count: currentStats.streak10Count + streak10Count,
        winStreakCurrent: winCur,
        winStreakBest: winCur > currentStats.winStreakBest ? winCur : currentStats.winStreakBest,
        loseStreakCurrent: loseCur,
        loseStreakBest: loseCur > currentStats.loseStreakBest ? loseCur : currentStats.loseStreakBest,
      );

      final categoryStatsMap = (data['categoryStats'] as Map<String, dynamic>?) ?? {};
      final existingCategory = (categoryStatsMap[categoryId] as Map<String, dynamic>?) ?? {};
      final currentCategory = CategoryStats.fromMap(
        existingCategory,
        categoryId: categoryId,
        categoryName: categoryName,
      );
      final updatedCategory = CategoryStats(
        categoryId: categoryId,
        categoryName: categoryName,
        gamesPlayed: currentCategory.gamesPlayed + 1,
        totalAnswered: currentCategory.totalAnswered + totalQuestions,
        totalCorrect: currentCategory.totalCorrect + correctCount,
        totalWrong: currentCategory.totalWrong + (totalQuestions - correctCount),
      );
      categoryStatsMap[categoryId] = updatedCategory.toMap();

      tx.set(
        ref,
        {
          'uid': uid,
          'email': email,
          'displayName': displayName,
          'stats': updatedStats.toMap(),
          'categoryStats': categoryStatsMap,
          'updatedAt': FieldValue.serverTimestamp(),
          if (!snapshot.exists) 'createdAt': FieldValue.serverTimestamp(),
        },
        SetOptions(merge: true),
      );
    });
  }

  /// Records a finished multiplayer match for [uid]: updates W/L/D counters AND
  /// awards global XP (win 250 / draw 100 / loss 50), recomputing level atomically.
  Future<void> recordMultiplayerResult({
    required String uid,
    required bool won,
    required bool draw,
  }) async {
    final mpXp = won ? 250 : (draw ? 100 : 50);
    final ref = _users.doc(uid);
    await _db.runTransaction((tx) async {
      final snap = await tx.get(ref);
      final data = snap.data() ?? {};
      final stats = UserStats.fromMap((data['stats'] as Map<String, dynamic>?) ?? {});
      final mp = (data['multiplayer'] as Map<String, dynamic>?) ?? {};
      final newTotalXp = stats.totalXp + mpXp;
      int cur(String k) => (mp[k] as num?)?.toInt() ?? 0;
      tx.set(
        ref,
        {
          'stats': {
            ...stats.toMap(),
            'totalXp': newTotalXp,
            'level': levelForXp(newTotalXp),
            'xpInLevel': xpIntoLevel(newTotalXp),
          },
          'multiplayer': {
            'played': cur('played') + 1,
            'wins': cur('wins') + (won ? 1 : 0),
            'losses': cur('losses') + (!won && !draw ? 1 : 0),
            'draws': cur('draws') + (draw ? 1 : 0),
          },
          'updatedAt': FieldValue.serverTimestamp(),
        },
        SetOptions(merge: true),
      );
    });
  }
}
