// backend/models/HourLog.js
const mongoose = require("mongoose");

const hourLogSchema = new mongoose.Schema(
  {
    volunteerId:        { type: mongoose.Schema.Types.Mixed, required: true },
    volunteerName:      { type: String, required: true },
    volunteerEmail:     { type: String, default: "" },
    volunteerRole:      { type: String, enum: ["student", "alumni"], default: "student" },
    college:            { type: String, default: "" },
    department:         { type: String, default: "" },
    eventId:            { type: mongoose.Schema.Types.Mixed },
    eventTitle:         { type: String, required: true },
    eventCategory:      { type: String, default: "School Visits" },
    participationDate:  { type: String, required: true },
    submittedHours:     { type: Number, required: true, min: 0.5 },
    verifiedHours:      { type: Number, default: 0 },
    pointsAwarded:      { type: Number, default: 0 },
    evidenceRemarks:    { type: String, default: "" },
    evidenceUrl:        { type: String, default: "" },
    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected", "Correction Requested"],
      default: "Pending",
    },
    adminRemarks:       { type: String, default: "" },
    verifiedBy:         { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedByName:     { type: String, default: "" },
    verifiedAt:         { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.models.HourLog || mongoose.model("HourLog", hourLogSchema);
