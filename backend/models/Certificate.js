// backend/models/Certificate.js
const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    _id:              { type: String }, // Custom ID support (e.g. MF-CERT-2026-8492)
    certificateId:    { type: String, required: true, unique: true },
    userId:           { type: mongoose.Schema.Types.Mixed, required: true },
    applicationId:    { type: mongoose.Schema.Types.Mixed },
    eventId:          { type: mongoose.Schema.Types.Mixed, required: true },
    volunteerName:    { type: String, required: true },
    volunteerEmail:   { type: String, default: "" },
    volunteerRole:    { type: String, default: "Student Volunteer" },
    college:          { type: String, default: "" },
    eventTitle:       { type: String, required: true },
    eventCategory:    { type: String, default: "Volunteering" },
    eventDate:        { type: String, default: "" },
    verifiedHours:    { type: Number, required: true, default: 4 },
    pointsAwarded:    { type: Number, default: 50 },
    issueDate:        { type: String, default: "" },
    issuedAt:         { type: Date, default: Date.now },
    signatoryName:    { type: String, default: "Sujith Kumar" },
    signatoryTitle:   { type: String, default: "Founder & Managing Trustee, Maatram Foundation" },
    signatoryRole:    { type: String, default: "Authorised Signatory" },
    verificationUrl:  { type: String, default: "" },
    linkedInPost:     { type: String, default: "" },
    status:           { type: String, enum: ["Issued", "Revoked"], default: "Issued" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Certificate || mongoose.model("Certificate", certificateSchema);
