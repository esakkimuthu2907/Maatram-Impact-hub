// backend/controllers/connectionController.js
const Storage = require("../services/storage");

// GET /api/connections
const getMyConnections = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const uStr = (userId || "").toString();
    const rawConns = await Storage.getConnections(userId);
    const allUsers = await Storage.getUsers();

    const accepted = [];
    const pendingIncoming = [];
    const pendingOutgoing = [];

    const getUserSummary = (otherId) => {
      const otherStr = (otherId || "").toString();
      const u = (allUsers || []).find(
        (x) => (x.id || x._id || "").toString() === otherStr || x.applicationId === otherStr
      );
      if (u) {
        return {
          id: (u.id || u._id).toString(),
          _id: (u.id || u._id).toString(),
          applicationId: u.applicationId || "",
          fullName: u.fullName || u.name || "Volunteer",
          college: u.college || "Tamil Nadu",
          department: u.department || "",
          academicYear: u.academicYear || "3rd Year",
          degree: u.degree || `B.E. ${u.department || ""}`,
          role: u.role || "student",
          points: u.points || 0,
          totalHours: u.totalHours || 0,
          skills: u.skills || ["Community Outreach"],
          bio: u.bio || "Student volunteer with Maatram Foundation.",
          avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName || "User")}`,
          isOnline: true,
        };
      }
      return {
        id: otherStr,
        fullName: "Volunteer",
        role: "student",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(otherStr)}`,
      };
    };

    (rawConns || []).forEach((c) => {
      const reqStr = (c.requesterId || "").toString();
      const recStr = (c.recipientId || "").toString();
      const isRequester = reqStr === uStr;
      const otherId = isRequester ? recStr : reqStr;
      const otherUser = getUserSummary(otherId);

      if (c.status === "accepted") {
        accepted.push({
          connectionId: c.id,
          user: otherUser,
          connectedAt: c.updatedAt || c.createdAt || new Date().toISOString(),
        });
      } else if (c.status === "pending") {
        if (isRequester) {
          pendingOutgoing.push({
            connectionId: c.id,
            user: otherUser,
            message: c.message || c.note || "Connection request sent",
            createdAt: c.createdAt,
          });
        } else {
          pendingIncoming.push({
            connectionId: c.id,
            user: otherUser,
            message: c.message || c.note || "Connection request received",
            createdAt: c.createdAt,
          });
        }
      }
    });

    res.json({
      success: true,
      data: {
        accepted,
        pendingIncoming,
        pendingOutgoing,
      },
    });
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
