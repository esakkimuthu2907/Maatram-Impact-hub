// backend/services/emailService.js
// Enterprise Email Dispatcher powered by Resend API

const { Resend } = require("resend");

const resendApiKey = process.env.RESEND_API_KEY;
const resend = new Resend(process.env.RESEND_API_KEY);

const DEFAULT_FROM = process.env.EMAIL_FROM || "Maatram Impact Hub <onboarding@resend.dev>";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Universal Resend Dispatcher: Sends directly to the volunteer's registered email
 */
async function dispatchResendEmail({ to, subject, html, replyTo, volunteerName }) {
  if (!resendApiKey) {
    console.warn("[EmailService] No RESEND_API_KEY found. Skipping dispatch.");
    return { success: false, mode: "disabled" };
  }

  const targetEmail = (to || "").trim().toLowerCase();
  if (!targetEmail) {
    console.warn("[EmailService] No recipient email specified.");
    return { success: false, error: "Recipient email is required" };
  }

  const fromAddress = DEFAULT_FROM.replace("EMAIL_FROM=", "").trim();

  try {
    const payload = {
      from: fromAddress,
      to: targetEmail,
      subject,
      html,
    };

    console.log(`[EmailService] Attempting dispatch via Resend directly to user email: ${targetEmail}`);
    const result = await resend.emails.send(payload);

    if (result?.error) {
      console.warn(`[EmailService] Resend dispatch notice for ${targetEmail}:`, result.error.message);
      return { success: false, error: result.error.message };
    }

    if (result?.data?.id) {
      console.log(`[EmailService] ✅ Email delivered directly to user email ${targetEmail} (ID: ${result.data.id})`);
      return { success: true, id: result.data.id, to: targetEmail };
    }

    return { success: false, error: "No response data from Resend" };
  } catch (err) {
    console.warn(`[EmailService] Unexpected dispatch error to ${targetEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Generate Responsive HTML Completion & Certificate Email
 */
function buildCompletionEmailHtml({ volunteerName, eventTitle, hours, points, certId, certUrl, linkedInPost }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate & Impact Summary</title>
</head>
<body style="margin:0; padding:0; background-color:#F8FAFC; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1E293B; line-height:1.6;">
  <div style="max-width:620px; margin:24px auto; background:#FFFFFF; border-radius:18px; border:1px solid #E2E8F0; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.06);">
    
    <!-- Header Banner -->
    <div style="background:linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%); padding:32px 28px; text-align:center; color:#FFFFFF;">
      <div style="font-size:26px; margin-bottom:8px;">🎓</div>
      <div style="font-size:11px; font-weight:800; letter-spacing:2px; color:#FFD629; text-transform:uppercase; margin-bottom:4px;">
        MAATRAM FOUNDATION
      </div>
      <h1 style="margin:0 0 6px; font-size:24px; font-weight:900; color:#FFFFFF; letter-spacing:-0.5px;">
        Congratulations, ${volunteerName}!
      </h1>
      <p style="margin:0; font-size:14px; color:#DBEAFE; opacity:0.95;">
        Official Completion Certificate &amp; Impact Points Awarded
      </p>
    </div>

    <!-- Main Body -->
    <div style="padding:28px 30px;">
      <p style="font-size:15px; margin-top:0; color:#334155;">
        Dear <strong>${volunteerName}</strong>,
      </p>
      <p style="font-size:14.5px; color:#475569; line-height:1.6;">
        We are thrilled to confirm that you have successfully completed your volunteering service for <strong>"${eventTitle}"</strong>.
        Your dedication and empathy on the ground create lasting social transformation for deserving students across Tamil Nadu!
      </p>

      <!-- Key Achievement Metrics Grid -->
      <div style="background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:14px; padding:18px 20px; margin:24px 0;">
        <table style="width:100%; border-collapse:collapse; font-size:13.5px;">
          <tr>
            <td style="padding:8px 0; color:#64748B; width:45%;">Initiative:</td>
            <td style="padding:8px 0; font-weight:700; color:#0F172A;">${eventTitle}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; color:#64748B;">Leadership Points:</td>
            <td style="padding:8px 0; font-weight:800; color:#D97706;">⭐ +${points || 50} pts credited</td>
          </tr>
          <tr>
            <td style="padding:8px 0; color:#64748B;">Verified Service Hours:</td>
            <td style="padding:8px 0; font-weight:800; color:#16A34A;">⌛ ${hours || 4} Hours</td>
          </tr>
          <tr>
            <td style="padding:8px 0; color:#64748B;">Certificate ID:</td>
            <td style="padding:8px 0; font-weight:800; font-family:monospace; color:#2563EB;">${certId}</td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <div style="text-align:center; margin:28px 0;">
        <a href="${certUrl}" target="_blank" style="display:inline-block; background:#FFD629; color:#151515; font-weight:900; font-size:14px; padding:13px 28px; border-radius:10px; text-decoration:none; box-shadow:0 4px 12px rgba(255,214,41,0.4);">
          📜 View &amp; Download Official Certificate
        </a>
      </div>

      <!-- Ready to share LinkedIn content -->
      <div style="background:#EFF6FF; border:1.5px solid #BFDBFE; border-radius:12px; padding:18px; margin:24px 0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <strong style="color:#1E40AF; font-size:13px;">🔗 Ready-to-Share LinkedIn Post:</strong>
        </div>
        <div style="background:#FFFFFF; border:1px solid #BFDBFE; border-radius:8px; padding:12px; font-size:12.5px; color:#1E293B; line-height:1.5; white-space:pre-wrap;">${linkedInPost}</div>
        <p style="margin:8px 0 0; font-size:11.5px; color:#64748B;">
          Copy this text directly into LinkedIn to showcase your community leadership to recruiters and peers!
        </p>
      </div>

      <!-- Signoff -->
      <div style="margin-top:30px; padding-top:20px; border-top:1px solid #F1F5F9; font-size:13px; color:#64748B;">
        <p style="margin:0 0 4px; font-weight:700; color:#0F172A;">With warm regards,</p>
        <p style="margin:0; font-weight:800; color:#0F172A;">Sujith Kumar</p>
        <p style="margin:0; font-size:12px; color:#64748B;">Founder &amp; Managing Trustee, Maatram Foundation</p>
        <p style="margin:4px 0 0; font-size:11px; color:#94A3B8;">Together, we transform deserving lives through education.</p>
      </div>

    </div>
  </div>
</body>
</html>
`;
}

const EmailService = {
  USER_TEST_TARGET_EMAIL: "chithiraiselvan0311@gmail.com",

  // Direct Method matching user's custom function
  async sendThankYouEmail(volunteer, event) {
    const vName = volunteer?.name || volunteer?.fullName || "Volunteer";
    const vEmail = volunteer?.email || "chithiraiselvan0311@gmail.com";
    const eTitle = event?.title || "Volunteering Initiative";
    const hours = Number(event?.durationHours) || 4;
    const points = Number(event?.points) || 50;
    const certId = volunteer?.certId || `MF-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const certUrl = `${FRONTEND_URL}/certificates/verify/${certId}`;
    const linkedInPost = volunteer?.linkedInPost || `🌟 Proud to share that I have completed the volunteering initiative for "${eTitle}" with Maatram Foundation! #MaatramFoundation #Volunteering #SocialImpact`;

    const html = buildCompletionEmailHtml({
      volunteerName: vName,
      eventTitle: eTitle,
      hours,
      points,
      certId,
      certUrl,
      linkedInPost,
    });

    return await dispatchResendEmail({
      to: vEmail,
      subject: `🎓 Congratulations ${vName}! Certificate Issued for "${eTitle}"`,
      html,
      volunteerName: vName,
    });
  },

  // Called during Bulk Points & Completion
  async sendThankYouMessage({ user, event, hours, points, overrideEmail, certificate, certId, linkedInPost }) {
    const vName = user?.fullName || user?.name || "Student Volunteer";
    const vEmail = overrideEmail || user?.email || "chithiraiselvan0311@gmail.com";
    const eTitle = event?.title || "Volunteering Initiative";
    const finalHours = Number(hours) || Number(event?.durationHours) || 4;
    const finalPoints = Number(points) || Number(event?.points) || 50;
    const finalCertId = certId || certificate?.certificateId || `MF-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const certUrl = `${FRONTEND_URL}/certificates/verify/${finalCertId}`;
    const finalPost = linkedInPost || `🌟 Proud to share that I have completed the volunteering initiative for "${eTitle}" with Maatram Foundation! #MaatramFoundation #Volunteering #SocialImpact`;

    const html = buildCompletionEmailHtml({
      volunteerName: vName,
      eventTitle: eTitle,
      hours: finalHours,
      points: finalPoints,
      certId: finalCertId,
      certUrl,
      linkedInPost: finalPost,
    });

    return await dispatchResendEmail({
      to: vEmail,
      subject: `🎓 Congratulations ${vName}! Certificate Issued for "${eTitle}"`,
      html,
      volunteerName: vName,
    });
  },

  async sendCertificateAvailability({ user, certificate, event }) {
    return await this.sendThankYouMessage({
      user,
      event,
      certificate,
      certId: certificate?.certificateId,
      hours: certificate?.verifiedHours || 4,
      points: certificate?.pointsAwarded || 50,
      linkedInPost: certificate?.linkedInPost,
    });
  },

  async sendRegistrationConfirmation({ user }) {
    const vName = user?.fullName || "Volunteer";
    const vEmail = user?.email || "chithiraiselvan0311@gmail.com";
    const html = `
      <div style="font-family:sans-serif; max-width:600px; margin:0 auto; padding:20px; border:1px solid #E2E8F0; border-radius:12px;">
        <h2 style="color:#0F172A;">Welcome to Maatram Foundation, ${vName}!</h2>
        <p>Your registration profile has been successfully submitted. Once verified by our coordinators, you can join impact drives across Tamil Nadu.</p>
        <p><strong>Application Ref:</strong> ${user?.applicationId || "Pending"}</p>
        <p>With warm regards,<br><strong>Maatram Impact Hub Team</strong></p>
      </div>
    `;
    return await dispatchResendEmail({
      to: vEmail,
      subject: `Welcome to Maatram Foundation Volunteer Network, ${vName}!`,
      html,
      volunteerName: vName,
    });
  },

  async sendApplicationApproval({ user, application, event }) {
    const vName = user?.fullName || "Volunteer";
    const vEmail = user?.email || "chithiraiselvan0311@gmail.com";
    const eTitle = event?.title || application?.opportunityTitle || "Volunteering Drive";
    const html = `
      <div style="font-family:sans-serif; max-width:600px; margin:0 auto; padding:20px; border:1px solid #E2E8F0; border-radius:12px;">
        <h2 style="color:#16A34A;">Application Approved: ${eTitle}</h2>
        <p>Dear ${vName}, your application for <strong>${eTitle}</strong> has been officially approved!</p>
        <p><strong>Scheduled Date:</strong> ${event?.date || application?.eventDate || "Upcoming"}</p>
        <p>Please arrive 15 minutes before the shift with your student ID.</p>
        <p>Best wishes,<br><strong>Maatram Impact Hub Team</strong></p>
      </div>
    `;
    return await dispatchResendEmail({
      to: vEmail,
      subject: `✅ Approved: You are confirmed for "${eTitle}"`,
      html,
      volunteerName: vName,
    });
  },

  async sendApplicationRejection({ user, event, reason }) {
    const vName = user?.fullName || "Volunteer";
    const vEmail = user?.email || "chithiraiselvan0311@gmail.com";
    return await dispatchResendEmail({
      to: vEmail,
      subject: `Update regarding your application for "${event?.title || 'Volunteering Drive'}"`,
      html: `<p>Dear ${vName}, thank you for your interest in "${event?.title}". Currently, all available volunteer spots are filled (${reason || 'Capacity reached'}). Please check other upcoming drives on the portal!</p>`,
      volunteerName: vName,
    });
  },

  async sendEventReminder({ user, event }) {
    const vName = user?.fullName || "Volunteer";
    const vEmail = user?.email || "chithiraiselvan0311@gmail.com";
    return await dispatchResendEmail({
      to: vEmail,
      subject: `Reminder: Upcoming Drive "${event?.title || 'Volunteering'}"`,
      html: `<p>Dear ${vName}, this is a friendly reminder for tomorrow's volunteering initiative "${event?.title}".</p>`,
      volunteerName: vName,
    });
  },

  async send24HourReminder(params) {
    return await this.sendEventReminder(params);
  },

  async send2HourReminder(params) {
    return await this.sendEventReminder(params);
  },

  async sendEventUpdateEmail({ user, event, updateMessage, customSubject }) {
    const vName = user?.fullName || "Volunteer";
    const vEmail = user?.email || "chithiraiselvan0311@gmail.com";
    return await dispatchResendEmail({
      to: vEmail,
      subject: customSubject || `Important Update: ${event?.title}`,
      html: `<p>Dear ${vName},</p><p>${updateMessage}</p>`,
      volunteerName: vName,
    });
  },

  async sendAlumniAssignmentApproval({ alumni, event, role, notes }) {
    const vName = alumni?.fullName || "Alumni Leader";
    const vEmail = alumni?.email || "chithiraiselvan0311@gmail.com";
    return await dispatchResendEmail({
      to: vEmail,
      subject: `Alumni Leadership Assignment: ${event?.title}`,
      html: `<p>Dear ${vName}, you have been assigned as <strong>${role}</strong> for ${event?.title}. ${notes ? `<p>${notes}</p>` : ""}`,
      volunteerName: vName,
    });
  },

  async sendHoursVerification({ user, submission, verifiedHours, status, remarks }) {
    const vName = user?.fullName || "Volunteer";
    const vEmail = user?.email || "chithiraiselvan0311@gmail.com";
    return await dispatchResendEmail({
      to: vEmail,
      subject: `Hours Verification Update: ${verifiedHours} Hours Confirmed`,
      html: `<p>Dear ${vName}, your ${verifiedHours} service hours for "${submission?.eventTitle}" have been verified.</p>`,
      volunteerName: vName,
    });
  },

  async logAndDispatch(payload) {
    return await dispatchResendEmail(payload);
  },

  async retryEmail() {
    return { success: true };
  },
};

module.exports = EmailService;
