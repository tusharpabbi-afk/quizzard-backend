import 'dart:math';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

/// Firestore-backed 1v1 matches. A match doc:
/// {
///   code, status: waiting|active|finished, isRandom,
///   hostUid, questions: [ {id,question,options,correctIndex,mediaUrl,mediaType,level} ],
///   players: { uid: {name, score, answered, finished} },
///   createdAt
/// }
class MatchService {
  MatchService._();
  static final MatchService instance = MatchService._();

  final FirebaseFirestore _db = FirebaseFirestore.instance;
  CollectionReference<Map<String, dynamic>> get _matches => _db.collection('matches');

  String get uid => FirebaseAuth.instance.currentUser!.uid;
  String get _name {
    final u = FirebaseAuth.instance.currentUser;
    final dn = u?.displayName?.trim();
    if (dn != null && dn.isNotEmpty) return dn;
    return u?.email?.split('@').first ?? 'Player';
  }

  Map<String, dynamic> _playerInit() => {
        'name': _name,
        'score': 0,
        'answered': 0,
        'finished': false,
      };

  String _genCode() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    final r = Random();
    return List.generate(4, (_) => chars[r.nextInt(chars.length)]).join();
  }

  Stream<DocumentSnapshot<Map<String, dynamic>>> streamMatch(String id) =>
      _matches.doc(id).snapshots();

  static const int maxPlayers = 5;

  /// Host creates a private room; returns the room code (== doc id).
  /// No collision pre-check (single write) so it's instant.
  Future<String> createRoom(
    List<Map<String, dynamic>> questions,
    String categoryName,
    String level,
  ) async {
    final code = _genCode();
    await _matches.doc(code).set({
      'code': code,
      'status': 'waiting',
      'isRandom': false,
      'categoryName': categoryName,
      'level': level,
      'hostUid': uid,
      'questions': questions,
      'players': {uid: _playerInit()},
      'createdAt': FieldValue.serverTimestamp(),
    });
    return code;
  }

  /// Joins a room by code (up to [maxPlayers]). Stays 'waiting' — the host starts.
  Future<String?> joinByCode(String code) async {
    final ref = _matches.doc(code.toUpperCase().trim());
    return _db.runTransaction<String?>((tx) async {
      final snap = await tx.get(ref);
      if (!snap.exists) return null;
      final data = snap.data()!;
      if (data['status'] != 'waiting') return null; // already started
      final players = Map<String, dynamic>.from(data['players'] ?? {});
      if (players.containsKey(uid)) return ref.id; // rejoin own match
      if (players.length >= maxPlayers) return null; // full
      players[uid] = _playerInit();
      tx.update(ref, {'players': players});
      return ref.id;
    });
  }

  /// Host starts the room (needs at least 2 players).
  Future<void> startMatch(String id) async {
    await _matches.doc(id).update({'status': 'active'});
  }

  /// Joins an open random match in the same category if one exists, else creates one.
  /// Random matches auto-start as soon as a 2nd player joins (quick 1v1 pairing).
  Future<String> findOrCreateRandom(
    List<Map<String, dynamic>> questions,
    String categoryName,
    String level,
  ) async {
    final open = await _matches
        .where('status', isEqualTo: 'waiting')
        .where('isRandom', isEqualTo: true)
        .where('categoryName', isEqualTo: categoryName)
        .limit(5)
        .get();
    for (final d in open.docs) {
      if (d.data()['hostUid'] == uid) continue;
      final ok = await _tryClaim(d.reference);
      if (ok) return d.id;
    }
    final ref = _matches.doc();
    await ref.set({
      'code': '',
      'status': 'waiting',
      'isRandom': true,
      'categoryName': categoryName,
      'level': level,
      'hostUid': uid,
      'questions': questions,
      'players': {uid: _playerInit()},
      'createdAt': FieldValue.serverTimestamp(),
    });
    return ref.id;
  }

  Future<bool> _tryClaim(DocumentReference<Map<String, dynamic>> ref) async {
    return _db.runTransaction<bool>((tx) async {
      final snap = await tx.get(ref);
      if (!snap.exists) return false;
      final players = Map<String, dynamic>.from(snap.data()!['players'] ?? {});
      if (players.containsKey(uid)) return true;
      if (players.length >= maxPlayers) return false;
      players[uid] = _playerInit();
      tx.update(ref, {'players': players, 'status': 'active'});
      return true;
    });
  }

  Future<void> recordAnswer(String id, {required int score, required int answered}) {
    return _matches.doc(id).update({
      'players.$uid.score': score,
      'players.$uid.answered': answered,
    });
  }

  Future<void> finishPlayer(String id) async {
    await _matches.doc(id).update({'players.$uid.finished': true});
    await _db.runTransaction((tx) async {
      final ref = _matches.doc(id);
      final snap = await tx.get(ref);
      if (!snap.exists) return;
      final players = Map<String, dynamic>.from(snap.data()!['players'] ?? {});
      final bothDone = players.length >= 2 &&
          players.values.every((p) => (p as Map)['finished'] == true);
      if (bothDone) tx.update(ref, {'status': 'finished'});
    });
  }

  /// Force the match to results. Used as an abandonment escape: when a player
  /// has finished but an opponent never does (closed app / lost connection),
  /// any waiting player can end the match so it doesn't hang forever.
  Future<void> forceFinish(String id) async {
    await _matches.doc(id).update({'status': 'finished'});
  }

  Future<void> requestRematch(String id) async {
    await _matches.doc(id).update({
      'rematchRequests': FieldValue.arrayUnion([uid]),
    });
  }

  /// Host resets the match for another round with fresh questions.
  Future<void> resetForRematch(String id, List<Map<String, dynamic>> questions) async {
    await _db.runTransaction((tx) async {
      final ref = _matches.doc(id);
      final snap = await tx.get(ref);
      if (!snap.exists) return;
      final data = snap.data()!;
      final players = Map<String, dynamic>.from(data['players'] ?? {});
      final reset = <String, dynamic>{};
      for (final e in players.entries) {
        final p = Map<String, dynamic>.from(e.value as Map);
        p['score'] = 0;
        p['answered'] = 0;
        p['finished'] = false;
        reset[e.key] = p;
      }
      tx.update(ref, {
        'questions': questions,
        'players': reset,
        'status': 'active',
        'round': ((data['round'] as num?)?.toInt() ?? 1) + 1,
        'rematchRequests': <String>[],
      });
    });
  }

  /// Best-effort cleanup when a player leaves.
  /// - waiting: drop them from the room (delete it if now empty; hand off host).
  /// - active: mark them finished so remaining players can still reach results,
  ///   flipping the match to finished if that completes everyone.
  Future<void> leave(String id) async {
    try {
      final ref = _matches.doc(id);
      await _db.runTransaction((tx) async {
        final snap = await tx.get(ref);
        if (!snap.exists) return;
        final data = snap.data()!;
        final status = data['status'];
        final players = Map<String, dynamic>.from(data['players'] ?? {});
        if (status == 'waiting') {
          players.remove(uid);
          if (players.isEmpty) {
            tx.delete(ref);
          } else {
            final update = <String, dynamic>{'players': players};
            if (data['hostUid'] == uid) update['hostUid'] = players.keys.first;
            tx.update(ref, update);
          }
        } else if (status == 'active') {
          if (!players.containsKey(uid)) return;
          (players[uid] as Map)['finished'] = true;
          final allDone = players.values.every((p) => (p as Map)['finished'] == true);
          tx.update(ref, {
            'players': players,
            if (allDone) 'status': 'finished',
          });
        } else if (status == 'finished') {
          // Drop departed players so a pending rematch among the rest isn't blocked.
          players.remove(uid);
          final reqs = ((data['rematchRequests'] as List?) ?? [])
              .map((e) => e.toString())
              .where((u) => u != uid)
              .toList();
          if (players.isEmpty) {
            tx.delete(ref);
          } else {
            final update = <String, dynamic>{'players': players, 'rematchRequests': reqs};
            if (data['hostUid'] == uid) update['hostUid'] = players.keys.first;
            tx.update(ref, update);
          }
        }
      });
    } catch (_) {}
  }
}
