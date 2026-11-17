// backend/scripts/purgeUsers.js
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");

const dbPath = path.join(__dirname, "../data/db.json");

async function purgeFromLocalDB() {
  if (!fs.existsSync(dbPath)) return;
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

  const targetEmails = ["esakkimuthu2907@gmail.com", "esakkirajan00@gmail.com"];
  const targetRegs = ["2022CS0101", "13"];
  const targetNames = ["Esakkimuthu S", "Esakkirajan G", "Esakkirajan"];

  const matchedUserIds = [];
  const matchedAppIds = [];

  (db.users || []).forEach(u => {
    const emailMatch = u.email && targetEmails.includes(u.email.toLowerCase().trim());
    const regMatch = u.regNumber && targetRegs.includes(u.regNumber.trim());
    const nameMatch = u.fullName && targetNames.includes(u.fullName.trim());
    if (emailMatch || regMatch || nameMatch) {
      matchedUserIds.push((u._id || u.id || "").toString());
      if (u.applicationId) matchedAppIds.push(u.applicationId);
    }
  });

  console.log("Found matching users to purge:", matchedUserIds, matchedAppIds);

  // Filter users
  db.users = (db.users || []).filter(u => {
    const id = (u._id || u.id || "").toString();
    const email = (u.email || "").toLowerCase().trim();
    const reg = (u.regNumber || "").trim();
    const name = (u.fullName || "").trim();
    return !matchedUserIds.includes(id) && !targetEmails.includes(email) && !targetRegs.includes(reg) && !targetNames.includes(name);
  });

  // Filter applications
  db.applications = (db.applications || []).filter(a => {
    const uId = (a.userId || "").toString();
    const appId = a.applicationId;
    const aEmail = (a.applicantDetails?.email || "").toLowerCase().trim();
    const aReg = (a.applicantDetails?.regNumber || "").trim();
    const aName = (a.applicantDetails?.name || "").trim();
    return !matchedUserIds.includes(uId) && !matchedAppIds.includes(appId) && !targetEmails.includes(aEmail) && !targetRegs.includes(aReg) && !targetNames.includes(aName);
  });

  // Filter pointsTransactions
  db.pointsTransactions = (db.pointsTransactions || []).filter(t => {
    const uId = (t.userId || "").toString();
    const sName = (t.studentName || "").trim();
    const appId = t.applicationId;
    return !matchedUserIds.includes(uId) && !matchedAppIds.includes(appId) && !targetNames.includes(sName);
  });

  // Filter certificates
  db.certificates = (db.certificates || []).filter(c => {
    const uId = (c.userId || "").toString();
    const vEmail = (c.volunteerEmail || "").toLowerCase().trim();
    const vName = (c.volunteerName || "").trim();
    return !matchedUserIds.includes(uId) && !targetEmails.includes(vEmail) && !targetNames.includes(vName);
  });

  // Filter attendance
  db.attendance = (db.attendance || []).filter(att => {
    const uId = (att.userId || "").toString();
    const vEmail = (att.volunteerEmail || "").toLowerCase().trim();
    const vName = (att.volunteerName || "").trim();
    return !matchedUserIds.includes(uId) && !targetEmails.includes(vEmail) && !targetNames.includes(vName);
  });

  // Filter hourLogs
  db.hourLogs = (db.hourLogs || []).filter(h => {
    const uId = (h.userId || "").toString();
    return !matchedUserIds.includes(uId);
  });

  // Filter notifications
  db.notifications = (db.notifications || []).filter(n => {
    const uId = (n.userId || "").toString();
    const title = n.title || "";
    const msg = n.message || "";
    const mentionsName = targetNames.some(tn => title.includes(tn) || msg.includes(tn));
    return !matchedUserIds.includes(uId) && !mentionsName;
  });

  // Filter emailLogs
  db.emailLogs = (db.emailLogs || []).filter(e => {
    const recEmail = (e.recipientEmail || "").toLowerCase().trim();
    const recName = (e.recipientName || "").trim();
    return !targetEmails.includes(recEmail) && !targetNames.includes(recName);
  });

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
  console.log("✅ Successfully purged matching users and their records from db.json!");
  console.log("Remaining users count:", db.users.length);
}

async function purgeFromMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) return;
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB for purge...");

    const User = require("../models/User");
    const Application = require("../models/Application");
    const PointsTransaction = require("../models/PointsTransaction");
    const Certificate = require("../models/Certificate");
    const Attendance = require("../models/Attendance");
    const Notification = require("../models/Notification");
    const EmailLog = require("../models/EmailLog");

    const targetEmails = ["esakkimuthu2907@gmail.com", "esakkirajan00@gmail.com"];
    const targetRegs = ["2022CS0101", "13"];

    const usersToDelete = await User.find({
      $or: [
        { email: { $in: targetEmails } },
        { regNumber: { $in: targetRegs } },
        { fullName: { $in: ["Esakkimuthu S", "Esakkirajan G"] } }
      ]
    }).lean();

    const userIds = usersToDelete.map(u => u._id);
    console.log(`Found ${userIds.length} users in MongoDB to remove.`);

    if (userIds.length > 0) {
      await User.deleteMany({ _id: { $in: userIds } });
      await Application.deleteMany({ userId: { $in: userIds } });
      await PointsTransaction.deleteMany({ userId: { $in: userIds } });
      await Certificate.deleteMany({ userId: { $in: userIds } });
      await Attendance.deleteMany({ userId: { $in: userIds } });
      await Notification.deleteMany({ userId: { $in: userIds } });
      await EmailLog.deleteMany({ recipientEmail: { $in: targetEmails } });
      console.log("✅ Successfully purged from MongoDB Atlas!");
    }
    await mongoose.disconnect();
  } catch (err) {
    console.warn("MongoDB purge notice:", err.message);
  }
}

async function run() {
  await purgeFromLocalDB();
  await purgeFromMongo();
}

run();
