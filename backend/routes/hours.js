// backend/routes/hours.js
const express = require("express");
const router = express.Router();
const {
  submitHours,
  getMyHours,
  getAllHours,
  verifyHours,
} = require("../controllers/hourController");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/submit", protect, submitHours);
router.get("/my", protect, getMyHours);
router.get("/all", protect, adminOnly, getAllHours);
router.put("/:id/verify", protect, adminOnly, verifyHours);

module.exports = router;
