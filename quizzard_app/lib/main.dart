import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

void main() {
  runApp(const QuizzardApp());
}

class QuizzardApp extends StatelessWidget {
  const QuizzardApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: QuizScreen(),
    );
  }
}

class QuizScreen extends StatefulWidget {
  const QuizScreen({super.key});

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  String question = "";
  List<String> options = [];
  bool loading = true;

  String quizType = "general";
  String message = "";
  int score = 0;

  final String baseUrl = "http://127.0.0.1:5050";

  @override
  void initState() {
    super.initState();
    fetchQuestion();
  }

  Future<void> fetchQuestion() async {
    setState(() {
      loading = true;
      message = "";
    });

    try {
      final response =
          await http.get(Uri.parse("$baseUrl/quiz/$quizType"));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        setState(() {
          question = data["question"];
          options = List<String>.from(data["options"]);
          loading = false;
        });
      } else {
        setState(() {
          loading = false;
          question = "Failed to load question";
        });
      }
    } catch (e) {
      setState(() {
        loading = false;
        question = "Error connecting to backend";
      });
    }
  }

  void selectAnswer(String option) {
    setState(() {
      score += 10;
      message = "Selected: $option";
    });

    Future.delayed(const Duration(milliseconds: 800), () {
      fetchQuestion();
    });
  }

  void changeCategory(String type) {
    setState(() {
      quizType = type;
      score = 0;
      message = "";
    });
    fetchQuestion();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Quizzard"),
        centerTitle: true,
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // CATEGORY BUTTONS
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      ElevatedButton(
                        onPressed: () => changeCategory("general"),
                        child: const Text("General"),
                      ),
                      ElevatedButton(
                        onPressed: () => changeCategory("flags"),
                        child: const Text("Flags"),
                      ),
                      ElevatedButton(
                        onPressed: () => changeCategory("states"),
                        child: const Text("States"),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // SCORE
                  Text(
                    "Score: $score",
                    style: const TextStyle(fontSize: 18),
                    textAlign: TextAlign.right,
                  ),

                  const SizedBox(height: 20),

                  // QUESTION
                  Text(
                    question,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 20),

                  // OPTIONS
                  ...options.map(
                    (option) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: ElevatedButton(
                        onPressed: () => selectAnswer(option),
                        child: Text(option),
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // MESSAGE
                  Text(
                    message,
                    style: const TextStyle(fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
    );
  }
}
