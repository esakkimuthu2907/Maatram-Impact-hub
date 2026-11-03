// backend/models/Connection.js
const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status:      {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
    message:     { type: String, default: "" },
  },
  { timestamps: true }
);

// Prevent duplicate connections between same pairs
connectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

module.exports =
  mongoose.models.Connection ||
  mongoose.model("Connection", connectionSchema);
