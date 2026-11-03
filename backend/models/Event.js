// backend/models/Event.js
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title:            { type: String, required: true, trim: true },
    category:         { type: String, required: true },
    categorySlug:     { type: String },
    organizer:        { type: String, default: "Maatram Foundation" },
    mode:             { type: String, enum: ["Online", "Offline", "Hybrid"], default: "Offline" },
    date:             { type: String, required: true },
    time:             { type: String, default: "" },
    durationHours:    { type: Number, default: 4 },
    points:           { type: Number, default: 50 }, // Points allocated for this event
    pointsDistributed:{ type: Boolean, default: false },
    location:         { type: String, default: "" },
    volunteersNeeded: { type: Number, default: 10 },
    slotsAvailable:   { type: Number, default: 10 },
    deadline:         { type: String, default: "" },
    image:            { type: String, default: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1000&q=80" },
    description:      { type: String, default: "" },
    objectives:       { type: [String], default: [] },
    responsibilities: { type: [String], default: [] },
    skills:           { type: String, default: "" },
    eligibility:      { type: String, default: "Open to all college student volunteers." },
    contactEmail:     { type: String, default: "coordinator@maatramfoundation.com" },
    featured:         { type: Boolean, default: false },
    isActive:         { type: Boolean, default: true },
    eventStatus:      { type: String, enum: ["Upcoming", "Ongoing", "Completed"], default: "Upcoming" },
    slots:            [
      {
        slotId: { type: String },
        title: { type: String },
        time: { type: String },
        capacity: { type: Number, default: 10 },
        filled: { type: Number, default: 0 },
      }
    ],
    postedBy:         { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Auto-set categorySlug
eventSchema.pre("save", function (next) {
  const slugMap = {
    "Sangamam": "sangamam",
    "School Visits": "school-visits",
    "Outside Events": "outside-events",
    "Karpom Karpipom": "karpom-karpipom",
    "Maatram Opportunities": "maatram",
  };
  this.categorySlug = slugMap[this.category] || this.category.toLowerCase().replace(/ /g, "-");
  next();
});

module.exports = mongoose.models.Event || mongoose.model("Event", eventSchema);
