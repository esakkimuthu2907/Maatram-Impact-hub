// backend/routes/admin.js
const express = require("express");
const router = express.Router();
const {
  getStats,
  getUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  approveUser,
  deleteUser,
  adjustUserPoints,
  deductUserPoints,
  awardEventPointsBulk,
  assignAlumniWork,
  getGradingLevels,
  updateGradingLevels,
  trackAttendance,
  broadcastNotification,
  getReports,
  getEmailLogs,
  sendTestEmail,
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/auth");

// All admin routes are protected and restricted to admin
router.use(protect);
router.use(adminOnly);

router.get("/stats", getStats);
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.put("/users/:id/status", toggleUserStatus);
router.put("/users/:id/approve", approveUser);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/assign-work", assignAlumniWork);
router.post("/users/:id/points/adjust", adjustUserPoints);
router.post("/users/:id/points/deduct", deductUserPoints);
router.get("/grading", getGradingLevels);
router.put("/grading", updateGradingLevels);
router.post("/events/:id/attendance", trackAttendance);
router.post("/events/:eventId/award-points", awardEventPointsBulk);
router.post("/notifications/broadcast", broadcastNotification);
router.get("/reports", getReports);
router.get("/emails", getEmailLogs);
router.post("/emails/test", sendTestEmail);

module.exports = router;

