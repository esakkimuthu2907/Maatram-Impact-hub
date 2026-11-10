// backend/routes/certificates.js
const express = require("express");
const router = express.Router();
const {
  getMyCertificates,
  getAllCertificates,
  getCertificateById,
  issueCertificate,
} = require("../controllers/certificateController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/my", protect, getMyCertificates);
router.get("/all", protect, adminOnly, getAllCertificates);
router.get("/verify/:id", getCertificateById); // Public verification endpoint
router.get("/:id", getCertificateById); // Publicly viewable/verifiable by ID

// Admin manual issuance
router.post("/issue", protect, adminOnly, issueCertificate);

module.exports = router;
