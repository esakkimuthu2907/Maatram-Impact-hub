// backend/services/storage.js
// ALL MongoDB - no local JSON for any core data

const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Event = require("../models/Event");
const Application = require("../models/Application");
const Notification = require("../models/Notification");
const PointsTransaction = require("../models/PointsTransaction");
const Connection = require("../models/Connection");
const Attendance = require("../models/Attendance");

const DEFAULT_GRADING_LEVELS = [
  { tier: "Bronze", name: "Bronze Volunteer", minPoints: 0, maxPoints: 100, color: "#CD7F32", icon: "Award", description: "Beginner volunteer starting their social impact journey (0 - 100 pts)." },
  { tier: "Silver", name: "Silver Volunteer", minPoints: 100, maxPoints: 250, color: "#94A3B8", icon: "Shield", description: "Dedicated volunteer with active field participation (100 - 250 pts)." },
  { tier: "Gold", name: "Gold Volunteer", minPoints: 250, maxPoints: 500, color: "#EAB308", icon: "Star", description: "Experienced volunteer leading initiatives with high impact (250 - 500 pts)." },
  { tier: "Diamond", name: "Diamond Volunteer", minPoints: 500, maxPoints: 1000, color: "#06B6D4", icon: "Zap", description: "Outstanding changemaker driving massive community transformation (500 - 1000 pts)." },
  { tier: "Platinum", name: "Platinum Volunteer", minPoints: 1000, maxPoints: 1500, color: "#6366F1", icon: "Crown", description: "Elite community champion and youth social leader (1000 - 1500 pts)." },
  { tier: "Green Gem", name: "Green Gem Volunteer", minPoints: 1500, maxPoints: 2000, color: "#10B981", icon: "Gem", description: "Legendary Maatram pillar creating lifelong generational impact (2000+ pts)." },
];

const Storage = {
  // USERS
  async findUserByEmail(email) { return await User.findOne({ email: email.toLowerCase().trim() }); },
  async findUserByIdentifier(identifier) {
    const clean = identifier.trim();
    return await User.findOne({ $or: [{ email: clean.toLowerCase() }, { applicationId: clean.toUpperCase() }] });
  },
  async findUserById(id) {
    try {
      const u = await User.findById(id).select("-password");
      if (u) return { ...u.toObject(), id: u._id.toString() };
    } catch {}
    try {
      const u = await User.findOne({ applicationId: id }).select("-password");
      if (u) return { ...u.toObject(), id: u._id.toString() };
    } catch {}
    return null;
  },
  async createUser(data) {
    const doc = await User.create(data);
    return { ...doc.toObject(), id: doc._id.toString() };
  },
  async updateUser(id, data) {
    const allowedFields = ["fullName", "phone", "college", "department", "academicYear", "regNumber", "bio", "skills", "interests", "avatar", "fcmToken"];
    const update = {};
    for (const k of allowedFields) { if (data[k] !== undefined) update[k] = data[k]; }
    if (data.name && !update.fullName) update.fullName = data.name;
    try {
      const u = await User.findByIdAndUpdate(id, update, { new: true }).select("-password");
      if (u) return { ...u.toObject(), id: u._id.toString() };
    } catch {}
    try {
      const u = await User.findOneAndUpdate({ applicationId: id }, update, { new: true }).select("-password");
      if (u) return { ...u.toObject(), id: u._id.toString() };
    } catch {}
    return null;
  },
  async getAllUsers(filters = {}) {
    const query = {};
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
    const users = await User.find(query).select("-password").lean();
    return users.map((u) => ({ ...u, id: u._id.toString() }));
  },
  // Get students for Connect page (exclude admin, only active)
  async getStudentsForConnect(excludeUserId) {
    const query = { role: { $ne: "admin" }, status: "active" };
    if (excludeUserId) {
      try {
        const mongoose = require("mongoose");
        query._id = { $ne: new mongoose.Types.ObjectId(excludeUserId) };
      } catch {}
    }
    const users = await User.find(query).select("-password -fcmToken").lean();
    return users.map((u) => ({ ...u, id: u._id.toString() }));
  },
  async toggleUserStatus(userId, status, adminUser) {
    let user = null;
    try { user = await User.findByIdAndUpdate(userId, { status }, { new: true }); } catch {}
    if (!user) user = await User.findOneAndUpdate({ applicationId: userId }, { status }, { new: true });
    if (!user) return null;
    return { ...user.toObject(), id: user._id.toString() };
  },
  async deleteUser(userId, adminUser) {
    let deleted = null;
    try { deleted = await User.findByIdAndDelete(userId); } catch {}
    if (!deleted) deleted = await User.findOneAndDelete({ applicationId: userId });
    if (!deleted) return false;
    try {
      await Application.deleteMany({ $or: [{ userId: deleted._id }, { userId: deleted._id.toString() }, { applicationId: deleted.applicationId }] });
      await PointsTransaction.deleteMany({ $or: [{ userId: deleted._id }, { userId: deleted._id.toString() }] });
      await Notification.deleteMany({ $or: [{ userId: deleted._id }, { userId: deleted._id.toString() }] });
    } catch {}
    return true;
  },
  async verifyPassword(user, password) {
    if (typeof user.matchPassword === "function") return await user.matchPassword(password);
    const bcryptjs = require("bcryptjs");
    if (user.password) return await bcryptjs.compare(password, user.password);
    return false;
  },

  // EVENTS — fully MongoDB
  async getEvents(filters = {}) {
    const query = { isActive: true };
    if (filters.category && filters.category !== "All") query.category = filters.category;
    if (filters.mode && filters.mode !== "All") query.mode = filters.mode;
    if (filters.status && filters.status !== "All") query.eventStatus = filters.status;
    if (filters.search) {
      const s = filters.search.trim();
      query.$or = [
        { title: { $regex: s, $options: "i" } },
        { location: { $regex: s, $options: "i" } },
      ];
    }
    const events = await Event.find(query).sort({ createdAt: -1 }).lean();
    return events.map((e) => ({ ...e, id: e._id.toString() }));
  },
  async getEventById(id) {
    try {
      const e = await Event.findById(id).lean();
      if (e) return { ...e, id: e._id.toString() };
    } catch {}
    return null;
  },
  async createEvent(eventData, adminUser) {
    const slots = Array.isArray(eventData.slots) && eventData.slots.length > 0
      ? eventData.slots
      : [{ slotId: `slot_${Date.now()}_1`, title: "General Volunteering Slot", time: eventData.time || "9:30 AM – 1:30 PM", capacity: Number(eventData.volunteersNeeded) || 10, filled: 0 }];
    const doc = await Event.create({
      title: eventData.title,
      category: eventData.category,
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
      objectives: Array.isArray(eventData.objectives) ? eventData.objectives : [],
      responsibilities: Array.isArray(eventData.responsibilities) ? eventData.responsibilities : [],
      skills: typeof eventData.skills === "string" ? eventData.skills : (Array.isArray(eventData.skills) ? eventData.skills.join(", ") : ""),
      eligibility: eventData.eligibility || "Open to all college student volunteers.",
      contactEmail: eventData.contactEmail || "coordinator@maatramfoundation.com",
      featured: Boolean(eventData.featured),
      isActive: true,
      eventStatus: "Upcoming",
      slots,
      postedBy: adminUser?._id || adminUser?.id || null,
    });
    return { ...doc.toObject(), id: doc._id.toString() };
  },
  async updateEvent(id, updateData, adminUser) {
    const allowed = ["title","category","organizer","mode","date","time","durationHours","points","location","volunteersNeeded","slotsAvailable","deadline","image","description","objectives","responsibilities","skills","eligibility","contactEmail","featured","isActive","eventStatus","slots"];
    const update = {};
    for (const k of allowed) { if (updateData[k] !== undefined) update[k] = updateData[k]; }
    try {
      const e = await Event.findByIdAndUpdate(id, update, { new: true }).lean();
      if (e) return { ...e, id: e._id.toString() };
    } catch {}
    return null;
  },
  async deleteEvent(id, adminUser) {
    try {
      await Event.findByIdAndDelete(id);
      await Application.deleteMany({ opportunityId: id });
      return true;
    } catch {}
    return false;
  },
  async getApplicationsByEvent(eventId) {
    const apps = await Application.find({ opportunityId: eventId }).lean();
    return apps.map((a) => ({ ...a, id: a._id.toString() }));
  },

  // APPLICATIONS — fully MongoDB
  async createApplication(data, user) {
    const existing = await Application.findOne({ userId: user._id || user.id, opportunityId: data.opportunityId });
    if (existing && existing.status !== "Cancelled") throw new Error("You have already applied for this opportunity.");
    const event = await Event.findById(data.opportunityId);
    if (!event) throw new Error("Opportunity not found.");
    if (event.slotsAvailable <= 0) throw new Error("No slots available for this event.");
    const app = await Application.create({
      userId: user._id || user.id,
      applicationId: user.applicationId,
      opportunityId: data.opportunityId,
      opportunityTitle: event.title,
      category: event.category,
      eventDate: event.date,
      hours: event.durationHours || 4,
      slotId: data.slotId || "",
      slotName: data.slotName || "Standard Slot",
      motivation: data.motivation || "",
      experience: data.experience || "",
      skills: data.skills || "",
      mode: event.mode,
      status: "Pending",
      applicantDetails: {
        name: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        college: user.college || "",
        department: user.department || "",
        academicYear: user.academicYear || "",
        regNumber: user.regNumber || "",
        avatar: user.avatar || "",
      },
    });
    // Decrement slotsAvailable
    await Event.findByIdAndUpdate(data.opportunityId, { $inc: { slotsAvailable: -1 } });
    // Notify student
    await this.createNotification({ userId: (user._id || user.id).toString(), type: "application", title: "Application Submitted 📝", message: `Your application for "${event.title}" has been received. We'll notify you once reviewed.`, link: "/applications" });
    return { ...app.toObject(), id: app._id.toString() };
  },
  async getMyApplications(userId, applicationId, email) {
    const mongoose = require("mongoose");
    const conditions = [];
    if (userId) {
      conditions.push({ userId: userId.toString() });
      if (mongoose.isValidObjectId(userId)) {
        conditions.push({ userId: new mongoose.Types.ObjectId(userId) });
      }
    }
    if (applicationId) {
      conditions.push({ applicationId: applicationId.toString() });
    }
    if (email) {
      conditions.push({ "applicantDetails.email": email.toLowerCase().trim() });
    }
    const query = conditions.length > 0 ? { $or: conditions } : {};
    const apps = await Application.find(query).sort({ createdAt: -1 }).lean();
    return apps.map((a) => ({ ...a, id: a._id.toString() }));
  },
  async getAllApplications(filters = {}) {
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
    return apps.map((a) => ({ ...a, id: a._id.toString() }));
  },
  async updateApplicationStatus(id, status, notes, adminUser) {
    const app = await Application.findById(id);
    if (!app) return null;
    app.status = status;
    if (notes) app.notes = notes;
    await app.save();
    // Restore slot if rejected or cancelled
    if (status === "Rejected" || status === "Cancelled") {
      await Event.findByIdAndUpdate(app.opportunityId, { $inc: { slotsAvailable: 1 } });
    }
    // Notify student
    if (status === "Approved") {
      await this.createNotification({ userId: app.userId.toString(), type: "approval", title: "Application Approved! 🎉", message: `Your volunteer application for "${app.opportunityTitle}" has been APPROVED!`, link: `/opportunities/${app.opportunityId}` });
    } else if (status === "Rejected") {
      await this.createNotification({ userId: app.userId.toString(), type: "rejection", title: "Application Update ⚠️", message: `Your application for "${app.opportunityTitle}" could not be accommodated. Reason: ${notes || "Slot capacity reached."}`, link: "/applications" });
    }
    return { ...app.toObject(), id: app._id.toString() };
  },
  async cancelApplication(id, userId) {
    const app = await Application.findById(id);
    if (!app) return false;
    app.status = "Cancelled";
    await app.save();
    await Event.findByIdAndUpdate(app.opportunityId, { $inc: { slotsAvailable: 1 } });
    return true;
  },
  async deleteApplication(id, adminUser) {
    try {
      const app = await Application.findByIdAndDelete(id);
      if (app && app.opportunityId) {
        if (app.status === "Pending" || app.status === "Approved") {
          await Event.findByIdAndUpdate(app.opportunityId, { $inc: { slotsAvailable: 1 } });
        }
      }
      return true;
    } catch {}
    return false;
  },

  // ATTENDANCE & POINTS
  async trackAttendanceAndAwardPoints({ eventId, attendanceRecords, adminUser }) {
    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");
    const pointsPerVolunteer = Number(event.points) || 50;
    const results = [];
    event.eventStatus = "Completed";
    event.pointsDistributed = true;
    await event.save();
    for (const record of attendanceRecords) {
      const { applicationId, userId, status } = record;
      const app = await Application.findById(applicationId);
      if (!app) continue;
      app.attendanceStatus = status;
      // Upsert attendance
      await Attendance.findOneAndUpdate(
        { eventId, userId },
        { eventId, userId, applicationId, status, slotId: app.slotId || "", markedByName: adminUser?.fullName || "Admin", markedAt: new Date() },
        { upsert: true }
      );
      if (app.status === "Approved" && status === "Present" && app.pointsAwarded === 0) {
        app.status = "Completed";
        app.pointsAwarded = pointsPerVolunteer;
        await app.save();
        // Update user stats
        await User.findByIdAndUpdate(app.userId, {
          $inc: { points: pointsPerVolunteer, totalHours: app.hours || 4, completedEventsCount: 1, eventsJoined: 1, badgesEarned: 1 }
        });
        // Record transaction
        await PointsTransaction.create({
          userId: app.userId,
          applicationId: app.applicationId,
          studentName: app.applicantDetails?.name || "Student",
          eventId,
          eventName: event.title,
          type: "CREDIT",
          points: pointsPerVolunteer,
          reason: `Successfully attended and completed "${event.title}"`,
          adminRemarks: `Verified by ${adminUser?.fullName || "Admin"}`,
          adminId: adminUser?._id || adminUser?.id,
          adminName: adminUser?.fullName || "Admin",
        });
        // Notify
        await this.createNotification({ userId: app.userId.toString(), type: "points", title: `Points Awarded (+${pointsPerVolunteer} pts) 🏆`, message: `You received ${pointsPerVolunteer} points for completing "${event.title}"!`, link: "/contributions" });
        results.push({ userId, pointsAwarded: pointsPerVolunteer, status: "Points Awarded" });
      } else {
        await app.save();
        results.push({ userId, pointsAwarded: 0, status: app.pointsAwarded > 0 ? "Already Awarded" : `Not eligible (${status})` });
      }
    }
    return { event: { ...event.toObject(), id: event._id.toString() }, results };
  },

  // MANUAL POINT ADJUSTMENT
  async adjustUserPoints({ userId, points, type, reason, adminRemarks, adminUser }) {
    if (!reason || !reason.trim()) throw new Error("Reason is required.");
    const numPoints = Math.abs(Number(points));
    if (!numPoints || numPoints <= 0) throw new Error("Points must be positive.");
    let user = null;
    try { user = await User.findById(userId); } catch {}
    if (!user) user = await User.findOne({ applicationId: userId });
    if (!user) throw new Error("Student not found.");
    const currentPoints = user.points || 0;
    const newPoints = type === "CREDIT" ? currentPoints + numPoints : Math.max(0, currentPoints - numPoints);
    await User.findByIdAndUpdate(user._id, { points: newPoints });
    const tx = await PointsTransaction.create({
      userId: user._id,
      applicationId: user.applicationId,
      studentName: user.fullName,
      eventId: null,
      eventName: "Manual Adjustment by Admin",
      type: type || "CREDIT",
      points: type === "CREDIT" ? numPoints : -numPoints,
      reason: reason.trim(),
      adminRemarks: adminRemarks || "",
      adminId: adminUser?._id || adminUser?.id,
      adminName: adminUser?.fullName || "Admin",
    });
    await this.createNotification({ userId: user._id.toString(), type: "points", title: type === "CREDIT" ? `Points Credited (+${numPoints} pts) 🌟` : `Points Deducted (-${numPoints} pts)`, message: `${type === "CREDIT" ? "Added" : "Deducted"} ${numPoints} points. Reason: ${reason.trim()}`, link: "/contributions" });
    return { user: { ...user.toObject(), points: newPoints, id: user._id.toString() }, transaction: tx };
  },

  async getPointsTransactions(filters = {}) {
    const query = {};
    if (filters.userId) {
      try {
        const mongoose = require("mongoose");
        query.$or = [
          { userId: new mongoose.Types.ObjectId(filters.userId) },
          { applicationId: filters.userId },
        ];
      } catch {
        query.applicationId = filters.userId;
      }
    }
    if (filters.eventId) query.eventId = filters.eventId;
    const txs = await PointsTransaction.find(query).sort({ createdAt: -1 }).lean();
    return txs.map((t) => ({ ...t, id: t._id.toString() }));
  },

  // GRADING
  getGradingLevels() { return DEFAULT_GRADING_LEVELS; },
  calculateUserGrade(points, levels = DEFAULT_GRADING_LEVELS) {
    const sorted = [...levels].sort((a, b) => b.minPoints - a.minPoints);
    for (const lvl of sorted) { if (points >= lvl.minPoints) return lvl; }
    return levels[0] || { tier: "Bronze", name: "Bronze Volunteer" };
  },

  // NOTIFICATIONS — MongoDB
  async createNotification(notif) {
    try {
      const doc = await Notification.create({
        userId: notif.userId,
        type: notif.type || "general",
        title: notif.title,
        message: notif.message,
        link: notif.link || "/dashboard",
        isRead: false,
      });
      return { ...doc.toObject(), id: doc._id.toString() };
    } catch (err) {
      console.warn("Notification create warning:", err.message);
      return null;
    }
  },
  async getNotifications(userId) {
    try {
      const user = await User.findById(userId).lean();
      const ids = [userId, "ALL"];
      if (user) {
        if (user.applicationId) ids.push(user.applicationId);
      }
      const notifs = await Notification.find({ userId: { $in: ids } }).sort({ createdAt: -1 }).limit(50).lean();
      return notifs.map((n) => ({ ...n, id: n._id.toString() }));
    } catch {
      return [];
    }
  },
  async markAllNotificationsRead(userId) {
    try {
      const user = await User.findById(userId).lean();
      const ids = [userId];
      if (user?.applicationId) ids.push(user.applicationId);
      await Notification.updateMany({ userId: { $in: ids }, isRead: false }, { isRead: true });
    } catch {}
    return true;
  },
  async broadcastNotification({ targetType, targetEventId, targetUserIds = [], title, message, link, adminUser }) {
    if (!title || !message) throw new Error("Title and message are required.");
    let recipientIds = [];
    if (targetType === "ALL") {
      const users = await User.find({ role: { $ne: "admin" } }).select("_id").lean();
      recipientIds = users.map((u) => u._id.toString());
    } else if (targetType === "EVENT_APPROVED" && targetEventId) {
      const apps = await Application.find({ opportunityId: targetEventId, status: "Approved" }).select("userId").lean();
      recipientIds = [...new Set(apps.map((a) => a.userId.toString()))];
    } else if (targetType === "SELECTED") {
      recipientIds = targetUserIds;
    }
    const created = [];
    for (const uid of recipientIds) {
      const n = await this.createNotification({ userId: uid, type: "announcement", title, message, link: link || "/dashboard" });
      if (n) created.push(n);
    }
    return { sentCount: created.length, notifications: created };
  },

  // CONNECTIONS — MongoDB
  async getConnections(userId) {
    const mongoose = require("mongoose");
    let oid;
    try { oid = new mongoose.Types.ObjectId(userId); } catch { return { accepted: [], pendingIncoming: [], pendingOutgoing: [] }; }

    const all = await Connection.find({
      $or: [{ requesterId: oid }, { recipientId: oid }],
    }).lean();

    const getUser = async (id) => {
      try {
        const u = await User.findById(id).select("-password -fcmToken").lean();
        return u ? { ...u, id: u._id.toString() } : null;
      } catch { return null; }
    };

    const accepted = [];
    const pendingIncoming = [];
    const pendingOutgoing = [];

    for (const c of all) {
      const reqId = c.requesterId.toString();
      const recId = c.recipientId.toString();
      const isRequester = reqId === userId;
      if (c.status === "Accepted") {
        const otherId = isRequester ? recId : reqId;
        const u = await getUser(otherId);
        if (u) accepted.push({ connectionId: c._id.toString(), connectedAt: c.updatedAt, user: u });
      } else if (c.status === "Pending") {
        if (recId === userId) {
          const u = await getUser(reqId);
          if (u) pendingIncoming.push({ connectionId: c._id.toString(), message: c.message, createdAt: c.createdAt, user: u });
        } else {
          const u = await getUser(recId);
          if (u) pendingOutgoing.push({ connectionId: c._id.toString(), message: c.message, createdAt: c.createdAt, user: u });
        }
      }
    }
    return { accepted, pendingIncoming, pendingOutgoing };
  },
  async sendConnectionRequest({ requesterId, recipientId, message = "" }) {
    if (requesterId.toString() === recipientId.toString()) throw new Error("You cannot connect with yourself.");
    const mongoose = require("mongoose");
    let reqOid, recOid;
    try {
      reqOid = new mongoose.Types.ObjectId(requesterId);
      recOid = new mongoose.Types.ObjectId(recipientId);
    } catch { throw new Error("Invalid user ID."); }
    const recipient = await User.findById(recOid);
    if (!recipient) throw new Error("Recipient not found.");
    const existing = await Connection.findOne({
      $or: [
        { requesterId: reqOid, recipientId: recOid },
        { requesterId: recOid, recipientId: reqOid },
      ],
    });
    if (existing) {
      if (existing.status === "Accepted") throw new Error("Already connected.");
      if (existing.status === "Pending") throw new Error("Connection request already pending.");
      // If rejected, allow re-request by updating
      existing.status = "Pending";
      existing.message = message || "Hi! I'd like to connect.";
      await existing.save();
      return { ...existing.toObject(), id: existing._id.toString() };
    }
    const conn = await Connection.create({ requesterId: reqOid, recipientId: recOid, status: "Pending", message: message || "Hi! I'd like to connect with you on Maatram." });
    const requester = await User.findById(reqOid);
    await this.createNotification({ userId: recOid.toString(), type: "connect", title: "New Connection Request 👋", message: `${requester?.fullName || "A student"} sent you a connection request.`, link: "/connect" });
    return { ...conn.toObject(), id: conn._id.toString() };
  },
  async acceptConnectionRequest(connectionId, userId) {
    const conn = await Connection.findById(connectionId);
    if (!conn) throw new Error("Connection request not found.");
    if (conn.recipientId.toString() !== userId.toString()) throw new Error("Only the recipient can accept this request.");
    conn.status = "Accepted";
    await conn.save();
    const accepter = await User.findById(userId);
    await this.createNotification({ userId: conn.requesterId.toString(), type: "connect", title: "Connection Accepted! 🤝", message: `${accepter?.fullName || "Your peer"} accepted your connection request!`, link: "/connect" });
    return { ...conn.toObject(), id: conn._id.toString() };
  },
  async rejectConnectionRequest(connectionId, userId) {
    const conn = await Connection.findById(connectionId);
    if (!conn) throw new Error("Connection request not found.");
    if (conn.recipientId.toString() !== userId.toString()) throw new Error("Only the recipient can reject.");
    conn.status = "Rejected";
    await conn.save();
    return { ...conn.toObject(), id: conn._id.toString() };
  },
  async removeConnection(connectionId, userId) {
    const conn = await Connection.findById(connectionId);
    if (!conn) throw new Error("Connection not found.");
    if (conn.requesterId.toString() !== userId.toString() && conn.recipientId.toString() !== userId.toString()) throw new Error("Unauthorized.");
    await Connection.findByIdAndDelete(connectionId);
    return true;
  },

  // ADMIN KPIs
  async getAdminKPIs() {
    const [students, events, applications] = await Promise.all([
      User.find({ role: { $ne: "admin" } }).lean(),
      Event.find({ isActive: true }).lean(),
      Application.find().lean(),
    ]);
    const activeVolunteers = students.filter((u) => (u.points || 0) > 0 || (u.eventsJoined || 0) > 0);
    const completedEvents = events.filter((e) => e.eventStatus === "Completed");
    const pendingApps = applications.filter((a) => a.status === "Pending");
    const approvedApps = applications.filter((a) => a.status === "Approved");
    const totalPoints = students.reduce((s, u) => s + (Number(u.points) || 0), 0);

    // Monthly activity (real from applications)
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthlyMap = {};
    monthNames.forEach((m) => (monthlyMap[m] = 0));
    applications.forEach((a) => {
      const d = new Date(a.createdAt);
      if (!isNaN(d)) monthlyMap[monthNames[d.getMonth()]] = (monthlyMap[monthNames[d.getMonth()]] || 0) + 1;
    });

    const deptMap = {};
    students.forEach((s) => {
      const d = s.department || "Others";
      deptMap[d] = (deptMap[d] || 0) + 1;
    });

    return {
      kpis: {
        totalRegisteredStudents: students.length,
        totalActiveVolunteers: activeVolunteers.length,
        totalEvents: events.length,
        pendingApplications: pendingApps.length,
        approvedVolunteers: approvedApps.length,
        completedEvents: completedEvents.length,
        totalVolunteerContributions: totalPoints,
        totalPointsDistributed: totalPoints,
      },
      charts: {
        monthlyActivity: Object.entries(monthlyMap).map(([month, count]) => ({ month, count })),
        departmentStats: Object.entries(deptMap).map(([name, count]) => ({ name, count })),
        applicationsBreakdown: [
          { status: "Pending", count: pendingApps.length },
          { status: "Approved", count: approvedApps.length },
          { status: "Completed", count: applications.filter((a) => a.status === "Completed").length },
          { status: "Rejected", count: applications.filter((a) => a.status === "Rejected").length },
        ],
      },
      recentActivities: [],
    };
  },

  // REPORTS
  async getAdminReports() {
    const [students, events, applications, pointsTxs] = await Promise.all([
      User.find({ role: { $ne: "admin" } }).lean(),
      Event.find({ isActive: true }).lean(),
      Application.find().lean(),
      PointsTransaction.find().sort({ createdAt: -1 }).lean(),
    ]);

    const eventParticipation = events.map((evt) => {
      const evtId = evt._id.toString();
      const apps = applications.filter((a) => a.opportunityId?.toString() === evtId);
      const approved = apps.filter((a) => a.status === "Approved" || a.status === "Completed");
      const completed = apps.filter((a) => a.status === "Completed");
      return { eventId: evtId, title: evt.title, category: evt.category, date: evt.date, volunteersNeeded: evt.volunteersNeeded, totalApplications: apps.length, approvedCount: approved.length, completedCount: completed.length, pointsAwarded: completed.length * (evt.points || 50), status: evt.eventStatus || "Upcoming" };
    });

    const studentContributions = students.map((s) => ({
      studentId: s.applicationId,
      name: s.fullName,
      email: s.email,
      phone: s.phone,
      college: s.college,
      department: s.department,
      academicYear: s.academicYear,
      points: s.points || 0,
      tier: (s.points || 0) >= 1500 ? "Green Gem" : (s.points || 0) >= 1000 ? "Platinum" : (s.points || 0) >= 500 ? "Diamond" : (s.points || 0) >= 250 ? "Gold" : (s.points || 0) >= 100 ? "Silver" : "Bronze",
      eventsJoined: s.eventsJoined || 0,
      completedEvents: s.completedEventsCount || 0,
      status: s.status || "active"
    }));

    const deptStats = {};
    students.forEach((s) => {
      const dept = s.department || "Others";
      if (!deptStats[dept]) deptStats[dept] = { department: dept, totalStudents: 0, totalPoints: 0, averagePoints: 0 };
      deptStats[dept].totalStudents += 1;
      deptStats[dept].totalPoints += Number(s.points) || 0;
      deptStats[dept].averagePoints = Math.round(deptStats[dept].totalPoints / deptStats[dept].totalStudents);
    });

    const pointsDistribution = pointsTxs.map((pt) => ({ transactionId: pt._id.toString(), date: pt.date || pt.createdAt, studentId: pt.applicationId, studentName: pt.studentName, eventName: pt.eventName, type: pt.type, points: pt.points, reason: pt.reason, adminRemarks: pt.adminRemarks, adminName: pt.adminName }));

    return {
      eventParticipation,
      studentContributions,
      departmentStatistics: Object.values(deptStats),
      pointsDistribution,
      applicationStatistics: {
        total: applications.length,
        pending: applications.filter((a) => a.status === "Pending").length,
        approved: applications.filter((a) => a.status === "Approved").length,
        rejected: applications.filter((a) => a.status === "Rejected").length,
        completed: applications.filter((a) => a.status === "Completed").length,
      },
    };
  },

  // LEADERBOARD — 100% Points Based, covers all enrolled students
  async getLeaderboard() {
    const users = await User.find({ role: { $ne: "admin" } }).sort({ points: -1, createdAt: 1 }).lean();
    return users.map((u, idx) => ({
      rank: idx + 1,
      id: u._id.toString(),
      applicationId: u.applicationId,
      fullName: u.fullName,
      name: u.fullName,
      college: u.college || "Anna University",
      department: u.department || "General",
      points: u.points || 0,
      eventsJoined: u.eventsJoined || 0,
      badgesEarned: u.badgesEarned || 0,
      completedEventsCount: u.completedEventsCount || 0,
      tier: (u.points || 0) >= 1500 ? "Green Gem" : (u.points || 0) >= 1000 ? "Platinum" : (u.points || 0) >= 500 ? "Diamond" : (u.points || 0) >= 250 ? "Gold" : (u.points || 0) >= 100 ? "Silver" : "Bronze",
      avatar: u.avatar || ""
    }));
  },

  // Stub for admin activity log (no-op if model removed)
  async logAdminActivity(data) {
    try {
      const AdminActivityLog = require("../models/AdminActivityLog");
      await AdminActivityLog.create(data);
    } catch {}
  },
};

module.exports = Storage;
