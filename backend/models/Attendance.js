// backend/models/Attendance.js
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    eventId:          { type: mongoose.Schema.Types.Mixed, required: true },
    userId:           { type: mongoose.Schema.Types.Mixed, required: true },
    applicationId:    { type: mongoose.Schema.Types.Mixed },
    volunteerName:    { type: String, default: "" },
    volunteerEmail:   { type: String, default: "" },
    slotId:           { type: String, default: "" },
    status:           { type: String, enum: ["Present", "Absent", "Checked-In"], default: "Checked-In" },
    checkInMethod:    { type: String, enum: ["QR_SCAN", "MANUAL", "ADMIN_CONFIRMED"], default: "QR_SCAN" },
    checkInTime:      { type: Date, default: Date.now },
    isVerified:       { type: Boolean, default: false },
    verifiedHours:    { type: Number, default: 0 },
    pointsAwarded:    { type: Boolean, default: false },
    points:           { type: Number, default: 0 },
    verifiedAt:       { type: Date },
    markedBy:         { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    markedByName:     { type: String, default: "Admin" },
    markedAt:         { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate attendance record for same event & user
attendanceSchema.index({ eventId: 1, userId: 1 }, { unique: true });

module.exports =
  mongoose.models.Attendance ||
  mongoose.model("Attendance", attendanceSchema);
