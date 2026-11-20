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
    const { validityHours } = req.body;
    const qrResult = await Storage.generateEventQRToken(req.params.id, req.user, validityHours);
    res.json({ success: true, data: qrResult, message: "Event QR Code generated successfully!" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/events/:id/qr-invalidate (Admin only - invalidate QR)
const invalidateQRToken = async (req, res) => {
  try {
    const invalidateResult = await Storage.invalidateEventQR(req.params.id, req.user);
    res.json({ success: true, data: invalidateResult, message: invalidateResult.message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/events/:id/confirm-selection (Admin only - confirm volunteer selection email)
const confirmSelection = async (req, res) => {
  try {
    const selectionResult = await Storage.confirmEventSelection(req.params.id, req.body, req.user);
    res.json({
      success: true,
      data: selectionResult,
      message: selectionResult.message,
      sentCount: selectionResult.sentCount,
      failedCount: selectionResult.failedCount,
      skippedCount: selectionResult.skippedCount,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PATCH /api/events/:id/attendance/close (Admin only - close attendance, award points, send completion email)
const closeAttendance = async (req, res) => {
  try {
    const closeResult = await Storage.closeEventAttendanceAndVerify(req.params.id, req.body, req.user);
    res.json({
      success: true,
      data: closeResult,
      message: closeResult.message,
      verifiedCount: closeResult.verifiedCount,
      totalPointsAwarded: closeResult.totalPointsAwarded,
      sentCount: closeResult.sentCount,
      failedCount: closeResult.failedCount,
      skippedCount: closeResult.skippedCount,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/events/:id/retry-failed-emails (Admin only - retry failed event emails)
const retryFailedEmails = async (req, res) => {
  try {
    const retryResult = await Storage.retryFailedEventEmails(req.params.id);
    res.json({ success: true, data: retryResult, message: "Retried failed emails." });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/events/:id/checkin (Approved Volunteer scans QR)
const checkInViaQR = async (req, res) => {
  try {
    const { qrToken } = req.body;
    const checkInResult = await Storage.checkInViaQR({
      eventId: req.params.id,
      qrToken,
      user: req.user,
    });
    res.json({ success: true, data: checkInResult, message: checkInResult.message });
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
    const reminderResult = await Storage.sendEventReminderBlast(req.params.id, req.user);
    res.json({
      success: true,
      data: reminderResult,
      message: `Event reminder emails dispatched to ${reminderResult.sentCount} approved volunteer(s)!`,
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
  invalidateQRToken,
  confirmSelection,
  closeAttendance,
  retryFailedEmails,
  checkInViaQR,
  getAttendance,
  sendReminder,
};
