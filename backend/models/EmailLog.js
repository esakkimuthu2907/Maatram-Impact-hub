// backend/models/EmailLog.js
const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    triggerType: {
      type: String,
      required: true,
      enum: [
        "volunteer_selection",
        "volunteer_completion",
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
    recipientEmail: { type: String, required: true, lowercase: true, trim: true },
    recipientName:  { type: String, default: "" },
    recipientRole:  { type: String, default: "student" },
    subject:        { type: String, required: true },
    previewText:    { type: String, default: "" },
    htmlContent:    { type: String, required: true },
    textContent:    { type: String, default: "" },
    status:         {
      type: String,
      enum: ["pending", "sending", "sent", "failed", "Delivered", "Sent", "Simulated", "Failed"],
      default: "pending",
    },
    errorDetails:   { type: String, default: "" },
    retryCount:     { type: Number, default: 0 },
    lastRetryAt:    { type: Date },
    claimedAt:      { type: Date },
    sentAt:         { type: Date },
    relatedEventId: { type: mongoose.Schema.Types.Mixed },
    relatedEventTitle: { type: String, default: "" },
    userId:         { type: mongoose.Schema.Types.Mixed },
    applicationId:  { type: mongoose.Schema.Types.Mixed },
    idempotencyKey: { type: String, unique: true, sparse: true, index: true },
    metadata:       { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Compound index for querying event email logs
emailLogSchema.index({ relatedEventId: 1, triggerType: 1, status: 1 });
emailLogSchema.index({ recipientEmail: 1, triggerType: 1 });

module.exports =
  mongoose.models.EmailLog || mongoose.model("EmailLog", emailLogSchema);
