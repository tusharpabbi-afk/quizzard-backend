/**
 * Wipes all generated content (entities, templates, questions) from MongoDB so
 * you can re-seed from scratch. Run with: node scripts/resetContent.js
 * Does NOT touch Firebase (users/auth live there).
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Entity = require("../models/Entity");
const Question = require("../models/Question");
const QuestionTemplate = require("../models/QuestionTemplate");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const [e, t, q] = await Promise.all([
    Entity.deleteMany({}),
    QuestionTemplate.deleteMany({}),
    Question.deleteMany({}),
  ]);
  console.log(`Cleared entities=${e.deletedCount} templates=${t.deletedCount} questions=${q.deletedCount}`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
