// backend/routes/games.js
const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");
const { protect, adminOnly } = require("../middleware/auth");

// Public / Authenticated read routes
router.get("/daily", protect, gameController.getDailyChallenge);
router.post("/zip/submit", protect, gameController.submitZip);
router.post("/wend/submit", protect, gameController.submitWend);
router.get("/leaderboard", protect, gameController.getLeaderboard);
router.get("/badges", protect, gameController.getBadges);
router.get("/history", protect, gameController.getHistory);

// Admin game management routes
router.get("/admin/puzzles", protect, adminOnly, gameController.getAdminPuzzles);
router.post("/admin/puzzles", protect, adminOnly, gameController.saveAdminPuzzle);

module.exports = router;
