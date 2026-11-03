// backend/config/db.js
const mongoose = require("mongoose");

let isConnected = false;

// Attach error listener so unhandled connection errors don't terminate process
mongoose.connection.on("error", (err) => {
  console.warn(`⚠️ Mongoose connection notice: ${err.message}`);
  isConnected = false;
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
});

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("⚠️ MONGO_URI not provided in .env. Using persistent local JSON database fallback.");
    return false;
  }

  try {
    console.log("🔄 Connecting to MongoDB Database...");
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Atlas Connected Successfully: ${mongoose.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB Atlas Notice: ${error.message}`);
    console.warn("ℹ️ Running in Dual-Mode: Using persistent backend storage (backend/data/db.json).");
    isConnected = false;
    try {
      await mongoose.disconnect();
    } catch {}
    return false;
  }
};

const getIsConnected = () => isConnected && mongoose.connection.readyState === 1;

module.exports = { connectDB, getIsConnected };
