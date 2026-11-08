// backend/controllers/notificationController.js
const Storage = require("../services/storage");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || "user_esakki_001";
    const list = await Storage.getNotifications(userId);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || "user_esakki_001";
    await Storage.markAllNotificationsRead(userId);
    res.json({ success: true, message: "Notifications marked as read." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    await Storage.deleteNotification(req.params.id, userId);
    res.json({ success: true, message: "Notification deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    await Storage.clearAllNotifications(userId);
    res.json({ success: true, message: "All notifications cleared." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getNotifications,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
};
