// backend/models/Badge.js
const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    name:              { type: String, required: true, trim: true },
    slug:              { type: String, unique: true },
    description:       { type: String, default: "" },
    icon:              { type: String, default: "Award" }, // Lucide icon or image URL
    imageUrl:          { type: String, default: "" },
    category:          { type: String, enum: ["Milestone", "Hours", "Impact", "Leadership", "Special"], default: "Milestone" },
    eligibilityCriteria: { type: String, default: "" },
    pointsThreshold:   { type: Number, default: 0 },
    hoursThreshold:    { type: Number, default: 0 },
    eventsThreshold:   { type: Number, default: 0 },
    tierColor:         { type: String, default: "#EAB308" },
    isActive:          { type: Boolean, default: true },
    isSystemDefault:   { type: Boolean, default: false },
    displayOrder:      { type: Number, default: 0 },
  },
  { timestamps: true }
);

badgeSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  next();
});

module.exports = mongoose.models.Badge || mongoose.model("Badge", badgeSchema);
