
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

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // (such as health checks from command-line tools)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("❌ CORS blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
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
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("--------------------------------------");
  console.log("🚀 MAATRAM IMPACT HUB BACKEND");
  console.log("--------------------------------------");
  console.log(`✅ Backend: http://localhost:${PORT}`);
  console.log(`✅ Network: http://192.168.43.28:${PORT}`);
  console.log(`✅ Health: http://192.168.43.28:${PORT}/api/health`);
  console.log("✅ CORS configured for ports 5173 and 5174");
  console.log("--------------------------------------");
});

// Connect to MongoDB
connectDB()
  .then(() => {
    console.log("✅ MongoDB connection established");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error.message);
  });

// Handle server errors
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error("Stop the previous backend process before restarting.");
  } else {
    console.error("❌ Server error:", error);
  }
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down Maatram backend...");
  server.close(() => {
    console.log("Backend stopped.");
    process.exit(0);
  });
});
