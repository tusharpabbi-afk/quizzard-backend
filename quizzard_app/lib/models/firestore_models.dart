import 'package:cloud_firestore/cloud_firestore.dart';
import '../quiz_models.dart';

Difficulty difficultyFromString(String value) {
  switch (value) {
    case 'easy':
      return Difficulty.easy;
    case 'medium':
      return Difficulty.medium;
    case 'hard':
      return Difficulty.hard;
    default:
      return Difficulty.easy;
  }
}

MediaType mediaTypeFromString(String value) {
  switch (value) {
    case 'image':
      return MediaType.image;
    case 'audio':
      return MediaType.audio;
    case 'video':
      return MediaType.video;
    default:
      return MediaType.text;
  }
}

String difficultyToString(Difficulty value) => value.name;
String mediaTypeToString(MediaType value) => value.name;

class UserStats {
  final int gamesPlayed;
  final int totalAnswered;
  final int totalCorrect;
  final int totalWrong;
  final int totalXp;
  final int level;
  final int xpInLevel;
  final int maxStreak;
  final int streak5Count;
  final int streak10Count;
  // Game win/lose streaks (a "win" = accuracy >= 60% in a game).
  final int winStreakCurrent;
  final int winStreakBest;
  final int loseStreakCurrent;
  final int loseStreakBest;

  const UserStats({
    required this.gamesPlayed,
    required this.totalAnswered,
    required this.totalCorrect,
    required this.totalWrong,
    required this.totalXp,
    required this.level,
    required this.xpInLevel,
    required this.maxStreak,
    required this.streak5Count,
    required this.streak10Count,
    this.winStreakCurrent = 0,
    this.winStreakBest = 0,
    this.loseStreakCurrent = 0,
    this.loseStreakBest = 0,
  });

  factory UserStats.empty() => const UserStats(
        gamesPlayed: 0,
        totalAnswered: 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalXp: 0,
        level: 1,
        xpInLevel: 0,
        maxStreak: 0,
        streak5Count: 0,
        streak10Count: 0,
      );

  factory UserStats.fromMap(Map<String, dynamic> data) {
    return UserStats(
      gamesPlayed: (data['gamesPlayed'] as num?)?.toInt() ?? 0,
      totalAnswered: (data['totalAnswered'] as num?)?.toInt() ?? 0,
      totalCorrect: (data['totalCorrect'] as num?)?.toInt() ?? 0,
      totalWrong: (data['totalWrong'] as num?)?.toInt() ?? 0,
      totalXp: (data['totalXp'] as num?)?.toInt() ?? 0,
      level: (data['level'] as num?)?.toInt() ?? 1,
      xpInLevel: (data['xpInLevel'] as num?)?.toInt() ?? 0,
      maxStreak: (data['maxStreak'] as num?)?.toInt() ?? 0,
      streak5Count: (data['streak5Count'] as num?)?.toInt() ?? 0,
      streak10Count: (data['streak10Count'] as num?)?.toInt() ?? 0,
      winStreakCurrent: (data['winStreakCurrent'] as num?)?.toInt() ?? 0,
      winStreakBest: (data['winStreakBest'] as num?)?.toInt() ?? 0,
      loseStreakCurrent: (data['loseStreakCurrent'] as num?)?.toInt() ?? 0,
      loseStreakBest: (data['loseStreakBest'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'gamesPlayed': gamesPlayed,
      'totalAnswered': totalAnswered,
      'totalCorrect': totalCorrect,
      'totalWrong': totalWrong,
      'totalXp': totalXp,
      'level': level,
      'xpInLevel': xpInLevel,
      'maxStreak': maxStreak,
      'streak5Count': streak5Count,
      'streak10Count': streak10Count,
      'winStreakCurrent': winStreakCurrent,
      'winStreakBest': winStreakBest,
      'loseStreakCurrent': loseStreakCurrent,
      'loseStreakBest': loseStreakBest,
    };
  }

  double get accuracy => totalAnswered == 0 ? 0 : (totalCorrect / totalAnswered) * 100;
}

class CategoryStats {
  final String categoryId;
  final String categoryName;
  final int gamesPlayed;
  final int totalAnswered;
  final int totalCorrect;
  final int totalWrong;

  const CategoryStats({
    required this.categoryId,
    required this.categoryName,
    required this.gamesPlayed,
    required this.totalAnswered,
    required this.totalCorrect,
    required this.totalWrong,
  });

  factory CategoryStats.empty({required String categoryId, required String categoryName}) {
    return CategoryStats(
      categoryId: categoryId,
      categoryName: categoryName,
      gamesPlayed: 0,
      totalAnswered: 0,
      totalCorrect: 0,
      totalWrong: 0,
    );
  }

  factory CategoryStats.fromMap(Map<String, dynamic> data, {required String categoryId, required String categoryName}) {
    return CategoryStats(
      categoryId: categoryId,
      categoryName: (data['categoryName'] as String?) ?? categoryName,
      gamesPlayed: (data['gamesPlayed'] as num?)?.toInt() ?? 0,
      totalAnswered: (data['totalAnswered'] as num?)?.toInt() ?? 0,
      totalCorrect: (data['totalCorrect'] as num?)?.toInt() ?? 0,
      totalWrong: (data['totalWrong'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'categoryName': categoryName,
      'gamesPlayed': gamesPlayed,
      'totalAnswered': totalAnswered,
      'totalCorrect': totalCorrect,
      'totalWrong': totalWrong,
    };
  }

  double get accuracy => totalAnswered == 0 ? 0 : (totalCorrect / totalAnswered) * 100;
}

class MpStats {
  final int played;
  final int wins;
  final int losses;
  final int draws;
  const MpStats({this.played = 0, this.wins = 0, this.losses = 0, this.draws = 0});

  factory MpStats.fromMap(Map<String, dynamic> d) => MpStats(
        played: (d['played'] as num?)?.toInt() ?? 0,
        wins: (d['wins'] as num?)?.toInt() ?? 0,
        losses: (d['losses'] as num?)?.toInt() ?? 0,
        draws: (d['draws'] as num?)?.toInt() ?? 0,
      );

  double get winRate => played == 0 ? 0 : (wins / played) * 100;
}

class UserProfileDoc {
  final String uid;
  final String email;
  final String displayName;
  final UserStats stats;
  final Map<String, CategoryStats> categoryStats;
  final MpStats mp;

  const UserProfileDoc({
    required this.uid,
    required this.email,
    required this.displayName,
    required this.stats,
    required this.categoryStats,
    this.mp = const MpStats(),
  });

  factory UserProfileDoc.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    final statsMap = (data['stats'] as Map<String, dynamic>?) ?? {};
    final categoriesRaw = (data['categoryStats'] as Map<String, dynamic>?) ?? {};
    final categoryStats = <String, CategoryStats>{};
    for (final entry in categoriesRaw.entries) {
      final value = (entry.value as Map<String, dynamic>?) ?? {};
      final categoryName = (value['categoryName'] as String?) ?? entry.key;
      categoryStats[entry.key] = CategoryStats.fromMap(
        value,
        categoryId: entry.key,
        categoryName: categoryName,
      );
    }
    return UserProfileDoc(
      uid: doc.id,
      email: (data['email'] as String?) ?? '',
      displayName: (data['displayName'] as String?) ?? '',
      stats: UserStats.fromMap(statsMap),
      categoryStats: categoryStats,
      mp: MpStats.fromMap((data['multiplayer'] as Map<String, dynamic>?) ?? {}),
    );
  }
}

class CategoryDoc {
  final String id;
  final String name;
  final Difficulty difficulty;
  final String imageUrl;
  final int orderIndex;
  final bool isActive;

  CategoryDoc({
    required this.id,
    required this.name,
    required this.difficulty,
    required this.imageUrl,
    required this.orderIndex,
    required this.isActive,
  });

  factory CategoryDoc.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return CategoryDoc(
      id: doc.id,
      name: (data['name'] as String?) ?? '',
      difficulty: difficultyFromString((data['difficulty'] as String?) ?? 'easy'),
      imageUrl: (data['imageUrl'] as String?) ?? '',
      orderIndex: (data['orderIndex'] as num?)?.toInt() ?? 0,
      isActive: (data['isActive'] as bool?) ?? true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'difficulty': difficultyToString(difficulty),
      'imageUrl': imageUrl,
      'orderIndex': orderIndex,
      'isActive': isActive,
    };
  }
}

// QuestionDoc (Firestore question content) was retired — quiz content is now
// served by the Node/MongoDB backend and mapped directly into `Question`.
