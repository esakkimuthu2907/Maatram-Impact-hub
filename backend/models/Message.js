// backend/models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text:        { type: String, required: true, trim: true },
    read:        { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ senderId: 1, recipientId: 1, createdAt: 1 });

module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);
