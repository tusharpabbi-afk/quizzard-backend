import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/services.dart' show HapticFeedback;
import 'dart:math';
import 'dart:ui';
import 'package:audioplayers/audioplayers.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:video_player/video_player.dart';
import 'package:http/http.dart' as http;
import 'admin/admin_gate.dart';
import 'bgm.dart';
import 'config.dart';
import 'firebase_options.dart';
import 'leaderboard_screen.dart';
import 'leveling.dart';
import 'multiplayer.dart';
import 'models/firestore_models.dart';
import 'player/player_gate.dart';
import 'profile/profile_screen.dart';
import 'quiz_models.dart';
import 'seen.dart';
import 'services/database_service.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  FirebaseFirestore.instance.settings = const Settings(persistenceEnabled: false);
  // Keep the user signed in across page refreshes / app restarts.
  if (kIsWeb) {
    await FirebaseAuth.instance.setPersistence(Persistence.LOCAL);
  }
  await Bgm.instance.init();
  runApp(const QuizzardApp());
}

class QuizzardApp extends StatelessWidget {
  const QuizzardApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const PlayerGateScreen(),
    );
  }
}

class AdminPanel extends StatelessWidget {
  const AdminPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return const AdminGateScreen();
  }
}

// Legacy color names repointed to the dark-neon design tokens (see theme.dart),
// so existing screens shift to the dark palette without per-widget edits.
const Color kPrimary = kNeonBlue;
const Color kBgTop = kBg;
const Color kBgBottom = kBgElevated;
const Color kCard = kSurface;
const Color kCardBorder = kStroke;

Widget glassContainer({
  required Widget child,
  EdgeInsetsGeometry? padding,
  EdgeInsetsGeometry? margin,
  BorderRadius? borderRadius,
}) {
  final radius = borderRadius ?? BorderRadius.circular(20);
  return ClipRRect(
    borderRadius: radius,
    child: BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
      child: Container(
        margin: margin,
        padding: padding,
        decoration: BoxDecoration(
          color: kSurface.withOpacity(0.7),
          borderRadius: radius,
          border: Border.all(color: kStroke),
        ),
        child: child,
      ),
    ),
  );
}


// --- HOME SCREEN ---
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

// Sentinel category id for the Random Mix mode.
const String kRandomCategoryId = '__random__';

// Home call-to-action tile (Random Mix / Multiplayer).
Widget _homeActionTile({
  required String emoji,
  required String title,
  required String subtitle,
  required Color color,
  required VoidCallback onTap,
}) {
  return GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        gradient: accentGradient(color),
        borderRadius: BorderRadius.circular(16),
        boxShadow: neonGlow(color, blur: 14, opacity: 0.45),
      ),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 22)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: display(15, color: Colors.white)),
                Text(subtitle, style: body(10, color: Colors.white70)),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

// Number of questions per game by mode.
int questionCountFor(Difficulty mode) {
  switch (mode) {
    case Difficulty.easy:
      return 10;
    case Difficulty.medium:
      return 12;
    case Difficulty.hard:
      return 15;
  }
}

class _HomeScreenState extends State<HomeScreen> {
  int adminTaps = 0;
  Difficulty _mode = Difficulty.easy;
  late Future<List<CategoryDoc>> _categoriesFuture;
  static const String _apiBaseUrl = kApiBaseUrl;

  @override
  void initState() {
    super.initState();
    _categoriesFuture = _fetchBackendCategories();
  }

  Future<List<CategoryDoc>> _fetchBackendCategories() async {
    try {
      final res = await http.get(Uri.parse('$_apiBaseUrl/api/categories'));
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        final categories = (data['categories'] as List<dynamic>? ?? [])
            .map((raw) {
              // Backend now returns {name, imageUrl, order}; tolerate plain strings too.
              if (raw is Map) {
                final name = (raw['name'] ?? '').toString();
                return CategoryDoc(
                  id: name,
                  name: name,
                  difficulty: Difficulty.easy,
                  imageUrl: (raw['imageUrl'] ?? '').toString(),
                  orderIndex: (raw['order'] as num?)?.toInt() ?? 0,
                  isActive: true,
                );
              }
              return CategoryDoc(
                id: raw.toString(),
                name: raw.toString(),
                difficulty: Difficulty.easy,
                imageUrl: '',
                orderIndex: 0,
                isActive: true,
              );
            })
            .toList();
        return categories;
      }
    } catch (_) {}
    return [];
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    final displayName = user?.displayName?.trim().isNotEmpty == true
        ? user!.displayName!.trim()
        : (user?.email?.split('@').first ?? 'Player');
    const modeColors = {
      Difficulty.easy: kNeonGreen,
      Difficulty.medium: kNeonAmber,
      Difficulty.hard: kNeonRed,
    };
    Widget modePill(Difficulty m, String label, IconData icon) {
      final selected = _mode == m;
      final c = modeColors[m]!;
      return Expanded(
        child: GestureDetector(
          onTap: () {
            Bgm.instance.kick();
            setState(() => _mode = m);
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            padding: const EdgeInsets.symmetric(vertical: 11),
            decoration: BoxDecoration(
              color: selected ? c : kSurfaceAlt,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: selected ? c : kStroke),
              boxShadow: selected ? neonGlow(c, blur: 14, opacity: 0.5) : null,
            ),
            child: Column(
              children: [
                Icon(icon, color: selected ? Colors.black : c, size: 20),
                const SizedBox(height: 3),
                Text(label,
                    style: TextStyle(
                        color: selected ? Colors.black : kTextLo,
                        fontWeight: FontWeight.w700,
                        fontSize: 13)),
              ],
            ),
          ),
        ),
      );
    }

    Widget buildGrid(List<CategoryDoc> categories) {
      return GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.only(top: 6),
        // Max-extent delegate => tiles stay small and the column count adapts to the
        // screen width, so adding lots of categories just flows into more rows.
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 128,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          mainAxisExtent: 112,
        ),
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final category = categories[index];
          return CategoryCard(
            categoryId: category.id,
            title: category.name,
            imagePath: category.imageUrl,
            mode: _mode,
          );
        },
      );
    }

    return FutureBuilder<List<CategoryDoc>>(
      future: _categoriesFuture,
      builder: (context, snapshot) {
        final categories = snapshot.data ?? [];
        return Scaffold(
          body: NeonBackground(
            child: SafeArea(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 480),
                  child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top bar (kept inside the mobile-width frame).
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 10, 10, 0),
                    child: Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              adminTaps++;
                              if (adminTaps == 5) {
                                adminTaps = 0;
                                Navigator.push(context, MaterialPageRoute(builder: (c) => const AdminPanel()));
                              }
                            },
                            child: Text("QUIZZARD",
                                style: GoogleFonts.blackOpsOne(fontSize: 26, color: kNeonBlue, shadows: neonGlow(kNeonBlue, blur: 12))),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.leaderboard, color: kNeonAmber),
                          tooltip: 'Leaderboard',
                          onPressed: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const LeaderboardScreen()),
                          ),
                        ),
                        const SizedBox(width: 2),
                        GestureDetector(
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen())),
                          child: Container(
                            decoration: BoxDecoration(shape: BoxShape.circle, boxShadow: neonGlow(kNeonBlue, blur: 10)),
                            child: const CircleAvatar(radius: 18, backgroundColor: kNeonBlue, child: Icon(Icons.person, color: Colors.white, size: 20)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 2, 20, 0),
                    child: Row(
                      children: [
                        Expanded(child: Text("Hey $displayName 👋", style: body(15, color: kTextLo))),
                        if (user != null) _LevelChip(uid: user.uid),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        modePill(Difficulty.easy, "Easy", Icons.sentiment_satisfied_alt),
                        const SizedBox(width: 8),
                        modePill(Difficulty.medium, "Medium", Icons.local_fire_department),
                        const SizedBox(width: 8),
                        modePill(Difficulty.hard, "Hard", Icons.bolt),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        Expanded(
                          child: _homeActionTile(
                            emoji: "🎲",
                            title: "Random Mix",
                            subtitle: "12 mixed Qs",
                            color: kNeonPurple,
                            onTap: () {
                              Bgm.instance.kick();
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const PreQuizScreen(
                                    categoryId: kRandomCategoryId,
                                    categoryName: "Random Mix",
                                    mode: Difficulty.medium,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _homeActionTile(
                            emoji: "⚔️",
                            title: "Multiplayer",
                            subtitle: "1v1 head-to-head",
                            color: kNeonGreen,
                            onTap: () {
                              Bgm.instance.kick();
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const MultiplayerLobbyScreen()));
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("Pick a Topic", style: display(19)),
                        Text("${questionCountFor(_mode)} questions",
                            style: body(13, color: kTextLo, w: FontWeight.w600)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                  if (snapshot.connectionState == ConnectionState.waiting)
                    const Expanded(child: Center(child: CircularProgressIndicator()))
                  else if (categories.isEmpty)
                    Expanded(child: Center(child: Text("No categories available.", style: body(15, color: kTextLo))))
                  else
                    Expanded(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        child: buildGrid(categories),
                      ),
                    ),
                ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class CategoryCard extends StatelessWidget {
  final String categoryId;
  final String title;
  final String imagePath;
  final Difficulty mode;
  const CategoryCard({
    super.key,
    required this.categoryId,
    required this.title,
    required this.imagePath,
    required this.mode,
  });

  @override
  Widget build(BuildContext context) {
    final accent = categoryAccent(title);
    // Handles both network and bundled asset images.
    ImageProvider? imageProvider;
    if (imagePath.isNotEmpty) {
      imageProvider = imagePath.startsWith('http')
          ? NetworkImage(imagePath) as ImageProvider
          : AssetImage(imagePath) as ImageProvider;
    }

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (c) => PreQuizScreen(categoryId: categoryId, categoryName: title, mode: mode),
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: accent.withOpacity(0.55)),
          boxShadow: neonGlow(accent, blur: 12, opacity: 0.30),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(17),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (imageProvider != null)
                Image(
                  image: imageProvider,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(color: accent.withOpacity(0.25)),
                )
              else
                Container(color: accent.withOpacity(0.18)),
              // Accent-tinted dark gradient for readable title + on-brand glow.
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [accent.withOpacity(0.10), Colors.black54, Colors.black.withOpacity(0.92)],
                    stops: const [0.35, 0.75, 1.0],
                  ),
                ),
              ),
              Align(
                alignment: Alignment.bottomLeft,
                child: Padding(
                  padding: const EdgeInsets.all(9),
                  child: Text(
                    title,
                    maxLines: 2,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 12.5,
                      height: 1.1,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(duration: 250.ms).scale(begin: const Offset(0.95, 0.95));
  }
}

// Compact level/XP badge shown in the home header.
class _LevelChip extends StatelessWidget {
  final String uid;
  const _LevelChip({required this.uid});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<UserProfileDoc?>(
      stream: DatabaseService.instance.streamUserProfile(uid),
      builder: (context, snap) {
        final s = snap.data?.stats;
        final level = s?.level ?? 1;
        final progress = ((s?.xpInLevel ?? 0) / 1000).clamp(0.0, 1.0);
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: kSurface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: kNeonAmber.withOpacity(0.5)),
            boxShadow: neonGlow(kNeonAmber, blur: 10, opacity: 0.22),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 26,
                height: 26,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    CircularProgressIndicator(
                      value: progress,
                      strokeWidth: 3,
                      backgroundColor: kStroke,
                      valueColor: const AlwaysStoppedAnimation(kNeonAmber),
                    ),
                    const Icon(Icons.star, size: 11, color: kNeonAmber),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text("LV $level", style: body(13, w: FontWeight.w800)),
                  Text("${s?.totalXp ?? 0} XP", style: body(10, color: kTextLo)),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

// Pre-quiz intro + 3-2-1 countdown before the questions start.
class PreQuizScreen extends StatefulWidget {
  final String categoryId;
  final String categoryName;
  final Difficulty mode;
  const PreQuizScreen({
    super.key,
    required this.categoryId,
    required this.categoryName,
    required this.mode,
  });

  @override
  State<PreQuizScreen> createState() => _PreQuizScreenState();
}

class _PreQuizScreenState extends State<PreQuizScreen> {
  int? _count;

  Future<void> _start() async {
    Bgm.instance.kick();
    for (var i = 3; i >= 1; i--) {
      if (!mounted) return;
      setState(() => _count = i);
      await Future.delayed(const Duration(milliseconds: 750));
    }
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => QuizScreen(
          categoryId: widget.categoryId,
          categoryName: widget.categoryName,
          mode: widget.mode,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isRandom = widget.categoryId == kRandomCategoryId;
    final accent = categoryAccent(widget.categoryName);
    final count = isRandom ? 12 : questionCountFor(widget.mode);
    final modeName = isRandom
        ? "Mixed"
        : widget.mode.name[0].toUpperCase() + widget.mode.name.substring(1);
    return Scaffold(
      appBar: AppBar(title: Text(widget.categoryName)),
      body: NeonBackground(
        child: Center(
          child: _count != null
              ? Text("$_count",
                      key: ValueKey(_count),
                      style: GoogleFonts.blackOpsOne(fontSize: 110, color: accent, shadows: neonGlow(accent, blur: 30, opacity: 0.7)))
                  .animate()
                  .scale(begin: const Offset(0.4, 0.4), duration: 350.ms, curve: Curves.easeOutBack)
                  .fadeIn(duration: 200.ms)
              : ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 96,
                          height: 96,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: accentGradient(accent),
                            boxShadow: neonGlow(accent, blur: 28, opacity: 0.6),
                          ),
                          child: const Icon(Icons.quiz, size: 44, color: Colors.white),
                        ),
                        const SizedBox(height: 22),
                        Text(widget.categoryName, style: display(28), textAlign: TextAlign.center),
                        const SizedBox(height: 8),
                        Text("$modeName  •  $count questions",
                            style: body(15, color: kTextLo)),
                        const SizedBox(height: 30),
                        NeonButton(label: "Start", icon: Icons.play_arrow_rounded, color: accent, onTap: _start),
                      ],
                    ),
                  ),
                ),
        ),
      ),
    );
  }
}

// --- QUIZ SCREEN (STABLE UI) ---
class QuizScreen extends StatefulWidget {
  final String categoryId;
  final String categoryName;
  final Difficulty mode;
  const QuizScreen({
    super.key,
    required this.categoryId,
    required this.categoryName,
    this.mode = Difficulty.easy,
  });

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  int currentIdx = 0;
  bool isLocked = false;
  int? selectedIndex;
  int score = 0;
  int xpTotal = 0; // XP earned THIS game (the amount sent to Firestore)
  int _baseTotalXp = 0; // player's stored XP before this game, for live level display
  int streak = 0;
  int timeLeft = 12;
  int _lastXpAwarded = 0;
  int _xpFlyerToken = 0;
  bool _timedOut = false;
  int _maxStreak = 0;
  int _streak5Count = 0;
  int _streak10Count = 0;
  Timer? _timer;
  final AudioPlayer _audioPlayer = AudioPlayer();
  final AudioPlayer _mediaAudioPlayer = AudioPlayer();
  List<Question> questions = [];
  bool _loading = true;
  final Random _rng = Random();
  bool _soundEnabled = true;

  // Live cumulative XP (stored + this game) drives the displayed level/league.
  int get _liveTotalXp => _baseTotalXp + xpTotal;
  int get level => levelForXp(_liveTotalXp);
  int get xpInLevel => xpIntoLevel(_liveTotalXp);

  VideoPlayerController? _videoController;
  String? _videoUrl;
  bool _videoReady = false;
  bool _mediaPlaying = false;
  // For audio/video questions: the timer waits until the clip actually starts playing.
  bool _awaitingMediaStart = false;
  String get _seenKey => 'seen_questions_${widget.categoryId}';

  @override
  void initState() {
    super.initState();
    _audioPlayer.setPlayerMode(PlayerMode.lowLatency); // snappier SFX
    _loadSoundPreference();
    _loadBaseStats();
    _loadQuestions();
    _mediaAudioPlayer.onPlayerComplete.listen((_) {
      if (mounted) {
        setState(() => _mediaPlaying = false);
      }
    });
  }

  // Seed the HUD with the player's stored level/XP so progress carries over between sessions.
  // `xpTotal` stays the session-only earnings (what we send to Firestore), avoiding double counts.
  Future<void> _loadBaseStats() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    try {
      final profile = await DatabaseService.instance.streamUserProfile(user.uid).first;
      if (profile != null && mounted) {
        setState(() => _baseTotalXp = profile.stats.totalXp);
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _timer?.cancel();
    _audioPlayer.dispose();
    _mediaAudioPlayer.dispose();
    _disposeVideo();
    super.dispose();
  }

  Future<void> _disposeVideo() async {
    _videoReady = false;
    final controller = _videoController;
    _videoController = null;
    _videoUrl = null;
    if (controller != null) {
      await controller.pause();
      await controller.dispose();
    }
  }

  Future<void> _setupMediaForQuestion(Question question) async {
    if (question.mediaType != MediaType.video || question.mediaUrl == null) {
      await _disposeVideo();
      return;
    }
    if (_videoUrl == question.mediaUrl && _videoController != null) {
      return;
    }
    await _disposeVideo();
    final controller = VideoPlayerController.networkUrl(Uri.parse(question.mediaUrl!));
    try {
      // Webm on web can hang; bound it so the quiz never freezes on a clip.
      await controller.initialize().timeout(const Duration(seconds: 6));
      controller.setLooping(true);
      if (!mounted) {
        await controller.dispose();
        return;
      }
      setState(() {
        _videoController = controller;
        _videoUrl = question.mediaUrl;
        _videoReady = true;
      });
    } catch (_) {
      // Couldn't load the clip: drop it and let the question be answered normally.
      await controller.dispose();
      if (mounted) {
        setState(() {
          _videoController = null;
          _videoUrl = null;
          _videoReady = false;
        });
      }
    }
  }

  Future<void> _toggleAudioMedia(String url) async {
    if (_mediaPlaying) {
      await _mediaAudioPlayer.stop();
      if (mounted) {
        setState(() => _mediaPlaying = false);
      }
      return;
    }
    await _mediaAudioPlayer.stop();
    await _mediaAudioPlayer.play(UrlSource(url));
    if (mounted) {
      setState(() => _mediaPlaying = true);
    }
    _onMediaPlaybackStarted();
  }

  Future<void> _loadSoundPreference() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() => _soundEnabled = prefs.getBool('sound_enabled') ?? true);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.categoryName), centerTitle: true),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.categoryName), centerTitle: true),
        body: const Center(
          child: Text("No questions available for this category."),
        ),
      );
    }
    var q = questions[currentIdx];

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.categoryName),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Stack(
          children: [
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [kBgTop, kBgBottom],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            ),
          ),
            SafeArea(
              child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 480),
                child: Column(
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back_rounded, color: kTextLo),
                    tooltip: 'Quit',
                    onPressed: _confirmExit,
                  ),
                ),
                Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: glassContainer(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  borderRadius: BorderRadius.circular(16),
                  child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                      Text(
                        "Q ${currentIdx + 1}/${questions.length}",
                        style: body(14, w: FontWeight.w700),
                      ),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 250),
                        transitionBuilder: (child, animation) {
                          return ScaleTransition(scale: animation, child: FadeTransition(opacity: animation, child: child));
                        },
                        child: Text(
                          "XP $xpTotal ${streak >= 5 ? "🔥" : ""}",
                          key: ValueKey(xpTotal),
                          style: body(14, color: kNeonAmber, w: FontWeight.w800),
                        ),
                      ),
                      Text(
                        q.difficulty.name.toUpperCase(),
                        style: body(12, color: kTextLo, w: FontWeight.w700),
                      ),
                      Text(
                        _awaitingMediaStart ? "⏱ ▶ play" : "⏱ $timeLeft s",
                        style: body(13,
                            color: _awaitingMediaStart
                                ? kNeonGreen
                                : (timeLeft <= 3 ? kNeonRed : kTextLo),
                            w: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
              ),
              if (_timedOut)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text("TIME UP", style: body(14, color: kNeonRed, w: FontWeight.w800)),
                ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text("${leagueForLevel(level).emoji} Lv $level • ${leagueForLevel(level).name}", style: body(12, color: kTextLo)),
                    Text("XP $xpInLevel/${xpSpanForLevel(level)}", style: body(12, color: kTextLo)),
                    ],
                  ),
                ),
              const SizedBox(height: 6),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: LinearProgressIndicator(
                    value: (currentIdx + 1) / questions.length,
                    minHeight: 8,
                    backgroundColor: kStroke,
                    valueColor: const AlwaysStoppedAnimation<Color>(kNeonBlue),
                  ),
                ),
              ),
              const SizedBox(height: 12),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                    child: Column(
                      children: [
                        const SizedBox(height: 4),
                        // Question first.
                        glassContainer(
                          padding: const EdgeInsets.all(16),
                          borderRadius: BorderRadius.circular(20),
                          child: Text(
                            q.text,
                            style: display(18, w: FontWeight.w700),
                            textAlign: TextAlign.center,
                          ),
                        ),
                        // Media (if any) flexes to fill the space between question and options.
                        if (q.mediaType != MediaType.text && q.mediaUrl != null)
                          Flexible(
                            child: Padding(
                              padding: const EdgeInsets.only(top: 10),
                              child: glassContainer(
                                padding: const EdgeInsets.all(8),
                                borderRadius: BorderRadius.circular(20),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(16),
                                  child: SizedBox(
                                    width: double.infinity,
                                    child: _buildMediaWidget(q),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        const SizedBox(height: 14),
                        ...List.generate(q.options.length, (i) => buildOption(i, q)),
                      ],
                    ),
                  ),
                ),
          ],
        ),
              ),
            ),
            ),
          if (_xpFlyerToken > 0)
            Positioned(
              top: 110,
              left: 0,
              right: 0,
              child: IgnorePointer(
                child: Center(
                  child: Text(
                    "+$_lastXpAwarded XP",
                    key: ValueKey(_xpFlyerToken),
                    style: GoogleFonts.sora(fontSize: 22, fontWeight: FontWeight.w800, color: kNeonGreen, shadows: neonGlow(kNeonGreen, blur: 16)),
                  )
                      .animate()
                      .fadeIn(duration: 200.ms)
                      .slideY(begin: 0.0, end: -0.4, duration: 800.ms, curve: Curves.easeOut)
                      .fadeOut(delay: 400.ms, duration: 300.ms),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget buildOption(int i, Question q) {
    final isCorrect = i == q.correctIndex;
    final isSelected = i == selectedIndex;
    Color borderColor = kStroke;
    Color fill = kSurfaceAlt;
    Color textColor = kTextHi;
    List<BoxShadow>? glow;
    if (isLocked) {
      if (isCorrect) {
        borderColor = kCorrect;
        fill = kCorrect.withOpacity(0.16);
        textColor = kCorrect;
        glow = neonGlow(kCorrect, blur: 14, opacity: 0.4);
      } else if (isSelected) {
        borderColor = kWrong;
        fill = kWrong.withOpacity(0.16);
        textColor = kWrong;
        glow = neonGlow(kWrong, blur: 14, opacity: 0.4);
      }
    }

    Widget tile = GestureDetector(
      onTap: () => _handleAnswer(i, q),
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.symmetric(vertical: 5),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        decoration: BoxDecoration(
          color: fill,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor, width: (isLocked && (isCorrect || isSelected)) ? 2 : 1),
          boxShadow: glow,
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(q.options[i], style: body(15, color: textColor, w: FontWeight.w600)),
            ),
            if (isLocked && isCorrect) const Icon(Icons.check_circle, color: kCorrect, size: 20),
            if (isLocked && isSelected && !isCorrect) const Icon(Icons.cancel, color: kWrong, size: 20),
          ],
        ),
      ),
    );

    if (isLocked && isCorrect) {
      tile = tile.animate().shimmer(duration: 700.ms, color: kCorrect.withOpacity(0.5));
    } else if (isLocked && isSelected && !isCorrect) {
      tile = tile.animate().shakeX(amount: 4, duration: 400.ms);
    }
    return tile;
  }

  Widget _buildMediaWidget(Question q) {
    if (q.mediaUrl == null || q.mediaType == MediaType.text) {
      return const Center(child: Icon(Icons.quiz, size: 80, color: Colors.white10));
    }
    switch (q.mediaType) {
      case MediaType.image:
        // contain (not cover) so the whole portrait/flag is visible, never cropped.
        return Image.network(
          q.mediaUrl!,
          fit: BoxFit.contain,
          filterQuality: FilterQuality.high,
          loadingBuilder: (context, child, progress) =>
              progress == null ? child : const Center(child: CircularProgressIndicator()),
          errorBuilder: (_, __, ___) => const Center(
            child: Icon(Icons.broken_image, size: 48, color: Colors.black26),
          ),
        );
      case MediaType.audio:
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.audiotrack, size: 64, color: Colors.white10),
              const SizedBox(height: 8),
              ElevatedButton.icon(
                onPressed: () => _toggleAudioMedia(q.mediaUrl!),
                icon: Icon(_mediaPlaying ? Icons.stop : Icons.play_arrow),
                label: Text(_mediaPlaying ? 'Stop Audio' : 'Play Audio'),
              ),
            ],
          ),
        );
      case MediaType.video:
        if (_videoController == null || !_videoReady) {
          return const Center(child: CircularProgressIndicator());
        }
        return Stack(
          alignment: Alignment.center,
          children: [
            AspectRatio(
              aspectRatio: _videoController!.value.aspectRatio,
              child: VideoPlayer(_videoController!),
            ),
            IconButton(
              iconSize: 48,
              icon: Icon(
                _videoController!.value.isPlaying ? Icons.pause_circle : Icons.play_circle,
                color: Colors.white70,
              ),
              onPressed: () async {
                if (_videoController!.value.isPlaying) {
                  await _videoController!.pause();
                  // (no-op for timer; pausing doesn't stop the question timer)
                } else {
                  await _videoController!.play();
                  _onMediaPlaybackStarted();
                }
                if (mounted) setState(() {});
              },
            ),
          ],
        );
      case MediaType.text:
        return const Center(child: Icon(Icons.quiz, size: 80, color: Colors.white10));
    }
  }

  int _timeLimitFor(Difficulty difficulty) {
    switch (difficulty) {
      case Difficulty.easy:
        return 12;
      case Difficulty.medium:
        return 10;
      case Difficulty.hard:
        return 8;
    }
  }

  Future<void> _loadQuestions() async {
    if (mounted) setState(() => _loading = true);
    final fetched = await _fetchQuestionsFromApi();
    final valid = fetched.where(_isValidQuestion).toList();
    // The backend returns a fresh random sample already sized for this mode (10/12/15),
    // so just prepare them (shuffle options + order).
    questions = _prepareQuestions(valid);
    if (questions.isNotEmpty) {
      await _markSeen(questions.first);
      await _setupMediaForQuestion(questions.first);
      _armQuestionTimer(questions.first);
    }
    if (mounted) setState(() => _loading = false);
  }

  Question _mapApiQuestion(Map<String, dynamic> item) {
    final options = (item['options'] as List<dynamic>? ?? []).map((e) => e.toString()).toList();
    return Question(
      id: item['id']?.toString() ?? '',
      text: (item['question'] as String?) ?? '',
      options: options,
      correctIndex: (item['correctIndex'] as num?)?.toInt() ?? 0,
      trivia: '',
      mediaUrl: (item['mediaUrl'] as String?)?.isNotEmpty == true ? item['mediaUrl'] as String : null,
      mediaType: mediaTypeFromString((item['mediaType'] as String?) ?? 'text'),
      difficulty: difficultyFromString((item['level'] as String?) ?? 'easy'),
      xpReward: (item['xpReward'] as num?)?.toInt(),
      timeLimitSeconds: (item['timeLimit'] as num?)?.toInt(),
    );
  }

  Future<List<Map<String, dynamic>>> _postQuestions(
      String category, String level, int limit, List<String> exclude) async {
    final res = await http.post(
      Uri.parse('$kApiBaseUrl/api/questions'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'category': category, 'level': level, 'limit': limit, 'exclude': exclude}),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) return [];
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return (data['questions'] as List<dynamic>? ?? []).map((e) => e as Map<String, dynamic>).toList();
  }

  Future<List<Question>> _fetchQuestionsFromApi() async {
    try {
      // Random Mix: 12 across ALL categories/difficulties (huge pool, no seen tracking).
      if (widget.categoryId == kRandomCategoryId) {
        final res = await http.get(Uri.parse('$kApiBaseUrl/api/questions?limit=12'));
        if (res.statusCode >= 200 && res.statusCode < 300) {
          final list = (jsonDecode(res.body)['questions'] as List<dynamic>? ?? []);
          return list.map((e) => _mapApiQuestion(e as Map<String, dynamic>)).toList();
        }
        return [];
      }
      // Single category: exclude questions already seen, so each game is fresh until exhausted.
      final category = widget.categoryName;
      final count = questionCountFor(widget.mode);
      final seen = await Seen.load(category);
      var raw = await _postQuestions(category, widget.mode.name, count, seen);
      if (raw.length < count) {
        // Whole set (for this mode) seen — reset and start a fresh cycle.
        await Seen.clear(category);
        raw = await _postQuestions(category, widget.mode.name, count, const []);
      }
      await Seen.add(category, raw.map((q) => (q['id'] ?? '').toString()).where((s) => s.isNotEmpty));
      return raw.map(_mapApiQuestion).toList();
    } catch (_) {}
    return [];
  }

  List<Question> _prepareQuestions(List<Question> source) {
    final prepared = source.map((q) {
      final indexed = q.options.asMap().entries.toList();
      indexed.shuffle(_rng);
      final newOptions = indexed.map((e) => e.value).toList();
      final newCorrectIndex = indexed.indexWhere((e) => e.key == q.correctIndex);
      return Question(
        id: q.id,
        text: q.text,
        options: newOptions,
        correctIndex: newCorrectIndex,
        trivia: q.trivia,
        mediaUrl: q.mediaUrl,
        mediaType: q.mediaType,
        difficulty: q.difficulty,
        xpReward: q.xpReward,
        timeLimitSeconds: q.timeLimitSeconds,
      );
    }).toList();
    prepared.shuffle(_rng);
    return prepared;
  }

  bool _isValidQuestion(Question q) {
    final text = q.text.trim();
    if (text.isEmpty) return false;
    final normalized = q.options.map((o) => o.trim()).where((o) => o.isNotEmpty).toList();
    if (normalized.length < 2) return false;
    final unique = normalized.map((o) => o.toLowerCase()).toSet();
    return unique.length >= 2;
  }

  int _baseXpFor(Difficulty difficulty) {
    switch (difficulty) {
      case Difficulty.easy:
        return 20;
      case Difficulty.medium:
        return 40;
      case Difficulty.hard:
        return 80;
    }
  }

  int _speedMultiplierFor(Difficulty difficulty) {
    switch (difficulty) {
      case Difficulty.easy:
        return 10;
      case Difficulty.medium:
        return 20;
      case Difficulty.hard:
        return 60;
    }
  }

  // Per-step streak bonus; awarded at every multiple of 5, scaling with the milestone.
  int _streakStepFor(Difficulty difficulty) {
    switch (difficulty) {
      case Difficulty.easy:
        return 50;
      case Difficulty.medium:
        return 75;
      case Difficulty.hard:
        return 120;
    }
  }

  void _addXp(int xp) {
    xpTotal += xp; // level/xpInLevel derive from _liveTotalXp getter
  }

  // Image/text questions start the timer immediately; playable audio/video wait for playback.
  void _armQuestionTimer(Question question) {
    _timer?.cancel();
    final isAudio = question.mediaType == MediaType.audio;
    final isPlayableVideo = question.mediaType == MediaType.video && _videoReady;
    if (isAudio || isPlayableVideo) {
      setState(() {
        _awaitingMediaStart = true;
        timeLeft = question.timeLimitSeconds ?? _timeLimitFor(question.difficulty);
      });
    } else {
      // text, image, or a video that failed to load -> start right away
      _startTimer(question);
    }
  }

  // Called when an audio/video clip actually starts playing, to release the held timer.
  void _onMediaPlaybackStarted() {
    if (_awaitingMediaStart) {
      _awaitingMediaStart = false;
      _startTimer(questions[currentIdx]);
    }
  }

  void _startTimer(Question question) {
    _timer?.cancel();
    _awaitingMediaStart = false;
    timeLeft = question.timeLimitSeconds ?? _timeLimitFor(question.difficulty);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (timeLeft <= 0) {
        timer.cancel();
        _handleTimeout();
      } else {
        if (timeLeft <= 3 && timeLeft > 0) {
          _playSound("sounds/tick.mp3");
        }
        setState(() => timeLeft--);
      }
    });
  }

  // Low-latency, fire-and-forget. In lowLatency mode play() restarts instantly
  // without the stop()+reload round-trip that caused the noticeable delay.
  void _playSound(String assetPath) {
    if (!_soundEnabled) return;
    _audioPlayer.play(AssetSource(assetPath));
  }

  Future<void> _confirmExit() async {
    final leave = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Quit quiz?'),
        content: const Text('Your progress in this game will be lost.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Stay')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Quit')),
        ],
      ),
    );
    if (leave == true && mounted) {
      _timer?.cancel();
      _mediaAudioPlayer.stop();
      Navigator.pop(context);
    }
  }

  void _showXpFlyer(int xp) {
    setState(() {
      _lastXpAwarded = xp;
      _xpFlyerToken++;
    });
  }

  void _handleAnswer(int i, Question q) {
    if (isLocked) return;
    final isCorrect = i == q.correctIndex;
    _timer?.cancel();
    HapticFeedback.lightImpact();
    setState(() {
      isLocked = true;
      selectedIndex = i;
      if (isCorrect) score++;
    });

    if (isCorrect) {
      streak++;
      if (streak > _maxStreak) _maxStreak = streak;
      final baseXp = q.xpReward ?? _baseXpFor(q.difficulty);
      // Speed bonus for answering within the first HALF of the clock.
      final fullTimer = q.timeLimitSeconds ?? _timeLimitFor(q.difficulty);
      final half = fullTimer / 2.0;
      final bonus = timeLeft > half ? ((timeLeft - half) * _speedMultiplierFor(q.difficulty)).round() : 0;
      final totalEarned = baseXp + bonus;
      _addXp(totalEarned);
      _showXpFlyer(totalEarned);
      // Streak bonus at every multiple of 5, scaling with the milestone (per-question difficulty).
      if (streak % 5 == 0) {
        final milestoneBonus = _streakStepFor(q.difficulty) * (streak ~/ 5).clamp(1, 6);
        _addXp(milestoneBonus);
        _streak5Count++;
        if (streak % 10 == 0) _streak10Count++;
      }
    } else {
      streak = 0;
    }

    if (isCorrect) {
      HapticFeedback.mediumImpact();
    } else {
      HapticFeedback.heavyImpact();
    }
    _playSound(isCorrect ? "sounds/correct.mp3" : "sounds/wrong.mp3");

    Timer(const Duration(milliseconds: 900), () {
      if (!mounted) return;
      _goToNextOrFinish();
    });
  }

  void _handleTimeout() {
    if (isLocked) return;
    setState(() {
      isLocked = true;
      selectedIndex = null;
      _timedOut = true;
    });
    streak = 0;
    HapticFeedback.heavyImpact();
    _playSound("sounds/timeout.mp3");
    Timer(const Duration(milliseconds: 900), () {
      if (!mounted) return;
      _goToNextOrFinish();
    });
  }

  Future<void> _goToNextOrFinish() async {
    // Fire-and-forget: stop() can hang on web and must never block the flow.
    _mediaAudioPlayer.stop();
    if (mounted) setState(() => _mediaPlaying = false);
    if (currentIdx < questions.length - 1) {
      setState(() {
        currentIdx++;
        isLocked = false;
        selectedIndex = null;
        _timedOut = false;
      });
      _markSeen(questions[currentIdx]);
      await _setupMediaForQuestion(questions[currentIdx]);
      _armQuestionTimer(questions[currentIdx]);
    } else {
      try {
        await _persistStats().timeout(const Duration(seconds: 6));
      } catch (_) {}
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => ResultsScreen(
            categoryId: widget.categoryId,
            categoryName: widget.categoryName,
            mode: widget.mode,
            score: score,
            total: questions.length,
            xpEarned: xpTotal,
            level: level,
            league: leagueForLevel(level).name,
            maxStreak: _maxStreak,
            streak5: _streak5Count,
            streak10: _streak10Count,
          ),
        ),
      );
    }
  }

  Future<void> _persistStats() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    final displayName = user.displayName?.trim().isNotEmpty == true
        ? user.displayName!.trim()
        : (user.email?.split('@').first ?? 'Player');
    await DatabaseService.instance.updateUserStatsOnQuizFinish(
      uid: user.uid,
      email: user.email ?? '',
      displayName: displayName,
      categoryId: widget.categoryId,
      categoryName: widget.categoryName,
      totalQuestions: questions.length,
      correctCount: score,
      xpEarned: xpTotal,
      maxStreak: _maxStreak,
      streak5Count: _streak5Count,
      streak10Count: _streak10Count,
    );
  }

  Future<Set<String>> _loadSeenIds() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList(_seenKey) ?? []).toSet();
  }

  Future<void> _saveSeenIds(Set<String> ids) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_seenKey, ids.toList());
  }

  Future<void> _markSeen(Question q) async {
    if (q.id.isEmpty) return;
    final seen = await _loadSeenIds();
    if (seen.add(q.id)) {
      await _saveSeenIds(seen);
    }
  }
}
// Animated end-of-quiz results.
class ResultsScreen extends StatelessWidget {
  final String categoryId;
  final String categoryName;
  final Difficulty mode;
  final int score;
  final int total;
  final int xpEarned;
  final int level;
  final String league;
  final int maxStreak;
  final int streak5;
  final int streak10;
  const ResultsScreen({
    super.key,
    required this.categoryId,
    required this.categoryName,
    required this.mode,
    required this.score,
    required this.total,
    required this.xpEarned,
    required this.level,
    required this.league,
    required this.maxStreak,
    required this.streak5,
    required this.streak10,
  });

  @override
  Widget build(BuildContext context) {
    final accent = categoryAccent(categoryName);
    final acc = total == 0 ? 0.0 : score / total;
    final great = acc >= 0.7;
    final headline = great ? "Awesome! 🎉" : (acc >= 0.4 ? "Good game!" : "Keep going!");

    return Scaffold(
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
                      Text(headline, style: display(28, color: great ? accent : kTextHi), textAlign: TextAlign.center)
                          .animate()
                          .fadeIn(duration: 300.ms)
                          .scale(begin: const Offset(0.7, 0.7), curve: Curves.easeOutBack),
                      Text(categoryName, style: body(14, color: kTextLo)),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: 168,
                        height: 168,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            TweenAnimationBuilder<double>(
                              tween: Tween(begin: 0, end: acc),
                              duration: const Duration(milliseconds: 1000),
                              curve: Curves.easeOutCubic,
                              builder: (_, v, __) => SizedBox(
                                width: 168,
                                height: 168,
                                child: CircularProgressIndicator(
                                  value: v,
                                  strokeWidth: 13,
                                  backgroundColor: kStroke,
                                  valueColor: AlwaysStoppedAnimation(accent),
                                ),
                              ),
                            ),
                            Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text("${(acc * 100).round()}%", style: display(36, color: accent)),
                                Text("$score / $total", style: body(14, color: kTextLo)),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      GlowCard(
                        accent: kNeonAmber,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text("XP earned", style: body(15, color: kTextLo)),
                            TweenAnimationBuilder<int>(
                              tween: IntTween(begin: 0, end: xpEarned),
                              duration: const Duration(milliseconds: 1000),
                              builder: (_, v, __) => Text("+$v", style: display(24, color: kNeonAmber)),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _resStat("Level", "$level", kNeonBlue),
                          const SizedBox(width: 10),
                          _resStat("Best Streak", "$maxStreak", kNeonGreen),
                          const SizedBox(width: 10),
                          _resStat("5x / 10x", "$streak5 / $streak10", kNeonPink),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(league, style: body(13, color: kTextLo)),
                      const SizedBox(height: 24),
                      NeonButton(
                        label: "Play Again",
                        icon: Icons.replay_rounded,
                        color: accent,
                        onTap: () => Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                            builder: (_) => PreQuizScreen(categoryId: categoryId, categoryName: categoryName, mode: mode),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: () => Navigator.popUntil(context, (r) => r.isFirst),
                          icon: const Icon(Icons.home_rounded),
                          label: const Text("Home"),
                        ),
                      ),
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

  Widget _resStat(String label, String value, Color accent) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
        decoration: BoxDecoration(
          color: kSurface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: accent.withOpacity(0.4)),
        ),
        child: Column(
          children: [
            Text(value, style: display(16, color: accent)),
            const SizedBox(height: 3),
            Text(label, style: body(10, color: kTextLo), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
