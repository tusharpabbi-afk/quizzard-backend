/**
 * Imports exhaustive multiple-choice trivia from the Open Trivia Database
 * (https://opentdb.com, free/open, no key) straight into MongoDB as Question docs.
 * Run: node scripts/importOpenTDB.js
 *
 * OpenTDB rate-limits to ~1 request / 5s and caps 50 questions/request, so this
 * walks each category × difficulty with delays. Re-running replaces these categories.
 */
require("dotenv").config();
const https = require("https");
const mongoose = require("mongoose");
const Question = require("../models/Question");

const LEVEL_CONFIG = {
  easy: { xp: 20, time: 12 },
  medium: { xp: 40, time: 10 },
  hard: { xp: 80, time: 8 },
};

// OpenTDB category id -> our display category name.
const CATEGORIES = [
  { id: 9, name: "General Knowledge" },
  { id: 11, name: "Film" },
  { id: 12, name: "Music" },
  { id: 14, name: "TV Shows" },
  { id: 15, name: "Video Games" },
  { id: 17, name: "Science" },
  { id: 18, name: "Computers" },
  { id: 21, name: "Sports Trivia" },
  { id: 22, name: "Geography Trivia" },
  { id: 23, name: "World History" },
  { id: 20, name: "Mythology" },
  { id: 27, name: "Animals" },
];
const DIFFICULTIES = ["easy", "medium", "hard"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "quizzard-seed/1.0" } }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

const dec = (s) => {
  try {
    return decodeURIComponent(s);
  } catch (_) {
    return s;
  }
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to Mongo");

  // Session token avoids repeats across requests in this run.
  let token = "";
  try {
    const t = await getJson("https://opentdb.com/api_token.php?command=request");
    token = t.token || "";
  } catch (_) {}

  const names = CATEGORIES.map((c) => c.name);
  await Question.deleteMany({ category: { $in: names } });
  console.log("Cleared previous OpenTDB categories");

  const MAX_BATCHES = 3; // up to 150 per difficulty (=> ~80-450 per category)
  let total = 0;
  for (const cat of CATEGORIES) {
    let catCount = 0;
    for (const diff of DIFFICULTIES) {
      for (let batch = 0; batch < MAX_BATCHES; batch++) {
        const url =
          `https://opentdb.com/api.php?amount=50&category=${cat.id}` +
          `&difficulty=${diff}&type=multiple&encode=url3986` +
          (token ? `&token=${token}` : "");
        let data;
        try {
          data = await getJson(url);
        } catch (e) {
          console.warn(`  ${cat.name}/${diff}: fetch error ${e.message}`);
          await sleep(6000);
          continue;
        }
        const rc = data.response_code;
        if (rc === 5) { await sleep(9000); batch--; continue; } // rate limited -> wait & retry
        if (rc === 4 || rc === 1) { await sleep(5500); break; }   // exhausted / none left
        const results = data.results || [];
        const docs = [];
        for (const r of results) {
          const correct = dec(r.correct_answer);
          const incorrect = (r.incorrect_answers || []).map(dec);
          const options = shuffle([correct, ...incorrect]);
          const correctIndex = options.indexOf(correct);
          if (correctIndex < 0 || options.length < 4) continue;
          const cfg = LEVEL_CONFIG[diff];
          docs.push({
            category: cat.name,
            question: dec(r.question),
            options,
            correctIndex,
            correctAnswer: correct,
            mediaUrl: "",
            mediaType: "text",
            level: diff,
            xpReward: cfg.xp,
            timeLimit: cfg.time,
          });
        }
        if (docs.length) {
          await Question.insertMany(docs);
          catCount += docs.length;
          total += docs.length;
        }
        console.log(`  ${cat.name}/${diff} batch ${batch + 1}: +${docs.length}`);
        await sleep(5500); // respect OpenTDB rate limit
        if (results.length < 50) break; // last page
      }
    }
    console.log(`= ${cat.name}: ${catCount}`);
  }

  console.log(`\nImported ${total} questions across ${CATEGORIES.length} categories.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
