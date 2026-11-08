// backend/controllers/hourController.js
const Storage = require("../services/storage");

const submitHours = async (req, res) => {
  try {
    const log = await Storage.submitHourLog(req.body, req.user);
    res.status(201).json({
      success: true,
      data: log,
      message: "Volunteering hours submitted for admin audit and verification!",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getMyHours = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const logs = await Storage.getMyHourLogs(userId);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllHours = async (req, res) => {
  try {
    const { status, search } = req.query;
    const logs = await Storage.getAllHourLogs({ status, search });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const verifyHours = async (req, res) => {
  try {
    const { action, verifiedHours, adminRemarks } = req.body;
    if (!action) return res.status(400).json({ success: false, message: "Action (Verify, Reject, Request Correction, Approve) is required." });

    const updated = await Storage.updateHourLogStatus(
      req.params.id,
      { action, verifiedHours, adminRemarks },
      req.user
    );
    res.json({
      success: true,
      data: updated,
      message: `Hours submission successfully marked as "${updated.verificationStatus}"!`,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  submitHours,
  getMyHours,
  getAllHours,
  verifyHours,
};
