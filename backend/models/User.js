// backend/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Counter for auto-incrementing Application ID
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

const userSchema = new mongoose.Schema(
  {
    applicationId: { type: String, unique: true }, // MAA001, MAA002 ...
    fullName:      { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:      { type: String, required: true, minlength: 6 },
    phone:         { type: String, default: "" },
    college:       { type: String, default: "" },
    department:    { type: String, default: "" },
    academicYear:  { type: String, default: "1st Year" },
    regNumber:     { type: String, default: "" },
    role:          { type: String, enum: ["student", "alumni", "volunteer", "admin"], default: "student" },
    status:        { type: String, enum: ["active", "inactive", "pending_approval"], default: "pending_approval" },
    zone:          { type: String, default: "Zone 1" },
    batch:         { type: String, default: "" },
    graduationYear:{ type: String, default: "" },
    organization:  { type: String, default: "" },
    designation:   { type: String, default: "" },
    assignedEvent: { type: String, default: "" },
    assignedRole:  { type: String, default: "" },
    assignedDate:  { type: String, default: "" },
    workDescription:{ type: String, default: "" },
    assignedWorks: { type: Array, default: [] },
    avatar:        { type: String, default: "" },
    bio:           { type: String, default: "" },
    skills:        { type: [String], default: [] },
    interests:     { type: [String], default: [] },
    // Points & Stats
    points:        { type: Number, default: 0 },
    totalHours:    { type: Number, default: 0 },
    eventsJoined:  { type: Number, default: 0 },
    completedEventsCount: { type: Number, default: 0 },
    badgesEarned:  { type: Number, default: 0 },
    streakDays:    { type: Number, default: 0 },
    fcmToken:      { type: String, default: "" },
  },
  { timestamps: true }
);

// Auto-generate applicationId before saving
userSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  if (this.role === "admin" && !this.applicationId) {
    this.applicationId = "ADMIN001";
    return next();
  }

  if (this.applicationId) return next();

  try {
    const counter = await Counter.findByIdAndUpdate(
      "applicationId",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const padded = String(counter.seq).padStart(3, "0");
    this.applicationId = `MAA${padded}`;
    next();
  } catch (err) {
    next(err);
  }
});

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
