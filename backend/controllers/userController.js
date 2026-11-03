// backend/controllers/userController.js
const Storage = require("../services/storage");

const getLeaderboard = async (req, res) => {
  try {
    const list = await Storage.getLeaderboard();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyStats = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await Storage.findUserById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const gradingLevels = await Storage.getGradingLevels();
    const grade = Storage.calculateUserGrade(user.points || 0, gradingLevels);
    const transactions = await Storage.getPointsTransactions({ userId: user._id || user.id });

    res.json({
      success: true,
      data: {
        points: user.points || 0,
        totalHours: user.totalHours || 0,
        eventsJoined: user.eventsJoined || 0,
        completedEventsCount: user.completedEventsCount || 0,
        badgesEarned: user.badgesEarned || 0,
        streakDays: user.streakDays || 0,
        grade,
        transactions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const updated = await Storage.updateUser(userId, req.body);
    res.json({ success: true, data: updated, message: "Profile updated successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/points/history
const getMyPointsHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const transactions = await Storage.getPointsTransactions({ userId });
    res.json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/students (Enrolled & Registered student users for Connect page)
const getStudentsForConnect = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const students = await Storage.getStudentsForConnect(currentUserId);
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getLeaderboard,
  getMyStats,
  updateProfile,
  getMyPointsHistory,
  getStudentsForConnect,
};
