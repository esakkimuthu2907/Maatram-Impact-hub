
// backend/services/emailService.js
// Secure Email Dispatcher powered by Resend API
// Maatram Impact Hub

const { Resend } = require("resend");

// ======================================================
// CONFIGURATION
// ======================================================

const resendApiKey = process.env.RESEND_API_KEY?.trim();

const resend = resendApiKey
  ? new Resend(resendApiKey)
  : null;

const DEFAULT_FROM =
  process.env.EMAIL_FROM?.trim() ||
  "Maatram Impact Hub <onboarding@resend.dev>";

const FRONTEND_URL = (
  process.env.FRONTEND_URL || "http://localhost:5173"
).replace(/\/+$/, "");

const EMAIL_TEST_RECIPIENT =
  process.env.EMAIL_TEST_RECIPIENT?.trim() || null;


// ======================================================
// HELPER FUNCTIONS
// ======================================================

/**
 * Escape HTML content to prevent HTML injection.
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generate a unique certificate reference.
 */
function generateCertificateId() {
  const year = new Date().getFullYear();
  const randomNumber = Math.floor(1000 + Math.random() * 9000);

  return `MF-CERT-${year}-${randomNumber}`;
}

/**
 * Get a safe certificate ID.
 */
function getCertificateId(value) {
  return value || generateCertificateId();
}

/**
 * Validate email addresses.
 */
function isValidEmail(email) {
  if (!email || typeof email !== "string") {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email.trim());
}

/**
 * Safely get volunteer email.
 * Never send to an unrelated test recipient automatically.
 */
function getVolunteerEmail(...emails) {
  for (const email of emails) {
    if (
      typeof email === "string" &&
      isValidEmail(email.trim())
    ) {
      return email.trim().toLowerCase();
    }
  }

  return "";
}

/**
 * Build certificate verification URL.
 */
function buildCertificateUrl(certId) {
  return `${FRONTEND_URL}/certificates/verify/${encodeURIComponent(certId)}`;
}

/**
 * Standard fallback LinkedIn content.
 */
function buildLinkedInPost(eventTitle) {
  return `🌟 Proud to share that I have completed the volunteering initiative for "${eventTitle}" with Maatram Foundation! #MaatramFoundation #Volunteering #SocialImpact`;
}


// ======================================================
// UNIVERSAL RESEND EMAIL DISPATCHER
// ======================================================

/**
 * Sends emails directly to the registered volunteer email.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email content
 * @param {string} options.replyTo - Optional reply-to email
 */

async function dispatchResendEmail({
  to,
  subject,
  html,
  replyTo,
  volunteerName,
}) {
  try {
    // Check API configuration.
    if (!resendApiKey || !resend) {
      console.warn(
        "[EmailService] RESEND_API_KEY is missing. Email dispatch skipped."
      );

      return {
        success: false,
        mode: "disabled",
        error: "Email service is not configured.",
      };
    }

    // Validate recipient.
    const targetEmail = getVolunteerEmail(to);

    if (!targetEmail) {
      console.warn(
        "[EmailService] Invalid or missing recipient email."
      );

      return {
        success: false,
        error: "A valid recipient email is required.",
      };
    }

    // Validate subject and content.
    if (!subject || typeof subject !== "string") {
      return {
        success: false,
        error: "Email subject is required.",
      };
    }

    if (!html || typeof html !== "string") {
      return {
        success: false,
        error: "Email HTML content is required.",
      };
    }

    // Prepare payload.
    const payload = {
      from: DEFAULT_FROM,
      to: targetEmail,
      subject: subject.trim(),
      html,
    };

    // Optional reply-to.
    if (replyTo && isValidEmail(replyTo.trim())) {
      payload.replyTo = replyTo.trim();
    }

    console.log(
      "[EmailService] Sending email through Resend."
    );

    const result = await resend.emails.send(payload);

    // Handle Resend API errors.
    if (result?.error) {
      console.error(
        "[EmailService] Resend error:",
        result.error.message
      );

      return {
        success: false,
        error:
          result.error.message || "Resend email delivery failed.",
      };
    }

    // Confirm successful API acceptance.
    if (result?.data?.id) {
      console.log(
        `[EmailService] Email accepted by Resend. ID: ${result.data.id}`
      );

      return {
        success: true,
        id: result.data.id,
        to: targetEmail,
      };
    }

    return {
      success: false,
      error: "No confirmation received from Resend.",
    };

  } catch (err) {
    console.error(
      "[EmailService] Unexpected email dispatch error:",
      err.message
    );

    return {
      success: false,
      error: err.message || "Unexpected email dispatch error.",
    };
  }
}


// ======================================================
// COMPLETION AND CERTIFICATE EMAIL TEMPLATE
// ======================================================

function buildCompletionEmailHtml({
  volunteerName,
  eventTitle,
  hours,
  points,
  certId,
  certUrl,
  linkedInPost,
}) {
  const safeName = escapeHtml(volunteerName);
  const safeEventTitle = escapeHtml(eventTitle);
  const safeHours = escapeHtml(hours);
  const safePoints = escapeHtml(points);
  const safeCertId = escapeHtml(certId);
  const safeCertUrl = escapeHtml(certUrl);
  const safeLinkedInPost = escapeHtml(linkedInPost);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate & Impact Summary</title>
</head>

<body style="
  margin:0;
  padding:0;
  background-color:#F8FAFC;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  color:#1E293B;
  line-height:1.6;
">

  <div style="
    max-width:620px;
    margin:24px auto;
    background:#FFFFFF;
    border-radius:18px;
    border:1px solid #E2E8F0;
    overflow:hidden;
    box-shadow:0 10px 25px rgba(0,0,0,0.06);
  ">

    <!-- HEADER -->
    <div style="
      background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 100%);
      padding:32px 28px;
      text-align:center;
      color:#FFFFFF;
    ">

      <div style="font-size:26px;margin-bottom:8px;">
        🎓
      </div>

      <div style="
        font-size:11px;
        font-weight:800;
        letter-spacing:2px;
        color:#FFD629;
        text-transform:uppercase;
        margin-bottom:4px;
      ">
        MAATRAM FOUNDATION
      </div>

      <h1 style="
        margin:0 0 6px;
        font-size:24px;
        font-weight:900;
        color:#FFFFFF;
      ">
        Congratulations, ${safeName}!
      </h1>

      <p style="
        margin:0;
        font-size:14px;
        color:#DBEAFE;
      ">
        Official Completion Certificate &amp; Impact Points Awarded
      </p>

    </div>

    <!-- MAIN CONTENT -->
    <div style="padding:28px 30px;">

      <p style="font-size:15px;margin-top:0;color:#334155;">
        Dear <strong>${safeName}</strong>,
      </p>

      <p style="font-size:14.5px;color:#475569;line-height:1.6;">
        We are thrilled to confirm that you have successfully completed
        your volunteering service for
        <strong>"${safeEventTitle}"</strong>.
        Your dedication and empathy create lasting social transformation.
      </p>

      <!-- ACHIEVEMENT DETAILS -->
      <div style="
        background:#F8FAFC;
        border:1.5px solid #E2E8F0;
        border-radius:14px;
        padding:18px 20px;
        margin:24px 0;
      ">

        <table style="
          width:100%;
          border-collapse:collapse;
          font-size:13.5px;
        ">

          <tr>
            <td style="padding:8px 0;color:#64748B;width:45%;">
              Initiative:
            </td>
            <td style="padding:8px 0;font-weight:700;color:#0F172A;">
              ${safeEventTitle}
            </td>
          </tr>

          <tr>
            <td style="padding:8px 0;color:#64748B;">
              Leadership Points:
            </td>
            <td style="padding:8px 0;font-weight:800;color:#D97706;">
              ⭐ +${safePoints} pts credited
            </td>
          </tr>

          <tr>
            <td style="padding:8px 0;color:#64748B;">
              Verified Service Hours:
            </td>
            <td style="padding:8px 0;font-weight:800;color:#16A34A;">
              ⌛ ${safeHours} Hours
            </td>
          </tr>

          <tr>
            <td style="padding:8px 0;color:#64748B;">
              Certificate ID:
            </td>
            <td style="
              padding:8px 0;
              font-weight:800;
              font-family:monospace;
              color:#2563EB;
            ">
              ${safeCertId}
            </td>
          </tr>

        </table>
      </div>

      <!-- CERTIFICATE BUTTON -->
      <div style="text-align:center;margin:28px 0;">

        <a
          href="${safeCertUrl}"
          target="_blank"
          rel="noopener noreferrer"
          style="
            display:inline-block;
            background:#FFD629;
            color:#151515;
            font-weight:900;
            font-size:14px;
            padding:13px 28px;
            border-radius:10px;
            text-decoration:none;
          "
        >
          📜 View &amp; Download Official Certificate
        </a>

      </div>

      <!-- LINKEDIN POST -->
      <div style="
        background:#EFF6FF;
        border:1.5px solid #BFDBFE;
        border-radius:12px;
        padding:18px;
        margin:24px 0;
      ">

        <strong style="color:#1E40AF;font-size:13px;">
          🔗 Ready-to-Share LinkedIn Post:
        </strong>

        <div style="
          background:#FFFFFF;
          border:1px solid #BFDBFE;
          border-radius:8px;
          padding:12px;
          margin-top:10px;
          font-size:12.5px;
          color:#1E293B;
          line-height:1.5;
          white-space:pre-wrap;
        ">
          ${safeLinkedInPost}
        </div>

        <p style="
          margin:8px 0 0;
          font-size:11.5px;
          color:#64748B;
        ">
          Copy this text directly into LinkedIn to showcase
          your community leadership.
        </p>

      </div>

      <!-- SIGNATURE -->
      <div style="
        margin-top:30px;
        padding-top:20px;
        border-top:1px solid #F1F5F9;
        font-size:13px;
        color:#64748B;
      ">

        <p style="margin:0 0 4px;font-weight:700;color:#0F172A;">
          With warm regards,
        </p>

        <p style="margin:0;font-weight:800;color:#0F172A;">
          Sujith Kumar
        </p>

        <p style="margin:0;font-size:12px;color:#64748B;">
          Founder &amp; Managing Trustee, Maatram Foundation
        </p>

        <p style="margin:4px 0 0;font-size:11px;color:#94A3B8;">
          Together, we transform deserving lives through education.
        </p>

      </div>

    </div>
  </div>

</body>
</html>
`;
}


// ======================================================
// EMAIL SERVICE METHODS
// ======================================================

const EmailService = {

  // Optional test recipient configured through backend/.env.
  // This is never used as an automatic recipient fallback.
  USER_TEST_TARGET_EMAIL: EMAIL_TEST_RECIPIENT,


  // --------------------------------------------------
  // 1. COMPLETION AND THANK-YOU EMAIL
  // --------------------------------------------------

  async sendThankYouEmail(volunteer, event) {

    const vName =
      volunteer?.name ||
      volunteer?.fullName ||
      "Volunteer";

    const vEmail = getVolunteerEmail(volunteer?.email);

    const eTitle =
      event?.title ||
      "Volunteering Initiative";

    const hours =
      Number(event?.durationHours) || 4;

    const points =
      Number(event?.points) || 50;

    const certId = getCertificateId(volunteer?.certId);

    const certUrl = buildCertificateUrl(certId);

    const linkedInPost =
      volunteer?.linkedInPost ||
      buildLinkedInPost(eTitle);

    const html = buildCompletionEmailHtml({
      volunteerName: vName,
      eventTitle: eTitle,
      hours,
      points,
      certId,
      certUrl,
      linkedInPost,
    });

    return dispatchResendEmail({
      to: vEmail,
      subject: `🎓 Congratulations ${vName}! Certificate Issued for "${eTitle}"`,
      html,
      volunteerName: vName,
    });
  },


  // --------------------------------------------------
  // 2. BULK POINTS AND COMPLETION EMAIL
  // --------------------------------------------------

  async sendThankYouMessage({
    user,
    event,
    hours,
    points,
    overrideEmail,
    certificate,
    certId,
    linkedInPost,
  }) {

    const vName =
      user?.fullName ||
      user?.name ||
      "Student Volunteer";

    const vEmail = getVolunteerEmail(
      overrideEmail,
      user?.email
    );

    const eTitle =
      event?.title ||
      "Volunteering Initiative";

    const finalHours =
      Number(hours) ||
      Number(event?.durationHours) ||
      4;

    const finalPoints =
      Number(points) ||
      Number(event?.points) ||
      50;

    const finalCertId = getCertificateId(
      certId || certificate?.certificateId
    );

    const certUrl = buildCertificateUrl(finalCertId);

    const finalPost =
      linkedInPost ||
      certificate?.linkedInPost ||
      buildLinkedInPost(eTitle);

    const html = buildCompletionEmailHtml({
      volunteerName: vName,
      eventTitle: eTitle,
      hours: finalHours,
      points: finalPoints,
      certId: finalCertId,
      certUrl,
      linkedInPost: finalPost,
    });

    return dispatchResendEmail({
      to: vEmail,
      subject: `🎓 Congratulations ${vName}! Certificate Issued for "${eTitle}"`,
      html,
      volunteerName: vName,
    });
  },


  // --------------------------------------------------
  // 3. CERTIFICATE AVAILABILITY EMAIL
  // --------------------------------------------------

  async sendCertificateAvailability({
    user,
    certificate,
    event,
  }) {

    return this.sendThankYouMessage({
      user,
      event,
      certificate,
      certId: certificate?.certificateId,
      hours: certificate?.verifiedHours || 4,
      points: certificate?.pointsAwarded || 50,
      linkedInPost: certificate?.linkedInPost,
    });
  },


  // --------------------------------------------------
  // 4. REGISTRATION CONFIRMATION EMAIL
  // --------------------------------------------------

  async sendRegistrationConfirmation({ user }) {

    const vName =
      user?.fullName ||
      user?.name ||
      "Volunteer";

    const vEmail = getVolunteerEmail(user?.email);

    const applicationId = escapeHtml(
      user?.applicationId || "Pending"
    );

    const html = `
      <div style="
        font-family:Arial,sans-serif;
        max-width:600px;
        margin:0 auto;
        padding:24px;
        border:1px solid #E2E8F0;
        border-radius:12px;
      ">

        <h2 style="color:#0F172A;">
          Welcome to Maatram Foundation, ${escapeHtml(vName)}!
        </h2>

        <p>
          Your registration profile has been successfully submitted.
          Once verified by our coordinators, you can join impact drives
          across Tamil Nadu.
        </p>

        <p>
          <strong>Application Ref:</strong> ${applicationId}
        </p>

        <p>
          With warm regards,<br>
          <strong>Maatram Impact Hub Team</strong>
        </p>

      </div>
    `;

    return dispatchResendEmail({
      to: vEmail,
      subject: `Welcome to Maatram Foundation Volunteer Network, ${vName}!`,
      html,
      volunteerName: vName,
    });
  },


  // --------------------------------------------------
  // 5. APPLICATION APPROVAL EMAIL
  // --------------------------------------------------

  async sendApplicationApproval({
    user,
    application,
    event,
  }) {

    const vName =
      user?.fullName ||
      user?.name ||
      "Volunteer";

    const vEmail = getVolunteerEmail(user?.email);

    const eTitle =
      event?.title ||
      application?.opportunityTitle ||
      "Volunteering Drive";

    const eventDate =
      event?.date ||
      application?.eventDate ||
      "Upcoming";

    const html = `
      <div style="
        font-family:Arial,sans-serif;
        max-width:600px;
        margin:0 auto;
        padding:24px;
        border:1px solid #E2E8F0;
        border-radius:12px;
      ">

        <h2 style="color:#16A34A;">
          Application Approved: ${escapeHtml(eTitle)}
        </h2>

        <p>
          Dear ${escapeHtml(vName)}, your application for
          <strong>${escapeHtml(eTitle)}</strong>
          has been officially approved!
        </p>

        <p>
          <strong>Scheduled Date:</strong>
          ${escapeHtml(eventDate)}
        </p>

        <p>
          Please arrive 15 minutes before the shift
          with your student ID.
        </p>

        <p>
          Best wishes,<br>
          <strong>Maatram Impact Hub Team</strong>
        </p>

      </div>
    `;

    return dispatchResendEmail({
      to: vEmail,
      subject: `✅ Approved: You are confirmed for "${eTitle}"`,
      html,
      volunteerName: vName,
    });
  },


  // --------------------------------------------------
  // 6. APPLICATION REJECTION EMAIL
  // --------------------------------------------------

  async sendApplicationRejection({
    user,
    event,
    reason,
  }) {

    const vName =
      user?.fullName ||
      user?.name ||
      "Volunteer";

    const vEmail = getVolunteerEmail(user?.email);

    const eTitle =
      event?.title ||
      "Volunteering Drive";

    const rejectionReason =
      reason ||
      "Capacity reached";

    const html = `
      <div style="
        font-family:Arial,sans-serif;
        max-width:600px;
        margin:0 auto;
        padding:24px;
      ">

        <p>Dear ${escapeHtml(vName)},</p>

        <p>
          Thank you for your interest in
          <strong>${escapeHtml(eTitle)}</strong>.
        </p>

        <p>
          Unfortunately, your application could not be approved
          at this time.
        </p>

        <p>
          <strong>Reason:</strong>
          ${escapeHtml(rejectionReason)}
        </p>

        <p>
          Please check other upcoming volunteering drives
          on the Maatram Impact Hub portal.
        </p>

        <p>
          Best regards,<br>
          Maatram Impact Hub Team
        </p>

      </div>
    `;

    return dispatchResendEmail({
      to: vEmail,
      subject: `Update regarding your application for "${eTitle}"`,
      html,
      volunteerName: vName,
    });
  },


  // --------------------------------------------------
  // 7. EVENT REMINDER EMAIL
  // --------------------------------------------------

  async sendEventReminder({ user, event }) {

    const vName =
      user?.fullName ||
      user?.name ||
      "Volunteer";

    const vEmail = getVolunteerEmail(user?.email);

    const eTitle =
      event?.title ||
      "Volunteering Initiative";

    const eventDate =
      event?.date ||
      "the scheduled date";

    const html = `
      <div style="
        font-family:Arial,sans-serif;
        max-width:600px;
        margin:0 auto;
        padding:24px;
      ">

        <h2 style="color:#1E40AF;">
          Upcoming Event Reminder
        </h2>

        <p>
          Dear ${escapeHtml(vName)},
        </p>

        <p>
          This is a friendly reminder about your upcoming
          volunteering initiative:
        </p>

        <p>
          <strong>${escapeHtml(eTitle)}</strong>
        </p>

        <p>
          <strong>Event Date:</strong>
          ${escapeHtml(eventDate)}
        </p>

        <p>
          Please be prepared and arrive on time.
        </p>

        <p>
          Best wishes,<br>
          Maatram Impact Hub Team
        </p>

      </div>
    `;

    return dispatchResendEmail({
      to: vEmail,
      subject: `Reminder: Upcoming Drive "${eTitle}"`,
      html,
      volunteerName: vName,
    });
  },


  // --------------------------------------------------
  // 8. 24-HOUR REMINDER
  // --------------------------------------------------

  async send24HourReminder(params) {
    return this.sendEventReminder(params);
  },


  // --------------------------------------------------
  // 9. 2-HOUR REMINDER
  // --------------------------------------------------

  async send2HourReminder(params) {
    return this.sendEventReminder(params);
  },


  // --------------------------------------------------
  // 10. EVENT UPDATE EMAIL
  // --------------------------------------------------

  async sendEventUpdateEmail({
    user,
    event,
    updateMessage,
    customSubject,
  }) {

    const vName =
      user?.fullName ||
      user?.name ||
      "Volunteer";

    const vEmail = getVolunteerEmail(user?.email);

    const eTitle =
      event?.title ||
      "Volunteering Initiative";

    const html = `
      <div style="
        font-family:Arial,sans-serif;
        max-width:600px;
        margin:0 auto;
        padding:24px;
      ">

        <h2 style="color:#1E40AF;">
          Important Event Update
        </h2>

        <p>
          Dear ${escapeHtml(vName)},
        </p>

        <p>
          <strong>${escapeHtml(eTitle)}</strong>
        </p>

        <p>
          ${escapeHtml(updateMessage || "There is an update regarding your event.")}
        </p>

        <p>
          Best regards,<br>
          Maatram Impact Hub Team
        </p>

      </div>
    `;

    return dispatchResendEmail({
      to: vEmail,
      subject:
        customSubject ||
        `Important Update: ${eTitle}`,
      html,
      volunteerName: vName,
    });
  },


  // --------------------------------------------------
  // 11. ALUMNI ASSIGNMENT APPROVAL
  // --------------------------------------------------

  async sendAlumniAssignmentApproval({
    alumni,
    event,
    role,
    notes,
  }) {

    const vName =
      alumni?.fullName ||
      alumni?.name ||
      "Alumni Leader";

    const vEmail = getVolunteerEmail(alumni?.email);

    const eTitle =
      event?.title ||
      "Volunteering Initiative";

    const html = `
      <div style="
        font-family:Arial,sans-serif;
        max-width:600px;
        margin:0 auto;
        padding:24px;
      ">

        <h2 style="color:#16A34A;">
          Alumni Leadership Assignment
        </h2>

        <p>
          Dear ${escapeHtml(vName)},
        </p>

        <p>
          You have been assigned as
          <strong>${escapeHtml(role || "Alumni Leader")}</strong>
          for <strong>${escapeHtml(eTitle)}</strong>.
        </p>

        ${notes
        ? `<p><strong>Additional Notes:</strong><br>${escapeHtml(notes)}</p>`
        : ""
      }

        <p>
          Thank you for supporting Maatram Foundation.
        </p>

        <p>
          Best regards,<br>
          Maatram Impact Hub Team
        </p>

      </div>
    `;

    return dispatchResendEmail({
      to: vEmail,
      subject: `Alumni Leadership Assignment: ${eTitle}`,
      html,
      volunteerName: vName,
    });
  },


  // --------------------------------------------------
  // 12. SERVICE HOURS VERIFICATION EMAIL
  // --------------------------------------------------

  async sendHoursVerification({
    user,
    submission,
    verifiedHours,
    status,
    remarks,
  }) {

    const vName =
      user?.fullName ||
      user?.name ||
      "Volunteer";

    const vEmail = getVolunteerEmail(user?.email);

    const eventTitle =
      submission?.eventTitle ||
      "Volunteering Initiative";

    const isApproved =
      String(status || "verified").toLowerCase() === "verified" ||
      String(status || "").toLowerCase() === "approved";

    const html = `
      <div style="
        font-family:Arial,sans-serif;
        max-width:600px;
        margin:0 auto;
        padding:24px;
      ">

        <h2 style="color:${isApproved ? "#16A34A" : "#D97706"};">
          Service Hours Verification Update
        </h2>

        <p>
          Dear ${escapeHtml(vName)},
        </p>

        <p>
          Your service hours submission for
          <strong>${escapeHtml(eventTitle)}</strong>
          has been updated.
        </p>

        <p>
          <strong>Status:</strong>
          ${escapeHtml(status || "Verified")}
        </p>

        <p>
          <strong>Verified Hours:</strong>
          ${escapeHtml(verifiedHours ?? 0)} Hours
        </p>

        ${remarks
        ? `<p><strong>Remarks:</strong><br>${escapeHtml(remarks)}</p>`
        : ""
      }

        <p>
          Thank you for contributing to society.
        </p>

        <p>
          Best regards,<br>
          Maatram Impact Hub Team
        </p>

      </div>
    `;

    return dispatchResendEmail({
      to: vEmail,
      subject: `Hours Verification Update: ${verifiedHours ?? 0} Hours`,
      html,
      volunteerName: vName,
    });
  },


  // --------------------------------------------------
  // 13. GENERIC EMAIL DISPATCH
  // --------------------------------------------------

  async logAndDispatch(payload) {
    return dispatchResendEmail(payload);
  },


  // --------------------------------------------------
  // 14. RETRY EMAIL
  // --------------------------------------------------

  async retryEmail(payload) {
    if (!payload) {
      return {
        success: false,
        error: "Email payload is required.",
      };
    }

    return dispatchResendEmail(payload);
  },

};


// ======================================================
// EXPORT
// ======================================================

module.exports = EmailService;
