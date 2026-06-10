import 'package:shared_preferences/shared_preferences.dart';

/// Tracks which question ids a player has already seen, per category, so we can
/// ask the backend to exclude them until the category is exhausted, then reset.
class Seen {
  static String _key(String category) => 'seen_${category.replaceAll(' ', '_')}';

  static Future<List<String>> load(String category) async {
    final p = await SharedPreferences.getInstance();
    return p.getStringList(_key(category)) ?? [];
  }

  static Future<void> add(String category, Iterable<String> ids) async {
    if (ids.isEmpty) return;
    final p = await SharedPreferences.getInstance();
    final set = (p.getStringList(_key(category)) ?? []).toSet()..addAll(ids);
    await p.setStringList(_key(category), set.toList());
  }

  static Future<void> clear(String category) async {
    final p = await SharedPreferences.getInstance();
    await p.remove(_key(category));
  }
}
