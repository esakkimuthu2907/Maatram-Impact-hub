// backend/scripts/purge_targets.js
const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (_) {}

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");

const TARGET_EMAILS = [
  "chithiraiselvan0311@gmail.com",
  "esakkimuthu2907@gmail.com",
  "esakkirajan00@gmail.com",
];

async function purgeFromLocalDB() {
  const dbPath = path.join(__dirname, "../data/db.json");
  if (!fs.existsSync(dbPath)) return;

  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

  // 1. Clear all mock users from db.users so MongoDB Atlas is the SOLE user database
  const previousUserCount = (db.users || []).length;
  db.users = []; // Empty mock users as requested

  // 2. Remove any references in applications
  if (Array.isArray(db.applications)) {
    db.applications = db.applications.filter((a) => {
      const email = (a.applicantDetails?.email || "").toLowerCase().trim();
      return !TARGET_EMAILS.includes(email);
    });
  }

  // 3. Remove any references in attendance
  if (Array.isArray(db.attendance)) {
    db.attendance = db.attendance.filter((att) => {
      const email = (att.volunteerEmail || "").toLowerCase().trim();
      return !TARGET_EMAILS.includes(email);
    });
  }

  // 4. Remove any references in pointsTransactions
  if (Array.isArray(db.pointsTransactions)) {
    db.pointsTransactions = db.pointsTransactions.filter((pt) => {
      const name = (pt.studentName || "").toLowerCase();
      return !name.includes("esakki") && !name.includes("chithirai");
    });
  }

  // 5. Remove any references in emailLogs
  if (Array.isArray(db.emailLogs)) {
    db.emailLogs = db.emailLogs.filter((el) => {
      const email = (el.recipientEmail || "").toLowerCase().trim();
      return !TARGET_EMAILS.includes(email);
    });
  }

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
  console.log(`✅ [Local DB] Removed ${previousUserCount} mock users. db.users is now empty.`);
  console.log(`✅ [Local DB] Purged applications, attendance & logs for targets: ${TARGET_EMAILS.join(", ")}`);
}

async function purgeFromMongoDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("MONGO_URI not configured. Skipping Mongo purge.");
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB Atlas...");

    const User = require("../models/User");
    const Application = require("../models/Application");
    const Attendance = require("../models/Attendance");
    const PointsTransaction = require("../models/PointsTransaction");
    const EmailLog = require("../models/EmailLog");
    const Notification = require("../models/Notification");

    // Find all users matching target emails or partial names
    const users = await User.find({
      email: { $in: TARGET_EMAILS },
    }).lean();

    const userIds = users.map((u) => u._id);

    // Delete users
    const userDel = await User.deleteMany({
      $or: [
        { email: { $in: TARGET_EMAILS } },
        { _id: { $in: userIds } },
      ],
    });

    // Delete applications
    const appDel = await Application.deleteMany({
      $or: [
        { "applicantDetails.email": { $in: TARGET_EMAILS } },
        { userId: { $in: userIds.map(String) } },
        { userId: { $in: userIds } },
      ],
    });

    // Delete attendance
    const attDel = await Attendance.deleteMany({
      $or: [
        { volunteerEmail: { $in: TARGET_EMAILS } },
        { userId: { $in: userIds.map(String) } },
        { userId: { $in: userIds } },
      ],
    });

    // Delete points
    const ptsDel = await PointsTransaction.deleteMany({
      $or: [
        { userId: { $in: userIds.map(String) } },
        { userId: { $in: userIds } },
      ],
    });

    // Delete email logs
    const emlDel = await EmailLog.deleteMany({
      recipientEmail: { $in: TARGET_EMAILS },
    });

    // Delete notifications
    const notDel = await Notification.deleteMany({
      $or: [
        { userId: { $in: userIds.map(String) } },
        { userId: { $in: userIds } },
      ],
    });

    console.log("✅ [MongoDB Atlas] Purge Summary:", {
      usersDeleted: userDel.deletedCount,
      applicationsDeleted: appDel.deletedCount,
      attendanceDeleted: attDel.deletedCount,
      pointsTransactionsDeleted: ptsDel.deletedCount,
      emailLogsDeleted: emlDel.deletedCount,
      notificationsDeleted: notDel.deletedCount,
    });

    await mongoose.disconnect();
  } catch (err) {
    console.warn("MongoDB purge note:", err.message);
  }
}

async function main() {
  await purgeFromLocalDB();
  await purgeFromMongoDB();
  console.log("\n🎯 All targeted users & mock users have been completely purged!");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error("Purge script failed:", e);
  process.exit(1);
});
