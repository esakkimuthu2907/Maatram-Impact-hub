// backend/models/Meeting.js
const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title:        { type: String, required: true },
    tag:          { type: String, default: "NSS" }, // "NSS" | "Events" | "Outreach" | "Orientation" | "Kickoff"
    date:         { type: String, required: true }, // e.g. "24 Nov 2026"
    iso:          { type: String }, // e.g. "2026-11-24"
    day:          { type: String }, // "24"
    mon:          { type: String }, // "NOV"
    time:         { type: String, required: true }, // "10:00 AM – 11:00 AM"
    status:       { type: String, default: "Upcoming" }, // "Upcoming" | "Confirmed" | "Attended" | "Missed" | "Cancelled"
    tone:         { type: String, default: "gn" }, // "gn" | "am" | "r"
    grad:         { type: String, default: "b" }, // "b" | "a" | "g" | "r"
    emoji:        { type: String, default: "📋" },
    desc:         { type: String, default: "" },
    mode:         { type: String, default: "Google Meet" },
    location:     { type: String, default: "Google Meet · Chennai, Tamil Nadu" },
    meetLink:     { type: String, default: "https://meet.google.com/xyz-maatram" },
    coord:        { type: String, default: "Karthik R" },
    role:         { type: String, default: "NSS Programme Coordinator" },
    phone:        { type: String, default: "+91 98765 43210" },
    email:        { type: String, default: "karthik@maatram.org" },
    people:       { type: String, default: "15 Volunteers" },
    agenda:       { type: [String], default: [] },
    note:         { type: String, default: "Keep your college ID ready. Join 5 minutes early." },
    past:         { type: Boolean, default: false },
    zone:          { type: String, default: "All Zones" },
    targetAudience: { type: String, enum: ["Both", "Students", "Alumni"], default: "Both" },
    availabilities: [
      {
        userId:       { type: mongoose.Schema.Types.Mixed },
        studentName:  { type: String },
        studentEmail: { type: String },
        studentPhone: { type: String },
        college:      { type: String },
        response:     { type: String, enum: ["available", "unavailable"], default: "available" },
        selectedDate: { type: String },
        selectedSlot: { type: String },
        reason:       { type: String, default: "" },
        submittedAt:  { type: Date, default: Date.now },
      }
    ],
    createdBy:    { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Meeting || mongoose.model("Meeting", meetingSchema);
