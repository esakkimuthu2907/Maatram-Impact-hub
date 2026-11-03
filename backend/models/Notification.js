// backend/models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId:   { type: String, required: true }, // ObjectId string or "ALL" for system broadcasts
    type:     {
      type: String,
      enum: ["application", "event", "general", "approval", "rejection", "points", "announcement", "connect"],
      default: "general",
    },
    title:    { type: String, required: true },
    message:  { type: String, required: true },
    isRead:   { type: Boolean, default: false },
    link:     { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
