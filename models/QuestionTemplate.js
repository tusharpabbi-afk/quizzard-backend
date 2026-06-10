const mongoose = require("mongoose");

const QuestionTemplateSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, trim: true, index: true },
    targetCategory: { type: String, default: "" },
    templateString: { type: String, required: true },
    attributeToTarget: { type: [String], default: [] },
    // Whether the correct answer is one of the entity's attributes or its name (e.g. flag questions).
    answerType: {
      type: String,
      enum: ["attribute", "name"],
      default: "attribute",
    },
    // How wrong options are chosen, to keep them "close"/competitive. See services/generator.js.
    distractorStrategy: {
      type: String,
      enum: [
        "globalAttribute",
        "sameGroupAttribute",
        "sameEntityList",
        "sameGroupName",
        "globalName",
      ],
      default: "globalAttribute",
    },
    // Attribute used to group entities for sameGroup* strategies (e.g. "subregion", "continent").
    groupBy: { type: String, default: "" },
    // Attribute holding the candidate list for the sameEntityList strategy (e.g. "major_cities").
    listAttribute: { type: String, default: "" },
    // For answerType:"name" reverse questions, the attribute whose value fills {{attribute}}
    // in the prompt (e.g. "capital" for "{{attribute}} is the capital of which country?").
    displayAttribute: { type: String, default: "" },
    // Attach the entity's media (e.g. flag image) to the generated question.
    useMedia: { type: Boolean, default: false },
    level: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuestionTemplate", QuestionTemplateSchema);
