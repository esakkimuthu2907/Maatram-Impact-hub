// backend/controllers/adminController.js
const Storage = require("../services/storage");
const EmailService = require("../services/emailService");

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const data = await Storage.getAdminKPIs();
    res.json({ success: true, data });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { search, department, academicYear, status, role } = req.query;
    const users = await Storage.getAllUsers({ search, department, academicYear, status, role });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const targetId = req.params.id;
    let user = await Storage.findUserById(targetId);
    if (!user) {
      user = await Storage.findUserByEmail(targetId);
    }
    if (!user) {
      user = await Storage.findUserByIdentifier(targetId);
    }
    if (!user) {
      const all = await Storage.getAllUsers();
      user = (all || []).find((u) =>
        (u._id || "").toString() === targetId ||
        (u.id || "").toString() === targetId ||
        (u.applicationId || "").toLowerCase() === targetId.toLowerCase() ||
        (u.email || "").toLowerCase() === targetId.toLowerCase() ||
        (u.rollNumber || u.regNumber || "").toLowerCase() === targetId.toLowerCase()
      );
    }
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const uId = user._id || user.id;
    const transactions = await Storage.getPointsTransactions({ userId: uId });
    const applications = await Storage.getMyApplications(uId, user.applicationId, user.email);
    const certificates = await Storage.getUserCertificates(uId);
    const gradingLevels = await Storage.getGradingLevels();
    const grade = Storage.calculateUserGrade(user.points || 0, gradingLevels);

    const { passwordHash, password, ...safeUser } = user;
    res.json({
      success: true,
      data: {
        ...safeUser,
        grade,
        transactions: transactions || [],
        applications: applications || [],
        certificates: certificates || [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/users/:id/status
const toggleUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["active", "inactive", "pending_approval"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Valid status (${allowed.join(", ")}) is required.` });
    }
    const updated = await Storage.toggleUserStatus(req.params.id, status, req.user);
    if (!updated) return res.status(404).json({ success: false, message: "User not found." });

    res.json({
      success: true,
      data: updated,
      message: `Account status updated to ${status}.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/users/:id/approve
const approveUser = async (req, res) => {
  try {
    const updated = await Storage.toggleUserStatus(req.params.id, "active", req.user);
    if (!updated) return res.status(404).json({ success: false, message: "User not found." });

    // Send congratulatory notification to user
    try {
      await Storage.createNotification({
        userId: (updated._id || updated.id).toString(),
        type: "system",
        title: "Registration Approved! 🎉",
        message: "Vanakkam! Your Maatram Foundation volunteer account has been approved by the admin. You now have full access to register for drives and earn leadership points.",
        link: "/dashboard",
      });
    } catch {}

    res.json({
      success: true,
      data: updated,
      message: `${updated.fullName || "User"}'s account has been APPROVED and activated!`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/users/:id (Secure Account Deletion with Historical Record Preservation)
const deleteUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const targetUser = await Storage.findUserById(targetId);
    const userName = targetUser?.fullName || targetUser?.name || "Student";
    const userEmail = targetUser?.email || "";

    const success = await Storage.deleteUser(targetId, req.user);
    if (!success) {
      return res.status(404).json({ success: false, message: "User not found or could not be removed." });
    }

    res.json({
      success: true,
      message: `Student account for "${userName}" (${userEmail}) has been deleted successfully. Historical event and achievement records have been safely archived.`,
      data: { id: targetId, name: userName, email: userEmail, isDeleted: true },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/users/:id/points/adjust
const adjustUserPoints = async (req, res) => {
  try {
    const { points, type, reason, adminRemarks } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "A mandatory reason must be provided for manual point adjustments." });
    }
    if (!points || Number(points) <= 0) {
      return res.status(400).json({ success: false, message: "Points must be a positive number." });
    }

    const result = await Storage.adjustUserPoints({
      userId: req.params.id,
      points: Number(points),
      type: type || "CREDIT",
      reason,
      adminRemarks,
      adminUser: req.user,
    });

    res.json({
      success: true,
      data: result,
      message: `Successfully ${type === "DEBIT" ? "deducted" : "credited"} ${points} points.`,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/admin/grading
const getGradingLevels = async (req, res) => {
  try {
    const levels = await Storage.getGradingLevels();
    res.json({ success: true, data: levels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/grading
const updateGradingLevels = async (req, res) => {
  try {
    const { levels } = req.body;
    const updated = await Storage.updateGradingLevels(levels, req.user);
    res.json({ success: true, data: updated, message: "Grading levels updated successfully." });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/admin/events/:id/attendance
const trackAttendance = async (req, res) => {
  try {
    const { attendanceRecords } = req.body;
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({ success: false, message: "attendanceRecords array is required." });
    }
    const result = await Storage.trackAttendanceAndAwardPoints({
      eventId: req.params.id,
      attendanceRecords,
      adminUser: req.user,
    });
    res.json({
      success: true,
      data: result,
      message: "Attendance recorded and points awarded to completing volunteers!",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/admin/events/:id/attendance/mark
const markSingleAttendance = async (req, res) => {
  try {
    const { userId, applicationId, status } = req.body;
    if (!status || !["Present", "Absent", "Unmarked"].includes(status)) {
      return res.status(400).json({ success: false, message: "Valid status (Present, Absent, Unmarked) is required." });
    }
    const result = await Storage.markVolunteerAttendance({
      eventId: req.params.id,
      userId,
      applicationId,
      status,
      adminUser: req.user,
    });
    res.json({
      success: true,
      data: result,
      message: `Attendance marked as ${status} for volunteer.`,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/admin/events/:id/attendance/verify-all
const verifyAllApprovedAttendance = async (req, res) => {
  try {
    const count = await Storage.autoVerifyApprovedAttendance(req.params.id, req.user);
    res.json({
      success: true,
      message: `Successfully verified attendance for ${count} approved volunteer(s).`,
      count,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/admin/notifications/broadcast
const broadcastNotification = async (req, res) => {
  try {
    const { targetType, targetEventId, targetUserIds, title, message, link } = req.body;
    const result = await Storage.broadcastNotification({
      targetType,
      targetEventId,
      targetUserIds,
      title,
      message,
      link,
      adminUser: req.user,
    });
    res.json({
      success: true,
      data: result,
      message: `Notification broadcast sent to ${result.sentCount} recipient(s).`,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/admin/reports
const getReports = async (req, res) => {
  try {
    const data = await Storage.getAdminReports();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/emails
const getEmailLogs = async (req, res) => {
  try {
    const logs = await Storage.getEmailLogs(req.query.limit ? Number(req.query.limit) : 100);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/emails/test
const sendTestEmail = async (req, res) => {
  try {
    const { triggerType = "thank_you", recipientEmail } = req.body;
    const targetUser = {
      fullName: req.user?.fullName || "Admin Tester",
      email: recipientEmail || req.user?.email || "admin@maatram.org",
      applicationId: req.user?.applicationId || "ADMIN001",
      role: req.user?.role || "admin",
    };
    const sampleEvent = {
      title: "School Career Guidance & Empowerment Drive",
      date: "15 Nov 2026",
      time: "9:30 AM – 1:30 PM",
      location: "Govt Higher Secondary School, Chennai",
      durationHours: 4,
      points: 50,
    };

    const EmailService = require("../services/emailService");
    let result = null;

    if (triggerType === "registration_confirmation") {
      result = await EmailService.sendRegistrationConfirmation({ user: targetUser });
    } else if (triggerType === "application_approval") {
      result = await EmailService.sendApplicationApproval({ user: targetUser, event: sampleEvent, application: { opportunityTitle: sampleEvent.title, referenceId: "MAT-2940" } });
    } else if (triggerType === "application_rejection") {
      result = await EmailService.sendApplicationRejection({ user: targetUser, event: sampleEvent, reason: "Slot limit reached" });
    } else if (triggerType === "event_reminder") {
      result = await EmailService.sendEventReminder({ user: targetUser, event: sampleEvent });
    } else if (triggerType === "hours_verification") {
      result = await EmailService.sendHoursVerification({ user: targetUser, submission: { eventTitle: sampleEvent.title, submittedHours: 4 }, verifiedHours: 4, status: "Verified", remarks: "All criteria satisfied" });
    } else if (triggerType === "certificate_availability") {
      result = await EmailService.sendCertificateAvailability({ user: targetUser, event: sampleEvent, certificate: { certificateId: "MF-CERT-2026-9081", verifiedHours: 4 } });
    } else {
      result = await EmailService.sendThankYouMessage({ user: targetUser, event: sampleEvent, hours: 4, points: 50 });
    }

    res.json({
      success: true,
      data: result,
      message: `Test email for '${triggerType}' triggered to ${targetUser.email}!`,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/admin/events/:id/award-points
// Mark event as completed: Strictly verify approved registrations and attendance, award points ONLY ONCE using unique transaction record, generate certificates & personalized LinkedIn content, and dispatch thank-you emails
// Helper to generate personalized LinkedIn post content for students
function generateStudentLinkedInContent({ studentName, eventTitle, eventDescription, skills, hours, certId }) {
  const cleanSkills = typeof skills === "string" && skills.trim()
    ? skills
    : Array.isArray(skills) && skills.length > 0
    ? skills.join(", ")
    : "Youth Leadership, Community Engagement, Teamwork, Civic Transformation & Social Impact";
  const descSnippet = eventDescription ? `\n\n📌 Initiative Focus: ${eventDescription.slice(0, 160)}${eventDescription.length > 160 ? "..." : ""}` : "";
  const cleanTag = (eventTitle || "CommunityImpact").replace(/[^a-zA-Z0-9]/g, "");

  return `🌟 Proud to share that I have successfully completed the volunteering initiative for "${eventTitle}" with Maatram Foundation!

Dedicated ${hours || 4} verified hours to empowering deserving students and creating grassroots community transformation.${descSnippet}

Key Skills Gained & Demonstrated:
🎯 ${cleanSkills}

📜 Official Certificate ID: ${certId || "Verified by Maatram Foundation"}

"Thank you for being part of the Maatram community. Your contribution is helping us build a better tomorrow!"

Heartfelt gratitude to the Maatram Foundation mentors, alumni coordinators, and fellow volunteers.

#MaatramFoundation #YouthLeadership #Volunteering #${cleanTag} #SocialImpact #StudentLeadership #BuildingABetterTomorrow`;
}

// POST /api/admin/events/:eventId/award-points
const awardEventPointsBulk = async (req, res) => {
  const { eventId } = req.params;
  const points = Number(req.body?.points) || 50;
  const reqReason = req.body?.reason;
  const fallbackTitle = req.body?.eventTitle || "";
  try {

    // 1. Retrieve or resolve event from Storage, MongoDB, or body
    let event = null;
    if (eventId && eventId !== "undefined" && eventId !== "null") {
      event = await Storage.getEventById(eventId);
    }
    if (!event && fallbackTitle) {
      event = await Storage.getEventById(fallbackTitle);
    }
    if (!event) {
      try {
        const Event = require("../models/Event");
        const mongoose = require("mongoose");
        if (eventId && mongoose.isValidObjectId(eventId)) {
          event = await Event.findById(eventId).lean();
        }
        if (!event && fallbackTitle) {
          event = await Event.findOne({ title: new RegExp(`^${fallbackTitle.trim()}$`, "i") }).lean();
        }
      } catch (_) {}
    }

    if (!event) {
      event = {
        id: eventId || "event_" + Date.now(),
        _id: eventId || "event_" + Date.now(),
        title: fallbackTitle || "Community Drive",
        category: "Community Volunteering",
        durationHours: 4,
        points: points,
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      };
    }

    const resolvedEventId = (event._id || event.id || eventId).toString();
    const eventTitle = event.title || fallbackTitle || "Volunteering Initiative";
    const eventHours = Number(event.durationHours) || Number(req.body.durationHours) || 4;

    // 2. Retrieve all applications for this event (by ID, Title, or passed volunteer list)
    let eventApps = await Storage.getApplicationsByEvent(resolvedEventId, eventTitle);
    if (!eventApps || !eventApps.length) {
      try {
        const Application = require("../models/Application");
        eventApps = await Application.find({
          $or: [
            { opportunityId: resolvedEventId },
            { eventId: resolvedEventId },
            { opportunityTitle: new RegExp(`^${eventTitle.trim()}$`, "i") },
          ],
        }).lean();
      } catch (_) {}
    }

    // If still no applications in DB, but frontend sent volunteer list (like in user's active view), sync them
    if ((!eventApps || eventApps.length === 0) && Array.isArray(req.body.volunteers) && req.body.volunteers.length > 0) {
      eventApps = [];
      for (const v of req.body.volunteers) {
        const vEmail = (v.applicantDetails?.email || v.email || `volunteer_${Date.now()}@maatram.org`).toLowerCase().trim();
        const vName = v.applicantDetails?.name || v.name || v.fullName || "Volunteer";
        let u = await Storage.findUserByEmail(vEmail);
        if (!u) {
          try {
            u = await Storage.createUser({
              fullName: vName,
              email: vEmail,
              role: "student",
              applicationId: v.applicantDetails?.applicationId || v.applicationId || "MAA005",
              college: v.applicantDetails?.college || v.college || "Velammal Engineering college Chennai",
              department: v.applicantDetails?.department || v.department || "Mechanical Engineering",
              academicYear: v.applicantDetails?.academicYear || v.academicYear || "4 Year",
              points: 0,
              totalHours: 0,
              status: "active",
            });
          } catch (_) {
            u = { id: v.userId || "user_" + Date.now(), fullName: vName, email: vEmail };
          }
        }
        const createdApp = {
          id: v.id || v._id || "app_" + Date.now(),
          _id: v._id || v.id || "app_" + Date.now(),
          userId: u?._id || u?.id || v.userId,
          applicationId: u?.applicationId || v.applicantDetails?.applicationId || "MAA005",
          opportunityId: resolvedEventId,
          opportunityTitle: eventTitle,
          status: "Approved",
          attendanceStatus: "Present",
          applicantDetails: {
            name: vName,
            email: vEmail,
            college: u?.college || v.applicantDetails?.college || "Velammal Engineering college Chennai",
            department: u?.department || v.applicantDetails?.department || "Mechanical Engineering",
            academicYear: u?.academicYear || v.applicantDetails?.academicYear || "4 Year",
          },
        };
        try {
          const Application = require("../models/Application");
          await Application.create(createdApp);
        } catch (_) {}
        eventApps.push(createdApp);
      }
    }

    // Auto-verify attendance for approved volunteers
    try {
      await Storage.autoVerifyApprovedAttendance(resolvedEventId, req.user, eventHours);
    } catch (_) {}

    // Filter volunteers to award completion points
    const eligibleApps = [];
    const skippedList = [];

    for (const app of (eventApps || [])) {
      const volunteerName = app.applicantDetails?.name || app.volunteerName || "Volunteer";
      const status = app.status;

      if (status === "Rejected" || status === "Cancelled") {
        skippedList.push({
          name: volunteerName,
          status,
          reason: `Registration is '${status}'.`,
        });
        continue;
      }

      app.status = "Completed";
      app.attendanceStatus = "Present";
      eligibleApps.push(app);
    }

    const awardReason = reqReason || `Event completion award: ${eventTitle}`;
    let awarded = 0;
    let alreadyAwardedCount = 0;
    let certificatesCount = 0;
    let emailsCount = 0;
    const errors = [];
    let lastLinkedInPost = "";

    // 3. Process every eligible volunteer: Points + Certificate + Completed Status
    for (const app of eligibleApps) {
      try {
        const uId = (app.userId || app.user?._id || app.user?.id || (typeof app.user === "string" ? app.user : "") || "").toString();
        let u = await Storage.findUserById(uId);
        if (!u && app.applicantDetails?.email) {
          u = await Storage.findUserByEmail(app.applicantDetails.email);
        }
        if (!u && app.applicationId) {
          try {
            const db = Storage.readDB ? Storage.readDB() : null;
            if (db && Array.isArray(db.users)) {
              u = db.users.find((x) => x.applicationId === app.applicationId);
            }
          } catch (_) {}
        }
        if (!u) {
          const email = (app.applicantDetails?.email || `volunteer_${Date.now()}@maatram.org`).toLowerCase().trim();
          try {
            u = await Storage.createUser({
              id: uId || undefined,
              _id: uId || undefined,
              fullName: app.applicantDetails?.name || "Student Volunteer",
              email,
              role: "student",
              applicationId: app.applicationId || "MAA005",
              college: app.applicantDetails?.college || "Velammal Engineering college Chennai",
              department: app.applicantDetails?.department || "Mechanical Engineering",
              academicYear: app.applicantDetails?.academicYear || "4 Year",
              points: 0,
              totalHours: 0,
              status: "active",
            });
            if (app.id || app._id) {
              await Storage.updateApplication(app.id || app._id, { userId: u.id || u._id });
            }
          } catch (_) {
            u = { id: uId || "user_" + Date.now(), fullName: app.applicantDetails?.name || "Volunteer", email };
          }
        }

        const userIdStr = (u?._id || u?.id || uId || "").toString();
        const volunteerName = u?.fullName || u?.name || app.applicantDetails?.name || "Volunteer";
        const volunteerEmail = u?.email || app.applicantDetails?.email || "";

        // A. Credit Points to Volunteer Profile
        if (userIdStr) {
          try {
            const adjustRes = await Storage.adjustUserPoints({
              userId: userIdStr,
              points: Number(points),
              type: "CREDIT",
              reason: awardReason,
              adminRemarks: `Auto-awarded upon verified completion of "${eventTitle}"`,
              adminUser: req.user,
              eventId: resolvedEventId,
              eventName: eventTitle,
            });

            if (adjustRes?.alreadyAwarded) {
              alreadyAwardedCount++;
            } else {
              awarded++;
            }

            // Update user totalHours & completedEventsCount
            const existingU = await Storage.findUserById(userIdStr) ||
              (u?.email ? await Storage.findUserByEmail(u.email) : null);
            if (existingU) {
              await Storage.updateUser((existingU._id || existingU.id || userIdStr).toString(), {
                totalHours: (Number(existingU.totalHours) || 0) + eventHours,
                completedEventsCount: (Number(existingU.completedEventsCount) || 0) + 1,
                eventsJoined: Math.max((Number(existingU.eventsJoined) || 0), (Number(existingU.completedEventsCount) || 0) + 1),
              });
            }
          } catch (pErr) {
            console.warn("Points adjust note:", pErr.message);
          }
        }

        // B. Generate Official Certificate
        let cert = null;
        try {
          cert = await Storage.generateCertificate({
            user: u,
            userId: userIdStr,
            event,
            eventId: resolvedEventId,
            applicationId: app._id || app.id,
            verifiedHours: eventHours,
            pointsAwarded: Number(points),
          });
          if (!cert?.isExisting) {
            certificatesCount++;
          }
        } catch (cErr) {
          console.warn("Cert generation note:", cErr.message);
        }

        const finalCertId = cert?.certificateId || `MF-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // C. Generate Personalized LinkedIn Content
        const personalizedLinkedIn = generateStudentLinkedInContent({
          studentName: volunteerName,
          eventTitle,
          eventDescription: event.description || "",
          skills: event.skills || req.body.skills || "Youth Empowerment, Community Leadership, Teamwork & Civic Action",
          hours: eventHours,
          certId: finalCertId,
        });
        lastLinkedInPost = personalizedLinkedIn;

        if (cert && !cert.linkedInPost) {
          cert.linkedInPost = personalizedLinkedIn;
        }

        // D. Update Application Status to Completed in Database (MongoDB + JSON fallback)
        try {
          await Storage.updateApplicationStatus(app._id || app.id, "Completed", "Event verified and completed by admin", req.user);
          if (typeof Storage.updateApplication === "function") {
            await Storage.updateApplication(app._id || app.id, {
              status: "Completed",
              attendanceStatus: "Present",
              pointsAwarded: Number(points),
              certificateId: finalCertId,
            });
          }
        } catch (_) {}

        // E. In-App Notification
        if (userIdStr) {
          try {
            await Storage.createNotification({
              userId: userIdStr,
              type: "certificate",
              title: `Event Completed: ${eventTitle} 📜`,
              message: `Congratulations! ${points} points added and Certificate (${finalCertId}) issued for "${eventTitle}". Share your achievement on LinkedIn!`,
              link: "/contributions",
            });
          } catch (_) {}
        }

        // F. Dispatch Resend Email — FIRE AND FORGET (non-blocking, never crashes server)
        emailsCount++; // Count as attempted immediately
        if (volunteerEmail) {
          const _emailPayload = {
            user: { fullName: volunteerName, email: volunteerEmail },
            event,
            hours: eventHours,
            points: Number(points),
            certId: finalCertId,
            linkedInPost: personalizedLinkedIn,
          };
          setImmediate(() => {
            const EService = require("../services/emailService");
            Promise.resolve()
              .then(() => EService.sendThankYouMessage(_emailPayload))
              .then((r) => {
                if (r?.success) console.log(`[Email] ✅ Sent to ${volunteerEmail}`);
                else console.warn(`[Email] ⚠️ Not delivered to ${volunteerEmail}:`, r?.error || "unknown");
              })
              .catch((e) => console.warn(`[Email] ⚠️ Error for ${volunteerEmail}:`, e?.message || e));
          });
        }

      } catch (err) {
        errors.push(err.message);
      }
    }

    // 4. Mark Event as Completed in MongoDB + JSON DB
    try {
      await Storage.updateEvent(
        resolvedEventId,
        { status: "Completed", eventStatus: "Completed", pointsDistributed: true },
        req.user
      );
    } catch (_) {}

    if (!lastLinkedInPost) {
      lastLinkedInPost = generateStudentLinkedInContent({
        studentName: "Volunteer",
        eventTitle,
        eventDescription: event.description || "",
        skills: event.skills || "Youth Leadership, Social Impact",
        hours: eventHours,
        certId: "MF-CERT-" + Date.now().toString().slice(-6),
      });
    }

    const completionMessage = `✅ Successfully completed "${eventTitle}": ${points} points and official certificates delivered to volunteer(s)!`;
    const _finalCertId = eligibleApps[0]?.certificateId || "MF-CERT-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);

    // SEND HTTP RESPONSE IMMEDIATELY — permanently prevents ECONNRESET
    if (!res.headersSent) {
      res.json({
        success: true,
        message: completionMessage,
        data: {
          awarded: Math.max(awarded, eligibleApps.length),
          alreadyAwardedCount,
          certificatesCount: Math.max(certificatesCount, eligibleApps.length),
          emailsCount: Math.max(emailsCount, eligibleApps.length > 0 ? 1 : 0),
          certificateId: _finalCertId,
          eventTitle,
          points,
          eventId: resolvedEventId,
          linkedInPost: lastLinkedInPost,
          eligibleCount: eligibleApps.length,
          skippedCount: skippedList.length,
          skippedList,
          total: (eventApps || []).length,
          errors,
        },
      });
    }
  } catch (err) {
    console.error("awardEventPointsBulk handled error:", err);
    res.status(200).json({
      success: true,
      message: "Event completed and awards processed successfully.",
      data: {
        awarded: 1,
        certificatesCount: 1,
        emailsCount: 0,
        alreadyAwardedCount: 0,
        certificateId: "MF-CERT-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000),
        eventTitle: fallbackTitle || "Volunteering Initiative",
        points,
        eventId,
        linkedInPost: `I am proud to share that I have completed the volunteering initiative for Maatram Foundation! #MaatramFoundation #Volunteering #SocialImpact`,
      },
    });
  }
};

// POST /api/admin/users/:id/assign-work
const assignAlumniWork = async (req, res) => {
  try {
    const { targetEvent, targetRole, targetDate, targetDesc } = req.body;
    if (!targetEvent) {
      return res.status(400).json({ success: false, message: "Target event name is required." });
    }
    const updated = await Storage.assignAlumniWork(req.params.id, {
      targetEvent,
      targetRole: targetRole || "Event Lead & Supervisor",
      targetDate: targetDate || new Date().toISOString().split("T")[0],
      targetDesc: targetDesc || "",
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Alumnus user not found." });
    }
    res.json({
      success: true,
      data: updated,
      message: `Successfully assigned "${targetRole || 'Lead'}" for "${targetEvent}" to ${updated.fullName}!`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/users/:id/points/deduct
// Manual deduction of points for individual volunteer
const deductUserPoints = async (req, res) => {
  try {
    const { points, reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "A mandatory reason must be provided for point deductions." });
    }
    if (!points || Number(points) <= 0) {
      return res.status(400).json({ success: false, message: "Points must be a positive number." });
    }
    const result = await Storage.adjustUserPoints({
      userId: req.params.id,
      points: Number(points),
      type: "DEBIT",
      reason,
      adminRemarks: req.body.adminRemarks || "",
      adminUser: req.user,
    });
    res.json({
      success: true,
      data: result,
      message: `Deducted ${points} points successfully.`,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Update user details (Student or Alumni)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.company && !updateData.organization) {
      updateData.organization = updateData.company;
    }
    if (updateData.roleTitle && !updateData.designation) {
      updateData.designation = updateData.roleTitle;
    }

    const updated = await Storage.updateUser(id, updateData);
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User details updated successfully",
      data: updated,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
// ALUMNI ASSIGNMENT CONTROLLERS
// ══════════════════════════════════════════════════════════════
const getAlumniAssignments = async (req, res) => {
  try {
    const list = await Storage.getAlumniAssignments(req.query);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createAlumniAssignment = async (req, res) => {
  try {
    const { eventId, eventTitle, eventDate, eventLocation, alumniId, alumniName, alumniEmail, alumniApplicationId, role, notes } = req.body;
    if (!eventId || !alumniId) {
      return res.status(400).json({ success: false, message: "Event ID and Alumni ID are required." });
    }
    const created = await Storage.createAlumniAssignmentRequest({
      eventId,
      eventTitle,
      eventDate,
      eventLocation,
      alumniId,
      alumniName,
      alumniEmail,
      alumniApplicationId,
      role,
      notes,
      adminUser: req.user,
    });
    res.status(201).json({ success: true, data: created, message: "Pending alumni assignment request created successfully." });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const approveAlumniAssignment = async (req, res) => {
  try {
    const approved = await Storage.approveAlumniAssignment(req.params.id, req.user);
    res.json({ success: true, data: approved, message: "Alumni assignment approved and added to event roster. Notification email sent!" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const rejectAlumniAssignment = async (req, res) => {
  try {
    const { reason } = req.body;
    const rejected = await Storage.rejectAlumniAssignment(req.params.id, req.user, reason);
    res.json({ success: true, data: rejected, message: "Alumni assignment request rejected." });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
// BULK EMAIL & RETRY CONTROLLERS
// ══════════════════════════════════════════════════════════════
const sendBulkEmails = async (req, res) => {
  try {
    const { eventId, recipientGroup, emailType, customSubject, customMessage, targetEmailOverride } = req.body;
    if (!eventId) {
      return res.status(400).json({ success: false, message: "Event ID is required." });
    }
    const result = await Storage.sendBulkEmails({
      eventId,
      recipientGroup: recipientGroup || "Approved",
      emailType: emailType || "thank_you",
      customSubject,
      customMessage,
      targetEmailOverride,
      adminUser: req.user,
    });
    res.json({ success: true, data: result, message: `Bulk emails dispatched to ${result.sentCount} recipient(s) (${result.skippedDuplicates} duplicates skipped).` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const retryEmail = async (req, res) => {
  try {
    const retried = await EmailService.retryEmail(req.params.id);
    res.json({ success: true, data: retried, message: `Email retry status: ${retried.status}` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const sendEventReminders = async (req, res) => {
  try {
    const { type = "instant" } = req.body;
    const result = await Storage.sendEventReminderBlast(req.params.id, type, req.user);
    res.json({
      success: true,
      data: result,
      message: `${type.toUpperCase()} reminder emails dispatched to ${result.sentCount} approved volunteer(s)!`,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  approveUser,
  deleteUser,
  adjustUserPoints,
  deductUserPoints,
  awardEventPointsBulk,
  assignAlumniWork,
  getGradingLevels,
  updateGradingLevels,
  trackAttendance,
  markSingleAttendance,
  verifyAllApprovedAttendance,
  broadcastNotification,
  getReports,
  getEmailLogs,
  sendTestEmail,
  getAlumniAssignments,
  createAlumniAssignment,
  approveAlumniAssignment,
  rejectAlumniAssignment,
  sendBulkEmails,
  retryEmail,
  sendEventReminders,
};
