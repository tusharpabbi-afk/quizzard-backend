// Competitive question templates for every quiz category. Each "question definition" is
// expanded into easy/medium/hard variants. Difficulty is mainly how CLOSE the wrong answers are:
//   easy   -> distractors from anywhere (obvious)
//   medium -> same continent / same pool
//   hard   -> same subregion (very confusable)
// Question count and timer per level are applied elsewhere (app picks 10/12/15).

const LEVELS = ["easy", "medium", "hard"];

const sameAllLevels = (strategy) => ({
  easy: { distractorStrategy: strategy },
  medium: { distractorStrategy: strategy },
  hard: { distractorStrategy: strategy },
});

const COUNTRY_QUESTIONS = [
  {
    targetCategory: "Capitals",
    templateString: "What is the capital of {{name}}?",
    answerType: "attribute",
    attributeToTarget: ["capital"],
    byLevel: {
      easy: { distractorStrategy: "globalAttribute" },
      medium: { distractorStrategy: "sameGroupAttribute", groupBy: "continent" },
      hard: { distractorStrategy: "sameGroupAttribute", groupBy: "subregion" },
    },
  },
  {
    targetCategory: "Currencies",
    templateString: "What is the official currency of {{name}}?",
    answerType: "attribute",
    attributeToTarget: ["currency"],
    byLevel: {
      easy: { distractorStrategy: "globalAttribute" },
      medium: { distractorStrategy: "sameGroupAttribute", groupBy: "continent" },
      hard: { distractorStrategy: "sameGroupAttribute", groupBy: "subregion" },
    },
  },
  {
    targetCategory: "Flags",
    templateString: "Which country does this flag belong to?",
    answerType: "name",
    attributeToTarget: [],
    useMedia: true,
    byLevel: {
      easy: { distractorStrategy: "globalName" },
      medium: { distractorStrategy: "sameGroupName", groupBy: "continent" },
      hard: { distractorStrategy: "sameGroupName", groupBy: "subregion" },
    },
  },
  {
    targetCategory: "Find the Country",
    templateString: "{{attribute}} is the capital of which country?",
    answerType: "name",
    attributeToTarget: [],
    displayAttribute: "capital",
    byLevel: {
      easy: { distractorStrategy: "globalName" },
      medium: { distractorStrategy: "sameGroupName", groupBy: "continent" },
      hard: { distractorStrategy: "sameGroupName", groupBy: "subregion" },
    },
  },
  {
    targetCategory: "Largest Cities",
    templateString: "What is the largest city in {{name}}?",
    answerType: "attribute",
    attributeToTarget: ["largest_city"],
    listAttribute: "major_cities",
    byLevel: sameAllLevels("sameEntityList"),
  },
  {
    targetCategory: "Continents",
    templateString: "Which continent is {{name}} located in?",
    answerType: "attribute",
    attributeToTarget: ["continent"],
    byLevel: sameAllLevels("globalAttribute"),
  },
];

// "Who is this?" photo questions. Distractors are other people in the same category.
const personalityQuestions = (category) => [
  {
    targetCategory: category,
    templateString: "Who is this personality?",
    answerType: "name",
    attributeToTarget: [],
    useMedia: true,
    byLevel: sameAllLevels("globalName"),
  },
];

const MOVIE_QUESTIONS = [
  {
    targetCategory: "Movies",
    templateString: "Who directed the film {{name}}?",
    answerType: "attribute",
    attributeToTarget: ["director"],
    byLevel: sameAllLevels("globalAttribute"),
  },
  {
    targetCategory: "Movies",
    templateString: "In which year was {{name}} released?",
    answerType: "attribute",
    attributeToTarget: ["year"],
    byLevel: sameAllLevels("globalAttribute"),
  },
];

const HISTORY_QUESTIONS = [
  {
    targetCategory: "History",
    templateString: "In which year did {{name}}?",
    answerType: "attribute",
    attributeToTarget: ["year"],
    byLevel: sameAllLevels("globalAttribute"),
  },
];

const FINANCE_QUESTIONS = [
  {
    targetCategory: "Finance",
    templateString: "Who founded {{name}}?",
    answerType: "attribute",
    attributeToTarget: ["founder"],
    byLevel: sameAllLevels("globalAttribute"),
  },
];

const ANTHEM_QUESTIONS = [
  {
    targetCategory: "Anthems",
    templateString: "Which country's national anthem is this?",
    answerType: "name",
    attributeToTarget: [],
    useMedia: true,
    byLevel: {
      easy: { distractorStrategy: "globalName" },
      medium: { distractorStrategy: "sameGroupName", groupBy: "continent" },
      hard: { distractorStrategy: "sameGroupName", groupBy: "continent" },
    },
  },
];

const CLIP_QUESTIONS = [
  {
    targetCategory: "Nature Clips",
    templateString: "Which animal is shown in this clip?",
    answerType: "name",
    attributeToTarget: [],
    useMedia: true,
    byLevel: sameAllLevels("globalName"),
  },
];

function expand(defs) {
  const out = [];
  for (const q of defs) {
    for (const level of LEVELS) {
      const cfg = q.byLevel[level];
      out.push({
        targetCategory: q.targetCategory,
        templateString: q.templateString,
        answerType: q.answerType || "attribute",
        attributeToTarget: q.attributeToTarget || [],
        displayAttribute: q.displayAttribute || "",
        distractorStrategy: cfg.distractorStrategy,
        groupBy: cfg.groupBy || "",
        listAttribute: q.listAttribute || "",
        useMedia: q.useMedia || false,
        level,
      });
    }
  }
  return out;
}

const seedSets = {
  Countries: expand(COUNTRY_QUESTIONS),
  Bollywood: expand(personalityQuestions("Bollywood")),
  Hollywood: expand(personalityQuestions("Hollywood")),
  Sports: expand(personalityQuestions("Sports")),
  Movies: expand(MOVIE_QUESTIONS),
  History: expand(HISTORY_QUESTIONS),
  Finance: expand(FINANCE_QUESTIONS),
  Anthems: expand(ANTHEM_QUESTIONS),
  "Nature Clips": expand(CLIP_QUESTIONS),
};

module.exports = { seedSets };
