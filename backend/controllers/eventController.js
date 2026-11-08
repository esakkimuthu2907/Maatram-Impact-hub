// backend/controllers/eventController.js
const Storage = require("../services/storage");

// GET /api/events
const getEvents = async (req, res) => {
  try {
    const { category, mode, search, status } = req.query;
    const events = await Storage.getEvents({ category, mode, search, status });
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/events/:id
const getEventById = async (req, res) => {
  try {
    const event = await Storage.getEventById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    // Include registered volunteers (applications) for this specific event
    const applications = await Storage.getApplicationsByEvent(req.params.id);
    const attendance = await Storage.getEventAttendance(req.params.id);

    res.json({
      success: true,
      data: {
        ...event,
        registeredVolunteers: applications,
        attendanceRecords: attendance,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/events/:id/volunteers
const getEventVolunteers = async (req, res) => {
  try {
    const applications = await Storage.getApplicationsByEvent(req.params.id);
    res.json({ success: true, data: applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/events (Admin only)
const createEvent = async (req, res) => {
  try {
    const event = await Storage.createEvent(req.body, req.user);
    res.status(201).json({ success: true, data: event, message: "Event created successfully!" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/events/:id (Admin only)
const updateEvent = async (req, res) => {
  try {
    const updated = await Storage.updateEvent(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, data: updated, message: "Event updated successfully!" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/events/:id (Admin only)
const deleteEvent = async (req, res) => {
  try {
    await Storage.deleteEvent(req.params.id, req.user);
    res.json({ success: true, message: "Event deleted successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/events/:id/qr-token (Admin only - generate QR)
const generateQRToken = async (req, res) => {
  try {
    const result = await Storage.generateEventQRToken(req.params.id, req.user);
    res.json({ success: true, data: result, message: "Event QR Code generated successfully!" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/events/:id/checkin (Approved Volunteer scans QR)
const checkInViaQR = async (req, res) => {
  try {
    const { qrToken } = req.body;
    const result = await Storage.checkInViaQR({
      eventId: req.params.id,
      qrToken,
      user: req.user,
    });
    res.json({ success: true, data: result, message: result.message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/events/:id/attendance (Admin & Volunteers view roster)
const getAttendance = async (req, res) => {
  try {
    const attendance = await Storage.getEventAttendance(req.params.id);
    res.json({ success: true, data: attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/events/:id/remind (Admin trigger event reminders via email)
const sendReminder = async (req, res) => {
  try {
    const result = await Storage.sendEventReminderBlast(req.params.id, req.user);
    res.json({
      success: true,
      data: result,
      message: `Event reminder emails dispatched to ${result.sentCount} approved volunteer(s)!`,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getEvents,
  getEventById,
  getEventVolunteers,
  createEvent,
  updateEvent,
  deleteEvent,
  generateQRToken,
  checkInViaQR,
  getAttendance,
  sendReminder,
};
