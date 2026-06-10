console.log("🔥 Quizzard backend is running 🔥");

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const { parse } = require("csv-parse/sync");

const Entity = require("./models/Entity");
const Question = require("./models/Question");
const QuestionTemplate = require("./models/QuestionTemplate");
const { generateQuestionsFromEntities } = require("./services/generator");
const { seedSets } = require("./templates/seedSets");
const { countryEntities } = require("./templates/seedEntities");
const { personalityEntities } = require("./templates/seedPersonalities");
const { triviaEntities } = require("./templates/seedTrivia");
const { anthemEntities, clipEntities } = require("./templates/seedMedia");
const { categoryMeta } = require("./templates/categoryMeta");

const app = express();
const PORT = process.env.PORT || 5050;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error", err));

app.get("/", (req, res) => {
  res.send("Quizzard Backend LIVE 🚀");
});

app.post("/admin/entities/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "CSV file missing" });
    }
    const csvText = req.file.buffer.toString("utf-8");
    const records = parse(csvText, { columns: true, skip_empty_lines: true, trim: true });
    if (!records.length) {
      return res.status(400).json({ error: "CSV is empty" });
    }

    const attributeKeys = Object.keys(records[0]).filter(
      (k) => !["category", "name", "mediaUrl", "mediaType"].includes(k)
    );
    const categoriesTouched = new Set();
    const ops = [];
    for (const row of records) {
      const category = (row.category || "").trim();
      const name = (row.name || "").trim();
      if (!category || !name) continue;
      categoriesTouched.add(category);
      const attributes = {};
      for (const key of attributeKeys) {
        if (row[key] != null && row[key] !== "") {
          attributes[key] = row[key];
        }
      }
      const mediaType = (row.mediaType || "text").toLowerCase();
      ops.push({
        updateOne: {
          filter: { category, name },
          update: {
            $set: {
              category,
              name,
              attributes,
              mediaUrl: row.mediaUrl || "",
              mediaType,
            },
          },
          upsert: true,
        },
      });
    }
    if (ops.length) {
      await Entity.bulkWrite(ops);
    }

    let generated = 0;
    let skipped = 0;
    for (const category of categoriesTouched) {
      const entities = await Entity.find({ category }).lean();
      const result = await generateQuestionsFromEntities({
        category,
        entities,
        replaceExisting: true,
        limit: 5000,
      });
      generated += result.created;
      skipped += result.skipped;
    }

    return res.json({
      insertedEntities: ops.length,
      categories: Array.from(categoriesTouched),
      questionsGenerated: generated,
      skipped,
    });
  } catch (err) {
    console.error("❌ Entity upload failed", err);
    return res.status(500).json({ error: "Failed to upload entities" });
  }
});

app.get("/admin/templates", async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const templates = await QuestionTemplate.find(query).lean();
    return res.json({ templates });
  } catch (err) {
    console.error("❌ Fetch templates failed", err);
    return res.status(500).json({ error: "Failed to fetch templates" });
  }
});

app.post("/admin/templates", async (req, res) => {
  try {
    const { category, templateString, attributeToTarget, level, targetCategory } = req.body || {};
    if (!category || !templateString) {
      return res.status(400).json({ error: "category and templateString are required" });
    }
    const targets = Array.isArray(attributeToTarget)
      ? attributeToTarget
      : String(attributeToTarget || "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
    if (!targets.length) {
      return res.status(400).json({ error: "attributeToTarget is required" });
    }
    const doc = await QuestionTemplate.create({
      category,
      targetCategory: targetCategory || "",
      templateString,
      attributeToTarget: targets,
      level: level || "easy",
    });
    return res.status(201).json({ template: doc });
  } catch (err) {
    console.error("❌ Create template failed", err);
    return res.status(500).json({ error: "Failed to create template" });
  }
});

app.delete("/admin/templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await QuestionTemplate.findByIdAndDelete(id);
    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ Delete template failed", err);
    return res.status(500).json({ error: "Failed to delete template" });
  }
});

app.post("/admin/templates/seed", async (req, res) => {
  try {
    const { categories } = req.body || {};
    const targetCategories = Array.isArray(categories) && categories.length
      ? categories
      : Object.keys(seedSets);
    let inserted = 0;
    let skipped = 0;
    const ops = [];

    for (const category of targetCategories) {
      const seeds = seedSets[category];
      if (!seeds) continue;
      for (const template of seeds) {
        ops.push({
          updateOne: {
            filter: {
              category,
              templateString: template.templateString,
              level: template.level,
              targetCategory: template.targetCategory,
            },
            update: {
              $setOnInsert: {
                category,
                targetCategory: template.targetCategory,
                templateString: template.templateString,
                attributeToTarget: template.attributeToTarget,
                answerType: template.answerType || "attribute",
                distractorStrategy: template.distractorStrategy || "globalAttribute",
                groupBy: template.groupBy || "",
                listAttribute: template.listAttribute || "",
                displayAttribute: template.displayAttribute || "",
                useMedia: template.useMedia || false,
                level: template.level,
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (ops.length) {
      const result = await QuestionTemplate.bulkWrite(ops);
      inserted = result.upsertedCount || 0;
      skipped = ops.length - inserted;
    }

    return res.json({ inserted, skipped });
  } catch (err) {
    console.error("❌ Seed templates failed", err);
    return res.status(500).json({ error: "Failed to seed templates" });
  }
});

app.post("/admin/entities/seed", async (req, res) => {
  try {
    const { category } = req.body || {};
    if (category && category !== "Countries") {
      return res.status(400).json({ error: "Only Countries seed is available right now." });
    }
    const ops = countryEntities.map((entity) => ({
      updateOne: {
        filter: { category: entity.category, name: entity.name },
        update: { $set: entity },
        upsert: true,
      },
    }));
    await Entity.bulkWrite(ops);
    const entities = await Entity.find({ category: "Countries" }).lean();
    const result = await generateQuestionsFromEntities({
      category: "Countries",
      entities,
      replaceExisting: true,
      limit: 5000,
    });
    return res.json({
      insertedEntities: ops.length,
      questionsGenerated: result.created,
      skipped: result.skipped,
    });
  } catch (err) {
    console.error("❌ Seed entities failed", err);
    return res.status(500).json({ error: "Failed to seed entities" });
  }
});

// Seeds every category's templates + entities (countries, personalities, trivia) and
// regenerates all questions. One call to set up the whole game from scratch.
app.post("/admin/seed-all", async (req, res) => {
  try {
    const tplOps = [];
    for (const category of Object.keys(seedSets)) {
      for (const template of seedSets[category]) {
        tplOps.push({
          updateOne: {
            filter: {
              category,
              templateString: template.templateString,
              level: template.level,
              targetCategory: template.targetCategory,
            },
            update: {
              $setOnInsert: {
                category,
                targetCategory: template.targetCategory,
                templateString: template.templateString,
                attributeToTarget: template.attributeToTarget,
                answerType: template.answerType || "attribute",
                distractorStrategy: template.distractorStrategy || "globalAttribute",
                groupBy: template.groupBy || "",
                listAttribute: template.listAttribute || "",
                displayAttribute: template.displayAttribute || "",
                useMedia: template.useMedia || false,
                level: template.level,
              },
            },
            upsert: true,
          },
        });
      }
    }
    if (tplOps.length) await QuestionTemplate.bulkWrite(tplOps);

    const allEntities = [
      ...countryEntities,
      ...personalityEntities,
      ...triviaEntities,
      ...anthemEntities,
      ...clipEntities,
    ];
    const byCategory = {};
    for (const e of allEntities) (byCategory[e.category] ||= []).push(e);

    const summary = {};
    for (const category of Object.keys(byCategory)) {
      const ops = byCategory[category].map((entity) => ({
        updateOne: {
          filter: { category: entity.category, name: entity.name },
          update: { $set: entity },
          upsert: true,
        },
      }));
      if (ops.length) await Entity.bulkWrite(ops);
      const stored = await Entity.find({ category }).lean();
      const result = await generateQuestionsFromEntities({
        category,
        entities: stored,
        replaceExisting: true,
        limit: 5000,
      });
      summary[category] = {
        entities: byCategory[category].length,
        questions: result.created,
        skipped: result.skipped,
      };
    }
    return res.json({ ok: true, summary });
  } catch (err) {
    console.error("❌ seed-all failed", err);
    return res.status(500).json({ error: "Failed to seed all" });
  }
});

function mapQuestion(q) {
  return {
    id: q._id.toString(),
    category: q.category,
    level: q.level,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    mediaUrl: q.mediaUrl,
    mediaType: q.mediaType,
    xpReward: q.xpReward,
    timeLimit: q.timeLimit,
  };
}

// Builds the $match, optionally excluding already-seen question ids.
function buildQuestionMatch({ category, level, exclude }) {
  const match = {};
  if (category) match.category = category;
  if (level) match.level = level;
  if (Array.isArray(exclude) && exclude.length) {
    const ids = exclude
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    if (ids.length) match._id = { $nin: ids };
  }
  return match;
}

// POST variant: accepts { category, level, limit, exclude:[ids] } so the client
// can request questions it hasn't seen yet (avoids repeats until exhausted).
app.post("/api/questions", async (req, res) => {
  try {
    const { category, level, limit = 10, exclude = [] } = req.body || {};
    const match = buildQuestionMatch({ category, level, exclude });
    const docs = await Question.aggregate([{ $match: match }, { $sample: { size: Number(limit) } }]);
    return res.json({ questions: docs.map(mapQuestion) });
  } catch (err) {
    console.error("❌ Fetch questions (post) failed", err);
    return res.status(500).json({ error: "Failed to fetch questions" });
  }
});

app.get("/api/questions", async (req, res) => {
  try {
    const { category, level, limit = 10 } = req.query;
    const match = buildQuestionMatch({ category, level });
    const docs = await Question.aggregate([
      { $match: match },
      { $sample: { size: Number(limit) } },
    ]);
    return res.json({ questions: docs.map(mapQuestion) });
  } catch (err) {
    console.error("❌ Fetch questions failed", err);
    return res.status(500).json({ error: "Failed to fetch questions" });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const names = await Question.distinct("category");
    const categories = names
      .map((name) => ({
        name,
        imageUrl: categoryMeta[name]?.imageUrl || "",
        order: categoryMeta[name]?.order ?? 99,
      }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    return res.json({ categories });
  } catch (err) {
    console.error("❌ Fetch categories failed", err);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
