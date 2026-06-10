const mongoose = require("mongoose");

const EntitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    mediaUrl: { type: String, default: "" },
    mediaType: {
      type: String,
      enum: ["text", "image", "audio", "video"],
      default: "text",
    },
  },
  { timestamps: true }
);

EntitySchema.index({ category: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Entity", EntitySchema);
