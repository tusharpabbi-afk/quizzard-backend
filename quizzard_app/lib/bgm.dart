import 'package:audioplayers/audioplayers.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Global looping background music with a persisted on/off setting.
/// Browsers block autoplay until a user gesture, so call [kick] from taps.
class Bgm {
  Bgm._();
  static final Bgm instance = Bgm._();

  final AudioPlayer _player = AudioPlayer();
  bool _enabled = true;
  bool _started = false;

  bool get enabled => _enabled;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _enabled = prefs.getBool('bgm_enabled') ?? true;
    await _player.setReleaseMode(ReleaseMode.loop);
    await _player.setVolume(0.22);
  }

  /// Try to (re)start playback if enabled — safe to call from any user tap.
  Future<void> kick() async {
    if (!_enabled) return;
    try {
      if (_started) {
        await _player.resume();
      } else {
        await _player.play(AssetSource('sounds/bgm.mp3'), volume: 0.22);
        _started = true;
      }
    } catch (_) {}
  }

  Future<void> setEnabled(bool value) async {
    _enabled = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('bgm_enabled', value);
    if (value) {
      await kick();
    } else {
      try {
        await _player.pause();
      } catch (_) {}
    }
  }
}
