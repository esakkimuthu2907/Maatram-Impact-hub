// scratch/update_storage.js
const fs = require("fs");
const path = require("path");

const storageFile = path.resolve(__dirname, "../backend/services/storage.js");
let content = fs.readFileSync(storageFile, "utf8");

// 1. Update createUser to ensure 0 points, 0 hours, Bronze tier on registration + offline fallback
const createUserOld = content.substring(
  content.indexOf("async createUser(data) {"),
  content.indexOf("async updateUser(id, data) {")
);

const createUserNew = `async createUser(data) {
    const newUser = {
      ...data,
      points: 0,
      totalHours: 0,
      completedEventsCount: 0,
      eventsJoined: 0,
      badgesEarned: 0,
      tier: "Bronze",
      isActive: true,
      role: data.role || "student",
      createdAt: new Date().toISOString(),
    };

    if (getIsConnected()) {
      try {
        const doc = await User.create(newUser);
        const userObj = { ...doc.toObject(), id: doc._id.toString() };
        try {
          await EmailService.sendRegistrationConfirmation({ user: userObj });
        } catch (err) {}
        return userObj;
      } catch (err) {
        console.warn("Mongo createUser error, falling back to db.json:", err.message);
      }
    }

    const db = readDB();
    if (!Array.isArray(db.users)) db.users = [];
    const id = "user_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const userObj = { ...newUser, id, _id: id };
    db.users.push(userObj);
    writeDB(db);

    try {
      await EmailService.sendRegistrationConfirmation({ user: userObj });
    } catch (err) {}

    return userObj;
  },
  `;

content = content.replace(createUserOld, createUserNew);

// 2. Update seedCleanEventsIfEmpty, getEvents, getEventById, createEvent, updateEvent, deleteEvent
// and all Applications & Attendance methods up to // CERTIFICATES
const eventsAndAppsOld = content.substring(
  content.indexOf("async seedCleanEventsIfEmpty() {"),
  content.indexOf("// CERTIFICATES")
);

const eventsAndAppsNew = `async seedCleanEventsIfEmpty() {
    // Only admin created events are maintained in the system.
  },

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
        list = list.filter((e) =>
          (e.title && e.title.toLowerCase().includes(s)) ||
          (e.location && e.location.toLowerCase().includes(s)) ||
          (e.category && e.category.toLowerCase().includes(s))
        );
      }
      events = list.map((e) => ({ ...e, id: (e.id || e._id || "").toString() }));
    }

    return events;
  },

  async getEventById(id) {
    if (!id) return null;
    const idStr = id.toString();

    if (getIsConnected()) {
      try {
        const mongoose = require("mongoose");
        if (mongoose.isValidObjectId(idStr)) {
          const e = await Event.findById(idStr).lean();
          if (e) return { ...e, id: e._id.toString() };
        }
        const e = await Event.findOne({ $or: [{ id: idStr }, { _id: idStr }] }).lean();
        if (e) return { ...e, id: (e._id || e.id).toString() };
      } catch {}
    }

    const db = readDB();
    const e = (db.events || []).find((ev) => (ev.id || ev._id || "").toString() === idStr);
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
      objectives: Array.isArray(eventData.objectives) ? eventData.objectives : (typeof eventData.objectives === "string" ? eventData.objectives.split("\\n").filter(Boolean) : []),
      responsibilities: Array.isArray(eventData.responsibilities) ? eventData.responsibilities : (typeof eventData.responsibilities === "string" ? eventData.responsibilities.split("\\n").filter(Boolean) : []),
      skills: typeof eventData.skills === "string" ? eventData.skills : (Array.isArray(eventData.skills) ? eventData.skills.join(", ") : ""),
      eligibility: eventData.eligibility || "Open to all registered student volunteers.",
      contactEmail: eventData.contactEmail || "coordinator@maatramfoundation.com",
      featured: Boolean(eventData.featured),
      isActive: true,
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
    const allowed = ["title","category","organizer","mode","date","time","durationHours","points","location","volunteersNeeded","slotsAvailable","deadline","image","description","objectives","responsibilities","skills","eligibility","contactEmail","featured","isActive","eventStatus","slots","attendanceOpen","qrCodeToken"];
    const update = {};
    for (const k of allowed) { if (updateData[k] !== undefined) update[k] = updateData[k]; }

    if (getIsConnected()) {
      try {
        const mongoose = require("mongoose");
        if (mongoose.isValidObjectId(id)) {
          const e = await Event.findByIdAndUpdate(id, update, { new: true }).lean();
          if (e) return { ...e, id: e._id.toString() };
        }
      } catch {}
    }

    const db = readDB();
    const idx = (db.events || []).findIndex(e => (e.id || e._id || "").toString() === id.toString());
    if (idx !== -1) {
      db.events[idx] = { ...db.events[idx], ...update, updatedAt: new Date().toISOString() };
      writeDB(db);
      return { ...db.events[idx], id: (db.events[idx].id || db.events[idx]._id).toString() };
    }
    return null;
  },

  async deleteEvent(id, adminUser) {
    const idStr = id.toString();
    if (getIsConnected()) {
      try {
        const mongoose = require("mongoose");
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
    db.events = (db.events || []).filter(e => (e.id || e._id || "").toString() !== idStr);
    if (Array.isArray(db.applications)) {
      db.applications = db.applications.filter(a => (a.opportunityId || "").toString() !== idStr);
    }
    if (Array.isArray(db.attendance)) {
      db.attendance = db.attendance.filter(a => (a.eventId || "").toString() !== idStr);
    }
    writeDB(db);
    return db.events.length < initialLen;
  },

  async getApplicationsByEvent(eventId) {
    const idStr = (eventId || "").toString();
    if (getIsConnected()) {
      try {
        const apps = await Application.find({ opportunityId: idStr }).lean();
        if (apps && apps.length > 0) return apps.map((a) => ({ ...a, id: a._id.toString() }));
      } catch {}
    }

    const db = readDB();
    const apps = (db.applications || []).filter(a => (a.opportunityId || "").toString() === idStr);
    return apps.map(a => ({ ...a, id: (a.id || a._id || "").toString() }));
  },

  // APPLICATIONS
  async createApplication(data, user) {
    const userId = (user._id || user.id || "").toString();
    const oppId = (typeof data.opportunityId === "object" ? (data.opportunityId?.id || data.opportunityId?._id) : data.opportunityId) || "";
    if (!oppId) throw new Error("Opportunity ID is required.");

    const event = await this.getEventById(oppId);
    if (!event) throw new Error("Opportunity not found.");

    const myApps = await this.getMyApplications(userId, user.applicationId, user.email);
    const existing = myApps.find(a => (a.opportunityId || "").toString() === oppId.toString() && a.status !== "Cancelled");
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
          message: "Your application for \\"" + event.title + "\\" has been received. We\\'ll notify you once reviewed.",
          link: "/applications",
        });
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

    const evIdx = (db.events || []).findIndex(e => (e.id || e._id || "").toString() === oppId.toString());
    if (evIdx !== -1) {
      db.events[evIdx].slotsAvailable = Math.max(0, (Number(db.events[evIdx].slotsAvailable) || 1) - 1);
    }
    writeDB(db);

    await this.createNotification({
      userId,
      type: "application",
      title: "Application Submitted 📋",
      message: "Your application for \\"" + event.title + "\\" has been received. We\\'ll notify you once reviewed.",
      link: "/applications",
    });

    return createdApp;
  },

  async getMyApplications(userId, applicationId, email) {
    const uIdStr = (userId || "").toString();
    const appIdStr = (applicationId || "").toString();
    const em = (email || "").toLowerCase().trim();

    if (getIsConnected()) {
      try {
        const conditions = [];
        if (uIdStr) conditions.push({ userId: uIdStr });
        if (appIdStr) conditions.push({ applicationId: appIdStr });
        if (em) conditions.push({ "applicantDetails.email": em });
        const query = conditions.length > 0 ? { $or: conditions } : {};
        const apps = await Application.find(query).sort({ createdAt: -1 }).lean();
        if (apps && apps.length > 0) return apps.map((a) => ({ ...a, id: a._id.toString() }));
      } catch {}
    }

    const db = readDB();
    const apps = (db.applications || []).filter(a => {
      if (uIdStr && (a.userId || "").toString() === uIdStr) return true;
      if (appIdStr && (a.applicationId || "").toString() === appIdStr) return true;
      if (em && (a.applicantDetails?.email || "").toLowerCase().trim() === em) return true;
      return false;
    });
    return apps.map(a => ({ ...a, id: (a.id || a._id || "").toString() }));
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
      apps = apps.filter(a => a.status === filters.status);
    }
    if (filters.eventId) {
      apps = apps.filter(a => (a.opportunityId || "").toString() === filters.eventId.toString());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      apps = apps.filter(a =>
        (a.applicantDetails?.name || "").toLowerCase().includes(q) ||
        (a.opportunityTitle || "").toLowerCase().includes(q) ||
        (a.referenceId || "").toLowerCase().includes(q) ||
        (a.applicantDetails?.college || "").toLowerCase().includes(q)
      );
    }
    return apps.map(a => ({ ...a, id: (a.id || a._id || "").toString() }));
  },

  async updateApplicationStatus(id, status, notes, adminUser) {
    const idStr = (id || "").toString();
    const db = readDB();
    let app = null;
    const idx = (db.applications || []).findIndex(a => (a.id || a._id || "").toString() === idStr);
    if (idx !== -1) {
      db.applications[idx].status = status;
      if (notes) db.applications[idx].notes = notes;
      app = db.applications[idx];
      writeDB(db);
    }

    if (getIsConnected()) {
      try {
        const mongoose = require("mongoose");
        if (mongoose.isValidObjectId(idStr)) {
          const doc = await Application.findByIdAndUpdate(idStr, { status, ...(notes ? { notes } : {}) }, { new: true }).lean();
          if (doc) app = { ...doc, id: doc._id.toString() };
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
        title: isApproved ? "Application Approved! 🎉" : "Application Status: " + status,
        message: isApproved
          ? "Congratulations! Your application for \\"" + eventTitle + "\\" has been approved. Please report on time."
          : "Your application for \\"" + eventTitle + "\\" was marked as " + status + ".",
        link: "/applications",
      });

      if (app.applicantDetails?.email && isApproved) {
        await EmailService.sendApplicationApproval({
          user: { fullName: app.applicantDetails.name, email: app.applicantDetails.email, applicationId: app.applicationId },
          application: app,
          event: { title: eventTitle, date: app.eventDate },
        });
      }
    } catch (e) {
      console.warn("Status update notification notice:", e.message);
    }

    return { ...app, id: (app.id || app._id).toString() };
  },

  async cancelApplication(id, userId) {
    const idStr = (id || "").toString();
    const db = readDB();
    const idx = (db.applications || []).findIndex(a => (a.id || a._id || "").toString() === idStr);
    if (idx !== -1) {
      db.applications[idx].status = "Cancelled";
      const evIdx = (db.events || []).findIndex(e => (e.id || e._id || "").toString() === (db.applications[idx].opportunityId || "").toString());
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
    const app = (db.applications || []).find(a => (a.id || a._id || "").toString() === idStr);
    if (app) {
      db.applications = db.applications.filter(a => (a.id || a._id || "").toString() !== idStr);
      if (app.status === "Pending" || app.status === "Approved") {
        const evIdx = (db.events || []).findIndex(e => (e.id || e._id || "").toString() === (app.opportunityId || "").toString());
        if (evIdx !== -1) {
          db.events[evIdx].slotsAvailable = (Number(db.events[evIdx].slotsAvailable) || 0) + 1;
        }
      }
      writeDB(db);
      return true;
    }
    return false;
  },

  // QR ATTENDANCE
  async generateEventQRToken(eventId, adminUser) {
    const event = await this.getEventById(eventId);
    if (!event) throw new Error("Event not found.");
    const token = "MF-QR-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
    await this.updateEvent(eventId, { qrCodeToken: token, attendanceOpen: true }, adminUser);
    return { eventId: (event.id || event._id).toString(), qrCodeToken: token, title: event.title, date: event.date };
  },

  async checkInViaQR({ eventId, qrToken, user }) {
    const event = await this.getEventById(eventId);
    if (!event) throw new Error("Event not found.");
    const userId = (user._id || user.id || "").toString();

    const db = readDB();
    if (!Array.isArray(db.attendance)) db.attendance = [];
    const attRecord = {
      id: "att_" + Date.now(),
      eventId,
      userId,
      volunteerName: user.fullName || "Volunteer",
      volunteerEmail: user.email || "",
      status: "Checked-In",
      checkInMethod: "QR_SCAN",
      checkInTime: new Date().toISOString(),
      markedByName: "Self (QR Scan)",
    };
    db.attendance.push(attRecord);
    writeDB(db);

    await this.createNotification({
      userId,
      type: "attendance",
      title: "QR Attendance Recorded! ✅",
      message: "Your attendance at \\"" + event.title + "\\" has been logged via QR Scan.",
      link: "/opportunities/" + eventId,
    });

    return { success: true, message: "Attendance recorded successfully!" };
  },

  async getEventAttendance(eventId) {
    const idStr = (eventId || "").toString();
    const db = readDB();
    return (db.attendance || []).filter(a => (a.eventId || "").toString() === idStr);
  },

  // ATTENDANCE & POINTS & CERTIFICATES & AUTOMATED EMAILS
  async trackAttendanceAndAwardPoints({ eventId, attendanceRecords, adminUser }) {
    const event = await this.getEventById(eventId);
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
      const appIdx = (db.applications || []).findIndex(a => (a.id || a._id || "").toString() === (applicationId || "").toString());
      const app = appIdx !== -1 ? db.applications[appIdx] : null;
      if (!app) continue;

      app.attendanceStatus = status;

      const attIdx = db.attendance.findIndex(at => (at.eventId || "").toString() === eventId.toString() && (at.userId || "").toString() === (userId || "").toString());
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

        const uIdx = (db.users || []).findIndex(u => (u.id || u._id || "").toString() === (userId || "").toString());
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
          reason: "Successfully completed \\"" + event.title + "\\"",
          adminRemarks: "Verified by " + (adminUser?.fullName || "Admin"),
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
        results.push({ userId, pointsAwarded: 0, status: "Attendance marked (" + status + ")" });
      }
    }

    writeDB(db);
    return { event, results };
  },

  `;

content = content.replace(eventsAndAppsOld, eventsAndAppsNew);

// 3. Update issueCertificate, getUserCertificates, getAllCertificates, getCertificateById,
// submitHourLog, getAllHourLogs, getMyHourLogs, updateHourLogStatus
const certsAndHoursOld = content.substring(
  content.indexOf("// CERTIFICATES"),
  content.indexOf("  // BADGES & RECOGNITION")
);

const certsAndHoursNew = `// CERTIFICATES
  async issueCertificate({ userId, eventId, applicationId, verifiedHours = 4, pointsAwarded = 50, adminUser }) {
    const user = await this.findUserById(userId);
    const event = await this.getEventById(eventId);
    if (!user || !event) throw new Error("User or Event not found for certificate issuance.");

    const db = readDB();
    if (!Array.isArray(db.certificates)) db.certificates = [];
    const existing = db.certificates.find(c => (c.userId || "").toString() === userId.toString() && (c.eventId || "").toString() === eventId.toString());
    if (existing) return existing;

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    const certId = "MF-CERT-" + year + "-" + randNum;

    const issueDateStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const cert = {
      id: certId,
      _id: certId,
      certificateId: certId,
      userId,
      applicationId: applicationId || null,
      eventId,
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
      verificationUrl: (process.env.FRONTEND_URL || "http://localhost:5173") + "/certificates/verify/" + certId,
      status: "Issued",
      createdAt: new Date().toISOString(),
    };

    db.certificates.unshift(cert);
    writeDB(db);

    await this.createNotification({
      userId: userId.toString(),
      type: "certificate",
      title: "Volunteering Certificate Issued! 📜",
      message: "Your official volunteering certificate (" + certId + ") for \\"" + event.title + "\\" is ready to view and download!",
      link: "/contributions",
    });

    return cert;
  },

  async getUserCertificates(userId) {
    const idStr = (userId || "").toString();
    const db = readDB();
    return (db.certificates || []).filter(c => (c.userId || "").toString() === idStr);
  },

  async getAllCertificates(filters = {}) {
    const db = readDB();
    let certs = Array.isArray(db.certificates) ? db.certificates : [];
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      certs = certs.filter(c =>
        (c.volunteerName || "").toLowerCase().includes(q) ||
        (c.certificateId || "").toLowerCase().includes(q) ||
        (c.eventTitle || "").toLowerCase().includes(q)
      );
    }
    return certs;
  },

  async getCertificateById(certificateId) {
    const db = readDB();
    const cert = (db.certificates || []).find(c => c.certificateId === certificateId || (c.id || c._id || "").toString() === certificateId.toString());
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
      evidenceUrl: data.evidenceUrl || "",
      verificationStatus: "Pending",
      createdAt: new Date().toISOString(),
    };
    db.hourLogs.unshift(newLog);
    writeDB(db);

    await this.createNotification({
      userId: "admin",
      type: "hours",
      title: "New Volunteer Hours Submitted for Audit",
      message: (user.fullName || "Volunteer") + " submitted " + newLog.submittedHours + " hours for \\"" + data.eventTitle + "\\" awaiting verification.",
      link: "/admin/events",
    });

    return newLog;
  },

  async getAllHourLogs(filters = {}) {
    const db = readDB();
    let logs = Array.isArray(db.hourLogs) ? db.hourLogs : [];
    if (filters.status && filters.status !== "All") {
      logs = logs.filter(l => l.verificationStatus === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      logs = logs.filter(l =>
        (l.volunteerName || "").toLowerCase().includes(q) ||
        (l.eventTitle || "").toLowerCase().includes(q)
      );
    }
    return logs;
  },

  async getMyHourLogs(userId) {
    const db = readDB();
    const idStr = (userId || "").toString();
    return (db.hourLogs || []).filter(l => (l.volunteerId || "").toString() === idStr);
  },

  async updateHourLogStatus(id, { action, verifiedHours, adminRemarks }, adminUser) {
    const db = readDB();
    const idx = (db.hourLogs || []).findIndex(l => (l.id || l._id || "").toString() === id.toString());
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
      const uIdx = (db.users || []).findIndex(u => (u.id || u._id || "").toString() === (log.volunteerId || "").toString());
      if (uIdx !== -1) {
        db.users[uIdx].totalHours = (Number(db.users[uIdx].totalHours) || 0) + finalVerifiedHours;
        db.users[uIdx].points = (Number(db.users[uIdx].points) || 0) + pointsToAdd;
      }
    }

    writeDB(db);
    return log;
  },

  `;

content = content.replace(certsAndHoursOld, certsAndHoursNew);

// 4. Update adjustUserPoints and getPointsTransactions
const pointsOld = content.substring(
  content.indexOf("  async adjustUserPoints(userId,"),
  content.indexOf("  async createNotification(data) {")
);

const pointsNew = `  async adjustUserPoints(userId, { points, type = "CREDIT", reason, adminRemarks }, adminUser) {
    const db = readDB();
    const uIdx = (db.users || []).findIndex(u => (u.id || u._id || "").toString() === userId.toString());
    if (uIdx === -1) throw new Error("User not found");

    const ptsNum = Number(points) || 0;
    const delta = type === "DEBIT" ? -Math.abs(ptsNum) : Math.abs(ptsNum);
    db.users[uIdx].points = Math.max(0, (Number(db.users[uIdx].points) || 0) + delta);

    if (!Array.isArray(db.pointsTransactions)) db.pointsTransactions = [];
    const txId = "tx_" + Date.now();
    const tx = {
      id: txId,
      _id: txId,
      userId,
      applicationId: db.users[uIdx].applicationId,
      studentName: db.users[uIdx].fullName,
      type,
      points: Math.abs(ptsNum),
      reason: reason || "Manual point adjustment by Administrator",
      adminRemarks: adminRemarks || ("Adjusted by " + (adminUser?.fullName || "Admin")),
      createdAt: new Date().toISOString(),
    };
    db.pointsTransactions.unshift(tx);
    writeDB(db);

    await this.createNotification({
      userId: userId.toString(),
      type: "points",
      title: delta >= 0 ? "Points Added (+" + Math.abs(ptsNum) + " pts) ⭐" : "Points Deducted (-" + Math.abs(ptsNum) + " pts) ⚠️",
      message: "Your points balance was updated by Admin: " + (reason || "Points adjustment") + ". Current total: " + db.users[uIdx].points + " pts.",
      link: "/contributions",
    });

    return { user: db.users[uIdx], transaction: tx };
  },

  async getPointsTransactions(userId) {
    const idStr = (userId || "").toString();
    const db = readDB();
    let txs = Array.isArray(db.pointsTransactions) ? db.pointsTransactions : [];
    if (idStr) {
      txs = txs.filter(t => (t.userId || "").toString() === idStr);
    }
    return txs;
  },

  async getUserBadges(userId) {
    const db = readDB();
    return db.badges || DEFAULT_BADGES;
  },

  `;

content = content.replace(pointsOld, pointsNew);

fs.writeFileSync(storageFile, content, "utf8");
console.log("storage.js updated successfully with full dual-mode and offline support!");
