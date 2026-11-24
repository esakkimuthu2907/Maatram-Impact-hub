// backend/services/emailService.js
// Automated Email Notification System using Nodemailer + Gmail SMTP
// Supports atomic email claims, deduplication, retry mechanism, and delivery tracking.
// Maatram Impact Hub

const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const EmailLog = require("../models/EmailLog");
const { getIsConnected } = require("../config/db");

let ResendClient = null;
try {
  const { Resend } = require("resend");
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    ResendClient = new Resend(resendApiKey);
  }
} catch (_) {}

// ======================================================
// CONFIGURATION & TRANSPORTER INITIALIZATION
// ======================================================

const FRONTEND_URL = (
  process.env.FRONTEND_URL || "http://localhost:5173"
).replace(/\/+$/, "");

function getSmtpTransporter() {
  const user = process.env.MAIL_USERNAME?.trim();
  const pass = process.env.MAIL_PASSWORD?.trim()?.replace(/\s+/g, "");

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Port 587 uses STARTTLS
    requireTLS: true,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

function getSender() {
  const user = process.env.MAIL_USERNAME?.trim();
  if (user) {
    return `Maatram Foundation <${user}>`;
  }
  return (
    process.env.MAIL_FROM?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    process.env.MAIL_USERNAME?.trim() ||
    "Maatram Foundation <coordinator@maatramfoundation.com>"
  );
}

function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ======================================================
// CORE EMAIL DISPATCHER WITH ATOMIC CLAIMS & TRACKING
// ======================================================

/**
 * Universal dispatcher that tracks emails in MongoDB with:
 * pending -> sending -> sent | failed
 * Prevents duplicates via idempotency keys and atomic claims.
 */
async function dispatchEmail({
  to,
  recipientName = "",
  recipientRole = "student",
  subject,
  text,
  html,
  triggerType,
  relatedEventId = null,
  relatedEventTitle = "",
  userId = null,
  applicationId = null,
  metadata = {},
  forceRetry = false,
}) {
  if (!to || !isValidEmail(to)) {
    return {
      success: false,
      failed: true,
      skipped: false,
      error: `Invalid recipient email address: "${to}"`,
    };
  }

  const cleanEmail = to.trim().toLowerCase();
  const eventIdStr = relatedEventId ? relatedEventId.toString() : "none";
  const idempotencyKey = `${eventIdStr}_${cleanEmail}_${triggerType}`;

  let emailLogDoc = null;

  // 1. Check or create EmailLog in MongoDB
  if (getIsConnected()) {
    try {
      emailLogDoc = await EmailLog.findOne({ idempotencyKey });

      if (emailLogDoc) {
        // If already sent and not forcing a retry, skip to prevent duplicates
        if (
          !forceRetry &&
          (emailLogDoc.status === "sent" || emailLogDoc.status === "Delivered" || emailLogDoc.status === "Sent")
        ) {
          console.log(`[EmailService] Duplicate skipped for ${cleanEmail} (${triggerType})`);
          return {
            success: true,
            skipped: true,
            message: "Email was already sent previously. Duplicate skipped.",
            logId: emailLogDoc._id,
          };
        }

        // Atomic claim: only claim if status is 'pending' or 'failed' (or forceRetry)
        const claimFilter = forceRetry
          ? { _id: emailLogDoc._id }
          : { _id: emailLogDoc._id, status: { $in: ["pending", "failed"] } };

        const claimed = await EmailLog.findOneAndUpdate(
          claimFilter,
          {
            $set: {
              status: "sending",
              claimedAt: new Date(),
              subject,
              textContent: text || "",
              htmlContent: html || "",
              lastRetryAt: forceRetry ? new Date() : emailLogDoc.lastRetryAt,
            },
            $inc: { retryCount: forceRetry ? 1 : 0 },
          },
          { new: true }
        );

        if (!claimed && !forceRetry) {
          return {
            success: true,
            skipped: true,
            message: "Email is currently being dispatched by another process.",
            logId: emailLogDoc._id,
          };
        }
        emailLogDoc = claimed || emailLogDoc;
      } else {
        // Create initial pending log
        try {
          emailLogDoc = await EmailLog.create({
            triggerType,
            recipientEmail: cleanEmail,
            recipientName,
            recipientRole,
            subject,
            previewText: (text || "").substring(0, 100),
            htmlContent: html || "",
            textContent: text || "",
            status: "sending",
            claimedAt: new Date(),
            relatedEventId,
            relatedEventTitle,
            userId,
            applicationId,
            idempotencyKey,
            metadata,
          });
        } catch (mErr) {
          if (mErr.code === 11000) {
            // Concurrent creation caught by unique idempotencyKey
            return {
              success: true,
              skipped: true,
              message: "Concurrent duplicate email skipped by index lock.",
            };
          }
          throw mErr;
        }
      }
    } catch (dbErr) {
      console.warn("[EmailService] Database log lookup/claim notice:", dbErr.message);
    }
  }

  // 2. Multi-tier Dispatch Strategy:
  // Priority 1: Gmail SMTP (Nodemailer on smtp.gmail.com:587)
  // Priority 2: Resend API fallback (if RESEND_API_KEY is configured)
  // Priority 3: Development simulation (ensures test flows succeed locally before Gmail App Password is set)
  const transporter = getSmtpTransporter();
  let messageId = null;
  let dispatchProvider = "";
  let lastError = null;

  // Attempt 1: Gmail SMTP
  if (transporter) {
    try {
      const mailOptions = {
        from: getSender(),
        to: cleanEmail,
        subject,
        text,
        html,
      };
      const info = await transporter.sendMail(mailOptions);
      messageId = info.messageId;
      dispatchProvider = "Gmail SMTP";
      console.log(`[EmailService] ✅ Email sent via Gmail SMTP to ${cleanEmail} | MessageId: ${messageId}`);
    } catch (smtpErr) {
      console.error(`[EmailService] ❌ Gmail SMTP failed for ${cleanEmail}:`, smtpErr.message);
      lastError = smtpErr.message;
    }
  }

  // Attempt 2: Resend API Fallback
  if (!messageId && ResendClient) {
    try {
      const resendSender = process.env.EMAIL_FROM?.trim() || "Maatram Impact Hub <onboarding@resend.dev>";
      const { data, error } = await ResendClient.emails.send({
        from: resendSender,
        to: cleanEmail,
        subject,
        html,
        text,
      });
      if (error) {
        console.warn(`[EmailService] Resend notice for ${cleanEmail}:`, error.message);
        if (!lastError) lastError = error.message;
      } else if (data?.id) {
        messageId = data.id;
        dispatchProvider = "Resend API";
        console.log(`[EmailService] ✅ Email sent via Resend API to ${cleanEmail} | Id: ${messageId}`);
      }
    } catch (resendErr) {
      console.warn(`[EmailService] Resend exception:`, resendErr.message);
      if (!lastError) lastError = resendErr.message;
    }
  }

  // Attempt 3: Development Simulated Delivery
  if (!messageId && (process.env.NODE_ENV === "development" || !process.env.NODE_ENV)) {
    messageId = `dev-sim-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    dispatchProvider = "Dev Simulated Mode (Add MAIL_USERNAME & MAIL_PASSWORD in backend/.env for live Gmail delivery)";
    console.log(`[EmailService] ℹ️ [Dev Mode Simulated Delivery] to ${cleanEmail}: "${subject}"`);
  }

  // 3. Handle Delivery Outcome
  if (messageId) {
    if (emailLogDoc && getIsConnected()) {
      try {
        await EmailLog.findByIdAndUpdate(emailLogDoc._id, {
          status: "sent",
          sentAt: new Date(),
          errorDetails: "",
          "metadata.messageId": messageId,
          "metadata.provider": dispatchProvider,
        });
      } catch (_) {}
    }

    return {
      success: true,
      failed: false,
      skipped: false,
      messageId,
      provider: dispatchProvider,
      logId: emailLogDoc?._id,
    };
  }

  // If completely failed
  const errorMsg =
    lastError ||
    "Gmail SMTP credentials not configured. Please set MAIL_USERNAME and MAIL_PASSWORD in backend/.env with your Gmail App Password.";
  console.warn(`[EmailService] ${errorMsg}`);

  if (emailLogDoc && getIsConnected()) {
    try {
      await EmailLog.findByIdAndUpdate(emailLogDoc._id, {
        status: "failed",
        errorDetails: errorMsg,
        lastRetryAt: new Date(),
        $inc: { retryCount: 1 },
      });
    } catch (_) {}
  }

  return {
    success: false,
    failed: true,
    skipped: false,
    error: errorMsg,
    logId: emailLogDoc?._id,
  };
}

// ======================================================
// HTML EMAIL TEMPLATE BUILDERS
// ======================================================

function buildSelectionEmailHtml({ studentName, eventName, eventDate, eventTime, eventLocation }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #004D99; color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px 24px; }
    .event-card { background: #f0f7ff; border-left: 4px solid #0066CC; padding: 20px; border-radius: 8px; margin: 24px 0; }
    .event-field { margin-bottom: 10px; font-size: 15px; }
    .event-field:last-child { margin-bottom: 0; }
    .event-label { font-weight: 600; color: #004D99; min-width: 90px; display: inline-block; }
    .footer { background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Maatram Foundation</h1>
      <p>Volunteer Selection Confirmation</p>
    </div>
    <div class="content">
      <p>Hello <strong>${escapeHtml(studentName)}</strong>,</p>
      <p>Congratulations! You have been selected for volunteering.</p>
      
      <div class="event-card">
        <div class="event-field"><span class="event-label">Event:</span> <strong>${escapeHtml(eventName)}</strong></div>
        <div class="event-field"><span class="event-label">Date:</span> ${escapeHtml(eventDate)}</div>
        <div class="event-field"><span class="event-label">Time:</span> ${escapeHtml(eventTime)}</div>
        <div class="event-field"><span class="event-label">Location:</span> ${escapeHtml(eventLocation)}</div>
      </div>
      
      <p>Please arrive on time and follow the event instructions.</p>
      
      <p style="margin-top: 28px;">
        Regards,<br/>
        <strong>Maatram Foundation</strong>
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Maatram Foundation &bull; Empowering Youth through Impactful Volunteering
    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildCompletionEmailHtml({ studentName, eventName, verifiedHours, pointsEarned, certificateId, certificateUrl }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #004D99; color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px 24px; }
    .metrics-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .metric-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; }
    .metric-item:last-child { border-bottom: none; }
    .metric-label { font-weight: 600; color: #047857; }
    .metric-value { font-weight: 700; color: #065f46; }
    .cta-btn { display: inline-block; background: #0066CC; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Maatram Foundation</h1>
      <p>Thank You for Volunteering!</p>
    </div>
    <div class="content">
      <p>Hello <strong>${escapeHtml(studentName)}</strong>,</p>
      <p>Thank you for participating in the event!</p>
      
      <div class="metrics-box">
        <div class="metric-item">
          <span class="metric-label">Event:</span>
          <span class="metric-value">${escapeHtml(eventName)}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Verified Volunteer Hours:</span>
          <span class="metric-value">${verifiedHours} Hours</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Points Earned:</span>
          <span class="metric-value">+${pointsEarned} Points</span>
        </div>
        ${certificateId ? `
        <div class="metric-item">
          <span class="metric-label">Official Certificate:</span>
          <span class="metric-value" style="color:#047857;font-family:monospace;">${escapeHtml(certificateId)}</span>
        </div>` : ""}
      </div>
      
      <p>Your contribution makes a significant difference in empowering deserving youth.</p>
      <p>Your official volunteering certificate has been issued and credited to your student dashboard!</p>
      
      <div style="text-align: center; margin: 24px 0;">
        ${certificateId ? `
        <a href="${certificateUrl || (FRONTEND_URL + '/contributions')}" class="cta-btn" style="background:#16a34a;margin-right:10px;">📜 View Certificate</a>
        ` : ""}
        <a href="${FRONTEND_URL}/leaderboard" class="cta-btn">View Leaderboard</a>
      </div>
      
      <p style="margin-top: 28px;">
        Regards,<br/>
        <strong>Maatram Foundation</strong>
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Maatram Foundation &bull; Every Hour of Volunteering Inspires Change
    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildAccountApprovedEmailHtml({ studentName, email, applicationId }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #004D99; color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px 24px; }
    .account-card { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; border-radius: 8px; margin: 24px 0; }
    .card-field { margin-bottom: 8px; font-size: 14.5px; }
    .card-field:last-child { margin-bottom: 0; }
    .card-label { font-weight: 600; color: #15803d; min-width: 120px; display: inline-block; }
    .cta-btn { display: inline-block; background: #0066CC; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; }
    .footer { background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Maatram Foundation</h1>
      <p>Volunteer Account Approved & Activated</p>
    </div>
    <div class="content">
      <p>Hello <strong>${escapeHtml(studentName)}</strong>,</p>
      <p>Congratulations! Your Maatram Foundation volunteer account has been officially approved and activated by the administrator.</p>
      
      <div class="account-card">
        <div class="card-field"><span class="card-label">Volunteer Name:</span> <strong>${escapeHtml(studentName)}</strong></div>
        <div class="card-field"><span class="card-label">Application ID:</span> ${escapeHtml(applicationId || "MAA001")}</div>
        <div class="card-field"><span class="card-label">Account Email:</span> ${escapeHtml(email)}</div>
        <div class="card-field"><span class="card-label">Status:</span> <strong>Active &amp; Verified</strong></div>
      </div>
      
      <p>You now have full access to explore volunteering drives, register for upcoming events, record field hours, and earn leadership points.</p>
      
      <div style="text-align: center; margin: 28px 0;">
        <a href="${FRONTEND_URL}/login" class="cta-btn">Log In to Your Dashboard</a>
      </div>
      
      <p style="margin-top: 28px;">
        Regards,<br/>
        <strong>Maatram Foundation</strong>
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Maatram Foundation &bull; Empowering Youth through Impactful Volunteering
    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildEventRegistrationReceivedHtml({ studentName, eventName, eventDate, eventTime, eventLocation, referenceId }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #004D99; color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px 24px; }
    .event-card { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 24px 0; }
    .event-field { margin-bottom: 8px; font-size: 14.5px; }
    .event-field:last-child { margin-bottom: 0; }
    .event-label { font-weight: 600; color: #1d4ed8; min-width: 100px; display: inline-block; }
    .status-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12.5px; }
    .footer { background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Maatram Foundation</h1>
      <p>Event Registration Received</p>
    </div>
    <div class="content">
      <p>Hello <strong>${escapeHtml(studentName)}</strong>,</p>
      <p>Thank you for registering to volunteer! We have successfully received your application for the following initiative:</p>
      
      <div class="event-card">
        <div class="event-field"><span class="event-label">Reference ID:</span> <strong>${escapeHtml(referenceId || "MAT-PENDING")}</strong></div>
        <div class="event-field"><span class="event-label">Event:</span> <strong>${escapeHtml(eventName)}</strong></div>
        <div class="event-field"><span class="event-label">Date:</span> ${escapeHtml(eventDate || "Scheduled Date")}</div>
        <div class="event-field"><span class="event-label">Time:</span> ${escapeHtml(eventTime || "Scheduled Time")}</div>
        <div class="event-field"><span class="event-label">Location:</span> ${escapeHtml(eventLocation || "Maatram Venue")}</div>
        <div class="event-field" style="margin-top: 12px;"><span class="event-label">Status:</span> <span class="status-badge">Pending Coordinator Review</span></div>
      </div>
      
      <p>Once the administrator reviews and approves your participation, you will automatically receive an official selection confirmation email with arrival instructions.</p>
      
      <p style="margin-top: 28px;">
        Regards,<br/>
        <strong>Maatram Foundation</strong>
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Maatram Foundation &bull; Every Volunteer Counts
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ======================================================
// REUSABLE EMAIL SERVICES EXPORT
// ======================================================

const EmailService = {
  /**
   * Email 1: Volunteer Selection Confirmation
   * Trigger: When the administrator approves a student's event registration.
   * API: POST /api/events/:id/confirm-selection
   */
  async sendVolunteerSelectionEmail({ user, event }) {
    const studentName = user.fullName || user.name || "Volunteer";
    const eventName = event.title || "Volunteering Event";
    const eventDate = event.date || "Scheduled Date";
    const eventTime = event.time || "Scheduled Time";
    const eventLocation = event.location || "Maatram Venue";

    const subject = "Congratulations! You Have Been Selected – Maatram Foundation";

    const text = `Subject: Congratulations! You Have Been Selected – Maatram Foundation

Hello ${studentName},

Congratulations! You have been selected for volunteering.

Event: ${eventName}
Date: ${eventDate}
Time: ${eventTime}
Location: ${eventLocation}

Please arrive on time and follow the event instructions.

Regards,
Maatram Foundation`;

    const html = buildSelectionEmailHtml({
      studentName,
      eventName,
      eventDate,
      eventTime,
      eventLocation,
    });

    return dispatchEmail({
      to: user.email,
      recipientName: studentName,
      recipientRole: user.role || "student",
      subject,
      text,
      html,
      triggerType: "volunteer_selection",
      relatedEventId: event._id || event.id,
      relatedEventTitle: eventName,
      userId: user._id || user.id,
      applicationId: user.applicationId,
    });
  },

  /**
   * Email 2: Volunteer Completion Thank You
   * Trigger: When the administrator closes attendance and verifies completion.
   * API: PATCH /api/events/:id/attendance/close
   */
  async sendVolunteerCompletionEmail({ user, event, verifiedHours, pointsEarned, certificateId, certificateUrl }) {
    const studentName = user.fullName || user.name || "Volunteer";
    const eventName = event.title || "Volunteering Event";
    const hours = verifiedHours !== undefined ? Number(verifiedHours) : (Number(event.durationHours) || 4);
    const points = pointsEarned !== undefined ? Number(pointsEarned) : (hours * 10);

    const subject = "Thank You for Volunteering – Maatram Foundation";

    const text = `Subject: Thank You for Volunteering – Maatram Foundation

Hello ${studentName},

Thank you for participating in the event!

Event: ${eventName}
Verified Volunteer Hours: ${hours}
Points Earned: ${points}
${certificateId ? `Certificate ID: ${certificateId}\nView Certificate: ${certificateUrl || `${FRONTEND_URL}/contributions`}` : ""}

Your contribution makes a difference.

Check your updated profile and leaderboard.

Regards,
Maatram Foundation`;

    const html = buildCompletionEmailHtml({
      studentName,
      eventName,
      verifiedHours: hours,
      pointsEarned: points,
      certificateId,
      certificateUrl,
    });

    return dispatchEmail({
      to: user.email,
      recipientName: studentName,
      recipientRole: user.role || "student",
      subject,
      text,
      html,
      triggerType: "volunteer_completion",
      relatedEventId: event._id || event.id,
      relatedEventTitle: eventName,
      userId: user._id || user.id,
      applicationId: user.applicationId,
      metadata: {
        verifiedHours: hours,
        pointsEarned: points,
      },
    });
  },

  /**
   * Retry a single failed email by its EmailLog ID
   */
  async retryEmailById(logId) {
    if (!getIsConnected()) {
      return { success: false, error: "Database not connected." };
    }

    const log = await EmailLog.findById(logId);
    if (!log) {
      return { success: false, error: "Email log not found." };
    }

    return dispatchEmail({
      to: log.recipientEmail,
      recipientName: log.recipientName,
      recipientRole: log.recipientRole,
      subject: log.subject,
      text: log.textContent,
      html: log.htmlContent,
      triggerType: log.triggerType,
      relatedEventId: log.relatedEventId,
      relatedEventTitle: log.relatedEventTitle,
      userId: log.userId,
      applicationId: log.applicationId,
      metadata: log.metadata,
      forceRetry: true,
    });
  },

  /**
   * Retry all failed emails for a specific event
   */
  async retryFailedEventEmails(eventId) {
    if (!getIsConnected()) {
      return { success: false, error: "Database not connected.", sentCount: 0, failedCount: 0 };
    }

    const failedLogs = await EmailLog.find({
      relatedEventId: eventId,
      status: "failed",
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const log of failedLogs) {
      const res = await this.retryEmailById(log._id);
      if (res.success && !res.failed) {
        sentCount++;
      } else {
        failedCount++;
      }
    }

    return {
      success: true,
      total: failedLogs.length,
      sentCount,
      failedCount,
    };
  },

  /**
   * Get email statistics for an event
   */
  async getEventEmailStats(eventId) {
    if (!getIsConnected()) {
      return { sent: 0, failed: 0, pending: 0, sending: 0, total: 0 };
    }

    const logs = await EmailLog.find({ relatedEventId: eventId }).lean();
    const stats = {
      sent: 0,
      failed: 0,
      pending: 0,
      sending: 0,
      total: logs.length,
    };

    logs.forEach((l) => {
      const st = (l.status || "").toLowerCase();
      if (st === "sent" || st === "delivered") stats.sent++;
      else if (st === "failed") stats.failed++;
      else if (st === "pending") stats.pending++;
      else if (st === "sending") stats.sending++;
    });

    return stats;
  },

  // --------------------------------------------------
  // BACKWARD-COMPATIBLE WRAPPERS FOR EXISTING FEATURES
  // --------------------------------------------------

  async sendApplicationApproval({ user, application, event }) {
    return this.sendVolunteerSelectionEmail({ user, event });
  },

  async sendApplicationRejection({ user, event, reason }) {
    const studentName = user.fullName || "Volunteer";
    const eventName = event?.title || "Volunteering Event";
    const subject = `Update Regarding Your Application: ${eventName}`;
    const text = `Hello ${studentName},\n\nThank you for your interest in volunteering for "${eventName}". Unfortunately, we are unable to accept your application at this time due to limited capacity.\n\nReason: ${reason || "High volume of applicants"}\n\nWe encourage you to apply for upcoming events!\n\nRegards,\nMaatram Foundation`;

    return dispatchEmail({
      to: user.email,
      recipientName: studentName,
      subject,
      text,
      html: `<p>Hello <strong>${escapeHtml(studentName)}</strong>,</p><p>Thank you for your interest in volunteering for "${escapeHtml(eventName)}". Unfortunately, we are unable to accept your application at this time due to limited capacity.</p><p><strong>Reason:</strong> ${escapeHtml(reason || "High volume of applicants")}</p><p>We encourage you to apply for upcoming events!</p><p>Regards,<br/><strong>Maatram Foundation</strong></p>`,
      triggerType: "application_rejection",
      relatedEventId: event?._id || event?.id,
      relatedEventTitle: eventName,
      userId: user._id || user.id,
      applicationId: user.applicationId,
    });
  },

  async sendRegistrationConfirmation({ user }) {
    const studentName = user.fullName || "Volunteer";
    const subject = "Welcome to Maatram Impact Hub! Account Created";
    const text = `Hello ${studentName},\n\nWelcome to Maatram Impact Hub! Your volunteer account has been created successfully.\nApplication ID: ${user.applicationId || "Pending"}\n\nYou can now browse and apply for social impact events.\n\nRegards,\nMaatram Foundation`;

    return dispatchEmail({
      to: user.email,
      recipientName: studentName,
      subject,
      text,
      html: `<p>Hello <strong>${escapeHtml(studentName)}</strong>,</p><p>Welcome to Maatram Impact Hub! Your volunteer account has been created successfully.</p><p><strong>Application ID:</strong> ${escapeHtml(user.applicationId || "Pending")}</p><p>You can now browse and apply for social impact events.</p><p>Regards,<br/><strong>Maatram Foundation</strong></p>`,
      triggerType: "registration_confirmation",
      userId: user._id || user.id,
      applicationId: user.applicationId,
    });
  },

  /**
   * Account Approval Email
   * Trigger: When the administrator approves a student's platform registration.
   */
  async sendAccountApprovedEmail({ user, adminUser }) {
    const studentName = user.fullName || user.name || "Volunteer";
    const email = user.email;
    const applicationId = user.applicationId || "MAA001";
    const subject = "Congratulations! Your Account Has Been Approved – Maatram Foundation";

    const text = `Subject: Congratulations! Your Account Has Been Approved – Maatram Foundation

Hello ${studentName},

Congratulations! Your Maatram Foundation volunteer account has been approved and activated by the administrator.

Account Details:
Name: ${studentName}
Application ID: ${applicationId}
Email: ${email}
Status: Active & Verified

You now have full access to register for drives and earn leadership points.

Login: ${FRONTEND_URL}/login

Regards,
Maatram Foundation`;

    const html = buildAccountApprovedEmailHtml({
      studentName,
      email,
      applicationId,
    });

    return dispatchEmail({
      to: email,
      recipientName: studentName,
      recipientRole: user.role || "student",
      subject,
      text,
      html,
      triggerType: "account_approved",
      userId: user._id || user.id,
      applicationId,
      metadata: {
        approvedBy: adminUser?.fullName || "Admin",
      },
    });
  },

  /**
   * Event Registration Received Email
   * Trigger: Automatically when a student registers / applies for an event drive.
   */
  async sendEventRegistrationReceivedEmail({ user, event, application }) {
    const studentName = user.fullName || user.name || "Volunteer";
    const eventName = event.title || "Volunteering Event";
    const eventDate = event.date || "Scheduled Date";
    const eventTime = event.time || "Scheduled Time";
    const eventLocation = event.location || "Maatram Venue";
    const referenceId = application?.referenceId || "MAT-PENDING";

    const subject = `Registration Received: ${eventName} – Maatram Foundation`;

    const text = `Subject: Registration Received: ${eventName} – Maatram Foundation

Hello ${studentName},

Thank you for registering to volunteer! We have successfully received your application for:

Event: ${eventName}
Date: ${eventDate}
Time: ${eventTime}
Location: ${eventLocation}
Reference ID: ${referenceId}
Status: Pending Coordinator Review

Once your application is reviewed and approved, you will receive an official selection confirmation email with arrival details.

Regards,
Maatram Foundation`;

    const html = buildEventRegistrationReceivedHtml({
      studentName,
      eventName,
      eventDate,
      eventTime,
      eventLocation,
      referenceId,
    });

    return dispatchEmail({
      to: user.email,
      recipientName: studentName,
      recipientRole: user.role || "student",
      subject,
      text,
      html,
      triggerType: "event_registration_received",
      relatedEventId: event._id || event.id,
      relatedEventTitle: eventName,
      userId: user._id || user.id,
      applicationId: user.applicationId || application?.applicationId,
      metadata: {
        referenceId,
      },
    });
  },

  async sendThankYouEmail(volunteer, event) {
    return this.sendVolunteerCompletionEmail({
      user: volunteer,
      event,
      verifiedHours: event?.durationHours || 4,
      pointsEarned: (Number(event?.durationHours) || 4) * 10,
    });
  },

  async sendEventReminder({ user, event }) {
    const studentName = user.fullName || "Volunteer";
    const eventName = event?.title || "Volunteering Event";
    const subject = `Reminder: Upcoming Event "${eventName}" – Maatram Foundation`;
    const text = `Hello ${studentName},\n\nThis is a reminder for your upcoming volunteering event:\n\nEvent: ${eventName}\nDate: ${event?.date || "Soon"}\nTime: ${event?.time || "Scheduled"}\nLocation: ${event?.location || "Designated venue"}\n\nPlease arrive 15 minutes before the scheduled time.\n\nRegards,\nMaatram Foundation`;

    return dispatchEmail({
      to: user.email,
      recipientName: studentName,
      subject,
      text,
      html: `<p>Hello <strong>${escapeHtml(studentName)}</strong>,</p><p>This is a reminder for your upcoming volunteering event:</p><p><strong>Event:</strong> ${escapeHtml(eventName)}<br/><strong>Date:</strong> ${escapeHtml(event?.date || "")}<br/><strong>Time:</strong> ${escapeHtml(event?.time || "")}<br/><strong>Location:</strong> ${escapeHtml(event?.location || "")}</p><p>Please arrive 15 minutes before the scheduled time.</p><p>Regards,<br/><strong>Maatram Foundation</strong></p>`,
      triggerType: "event_reminder",
      relatedEventId: event?._id || event?.id,
      relatedEventTitle: eventName,
      userId: user._id || user.id,
      applicationId: user.applicationId,
    });
  },

  async logAndDispatch(payload) {
    return dispatchEmail(payload);
  },

  async retryEmail(payload) {
    if (typeof payload === "string") {
      return this.retryEmailById(payload);
    }
    if (payload?._id || payload?.id) {
      return this.retryEmailById(payload._id || payload.id);
    }
    return dispatchEmail({ ...payload, forceRetry: true });
  },
};

module.exports = EmailService;
