// backend/controllers/meetingController.js
const Storage = require("../services/storage");

// GET /api/meetings
const getMeetings = async (req, res) => {
  try {
    const { tag } = req.query;
    const meetings = await Storage.getMeetings({ tag });
    res.json({ success: true, data: meetings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/meetings/:id
const getMeetingById = async (req, res) => {
  try {
    const meeting = await Storage.getMeetingById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found." });
    res.json({ success: true, data: meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/meetings (Admin only)
const createMeeting = async (req, res) => {
  try {
    const { title, date, time } = req.body;
    if (!title || !date || !time) {
      return res.status(400).json({ success: false, message: "Title, date, and time are required." });
    }
    const meeting = await Storage.createMeeting(req.body, req.user);
    res.status(201).json({ success: true, data: meeting, message: "Meeting scheduled successfully!" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/meetings/:id (Admin only)
const updateMeeting = async (req, res) => {
  try {
    const updated = await Storage.updateMeeting(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: "Meeting not found." });
    res.json({ success: true, data: updated, message: "Meeting updated successfully!" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/meetings/:id (Admin only)
const deleteMeeting = async (req, res) => {
  try {
    const result = await Storage.deleteMeeting(req.params.id);
    res.json({ success: true, message: result.message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/meetings/:id/availability (Student/volunteer)
const submitMeetingAvailability = async (req, res) => {
  try {
    const result = await Storage.submitMeetingAvailability(req.params.id, req.body, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/meetings/:id/availabilities (Admin only)
const getMeetingAvailabilities = async (req, res) => {
  try {
    const result = await Storage.getMeetingAvailabilities(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  submitMeetingAvailability,
  getMeetingAvailabilities,
};
