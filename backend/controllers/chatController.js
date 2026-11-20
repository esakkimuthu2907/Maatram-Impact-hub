// backend/controllers/chatController.js
// Chatbot API controller for Maatram Foundation RAG chatbot

const path = require("path");
const fs = require("fs");
const ragService = require("../services/ragService");

const KB_DIR = path.join(__dirname, "../data/knowledge_base");

// ─── POST /api/chat/message ───────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const { message, maatramId, conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message cannot be empty." });
    }

    // Optionally fetch user profile for personalization
    let userProfile = null;
    if (req.user) {
      userProfile = req.user;
    }

    // Look up by Maatram ID if provided and not already from token
    if (maatramId && maatramId.trim() && !userProfile) {
      try {
        const Storage = require("../services/storage");
        const users = await Storage.getAllUsers({});
        userProfile = users.find(
          u =>
            (u.applicationId || "").toLowerCase() === maatramId.trim().toLowerCase() ||
            (u.maatramId || "").toLowerCase() === maatramId.trim().toLowerCase()
        );
      } catch (_) {}
    }

    // Retrieve relevant chunks from RAG index
    const relevantChunks = await ragService.retrieveRelevantChunks(message, 5);

    // Generate response using Gemini
    const result = await ragService.generateResponse({
      query: message,
      context: relevantChunks,
      maatramId: maatramId || (userProfile?.applicationId) || null,
      userProfile,
      conversationHistory,
    });

    return res.json({
      success: true,
      reply: result.text,
      sources: result.sources || [],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Chat] sendMessage error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to process your message. Please try again.",
      reply: "I'm having trouble processing your request right now. Please try again in a moment.",
    });
  }
};

// ─── POST /api/chat/upload-document (Admin only) ─────────────────────────────
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }
    // Rebuild index after upload
    const result = await ragService.buildIndex(true);
    return res.json({
      success: true,
      message: "Document uploaded and index rebuilt successfully.",
      filename: req.file.filename,
      indexResult: result,
    });
  } catch (err) {
    console.error("[Chat] uploadDocument error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/chat/documents (Admin only) ────────────────────────────────────
const getDocuments = async (req, res) => {
  try {
    const docs = ragService.listDocuments();
    const status = ragService.getIndexStatus();
    return res.json({ success: true, data: docs, indexStatus: status });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/chat/documents/:filename (Admin only) ───────────────────────
const deleteDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    // Security: prevent path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ success: false, message: "Invalid filename." });
    }
    ragService.deleteDocument(filename);
    return res.json({ success: true, message: "Document deleted successfully." });
  } catch (err) {
    return res.status(err.message === "Document not found" ? 404 : 500).json({
      success: false,
      message: err.message,
    });
  }
};

// ─── POST /api/chat/rebuild-index (Admin only) ───────────────────────────────
const rebuildIndex = async (req, res) => {
  try {
    const result = await ragService.buildIndex(true);
    return res.json({ success: true, message: "Index rebuilt successfully.", result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/chat/status ────────────────────────────────────────────────────
const getChatStatus = async (req, res) => {
  try {
    const status = ragService.getIndexStatus();
    const hasGroqKey = !!process.env.GROQ_API_KEY;
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    return res.json({
      success: true,
      data: {
        indexStatus: status,
        groqConfigured: hasGroqKey,
        geminiConfigured: hasGeminiKey,
        documentsDir: KB_DIR,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  sendMessage,
  uploadDocument,
  getDocuments,
  deleteDocument,
  rebuildIndex,
  getChatStatus,
};
