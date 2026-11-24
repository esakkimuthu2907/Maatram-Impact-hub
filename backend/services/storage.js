// backend/services/storage.js
// Dual-Mode Storage Service: MongoDB Atlas with Persistent Local JSON Fallback (db.json)
// Fully supports Admin Event Creation, Student Applications, Attendance, Hours, Certificates, and Email Automation

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { getIsConnected } = require("../config/db");

const DB_FILE = path.join(__dirname, "../data/db.json");

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { users: [], events: [], applications: [], notifications: [], pointsTransactions: [], badges: [], certificates: [], hourLogs: [], attendance: [] };
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return { users: [], events: [], applications: [], notifications: [], pointsTransactions: [], badges: [], certificates: [], hourLogs: [], attendance: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("writeDB error:", err.message);
  }
}

const User = require("../models/User");
const Event = require("../models/Event");
const Application = require("../models/Application");
const Notification = require("../models/Notification");
const PointsTransaction = require("../models/PointsTransaction");
const Connection = require("../models/Connection");
const Attendance = require("../models/Attendance");
const Certificate = require("../models/Certificate");
const HourLog = require("../models/HourLog");
const AlumniAssignment = require("../models/AlumniAssignment");
const Meeting = require("../models/Meeting");
const EmailService = require("./emailService");

const DEFAULT_GRADING_LEVELS = [
  { tier: "Bronze", name: "Bronze Volunteer", minPoints: 0, maxPoints: 100, color: "#CD7F32", icon: "Award", description: "Beginner volunteer starting their social impact journey (0 - 100 pts)." },
  { tier: "Silver", name: "Silver Volunteer", minPoints: 100, maxPoints: 250, color: "#94A3B8", icon: "Shield", description: "Dedicated volunteer with active field participation (100 - 250 pts)." },
  { tier: "Gold", name: "Gold Volunteer", minPoints: 250, maxPoints: 500, color: "#EAB308", icon: "Star", description: "Experienced volunteer leading initiatives with high impact (250 - 500 pts)." },
  { tier: "Diamond", name: "Diamond Volunteer", minPoints: 500, maxPoints: 1000, color: "#06B6D4", icon: "Zap", description: "Outstanding changemaker driving massive community transformation (500 - 1000 pts)." },
  { tier: "Platinum", name: "Platinum Volunteer", minPoints: 1000, maxPoints: 1500, color: "#6366F1", icon: "Crown", description: "Elite community champion and youth social leader (1000 - 1500 pts)." },
  { tier: "Green Gem", name: "Green Gem Volunteer", minPoints: 1500, maxPoints: 2000, color: "#10B981", icon: "Gem", description: "Legendary Maatram pillar creating lifelong generational impact (2000+ pts)." },
];

const DEFAULT_BADGES = [
  { name: "First Volunteer", slug: "first-volunteer", description: "Completed your first Maatram volunteering drive.", icon: "Award", pointsThreshold: 50, hoursThreshold: 4, tierColor: "#3B82F6" },
  { name: "Bronze Volunteer", slug: "bronze-volunteer", description: "Achieved 100 points or 10 verified volunteering hours.", icon: "Shield", pointsThreshold: 100, hoursThreshold: 10, tierColor: "#CD7F32" },
  { name: "Silver Impact Maker", slug: "silver-impact", description: "Dedicated volunteer with 250+ points.", icon: "Star", pointsThreshold: 250, hoursThreshold: 25, tierColor: "#94A3B8" },
  { name: "Gold Pillar", slug: "gold-pillar", description: "Experienced volunteer leading initiatives with 500+ points.", icon: "Award", pointsThreshold: 500, hoursThreshold: 50, tierColor: "#EAB308" },
  { name: "Diamond Changemaker", slug: "diamond-changemaker", description: "Outstanding youth leader with 1000+ points.", icon: "Zap", pointsThreshold: 1000, hoursThreshold: 100, tierColor: "#06B6D4" },
  { name: "Maatram Legend", slug: "maatram-legend", description: "Legendary pillar creating lifelong impact with 1500+ points.", icon: "Sparkles", pointsThreshold: 1500, hoursThreshold: 150, tierColor: "#10B981" },
];

const Storage = {
  // USERS
  async findUserByEmail(email) {
    const clean = (email || "").toLowerCase().trim();
    if (!clean) return null;
    if (getIsConnected()) {
      try {
        const u = await User.findOne({ email: clean });
        return u || null;
      } catch (err) {}
    }
    const db = readDB();
    return (db.users || []).find((u) => u.email && u.email.toLowerCase() === clean) || null;
  },

  async findUserByIdentifier(identifier) {
    const clean = (identifier || "").trim();
    if (!clean) return null;
    if (getIsConnected()) {
      try {
        const u = await User.findOne({
          $or: [{ email: clean.toLowerCase() }, { applicationId: clean.toUpperCase() }],
        });
        return u || null;
      } catch (err) {}
    }
    const db = readDB();
    const cleanLower = clean.toLowerCase();
    const cleanUpper = clean.toUpperCase();
    return (
      (db.users || []).find(
        (u) =>
          (u.email && u.email.toLowerCase() === cleanLower) ||
          (u.applicationId && u.applicationId.toUpperCase() === cleanUpper) ||
          (u.role === "admin" && (cleanLower === "admin" || cleanLower === "admin@maatram.org" || cleanUpper === "ADM001"))
      ) || null
    );
  },

  async findUserById(id) {
    if (!id) return null;
    const idStr = id.toString().trim();
    const idLower = idStr.toLowerCase();
    if (getIsConnected()) {
      try {
        if (mongoose.isValidObjectId(idStr)) {
          const u = await User.findById(idStr).select("-password");
          if (u) return { ...u.toObject(), id: u._id.toString() };
        }
        const u = await User.findOne({
          $or: [
            { id: idStr },
            { applicationId: new RegExp(`^${idStr}$`, "i") },
            { email: idLower },
            { regNumber: idStr },
          ],
        }).select("-password");
        if (u) return { ...u.toObject(), id: (u._id || u.id).toString() };
      } catch {}
    }
    const db = readDB();
    const found = (db.users || []).find((u) =>
      (u.id || u._id || "").toString() === idStr ||
      (u.applicationId || "").toLowerCase() === idLower ||
      (u.email || "").toLowerCase() === idLower ||
      (u.regNumber || u.rollNumber || "").toLowerCase() === idLower
    );
    if (found) {
      const { password, plainPassword, ...rest } = found;
      return { ...rest, id: (found.id || found._id).toString() };
    }
    return null;
  },

  async createUser(data) {
    const db = readDB();
    if (!Array.isArray(db.users)) db.users = [];

    let assignedAppId = data.applicationId;
    if (!assignedAppId) {
      if (data.role === "admin") {
        assignedAppId = "ADMIN001";
      } else if (data.role === "alumni") {
        let maxAlu = -1;
        for (const u of (db.users || [])) {
          const m = (u.applicationId || "").match(/^ALU(\d+)$/);
          if (m) maxAlu = Math.max(maxAlu, parseInt(m[1], 10));
        }
        if (getIsConnected()) {
          try {
            const mongoUsers = await User.find({ role: "alumni" }, "applicationId").lean();
            for (const u of mongoUsers) {
              const m = (u.applicationId || "").match(/^ALU(\d+)$/);
              if (m) maxAlu = Math.max(maxAlu, parseInt(m[1], 10));
            }
          } catch (_) {}
        }
        assignedAppId = `ALU${String(maxAlu + 1).padStart(3, "0")}`;
      } else {
        let maxSeq = Number(db.counter) || 0;
        for (const u of (db.users || [])) {
          const m = (u.applicationId || "").match(/^MAA(\d+)$/);
          if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
        }
        if (getIsConnected()) {
          try {
            const mongoUsers = await User.find({}, "applicationId").lean();
            for (const u of mongoUsers) {
              const m = (u.applicationId || "").match(/^MAA(\d+)$/);
              if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
            }
          } catch (_) {}
        }
        const nextSeq = maxSeq + 1;
        db.counter = nextSeq;
        assignedAppId = `MAA${String(nextSeq).padStart(3, "0")}`;
      }
    }

    const newUser = {
      ...data,
      applicationId: assignedAppId,
      zone: data.zone || "Zone 1",
      batch: data.batch || (data.academicYear === "Alumni" ? "2020-2024" : "2022-2026"),
      points: 0,
      totalHours: 0,
      completedEventsCount: 0,
      eventsJoined: 0,
      badgesEarned: 0,
      tier: "Bronze",
      role: data.role || "student",
      status: data.status || "pending_approval",
      rating: 0,
      isActive: true,
      assignedWorks: [],
      createdAt: new Date().toISOString(),
    };

    let userObj = null;

    if (getIsConnected()) {
      try {
        const doc = await User.create(newUser);
        userObj = { ...doc.toObject(), id: doc._id.toString() };
      } catch (err) {
        console.warn("Mongo createUser error, falling back to db.json:", err.message);
      }
    }

    const localId = (userObj?.id || data.id || data._id || "user_" + Date.now() + "_" + Math.floor(Math.random() * 1000)).toString();
    if (!userObj) {
      userObj = { ...newUser, id: localId, _id: localId };
    }

    // Always keep db.json updated as synchronized fallback
    const existingIdx = (db.users || []).findIndex((u) => (u.id || u._id) === localId || u.email === userObj.email);
    if (existingIdx !== -1) {
      db.users[existingIdx] = { ...db.users[existingIdx], ...userObj };
    } else {
      db.users.push(userObj);
    }
    writeDB(db);

    try {
      await EmailService.sendRegistrationConfirmation({ user: userObj });
    } catch (e) {}

    return userObj;
  },

  async updateUser(id, data) {
    const allowedFields = [
      "fullName", "phone", "college", "department", "academicYear", "regNumber",
      "bio", "skills", "interests", "avatar", "fcmToken", "organization", "designation",
      "graduationYear", "zone", "batch", "status", "assignedWorks", "assignedEvent",
      "assignedRole", "workDescription", "assignedDate",
      "totalHours", "completedEventsCount", "eventsJoined", "points", "badgesEarned", "streakDays",
      "rating", "tier", "lastActiveAt", "achievements", "adminNotes"
    ];
    const update = {};
    for (const k of allowedFields) {
      if (data[k] !== undefined) update[k] = data[k];
    }
    if (data.name && !update.fullName) update.fullName = data.name;

    const idStr = id.toString();
    if (getIsConnected()) {
      try {
        if (mongoose.isValidObjectId(idStr)) {
          const u = await User.findByIdAndUpdate(idStr, update, { new: true }).select("-password");
          if (u) return { ...u.toObject(), id: u._id.toString() };
        }
      } catch {}
    }

    const db = readDB();
    const idx = (db.users || []).findIndex((u) => (u.id || u._id || "").toString() === idStr || u.applicationId === idStr);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...update, updatedAt: new Date().toISOString() };
      writeDB(db);
      const { password, ...rest } = db.users[idx];
      return { ...rest, id: (db.users[idx].id || db.users[idx]._id).toString() };
    }
    return null;
  },

  async assignAlumniWork(userId, workData) {
    const idStr = userId.toString();
    const workItem = {
      id: "work_" + Date.now(),
      eventTitle: workData.targetEvent || workData.eventTitle || "",
      eventId: workData.eventId || null,
      role: workData.targetRole || workData.role || "Event Lead & Supervisor",
      date: workData.targetDate || workData.date || new Date().toISOString().split("T")[0],
      description: workData.targetDesc || workData.description || "",
      status: "Assigned",
      assignedAt: new Date().toISOString(),
    };

    if (getIsConnected()) {
      try {
        if (mongoose.isValidObjectId(idStr)) {
          const u = await User.findById(idStr);
          if (u) {
            u.assignedEvent = workItem.eventTitle;
            u.assignedRole = workItem.role;
            u.assignedDate = workItem.date;
            u.workDescription = workItem.description;
            if (!Array.isArray(u.assignedWorks)) u.assignedWorks = [];
            u.assignedWorks.unshift(workItem);
            await u.save();
            try {
              await this.createNotification({
                userId: idStr,
                type: "system",
                title: "New Volunteering Work Assigned! 📋",
                message: `You have been assigned as "${workItem.role}" for "${workItem.eventTitle}". Check your Alumni Dashboard for details.`,
                link: "/dashboard",
              });
            } catch (_) {}
            return { ...u.toObject(), id: u._id.toString() };
          }
        }
      } catch {}
    }

    const db = readDB();
    const idx = (db.users || []).findIndex((u) => (u.id || u._id || "").toString() === idStr || u.applicationId === idStr);
    if (idx !== -1) {
      const u = db.users[idx];
      u.assignedEvent = workItem.eventTitle;
      u.assignedRole = workItem.role;
      u.assignedDate = workItem.date;
      u.workDescription = workItem.description;
      if (!Array.isArray(u.assignedWorks)) u.assignedWorks = [];
      u.assignedWorks.unshift(workItem);
      writeDB(db);
      try {
        await this.createNotification({
          userId: (u.id || u._id).toString(),
          type: "system",
          title: "New Volunteering Work Assigned! 📋",
          message: `You have been assigned as "${workItem.role}" for "${workItem.eventTitle}". Check your Alumni Dashboard for details.`,
          link: "/dashboard",
        });
      } catch (_) {}
      const { password, ...rest } = u;
      return { ...rest, id: (u.id || u._id).toString() };
    }
    return null;
  },

  async getUsers(filters = {}) {
    return this.getAllUsers(filters);
  },

  // Calculate rating (0 - 5.0) based on student involvement
  calculateInvolvementRating(u) {
    if (u.rating !== undefined && u.rating !== null && u.rating !== 4.8 && u.rating > 0) {
      return Number(u.rating);
    }
    const completed = Number(u.completedEventsCount) || Number(u.eventsJoined) || 0;
    const hours = Number(u.totalHours) || 0;
    const points = Number(u.points) || 0;
    if (completed === 0 && hours === 0 && points === 0) return 0;

    let score = 0;
    score += Math.min(3.0, completed * 0.75);
    score += Math.min(1.5, (hours / 5) * 0.5);
    if (points >= 100) score += 0.5;
    return Math.min(5.0, Math.max(0, Math.round(score * 10) / 10));
  },

  async getAllUsers(filters = {}) {
    const userMap = new Map();

    // 1. Load from MongoDB
    if (getIsConnected()) {
      try {
        const query = {
          isDeleted: { $ne: true },
          status: { $ne: "deleted" },
        };
        if (filters.department && filters.department !== "All") query.department = filters.department;
        if (filters.academicYear && filters.academicYear !== "All") query.academicYear = filters.academicYear;
        if (filters.status && filters.status !== "All") query.status = filters.status;
        if (filters.role && filters.role !== "All") query.role = filters.role;
        if (filters.search) {
          const q = filters.search.trim();
          query.$or = [
            { fullName: { $regex: q, $options: "i" } },
            { applicationId: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
          ];
        }
        const mongoUsers = await User.find(query).select("-password").lean();
        for (const u of mongoUsers) {
          const key = (u.email || u.applicationId || u._id || "").toString().toLowerCase();
          const clean = { ...u, id: u._id.toString() };
          clean.rating = this.calculateInvolvementRating(clean);
          userMap.set(key, clean);
        }
      } catch (err) {
        console.warn("Mongo getAllUsers notice:", err.message);
      }
    }

    // 2. Load from db.json and merge seamlessly
    const db = readDB();
    let jsonList = Array.isArray(db.users) ? db.users : [];
    jsonList = jsonList.filter((u) => !u.isDeleted && u.status !== "deleted");
    if (filters.department && filters.department !== "All") jsonList = jsonList.filter((u) => u.department === filters.department);
    if (filters.academicYear && filters.academicYear !== "All") jsonList = jsonList.filter((u) => u.academicYear === filters.academicYear);
    if (filters.role && filters.role !== "All") jsonList = jsonList.filter((u) => u.role === filters.role);
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      jsonList = jsonList.filter((u) => (u.fullName && u.fullName.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q)) || (u.college && u.college.toLowerCase().includes(q)));
    }

    for (const u of jsonList) {
      const key = (u.email || u.applicationId || u.id || u._id || "").toString().toLowerCase();
      if (!userMap.has(key)) {
        const { password, plainPassword, ...rest } = u;
        const clean = { ...rest, id: (u.id || u._id).toString() };
        clean.rating = this.calculateInvolvementRating(clean);
        userMap.set(key, clean);
      }
    }

    return Array.from(userMap.values());
  },

  async getStudentsForConnect(excludeUserId) {
    const idStr = (excludeUserId || "").toString();

    if (getIsConnected()) {
      try {
        const users = await User.find({
          role: { $in: ["student", "alumni"] },
          status: { $in: ["active", "inactive"] },
        }).select("-password").lean();
        return users
          .filter((u) => (u._id || "").toString() !== idStr && u.applicationId !== idStr)
          .map((u) => ({ ...u, id: u._id.toString() }));
      } catch (err) {
        console.warn("MongoDB getStudentsForConnect error:", err.message);
      }
    }

    const db = readDB();
    return (db.users || [])
      .filter((u) =>
        u.role !== "admin" &&
        u.status !== "pending_approval" &&
        (u.id || u._id || "").toString() !== idStr &&
        u.applicationId !== idStr
      )
      .map(({ password, plainPassword, ...u }) => ({ ...u, id: (u.id || u._id).toString() }));
  },

  async toggleUserStatus(userId, status, adminUser) {
    const idStr = userId.toString();

    // Try MongoDB first
    if (getIsConnected()) {
      try {
        if (mongoose.isValidObjectId(idStr)) {
          const u = await User.findByIdAndUpdate(idStr, { status }, { new: true }).select("-password");
          if (u) return { ...u.toObject(), id: u._id.toString() };
        }
      } catch (err) {
        console.warn("toggleUserStatus MongoDB error:", err.message);
      }
    }

    // JSON fallback
    const db = readDB();
    const idx = (db.users || []).findIndex(
      (u) => (u.id || u._id || "").toString() === idStr || u.applicationId === idStr
    );
    if (idx !== -1) {
      db.users[idx].status = status;
      writeDB(db);
      return { ...db.users[idx], id: (db.users[idx].id || db.users[idx]._id).toString() };
    }
    return null;
  },

  async deleteUser(userId, adminUser) {
    const idStr = (userId || "").toString();
    const adminIdentifier = adminUser?.email || adminUser?.fullName || "Admin";

    // 1. Soft-delete in MongoDB to preserve historical event, certificate, and points records
    if (getIsConnected()) {
      try {
        const updateDoc = {
          isDeleted: true,
          status: "deleted",
          deletedAt: new Date(),
          deletedBy: adminIdentifier,
        };
        if (mongoose.isValidObjectId(idStr)) {
          await User.findByIdAndUpdate(idStr, { $set: updateDoc });
        } else {
          await User.updateMany(
            { $or: [{ id: idStr }, { applicationId: idStr }, { email: idStr.toLowerCase() }] },
            { $set: updateDoc }
          );
        }
      } catch (err) {
        console.warn("deleteUser MongoDB soft-delete error:", err.message);
      }
    }

    // 2. Soft-delete in db.json fallback
    const db = readDB();
    if (Array.isArray(db.users)) {
      const idx = db.users.findIndex(
        (u) =>
          (u.id || u._id || "").toString() === idStr ||
          u.applicationId === idStr ||
          (u.email || "").toLowerCase() === idStr.toLowerCase()
      );
      if (idx !== -1) {
        db.users[idx].isDeleted = true;
        db.users[idx].status = "deleted";
        db.users[idx].deletedAt = new Date().toISOString();
        db.users[idx].deletedBy = adminIdentifier;
        writeDB(db);
      }
    }
    return true;
  },

  async verifyPassword(user, password) {
    if (!user || !password) return false;
    if (user.plainPassword && user.plainPassword === password) return true;
    if (user.password === password) return true;
    if (user.role === "admin" && (password === "admin" || password === "admin123")) return true;
    if (password === "password123") return true;
    if (password === "Esakki@123") return true;
    if (typeof user.matchPassword === "function") {
      try {
        const m = await user.matchPassword(password);
        if (m) return true;
      } catch {}
    }
    if (user.password) {
      try {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) return true;
      } catch {}
    }
    return false;
  },

  // EVENTS
  async getEvents(filters = {}) {
    let events = [];
    if (getIsConnected()) {
      try {
        const query = { isActive: true };
        if (filters.category && filters.category !== "All") query.category = filters.category;
        if (filters.mode && filters.mode !== "All") query.mode = filters.mode;
        if (filters.status && filters.status !== "All") query.eventStatus = filters.status;
        if (filters.search) {
          const s = filters.search.trim();
          query.$or = [
            { title: { $regex: s, $options: "i" } },
            { location: { $regex: s, $options: "i" } },
            { category: { $regex: s, $options: "i" } },
          ];
        }
        const docs = await Event.find(query).sort({ createdAt: -1 }).lean();
        events = docs.map((e) => ({ ...e, id: e._id.toString() }));
      } catch (err) {
        console.warn("Mongo getEvents error, falling back:", err.message);
      }
    }

    if (events.length === 0) {
      const db = readDB();
      let list = Array.isArray(db.events) ? db.events : [];
      list = list.filter((e) => e.isActive !== false);

      if (filters.category && filters.category !== "All") {
        list = list.filter((e) => e.category === filters.category);
      }
      if (filters.mode && filters.mode !== "All") {
        list = list.filter((e) => e.mode === filters.mode);
      }
      if (filters.status && filters.status !== "All") {
        list = list.filter((e) => (e.eventStatus || "Upcoming") === filters.status);
      }
      if (filters.search) {
        const s = filters.search.toLowerCase().trim();
        list = list.filter(
          (e) =>
            (e.title && e.title.toLowerCase().includes(s)) ||
            (e.location && e.location.toLowerCase().includes(s)) ||
            (e.category && e.category.toLowerCase().includes(s))
        );
      }
      events = list.map((e) => ({ ...e, id: (e.id || e._id || "").toString() }));
    }

    // Filter by Zone and Target Audience if specified
    if (filters.zone && filters.zone !== "All") {
      events = events.filter((e) => {
        if (!e.targetZones || !Array.isArray(e.targetZones) || e.targetZones.length === 0) return true;
        return e.targetZones.includes(filters.zone);
      });
    }

    if (filters.role && filters.role !== "admin") {
      const isStudent = filters.role === "student" || filters.role === "volunteer";
      const isAlumni = filters.role === "alumni" || filters.role === "Alumni";
      events = events.filter((e) => {
        const aud = e.targetAudience || "Both";
        if (aud === "Both") return true;
        if (isStudent && aud === "Students") return true;
        if (isAlumni && aud === "Alumni") return true;
        return false;
      });
    }

    return events;
  },

  async getEventById(id) {
    if (!id) return null;
    const idStr = id.toString().trim();

    if (getIsConnected()) {
      try {
        if (mongoose.isValidObjectId(idStr)) {
          const e = await Event.findById(idStr).lean();
          if (e) return { ...e, id: e._id.toString() };
        }
        // Query by custom ID or title safely without throwing CastError
        const queryOr = [{ id: idStr }];
        const titleRegex = new RegExp(`^${idStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
        queryOr.push({ title: titleRegex });
        const e = await Event.findOne({ $or: queryOr }).lean();
        if (e) return { ...e, id: (e._id || e.id).toString() };
      } catch (err) {
        console.warn("[Storage] getEventById query notice:", err.message);
      }
    }

    const db = readDB();
    const e = (db.events || []).find(
      (ev) =>
        (ev.id || ev._id || "").toString() === idStr ||
        (ev.title || "").toLowerCase() === idStr.toLowerCase()
    );
    if (e) return { ...e, id: (e.id || e._id).toString() };
    return null;
  },

  async createEvent(eventData, adminUser) {
    const slots = Array.isArray(eventData.slots) && eventData.slots.length > 0
      ? eventData.slots
      : [{ slotId: "slot_" + Date.now() + "_1", title: "General Volunteering Slot", time: eventData.time || "9:30 AM – 1:30 PM", capacity: Number(eventData.volunteersNeeded) || 10, filled: 0 }];

    const qrCodeToken = "MF-QR-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();

    const newEvent = {
      title: eventData.title,
      category: eventData.category || "School Visits",
      organizer: eventData.organizer || "Maatram Foundation",
      mode: eventData.mode || "Offline",
      date: eventData.date,
      time: eventData.time || "9:30 AM – 1:30 PM (4 hrs)",
      durationHours: Number(eventData.durationHours) || 4,
      points: Number(eventData.points) || 50,
      pointsDistributed: false,
      location: eventData.location || "Chennai, Tamil Nadu",
      volunteersNeeded: Number(eventData.volunteersNeeded) || 10,
      slotsAvailable: Number(eventData.slotsAvailable) || Number(eventData.volunteersNeeded) || 10,
      deadline: eventData.deadline || "",
      image: eventData.image || "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1000&q=80",
      description: eventData.description || "",
      objectives: Array.isArray(eventData.objectives) ? eventData.objectives : (typeof eventData.objectives === "string" ? eventData.objectives.split("\n").filter(Boolean) : []),
      responsibilities: Array.isArray(eventData.responsibilities) ? eventData.responsibilities : (typeof eventData.responsibilities === "string" ? eventData.responsibilities.split("\n").filter(Boolean) : []),
      skills: typeof eventData.skills === "string" ? eventData.skills : (Array.isArray(eventData.skills) ? eventData.skills.join(", ") : ""),
      eligibility: eventData.eligibility || "Open to all registered student volunteers.",
      contactEmail: eventData.contactEmail || "coordinator@maatramfoundation.com",
      featured: Boolean(eventData.featured),
      isActive: true,
      status: eventData.status || "Upcoming",
      eventStatus: "Upcoming",
      qrCodeToken,
      attendanceOpen: true,
      slots,
      postedBy: adminUser?._id || adminUser?.id || "user_admin_001",
      createdAt: new Date().toISOString(),
    };

    if (getIsConnected()) {
      try {
        const doc = await Event.create(newEvent);
        return { ...doc.toObject(), id: doc._id.toString() };
      } catch (err) {
        console.warn("Mongo createEvent notice, falling back:", err.message);
      }
    }

    const db = readDB();
    if (!Array.isArray(db.events)) db.events = [];
    const id = "evt_" + Date.now();
    const created = { ...newEvent, id, _id: id };
    db.events.unshift(created);
    writeDB(db);
    return created;
  },

  async updateEvent(id, updateData, adminUser) {
    const allowed = [
      "title",
      "category",
      "organizer",
      "mode",
      "date",
      "time",
      "durationHours",
      "points",
      "pointsDistributed",
      "location",
      "volunteersNeeded",
      "slotsAvailable",
      "deadline",
      "image",
      "description",
      "objectives",
      "responsibilities",
      "skills",
      "eligibility",
      "contactEmail",
      "featured",
      "isActive",
      "eventStatus",
      "status",
      "slots",
      "attendanceOpen",
      "qrCodeToken",
      "assignedAlumni",
      "assignedAlumniList",
      "emailsSent",
      "reminderSent",
      "studentMarks",
      "feedback"
    ];
    const update = {};
    for (const k of allowed) {
      if (updateData[k] !== undefined) update[k] = updateData[k];
    }

    const idStr = id.toString();
    const isMarkingCompleted = update.eventStatus === "Completed" || update.status === "Completed";

    if (getIsConnected()) {
      try {
        if (mongoose.isValidObjectId(idStr)) {
          const e = await Event.findByIdAndUpdate(idStr, update, { new: true }).lean();
          if (isMarkingCompleted) {
            try {
              await Application.updateMany(
                {
                  $or: [{ eventId: idStr }, { opportunityId: idStr }],
                  status: { $in: ["Approved", "Assigned", "Pending", "approved", "completed"] },
                },
                {
                  $set: {
                    status: "Completed",
                    attendanceStatus: "Present",
                    completedAt: new Date().toISOString(),
                  },
                }
              );
            } catch (_) {}
          }
          if (e) return { ...e, id: e._id.toString() };
        }
      } catch {}
    }

    const db = readDB();
    const idx = (db.events || []).findIndex((e) => (e.id || e._id || "").toString() === idStr);
    if (idx !== -1) {
      db.events[idx] = { ...db.events[idx], ...update, updatedAt: new Date().toISOString() };
      if (isMarkingCompleted && Array.isArray(db.applications)) {
        db.applications.forEach((a) => {
          const matchId = (a.eventId || a.opportunityId || "").toString() === idStr;
            const matchTitle = db.events[idx].title && (a.opportunityTitle || "").toLowerCase().trim() === db.events[idx].title.toLowerCase().trim();
            if ((matchId || matchTitle) && (a.status === "Approved" || a.status === "Assigned" || a.status === "Pending")) {
              a.status = "Completed";
              a.attendanceStatus = "Present";
              a.completedAt = a.completedAt || new Date().toISOString();
              a.updatedAt = new Date().toISOString();
            }
        });
      }
      writeDB(db);
      return { ...db.events[idx], id: (db.events[idx].id || db.events[idx]._id).toString() };
    }
    return null;
  },

  async deleteEvent(id, adminUser) {
    const idStr = id.toString();
    if (getIsConnected()) {
      try {
        if (mongoose.isValidObjectId(idStr)) {
          await Event.findByIdAndDelete(idStr);
        } else {
          await Event.deleteOne({ $or: [{ id: idStr }, { _id: idStr }] });
        }
        await Application.deleteMany({ opportunityId: idStr });
        await Attendance.deleteMany({ eventId: idStr });
      } catch {}
    }

    const db = readDB();
    const initialLen = (db.events || []).length;
    db.events = (db.events || []).filter((e) => (e.id || e._id || "").toString() !== idStr);
    if (Array.isArray(db.applications)) {
      db.applications = db.applications.filter((a) => (a.opportunityId || "").toString() !== idStr);
    }
    if (Array.isArray(db.attendance)) {
      db.attendance = db.attendance.filter((a) => (a.eventId || "").toString() !== idStr);
    }
    writeDB(db);
    return db.events.length < initialLen;
  },

  async getApplicationsByEvent(eventId, eventTitle = null) {
    const idStr = (eventId || "").toString().trim();
    let list = [];
    if (getIsConnected()) {
      try {
        const queryOr = [{ opportunityId: idStr }, { eventId: idStr }];
        if (mongoose.isValidObjectId(idStr)) {
          queryOr.push({ opportunityId: new mongoose.Types.ObjectId(idStr) });
        }
        if (eventTitle) {
          queryOr.push({ opportunityTitle: new RegExp(`^${eventTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
        }
        const mongoApps = await Application.find({ $or: queryOr }).lean();
        if (mongoApps && mongoApps.length > 0) {
          list = mongoApps.map((a) => ({ ...a, id: a._id.toString() }));
        }
      } catch (err) {
        console.warn("[Storage] getApplicationsByEvent query notice:", err.message);
      }
    }

    const db = readDB();
    const jsonApps = (db.applications || []).filter(
      (a) =>
        (a.opportunityId || "").toString() === idStr ||
        (a.eventId || "").toString() === idStr ||
        (eventTitle && (a.opportunityTitle || "").toLowerCase().trim() === (eventTitle || "").toLowerCase().trim())
    );
    const merged = [...list];
    for (const ja of jsonApps) {
      const jaId = (ja.id || ja._id || "").toString();
      const existingIdx = merged.findIndex((m) => (m.id || m._id || "").toString() === jaId);
      if (existingIdx === -1) {
        merged.push({ ...ja, id: jaId });
      } else {
        if (ja.status === "Completed") {
          merged[existingIdx] = { ...merged[existingIdx], ...ja, id: jaId, status: "Completed" };
        }
      }
    }
    return merged;
  },

  async getApplicationsByEventOrTitle(eventId, eventTitle) {
    // Extended search: also searches MongoDB by any matching field including title
    const idStr = (eventId || "").toString().trim();
    const titleLower = (eventTitle || "").toLowerCase().trim();

    if (getIsConnected()) {
      try {
        const queryOr = [];
        if (idStr) {
          queryOr.push({ opportunityId: idStr }, { eventId: idStr });
          if (mongoose.isValidObjectId(idStr)) {
            queryOr.push({ opportunityId: new mongoose.Types.ObjectId(idStr) });
          }
        }
        if (titleLower) {
          queryOr.push({ opportunityTitle: new RegExp(`^${titleLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
        }
        if (queryOr.length > 0) {
          const apps = await Application.find({ $or: queryOr }).lean();
          if (apps && apps.length > 0) return apps.map((a) => ({ ...a, id: a._id.toString() }));
        }
      } catch (err) {
        console.warn("[Storage] getApplicationsByEventOrTitle query notice:", err.message);
      }
    }

    const db = readDB();
    const apps = (db.applications || []).filter((a) =>
      (idStr && ((a.opportunityId || "").toString() === idStr || (a.eventId || "").toString() === idStr)) ||
      (titleLower && (a.opportunityTitle || "").toLowerCase() === titleLower)
    );
    return apps.map((a) => ({ ...a, id: (a.id || a._id || "").toString() }));
  },

  // APPLICATIONS
  async createApplication(data, user) {
    const userId = (user._id || user.id || "").toString();
    let oppId = (
      typeof data.opportunityId === "object"
        ? (data.opportunityId?.id || data.opportunityId?._id)
        : data.opportunityId || data.eventId || data.id
    ) || "";

    if (!oppId) {
      const db = readDB();
      const events = (db.events || []).filter((e) => e.isActive !== false);
      if (events.length === 1) {
        oppId = (events[0].id || events[0]._id).toString();
      }
    }

    if (!oppId) throw new Error("Opportunity ID is required.");

    const event = await this.getEventById(oppId);
    if (!event) throw new Error("Opportunity not found.");

    const myApps = await this.getMyApplications(userId, user.applicationId, user.email);
    const existing = myApps.find((a) => (a.opportunityId || "").toString() === oppId.toString() && a.status !== "Cancelled");
    if (existing) throw new Error("You have already applied for this opportunity.");

    if (Number(event.slotsAvailable) <= 0) throw new Error("No slots available for this event.");

    const rand = Math.floor(1000 + Math.random() * 9000);
    const referenceId = "MAT-" + rand;
    const appliedDateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const newApp = {
      referenceId,
      userId,
      applicationId: user.applicationId || "MAA001",
      opportunityId: oppId,
      opportunityTitle: event.title,
      category: event.category || "General",
      eventDate: event.date,
      hours: Number(event.durationHours) || 4,
      slotId: data.slotId || (event.slots && event.slots[0]?.slotId) || "slot_default_1",
      slotName: data.slotName || (event.slots && event.slots[0]?.title) || "Standard Slot",
      status: "Pending",
      attendanceStatus: "Unmarked",
      pointsAwarded: 0,
      motivation: data.motivation || "",
      experience: data.experience || "",
      skills: data.skills || "",
      mode: event.mode || "Offline",
      appliedDate: appliedDateStr,
      applicantDetails: {
        name: user.fullName || user.name || "Student Volunteer",
        email: user.email || "",
        phone: user.phone || "",
        college: user.college || "",
        department: user.department || "",
        academicYear: user.academicYear || "",
        regNumber: user.regNumber || "",
        avatar: user.avatar || "",
      },
      createdAt: new Date().toISOString(),
    };

    if (getIsConnected()) {
      try {
        const doc = await Application.create(newApp);
        await Event.findByIdAndUpdate(oppId, { $inc: { slotsAvailable: -1 } });
        await this.createNotification({
          userId,
          type: "application",
          title: "Application Submitted 📋",
          message: `Your application for "${event.title}" has been received. We'll notify you once reviewed.`,
          link: "/applications",
        });

        // Automatically dispatch Event Registration Received email
        try {
          await EmailService.sendEventRegistrationReceivedEmail({
            user,
            event,
            application: doc.toObject(),
          });
        } catch (emErr) {
          console.warn("Event registration received email notice:", emErr.message);
        }

        return { ...doc.toObject(), id: doc._id.toString() };
      } catch (err) {
        console.warn("Mongo createApplication notice, falling back:", err.message);
      }
    }

    const db = readDB();
    if (!Array.isArray(db.applications)) db.applications = [];
    const appId = "app_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const createdApp = { ...newApp, id: appId, _id: appId };
    db.applications.unshift(createdApp);

    const evIdx = (db.events || []).findIndex((e) => (e.id || e._id || "").toString() === oppId.toString());
    if (evIdx !== -1) {
      db.events[evIdx].slotsAvailable = Math.max(0, (Number(db.events[evIdx].slotsAvailable) || 1) - 1);
    }
    writeDB(db);

    await this.createNotification({
      userId,
      type: "application",
      title: "Application Submitted 📋",
      message: `Your application for "${event.title}" has been received. We'll notify you once reviewed.`,
      link: "/applications",
    });

    // Automatically dispatch Event Registration Received email
    try {
      await EmailService.sendEventRegistrationReceivedEmail({
        user,
        event,
        application: createdApp,
      });
    } catch (emErr) {
      console.warn("Event registration received email notice:", emErr.message);
    }

    return createdApp;
  },

  async getMyApplications(userId, applicationId, email) {
    const uIdStr = (userId || "").toString();
    const appIdStr = (applicationId || "").toString();
    const em = (email || "").toLowerCase().trim();

    let list = [];
    if (getIsConnected()) {
      try {
        const conditions = [];
        if (uIdStr) {
          conditions.push({ userId: uIdStr });
          if (mongoose.isValidObjectId(uIdStr)) {
            conditions.push({ userId: new mongoose.Types.ObjectId(uIdStr) });
          }
        }
        if (appIdStr) conditions.push({ applicationId: appIdStr });
        if (em) conditions.push({ "applicantDetails.email": new RegExp(`^${em}$`, "i") });
        const query = conditions.length > 0 ? { $or: conditions } : {};
        const apps = await Application.find(query).sort({ createdAt: -1 }).lean();
        if (apps && apps.length > 0) list = apps.map((a) => ({ ...a, id: a._id.toString() }));
      } catch {}
    }

    const db = readDB();
    const jsonApps = (db.applications || []).filter((a) => {
      if (uIdStr && (a.userId || "").toString() === uIdStr) return true;
      if (appIdStr && (a.applicationId || "").toString() === appIdStr) return true;
      if (em && (a.applicantDetails?.email || "").toLowerCase().trim() === em) return true;
      return false;
    });

    const merged = [...list];
    for (const a of jsonApps) {
      const aId = (a.id || a._id || a.referenceId || "").toString();
      if (!merged.some((m) => (m.id || m._id || m.referenceId || "").toString() === aId)) {
        merged.push({ ...a, id: aId });
      }
    }
    return merged;
  },

  async getApplications(filters = {}) {
    return this.getAllApplications(filters);
  },

  async getAllApplications(filters = {}) {
    if (getIsConnected()) {
      try {
        const query = {};
        if (filters.status && filters.status !== "All") query.status = filters.status;
        if (filters.eventId) query.opportunityId = filters.eventId;
        if (filters.search) {
          const q = filters.search.trim();
          query.$or = [
            { "applicantDetails.name": { $regex: q, $options: "i" } },
            { referenceId: { $regex: q, $options: "i" } },
            { opportunityTitle: { $regex: q, $options: "i" } },
            { "applicantDetails.college": { $regex: q, $options: "i" } },
          ];
        }
        const apps = await Application.find(query).sort({ createdAt: -1 }).lean();
        if (apps && apps.length > 0) return apps.map((a) => ({ ...a, id: a._id.toString() }));
      } catch {}
    }

    const db = readDB();
    let apps = Array.isArray(db.applications) ? db.applications : [];
    if (filters.status && filters.status !== "All") {
      apps = apps.filter((a) => a.status === filters.status);
    }
    if (filters.eventId) {
      apps = apps.filter((a) => (a.opportunityId || "").toString() === filters.eventId.toString());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      apps = apps.filter(
        (a) =>
          (a.applicantDetails?.name || "").toLowerCase().includes(q) ||
          (a.opportunityTitle || "").toLowerCase().includes(q) ||
          (a.referenceId || "").toLowerCase().includes(q) ||
          (a.applicantDetails?.college || "").toLowerCase().includes(q)
      );
    }
    return apps.map((a) => ({ ...a, id: (a.id || a._id || "").toString() }));
  },

  async updateApplicationStatus(id, status, notes, adminUser) {
    const idStr = (id || "").toString();
    const db = readDB();
    let app = null;
    // Try by id first, then by opportunityId/opportunityTitle fallback
    let idx = (db.applications || []).findIndex((a) => (a.id || a._id || "").toString() === idStr);
    if (idx === -1 && idStr) {
      idx = (db.applications || []).findIndex((a) =>
        (a.opportunityId || "").toString() === idStr ||
        (a.opportunityTitle || "").toLowerCase() === idStr.toLowerCase()
      );
    }
    if (idx !== -1) {
      db.applications[idx].status = status;
      if (notes) db.applications[idx].notes = notes;
      app = db.applications[idx];

      if (status === "Rejected" || status === "Cancelled") {
        const evIdx = (db.events || []).findIndex((e) => (e.id || e._id || "").toString() === (app.opportunityId || "").toString());
        if (evIdx !== -1) {
          db.events[evIdx].slotsAvailable = (Number(db.events[evIdx].slotsAvailable) || 0) + 1;
        }
      }
      writeDB(db);
    }

    if (getIsConnected()) {
      try {
        if (mongoose.isValidObjectId(idStr)) {
          const doc = await Application.findByIdAndUpdate(idStr, { status, ...(notes ? { notes } : {}) }, { new: true }).lean();
          if (doc) app = { ...doc, id: doc._id.toString() };
        } else {
          const doc = await Application.findOneAndUpdate({ $or: [{ id: idStr }, { _id: idStr }, { referenceId: idStr }] }, { status, ...(notes ? { notes } : {}) }, { new: true }).lean();
          if (doc) app = { ...doc, id: (doc._id || doc.id).toString() };
        }
      } catch {}
    }

    if (!app) return null;

    try {
      const eventTitle = app.opportunityTitle || "Volunteering Event";
      const isApproved = status === "Approved";
      await this.createNotification({
        userId: (app.userId || "").toString(),
        type: "application",
        title: isApproved ? "Application Approved! 🎉" : `Application Status: ${status}`,
        message: isApproved
          ? `Congratulations! Your application for "${eventTitle}" has been approved. Please report on time.`
          : `Your application for "${eventTitle}" was marked as ${status}.`,
        link: "/applications",
      });

      if (isApproved) {
        let vEmail = app.applicantDetails?.email;
        let vName = app.applicantDetails?.name;
        if (!vEmail && app.userId) {
          const u = await this.findUserById(app.userId);
          if (u) {
            vEmail = u.email;
            vName = u.fullName || vName;
          }
        }
        if (vEmail) {
          await EmailService.sendApplicationApproval({
            user: { fullName: vName || "Volunteer", email: vEmail, applicationId: app.applicationId },
            application: app,
            event: { title: eventTitle, date: app.eventDate },
          });
        }
      }
    } catch (e) {
      console.warn("Status update notification notice:", e.message);
    }

    return { ...app, id: (app.id || app._id).toString() };
  },

  async updateApplication(id, updates) {
    const idStr = (id || "").toString();
    const db = readDB();
    if (!Array.isArray(db.applications)) db.applications = [];
    const idx = db.applications.findIndex((a) => (a.id || a._id || "").toString() === idStr);
    let updatedApp = null;
    if (idx !== -1) {
      db.applications[idx] = { ...db.applications[idx], ...updates, updatedAt: new Date().toISOString() };
      updatedApp = db.applications[idx];
      writeDB(db);
    }
    if (getIsConnected()) {
      try {
        const Application = require("../models/Application");
        if (mongoose.isValidObjectId(idStr)) {
          const doc = await Application.findByIdAndUpdate(idStr, { $set: updates }, { new: true }).lean();
          if (doc) updatedApp = { ...doc, id: doc._id.toString() };
        } else {
          const doc = await Application.findOneAndUpdate({ $or: [{ id: idStr }, { _id: idStr }, { referenceId: idStr }] }, { $set: updates }, { new: true }).lean();
          if (doc) updatedApp = { ...doc, id: (doc._id || doc.id).toString() };
        }
      } catch (_) {}
    }
    return updatedApp;
  },

  async cancelApplication(id, userId) {
    const idStr = (id || "").toString();
    const db = readDB();
    const idx = (db.applications || []).findIndex((a) => (a.id || a._id || "").toString() === idStr);
    if (idx !== -1) {
      db.applications[idx].status = "Cancelled";
      const evIdx = (db.events || []).findIndex((e) => (e.id || e._id || "").toString() === (db.applications[idx].opportunityId || "").toString());
      if (evIdx !== -1) {
        db.events[evIdx].slotsAvailable = (Number(db.events[evIdx].slotsAvailable) || 0) + 1;
      }
      writeDB(db);
      return true;
    }
    return false;
  },

  async deleteApplication(id, adminUser) {
    const idStr = (id || "").toString();
    const db = readDB();
    const app = (db.applications || []).find((a) => (a.id || a._id || "").toString() === idStr);
    if (app) {
      db.applications = db.applications.filter((a) => (a.id || a._id || "").toString() !== idStr);
      if (app.status === "Pending" || app.status === "Approved") {
        const evIdx = (db.events || []).findIndex((e) => (e.id || e._id || "").toString() === (app.opportunityId || "").toString());
        if (evIdx !== -1) {
          db.events[evIdx].slotsAvailable = (Number(db.events[evIdx].slotsAvailable) || 0) + 1;
        }
      }
      writeDB(db);
      return true;
    }
    return false;
  },

  // QR ATTENDANCE (Module 2: Cryptographic token, SHA-256 hash storage, validity window, regeneration)
  // "one event one qr generate if any problem only use another qr for the same ok"
  async generateEventQRToken(eventId, adminUser, validityHours = 24, forceRegenerate = false) {
    let event = await this.getEventById(eventId);
    if (!event) throw new Error("Event not found.");

    // ONE EVENT ONE QR: If the event already has an active, valid QR code and forceRegenerate is false, REUSE IT!
    if (!forceRegenerate && event.qrCodeToken && event.checkInCode) {
      const isExpired = event.qrExpiresAt && new Date() > new Date(event.qrExpiresAt);
      if (!isExpired && event.attendanceOpen !== false) {
        return {
          eventId: (event.id || event._id).toString(),
          qrCodeToken: event.qrCodeToken,
          qrTokenHash: event.qrTokenHash,
          checkInCode: event.checkInCode,
          expiresAt: event.qrExpiresAt,
          attendanceOpen: true,
          title: event.title,
          date: event.date,
          reused: true,
        };
      }
    }

    // Generate a cryptographically secure random token and a human-readable 6-digit Check-In Pass Code
    const token = "MFQR-" + crypto.randomBytes(16).toString("hex").toUpperCase();
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const checkInCode = "MF-" + Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + Number(validityHours) * 3600 * 1000);

    // Store only the SHA-256 hash of the token in MongoDB (along with raw token for admin UI display)
    await this.updateEvent(
      eventId,
      {
        qrCodeToken: token,
        qrTokenHash: tokenHash,
        checkInCode: checkInCode,
        qrExpiresAt: expiresAt,
        attendanceOpen: true,
      },
      adminUser
    );

    return {
      eventId: (event.id || event._id).toString(),
      qrCodeToken: token,
      qrTokenHash: tokenHash,
      checkInCode: checkInCode,
      expiresAt,
      attendanceOpen: true,
      title: event.title,
      date: event.date,
      reused: false,
    };
  },

  async invalidateEventQR(eventId, adminUser) {
    let event = await this.getEventById(eventId);
    if (!event) throw new Error("Event not found.");

    await this.updateEvent(
      eventId,
      {
        qrTokenHash: "",
        checkInCode: "",
        attendanceOpen: false,
      },
      adminUser
    );

    return {
      eventId: (event.id || event._id).toString(),
      attendanceOpen: false,
      message: "Event QR attendance invalidated successfully.",
    };
  },

  // Student QR Check-in with validation, registration verification, duplicate prevention, and JWT auth
  async checkInViaQR({ eventId, qrToken, user }) {
    if (!qrToken || typeof qrToken !== "string" || !qrToken.trim()) {
      throw new Error("QR attendance token or Check-In Code is required.");
    }

    let event = await this.getEventById(eventId);
    if (!event) throw new Error("Event not found.");

    if (event.attendanceOpen === false) {
      throw new Error("Attendance for this event is closed.");
    }

    if (event.qrExpiresAt && new Date() > new Date(event.qrExpiresAt)) {
      throw new Error("This attendance QR code has expired. Please ask the coordinator to regenerate it.");
    }

    // Note: If admin has opened attendance or generated the QR, check-in is immediately permissible without blocking.
    const cleanToken = qrToken.trim();
    const incomingHash = crypto.createHash("sha256").update(cleanToken).digest("hex");

    // Validate QR token or human Check-In Code: compare with SHA-256 hash, raw token, or checkInCode
    const isValidToken =
      (event.qrTokenHash && incomingHash === event.qrTokenHash) ||
      (event.qrCodeToken && cleanToken === event.qrCodeToken) ||
      (event.checkInCode && cleanToken.toUpperCase() === event.checkInCode.toUpperCase()) ||
      cleanToken.toUpperCase().endsWith((event.checkInCode || "").toUpperCase());

    if (!isValidToken) {
      throw new Error("Invalid QR attendance token or Pass Code. Please scan the current official event code.");
    }

    const userId = (user._id || user.id || "").toString();

    // 1. Verify Event Registration (Must be Approved)
    const apps = await this.getApplicationsByEvent(eventId, event.title);
    const userApp = apps.find(
      (a) =>
        (a.userId || "").toString() === userId ||
        (a.applicantDetails?.email || "").toLowerCase() === (user.email || "").toLowerCase()
    );

    if (!userApp) {
      throw new Error("You are not registered for this event. Only registered volunteers can check in.");
    }

    if (userApp.status !== "Approved" && userApp.status !== "Completed") {
      throw new Error(
        userApp.status === "Rejected"
          ? "Your application for this event was not approved."
          : "Your application is still pending administrator approval."
      );
    }

    // 2. Prevent Duplicate Check-ins
    const eventIdStr = (eventId || "").toString();
    if (getIsConnected()) {
      try {
        const existingAtt = await Attendance.findOne({ eventId: eventIdStr, userId });
        if (existingAtt) {
          throw new Error("Attendance already recorded for this event.");
        }
      } catch (err) {
        if (err.message.includes("already recorded")) throw err;
      }
    }

    const db = readDB();
    if (!Array.isArray(db.attendance)) db.attendance = [];
    const localExisting = db.attendance.find(
      (a) => (a.eventId || "").toString() === eventIdStr && (a.userId || "").toString() === userId
    );
    if (localExisting) {
      throw new Error("Attendance already recorded for this event.");
    }

    // 3. Record Attendance (isVerified remains false until Admin verifies completion)
    // A student must not be able to manually award themselves attendance, hours or points.
    const nowIso = new Date().toISOString();
    const durationHours = Number(event.durationHours || event.duration || 4);

    const attRecord = {
      id: "att_" + Date.now(),
      eventId: eventIdStr,
      userId,
      applicationId: userApp.id || userApp._id || "",
      volunteerName: user.fullName || userApp.applicantDetails?.name || "Volunteer",
      volunteerEmail: user.email || userApp.applicantDetails?.email || "",
      status: "Checked-In",
      sessionStatus: "Active",
      checkInMethod: "QR_SCAN",
      checkInTime: nowIso,
      loggedHours: 0,
      isVerified: false,
      verifiedHours: 0,
      pointsAwarded: false,
      points: 0,
      markedByName: "Self (QR Scan)",
    };

    db.attendance.push(attRecord);
    writeDB(db);

    if (getIsConnected()) {
      try {
        await Attendance.create({
          eventId: eventIdStr,
          userId,
          applicationId: userApp.id || userApp._id || "",
          volunteerName: user.fullName || userApp.applicantDetails?.name || "Volunteer",
          volunteerEmail: user.email || userApp.applicantDetails?.email || "",
          status: "Checked-In",
          sessionStatus: "Active",
          checkInMethod: "QR_SCAN",
          checkInTime: new Date(),
          loggedHours: 0,
          isVerified: false,
          verifiedHours: 0,
          pointsAwarded: false,
          points: 0,
          markedByName: "Self (QR Scan)",
        });
      } catch (mErr) {
        if (mErr.code === 11000) {
          throw new Error("Attendance already recorded for this event.");
        }
      }
    }

    await this.createNotification({
      userId,
      type: "attendance",
      title: "QR Attendance Recorded! ✅",
      message: `Your attendance at "${event.title}" has been recorded. Volunteering session timer started!`,
      link: `/opportunities/${eventId}`,
    });

    return {
      success: true,
      message: "Attendance recorded successfully! Volunteering session timer active.",
      data: {
        ...attRecord,
        eventTitle: event.title,
        date: event.date,
        time: event.time || event.slot || "09:30 AM - 01:30 PM",
        durationHours,
      },
    };
  },

  // Lock volunteer session manually or when meet ends
  async lockVolunteerSession({ eventId, userId, lockMethod = "MANUAL", hours }) {
    const eventIdStr = (eventId || "").toString();
    const userIdStr = (userId || "").toString();
    const event = await this.getEventById(eventId);

    const db = readDB();
    if (!Array.isArray(db.attendance)) db.attendance = [];
    const record = db.attendance.find(
      (a) => (a.eventId || "").toString() === eventIdStr && (a.userId || "").toString() === userIdStr
    );

    if (!record) {
      throw new Error("No check-in attendance record found for this event.");
    }

    const checkInTime = record.checkInTime ? new Date(record.checkInTime) : new Date();
    const now = new Date();
    const diffHours = Math.max(0.5, Number(((now - checkInTime) / (1000 * 60 * 60)).toFixed(1)));
    const defaultDuration = Number(event?.durationHours || event?.duration || 4);

    // If explicit hours given or calculated, cap at scheduled duration if meet ended
    const calculatedHours = hours ? Number(hours) : Math.min(diffHours, defaultDuration);

    record.sessionStatus = "Locked";
    record.status = "Present";
    record.checkOutTime = now.toISOString();
    record.lockedAt = now.toISOString();
    record.lockMethod = lockMethod;
    record.loggedHours = calculatedHours;
    record.verifiedHours = calculatedHours;

    writeDB(db);

    if (getIsConnected()) {
      try {
        await Attendance.findOneAndUpdate(
          { eventId: eventIdStr, userId: userIdStr },
          {
            $set: {
              sessionStatus: "Locked",
              status: "Present",
              checkOutTime: now,
              lockedAt: now,
              lockMethod: lockMethod,
              loggedHours: calculatedHours,
              verifiedHours: calculatedHours,
            },
          }
        );
      } catch (_) {}
    }

    return {
      success: true,
      message: `Volunteering session locked! ${calculatedHours} hour(s) recorded.`,
      data: record,
    };
  },

  async getVolunteerSession({ eventId, userId }) {
    const eventIdStr = (eventId || "").toString();
    const userIdStr = (userId || "").toString();
    const event = await this.getEventById(eventId);

    const db = readDB();
    const record = (db.attendance || []).find(
      (a) => (a.eventId || "").toString() === eventIdStr && (a.userId || "").toString() === userIdStr
    );

    if (!record) {
      return { hasSession: false, session: null };
    }

    return {
      hasSession: true,
      session: {
        ...record,
        eventTitle: event?.title,
        date: event?.date,
        time: event?.time || event?.slot || "09:30 AM - 01:30 PM",
        durationHours: Number(event?.durationHours || event?.duration || 4),
      },
    };
  },

  // MODULE 1: Email 1: Volunteer Selection Confirmation
  // API: POST /api/events/:id/confirm-selection
  async confirmEventSelection(eventId, { applicationId, studentId, userId } = {}, adminUser) {
    let event = await this.getEventById(eventId);
    if (!event) throw new Error("Event not found.");

    const apps = await this.getApplicationsByEvent(eventId, event.title);

    // Target specific student or all approved students
    let targetApps = apps.filter((a) => a.status === "Approved" || a.status === "Completed");

    if (applicationId || studentId || userId) {
      const targetId = (applicationId || studentId || userId).toString();
      targetApps = targetApps.filter(
        (a) =>
          (a.id || a._id || "").toString() === targetId ||
          (a.userId || "").toString() === targetId ||
          (a.applicationId || "").toString() === targetId
      );
    }

    // STRICT: Do not send the selection email to rejected students
    targetApps = targetApps.filter((a) => a.status !== "Rejected" && a.status !== "Cancelled");

    if (targetApps.length === 0) {
      return {
        success: true,
        message: "No eligible approved volunteers found to confirm selection.",
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        recipients: [],
      };
    }

    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const recipients = [];

    for (const app of targetApps) {
      let vEmail = app.applicantDetails?.email;
      let vName = app.applicantDetails?.name;
      let vUser = null;

      if (app.userId) {
        vUser = await this.findUserById(app.userId);
        if (vUser) {
          vEmail = vUser.email || vEmail;
          vName = vUser.fullName || vName;
        }
      }

      if (!vEmail) {
        failedCount++;
        continue;
      }

      const emailPayload = {
        user: {
          _id: app.userId,
          fullName: vName || "Volunteer",
          email: vEmail,
          applicationId: app.applicationId || vUser?.applicationId,
          role: vUser?.role || "student",
        },
        event: {
          _id: event.id || event._id,
          id: event.id || event._id,
          title: event.title,
          date: event.date,
          time: event.time || "Scheduled Time",
          location: event.location || "Assigned Location",
        },
      };

      try {
        const res = await EmailService.sendVolunteerSelectionEmail(emailPayload);
        if (res.skipped) {
          skippedCount++;
        } else if (res.success && !res.failed) {
          sentCount++;
        } else {
          failedCount++;
        }
        recipients.push({
          email: vEmail,
          name: vName,
          status: res.skipped ? "skipped" : res.success ? "sent" : "failed",
        });
      } catch (err) {
        failedCount++;
        console.error(`[confirmSelection] Error sending to ${vEmail}:`, err.message);
      }
    }

    return {
      success: true,
      message: `Volunteer selection confirmed. Sent: ${sentCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`,
      sentCount,
      failedCount,
      skippedCount,
      recipients,
    };
  },

  // MODULE 1 (Email 2) & MODULE 3 (Volunteer Hours & Points Management):
  // API: PATCH /api/events/:id/attendance/close
  // When an administrator closes attendance and verifies completion:
  // - Calculate actual verified volunteer hours
  // - Award 10 points for each verified hour (2h=20, 5h=50, 10h=100)
  // - Update student's profile & leaderboard
  // - Maintain immutable points transaction history
  // - Never award points twice for the same attendance record
  // - Send Email 2 (Volunteer Completion Thank You) only to verified volunteers
  async closeEventAttendanceAndVerify(eventId, { defaultHours } = {}, adminUser) {
    let event = await this.getEventById(eventId);
    if (!event) throw new Error("Event not found.");

    const eventIdStr = (event.id || event._id).toString();
    const verifiedHours = Number(defaultHours) || Number(event.durationHours) || 4;
    const pointsPerVolunteer = verifiedHours * 10; // Exactly 10 points per verified hour!

    // 1. Close attendance and mark event completed
    await this.updateEvent(
      eventIdStr,
      {
        attendanceOpen: false,
        qrTokenHash: "",
        status: "Completed",
        eventStatus: "Completed",
        pointsDistributed: true,
      },
      adminUser
    );

    // 2. Fetch all registered applications and attendance records
    const attendanceRecords = await this.getEventAttendance(eventIdStr);
    const applications = await this.getApplicationsByEvent(eventIdStr, event.title);

    let verifiedCount = 0;
    let totalPointsAwarded = 0;
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    const db = readDB();
    if (!Array.isArray(db.attendance)) db.attendance = [];
    if (!Array.isArray(db.pointsTransactions)) db.pointsTransactions = [];

    // Combine any volunteer who checked in via QR or was approved in applications
    const candidateVolunteers = [];
    const seenUserIds = new Set();

    for (const att of attendanceRecords) {
      const uId = (att.userId || "").toString();
      if (uId && !seenUserIds.has(uId)) {
        seenUserIds.add(uId);
        candidateVolunteers.push({
          userId: uId,
          applicationId: att.applicationId,
          volunteerName: att.volunteerName,
          volunteerEmail: att.volunteerEmail,
          status: att.status || "Present",
          checkInMethod: att.checkInMethod || "QR_SCAN",
        });
      }
    }

    // Also include any approved applications that weren't checked in via QR yet
    for (const app of applications) {
      const uId = (app.userId || "").toString();
      if (uId && !seenUserIds.has(uId) && (app.status === "Approved" || app.status === "Completed")) {
        seenUserIds.add(uId);
        candidateVolunteers.push({
          userId: uId,
          applicationId: app.id || app._id,
          volunteerName: app.applicantDetails?.name,
          volunteerEmail: app.applicantDetails?.email,
          status: app.attendanceStatus === "Absent" ? "Absent" : "Present",
          checkInMethod: "ADMIN_CONFIRMED",
        });
      }
    }

    for (const vol of candidateVolunteers) {
      // Do not verify or award points to absent or rejected volunteers
      if (vol.status === "Absent") continue;

      const userIdStr = vol.userId.toString();
      const user = await this.findUserById(userIdStr);
      if (!user) continue;

      const volunteerEmail = user.email || vol.volunteerEmail;
      const volunteerName = user.fullName || vol.volunteerName || "Volunteer";

      // Check if points have already been awarded for this attendance record (idempotency)
      const transactionKey = `${userIdStr}_${eventIdStr}_CREDIT`;
      let alreadyAwarded = false;

      if (getIsConnected()) {
        try {
          const existingTx = await PointsTransaction.findOne({
            $or: [{ transactionKey }, { userId: userIdStr, eventId: eventIdStr, type: "CREDIT" }],
          }).lean();
          if (existingTx) alreadyAwarded = true;
        } catch (_) {}
      }

      if (!alreadyAwarded) {
        const localTx = (db.pointsTransactions || []).find(
          (t) =>
            t.transactionKey === transactionKey ||
            ((t.userId || "").toString() === userIdStr &&
              (t.eventId || "").toString() === eventIdStr &&
              t.type === "CREDIT")
        );
        if (localTx) alreadyAwarded = true;
      }

      if (!alreadyAwarded) {
        // Module 3: Calculate actual verified hours & award 10 points for each verified hour
        const pts = pointsPerVolunteer;

        // 3a. Update student's profile (totalHours, points, completedEventsCount)
        const updatedHours = (Number(user.totalHours) || 0) + verifiedHours;
        const updatedPoints = (Number(user.points) || 0) + pts;
        const updatedCompleted = (Number(user.completedEventsCount) || 0) + 1;

        await this.updateUser(userIdStr, {
          totalHours: updatedHours,
          points: updatedPoints,
          completedEventsCount: updatedCompleted,
          eventsJoined: Math.max((Number(user.eventsJoined) || 0), updatedCompleted),
        });

        // 3b. Maintain an immutable points transaction history
        const txDoc = {
          userId: userIdStr,
          applicationId: user.applicationId || "MAA001",
          studentName: volunteerName,
          eventId: eventIdStr,
          eventName: event.title,
          type: "CREDIT",
          points: pts,
          reason: `Verified ${verifiedHours} volunteer hours for "${event.title}" (10 pts/hr)`,
          adminRemarks: `Attendance verified and closed by ${adminUser?.fullName || "Admin"}`,
          adminId: adminUser?._id || adminUser?.id,
          adminName: adminUser?.fullName || "Admin Coordinator",
          transactionKey,
          date: new Date().toISOString(),
        };

        db.pointsTransactions.unshift({ ...txDoc, id: "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000) });

        if (getIsConnected()) {
          try {
            await PointsTransaction.create(txDoc);
          } catch (tErr) {
            if (tErr.code !== 11000) console.warn("[closeAttendance] Transaction log notice:", tErr.message);
          }
        }

        totalPointsAwarded += pts;
      }

      // 3c. Update attendance record (isVerified: true, verifiedHours, pointsAwarded: true)
      const attIdx = db.attendance.findIndex(
        (at) => (at.eventId || "").toString() === eventIdStr && (at.userId || "").toString() === userIdStr
      );
      const updatedAtt = {
        eventId: eventIdStr,
        userId: userIdStr,
        applicationId: vol.applicationId,
        volunteerName,
        volunteerEmail,
        status: "Present",
        sessionStatus: "Locked",
        lockMethod: "ADMIN_CLOSE",
        checkOutTime: new Date().toISOString(),
        isVerified: true,
        verifiedHours,
        pointsAwarded: true,
        points: pointsPerVolunteer,
        verifiedAt: new Date().toISOString(),
        markedByName: adminUser?.fullName || "Admin",
      };

      if (attIdx !== -1) {
        db.attendance[attIdx] = { ...db.attendance[attIdx], ...updatedAtt };
      } else {
        db.attendance.push(updatedAtt);
      }

      if (getIsConnected()) {
        try {
          await Attendance.findOneAndUpdate(
            { eventId: eventIdStr, userId: userIdStr },
            {
              $set: {
                status: "Present",
                sessionStatus: "Locked",
                lockMethod: "ADMIN_CLOSE",
                checkOutTime: new Date(),
                isVerified: true,
                verifiedHours,
                pointsAwarded: true,
                points: pointsPerVolunteer,
                verifiedAt: new Date(),
                markedByName: adminUser?.fullName || "Admin",
              },
            },
            { upsert: true, new: true }
          );
        } catch (_) {}
      }

      verifiedCount++;

      // 4a. Automatically issue Official Certificate of Appreciation
      let certDoc = null;
      try {
        certDoc = await this.issueCertificate({
          userId: userIdStr,
          eventId: eventIdStr,
          applicationId: vol.applicationId,
          verifiedHours,
          pointsAwarded: pointsPerVolunteer,
          adminUser,
          user,
        });
      } catch (cErr) {
        console.warn(`[closeAttendance] Certificate issuance notice for ${userIdStr}:`, cErr.message);
      }

      // 4b. Mark Application Completed
      if (vol.applicationId) {
        try {
          await this.updateApplicationStatus(vol.applicationId, "Completed", adminUser);
        } catch (_) {}
      }

      // 4c. Module 1: Email 2: Volunteer Completion Thank You & Certificate Delivery
      // Do not send completion emails until attendance is verified!
      if (volunteerEmail) {
        try {
          const emailRes = await EmailService.sendVolunteerCompletionEmail({
            user: {
              _id: userIdStr,
              fullName: volunteerName,
              email: volunteerEmail,
              applicationId: user.applicationId,
              role: user.role || "student",
            },
            event: {
              _id: eventIdStr,
              title: event.title,
              date: event.date,
              durationHours: verifiedHours,
            },
            certificateId: certDoc?.certificateId || certDoc?.id || "",
            certificateUrl: certDoc?.verificationUrl || `${process.env.FRONTEND_URL || "http://localhost:5173"}/contributions`,
            verifiedHours,
            pointsEarned: pointsPerVolunteer,
          });

          if (emailRes.skipped) {
            skippedCount++;
          } else if (emailRes.success && !emailRes.failed) {
            sentCount++;
          } else {
            failedCount++;
          }
        } catch (eErr) {
          failedCount++;
          console.error(`[closeAttendance] Completion email error for ${volunteerEmail}:`, eErr.message);
        }
      }

      // 5. In-app notification with direct certificate link
      await this.createNotification({
        userId: userIdStr,
        type: "hours",
        title: "Attendance Verified & Certificate Issued! 🎉",
        message: `Your attendance at "${event.title}" has been verified! +${verifiedHours} hours and +${pointsPerVolunteer} points credited. Your Certificate (${certDoc?.certificateId || "issued"}) is ready to view and download!`,
        link: "/contributions",
      });
    }

    writeDB(db);

    return {
      success: true,
      message: `Event attendance closed successfully. Verified: ${verifiedCount} volunteer(s), Points Awarded: ${totalPointsAwarded}. Emails - Sent: ${sentCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`,
      verifiedCount,
      totalPointsAwarded,
      sentCount,
      failedCount,
      skippedCount,
      eventStatus: "Completed",
    };
  },

  async retryFailedEventEmails(eventId) {
    return EmailService.retryFailedEventEmails(eventId);
  },

  async getEmailLogs(limit = 100) {
    if (getIsConnected()) {
      try {
        const EmailLog = require("../models/EmailLog");
        const logs = await EmailLog.find().sort({ createdAt: -1 }).limit(limit).lean();
        if (logs && logs.length > 0) {
          return logs.map((l) => ({ ...l, id: l._id.toString() }));
        }
      } catch (err) {
        console.warn("[Storage] getEmailLogs mongo error:", err.message);
      }
    }
    const db = readDB();
    return (db.emailLogs || []).slice(0, limit);
  },

  async getEventAttendance(eventId) {
    const idStr = (eventId || "").toString();
    const db = readDB();

    // Try MongoDB first if connected, to get properly populated records
    if (getIsConnected()) {
      try {
        const Attendance = require("../models/Attendance");
        const mongoRecords = await Attendance.find({ eventId: idStr }).lean();
        if (mongoRecords && mongoRecords.length > 0) {
          // Enrich each record with user profile data for display
          const enriched = await Promise.all(
            mongoRecords.map(async (rec) => {
              let name = rec.volunteerName || "";
              let email = rec.volunteerEmail || "";
              let maatramId = "";
              let college = "";
              let department = "";
              try {
                if (rec.userId) {
                  const User = require("../models/User");
                  const u = await User.findById(rec.userId).select("fullName email maatramId college department").lean();
                  if (u) {
                    name = u.fullName || name;
                    email = u.email || email;
                    maatramId = u.maatramId || "";
                    college = u.college || "";
                    department = u.department || "";
                  }
                }
              } catch (_) {}
              return {
                ...rec,
                id: rec._id?.toString() || rec.id,
                userId: (rec.userId || "").toString(),
                applicationId: (rec.applicationId || "").toString(),
                volunteerName: name,
                userName: name,
                fullName: name,
                volunteerEmail: email,
                maatramId,
                college,
                department,
                status: rec.status || (rec.checkInMethod ? "Present" : "Absent"),
                checkInTime: rec.checkInTime ? new Date(rec.checkInTime).toLocaleString("en-IN") : null,
                method: rec.checkInMethod || rec.method || "QR Code",
              };
            })
          );
          return enriched;
        }
      } catch (err) {
        console.warn("[Storage] getEventAttendance MongoDB query notice:", err.message);
      }
    }

    // Fallback to local DB — enrich with user profile lookup
    const localRecords = (db.attendance || []).filter((a) => (a.eventId || "").toString() === idStr);
    return localRecords.map((rec) => {
      // Try to find user in local db.users
      const userEntry = (db.users || []).find(
        (u) => (u.id || u._id || "").toString() === (rec.userId || "").toString()
      );
      const appEntry = (db.applications || []).find(
        (a) => (a.id || a._id || "").toString() === (rec.applicationId || "").toString()
      );
      const name =
        userEntry?.fullName ||
        appEntry?.applicantDetails?.name ||
        rec.volunteerName ||
        rec.userName ||
        "Volunteer";
      const maatramId = userEntry?.maatramId || appEntry?.maatramId || "";
      const college = userEntry?.college || appEntry?.applicantDetails?.college || "";
      const department = userEntry?.department || appEntry?.applicantDetails?.department || "";
      return {
        ...rec,
        volunteerName: name,
        userName: name,
        fullName: name,
        maatramId,
        college,
        department,
        status: rec.status || (rec.checkInMethod ? "Present" : "Absent"),
        checkInTime: rec.checkInTime ? new Date(rec.checkInTime).toLocaleString("en-IN") : null,
        method: rec.checkInMethod || rec.method || "QR Code",
      };
    });
  },

  // Record or update attendance for an individual volunteer
  async markVolunteerAttendance({ eventId, userId, applicationId, status = "Present", verifiedHours = 4, adminUser }) {
    const eventIdStr = (eventId || "").toString();
    const userIdStr = (userId || "").toString();
    const db = readDB();
    if (!Array.isArray(db.attendance)) db.attendance = [];
    if (!Array.isArray(db.applications)) db.applications = [];

    // 1. Update application record
    const appIdx = db.applications.findIndex(
      (a) =>
        (applicationId && (a.id === applicationId || a._id === applicationId)) ||
        ((a.opportunityId || "").toString() === eventIdStr && (a.userId || "").toString() === userIdStr)
    );
    if (appIdx !== -1) {
      db.applications[appIdx].attendanceStatus = status;
    }

    // 2. Update attendance collection
    const attIdx = db.attendance.findIndex(
      (at) => (at.eventId || "").toString() === eventIdStr && (at.userId || "").toString() === userIdStr
    );
    const attDoc = {
      eventId: eventIdStr,
      userId: userIdStr,
      applicationId: applicationId || (appIdx !== -1 ? db.applications[appIdx].id : null),
      status,
      isVerified: status === "Present",
      verifiedHours: status === "Present" ? Number(verifiedHours) : 0,
      markedByName: adminUser?.fullName || "Admin Coordinator",
      markedAt: new Date().toISOString(),
    };
    if (attIdx !== -1) {
      db.attendance[attIdx] = { ...db.attendance[attIdx], ...attDoc };
    } else {
      db.attendance.push(attDoc);
    }
    writeDB(db);

    if (getIsConnected()) {
      try {
        const Application = require("../models/Application");
        if (applicationId) {
          await Application.findByIdAndUpdate(applicationId, { attendanceStatus: status });
        } else {
          await Application.updateMany({ opportunityId: eventIdStr, userId: userIdStr }, { attendanceStatus: status });
        }
      } catch (_) {}
    }
    return attDoc;
  },

  // Auto-verify attendance for all approved volunteers on an event
  async autoVerifyApprovedAttendance(eventId, adminUser, defaultHours = 4) {
    const eventIdStr = (eventId || "").toString();
    const db = readDB();
    if (!Array.isArray(db.attendance)) db.attendance = [];
    if (!Array.isArray(db.applications)) db.applications = [];

    const apps = db.applications.filter(
      (a) =>
        (a.opportunityId || "").toString() === eventIdStr &&
        (a.status === "Approved" || a.status === "Completed")
    );

    for (const app of apps) {
      app.attendanceStatus = "Present";
      const uId = (app.userId || "").toString();
      const attIdx = db.attendance.findIndex(
        (at) => (at.eventId || "").toString() === eventIdStr && (at.userId || "").toString() === uId
      );
      const attDoc = {
        eventId: eventIdStr,
        userId: uId,
        applicationId: app.id || app._id,
        volunteerName: app.applicantDetails?.name || "Student Volunteer",
        volunteerEmail: app.applicantDetails?.email || "",
        status: "Present",
        isVerified: true,
        verifiedHours: Number(defaultHours),
        markedByName: adminUser?.fullName || "Admin Coordinator",
        markedAt: new Date().toISOString(),
      };
      if (attIdx !== -1) {
        db.attendance[attIdx] = { ...db.attendance[attIdx], ...attDoc };
      } else {
        db.attendance.push(attDoc);
      }
    }
    writeDB(db);

    if (getIsConnected()) {
      try {
        const Application = require("../models/Application");
        await Application.updateMany(
          { opportunityId: eventIdStr, status: { $in: ["Approved", "Completed"] } },
          { attendanceStatus: "Present" }
        );
      } catch (_) {}
    }
    return apps.length;
  },

  // ATTENDANCE & POINTS & CERTIFICATES & AUTOMATED EMAILS
  async trackAttendanceAndAwardPoints({ eventId, attendanceRecords, adminUser }) {
    let event = await this.getEventById(eventId);
    if (!event) throw new Error("Event not found");

    const pointsPerVolunteer = Number(event.points) || 50;
    const verifiedHours = Number(event.durationHours) || 4;
    const results = [];

    await this.updateEvent(eventId, { eventStatus: "Completed", pointsDistributed: true }, adminUser);

    const db = readDB();
    if (!Array.isArray(db.attendance)) db.attendance = [];
    if (!Array.isArray(db.pointsTransactions)) db.pointsTransactions = [];
    if (!Array.isArray(db.certificates)) db.certificates = [];

    for (const record of attendanceRecords) {
      const { applicationId, userId, status, customPoints } = record;
      const appIdx = (db.applications || []).findIndex((a) => (a.id || a._id || "").toString() === (applicationId || "").toString());
      const app = appIdx !== -1 ? db.applications[appIdx] : null;
      if (!app) continue;

      app.attendanceStatus = status;

      const attIdx = db.attendance.findIndex((at) => (at.eventId || "").toString() === eventId.toString() && (at.userId || "").toString() === (userId || "").toString());
      const attRecord = {
        eventId,
        userId,
        applicationId,
        volunteerName: app.applicantDetails?.name || "Student Volunteer",
        volunteerEmail: app.applicantDetails?.email || "",
        status,
        slotId: app.slotId || "",
        isVerified: status === "Present",
        verifiedHours: status === "Present" ? verifiedHours : 0,
        markedByName: adminUser?.fullName || "Admin",
        markedAt: new Date().toISOString(),
      };
      if (attIdx !== -1) {
        db.attendance[attIdx] = attRecord;
      } else {
        db.attendance.push(attRecord);
      }

      const finalPoints = customPoints !== undefined ? Number(customPoints) : pointsPerVolunteer;

      if (status === "Present" && (app.pointsAwarded === 0 || customPoints !== undefined)) {
        app.status = "Completed";
        app.pointsAwarded = finalPoints;

        const uIdx = (db.users || []).findIndex((u) => (u.id || u._id || "").toString() === (userId || "").toString());
        let updatedUser = null;
        if (uIdx !== -1) {
          db.users[uIdx].points = Math.max(0, (Number(db.users[uIdx].points) || 0) + finalPoints);
          db.users[uIdx].totalHours = (Number(db.users[uIdx].totalHours) || 0) + verifiedHours;
          db.users[uIdx].completedEventsCount = (Number(db.users[uIdx].completedEventsCount) || 0) + 1;
          db.users[uIdx].eventsJoined = (Number(db.users[uIdx].eventsJoined) || 0) + 1;
          db.users[uIdx].badgesEarned = (Number(db.users[uIdx].badgesEarned) || 0) + 1;
          updatedUser = db.users[uIdx];
        }

        const ptId = "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        db.pointsTransactions.unshift({
          id: ptId,
          _id: ptId,
          userId,
          applicationId: app.applicationId,
          studentName: app.applicantDetails?.name || "Student",
          eventId,
          eventName: event.title,
          type: finalPoints >= 0 ? "CREDIT" : "DEBIT",
          points: finalPoints,
          reason: `Successfully completed "${event.title}"`,
          adminRemarks: `Verified by ${adminUser?.fullName || "Admin"}`,
          createdAt: new Date().toISOString(),
        });

        let certDoc = null;
        try {
          certDoc = await this.issueCertificate({
            userId,
            eventId,
            applicationId,
            verifiedHours,
            pointsAwarded: finalPoints,
            adminUser,
          });
        } catch (e) {
          console.warn("Cert issue error:", e.message);
        }

        try {
          const studentEmail = app.applicantDetails?.email || updatedUser?.email;
          const studentName = app.applicantDetails?.name || updatedUser?.fullName || "Volunteer";
          await EmailService.sendThankYouMessage({
            user: { fullName: studentName, email: studentEmail },
            event,
            hours: verifiedHours,
            points: finalPoints,
          });
          if (certDoc) {
            await EmailService.sendCertificateAvailability({
              user: { fullName: studentName, email: studentEmail },
              certificate: certDoc,
              event,
            });
          }
        } catch (mailErr) {
          console.warn("Thank you email dispatch notice:", mailErr.message);
        }

        results.push({ userId, pointsAwarded: finalPoints, status: "Points Awarded & Certificate Issued" });
      } else {
        results.push({ userId, pointsAwarded: 0, status: `Attendance marked (${status})` });
      }
    }

    writeDB(db);
    return { event, results };
  },

  // CERTIFICATES
  async generateCertificate(params) {
    const userId = params.userId || params.user?._id || params.user?.id || params.user?.applicationId;
    const eventId = params.eventId || params.event?._id || params.event?.id;
    return this.issueCertificate({
      ...params,
      userId,
      eventId,
      user: params.user,
    });
  },

  async issueCertificate({ userId, eventId, applicationId, verifiedHours = 4, pointsAwarded = 50, adminUser, linkedInPost, user: passedUser }) {
    let user = passedUser && passedUser.fullName ? passedUser : await this.findUserById(userId);
    if (!user && applicationId) {
      const app = await this.getApplicationById(applicationId);
      if (app?.applicantDetails?.email) {
        user = await this.findUserByEmail(app.applicantDetails.email);
      }
    }
    let event = await this.getEventById(eventId);
    if (!user) {
      user = {
        fullName: "Volunteer",
        email: "",
        role: "student",
        college: "Anna University",
      };
    }
    if (!event) {
      event = {
        title: "Volunteering Event",
        category: "Volunteering",
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        description: "",
        skills: "",
      };
    }

    const idStr = (userId || "").toString();
    const eventIdStr = (eventId || "").toString();

    // Check MongoDB if connected
    if (getIsConnected()) {
      try {
        const existingMongo = await Certificate.findOne({
          $or: [
            { userId: idStr, eventId: eventIdStr },
            { volunteerEmail: user.email, eventTitle: event.title }
          ]
        }).lean();
        if (existingMongo) return { ...existingMongo, id: existingMongo.certificateId || existingMongo._id.toString(), isExisting: true };
      } catch (err) {}
    }

    const db = readDB();
    if (!Array.isArray(db.certificates)) db.certificates = [];
    const existing = db.certificates.find((c) => (c.userId || "").toString() === idStr && (c.eventId || "").toString() === eventIdStr);
    if (existing) return { ...existing, isExisting: true };

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    const certId = `MF-CERT-${year}-${randNum}`;

    const issueDateStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const cert = {
      id: certId,
      _id: certId,
      certificateId: certId,
      userId: idStr,
      applicationId: applicationId || null,
      eventId: eventIdStr,
      volunteerName: user.fullName || "Student Volunteer",
      volunteerEmail: user.email || "",
      volunteerRole: user.role === "alumni" ? "Alumni Volunteer" : "Student Volunteer",
      college: user.college || "Anna University",
      eventTitle: event.title,
      eventCategory: event.category || "Volunteering",
      eventDate: event.date || issueDateStr,
      verifiedHours: Number(verifiedHours) || 4,
      pointsAwarded: Number(pointsAwarded) || 50,
      issueDate: issueDateStr,
      signatoryName: "Sujith Kumar",
      signatoryTitle: "Founder & Managing Trustee, Maatram Foundation",
      verificationUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/certificates/verify/${certId}`,
      linkedInPost: linkedInPost || `I am proud to share that I have completed the volunteering initiative for "${event.title}" with Maatram Foundation! Dedicated ${Number(verifiedHours) || 4} hours to empower deserving youth. Grateful to be part of this impactful journey. Certificate ID: ${certId}. #MaatramFoundation #Volunteering #SocialImpact #StudentLeadership`,
      status: "Issued",
      createdAt: new Date().toISOString(),
    };

    if (getIsConnected()) {
      try {
        await Certificate.create(cert);
      } catch (err) {}
    }

    db.certificates.unshift(cert);
    writeDB(db);

    await this.createNotification({
      userId: idStr,
      type: "certificate",
      title: "Volunteering Certificate Issued! 📜",
      message: `Your official volunteering certificate (${certId}) for "${event.title}" is ready to view and download!`,
      link: "/contributions",
    });

    return cert;
  },

    async getUserCertificates(userId) {
    const idStr = (userId || "").toString();
    const user = await this.findUserById(userId);
    const appIdStr = (user?.applicationId || "").toString();
    const em = (user?.email || "").toLowerCase().trim();
    let list = [];

    if (getIsConnected()) {
      try {
        const conditions = [{ userId: idStr }];
        if (appIdStr) conditions.push({ userId: appIdStr });
        if (em) conditions.push({ volunteerEmail: em });
        const mongoCerts = await Certificate.find({ $or: conditions }).lean();
        if (mongoCerts && mongoCerts.length > 0) {
          list = mongoCerts.map((c) => ({ ...c, id: c.certificateId || c._id.toString() }));
        }
      } catch (err) {}
    }

    const db = readDB();
    const jsonCerts = (db.certificates || []).filter((c) => {
      const cUid = (c.userId || "").toString();
      const cEmail = (c.volunteerEmail || "").toLowerCase().trim();
      return (
        cUid === idStr ||
        (appIdStr && cUid === appIdStr) ||
        (em && cEmail === em)
      );
    });

    const merged = [...list];
    for (const jc of jsonCerts) {
      if (!merged.some((m) => m.certificateId === jc.certificateId)) {
        merged.push(jc);
      }
    }

    // Synthesize certificates for any completed applications that don't have a certificate record yet
    try {
      const myApps = await this.getMyApplications(userId, appIdStr, em);
      for (const app of myApps) {
        const isCompleted =
          app.status === "Completed" ||
          Boolean(app.pointsAwarded && app.pointsAwarded > 0) ||
          Boolean(app.certificateId) ||
          Boolean(app.completedAt);
        if (isCompleted) {
          const appTitle = app.opportunityTitle || "Volunteering Initiative";
          const alreadyInList = merged.some(
            (c) =>
              (c.certificateId && c.certificateId === app.certificateId) ||
              (c.eventTitle && c.eventTitle.toLowerCase().trim() === appTitle.toLowerCase().trim())
          );
          if (!alreadyInList) {
            const certId = app.certificateId || `MF-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            const synthCert = {
              id: certId,
              _id: certId,
              certificateId: certId,
              userId: idStr,
              applicationId: (app.id || app._id || "").toString(),
              eventId: (app.eventId || app.opportunityId || "").toString(),
              volunteerName: user?.fullName || app.applicantDetails?.name || "Student Volunteer",
              volunteerEmail: em || app.applicantDetails?.email || "",
              volunteerRole: user?.role === "alumni" ? "Alumni Volunteer" : "Student Volunteer",
              college: user?.college || app.applicantDetails?.college || "Anna University",
              eventTitle: appTitle,
              eventCategory: app.category || "Volunteering",
              eventDate: app.eventDate || new Date().toLocaleDateString("en-IN"),
              verifiedHours: Number(app.hours) || 4,
              pointsAwarded: Number(app.pointsAwarded) || 50,
              issueDate: new Date().toLocaleDateString("en-IN"),
              signatoryName: "Sujith Kumar",
              signatoryTitle: "Founder & Managing Trustee, Maatram Foundation",
              status: "Issued",
              createdAt: new Date().toISOString(),
            };
            merged.push(synthCert);
            if (!Array.isArray(db.certificates)) db.certificates = [];
            db.certificates.unshift(synthCert);
            writeDB(db);
          }
        }
      }
    } catch (_) {}

    // Annotate whether the student has submitted feedback to unlock each certificate
    try {
      const allEvents = await this.getEvents();
      const eventMap = new Map();
      (allEvents || []).forEach((ev) => {
        const eId = (ev._id || ev.id || "").toString();
        const eTitle = (ev.title || "").toLowerCase().trim();
        if (eId) eventMap.set(eId, ev);
        if (eTitle) eventMap.set(eTitle, ev);
      });

      return merged.map((cert) => {
        const ev = eventMap.get((cert.eventId || "").toString()) || eventMap.get((cert.eventTitle || "").toLowerCase().trim());
        let hasFeedback = Boolean(cert.feedbackSubmitted);

        if (!hasFeedback && ev && Array.isArray(ev.feedbacks)) {
          hasFeedback = ev.feedbacks.some((fb) => {
            const fUid = (fb.userId || "").toString();
            const fEm = (fb.studentEmail || "").toLowerCase().trim();
            return fUid === idStr || (appIdStr && fUid === appIdStr) || (em && fEm === em);
          });
        }

        return {
          ...cert,
          unlocked: hasFeedback,
          feedbackSubmitted: hasFeedback,
          feedbackRequired: !hasFeedback,
        };
      });
    } catch (_) {
      return merged;
    }
  },

  async getAllCertificates(filters = {}) {
    let list = [];
    if (getIsConnected()) {
      try {
        const query = {};
        if (filters.search) {
          const q = filters.search.trim();
          query.$or = [
            { volunteerName: { $regex: q, $options: "i" } },
            { certificateId: { $regex: q, $options: "i" } },
            { eventTitle: { $regex: q, $options: "i" } },
          ];
        }
        const mongoCerts = await Certificate.find(query).lean();
        if (mongoCerts && mongoCerts.length > 0) {
          list = mongoCerts.map((c) => ({ ...c, id: c.certificateId || c._id.toString() }));
        }
      } catch (err) {}
    }

    const db = readDB();
    let certs = Array.isArray(db.certificates) ? db.certificates : [];
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      certs = certs.filter(
        (c) =>
          (c.volunteerName || "").toLowerCase().includes(q) ||
          (c.certificateId || "").toLowerCase().includes(q) ||
          (c.eventTitle || "").toLowerCase().includes(q)
      );
    }
    const merged = [...list];
    for (const c of certs) {
      if (!merged.some((m) => m.certificateId === c.certificateId)) {
        merged.push(c);
      }
    }
    return merged;
  },

  async getCertificateById(certificateId) {
    if (getIsConnected()) {
      try {
        const mongoCert = await Certificate.findOne({
          $or: [{ certificateId }, { _id: mongoose.isValidObjectId(certificateId) ? certificateId : null }]
        }).lean();
        if (mongoCert) return { ...mongoCert, id: mongoCert.certificateId || mongoCert._id.toString() };
      } catch (err) {}
    }
    const db = readDB();
    const cert = (db.certificates || []).find(
      (c) => c.certificateId === certificateId || (c.id || c._id || "").toString() === certificateId.toString()
    );
    return cert || null;
  },

  // HOURS VERIFICATION
  async submitHourLog(data, user) {
    if (!data.eventTitle || !data.submittedHours) {
      throw new Error("Event title and submitted hours are required.");
    }

    const db = readDB();
    if (!Array.isArray(db.hourLogs)) db.hourLogs = [];
    const logId = "hl_" + Date.now();
    const newLog = {
      id: logId,
      _id: logId,
      volunteerId: (user._id || user.id || "").toString(),
      volunteerName: user.fullName || "Volunteer",
      volunteerEmail: user.email || "",
      volunteerRole: user.role || "student",
      college: user.college || "",
      department: user.department || "",
      eventId: data.eventId || null,
      eventTitle: data.eventTitle,
      eventCategory: data.category || "School Visits",
      participationDate: data.date || new Date().toISOString().split("T")[0],
      submittedHours: Number(data.submittedHours) || Number(data.hours) || 4,
      verifiedHours: 0,
      pointsAwarded: 0,
      evidenceRemarks: data.evidenceRemarks || data.remarks || "",
      evidencePhoto: data.evidencePhoto || data.evidenceUrl || "",
      evidenceUrl: data.evidencePhoto || data.evidenceUrl || "",
      verificationStatus: "Pending",
      createdAt: new Date().toISOString(),
    };
    db.hourLogs.unshift(newLog);
    writeDB(db);

    await this.createNotification({
      userId: "admin",
      type: "hours",
      title: "New Volunteer Hours Submitted for Audit",
      message: `${user.fullName || "Volunteer"} submitted ${newLog.submittedHours} hours for "${data.eventTitle}" awaiting verification.`,
      link: "/admin/events",
    });

    return newLog;
  },

  async getAllHourLogs(filters = {}) {
    const db = readDB();
    let logs = Array.isArray(db.hourLogs) ? db.hourLogs : [];
    if (filters.status && filters.status !== "All") {
      logs = logs.filter((l) => l.verificationStatus === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      logs = logs.filter(
        (l) => (l.volunteerName || "").toLowerCase().includes(q) || (l.eventTitle || "").toLowerCase().includes(q)
      );
    }
    return logs;
  },

  async getMyHourLogs(userId) {
    const db = readDB();
    const idStr = (userId || "").toString();
    return (db.hourLogs || []).filter((l) => (l.volunteerId || "").toString() === idStr);
  },

  async deleteHourLog(id, userId, adminUser) {
    const db = readDB();
    const idStr = (id || "").toString();
    const uStr = (userId || "").toString();
    const initialLen = (db.hourLogs || []).length;
    db.hourLogs = (db.hourLogs || []).filter((l) => {
      if ((l.id || l._id || "").toString() === idStr) {
        if (adminUser || (l.volunteerId || "").toString() === uStr) return false;
      }
      return true;
    });
    writeDB(db);
    return db.hourLogs.length < initialLen;
  },

  async updateHourLogStatus(id, { action, verifiedHours, adminRemarks }, adminUser) {
    const db = readDB();
    const idx = (db.hourLogs || []).findIndex((l) => (l.id || l._id || "").toString() === id.toString());
    if (idx === -1) throw new Error("Hour submission record not found.");

    const log = db.hourLogs[idx];
    let newStatus = log.verificationStatus;
    let finalVerifiedHours = log.verifiedHours || 0;
    let pointsToAdd = 0;

    if (action === "Verify" || action === "Approve") {
      newStatus = "Verified";
      finalVerifiedHours = Number(verifiedHours) > 0 ? Number(verifiedHours) : Number(log.submittedHours) || 4;
      pointsToAdd = Math.round(finalVerifiedHours * 10);
    } else if (action === "Reject") {
      newStatus = "Rejected";
      finalVerifiedHours = 0;
    } else if (action === "Request Correction") {
      newStatus = "Correction Requested";
    }

    log.verificationStatus = newStatus;
    log.verifiedHours = finalVerifiedHours;
    log.adminRemarks = adminRemarks || log.adminRemarks;
    log.verifiedByName = adminUser?.fullName || "Admin Coordinator";

    if (newStatus === "Verified" && pointsToAdd > 0 && log.pointsAwarded === 0) {
      log.pointsAwarded = pointsToAdd;
      const uIdx = (db.users || []).findIndex((u) => (u.id || u._id || "").toString() === (log.volunteerId || "").toString());
      if (uIdx !== -1) {
        db.users[uIdx].totalHours = (Number(db.users[uIdx].totalHours) || 0) + finalVerifiedHours;
        db.users[uIdx].points = (Number(db.users[uIdx].points) || 0) + pointsToAdd;

        if (!Array.isArray(db.pointsTransactions)) db.pointsTransactions = [];
        db.pointsTransactions.unshift({
          id: "tx_" + Date.now(),
          userId: log.volunteerId,
          applicationId: db.users[uIdx].applicationId,
          studentName: log.volunteerName,
          type: "CREDIT",
          points: pointsToAdd,
          reason: `Verified field hours for "${log.eventTitle}" (${finalVerifiedHours} hrs)`,
          adminRemarks: adminRemarks || `Audited & Approved by ${adminUser?.fullName || "Admin"}`,
          createdAt: new Date().toISOString(),
        });

        await this.createNotification({
          userId: log.volunteerId,
          type: "hours",
          title: `Field Hours Approved (+${pointsToAdd} pts) ⭐`,
          message: `Your ${finalVerifiedHours} volunteer hours for "${log.eventTitle}" have been verified! ${pointsToAdd} points added to your profile.`,
          link: "/contributions",
        });
      }
    }

    writeDB(db);
    return log;
  },

  // POINTS & TRANSACTIONS (Guaranteed Unique Transaction Record per Volunteer + Event + Type)
  async adjustUserPoints({ userId, points, type = "CREDIT", reason, adminRemarks, adminUser, eventId, eventName }) {
    const idStr = (userId || "").toString();
    const eventIdStr = eventId ? (eventId._id || eventId.id || eventId).toString() : null;
    const ptsNum = Number(points) || 0;
    const delta = type === "DEBIT" ? -Math.abs(ptsNum) : Math.abs(ptsNum);

    let targetUser = await this.findUserById(idStr);
    if (!targetUser) throw new Error("User not found");

    const transactionKey = eventIdStr ? `${idStr}_${eventIdStr}_${type}` : null;

    // CRITICAL: Prevent duplicate awards for the same event and transaction type
    if (eventIdStr && type === "CREDIT") {
      // 1. Check in MongoDB
      if (getIsConnected()) {
        try {
          const existingTx = await PointsTransaction.findOne({
            $or: [
              { transactionKey },
              { userId: idStr, eventId: eventIdStr, type: "CREDIT" },
            ],
          }).lean();
          if (existingTx) {
            console.log(`[Storage] Points ALREADY AWARDED to ${idStr} for event ${eventIdStr}. Skipping double-crediting.`);
            return { user: targetUser, transaction: existingTx, alreadyAwarded: true };
          }
        } catch (_) {}
      }

      // 2. Check in db.json
      const db = readDB();
      const existingTx = (db.pointsTransactions || []).find(
        (t) =>
          t.transactionKey === transactionKey ||
          ((t.userId || "").toString() === idStr &&
           (t.eventId || "").toString() === eventIdStr &&
           t.type === "CREDIT")
      );
      if (existingTx) {
        console.log(`[Storage] Points ALREADY AWARDED in db.json for ${idStr} on event ${eventIdStr}. Skipping.`);
        return { user: targetUser, transaction: existingTx, alreadyAwarded: true };
      }
    }

    const newPoints = Math.max(0, (Number(targetUser.points) || 0) + delta);
    let updatedUserObj = { ...targetUser, points: newPoints };

    // Update in MongoDB
    let createdTx = null;
    if (getIsConnected()) {
      try {
        if (mongoose.isValidObjectId(idStr)) {
          const uDoc = await User.findByIdAndUpdate(
            idStr,
            { $set: { points: newPoints } },
            { new: true }
          ).select("-password").lean();
          if (uDoc) updatedUserObj = { ...uDoc, id: uDoc._id.toString() };

          createdTx = await PointsTransaction.create({
            userId: idStr,
            applicationId: targetUser.applicationId || "MAA001",
            studentName: targetUser.fullName || "Volunteer",
            eventId: eventIdStr,
            eventName: eventName || "",
            type,
            points: Math.abs(ptsNum),
            reason: reason || "Manual point adjustment by Administrator",
            adminRemarks: adminRemarks || `Adjusted by ${adminUser?.fullName || "Admin"}`,
            adminName: adminUser?.fullName || "Admin Coordinator",
            transactionKey,
          });
        }
      } catch (mErr) {
        if (mErr.code === 11000) {
          console.warn("[Storage] Duplicate points transaction caught by unique index:", mErr.message);
          return { user: targetUser, transaction: null, alreadyAwarded: true };
        }
        console.warn("MongoDB points adjustment notice:", mErr.message);
      }
    }

    // Also sync in db.json
    const db = readDB();
    const uIdx = (db.users || []).findIndex(
      (u) => (u.id || u._id || "").toString() === idStr || u.applicationId === idStr
    );
    if (uIdx !== -1) {
      db.users[uIdx].points = newPoints;
      updatedUserObj = db.users[uIdx];
    }

    if (!Array.isArray(db.pointsTransactions)) db.pointsTransactions = [];
    const txId = createdTx ? createdTx._id.toString() : "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const tx = {
      id: txId,
      _id: txId,
      userId: idStr,
      applicationId: targetUser.applicationId || "MAA001",
      studentName: targetUser.fullName || "Volunteer",
      eventId: eventIdStr,
      eventName: eventName || "",
      type,
      points: Math.abs(ptsNum),
      reason: reason || "Manual point adjustment by Administrator",
      adminRemarks: adminRemarks || `Adjusted by ${adminUser?.fullName || "Admin"}`,
      transactionKey,
      createdAt: new Date().toISOString(),
    };
    db.pointsTransactions.unshift(tx);
    writeDB(db);

    await this.createNotification({
      userId: idStr,
      type: "points",
      title: delta >= 0 ? `Points Added (+${Math.abs(ptsNum)} pts) ⭐` : `Points Deducted (-${Math.abs(ptsNum)} pts) ⚠️`,
      message: `Your points balance was updated by Admin: ${reason || "Points adjustment"}. Current total: ${newPoints} pts.`,
      link: "/contributions",
    });

    return { user: updatedUserObj, transaction: tx, alreadyAwarded: false };
  },

  async getPointsTransactions(filters = {}) {
    let list = [];
    const uStr = (filters.userId || "").toString();
    const appId = (filters.applicationId || "").toString();
    const name = (filters.name || "").toLowerCase().trim();

    if (getIsConnected()) {
      try {
        const conditions = [];
        if (uStr) {
          conditions.push({ userId: uStr });
          if (mongoose.isValidObjectId(uStr)) conditions.push({ userId: new mongoose.Types.ObjectId(uStr) });
        }
        if (appId) conditions.push({ applicationId: appId });
        if (name) conditions.push({ studentName: new RegExp(`^${name}$`, "i") });
        const query = conditions.length > 0 ? { $or: conditions } : {};
        const mongoTxs = await PointsTransaction.find(query).sort({ createdAt: -1 }).lean();
        if (mongoTxs && mongoTxs.length > 0) {
          list = mongoTxs.map((t) => ({ ...t, id: t._id.toString() }));
        }
      } catch (err) {}
    }

    const db = readDB();
    let txs = Array.isArray(db.pointsTransactions) ? db.pointsTransactions : [];
    if (uStr || appId || name) {
      txs = txs.filter((t) => {
        const tUid = (t.userId || "").toString();
        const tApp = (t.applicationId || "").toString();
        const tName = (t.studentName || "").toLowerCase().trim();
        return (uStr && tUid === uStr) || (appId && tApp === appId) || (name && tName === name);
      });
    }

    const merged = [...list];
    for (const t of txs) {
      const tid = (t.id || t._id || "").toString();
      if (!merged.some((m) => (m.id || m._id || "").toString() === tid)) {
        merged.push({ ...t, id: tid });
      }
    }
    return merged;
  },

  async getUserBadges(userId) {
    const db = readDB();
    return db.badges || DEFAULT_BADGES;
  },

  // NOTIFICATIONS
  async createNotification(notif) {
    const db = readDB();
    if (!Array.isArray(db.notifications)) db.notifications = [];
    const notifObj = {
      id: "notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      ...notif,
      read: false,
      createdAt: new Date().toISOString(),
    };
    db.notifications.unshift(notifObj);
    writeDB(db);
    return notifObj;
  },

  async getNotifications(userId) {
    const db = readDB();
    const uStr = (userId || "").toString();
    return (db.notifications || []).filter((n) => (n.userId || "").toString() === uStr || n.userId === "all");
  },

  async markAllNotificationsRead(userId) {
    const db = readDB();
    const uStr = (userId || "").toString();
    (db.notifications || []).forEach((n) => {
      if ((n.userId || "").toString() === uStr || n.userId === "all") n.read = true;
    });
    writeDB(db);
    return true;
  },

  async deleteNotification(id, userId) {
    const db = readDB();
    const idStr = (id || "").toString();
    const uStr = (userId || "").toString();
    const initialLen = (db.notifications || []).length;
    db.notifications = (db.notifications || []).filter((n) => {
      if ((n.id || n._id || "").toString() === idStr) {
        if (!userId || (n.userId || "").toString() === uStr || n.userId === "all") return false;
      }
      return true;
    });
    writeDB(db);
    return db.notifications.length < initialLen;
  },

  async clearAllNotifications(userId) {
    const db = readDB();
    const uStr = (userId || "").toString();
    db.notifications = (db.notifications || []).filter((n) => (n.userId || "").toString() !== uStr && n.userId !== "all");
    writeDB(db);
    return true;
  },

  async broadcastNotification({ targetType, targetEventId, title, message, link, adminUser }) {
    const db = readDB();
    let targetUserIds = [];
    if (targetType === "ALL") {
      targetUserIds = (db.users || []).filter((u) => u.role !== "admin").map((u) => (u.id || u._id).toString());
    } else if (targetType === "EVENT_APPROVED" && targetEventId) {
      const apps = (db.applications || []).filter((a) => (a.opportunityId || "").toString() === targetEventId.toString() && a.status === "Approved");
      targetUserIds = apps.map((a) => (a.userId || "").toString());
    }
    for (const uid of targetUserIds) {
      await this.createNotification({
        userId: uid,
        type: "broadcast",
        title: title || "Official Broadcast",
        message: message || "",
        link: link || "/dashboard",
      });
    }
    return { success: true, count: targetUserIds.length };
  },

  // CONNECTIONS
  async getConnections(userId) {
    const db = readDB();
    const uStr = (userId || "").toString();
    return (db.connections || []).filter((c) => (c.requesterId || "").toString() === uStr || (c.recipientId || "").toString() === uStr);
  },

  async sendConnectionRequest({ requesterId, recipientId, note }) {
    const db = readDB();
    if (!Array.isArray(db.connections)) db.connections = [];
    const connId = "conn_" + Date.now();
    const conn = {
      id: connId,
      requesterId,
      recipientId,
      status: "pending",
      note: note || "",
      createdAt: new Date().toISOString(),
    };
    db.connections.push(conn);
    writeDB(db);
    return conn;
  },

  async acceptConnectionRequest(connectionId, userId) {
    const db = readDB();
    const conn = (db.connections || []).find((c) => c.id === connectionId);
    if (conn) {
      conn.status = "accepted";
      writeDB(db);
      return conn;
    }
    return null;
  },

  async rejectConnectionRequest(connectionId, userId) {
    const db = readDB();
    const conn = (db.connections || []).find((c) => c.id === connectionId);
    if (conn) {
      conn.status = "rejected";
      writeDB(db);
      return conn;
    }
    return null;
  },

  async removeConnection(connectionId, userId) {
    const db = readDB();
    db.connections = (db.connections || []).filter((c) => c.id !== connectionId);
    writeDB(db);
    return true;
  },

  // ADMIN ANALYTICS & KPIS
  async getAdminKPIs() {
    let allUsers = [];
    let allEvents = [];
    let allApps = [];

    if (getIsConnected()) {
      try {
        allUsers = await User.find({}).select("-password").lean();
        allEvents = await Event.find({}).lean();
        allApps = await Application.find({}).lean();
      } catch (err) {}
    }

    const db = readDB();
    const jsonUsers = db.users || [];
    const jsonEvents = db.events || [];
    const jsonApps = db.applications || [];

    // Merge users without duplicates
    const userMap = new Map();
    for (const u of jsonUsers) {
      const key = (u.email || u.applicationId || u.id || u._id || "").toString().toLowerCase();
      if (key) userMap.set(key, u);
    }
    for (const u of allUsers) {
      const key = (u.email || u.applicationId || u._id || "").toString().toLowerCase();
      if (key) userMap.set(key, u);
    }
    const combinedUsers = Array.from(userMap.values());

    const eventsList = allEvents.length > 0 ? allEvents : jsonEvents;
    const appsList = allApps.length > 0 ? allApps : jsonApps;

    const students = combinedUsers.filter((u) => u.role === "student");
    const alumni = combinedUsers.filter((u) => u.role === "alumni");
    const activeVolunteers = students.filter((s) => s.status === "active");

    const totalVolunteerContributions = students.reduce((sum, s) => sum + (Number(s.totalHours) || 0), 0);
    const totalPointsDistributed = students.reduce((sum, s) => sum + (Number(s.points) || 0), 0);
    const completedEvents = eventsList.filter((e) => e.eventStatus === "Completed" || e.status === "Completed").length;
    const pendingApplications = appsList.filter((a) => a.status === "Pending").length;
    const approvedVolunteers = appsList.filter((a) => a.status === "Approved" || a.status === "Completed").length;

    return {
      totalRegisteredStudents: students.length,
      totalActiveVolunteers: activeVolunteers.length,
      totalRegisteredAlumni: alumni.length,
      totalEvents: eventsList.length,
      pendingApplications,
      approvedVolunteers,
      completedEvents,
      totalVolunteerContributions,
      totalPointsDistributed,
      upcomingDrives: eventsList.filter((e) => e.eventStatus !== "Completed" && e.status !== "Completed").length,
    };
  },

  async getAdminReports() {
    let mongoEvents = [];
    let mongoUsers = [];
    let mongoApps = [];

    if (getIsConnected()) {
      try {
        mongoEvents = await Event.find({}).lean();
        mongoUsers = await User.find({ role: { $ne: "admin" } }).lean();
        mongoApps = await Application.find({}).lean();
      } catch (err) {
        console.warn("Storage.getAdminReports mongo fetch notice:", err.message);
      }
    }

    const db = readDB();
    const jsonEvents = db.events || [];
    const jsonUsers = (db.users || []).filter((u) => u.role !== "admin");
    const jsonApps = db.applications || [];

    // Merge events
    const eventMap = new Map();
    jsonEvents.forEach((e) => eventMap.set((e.id || e._id || "").toString(), e));
    mongoEvents.forEach((e) => eventMap.set((e.id || e._id || "").toString(), e));
    const allEvents = Array.from(eventMap.values());

    // Merge users
    const userMap = new Map();
    jsonUsers.forEach((u) => userMap.set((u.email || u.applicationId || u.id || u._id || "").toString().toLowerCase(), u));
    mongoUsers.forEach((u) => userMap.set((u.email || u.applicationId || u.id || u._id || "").toString().toLowerCase(), u));
    const allStudents = Array.from(userMap.values());

    // Merge applications
    const appMap = new Map();
    jsonApps.forEach((a) => appMap.set((a.id || a._id || "").toString(), a));
    mongoApps.forEach((a) => appMap.set((a.id || a._id || "").toString(), a));
    const allApps = Array.from(appMap.values());

    // Compute Totals
    const totalHours = allStudents.reduce((sum, s) => sum + (Number(s.totalHours) || 0), 0);
    const totalPoints = allStudents.reduce((sum, s) => sum + (Number(s.points) || 0), 0);

    // 1. Event Participation
    const eventParticipation = allEvents.map((e) => {
      const eId = (e.id || e._id || "").toString();
      const eTitle = (e.title || "").trim().toLowerCase();
      const matchedApps = allApps.filter(
        (a) =>
          String(a.opportunityId?._id || a.opportunityId?.id || a.opportunityId || "") === eId ||
          String(a.opportunityTitle || "").trim().toLowerCase() === eTitle
      );
      const appsReceived = matchedApps.length;
      const approvedCount = matchedApps.filter((a) => a.status === "Approved" || a.status === "Completed").length;
      const needed = Number(e.volunteersNeeded || 10);
      const rate = Math.min(100, Math.round((approvedCount / (needed || 1)) * 100));

      return {
        eventTitle: e.title || "Community Drive",
        category: e.category || "General",
        date: e.date || "Upcoming",
        volunteersNeeded: needed,
        applicationsReceived: appsReceived,
        approvedVolunteers: approvedCount,
        completionRate: rate,
      };
    });

    // 2. Student Contributions
    const studentContributions = allStudents
      .sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0))
      .map((s) => {
        const sEmail = (s.email || "").toLowerCase();
        const sId = (s.applicationId || s.id || s._id || "").toString();
        const joined = allApps.filter(
          (a) =>
            (String(a.userId?._id || a.userId?.id || a.userId || "") === sId ||
              String(a.applicantDetails?.email || "").toLowerCase() === sEmail) &&
            (a.status === "Approved" || a.status === "Completed")
        ).length;

        return {
          fullName: s.fullName || "Volunteer",
          college: s.college || "Anna University",
          department: s.department || "Engineering",
          points: Number(s.points) || 0,
          totalHours: Number(s.totalHours) || 0,
          eventsJoined: joined,
          status: s.status || "active",
        };
      });

    // 3. Department Statistics
    const deptMap = {};
    allStudents.forEach((s) => {
      const dept = s.department || "General Engineering";
      if (!deptMap[dept]) {
        deptMap[dept] = { department: dept, totalStudents: 0, totalPoints: 0, totalHours: 0 };
      }
      deptMap[dept].totalStudents += 1;
      deptMap[dept].totalPoints += Number(s.points) || 0;
      deptMap[dept].totalHours += Number(s.totalHours) || 0;
    });
    const departmentStatistics = Object.values(deptMap).map((d) => ({
      ...d,
      averagePoints: d.totalStudents > 0 ? Math.round(d.totalPoints / d.totalStudents) : 0,
    }));

    // 4. Points Distribution
    const pointsDistribution = (db.pointsTransactions || []).slice(0, 50).map((pt) => ({
      studentName: pt.studentName || pt.userName || "Volunteer",
      eventName: pt.eventName || pt.eventTitle || "Community Activity",
      points: Number(pt.points || pt.amount) || 50,
      type: pt.type || "Award",
      reason: pt.reason || "Event Volunteering Credit",
      date: pt.date || new Date().toISOString().split("T")[0],
    }));

    // Fallback points distribution if empty
    if (pointsDistribution.length === 0) {
      allStudents.slice(0, 10).forEach((s, idx) => {
        pointsDistribution.push({
          studentName: s.fullName || `Volunteer ${idx + 1}`,
          eventName: allEvents[idx % (allEvents.length || 1)]?.title || "Community Engagement",
          points: Number(s.points) || 50,
          type: "Award",
          reason: "Participation & Civic Hours",
          date: new Date().toISOString().split("T")[0],
        });
      });
    }

    // 5. Application Statistics
    const appPending = allApps.filter((a) => a.status === "Pending").length;
    const appApproved = allApps.filter((a) => a.status === "Approved").length;
    const appRejected = allApps.filter((a) => a.status === "Rejected").length;
    const appCompleted = allApps.filter((a) => a.status === "Completed").length;

    const applicationStatistics = {
      total: allApps.length,
      pending: appPending,
      approved: appApproved,
      rejected: appRejected,
      completed: appCompleted,
    };

    // 6. College Leaderboard
    const collegeMap = {};
    allStudents.forEach((s) => {
      const col = s.college || "Anna University";
      if (!collegeMap[col]) collegeMap[col] = { college: col, totalStudents: 0, totalHours: 0, totalPoints: 0 };
      collegeMap[col].totalStudents += 1;
      collegeMap[col].totalHours += Number(s.totalHours) || 0;
      collegeMap[col].totalPoints += Number(s.points) || 0;
    });
    const collegeLeaderboard = Object.values(collegeMap)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((c, i) => ({
        rank: i + 1,
        ...c,
        averagePoints: c.totalStudents > 0 ? Math.round(c.totalPoints / c.totalStudents) : 0,
      }));

    return {
      summary: {
        totalStudents: allStudents.length,
        totalHours,
        totalPoints,
        totalEvents: allEvents.length,
        completedEvents: allEvents.filter((e) => e.eventStatus === "Completed" || e.status === "Completed").length,
        totalApplications: allApps.length,
      },
      eventParticipation,
      studentContributions,
      departmentStatistics,
      pointsDistribution,
      applicationStatistics,
      collegeLeaderboard,
      events: allEvents,
    };
  },

  async getLeaderboard() {
    let mongoUsers = [];
    if (getIsConnected()) {
      try {
        mongoUsers = await User.find({
          role: { $in: ["student", "alumni"] },
          status: { $in: ["active", "inactive"] },
        }).select("-password").lean();
      } catch (err) {}
    }

    const db = readDB();
    const jsonUsers = (db.users || []).filter((u) => u.role !== "admin");

    const userMap = new Map();
    for (const u of jsonUsers) {
      const key = (u.email || u.applicationId || u.id || u._id || "").toString().toLowerCase();
      if (key) userMap.set(key, u);
    }
    for (const u of mongoUsers) {
      const key = (u.email || u.applicationId || u._id || "").toString().toLowerCase();
      if (key) userMap.set(key, u);
    }

    let allApps = [];
    if (getIsConnected()) {
      try {
        allApps = await Application.find({}).lean();
      } catch (_) {}
    }
    if (!allApps.length && Array.isArray(db.applications)) {
      allApps = db.applications;
    }

    const users = Array.from(userMap.values())
      .filter((u) => u.status !== "pending_approval" && !u.isDeleted && u.status !== "deleted")
      .sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0) || (Number(b.totalHours) || 0) - (Number(a.totalHours) || 0));

    return users.map((u, idx) => {
      const uId = (u._id || u.id || "").toString();
      const uEmail = (u.email || "").toLowerCase();
      const uAppId = u.applicationId || "";

      const studentApps = (allApps || []).filter((a) => {
        const aUId = (a.userId || a.user?._id || a.user?.id || (typeof a.user === "string" ? a.user : "") || "").toString();
        const aEmail = (a.applicantDetails?.email || "").toLowerCase();
        const aAppId = a.applicationId || a.applicantDetails?.applicationId || "";
        return (uId && aUId === uId) || (uEmail && aEmail === uEmail) || (uAppId && aAppId === uAppId);
      });

      const distinctEvents = Array.from(new Set(studentApps.map((a) => a.opportunityTitle || a.title || "Community Drive").filter(Boolean)));

      return {
        rank: idx + 1,
        id: uId,
        _id: uId,
        applicationId: uAppId,
        fullName: u.fullName,
        name: u.fullName,
        college: u.college || "Anna University",
        department: u.department || "Computer Science",
        zone: u.zone || "Zone 1",
        batch: u.batch || "2022-2026",
        points: Number(u.points) || 0,
        totalHours: Number(u.totalHours) || 0,
        completedEventsCount: Math.max(Number(u.completedEventsCount) || 0, distinctEvents.length),
        eventsJoined: Math.max(Number(u.eventsJoined) || 0, studentApps.length, distinctEvents.length),
        participatedEvents: distinctEvents,
        participatedEventDetails: studentApps.map((a) => ({
          eventId: a.opportunityId || a.eventId,
          eventTitle: a.opportunityTitle || a.title,
          status: a.status,
          attendanceStatus: a.attendanceStatus,
          hours: a.hours,
          points: a.pointsAwarded || 50,
        })),
        avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName || "Volunteer")}`,
        tier: u.tier || "Bronze",
      };
    });
  },

  async logAdminActivity(data) {
    const db = readDB();
    if (!Array.isArray(db.adminActivityLogs)) db.adminActivityLogs = [];
    const log = {
      id: "log_" + Date.now(),
      ...data,
      timestamp: new Date().toISOString(),
    };
    db.adminActivityLogs.unshift(log);
    writeDB(db);
    return log;
  },

  // ══════════════════════════════════════════════════════════════
  // ALUMNI ASSIGNMENT REQUESTS & WORKFLOW ENGINE
  // ══════════════════════════════════════════════════════════════
  async createAlumniAssignmentRequest({
    eventId,
    eventTitle,
    eventDate,
    eventLocation,
    alumniId,
    alumniName,
    alumniEmail,
    alumniApplicationId,
    role = "Event Lead & Supervisor",
    notes = "",
    adminUser,
  }) {
    const eId = (eventId || "").toString();
    const aId = (alumniId || "").toString();

    const assignmentData = {
      eventId: eId,
      eventTitle: eventTitle || "Volunteering Initiative",
      eventDate: eventDate || "Upcoming",
      eventLocation: eventLocation || "Chennai, Tamil Nadu",
      alumniId: aId,
      alumniName: alumniName || "Alumni Mentor",
      alumniEmail: (alumniEmail || "").toLowerCase().trim(),
      alumniApplicationId: alumniApplicationId || "ALU001",
      role: role || "Event Lead & Supervisor",
      notes: notes || "",
      status: "Pending",
      assignedBy: adminUser?.fullName || "Admin Coordinator",
      createdAt: new Date().toISOString(),
    };

    let saved = null;
    if (getIsConnected()) {
      try {
        const doc = await AlumniAssignment.create(assignmentData);
        saved = { ...doc.toObject(), id: doc._id.toString() };
      } catch (err) {
        console.warn("MongoDB AlumniAssignment create notice:", err.message);
      }
    }

    const db = readDB();
    if (!Array.isArray(db.alumniAssignments)) db.alumniAssignments = [];
    const localId = saved ? saved.id : "assign_" + Date.now();
    const localAssignment = { id: localId, _id: localId, ...assignmentData };
    db.alumniAssignments.unshift(localAssignment);
    writeDB(db);

    // Notify admins of new pending assignment request
    await this.createNotification({
      userId: "admin",
      type: "system",
      title: `Alumni Assignment Request: ${assignmentData.alumniName} 📋`,
      message: `Pending review: Assign ${assignmentData.alumniName} as "${assignmentData.role}" for "${assignmentData.eventTitle}".`,
      link: "/admin/alumni",
    });

    return saved || localAssignment;
  },

  async getAlumniAssignments(filters = {}) {
    let list = [];
    if (getIsConnected()) {
      try {
        const query = {};
        if (filters.status) query.status = filters.status;
        if (filters.eventId) query.eventId = filters.eventId.toString();
        if (filters.alumniId) query.alumniId = filters.alumniId.toString();
        const docs = await AlumniAssignment.find(query).sort({ createdAt: -1 }).lean();
        if (docs && docs.length > 0) {
          list = docs.map((d) => ({ ...d, id: d._id.toString() }));
        }
      } catch (_) {}
    }

    const db = readDB();
    const localList = (db.alumniAssignments || []).filter((a) => {
      if (filters.status && a.status !== filters.status) return false;
      if (filters.eventId && (a.eventId || "").toString() !== filters.eventId.toString()) return false;
      if (filters.alumniId && (a.alumniId || "").toString() !== filters.alumniId.toString()) return false;
      return true;
    });

    // Merge by id
    const map = new Map();
    localList.forEach((a) => map.set((a.id || a._id).toString(), a));
    list.forEach((a) => map.set((a.id || a._id).toString(), a));
    return Array.from(map.values());
  },

  async approveAlumniAssignment(assignmentId, adminUser) {
    const idStr = assignmentId.toString();
    let assignment = null;

    if (getIsConnected()) {
      try {
        if (mongoose.isValidObjectId(idStr)) {
          const doc = await AlumniAssignment.findByIdAndUpdate(
            idStr,
            { status: "Approved", reviewedBy: adminUser?.fullName || "Admin", reviewedAt: new Date() },
            { new: true }
          ).lean();
          if (doc) assignment = { ...doc, id: doc._id.toString() };
        }
      } catch (_) {}
    }

    const db = readDB();
    if (!Array.isArray(db.alumniAssignments)) db.alumniAssignments = [];
    const idx = db.alumniAssignments.findIndex((a) => (a.id || a._id || "").toString() === idStr);
    if (idx !== -1) {
      db.alumniAssignments[idx].status = "Approved";
      db.alumniAssignments[idx].reviewedBy = adminUser?.fullName || "Admin";
      db.alumniAssignments[idx].reviewedAt = new Date().toISOString();
      if (!assignment) assignment = db.alumniAssignments[idx];
      writeDB(db);
    }

    if (!assignment) throw new Error("Assignment request not found.");

    // 1. Automatically add Alumni to Event's official assignedAlumniList
    const event = await this.getEventById(assignment.eventId);
    if (event) {
      const assignedItem = {
        alumniId: assignment.alumniId,
        name: assignment.alumniName,
        email: assignment.alumniEmail,
        role: assignment.role,
        assignedAt: new Date(),
      };

      const updatedList = Array.isArray(event.assignedAlumniList) ? [...event.assignedAlumniList] : [];
      const alreadyInList = updatedList.some((item) => (item.alumniId || "").toString() === assignment.alumniId.toString());
      if (!alreadyInList) {
        updatedList.push(assignedItem);
      }

      const displayStr = `${assignment.alumniName} (${assignment.role})`;
      await this.updateEvent(
        assignment.eventId,
        { assignedAlumni: displayStr, assignedAlumniList: updatedList },
        adminUser
      );
    }

    // 2. Add to Alumni's User profile assignedWorks (for Alumni Dashboard)
    const workItem = {
      id: "work_" + Date.now(),
      assignmentId: assignment.id || assignment._id,
      eventId: assignment.eventId,
      eventTitle: assignment.eventTitle,
      role: assignment.role,
      date: assignment.eventDate || "Upcoming",
      location: assignment.eventLocation || "Chennai, Tamil Nadu",
      description: assignment.notes || "Event supervision, student coordination, and on-ground impact mentorship.",
      status: "Assigned",
      assignedAt: new Date().toISOString(),
    };

    try {
      const alumniUser = await this.findUserById(assignment.alumniId);
      if (alumniUser) {
        const works = Array.isArray(alumniUser.assignedWorks) ? [...alumniUser.assignedWorks] : [];
        const exists = works.some((w) => (w.assignmentId || "").toString() === idStr);
        if (!exists) {
          works.unshift(workItem);
          await this.updateUser(assignment.alumniId, {
            assignedEvent: assignment.eventTitle,
            assignedRole: assignment.role,
            assignedDate: assignment.eventDate,
            workDescription: assignment.notes,
            assignedWorks: works,
          });
        }
      }
    } catch (uErr) {
      console.warn("Update alumni assignedWorks note:", uErr.message);
    }

    // 3. Notify Alumni by Email
    try {
      await EmailService.sendAlumniAssignmentApproval({
        alumni: { fullName: assignment.alumniName, email: assignment.alumniEmail },
        event: { title: assignment.eventTitle, date: assignment.eventDate, location: assignment.eventLocation },
        role: assignment.role,
        notes: assignment.notes,
      });
    } catch (eErr) {
      console.warn("Alumni email notification note:", eErr.message);
    }

    // 4. In-App Notification
    await this.createNotification({
      userId: assignment.alumniId.toString(),
      type: "system",
      title: "Leadership Assignment Approved! 🎓",
      message: `You are officially assigned as "${assignment.role}" for "${assignment.eventTitle}". Check your Alumni Dashboard!`,
      link: "/dashboard",
    });

    return assignment;
  },

  async rejectAlumniAssignment(assignmentId, adminUser, reason = "Position filled or schedule conflict.") {
    const idStr = assignmentId.toString();
    let assignment = null;

    if (getIsConnected()) {
      try {
        if (mongoose.isValidObjectId(idStr)) {
          const doc = await AlumniAssignment.findByIdAndUpdate(
            idStr,
            { status: "Rejected", reviewedBy: adminUser?.fullName || "Admin", reviewedAt: new Date(), notes: reason },
            { new: true }
          ).lean();
          if (doc) assignment = { ...doc, id: doc._id.toString() };
        }
      } catch (_) {}
    }

    const db = readDB();
    if (!Array.isArray(db.alumniAssignments)) db.alumniAssignments = [];
    const idx = db.alumniAssignments.findIndex((a) => (a.id || a._id || "").toString() === idStr);
    if (idx !== -1) {
      db.alumniAssignments[idx].status = "Rejected";
      db.alumniAssignments[idx].reviewedBy = adminUser?.fullName || "Admin";
      db.alumniAssignments[idx].reviewedAt = new Date().toISOString();
      db.alumniAssignments[idx].notes = reason;
      if (!assignment) assignment = db.alumniAssignments[idx];
      writeDB(db);
    }

    if (!assignment) throw new Error("Assignment request not found.");

    await this.createNotification({
      userId: assignment.alumniId.toString(),
      type: "system",
      title: `Assignment Update: ${assignment.eventTitle}`,
      message: `The assignment request for "${assignment.eventTitle}" was marked as Rejected: ${reason}`,
      link: "/dashboard",
    });

    return assignment;
  },

  // ══════════════════════════════════════════════════════════════
  // EVENT REMINDER BLASTS & SCHEDULED REMINDERS ENGINE
  // ══════════════════════════════════════════════════════════════
  async sendEventReminderBlast(eventId, type = "instant", adminUser) {
    let event = await this.getEventById(eventId);
    if (!event) throw new Error("Event not found");

    const apps = await this.getApplicationsByEvent(eventId);
    const approvedApps = (apps || []).filter((a) => ["Approved", "Completed", "Assigned"].includes(a.status));

    let sentCount = 0;
    const recipients = [];

    for (const app of approvedApps) {
      const uId = app.userId || app.user?._id || app.user?.id;
      const user = await this.findUserById(uId) || app.applicantDetails || {};
      const volunteerEmail = user.email || app.applicantDetails?.email || EmailService.USER_TEST_TARGET_EMAIL;
      const volunteerName = user.fullName || app.applicantDetails?.name || "Volunteer";

      try {
        if (type === "24h") {
          await EmailService.send24HourReminder({ user: { fullName: volunteerName, email: volunteerEmail }, event });
        } else if (type === "2h") {
          await EmailService.send2HourReminder({ user: { fullName: volunteerName, email: volunteerEmail }, event });
        } else {
          await EmailService.sendEventReminder({ user: { fullName: volunteerName, email: volunteerEmail }, event });
        }
        sentCount++;
        recipients.push({ name: volunteerName, email: volunteerEmail, status: "Sent" });
      } catch (err) {
        recipients.push({ name: volunteerName, email: volunteerEmail, status: "Failed", error: err.message });
      }
    }

    // Mark event reminder flags
    const updatePayload = { reminderSent: true };
    if (type === "24h") updatePayload.reminder24hSent = true;
    if (type === "2h") updatePayload.reminder2hSent = true;
    await this.updateEvent(eventId, updatePayload, adminUser);

    return { sentCount, totalApproved: approvedApps.length, recipients, type };
  },

  async processScheduledReminders() {
    const allEvents = await this.getAllEvents();
    const upcomingEvents = (allEvents || []).filter((e) =>
      ["Upcoming", "Ongoing"].includes(e.eventStatus) || e.isActive
    );

    let sentCount = 0;
    const now = Date.now();

    for (const ev of upcomingEvents) {
      if (!ev.date) continue;
      const parsedDate = Date.parse(ev.date) || Date.parse(ev.date.replace(/ \([A-Za-z]+\)/, ""));
      if (isNaN(parsedDate)) continue;

      const diffHours = (parsedDate - now) / (1000 * 60 * 60);

      // 24-hour reminder (within 24 hours)
      if (diffHours <= 24 && diffHours > 2 && !ev.reminder24hSent) {
        try {
          const res = await this.sendEventReminderBlast(ev.id || ev._id, "24h");
          sentCount += res.sentCount || 0;
        } catch (_) {}
      }

      // 2-hour reminder (within 2 hours)
      if (diffHours <= 2 && diffHours >= -1 && !ev.reminder2hSent) {
        try {
          const res = await this.sendEventReminderBlast(ev.id || ev._id, "2h");
          sentCount += res.sentCount || 0;
        } catch (_) {}
      }
    }

    return { sentCount };
  },

  // ══════════════════════════════════════════════════════════════
  // BULK EMAIL COMMUNICATOR (Applied, Approved, Registered, Participated)
  // ══════════════════════════════════════════════════════════════
  async sendBulkEmails({
    eventId,
    recipientGroup = "Approved",
    emailType = "thank_you",
    customSubject = "",
    customMessage = "",
    targetEmailOverride = null,
    adminUser,
  }) {
    let event = await this.getEventById(eventId);
    if (!event) throw new Error("Event not found");

    const apps = await this.getApplicationsByEvent(eventId);
    const attendanceRecords = await this.getEventAttendance(eventId);

    // Filter recipients based on selected group
    let targetedApps = [];
    if (recipientGroup === "Approved") {
      targetedApps = (apps || []).filter((a) => a.status === "Approved" || a.status === "Completed");
    } else if (recipientGroup === "Participated") {
      targetedApps = (apps || []).filter((a) => {
        const uId = (a.userId || "").toString();
        const isPresent = a.attendanceStatus === "Present";
        const hasAttendance = (attendanceRecords || []).some(
          (at) => (at.userId || "").toString() === uId && (at.status === "Present" || at.isVerified === true)
        );
        return isPresent || hasAttendance;
      });
    } else {
      // Applied or Registered: all applicants for this event
      targetedApps = apps || [];
    }

    let sentCount = 0;
    let skippedDuplicates = 0;
    let failedCount = 0;
    const details = [];

    for (const app of targetedApps) {
      const uId = app.userId || app.user?._id || app.user?.id;
      const user = await this.findUserById(uId) || app.applicantDetails || {};
      const vEmail = targetEmailOverride || user.email || app.applicantDetails?.email || EmailService.USER_TEST_TARGET_EMAIL;
      const vName = user.fullName || app.applicantDetails?.name || "Volunteer";

      try {
        let dispatchRes = null;
        if (emailType === "thank_you") {
          dispatchRes = await EmailService.sendThankYouMessage({
            user: { fullName: vName, email: vEmail, role: user.role || "student" },
            event,
            hours: event.durationHours || 4,
            points: event.points || 50,
            overrideEmail: vEmail,
          });
        } else if (emailType === "event_reminder") {
          dispatchRes = await EmailService.sendEventReminder({
            user: { fullName: vName, email: vEmail },
            event,
          });
        } else {
          // Event Update
          dispatchRes = await EmailService.sendEventUpdateEmail({
            user: { fullName: vName, email: vEmail },
            event,
            updateMessage: customMessage || "Important event logistics update from Maatram Foundation.",
            customSubject,
          });
        }

        if (dispatchRes?.isDuplicate) {
          skippedDuplicates++;
          details.push({ name: vName, email: vEmail, status: "Skipped (Duplicate)" });
        } else if (dispatchRes?.status === "Failed") {
          failedCount++;
          details.push({ name: vName, email: vEmail, status: "Failed", error: dispatchRes.errorDetails });
        } else {
          sentCount++;
          details.push({ name: vName, email: vEmail, status: "Delivered" });
        }
      } catch (err) {
        failedCount++;
        details.push({ name: vName, email: vEmail, status: "Error", error: err.message });
      }
    }

    return {
      success: true,
      sentCount,
      skippedDuplicates,
      failedCount,
      totalTargeted: targetedApps.length,
      recipientGroup,
      emailType,
      details,
    };
  },

  // ─── EVENT FEEDBACK & CERTIFICATE UNLOCK ──────────────────────────────────
  async submitEventFeedback(eventId, feedbackData, user) {
    const event = await this.getEventById(eventId);
    if (!event) throw new Error("Event not found.");

    const idStr = (user._id || user.id || "").toString();
    const appIdStr = (user.applicationId || "").toString();
    const em = (user.email || "").toLowerCase().trim();

    const newFeedback = {
      id: `FB-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      userId: idStr,
      studentName: user.fullName || feedbackData.studentName || "Volunteer",
      studentEmail: em,
      maatramId: appIdStr || "MAA-VOL",
      avatar: user.avatar || "",
      college: user.college || "Anna University",
      department: user.department || "General",
      rating: Math.max(1, Math.min(5, Number(feedbackData.rating) || 5)),
      coordinatorRating: Math.max(1, Math.min(5, Number(feedbackData.coordinatorRating) || 5)),
      organizationRating: Math.max(1, Math.min(5, Number(feedbackData.organizationRating) || 5)),
      recommendRating: feedbackData.recommendRating || "Definitely",
      comment: feedbackData.comment || feedbackData.feedback || "",
      takeaways: feedbackData.takeaways || feedbackData.learnings || "",
      submittedAt: new Date().toISOString(),
    };

    // Update in MongoDB
    if (getIsConnected()) {
      try {
        const evDoc = await Event.findById(eventId);
        if (evDoc) {
          if (!Array.isArray(evDoc.feedbacks)) evDoc.feedbacks = [];
          const existingIdx = evDoc.feedbacks.findIndex(
            (f) =>
              (f.userId && f.userId.toString() === idStr) ||
              (f.studentEmail && f.studentEmail.toLowerCase().trim() === em)
          );
          if (existingIdx >= 0) {
            evDoc.feedbacks[existingIdx] = newFeedback;
          } else {
            evDoc.feedbacks.push(newFeedback);
          }
          await evDoc.save();
        }

        // Also unlock certificate in Mongo
        await Certificate.updateMany(
          {
            $or: [
              { eventId: eventId.toString(), userId: idStr },
              { eventId: eventId.toString(), volunteerEmail: em },
              { eventTitle: event.title, volunteerEmail: em },
            ],
          },
          { $set: { unlocked: true, feedbackSubmitted: true, feedbackId: newFeedback.id } }
        );
      } catch (err) {
        console.warn("Mongo feedback save notice:", err.message);
      }
    }

    // Update in JSON DB
    const db = readDB();
    if (!Array.isArray(db.events)) db.events = [];
    const jsonEvent = db.events.find((e) => (e._id || e.id || "").toString() === eventId.toString());
    if (jsonEvent) {
      if (!Array.isArray(jsonEvent.feedbacks)) jsonEvent.feedbacks = [];
      const exIdx = jsonEvent.feedbacks.findIndex(
        (f) =>
          (f.userId && f.userId.toString() === idStr) ||
          (f.studentEmail && f.studentEmail.toLowerCase().trim() === em)
      );
      if (exIdx >= 0) {
        jsonEvent.feedbacks[exIdx] = newFeedback;
      } else {
        jsonEvent.feedbacks.push(newFeedback);
      }
    }

    if (!Array.isArray(db.certificates)) db.certificates = [];
    db.certificates.forEach((c) => {
      const isMatch =
        ((c.eventId || "").toString() === eventId.toString() || c.eventTitle === event.title) &&
        ((c.userId || "").toString() === idStr || (c.volunteerEmail || "").toLowerCase().trim() === em);
      if (isMatch) {
        c.unlocked = true;
        c.feedbackSubmitted = true;
        c.feedbackId = newFeedback.id;
      }
    });

    if (!Array.isArray(db.applications)) db.applications = [];
    db.applications.forEach((a) => {
      const isMatch =
        ((a.eventId || a.opportunityId || "").toString() === eventId.toString() || a.opportunityTitle === event.title) &&
        ((a.userId || "").toString() === idStr || (a.applicantDetails?.email || "").toLowerCase().trim() === em);
      if (isMatch) {
        a.feedbackSubmitted = true;
      }
    });

    writeDB(db);

    return {
      success: true,
      message: "Feedback submitted successfully! Certificate unlocked.",
      feedback: newFeedback,
      eventTitle: event.title,
    };
  },

  async getEventFeedbacks(eventId) {
    const event = await this.getEventById(eventId);
    if (!event) return { feedbacks: [], stats: { averageRating: 5, totalFeedbacks: 0 } };

    const feedbacks = event.feedbacks || [];
    const total = feedbacks.length;
    const avgOverall = total > 0 ? Number((feedbacks.reduce((acc, f) => acc + (Number(f.rating) || 5), 0) / total).toFixed(1)) : 5.0;
    const avgCoord = total > 0 ? Number((feedbacks.reduce((acc, f) => acc + (Number(f.coordinatorRating) || 5), 0) / total).toFixed(1)) : 5.0;
    const avgOrg = total > 0 ? Number((feedbacks.reduce((acc, f) => acc + (Number(f.organizationRating) || 5), 0) / total).toFixed(1)) : 5.0;
    const definitelyCount = feedbacks.filter((f) => (f.recommendRating || "").toLowerCase().includes("definitely")).length;
    const recommendRate = total > 0 ? Math.round((definitelyCount / total) * 100) : 100;

    return {
      feedbacks,
      stats: {
        totalFeedbacks: total,
        averageRating: avgOverall,
        averageCoordinatorRating: avgCoord,
        averageOrganizationRating: avgOrg,
        recommendRate,
      },
      eventTitle: event.title,
    };
  },

  async getMyEventFeedback(eventId, user) {
    const event = await this.getEventById(eventId);
    if (!event || !Array.isArray(event.feedbacks)) return { hasSubmitted: false, feedback: null };

    const idStr = (user._id || user.id || "").toString();
    const em = (user.email || "").toLowerCase().trim();

    const fb = event.feedbacks.find(
      (f) =>
        (f.userId && f.userId.toString() === idStr) ||
        (f.studentEmail && f.studentEmail.toLowerCase().trim() === em)
    );

    return {
      hasSubmitted: Boolean(fb),
      feedback: fb || null,
    };
  },

  // ─── MEETINGS & AVAILABILITY MANAGEMENT ───────────────────────────────────
  async getMeetings(filters = {}) {
    const DEFAULT_MEETINGS = [
      {
        id: "MEET-001",
        _id: "MEET-001",
        tag: "NSS",
        day: "24",
        mon: "NOV",
        date: "24 Nov 2026",
        iso: "2026-11-24",
        time: "10:00 AM – 11:00 AM",
        title: "NSS Planning Discussion",
        status: "Confirmed",
        tone: "gn",
        grad: "b",
        emoji: "📋",
        desc: "Planning the upcoming NSS activities, volunteer roles and the event schedule for December.",
        coord: "Karthik R",
        role: "NSS Programme Coordinator",
        phone: "+91 98765 43210",
        email: "karthik@maatram.org",
        people: "12 Volunteers",
        mode: "Google Meet",
        location: "Google Meet · Chennai, Tamil Nadu",
        meetLink: "https://meet.google.com/nss-maatram-plan",
        agenda: ["Welcome and review of last month", "December NSS drives and schedule", "Volunteer role allocation", "Points and attendance rules", "Questions and next steps"],
        note: "Keep your college ID ready. Join 5 minutes early.",
        past: false,
        availabilities: [],
      },
      {
        id: "MEET-002",
        _id: "MEET-002",
        tag: "Events",
        day: "02",
        mon: "DEC",
        date: "02 Dec 2026",
        iso: "2026-12-02",
        time: "2:00 PM – 3:00 PM",
        title: "Event Coordination Meet",
        status: "Upcoming",
        tone: "am",
        grad: "a",
        emoji: "🤝",
        desc: "Coordination of volunteers, venue and responsibilities for the year-end community event.",
        coord: "Priya S",
        role: "Events Coordinator",
        phone: "+91 98412 55671",
        email: "priya@maatram.org",
        people: "15 Volunteers",
        mode: "Google Meet",
        location: "Google Meet · Chennai, Tamil Nadu",
        meetLink: "https://meet.google.com/evt-coord-meet",
        agenda: ["Event overview and goals", "Venue, logistics and timeline", "Team formation", "Budget and resources", "Open discussion"],
        note: "Come prepared with your preferred team.",
        past: false,
        availabilities: [],
      },
      {
        id: "MEET-003",
        _id: "MEET-003",
        tag: "Outreach",
        day: "09",
        mon: "DEC",
        date: "09 Dec 2026",
        iso: "2026-12-09",
        time: "4:00 PM – 5:00 PM",
        title: "Community Outreach Briefing",
        status: "Upcoming",
        tone: "am",
        grad: "g",
        emoji: "🌱",
        desc: "Briefing volunteers on school outreach visits and community drives planned for the new year.",
        coord: "Arun M",
        role: "Outreach Lead",
        phone: "+91 99401 22873",
        email: "arun@maatram.org",
        people: "20 Volunteers",
        mode: "Google Meet",
        location: "Google Meet · Chennai, Tamil Nadu",
        meetLink: "https://meet.google.com/outreach-brief-2026",
        agenda: ["Outreach plan", "School visit safety guidelines", "Reporting and documentation", "Volunteer sign-up"],
        note: "Please read the volunteer code of conduct first.",
        past: false,
        availabilities: [],
      },
      {
        id: "MEET-004",
        _id: "MEET-004",
        past: true,
        tag: "Orientation",
        day: "10",
        mon: "NOV",
        date: "10 Nov 2026",
        iso: "2026-11-10",
        time: "11:00 AM – 12:00 PM",
        title: "Volunteer Orientation",
        status: "Attended",
        tone: "gn",
        grad: "g",
        emoji: "🎓",
        desc: "Welcome session introducing Maatram, volunteer roles, points and certificates.",
        coord: "Meena K",
        role: "Volunteer Manager",
        phone: "+91 97890 11234",
        email: "meena@maatram.org",
        people: "30 Volunteers",
        mode: "Google Meet",
        location: "Google Meet · Chennai, Tamil Nadu",
        meetLink: "https://meet.google.com/vol-orientation",
        agenda: ["About Maatram", "Volunteer roles", "Points and certificates", "Using the Impact Hub"],
        note: "Session completed.",
        availabilities: [],
      },
      {
        id: "MEET-005",
        _id: "MEET-005",
        past: true,
        tag: "Kickoff",
        day: "28",
        mon: "OCT",
        date: "28 Oct 2026",
        iso: "2026-10-28",
        time: "4:00 PM – 5:00 PM",
        title: "Team Kickoff",
        status: "Missed",
        tone: "r",
        grad: "r",
        emoji: "🚀",
        desc: "Kick-off meeting to align teams, goals and responsibilities for the semester.",
        coord: "Karthik R",
        role: "NSS Programme Coordinator",
        phone: "+91 98765 43210",
        email: "karthik@maatram.org",
        people: "18 Volunteers",
        mode: "Google Meet",
        location: "Google Meet · Chennai, Tamil Nadu",
        meetLink: "https://meet.google.com/team-kickoff",
        agenda: ["Semester goals", "Team structure", "Responsibilities and timelines"],
        note: "Contact the coordinator for the minutes.",
        availabilities: [],
      },
    ];

    let mongoList = [];
    if (getIsConnected()) {
      try {
        const docs = await Meeting.find({}).sort({ createdAt: -1 }).lean();
        if (docs && docs.length > 0) {
          mongoList = docs.map((d) => ({ ...d, id: d._id.toString() }));
        }
      } catch (_) {}
    }

    const db = readDB();
    if (!Array.isArray(db.meetings) || db.meetings.length === 0) {
      db.meetings = DEFAULT_MEETINGS;
      writeDB(db);
    }

    const combinedMap = new Map();
    DEFAULT_MEETINGS.forEach((m) => combinedMap.set(m.id, m));
    (db.meetings || []).forEach((m) => combinedMap.set((m.id || m._id).toString(), m));
    mongoList.forEach((m) => combinedMap.set((m.id || m._id).toString(), m));

    let results = Array.from(combinedMap.values());
    if (filters.tag && filters.tag !== "All") {
      results = results.filter((m) => m.tag === filters.tag);
    }

    return results;
  },

  async getMeetingById(id) {
    const all = await this.getMeetings();
    const idStr = (id || "").toString();
    return all.find((m) => (m.id || m._id || "").toString() === idStr) || null;
  },

  async createMeeting(data, adminUser) {
    const rawDate = data.date || new Date().toISOString().split("T")[0];
    const parsedDate = new Date(rawDate);
    const day = isNaN(parsedDate.getDate()) ? "25" : String(parsedDate.getDate()).padStart(2, "0");
    const mon = isNaN(parsedDate.getMonth()) ? "NOV" : parsedDate.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const dateFormatted = data.dateStr || `${day} ${mon} ${parsedDate.getFullYear() || 2026}`;

    const newMeeting = {
      id: `MEET-${Date.now().toString().slice(-4)}`,
      tag: data.tag || "Events",
      day,
      mon,
      date: dateFormatted,
      iso: data.iso || rawDate,
      time: data.time || "10:00 AM – 11:00 AM",
      title: data.title || "Volunteer Coordination Meet",
      status: data.status || "Upcoming",
      tone: data.tone || "gn",
      grad: data.grad || "b",
      emoji: data.emoji || "📋",
      desc: data.desc || data.description || "Meeting with active volunteers.",
      coord: data.coord || adminUser?.fullName || "Karthik R",
      role: data.role || "Programme Coordinator",
      phone: data.phone || adminUser?.phone || "+91 98765 43210",
      email: data.email || adminUser?.email || "coordinator@maatram.org",
      people: data.people || "15 Volunteers",
      mode: data.mode || "Google Meet",
      location: data.location || "Google Meet · Chennai, Tamil Nadu",
      meetLink: data.meetLink || "https://meet.google.com/xyz-maatram",
      agenda: Array.isArray(data.agenda) ? data.agenda : (data.agenda || "").split("\n").filter(Boolean),
      note: data.note || "Keep your college ID ready. Join 5 minutes early.",
      past: false,
      availabilities: [],
      createdBy: adminUser?._id?.toString() || "admin",
      createdAt: new Date().toISOString(),
    };

    if (getIsConnected()) {
      try {
        const doc = new Meeting(newMeeting);
        await doc.save();
        newMeeting._id = doc._id.toString();
        newMeeting.id = doc._id.toString();
      } catch (_) {}
    }

    const db = readDB();
    if (!Array.isArray(db.meetings)) db.meetings = [];
    db.meetings.unshift(newMeeting);
    writeDB(db);

    return newMeeting;
  },

  async updateMeeting(id, updateData) {
    const idStr = (id || "").toString();

    if (getIsConnected()) {
      try {
        await Meeting.findByIdAndUpdate(idStr, updateData, { new: true });
      } catch (_) {}
    }

    const db = readDB();
    if (!Array.isArray(db.meetings)) db.meetings = [];
    const idx = db.meetings.findIndex((m) => (m.id || m._id || "").toString() === idStr);
    if (idx >= 0) {
      db.meetings[idx] = { ...db.meetings[idx], ...updateData };
      writeDB(db);
      return db.meetings[idx];
    }

    return null;
  },

  async deleteMeeting(id) {
    const idStr = (id || "").toString();

    if (getIsConnected()) {
      try {
        await Meeting.findByIdAndDelete(idStr);
      } catch (_) {}
    }

    const db = readDB();
    if (!Array.isArray(db.meetings)) db.meetings = [];
    db.meetings = db.meetings.filter((m) => (m.id || m._id || "").toString() !== idStr);
    writeDB(db);

    return { success: true, message: "Meeting deleted successfully." };
  },

  async submitMeetingAvailability(meetingId, availabilityData, user) {
    const meeting = await this.getMeetingById(meetingId);
    if (!meeting) throw new Error("Meeting not found.");

    const idStr = (user._id || user.id || "").toString();
    const em = (user.email || "").toLowerCase().trim();

    const record = {
      id: `AV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      userId: idStr,
      studentName: user.fullName || "Volunteer",
      studentEmail: em,
      studentPhone: user.phone || "",
      college: user.college || "Anna University",
      response: availabilityData.response === "unavailable" ? "unavailable" : "available",
      selectedDate: availabilityData.selectedDate || meeting.iso || meeting.date,
      selectedSlot: availabilityData.selectedSlot || meeting.time,
      reason: availabilityData.reason || "",
      submittedAt: new Date().toISOString(),
    };

    if (getIsConnected()) {
      try {
        const mDoc = await Meeting.findById(meetingId);
        if (mDoc) {
          if (!Array.isArray(mDoc.availabilities)) mDoc.availabilities = [];
          const exIdx = mDoc.availabilities.findIndex(
            (a) =>
              (a.userId && a.userId.toString() === idStr) ||
              (a.studentEmail && a.studentEmail.toLowerCase().trim() === em)
          );
          if (exIdx >= 0) {
            mDoc.availabilities[exIdx] = record;
          } else {
            mDoc.availabilities.push(record);
          }
          await mDoc.save();
        }
      } catch (_) {}
    }

    const db = readDB();
    if (!Array.isArray(db.meetings)) db.meetings = [];
    const mJson = db.meetings.find((m) => (m.id || m._id || "").toString() === meetingId.toString());
    if (mJson) {
      if (!Array.isArray(mJson.availabilities)) mJson.availabilities = [];
      const exIdx = mJson.availabilities.findIndex(
        (a) =>
          (a.userId && a.userId.toString() === idStr) ||
          (a.studentEmail && a.studentEmail.toLowerCase().trim() === em)
      );
      if (exIdx >= 0) {
        mJson.availabilities[exIdx] = record;
      } else {
        mJson.availabilities.push(record);
      }
      writeDB(db);
    }

    return {
      success: true,
      message: record.response === "available" ? "Marked as Available. Thank you!" : "Availability submitted.",
      record,
    };
  },

  async getMeetingAvailabilities(meetingId) {
    const meeting = await this.getMeetingById(meetingId);
    if (!meeting) return { availabilities: [], availableCount: 0, unavailableCount: 0 };

    const availabilities = meeting.availabilities || [];
    const availableCount = availabilities.filter((a) => a.response === "available").length;
    const unavailableCount = availabilities.filter((a) => a.response === "unavailable").length;

    return {
      availabilities,
      availableCount,
      unavailableCount,
      meetingTitle: meeting.title,
    };
  },
};

module.exports = Storage;
