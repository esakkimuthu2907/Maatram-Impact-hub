// backend/routes/admin.js
const express = require("express");
const router = express.Router();
const {
  getStats,
  getUsers,
  getUserById,
  toggleUserStatus,
  approveUser,
  deleteUser,
  adjustUserPoints,
  getGradingLevels,
  updateGradingLevels,
  trackAttendance,
  broadcastNotification,
  getReports,
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/auth");

// All admin routes are protected and restricted to admin
router.use(protect);
router.use(adminOnly);

router.get("/stats", getStats);
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id/status", toggleUserStatus);
router.put("/users/:id/approve", approveUser);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/points/adjust", adjustUserPoints);
router.get("/grading", getGradingLevels);
router.put("/grading", updateGradingLevels);
router.post("/events/:id/attendance", trackAttendance);
router.post("/notifications/broadcast", broadcastNotification);
router.get("/reports", getReports);

module.exports = router;
