/**
 * Imports a batch of additional OpenTDB categories (https://opentdb.com) into
 * MongoDB as Question docs. Each listed category is cleared then re-imported, so
 * the script is idempotent/re-runnable. Set MONGO_URI to the target DB (Atlas in
 * production). Run: MONGO_URI="<atlas-uri>" node scripts/importNewCategories.js
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

// OpenTDB category id -> our display name. (10 new + Mythology/Animals fixes.)
const CATEGORIES = [
  { id: 31, name: "Anime & Manga" },
  { id: 29, name: "Comics" },
  { id: 32, name: "Cartoons" },
  { id: 16, name: "Board Games" },
  { id: 28, name: "Vehicles" },
  { id: 30, name: "Gadgets" },
  { id: 26, name: "Celebrities" },
  { id: 19, name: "Mathematics" },
  { id: 24, name: "Politics" },
  { id: 10, name: "Books" },
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
          try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
        });
      })
      .on("error", reject);
  });
}

const dec = (s) => { try { return decodeURIComponent(s); } catch (_) { return s; } };

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
  console.log("Connected to", process.env.MONGO_URI.replace(/:[^:@]+@/, ":****@"));

  // Optional ONLY="Name A,Name B" filter to re-run specific categories.
  const only = (process.env.ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);
  const targets = only.length ? CATEGORIES.filter((c) => only.includes(c.name)) : CATEGORIES;

  const names = targets.map((c) => c.name);
  await Question.deleteMany({ category: { $in: names } });
  console.log("Cleared:", names.join(", "));

  let grand = 0;
  for (const cat of targets) {
    // Total pool size (OpenTDB rejects requests with amount >= available, so we
    // need this to size the request just under the cap).
    let total = 0;
    try {
      const c = (await getJson(`https://opentdb.com/api_count.php?category=${cat.id}`)).category_question_count || {};
      total = c.total_question_count || 0;
    } catch (_) {}
    await sleep(5200);

    // Strategy: no token, no difficulty filter (both are buggy/over-strict on
    // OpenTDB). Pull mixed batches with amount < total, take each question's own
    // `difficulty` for the level, and dedup client-side across batches.
    // Start just under the reported pool; the servable pool is often a bit
    // smaller, so shrink the amount on rc=1 until requests succeed.
    let amount = total > 50 ? 50 : Math.max(1, total - 1);
    const seen = new Set();
    const docs = [];
    let noNew = 0;
    for (let req = 0; req < 16 && noNew < 4 && docs.length < total; req++) {
      const url = `https://opentdb.com/api.php?amount=${amount}&category=${cat.id}&type=multiple&encode=url3986`;
      let data;
      try { data = await getJson(url); }
      catch (e) { console.warn(`  ${cat.name}: ${e.message}`); await sleep(6000); continue; }
      const rc = data.response_code;
      if (rc === 5) { await sleep(9000); req--; continue; } // rate limited
      if (rc === 1 || rc === 2) { amount = Math.max(5, Math.floor(amount * 0.6)); await sleep(5200); noNew++; continue; } // asked too many -> shrink
      if (rc !== 0) { await sleep(5200); noNew++; continue; }
      let added = 0;
      for (const r of data.results || []) {
        const q = dec(r.question);
        if (seen.has(q)) continue;
        const correct = dec(r.correct_answer);
        const incorrect = (r.incorrect_answers || []).map(dec);
        const options = shuffle([correct, ...incorrect]);
        const correctIndex = options.indexOf(correct);
        if (correctIndex < 0 || options.length < 4) continue;
        const level = ["easy", "medium", "hard"].includes(r.difficulty) ? r.difficulty : "medium";
        const cfg = LEVEL_CONFIG[level];
        seen.add(q);
        docs.push({
          category: cat.name, question: q, options, correctIndex,
          correctAnswer: correct, mediaUrl: "", mediaType: "text",
          level, xpReward: cfg.xp, timeLimit: cfg.time,
        });
        added++;
      }
      noNew = added ? 0 : noNew + 1;
      await sleep(5200);
    }
    if (docs.length) { await Question.insertMany(docs); grand += docs.length; }
    const byLvl = docs.reduce((a, d) => (a[d.level]++, a), { easy: 0, medium: 0, hard: 0 });
    console.log(`= ${cat.name}: ${docs.length}/${total} (e/m/h ${byLvl.easy}/${byLvl.medium}/${byLvl.hard})`);
  }
  console.log(`\nDone. Imported ${grand} questions across ${CATEGORIES.length} categories.`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
