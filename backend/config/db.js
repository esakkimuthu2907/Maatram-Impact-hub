
const mongoose = require("mongoose");

mongoose.set("bufferCommands", false);

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn("⚠️ MONGO_URI missing. Using local JSON fallback.");
    return false;
  }

  try {
    console.log("🔄 Connecting to MongoDB Atlas...");

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    console.log(
      `✅ MongoDB Atlas Connected: ${mongoose.connection.host}`
    );

    return true;

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.warn("⚠️ Using local JSON fallback.");

    return false;
  }
};

const getIsConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  connectDB,
  getIsConnected,
};
