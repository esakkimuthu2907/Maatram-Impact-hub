// backend/routes/chat.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { protect, adminOnly } = require("../middleware/auth");
const {
  sendMessage,
  uploadDocument,
  getDocuments,
  deleteDocument,
  rebuildIndex,
  getChatStatus,
} = require("../controllers/chatController");

// Multer setup for PDF uploads
const KB_DIR = path.join(__dirname, "../data/knowledge_base");
if (!fs.existsSync(KB_DIR)) fs.mkdirSync(KB_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, KB_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed."), false);
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// ── Public / Auth Routes ─────────────────────────────────────────────────────
// Chat message — requires auth (any logged-in user)
router.post("/message", protect, sendMessage);

// Status check — public
router.get("/status", getChatStatus);

// ── Admin-Only Routes ────────────────────────────────────────────────────────
router.use("/admin", protect, adminOnly);

router.get("/admin/documents", getDocuments);
router.post("/admin/upload", upload.single("document"), uploadDocument);
router.delete("/admin/documents/:filename", deleteDocument);
router.post("/admin/rebuild-index", rebuildIndex);

module.exports = router;
