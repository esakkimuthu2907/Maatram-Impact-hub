// backend/controllers/applicationController.js
const Storage = require("../services/storage");

// POST /api/applications (Student apply)
const createApplication = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required to apply." });
    }

    const application = await Storage.createApplication(req.body, req.user);
    res.status(201).json({
      success: true,
      data: application,
      message: "Application submitted successfully!",
    });
  } catch (err) {
    console.error("Create application error:", err);
    res.status(400).json({ success: false, message: err.message || "Could not submit application." });
  }
};

// GET /api/applications/my (Student's applications)
const getMyApplications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const applicationId = req.user?.applicationId;
    const email = req.user?.email;
    const apps = await Storage.getMyApplications(userId, applicationId, email);
    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/applications/all (Admin all applications)
const getAllApplications = async (req, res) => {
  try {
    const { status, eventId, search } = req.query;
    const apps = await Storage.getAllApplications({ status, eventId, search });
    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/applications/:id/status (Admin approve/reject)
const updateApplicationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!status) return res.status(400).json({ success: false, message: "Status is required." });

    const updated = await Storage.updateApplicationStatus(req.params.id, status, notes, req.user);
    if (!updated) return res.status(404).json({ success: false, message: "Application not found." });

    res.json({ success: true, data: updated, message: `Application ${status} successfully!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/applications/:id/cancel (Student withdraws)
const cancelApplication = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const success = await Storage.cancelApplication(req.params.id, userId);
    if (!success) return res.status(404).json({ success: false, message: "Application not found." });
    res.json({ success: true, message: "Application withdrawn successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/applications/:id (Admin permanently deletes application)
const deleteApplication = async (req, res) => {
  try {
    const success = await Storage.deleteApplication(req.params.id, req.user);
    if (!success) return res.status(404).json({ success: false, message: "Application not found or could not be deleted." });
    res.json({ success: true, message: "Application record permanently deleted from database." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getAllApplications,
  updateApplicationStatus,
  cancelApplication,
  deleteApplication,
};
