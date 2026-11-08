// backend/controllers/badgeController.js
const Storage = require("../services/storage");

const getAllBadges = async (req, res) => {
  try {
    const includeInactive = req.user?.role === "admin";
    const badges = await Storage.getAllBadges(includeInactive);
    res.json({ success: true, data: badges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyBadges = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const badges = await Storage.getUserBadges(userId);
    res.json({ success: true, data: badges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createBadge = async (req, res) => {
  try {
    const badge = await Storage.createBadge(req.body, req.user);
    res.status(201).json({ success: true, data: badge, message: "Badge created successfully!" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateBadge = async (req, res) => {
  try {
    const updated = await Storage.updateBadge(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ success: false, message: "Badge not found." });
    res.json({ success: true, data: updated, message: "Badge updated successfully!" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteBadge = async (req, res) => {
  try {
    const success = await Storage.deleteBadge(req.params.id, req.user);
    if (!success) return res.status(404).json({ success: false, message: "Badge not found." });
    res.json({ success: true, message: "Badge deleted or deactivated successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllBadges,
  getMyBadges,
  createBadge,
  updateBadge,
  deleteBadge,
};
