// backend/models/GradingLevel.js
const mongoose = require("mongoose");

const gradingLevelSchema = new mongoose.Schema(
  {
    levels: [
      {
        name: { type: String, required: true }, // "Bronze Volunteer", "Silver Volunteer", etc.
        tier: { type: String, required: true }, // "Bronze", "Silver", "Gold", "Platinum"
        minPoints: { type: Number, required: true },
        color: { type: String, default: "#CD7F32" },
        icon: { type: String, default: "Award" },
        description: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.GradingLevel ||
  mongoose.model("GradingLevel", gradingLevelSchema);
