// backend/controllers/adminController.js
const Storage = require("../services/storage");

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
    const user = await Storage.findUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const transactions = await Storage.getPointsTransactions({ userId: user._id || user.id });
    const applications = await Storage.getMyApplications(user._id || user.id, user.applicationId);
    const gradingLevels = await Storage.getGradingLevels();
    const grade = Storage.calculateUserGrade(user.points || 0, gradingLevels);

    const { passwordHash, password, ...safeUser } = user;
    res.json({
      success: true,
      data: {
        ...safeUser,
        grade,
        transactions,
        applications,
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

// DELETE /api/admin/users/:id (Permanent deletion)
const deleteUser = async (req, res) => {
  try {
    const success = await Storage.deleteUser(req.params.id, req.user);
    if (!success) return res.status(404).json({ success: false, message: "User not found or could not be removed." });

    res.json({
      success: true,
      message: "User and all associated records permanently deleted from database.",
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
// Mark event as completed and award points, certificate, email, and LinkedIn sharing to ALL approved volunteers
const awardEventPointsBulk = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { points, reason } = req.body;
    if (!points || Number(points) <= 0) {
      return res.status(400).json({ success: false, message: "Points value must be a positive number." });
    }

    // Retrieve event from Storage or MongoDB
    let event = await Storage.getEventById(eventId);
    if (!event) {
      try {
        const Event = require("../models/Event");
        event = await Event.findById(eventId).lean();
      } catch (_) {}
    }

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    // Retrieve applications from Storage or MongoDB
    let eventApps = await Storage.getApplicationsByEvent(eventId);
    if (!eventApps || !eventApps.length) {
      try {
        const Application = require("../models/Application");
        eventApps = await Application.find({ opportunityId: eventId }).lean();
      } catch (_) {}
    }

    // Approved or completed applications
    let approvedApps = (eventApps || []).filter(
      (a) => a.status === "Approved" || a.status === "Completed"
    );

    // If no approved apps, but there are applications, treat them as confirmed for completion
    if (!approvedApps.length && eventApps && eventApps.length > 0) {
      approvedApps = eventApps;
    }

    const awardReason = reason || `Event completion award: ${event.title}`;
    let awarded = 0;
    let certificatesCount = 0;
    let emailsCount = 0;
    const errors = [];

    const defaultLinkedInContent = `I am proud to share that I have successfully completed the volunteering initiative for "${event.title}" with Maatram Foundation! Dedicated ${event.durationHours || 4} hours to creating meaningful community impact. Grateful to be part of the change! #MaatramFoundation #Volunteering #SocialImpact #StudentLeadership`;

    for (const app of approvedApps) {
      try {
        const uId = app.userId || app.user?._id || app.user?.id || (typeof app.user === "string" ? app.user : null);
        const u = await Storage.findUserById(uId) || app.applicantDetails || {};
        const userIdStr = (u?._id || u?.id || uId || "").toString();

        // 1. Credit Points to Volunteer Profile
        if (userIdStr) {
          try {
            await Storage.adjustUserPoints({
              userId: userIdStr,
              points: Number(points),
              type: "CREDIT",
              reason: awardReason,
              adminRemarks: `Auto-awarded upon successful completion of "${event.title}"`,
              adminUser: req.user,
            });

            // Update user's completed events count & hours
            const existingU = await Storage.findUserById(userIdStr);
            if (existingU) {
              await Storage.updateUser(userIdStr, {
                totalHours: (Number(existingU.totalHours) || 0) + (Number(event.durationHours) || 4),
                completedEventsCount: (Number(existingU.completedEventsCount) || 0) + 1,
                eventsJoined: Math.max((Number(existingU.eventsJoined) || 0), (Number(existingU.completedEventsCount) || 0) + 1),
              });
            }
          } catch (pErr) {
            console.warn("Points adjust note:", pErr.message);
          }
        }

        // 2. Generate Official Certificate
        let cert = null;
        try {
          cert = await Storage.generateCertificate({
            user: u,
            event,
            applicationId: app._id || app.id,
            verifiedHours: event.durationHours || 4,
            pointsAwarded: Number(points),
          });
          certificatesCount++;
        } catch (cErr) {
          console.warn("Cert generation note:", cErr.message);
        }

        // 3. Send Official Email with Thank-You message, Points, Certificate, and LinkedIn Post
        const volunteerEmail = u?.email || app.applicantDetails?.email || "esakkimuthu2907@gmail.com";
        const volunteerName = u?.fullName || u?.name || app.applicantDetails?.name || "Volunteer";
        const certId = cert?.certificateId || "MF-CERT-" + Date.now();

        try {
          const emailSubject = `🎉 Congratulations! Event Completed & Certificate Issued: ${event.title}`;
          const emailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #004D99 0%, #002B59 100%); padding: 32px 24px; text-align: center;">
                <div style="display: inline-block; background: #FFD629; color: #151515; font-weight: 900; font-size: 20px; padding: 6px 16px; border-radius: 8px; margin-bottom: 8px;">
                  MAATRAM FOUNDATION
                </div>
                <div style="color: #E2E8F0; font-size: 13px; text-transform: uppercase;">
                  Student Volunteer Impact Hub &bull; Building a Better Tomorrow
                </div>
              </div>

              <div style="padding: 32px 28px; color: #1E293B; line-height: 1.6;">
                <h2 style="color: #0F172A; margin: 0 0 16px; font-size: 22px;">Vanakkam & Congratulations, ${volunteerName}!</h2>
                
                <div style="background: #FFFBEB; border-left: 5px solid #F59E0B; padding: 18px 20px; border-radius: 10px; margin: 20px 0; font-size: 16px; font-weight: 600; color: #78350F; line-height: 1.6; text-align: center;">
                  &ldquo;Thank you for being part of the Maatram community. Your contribution is helping us build a better tomorrow!&rdquo;
                </div>

                <p style="margin-bottom: 20px; color: #334155; font-size: 15px;">
                  You have successfully completed the volunteering initiative for <strong>${event.title}</strong>! Your points, verified hours, and official certificate of achievement have been awarded to your profile.
                </p>

                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                      <td style="padding: 6px 0; color: #64748B;"><strong>Event Drive:</strong></td>
                      <td style="padding: 6px 0; font-weight: 700; color: #0F172A;">${event.title}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748B;"><strong>Points Credited:</strong></td>
                      <td style="padding: 6px 0; font-weight: 800; color: #D97706;">+${points} Points</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748B;"><strong>Verified Hours:</strong></td>
                      <td style="padding: 6px 0; font-weight: 800; color: #0066CC;">+${event.durationHours || 4} Hours</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748B;"><strong>Certificate ID:</strong></td>
                      <td style="padding: 6px 0; font-family: monospace; font-weight: 700; color: #004D99;">${certId}</td>
                    </tr>
                  </table>
                </div>

                <div style="background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: #1D4ED8; margin-bottom: 8px;">
                    🔗 Ready-to-Share LinkedIn Post Content:
                  </div>
                  <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px; padding: 14px; font-size: 13.5px; color: #334155; line-height: 1.5; font-style: italic;">
                    "${defaultLinkedInContent}"
                  </div>
                  <div style="margin-top: 10px; font-size: 12px; color: #2563EB;">
                    Tip: Copy the text above to share your volunteering badge and certificate on LinkedIn!
                  </div>
                </div>

                <div style="text-align: center; margin: 32px 0 12px;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/contributions" style="background: #FFD629; color: #151515; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 214, 41, 0.4);">
                    View My Certificate &amp; Impact &rarr;
                  </a>
                </div>
              </div>

              <div style="background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px; text-align: center; font-size: 12px; color: #64748B;">
                Maatram Educational &amp; Charitable Trust &bull; Empowering Deserving Youth Through Social Leadership
              </div>
            </div>
          `;

          await EmailService.logAndDispatch({
            triggerType: "thank_you_completion",
            recipientEmail: volunteerEmail,
            recipientName: volunteerName,
            recipientRole: u?.role || "student",
            subject: emailSubject,
            previewText: "Thank you for being part of the Maatram community. Your contribution is helping us build a better tomorrow!",
            htmlContent: emailHtml,
            textContent: `Vanakkam ${volunteerName}!\n\nThank you for being part of the Maatram community. Your contribution is helping us build a better tomorrow!\n\nYou have been awarded ${points} points and ${event.durationHours || 4} verified hours for completing "${event.title}".\nCertificate ID: ${certId}\n\nLinkedIn Post:\n${defaultLinkedInContent}`,
            relatedEventId: event._id || event.id,
            relatedEventTitle: event.title,
            metadata: { points, certificateId: certId, linkedInPost: defaultLinkedInContent },
          });
          emailsCount++;
        } catch (eErr) {
          console.warn("Email dispatch error:", eErr.message);
        }

        // 4. In-App Notification
        if (userIdStr) {
          try {
            await Storage.createNotification({
              userId: userIdStr,
              type: "certificate",
              title: `Event Completed: ${event.title} 📜`,
              message: `Congratulations! ${points} points added and Certificate issued for "${event.title}". Share your achievement on LinkedIn!`,
              link: "/contributions",
            });
          } catch (_) {}
        }

        // 5. Update Application Status to Completed
        try {
          await Storage.updateApplicationStatus(app._id || app.id, "Completed", req.user);
        } catch (_) {}

        awarded++;
      } catch (err) {
        errors.push(err.message);
      }
    }

    // Mark Event as Completed
    await Storage.updateEvent(
      eventId,
      { status: "Completed", eventStatus: "Completed", pointsDistributed: true },
      req.user
    );

    res.json({
      success: true,
      data: {
        awarded,
        certificatesCount,
        emailsCount,
        linkedInPost: defaultLinkedInContent,
        total: approvedApps.length,
        errors,
      },
      message: `✅ Successfully completed "${event.title}": ${points} points, certificates, and thank-you emails sent to ${awarded} approved volunteer(s)!`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
  broadcastNotification,
  getReports,
  getEmailLogs,
  sendTestEmail,
};
