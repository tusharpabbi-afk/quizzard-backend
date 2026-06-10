import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Dark-neon design system for Quizzard (QuizUp-inspired).

// ---- Color tokens ----
const Color kBg = Color(0xFF0B0D17); // near-black navy
const Color kBgElevated = Color(0xFF141829);
const Color kSurface = Color(0xFF1B2036);
const Color kSurfaceAlt = Color(0xFF252B45);
const Color kStroke = Color(0xFF2E3553);
const Color kTextHi = Color(0xFFF4F6FF);
const Color kTextLo = Color(0xFF99A0C2);

// Neon accents
const Color kNeonBlue = Color(0xFF4D8DFF);
const Color kNeonPink = Color(0xFFFF4D8D);
const Color kNeonGreen = Color(0xFF31E0A0);
const Color kNeonAmber = Color(0xFFFFB23E);
const Color kNeonPurple = Color(0xFF9B6CFF);
const Color kNeonRed = Color(0xFFFF5C5C);
const Color kNeonCyan = Color(0xFF35D0E8);

const Color kCorrect = kNeonGreen;
const Color kWrong = kNeonRed;

/// Stable-ish accent per category (falls back by hashing the name).
const Map<String, Color> _categoryAccents = {
  'Capitals': kNeonBlue,
  'Flags': kNeonRed,
  'Largest Cities': kNeonCyan,
  'Find the Country': kNeonPurple,
  'Currencies': kNeonAmber,
  'Continents': kNeonGreen,
  'Bollywood': kNeonPink,
  'Hollywood': kNeonPurple,
  'Sports': kNeonGreen,
  'Movies': kNeonAmber,
  'History': kNeonCyan,
  'Finance': kNeonGreen,
  'Anthems': kNeonPink,
  'Nature Clips': kNeonGreen,
};

const List<Color> _accentPalette = [
  kNeonBlue, kNeonPink, kNeonGreen, kNeonAmber, kNeonPurple, kNeonCyan, kNeonRed,
];

Color categoryAccent(String name) {
  final hit = _categoryAccents[name];
  if (hit != null) return hit;
  var h = 0;
  for (final c in name.codeUnits) h = (h * 31 + c) & 0x7fffffff;
  return _accentPalette[h % _accentPalette.length];
}

// ---- Effects ----
List<BoxShadow> neonGlow(Color color, {double blur = 16, double spread = 0, double opacity = 0.45}) =>
    [BoxShadow(color: color.withOpacity(opacity), blurRadius: blur, spreadRadius: spread)];

LinearGradient accentGradient(Color color) => LinearGradient(
      colors: [color, Color.lerp(color, Colors.black, 0.35)!],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );

// ---- Text ----
TextStyle display(double size, {Color color = kTextHi, FontWeight w = FontWeight.w800}) =>
    GoogleFonts.sora(fontSize: size, color: color, fontWeight: w, height: 1.1);

TextStyle body(double size, {Color color = kTextHi, FontWeight w = FontWeight.w500}) =>
    GoogleFonts.sora(fontSize: size, color: color, fontWeight: w);

// ---- App theme ----
ThemeData buildAppTheme() {
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: kBg,
    colorScheme: const ColorScheme.dark(
      primary: kNeonBlue,
      secondary: kNeonPink,
      surface: kSurface,
      onSurface: kTextHi,
    ),
  );
  return base.copyWith(
    textTheme: GoogleFonts.soraTextTheme(base.textTheme).apply(
      bodyColor: kTextHi,
      displayColor: kTextHi,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: true,
      foregroundColor: kTextHi,
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: kSurface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: kNeonBlue,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 22),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: GoogleFonts.sora(fontWeight: FontWeight.w700, fontSize: 16),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: kTextHi,
        side: const BorderSide(color: kStroke),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: kSurfaceAlt,
      hintStyle: const TextStyle(color: kTextLo),
      labelStyle: const TextStyle(color: kTextLo),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: kStroke),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: kStroke),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: kNeonBlue, width: 2),
      ),
    ),
  );
}

/// Full-screen dark background with subtle neon radial glows.
class NeonBackground extends StatelessWidget {
  final Widget child;
  const NeonBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: RadialGradient(
          center: Alignment(-0.8, -0.9),
          radius: 1.4,
          colors: [Color(0xFF1A1F3A), kBg],
        ),
      ),
      child: child,
    );
  }
}

/// Card with a soft neon edge glow.
class GlowCard extends StatelessWidget {
  final Widget child;
  final Color accent;
  final EdgeInsetsGeometry padding;
  final double radius;
  const GlowCard({
    super.key,
    required this.child,
    this.accent = kNeonBlue,
    this.padding = const EdgeInsets.all(16),
    this.radius = 20,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: kSurface,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: accent.withOpacity(0.35)),
        boxShadow: neonGlow(accent, blur: 18, opacity: 0.18),
      ),
      child: child,
    );
  }
}

/// Filled glowing button.
class NeonButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final Color color;
  final IconData? icon;
  final bool expand;
  const NeonButton({
    super.key,
    required this.label,
    required this.onTap,
    this.color = kNeonBlue,
    this.icon,
    this.expand = true,
  });

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: onTap == null ? null : neonGlow(color, blur: 20, opacity: 0.5),
      ),
      child: ElevatedButton.icon(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          minimumSize: expand ? const Size.fromHeight(54) : null,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        icon: icon == null ? const SizedBox.shrink() : Icon(icon, size: 20),
        label: Text(label, style: GoogleFonts.sora(fontWeight: FontWeight.w700, fontSize: 16)),
      ),
    );
  }
}
