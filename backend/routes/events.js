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
} = require("../controllers/eventController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", getEvents);
router.get("/:id", getEventById);
router.get("/:id/volunteers", getEventVolunteers);

// Admin-only operations
router.post("/", protect, adminOnly, createEvent);
router.put("/:id", protect, adminOnly, updateEvent);
router.delete("/:id", protect, adminOnly, deleteEvent);

module.exports = router;
