require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

/* =========================
   MIDDLEWARE
========================= */

app.use(express.json());

app.use(
  cors({
    origin: true,
  })
);

/* =========================
   QUESTIONS DATA
========================= */

// General knowledge
const questions = [
  {
    id: 1,
    question: "Capital of Japan?",
    options: ["China", "Japan", "Korea", "Thailand"],
    answer: "Japan",
  },
  {
    id: 2,
    question: "Red Planet?",
    options: ["Earth", "Mars", "Jupiter", "Venus"],
    answer: "Mars",
  },
  {
    id: 3,
    question: "Father of Indian Constitution?",
    options: ["Gandhi", "Ambedkar", "Nehru", "Patel"],
    answer: "Ambedkar",
  },
];

// Flags quiz
const flagQuestions = [
  {
    id: 101,
    question: "Which country's flag is 🇯🇵?",
    options: ["China", "Japan", "South Korea", "Thailand"],
    answer: "Japan",
  },
  {
    id: 102,
    question: "Which country's flag is 🇮🇳?",
    options: ["Nepal", "India", "Sri Lanka", "Bangladesh"],
    answer: "India",
  },
];

// States quiz
const stateQuestions = [
  {
    id: 201,
    question: "Capital of Maharashtra?",
    options: ["Pune", "Nagpur", "Mumbai", "Nashik"],
    answer: "Mumbai",
  },
  {
    id: 202,
    question: "Jaipur is in which state?",
    options: ["Gujarat", "Madhya Pradesh", "Rajasthan", "Punjab"],
    answer: "Rajasthan",
  },
];

/* =========================
   ROUTES
========================= */

// Health check
app.get("/", (req, res) => {
  res.send("Quizzard backend running 🚀");
});

// Generic quiz route (STATELESS – Flutter/Web safe)
app.get("/quiz/:type", (req, res) => {
  const { type } = req.params;

  let pool;

  if (type === "general") pool = questions;
  else if (type === "flags") pool = flagQuestions;
  else if (type === "states") pool = stateQuestions;
  else {
    return res.status(404).json({ message: "Invalid quiz type" });
  }

  const q = pool[Math.floor(Math.random() * pool.length)];

  res.json({
    id: q.id,
    question: q.question,
    options: q.options,
  });
});

/* =========================
   START SERVER
========================= */

const PORT = 5050;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
