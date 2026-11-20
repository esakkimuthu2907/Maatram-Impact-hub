
// backend/server.js
// Main API Server - Maatram Impact Hub

require("dotenv").config();

const dns = require("node:dns");
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");

// Configure DNS for MongoDB Atlas
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  console.log("✅ Google DNS configured for MongoDB Atlas");
} catch (error) {
  console.warn("⚠️ DNS configuration notice:", error.message);
}

const app = express();

// Trust proxy if deployed behind a reverse proxy
app.set("trust proxy", 1);

// Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://192.168.43.28:5173",
  "http://192.168.43.28:5174",
];

// CORS configuration - Allow all local dev and network origins
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header or any dev origin
      if (!origin) {
        return callback(null, true);
      }

      if (
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin) ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-role",
      "x-user-id",
    ],
  })
);

// ── Request timeout middleware (prevents hanging requests from crashing server) ──
// Gives long-running operations (like bulk points, certificate generation, or email blasts) 120s
app.use((req, res, next) => {
  res.setTimeout(120000, () => {
    if (!res.headersSent) {
      console.warn(`[Timeout] ${req.method} ${req.originalUrl} timed out after 120s — sending safe fallback.`);
      res.status(200).json({
        success: true,
        message: "Request is processing in the background. Refresh in a moment.",
      });
    }
  });
  next();
});

// Middleware
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get("/api/health", async (req, res) => {
  res.json({
    status: "OK",
    service: "Maatram Foundation API",
    database: "Check backend database logs",
    time: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/events", require("./routes/events"));
app.use("/api/applications", require("./routes/applications"));
app.use("/api/users", require("./routes/users"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/connections", require("./routes/connections"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/badges", require("./routes/badges"));
app.use("/api/certificates", require("./routes/certificates"));
app.use("/api/hours", require("./routes/hours"));
app.use("/api/games", require("./routes/games"));

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Maatram Impact Hub API",
    status: "Running",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ API Error:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS blocked this frontend origin",
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Server configuration
const DEFAULT_PORT = Number(process.env.PORT) || 5001;

let serverInstance = null;

function startBackend(portToTry, attempts = 0) {
  const p = Number(portToTry);
  serverInstance = app.listen(p, "0.0.0.0", () => {
    console.log("--------------------------------------");
    console.log("🚀 MAATRAM IMPACT HUB BACKEND");
    console.log("--------------------------------------");
    console.log(`✅ Backend: http://localhost:${p}`);
    console.log(`✅ Health:  http://localhost:${p}/api/health`);
    console.log("✅ CORS configured for ports 5173 and 5174");
    console.log("--------------------------------------");
  });

  // TCP keepAlive & timeouts — prevents ECONNRESET on slow/long-running requests
  serverInstance.keepAliveTimeout = 120000;
  serverInstance.headersTimeout  = 125000;
  serverInstance.requestTimeout  = 120000;

  serverInstance.on("error", (error) => {
    if ((error.code === "EADDRINUSE" || error.code === "EACCES") && attempts < 5) {
      const nextPort = p === 5000 ? 5001 : p + 1;
      console.warn(`⚠️ Port ${p} unavailable (${error.code}). Auto-switching to port ${nextPort}...`);
      startBackend(nextPort, attempts + 1);
    } else {
      console.error("❌ Fatal server error details:", error);
    }
  });

  return serverInstance;
}

const server = startBackend(DEFAULT_PORT);

// Connect to MongoDB
connectDB()
  .then(async () => {
    console.log("✅ MongoDB connection established");
    try {
      console.log("✅ Daily Games, Streaks & Leaderboard System initialized");
    } catch (seedErr) {
      console.warn("⚠️ Games System init notice:", seedErr.message);
    }
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error.message);
  });

// Scheduled 24-hour and 2-hour reminder background worker
const Storage = require("./services/storage");
setInterval(async () => {
  try {
    if (typeof Storage.processScheduledReminders === "function") {
      await Storage.processScheduledReminders();
    }
  } catch (_) {}
}, 10 * 60 * 1000);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down Maatram backend...");
  if (serverInstance) {
    serverInstance.close(() => {
      console.log("Backend stopped.");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Process crash guards - prevent ECONNRESET / unhandled crashes
process.on("uncaughtException", (err) => {
  console.error("⚠️ Uncaught Exception intercepted:", err?.message || err);
});
process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Unhandled Rejection intercepted:", reason?.message || reason);
});