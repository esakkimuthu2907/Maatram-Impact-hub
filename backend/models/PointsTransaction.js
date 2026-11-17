// backend/models/PointsTransaction.js
const mongoose = require("mongoose");

const pointsTransactionSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.Mixed, required: true },
    applicationId: { type: String, default: "" }, // e.g. MAA001
    studentName:   { type: String, default: "" },
    eventId:       { type: mongoose.Schema.Types.Mixed, default: null },
    eventName:     { type: String, default: "" },
    type:          { type: String, enum: ["CREDIT", "DEBIT"], default: "CREDIT" },
    points:        { type: Number, required: true },
    reason:        { type: String, required: true, trim: true }, // Mandatory reason
    adminRemarks:  { type: String, default: "" },
    adminId:       { type: mongoose.Schema.Types.Mixed },
    adminName:     { type: String, default: "Admin Coordinator" },
    date:          { type: String, default: () => new Date().toISOString() },
    // CRITICAL: Unique Transaction Key based on Student ID + Event ID + Transaction Type
    transactionKey:{ type: String, unique: true, sparse: true, index: true },
  },
  { timestamps: true }
);

// Auto-populate transactionKey before save
pointsTransactionSchema.pre("save", function (next) {
  if (this.eventId && this.userId && !this.transactionKey) {
    const uId = (this.userId._id || this.userId.id || this.userId).toString();
    const eId = (this.eventId._id || this.eventId.id || this.eventId).toString();
    this.transactionKey = `${uId}_${eId}_${this.type}`;
  }
  next();
});

// Compound unique index ensuring each volunteer receives points only once for an event & transaction type
pointsTransactionSchema.index(
  { userId: 1, eventId: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { eventId: { $exists: true, $ne: null } },
  }
);

module.exports =
  mongoose.models.PointsTransaction ||
  mongoose.model("PointsTransaction", pointsTransactionSchema);
