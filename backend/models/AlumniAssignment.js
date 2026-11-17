// backend/models/AlumniAssignment.js
const mongoose = require("mongoose");

const alumniAssignmentSchema = new mongoose.Schema(
  {
    eventId:             { type: mongoose.Schema.Types.Mixed, required: true },
    eventTitle:          { type: String, required: true },
    eventDate:           { type: String, default: "" },
    eventLocation:       { type: String, default: "" },
    alumniId:            { type: mongoose.Schema.Types.Mixed, required: true },
    alumniName:          { type: String, required: true },
    alumniEmail:         { type: String, required: true },
    alumniApplicationId: { type: String, default: "" },
    role:                { type: String, default: "Event Lead & Supervisor" },
    notes:               { type: String, default: "" },
    status:              { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    assignedBy:          { type: String, default: "Admin Coordinator" },
    reviewedBy:          { type: String, default: "" },
    reviewedAt:          { type: Date },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AlumniAssignment ||
  mongoose.model("AlumniAssignment", alumniAssignmentSchema);
