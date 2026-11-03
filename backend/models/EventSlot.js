// backend/models/EventSlot.js
const mongoose = require("mongoose");

const eventSlotSchema = new mongoose.Schema(
  {
    eventId:   { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    title:     { type: String, required: true }, // e.g. "Morning Slot", "Batch A"
    startTime: { type: String, default: "" },
    endTime:   { type: String, default: "" },
    date:      { type: String, default: "" },
    capacity:  { type: Number, default: 10 },
    filled:    { type: Number, default: 0 },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.EventSlot || mongoose.model("EventSlot", eventSlotSchema);
