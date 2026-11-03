// backend/controllers/adminController.js
const Storage = require("../services/storage");

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const data = await Storage.getAdminKPIs();
    res.json({ success: true, data });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { search, department, academicYear, status, role } = req.query;
    const users = await Storage.getAllUsers({ search, department, academicYear, status, role });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await Storage.findUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const transactions = await Storage.getPointsTransactions({ userId: user._id || user.id });
    const applications = await Storage.getMyApplications(user._id || user.id, user.applicationId);
    const gradingLevels = await Storage.getGradingLevels();
    const grade = Storage.calculateUserGrade(user.points || 0, gradingLevels);

    const { passwordHash, password, ...safeUser } = user;
    res.json({
      success: true,
      data: {
        ...safeUser,
        grade,
        transactions,
        applications,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/users/:id/status
const toggleUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["active", "inactive", "pending_approval"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Valid status (${allowed.join(", ")}) is required.` });
    }
    const updated = await Storage.toggleUserStatus(req.params.id, status, req.user);
    if (!updated) return res.status(404).json({ success: false, message: "User not found." });

    res.json({
      success: true,
      data: updated,
      message: `Account status updated to ${status}.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/users/:id/approve
const approveUser = async (req, res) => {
  try {
    const updated = await Storage.toggleUserStatus(req.params.id, "active", req.user);
    if (!updated) return res.status(404).json({ success: false, message: "User not found." });

    // Send congratulatory notification to user
    try {
      await Storage.createNotification({
        userId: (updated._id || updated.id).toString(),
        type: "system",
        title: "Registration Approved! 🎉",
        message: "Vanakkam! Your Maatram Foundation volunteer account has been approved by the admin. You now have full access to register for drives and earn leadership points.",
        link: "/dashboard",
      });
    } catch {}

    res.json({
      success: true,
      data: updated,
      message: `${updated.fullName || "User"}'s account has been APPROVED and activated!`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/users/:id (Permanent deletion)
const deleteUser = async (req, res) => {
  try {
    const success = await Storage.deleteUser(req.params.id, req.user);
    if (!success) return res.status(404).json({ success: false, message: "User not found or could not be removed." });

    res.json({
      success: true,
      message: "User and all associated records permanently deleted from database.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/users/:id/points/adjust
const adjustUserPoints = async (req, res) => {
  try {
    const { points, type, reason, adminRemarks } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "A mandatory reason must be provided for manual point adjustments." });
    }
    if (!points || Number(points) <= 0) {
      return res.status(400).json({ success: false, message: "Points must be a positive number." });
    }

    const result = await Storage.adjustUserPoints({
      userId: req.params.id,
      points: Number(points),
      type: type || "CREDIT",
      reason,
      adminRemarks,
      adminUser: req.user,
    });

    res.json({
      success: true,
      data: result,
      message: `Successfully ${type === "DEBIT" ? "deducted" : "credited"} ${points} points.`,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/admin/grading
const getGradingLevels = async (req, res) => {
  try {
    const levels = await Storage.getGradingLevels();
    res.json({ success: true, data: levels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/grading
const updateGradingLevels = async (req, res) => {
  try {
    const { levels } = req.body;
    const updated = await Storage.updateGradingLevels(levels, req.user);
    res.json({ success: true, data: updated, message: "Grading levels updated successfully." });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/admin/events/:id/attendance
const trackAttendance = async (req, res) => {
  try {
    const { attendanceRecords } = req.body;
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({ success: false, message: "attendanceRecords array is required." });
    }
    const result = await Storage.trackAttendanceAndAwardPoints({
      eventId: req.params.id,
      attendanceRecords,
      adminUser: req.user,
    });
    res.json({
      success: true,
      data: result,
      message: "Attendance recorded and points awarded to completing volunteers!",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/admin/notifications/broadcast
const broadcastNotification = async (req, res) => {
  try {
    const { targetType, targetEventId, targetUserIds, title, message, link } = req.body;
    const result = await Storage.broadcastNotification({
      targetType,
      targetEventId,
      targetUserIds,
      title,
      message,
      link,
      adminUser: req.user,
    });
    res.json({
      success: true,
      data: result,
      message: `Notification broadcast sent to ${result.sentCount} recipient(s).`,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/admin/reports
const getReports = async (req, res) => {
  try {
    const data = await Storage.getAdminReports();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
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
};
