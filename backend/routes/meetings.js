// backend/routes/meetings.js
const express = require("express");
const router = express.Router();
const {
  getMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  submitMeetingAvailability,
  getMeetingAvailabilities,
} = require("../controllers/meetingController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", getMeetings);
router.get("/:id", getMeetingById);

// Student/Volunteer submits availability
router.post("/:id/availability", protect, submitMeetingAvailability);

// Admin controls
router.post("/", protect, adminOnly, createMeeting);
router.put("/:id", protect, adminOnly, updateMeeting);
router.delete("/:id", protect, adminOnly, deleteMeeting);
router.get("/:id/availabilities", protect, adminOnly, getMeetingAvailabilities);

module.exports = router;
