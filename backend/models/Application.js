// backend/models/Application.js (VolunteerApplication)
const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    referenceId:      { type: String, unique: true },
    userId:           { type: mongoose.Schema.Types.Mixed, required: true },
    applicationId:    { type: String }, // e.g. MAA001
    opportunityId:    { type: mongoose.Schema.Types.Mixed, required: true },
    opportunityTitle: { type: String },
    category:         { type: String },
    eventDate:        { type: String },
    hours:            { type: Number, default: 4 },
    slotId:           { type: String, default: "" },
    slotName:         { type: String, default: "Standard Slot" },
    status:           {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed", "Cancelled"],
      default: "Pending",
    },
    attendanceStatus: {
      type: String,
      enum: ["Unmarked", "Present", "Absent"],
      default: "Unmarked",
    },
    pointsAwarded:    { type: Number, default: 0 },
    motivation:       { type: String, default: "" },
    experience:       { type: String, default: "" },
    skills:           { type: String, default: "" },
    notes:            { type: String, default: "" }, // Admin notes / remarks
    appliedDate:      { type: String },
    applicantDetails: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      college: { type: String, default: "" },
      department: { type: String, default: "" },
      academicYear: { type: String, default: "" },
      regNumber: { type: String, default: "" },
      avatar: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

// Auto-generate referenceId
applicationSchema.pre("save", function (next) {
  if (!this.referenceId) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.referenceId = `MAT-${rand}`;
  }
  if (!this.appliedDate) {
    this.appliedDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  next();
});

const Application = mongoose.models.Application || mongoose.model("Application", applicationSchema);
module.exports = Application;
