// backend/routes/users.js
const express = require("express");
const router = express.Router();
const {
  getLeaderboard,
  updateProfile,
  getMyStats,
  getMyPointsHistory,
  getStudentsForConnect,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");

router.get("/leaderboard", getLeaderboard);
router.get("/stats", protect, getMyStats);
router.get("/points/history", protect, getMyPointsHistory);
router.put("/profile", protect, updateProfile);
router.get("/students", protect, getStudentsForConnect);

module.exports = router;
