const Question = require("../models/Question");
const QuestionTemplate = require("../models/QuestionTemplate");
const { buildDefaultTemplatesForCategory } = require("../templates/defaultTemplates");

const LEVEL_CONFIG = {
  easy: { xp: 20, time: 12 },
  medium: { xp: 40, time: 10 },
  hard: { xp: 80, time: 8 },
};

// How many wrong options each question gets (4 options total).
const DISTRACTOR_COUNT = 3;

function sampleUnique(list, count, excludeSet = new Set()) {
  const pool = list.filter((item) => !excludeSet.has(item));
  const result = [];
  while (pool.length && result.length < count) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

function buildQuestionText(template, entity, attributeValue) {
  return template.templateString
    .replace(/\{\{name\}\}/g, entity.name)
    .replace(/\{\{attribute\}\}/g, String(attributeValue));
}

async function ensureTemplates(category, attributeKeys) {
  const existing = await QuestionTemplate.find({ category }).lean();
  if (existing.length) return existing;
  const defaults = buildDefaultTemplatesForCategory(category, attributeKeys);
  await QuestionTemplate.insertMany(defaults);
  return defaults;
}

function attrValue(entity, key) {
  const v = entity.attributes?.[key];
  return v == null || v === "" ? null : String(v);
}

/**
 * Collect a pool of plausible wrong-answer strings for one question.
 * The strategy decides HOW close those wrong answers are:
 *  - sameEntityList   : other items in a list on the SAME entity (e.g. other cities in the same country)
 *  - sameGroupAttribute: the same attribute, but only from entities in the same group (e.g. same-subregion capitals)
 *  - sameGroupName    : names of entities in the same group (e.g. other Asian country names, for flags)
 *  - globalAttribute  : the same attribute across all entities (the loose default)
 *  - globalName       : names of all other entities
 * sameGroup* strategies fall back to their global equivalent if a group is too small to fill 4 options.
 */
function collectDistractors({ template, entity, entities, correctAnswer }) {
  const strategy = template.distractorStrategy || "globalAttribute";
  const attrKey = Array.isArray(template.attributeToTarget)
    ? template.attributeToTarget[0]
    : template.attributeToTarget;

  const fromAttribute = (pool) =>
    pool.map((e) => attrValue(e, attrKey)).filter((v) => v != null);
  const fromName = (pool) => pool.map((e) => e.name).filter(Boolean);

  const others = entities.filter((e) => e !== entity);
  const sameGroup = (groupBy) => {
    const key = entity.attributes?.[groupBy];
    if (key == null || key === "") return [];
    return others.filter((e) => e.attributes?.[groupBy] === key);
  };

  let candidates = [];
  switch (strategy) {
    case "sameEntityList": {
      const list = entity.attributes?.[template.listAttribute];
      candidates = Array.isArray(list) ? list.map(String) : [];
      break;
    }
    case "sameGroupAttribute": {
      candidates = fromAttribute(sameGroup(template.groupBy));
      if (candidates.length < DISTRACTOR_COUNT) {
        candidates = candidates.concat(fromAttribute(others)); // fall back to global
      }
      break;
    }
    case "sameGroupName": {
      candidates = fromName(sameGroup(template.groupBy));
      if (candidates.length < DISTRACTOR_COUNT) {
        candidates = candidates.concat(fromName(others));
      }
      break;
    }
    case "globalName":
      candidates = fromName(others);
      break;
    case "globalAttribute":
    default:
      candidates = fromAttribute(others);
      break;
  }

  // Drop the correct answer and any blanks; keep unique strings.
  const seen = new Set([String(correctAnswer)]);
  const unique = [];
  for (const c of candidates) {
    const s = String(c);
    if (!s || seen.has(s)) continue;
    seen.add(s);
    unique.push(s);
  }
  return unique;
}

async function generateQuestionsFromEntities({ category, entities, replaceExisting = true, limit = 5000 }) {
  if (!entities.length) return { created: 0, skipped: 0 };
  const attributeKeys = Object.keys(entities[0].attributes || {});
  const templates = await ensureTemplates(category, attributeKeys);

  if (replaceExisting) {
    const targetCategories = new Set(
      templates.map((t) => (t.targetCategory || t.category || category).toString())
    );
    await Question.deleteMany({ category: { $in: Array.from(targetCategories) } });
  }

  const questionsToInsert = [];
  let skipped = 0;
  const usedSignatures = new Set();

  for (const entity of entities) {
    if (questionsToInsert.length >= limit) break;
    for (const template of templates) {
      if (questionsToInsert.length >= limit) break;

      const answerType = template.answerType || "attribute";
      const attrKey = Array.isArray(template.attributeToTarget)
        ? template.attributeToTarget[0]
        : template.attributeToTarget;

      // The correct answer is either the entity's name or one of its attributes.
      const correctAnswer = answerType === "name" ? entity.name : attrValue(entity, attrKey);
      if (correctAnswer == null) {
        skipped++;
        continue;
      }

      // What fills {{attribute}} in the prompt. For reverse (name-answer) questions this is a
      // separate display attribute (e.g. the capital); otherwise it's the answer value itself.
      let displayValue = correctAnswer;
      if (template.displayAttribute) {
        displayValue = attrValue(entity, template.displayAttribute);
        if (displayValue == null) {
          skipped++;
          continue;
        }
      }
      const questionText = buildQuestionText(template, entity, displayValue);

      const distractors = collectDistractors({ template, entity, entities, correctAnswer });
      const chosen = sampleUnique(distractors, DISTRACTOR_COUNT);
      if (chosen.length < DISTRACTOR_COUNT) {
        skipped++;
        continue;
      }

      const options = sampleUnique([correctAnswer, ...chosen], DISTRACTOR_COUNT + 1);
      const correctIndex = options.findIndex((opt) => opt === correctAnswer);
      if (correctIndex < 0 || options.length < DISTRACTOR_COUNT + 1) {
        skipped++;
        continue;
      }

      const signature = `${template.level}|${questionText}|${correctAnswer}|${options.join("|")}`;
      if (usedSignatures.has(signature)) {
        skipped++;
        continue;
      }
      usedSignatures.add(signature);

      const levelConfig = LEVEL_CONFIG[template.level] || LEVEL_CONFIG.easy;
      const useMedia = template.useMedia && entity.mediaUrl;
      questionsToInsert.push({
        category: (template.targetCategory || template.category || category).toString(),
        question: questionText,
        options,
        correctIndex,
        correctAnswer,
        mediaUrl: useMedia ? entity.mediaUrl : "",
        mediaType: useMedia ? entity.mediaType || "image" : "text",
        level: template.level,
        xpReward: levelConfig.xp,
        timeLimit: levelConfig.time,
      });
    }
  }

  if (questionsToInsert.length) {
    await Question.insertMany(questionsToInsert);
  }

  return { created: questionsToInsert.length, skipped };
}

module.exports = { generateQuestionsFromEntities };
