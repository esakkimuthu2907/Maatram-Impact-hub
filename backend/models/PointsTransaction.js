// backend/models/PointsTransaction.js
const mongoose = require("mongoose");

const pointsTransactionSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    applicationId: { type: String, required: true }, // e.g. MAA001
    studentName:   { type: String, default: "" },
    eventId:       { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    eventName:     { type: String, default: "" },
    type:          { type: String, enum: ["CREDIT", "DEBIT"], default: "CREDIT" },
    points:        { type: Number, required: true },
    reason:        { type: String, required: true, trim: true }, // Mandatory reason
    adminRemarks:  { type: String, default: "" },
    adminId:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    adminName:     { type: String, default: "Admin Coordinator" },
    date:          { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PointsTransaction ||
  mongoose.model("PointsTransaction", pointsTransactionSchema);
