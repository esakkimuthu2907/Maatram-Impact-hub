// backend/routes/connections.js
const express = require("express");
const router = express.Router();
const {
  getMyConnections,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  removeOrCancelConnection,
} = require("../controllers/connectionController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", getMyConnections);
router.post("/request", sendConnectionRequest);
router.put("/:id/accept", acceptConnectionRequest);
router.put("/:id/reject", rejectConnectionRequest);
router.delete("/:id", removeOrCancelConnection);

module.exports = router;
