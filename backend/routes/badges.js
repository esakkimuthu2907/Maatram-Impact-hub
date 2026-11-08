// backend/routes/badges.js
const express = require("express");
const router = express.Router();
const {
  getAllBadges,
  getMyBadges,
  createBadge,
  updateBadge,
  deleteBadge,
} = require("../controllers/badgeController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", getAllBadges);
router.get("/my", protect, getMyBadges);

// Admin controls
router.post("/", protect, adminOnly, createBadge);
router.put("/:id", protect, adminOnly, updateBadge);
router.delete("/:id", protect, adminOnly, deleteBadge);

module.exports = router;
