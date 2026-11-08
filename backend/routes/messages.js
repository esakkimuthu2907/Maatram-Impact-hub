// backend/routes/messages.js
const express = require("express");
const router = express.Router();
const {
  getConversation,
  sendMessage,
} = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/:partnerId", getConversation);
router.post("/", sendMessage);

module.exports = router;
