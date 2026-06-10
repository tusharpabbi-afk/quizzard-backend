/**
 * Shared helper for hand-curated seed scripts. Each "raw" question is
 * { q, correct, wrong: [..3], level } and gets turned into a Question doc with
 * shuffled options + computed correctIndex. Levels are author-assigned so
 * easy/medium/hard are genuinely different question sets.
 */
const CFG = { easy: { xp: 20, time: 12 }, medium: { xp: 40, time: 10 }, hard: { xp: 80, time: 8 } };

function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function build(category, raw) {
  const out = [];
  const seen = new Set();
  for (const r of raw) {
    const q = (r.q || "").trim();
    if (!q || seen.has(q)) continue;            // dedup by prompt
    if (!r.correct || !Array.isArray(r.wrong) || r.wrong.length < 3) continue;
    const level = ["easy", "medium", "hard"].includes(r.level) ? r.level : "medium";
    const options = shuffle([r.correct, ...r.wrong.slice(0, 3)]);
    const correctIndex = options.indexOf(r.correct);
    if (correctIndex < 0) continue;
    // reject accidental duplicate options
    const lower = options.map((o) => String(o).trim().toLowerCase());
    if (new Set(lower).size !== lower.length) continue;
    seen.add(q);
    out.push({
      category, question: q, options, correctIndex, correctAnswer: r.correct,
      mediaUrl: "", mediaType: "text", level, xpReward: CFG[level].xp, timeLimit: CFG[level].time,
    });
  }
  return out;
}

/** Connect, replace one category's questions with the built set, report by level. */
async function seedCategory(mongoose, Question, category, raw) {
  const docs = build(category, raw);
  await Question.deleteMany({ category });
  if (docs.length) await Question.insertMany(docs);
  const byLvl = docs.reduce((a, d) => (a[d.level]++, a), { easy: 0, medium: 0, hard: 0 });
  console.log(`= ${category}: ${docs.length} (e/m/h ${byLvl.easy}/${byLvl.medium}/${byLvl.hard})`);
  return docs.length;
}

module.exports = { build, seedCategory, CFG };
