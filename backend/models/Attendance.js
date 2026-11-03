// backend/models/Attendance.js
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    eventId:       { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    slotId:        { type: String, default: "" },
    status:        { type: String, enum: ["Present", "Absent"], default: "Present" },
    markedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    markedByName:  { type: String, default: "Admin" },
    markedAt:      { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate attendance record for same event & user
attendanceSchema.index({ eventId: 1, userId: 1 }, { unique: true });

module.exports =
  mongoose.models.Attendance ||
  mongoose.model("Attendance", attendanceSchema);
