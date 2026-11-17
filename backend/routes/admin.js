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
  markSingleAttendance,
  verifyAllApprovedAttendance,
  broadcastNotification,
  getReports,
  getEmailLogs,
  sendTestEmail,
  getAlumniAssignments,
  createAlumniAssignment,
  approveAlumniAssignment,
  rejectAlumniAssignment,
  sendBulkEmails,
  retryEmail,
  sendEventReminders,
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
router.post("/events/:id/attendance/mark", markSingleAttendance);
router.post("/events/:id/attendance/verify-all", verifyAllApprovedAttendance);
router.post("/events/:eventId/award-points", awardEventPointsBulk);
router.post("/notifications/broadcast", broadcastNotification);
router.get("/reports", getReports);
router.get("/emails", getEmailLogs);
router.post("/emails/test", sendTestEmail);
router.post("/emails/bulk", sendBulkEmails);
router.post("/emails/:id/retry", retryEmail);
router.post("/events/:id/remind", sendEventReminders);
router.get("/alumni-assignments", getAlumniAssignments);
router.post("/alumni-assignments", createAlumniAssignment);
router.put("/alumni-assignments/:id/approve", approveAlumniAssignment);
router.put("/alumni-assignments/:id/reject", rejectAlumniAssignment);

// ── ALUMNI MANAGEMENT ROUTES ──────────────────────────────
router.get("/alumni", async (req, res) => {
  try {
    const Storage = require("../services/storage");
    const all = await Storage.getAllUsers({});
    const alumni = all.filter(u => u.role === "alumni" || u.role === "Alumni");
    res.json({ success: true, data: alumni });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/alumni/:id/approve", async (req, res) => {
  try {
    const Storage = require("../services/storage");
    const updated = await Storage.updateUser(req.params.id, { status: "active" });
    if (!updated) return res.status(404).json({ success: false, message: "Alumni not found" });
    res.json({ success: true, data: updated, message: "Alumni account approved successfully." });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/alumni/:id/reject", async (req, res) => {
  try {
    const Storage = require("../services/storage");
    const updated = await Storage.updateUser(req.params.id, { status: "inactive" });
    if (!updated) return res.status(404).json({ success: false, message: "Alumni not found" });
    res.json({ success: true, data: updated, message: "Alumni account rejected." });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

