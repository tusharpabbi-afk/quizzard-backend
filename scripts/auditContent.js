// Content health check for the quiz database.
// Usage: node scripts/auditContent.js
// Reports counts, structural errors, answer-index mismatches, TRUE duplicates
// (keyed on category+level+prompt+media+answer+options so per-level variants and
// distinct-media questions are NOT counted as dupes), and media completeness.
require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../models/Question');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/quizzard');
  const all = await Question.find({}).lean();

  let badIndex = 0, dupOpts = 0, blankOpts = 0, fewOpts = 0, missingQ = 0, mismatch = 0;
  const trueSeen = new Map();
  const trueDup = {};
  const perCat = {};
  for (const q of all) {
    const cat = q.category;
    perCat[cat] = (perCat[cat] || 0) + 1;
    const opts = (q.options || []).map((o) => String(o));
    const text = (q.question || '').trim();
    if (!text) missingQ++;
    if (opts.length < 2) fewOpts++;
    if (opts.some((o) => !o.trim())) blankOpts++;
    const lower = opts.map((o) => o.trim().toLowerCase());
    if (new Set(lower).size !== lower.length) dupOpts++;
    if (q.correctIndex == null || q.correctIndex < 0 || q.correctIndex >= opts.length) badIndex++;
    else if (q.correctAnswer != null &&
      opts[q.correctIndex].trim().toLowerCase() !== String(q.correctAnswer).trim().toLowerCase()) mismatch++;

    const optKey = lower.slice().sort().join('|');
    const k = [cat, q.level, text.toLowerCase(), q.mediaUrl || '', String(q.correctAnswer).trim().toLowerCase(), optKey].join('@@');
    if (trueSeen.has(k)) trueDup[cat] = (trueDup[cat] || 0) + 1;
    trueSeen.set(k, true);
  }

  console.log('TOTAL questions:', all.length, '| categories:', Object.keys(perCat).length);
  console.log('\n=== STRUCTURAL ===');
  console.log('missingQ:', missingQ, 'fewOpts:', fewOpts, 'blankOpts:', blankOpts,
    'dupOptsInQuestion:', dupOpts, 'badIndex:', badIndex, 'index<>answer mismatch:', mismatch);

  const td = Object.entries(trueDup).sort((a, b) => b[1] - a[1]);
  console.log('\n=== TRUE DUPLICATES (category+level+prompt+media+answer+options) ===');
  if (!td.length) console.log('  none');
  else { td.forEach(([c, n]) => console.log('  ', String(n).padStart(4), c)); console.log('  TOTAL:', td.reduce((a, b) => a + b[1], 0)); }

  const media = await Question.aggregate([
    { $match: { mediaType: { $in: ['image', 'audio', 'video'] } } },
    { $group: { _id: '$category', total: { $sum: 1 },
        withMedia: { $sum: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$mediaUrl', ''] } }, 0] }, 1, 0] } } } },
    { $sort: { _id: 1 } },
  ]);
  console.log('\n=== MEDIA COMPLETENESS ===');
  media.forEach((c) => console.log('  ', String(c._id).padEnd(24),
    'has media', c.withMedia + '/' + c.total, c.withMedia < c.total ? '  <-- MISSING' : ''));

  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
