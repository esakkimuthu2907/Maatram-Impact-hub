// backend/models/EmailLog.js
const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    triggerType: {
      type: String,
      required: true,
      enum: [
        "registration_confirmation",
        "application_approval",
        "application_rejection",
        "event_reminder",
        "event_reminder_24h",
        "event_reminder_2h",
        "event_update",
        "hours_verification",
        "thank_you",
        "thank_you_completion",
        "certificate_availability",
        "alumni_assignment_approval",
        "alumni_assignment_request",
        "general_announcement",
      ],
    },
    recipientEmail: { type: String, required: true },
    recipientName:  { type: String, default: "" },
    recipientRole:  { type: String, default: "student" },
    subject:        { type: String, required: true },
    previewText:    { type: String, default: "" },
    htmlContent:    { type: String, required: true },
    textContent:    { type: String, default: "" },
    status:         { type: String, enum: ["Delivered", "Sent", "Simulated", "Failed"], default: "Delivered" },
    errorDetails:   { type: String, default: "" },
    retryCount:     { type: Number, default: 0 },
    lastRetryAt:    { type: Date },
    relatedEventId: { type: mongoose.Schema.Types.Mixed },
    relatedEventTitle: { type: String, default: "" },
    metadata:       { type: mongoose.Schema.Types.Mixed, default: {} },
    sentAt:         { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.EmailLog || mongoose.model("EmailLog", emailLogSchema);
