// backend/routes/notifications.js
const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getNotifications);
router.put("/read", protect, markAllRead);
router.delete("/all", protect, clearAllNotifications);
router.delete("/:id", protect, deleteNotification);

module.exports = router;
