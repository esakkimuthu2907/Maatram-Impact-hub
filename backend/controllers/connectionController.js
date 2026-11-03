// backend/controllers/connectionController.js
const Storage = require("../services/storage");

// GET /api/connections
const getMyConnections = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const connections = await Storage.getConnections(userId);
    res.json({ success: true, data: connections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/connections/request
const sendConnectionRequest = async (req, res) => {
  try {
    const requesterId = req.user?._id || req.user?.id;
    const { recipientId, message } = req.body;
    if (!recipientId) {
      return res.status(400).json({ success: false, message: "recipientId is required." });
    }
    const result = await Storage.sendConnectionRequest({
      requesterId,
      recipientId,
      message,
    });
    res.status(201).json({
      success: true,
      data: result,
      message: "Connection request sent successfully!",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/connections/:id/accept
const acceptConnectionRequest = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const updated = await Storage.acceptConnectionRequest(req.params.id, userId);
    res.json({ success: true, data: updated, message: "Connection request accepted!" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/connections/:id/reject
const rejectConnectionRequest = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const updated = await Storage.rejectConnectionRequest(req.params.id, userId);
    res.json({ success: true, data: updated, message: "Connection request rejected." });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/connections/:id
const removeOrCancelConnection = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    await Storage.removeConnection(req.params.id, userId);
    res.json({ success: true, message: "Connection removed successfully." });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMyConnections,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  removeOrCancelConnection,
};
