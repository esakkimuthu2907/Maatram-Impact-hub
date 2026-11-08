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
  checkInViaQR,
  getAttendance,
  sendReminder,
} = require("../controllers/eventController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", getEvents);
router.get("/:id", getEventById);
router.get("/:id/volunteers", getEventVolunteers);
router.get("/:id/attendance", getAttendance);

// QR Check-in by authenticated student/volunteer
router.post("/:id/checkin", protect, checkInViaQR);

// Admin-only operations
router.post("/", protect, adminOnly, createEvent);
router.put("/:id", protect, adminOnly, updateEvent);
router.delete("/:id", protect, adminOnly, deleteEvent);
router.post("/:id/qr-token", protect, adminOnly, generateQRToken);
router.post("/:id/remind", protect, adminOnly, sendReminder);

module.exports = router;
