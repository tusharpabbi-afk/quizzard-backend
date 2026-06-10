enum Difficulty { easy, medium, hard }

enum MediaType { text, image, audio, video }

class Question {
  final String id;
  final String text;
  final List<String> options;
  final int correctIndex;
  final String trivia;
  final String? mediaUrl;
  final MediaType mediaType;
  final Difficulty difficulty;
  final int? xpReward;
  final int? timeLimitSeconds;

  Question({
    this.id = '',
    required this.text,
    required this.options,
    required this.correctIndex,
    required this.trivia,
    this.mediaUrl,
    this.mediaType = MediaType.text,
    required this.difficulty,
    this.xpReward,
    this.timeLimitSeconds,
  });
}

class QuizCategory {
  final String name;
  final String assetImagePath;
  final Difficulty difficulty;

  QuizCategory({
    required this.name,
    required this.assetImagePath,
    required this.difficulty,
  });
}
