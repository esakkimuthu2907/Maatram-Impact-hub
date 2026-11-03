// backend/controllers/notificationController.js
const Storage = require("../services/storage");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || "MAA001";
    const list = await Storage.getNotifications(userId);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || "MAA001";
    await Storage.markAllNotificationsRead(userId);
    res.json({ success: true, message: "Notifications marked as read." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getNotifications, markAllRead };
