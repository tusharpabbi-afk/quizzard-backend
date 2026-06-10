const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, trim: true, index: true },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true },
    correctAnswer: { type: String, required: true },
    mediaUrl: { type: String, default: "" },
    mediaType: {
      type: String,
      enum: ["text", "image", "audio", "video"],
      default: "text",
    },
    level: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    xpReward: { type: Number, default: 20 },
    timeLimit: { type: Number, default: 12 },
  },
  { timestamps: true }
);

// Speeds up the per-mode quiz fetch (match on category+level before $sample).
QuestionSchema.index({ category: 1, level: 1 });

module.exports = mongoose.model("Question", QuestionSchema);
