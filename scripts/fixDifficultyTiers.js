/**
 * Fixes the "same question in easy/medium/hard" problem for the GENERATED
 * categories, where every prompt was cloned across all three levels.
 *
 * Strategy: each underlying entity (a country, or a personality/clip) is kept
 * at exactly ONE difficulty. Country-based categories use population as the
 * signal — most populous third => easy, middle => medium, least => hard, so
 * famous countries land in easy and obscure ones in hard. Categories with no
 * such signal (personalities, clips) are split deterministically so the three
 * modes are at least distinct.
 *
 * Run: MONGO_URI="<atlas>" node scripts/fixDifficultyTiers.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("../models/Question");
const Entity = require("../models/Entity");

const COUNTRY_CATEGORIES = ["Capitals", "Currencies", "Continents", "Find the Country", "Largest Cities", "Flags", "Anthems"];
const OTHER_CATEGORIES = ["Bollywood", "Hollywood", "Sports", "Nature Clips"]; // personalities / clips

const LEVELS = ["easy", "medium", "hard"];

function hashTier(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return LEVELS[h % 3];
}

async function fixGroup(category, keyFn, tierFn) {
  const docs = await Question.find({ category }).lean();
  if (!docs.length) return;
  // group by entity key
  const groups = new Map();
  for (const d of docs) {
    const k = keyFn(d);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(d);
  }
  const keepIds = [];
  const relabel = []; // {id, level}
  for (const [k, arr] of groups) {
    const tier = tierFn(k, arr);
    let keeper = arr.find((d) => d.level === tier) || arr[0];
    keepIds.push(keeper._id);
    if (keeper.level !== tier) relabel.push({ id: keeper._id, level: tier });
  }
  // delete everything in this category not kept
  const del = await Question.deleteMany({ category, _id: { $nin: keepIds } });
  for (const r of relabel) {
    await Question.updateOne({ _id: r.id }, { $set: { level: r.level, xpReward: r.level === "easy" ? 20 : r.level === "medium" ? 40 : 80, timeLimit: r.level === "easy" ? 12 : r.level === "medium" ? 10 : 8 } });
  }
  const after = await Question.aggregate([{ $match: { category } }, { $group: { _id: "$level", n: { $sum: 1 } } }]);
  const m = Object.fromEntries(after.map((x) => [x._id, x.n]));
  console.log(`= ${category}: kept ${keepIds.length} (deleted ${del.deletedCount}) -> e/m/h ${m.easy || 0}/${m.medium || 0}/${m.hard || 0}`);
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Build country -> population tier.
  const countries = await Entity.find({ category: "Countries" }, { name: 1, "attributes.population": 1, "attributes.capital": 1 }).lean();
  countries.sort((a, b) => (b.attributes?.population || 0) - (a.attributes?.population || 0));
  const third = Math.ceil(countries.length / 3);
  const tierByCountry = new Map();
  countries.forEach((c, i) => tierByCountry.set(c.name, i < third ? "easy" : i < 2 * third ? "medium" : "hard"));
  const countryNames = countries.map((c) => c.name).sort((a, b) => b.length - a.length); // longest first
  const countrySet = new Set(countryNames);

  // Detect the country a question is about: answer-is-country, else longest country name in the prompt.
  function countryOf(d) {
    const ans = String(d.correctAnswer || "").trim();
    if (countrySet.has(ans)) return ans;
    const q = String(d.question || "");
    for (const name of countryNames) if (q.includes(name)) return name;
    return null;
  }

  for (const cat of COUNTRY_CATEGORIES) {
    await fixGroup(
      cat,
      (d) => countryOf(d) || ("?" + (d.correctAnswer || d.question || "")),
      (key) => tierByCountry.get(key) || hashTier(String(key)),
    );
  }
  for (const cat of OTHER_CATEGORIES) {
    // group by the media item / personality (correctAnswer + mediaUrl), split deterministically
    await fixGroup(
      cat,
      (d) => (d.correctAnswer || "") + "|" + (d.mediaUrl || d.question || ""),
      (key) => hashTier(String(key)),
    );
  }

  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
