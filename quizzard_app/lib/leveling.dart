import 'package:flutter/material.dart';
import 'theme.dart';

/// Level + league math. Single source of truth used by the quiz, profile,
/// home and the Firestore stats writer (database_service).
///
/// Steeper "prestige" curve: the XP cost to advance FROM level L is
///   500 + 150 * (L - 1)
/// so Lv1->2 = 500, Lv2->3 = 650, ... high levels are rare.

int costToAdvance(int level) => 500 + 150 * (level - 1);

/// Cumulative XP needed to REACH a level (level 1 starts at 0 XP).
int xpToReachLevel(int level) {
  var total = 0;
  for (var l = 1; l < level; l++) {
    total += costToAdvance(l);
  }
  return total;
}

int levelForXp(int totalXp) {
  var level = 1;
  while (totalXp >= xpToReachLevel(level + 1)) {
    level++;
  }
  return level;
}

/// XP earned inside the current level (0 .. xpSpanForLevel).
int xpIntoLevel(int totalXp) => totalXp - xpToReachLevel(levelForXp(totalXp));

/// Total XP the current level spans (denominator for the progress bar).
int xpSpanForLevel(int level) => costToAdvance(level);

class LeagueInfo {
  final String name;
  final String emoji;
  final Color color;
  final int fromLevel;
  const LeagueInfo(this.name, this.emoji, this.color, this.fromLevel);
}

/// Highest tier first so leagueForLevel can pick the first match.
const List<LeagueInfo> kLeagues = [
  LeagueInfo('Mythic', '🌟', kNeonPink, 120),
  LeagueInfo('Legend', '🔥', kNeonRed, 80),
  LeagueInfo('Crown', '👑', kNeonPurple, 50),
  LeagueInfo('Diamond', '💎', kNeonCyan, 30),
  LeagueInfo('Gold', '🥇', kNeonAmber, 15),
  LeagueInfo('Silver', '🥈', Color(0xFFC0C0C0), 5),
  LeagueInfo('Bronze', '🥉', Color(0xFFCD7F32), 1),
];

LeagueInfo leagueForLevel(int level) =>
    kLeagues.firstWhere((l) => level >= l.fromLevel, orElse: () => kLeagues.last);
