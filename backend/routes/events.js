// backend/routes/events.js
const express = require("express");
const router = express.Router();
const {
  getEvents,
  getEventById,
  getEventVolunteers,
  createEvent,
  updateEvent,
  deleteEvent,
  generateQRToken,
  invalidateQRToken,
  confirmSelection,
  closeAttendance,
  retryFailedEmails,
  checkInViaQR,
  getAttendance,
  sendReminder,
  getAIRecommendations,
  applyAISelection,
  submitEventFeedback,
  getMyEventFeedback,
  getEventFeedbacks,
  lockSession,
  getMySession,
} = require("../controllers/eventController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", getEvents);
router.get("/:id", getEventById);
router.get("/:id/volunteers", getEventVolunteers);
router.get("/:id/attendance", getAttendance);

// Volunteer Feedback & Ratings
router.post("/:id/feedback", protect, submitEventFeedback);
router.get("/:id/feedback/my", protect, getMyEventFeedback);
router.get("/:id/feedbacks", protect, adminOnly, getEventFeedbacks);

// QR Check-in & Live Session Locking by authenticated student/volunteer
router.post("/:id/checkin", protect, checkInViaQR);
router.post("/:id/session/lock", protect, lockSession);
router.get("/:id/session/my", protect, getMySession);

// Admin-only operations
router.post("/", protect, adminOnly, createEvent);
router.put("/:id", protect, adminOnly, updateEvent);
router.delete("/:id", protect, adminOnly, deleteEvent);
router.post("/:id/qr-token", protect, adminOnly, generateQRToken);
router.post("/:id/qr-invalidate", protect, adminOnly, invalidateQRToken);
router.post("/:id/confirm-selection", protect, adminOnly, confirmSelection);
router.patch("/:id/attendance/close", protect, adminOnly, closeAttendance);
router.post("/:id/attendance/close", protect, adminOnly, closeAttendance);
router.post("/:id/retry-failed-emails", protect, adminOnly, retryFailedEmails);
router.post("/:id/remind", protect, adminOnly, sendReminder);
router.get("/:id/ai-recommendations", protect, adminOnly, getAIRecommendations);
router.post("/:id/apply-selection", protect, adminOnly, applyAISelection);

module.exports = router;
