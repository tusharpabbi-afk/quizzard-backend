/**
 * Imports from The Trivia API (the-trivia-api.com, free) to grow generic
 * categories to a target count. APPENDS (deduped by question text) — does not
 * delete existing questions. Run: node scripts/importTriviaApi.js
 */
require("dotenv").config();
const https = require("https");
const mongoose = require("mongoose");
const Question = require("../models/Question");

const LEVEL_CONFIG = { easy: { xp: 20, time: 12 }, medium: { xp: 40, time: 10 }, hard: { xp: 80, time: 8 } };
const TARGET = 550;
const MAX_REQ = 60; // safety cap per category

// API category -> our category name
const MAP = [
  { api: "music", cat: "Music" },
  { api: "geography", cat: "Geography Trivia" },
  { api: "science", cat: "Science" },
  { api: "history", cat: "World History" },
  { api: "sport_and_leisure", cat: "Sports Trivia" },
  { api: "general_knowledge", cat: "General Knowledge" },
  { api: "arts_and_literature", cat: "Arts & Literature" },
  { api: "society_and_culture", cat: "Society & Culture" },
  { api: "food_and_drink", cat: "Food & Drink" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJson(url) {
  return new Promise((resolve) => {
    https
      .get(url, { headers: { "User-Agent": "quizzard-seed/1.0" } }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          if (res.statusCode !== 200) return resolve({ _status: res.statusCode });
          try { resolve(JSON.parse(d)); } catch (_) { resolve(null); }
        });
      })
      .on("error", () => resolve(null));
  });
}

function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toDoc(item, category) {
  const correct = item.correctAnswer;
  const incorrect = item.incorrectAnswers || [];
  if (!correct || incorrect.length < 3) return null;
  const options = shuffle([correct, ...incorrect.slice(0, 3)]);
  const correctIndex = options.indexOf(correct);
  if (correctIndex < 0 || options.length < 4) return null;
  const level = ["easy", "medium", "hard"].includes(item.difficulty) ? item.difficulty : "medium";
  const cfg = LEVEL_CONFIG[level];
  return {
    category,
    question: item.question?.text || "",
    options,
    correctIndex,
    correctAnswer: correct,
    mediaUrl: "",
    mediaType: "text",
    level,
    xpReward: cfg.xp,
    timeLimit: cfg.time,
  };
}

async function existingTexts(category) {
  const docs = await Question.find({ category }, { question: 1 }).lean();
  return new Set(docs.map((d) => d.question));
}

async function fillCategory(apiCat, category, target) {
  const seen = await existingTexts(category);
  let added = 0;
  let emptyStreak = 0;
  for (let req = 0; req < MAX_REQ; req++) {
    const current = await Question.countDocuments({ category });
    if (current >= target) break;
    const data = await getJson(
      `https://the-trivia-api.com/v2/questions?limit=50&categories=${apiCat}&types=text_choice`
    );
    if (!Array.isArray(data)) {
      // rate limited or error -> back off
      await sleep(4000);
      continue;
    }
    const docs = [];
    for (const item of data) {
      if (item.type !== "text_choice") continue;
      const text = item.question?.text || "";
      if (!text || seen.has(text)) continue;
      const doc = toDoc(item, category);
      if (!doc) continue;
      seen.add(text);
      docs.push(doc);
    }
    if (docs.length) {
      await Question.insertMany(docs);
      added += docs.length;
      emptyStreak = 0;
    } else {
      emptyStreak++;
      if (emptyStreak >= 4) break; // pool likely saturated for our dedup
    }
    await sleep(1500);
  }
  console.log(`  ${category}: +${added} (now ${await Question.countDocuments({ category })})`);
}

// film_and_tv is mixed; split fresh questions between Film and TV Shows.
async function fillFilmAndTv(target) {
  const seenFilm = await existingTexts("Film");
  const seenTv = await existingTexts("TV Shows");
  let toFilm = true;
  let addF = 0, addT = 0, emptyStreak = 0;
  for (let req = 0; req < MAX_REQ * 2; req++) {
    const cF = await Question.countDocuments({ category: "Film" });
    const cT = await Question.countDocuments({ category: "TV Shows" });
    if (cF >= target && cT >= target) break;
    const data = await getJson("https://the-trivia-api.com/v2/questions?limit=50&categories=film_and_tv&types=text_choice");
    if (!Array.isArray(data)) { await sleep(4000); continue; }
    const docs = [];
    for (const item of data) {
      if (item.type !== "text_choice") continue;
      const text = item.question?.text || "";
      if (!text) continue;
      // route to whichever side still needs questions and hasn't seen it
      let target1 = toFilm ? "Film" : "TV Shows";
      let seen1 = toFilm ? seenFilm : seenTv;
      if (seen1.has(text)) {
        const other = toFilm ? "TV Shows" : "Film";
        const seenOther = toFilm ? seenTv : seenFilm;
        if (seenOther.has(text)) continue;
        target1 = other; seen1 = seenOther;
      }
      const doc = toDoc(item, target1);
      if (!doc) continue;
      seen1.add(text);
      docs.push(doc);
      if (target1 === "Film") addF++; else addT++;
      toFilm = !toFilm;
    }
    if (docs.length) { await Question.insertMany(docs); emptyStreak = 0; }
    else { emptyStreak++; if (emptyStreak >= 5) break; }
    await sleep(1500);
  }
  console.log(`  Film: +${addF}, TV Shows: +${addT}`);
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Filling categories from The Trivia API…");
  await fillFilmAndTv(TARGET);
  for (const m of MAP) {
    await fillCategory(m.api, m.cat, TARGET);
  }
  console.log("Done with The Trivia API import.");
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
