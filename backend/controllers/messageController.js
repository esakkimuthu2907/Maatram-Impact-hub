// backend/controllers/messageController.js
const Message = require("../models/Message");
const User = require("../models/User");
const Connection = require("../models/Connection");
const Storage = require("../services/storage");
const mongoose = require("mongoose");

// GET /api/messages/:partnerId
// Fetch conversation between logged-in user and a partner
const getConversation = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const { partnerId } = req.params;

    let partnerOid = null;
    if (mongoose.Types.ObjectId.isValid(partnerId)) {
      partnerOid = new mongoose.Types.ObjectId(partnerId);
    } else {
      const u = await User.findOne({
        $or: [{ applicationId: partnerId }, { email: partnerId }],
      });
      if (u) partnerOid = u._id;
    }

    if (!partnerOid) {
      return res.json({ success: true, data: [] });
    }

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, recipientId: partnerOid },
        { senderId: partnerOid, recipientId: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    const mapped = messages.map((m) => {
      const isMe = m.senderId.toString() === currentUserId.toString();
      return {
        id: m._id.toString(),
        sender: isMe ? "me" : "other",
        text: m.text,
        time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
        createdAt: m.createdAt,
      };
    });

    res.json({ success: true, data: mapped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/messages
// Send a direct message
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user?._id || req.user?.id;
    const { recipientId, text } = req.body;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: "recipientId is required." });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Message text cannot be empty." });
    }

    let recOid = null;
    if (mongoose.Types.ObjectId.isValid(recipientId)) {
      recOid = new mongoose.Types.ObjectId(recipientId);
    } else {
      const u = await User.findOne({
        $or: [{ applicationId: recipientId }, { email: recipientId }],
      });
      if (u) recOid = u._id;
    }

    if (!recOid) {
      // Return optimistic response for simulated partner
      return res.status(201).json({
        success: true,
        data: {
          id: `msg_${Date.now()}`,
          sender: "me",
          text: text.trim(),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          createdAt: new Date(),
        },
      });
    }

    const message = await Message.create({
      senderId,
      recipientId: recOid,
      text: text.trim(),
    });

    try {
      const senderUser = await User.findById(senderId).select("fullName");
      await Storage.createNotification({
        userId: recOid.toString(),
        type: "connect",
        title: `Message from ${senderUser?.fullName || "Friend"} 💬`,
        message: text.trim().slice(0, 60),
        link: "/connect",
      });
    } catch (notifErr) {
      console.warn("Message notification notice:", notifErr.message);
    }

    res.status(201).json({
      success: true,
      data: {
        id: message._id.toString(),
        sender: "me",
        text: message.text,
        time: new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        createdAt: message.createdAt,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getConversation,
  sendMessage,
};
