// backend/routes/applications.js
const express = require("express");
const router = express.Router();
const {
  createApplication, getMyApplications, getAllApplications,
  updateApplicationStatus, cancelApplication, deleteApplication,
} = require("../controllers/applicationController");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/",                      protect, createApplication);
router.get("/my",                     protect, getMyApplications);
router.get("/all",                    protect, adminOnly, getAllApplications);
router.put("/:id/status",             protect, adminOnly, updateApplicationStatus);
router.put("/:id/cancel",             protect, cancelApplication);
router.delete("/:id",                  protect, adminOnly, deleteApplication);

module.exports = router;
