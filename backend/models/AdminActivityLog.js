// backend/models/AdminActivityLog.js
const mongoose = require("mongoose");

const adminActivityLogSchema = new mongoose.Schema(
  {
    adminId:      { type: String, required: true },
    adminName:    { type: String, default: "Admin Coordinator" },
    action:       { type: String, required: true }, // e.g. "APPROVED_APPLICATION", "AWARDED_POINTS"
    details:      { type: String, required: true },
    targetUserId: { type: String, default: "" },
    targetEventId:{ type: String, default: "" },
    timestamp:    { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AdminActivityLog ||
  mongoose.model("AdminActivityLog", adminActivityLogSchema);
