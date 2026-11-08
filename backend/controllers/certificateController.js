// backend/controllers/certificateController.js
const Storage = require("../services/storage");

const getMyCertificates = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const certs = await Storage.getUserCertificates(userId);
    res.json({ success: true, data: certs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllCertificates = async (req, res) => {
  try {
    const { search } = req.query;
    const certs = await Storage.getAllCertificates({ search });
    res.json({ success: true, data: certs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCertificateById = async (req, res) => {
  try {
    const cert = await Storage.getCertificateById(req.params.id);
    if (!cert) return res.status(404).json({ success: false, message: "Certificate not found." });
    res.json({ success: true, data: cert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const issueCertificate = async (req, res) => {
  try {
    const { userId, eventId, applicationId, verifiedHours, pointsAwarded } = req.body;
    if (!userId || !eventId) {
      return res.status(400).json({ success: false, message: "userId and eventId are required." });
    }
    const cert = await Storage.issueCertificate({
      userId,
      eventId,
      applicationId,
      verifiedHours,
      pointsAwarded,
      adminUser: req.user,
    });
    res.status(201).json({ success: true, data: cert, message: "Certificate issued successfully!" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMyCertificates,
  getAllCertificates,
  getCertificateById,
  issueCertificate,
};
