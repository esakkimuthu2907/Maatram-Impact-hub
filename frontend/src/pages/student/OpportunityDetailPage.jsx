// frontend/src/pages/student/OpportunityDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Bookmark,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Target,
  Sparkles,
  ArrowRight,
  Mail,
  Building,
  Award,
  Check,
  X,
  Clock3,
  UserCheck,
  UserX,
  FileText,
  AlertCircle,
  Eye,
  QrCode,
  Printer,
  ChevronRight,
  Phone,
  HelpCircle,
  Info,
  Layers,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { eventsAPI } from "../../api/eventsAPI";
import "./OpportunitiesPage.css";
import "./OpportunityDetailPage.css";

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    user,
    opportunities = [],
    applications = [],
    bookmarks = [],
    toggleBookmark,
    showToast,
    updateApplicationStatus,
    trackAttendanceAndAwardPoints,
    sendConnectRequest,
    openQRAttendance,
    openLinkedInShare,
    openCertificate,
    sendEventReminder,
  } = useApp();

  const isAdmin = user?.role === "admin";
  const [copiedLink, setCopiedLink] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [activeSectionTab, setActiveSectionTab] = useState("overview"); // overview, objectives, roles, slots, logistics, cohort

  // Load detailed event data & registered cohort
  const loadFullEvent = async () => {
    try {
      setLoadingDetails(true);
      const res = await eventsAPI.getById(id);
      if (res && res.data) {
        setEventDetails(res.data);
        setVolunteers(res.data.registeredVolunteers || []);
        setAttendanceRecords(res.data.attendanceRecords || []);
      }
    } catch (err) {
      console.warn("Event detail fetch error:", err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadFullEvent();
  }, [id]);

  const opp = eventDetails || opportunities.find((o) => o.id === id || o._id === id);

  if (!opp) {
    return (
      <div className="large-event-page-container loading-state">
        <button className="back-nav-btn" onClick={() => navigate("/opportunities")}>
          <ArrowLeft size={16} /> Back to Catalog
        </button>
        <div className="loading-card">
          <Sparkles size={32} color="#D97706" />
          <h2>Loading Event Details...</h2>
          <p>Retrieving structured drive logistics and volunteer cohort data.</p>
        </div>
      </div>
    );
  }

  const oppId = opp.id || opp._id;
  const bookmarked = (bookmarks || []).includes(oppId);

  // Check application status for current student
  const myApp = (volunteers || []).find(
    (app) =>
      (app.userId === user?.id ||
        app.userId === user?._id ||
        app.applicationId === user?.applicationId) &&
      app.status !== "Cancelled"
  ) || applications.find((a) => (a.opportunityId === oppId || a.opportunityId?._id === oppId) && a.status !== "Cancelled");

  const isApproved = myApp?.status === "Approved";
  const isCompleted = myApp?.status === "Completed";

  const needed = Number(opp.volunteersNeeded) || 10;
  const available = Number(opp.slotsAvailable) || 0;
  const filled = Math.max(0, needed - available);
  const fillRatio = Math.min(100, Math.round((filled / needed) * 100));

  const skillsList = Array.isArray(opp.skills)
    ? opp.skills
    : typeof opp.skills === "string"
    ? opp.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : ["Communication", "Youth Mentorship", "Field Coordination"];

  const objectivesList = Array.isArray(opp.objectives) && opp.objectives.length > 0
    ? opp.objectives
    : [
        "Provide career path clarity and higher education guidance to students.",
        "Foster confidence and interpersonal skills through peer interactions.",
        "Strengthen on-ground social responsibility and civic leadership.",
      ];

  const responsibilitiesList = Array.isArray(opp.responsibilities) && opp.responsibilities.length > 0
    ? opp.responsibilities
    : [
        "Coordinate with the Maatram team leader at the reporting venue.",
        "Facilitate interactive group activity sessions with school cohorts.",
        "Ensure orderly conduct, on-time registration, and accurate event reporting.",
      ];

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    showToast?.("Drive link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleAdminApproveApp = async (appId) => {
    await updateApplicationStatus(appId, "Approved", "Verified by admin coordinator.");
    loadFullEvent();
  };

  const handleAdminRejectApp = async (appId) => {
    const reason = window.prompt("Reason for declining this volunteer application:", "Slot capacity reached.");
    if (reason !== null) {
      await updateApplicationStatus(appId, "Rejected", reason);
      loadFullEvent();
    }
  };

  const handleRemindBlast = async () => {
    try {
      await sendEventReminder(oppId);
    } catch {}
  };

  return (
    <div className="large-event-page-container">
      {/* ─── BREADCRUMBS & TOP NAV ───────────────────────────────────────── */}
      <div className="event-breadcrumb-row">
        <Link to="/opportunities" className="breadcrumb-link">
          <ArrowLeft size={15} /> All Opportunities
        </Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-category">{opp.category}</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{opp.title}</span>
      </div>

      {/* ─── EVENT HEADER HERO BANNER ────────────────────────────────────── */}
      <div className="large-event-hero-banner">
        <div className="hero-content-col">
          <div className="hero-tags-cluster">
            <span className="hero-category-tag">{opp.category}</span>
            <span className={`hero-mode-pill ${(opp.mode || "offline").toLowerCase()}`}>
              {opp.mode || "Offline"} Drive
            </span>
            <span className={`hero-status-pill ${(opp.eventStatus || "upcoming").toLowerCase()}`}>
              {opp.eventStatus || "Upcoming"}
            </span>
          </div>

          <h1 className="hero-event-heading">{opp.title}</h1>
          <p className="hero-organizer-text">
            Organized by <strong>{opp.organizer || "Maatram Foundation"}</strong> &bull; Tamil Nadu
          </p>
        </div>

        {/* Hero Quick Action Buttons */}
        <div className="hero-actions-col">
          <button
            className={`hero-btn-bookmark ${bookmarked ? "active" : ""}`}
            onClick={() => toggleBookmark(oppId)}
            title={bookmarked ? "Saved in bookmarks" : "Save to bookmarks"}
          >
            <Bookmark size={16} fill={bookmarked ? "#FFD629" : "none"} />
            <span>{bookmarked ? "Bookmarked" : "Save"}</span>
          </button>

          <button className="hero-btn-share" onClick={handleCopyShare} title="Share drive link">
            {copiedLink ? <Check size={16} color="#16A34A" /> : <Share2 size={16} />}
            <span>{copiedLink ? "Link Copied" : "Share"}</span>
          </button>

          {/* QR Attendance trigger button */}
          <button
            className="hero-btn-qr"
            onClick={() => openQRAttendance(opp)}
            title={isAdmin ? "Open event QR Code & Live Attendance" : "Scan QR Attendance"}
          >
            <QrCode size={16} />
            <span>{isAdmin ? "Admin QR Roster" : "QR Check-in"}</span>
          </button>
        </div>
      </div>

      {/* ─── STRUCTURED KEY FACTS BAR (ORDERED MATRIX) ───────────────────── */}
      <div className="event-key-facts-matrix">
        <div className="fact-block">
          <div className="fact-icon blue">
            <Calendar size={18} />
          </div>
          <div className="fact-details">
            <span className="fact-title">Drive Date</span>
            <strong className="fact-value">{opp.date}</strong>
          </div>
        </div>

        <div className="fact-block">
          <div className="fact-icon yellow">
            <Clock size={18} />
          </div>
          <div className="fact-details">
            <span className="fact-title">Reporting Time</span>
            <strong className="fact-value">{opp.time || "9:30 AM – 1:30 PM"}</strong>
          </div>
        </div>

        <div className="fact-block">
          <div className="fact-icon green">
            <ShieldCheck size={18} />
          </div>
          <div className="fact-details">
            <span className="fact-title">Verified Hours</span>
            <strong className="fact-value">{opp.durationHours || 4} Hours Credited</strong>
          </div>
        </div>

        <div className="fact-block">
          <div className="fact-icon gold">
            <Award size={18} />
          </div>
          <div className="fact-details">
            <span className="fact-title">Impact Points</span>
            <strong className="fact-value">+{opp.points || 50} Points</strong>
          </div>
        </div>

        <div className="fact-block">
          <div className="fact-icon slate">
            <MapPin size={18} />
          </div>
          <div className="fact-details">
            <span className="fact-title">Location / Venue</span>
            <strong className="fact-value">{opp.location || "Chennai, Tamil Nadu"}</strong>
          </div>
        </div>
      </div>

      {/* ─── MAIN TWO-COLUMN WORKSPACE ───────────────────────────────────── */}
      <div className="event-workspace-grid">
        {/* LEFT COLUMN: STRUCTURED TABBED CONTENT */}
        <div className="event-main-details-col">
          {/* QR CHECK-IN CALLOUT BANNER FOR APPROVED VOLUNTEERS */}
          {isApproved && (
            <div className="qr-attendance-callout-card">
              <div className="qr-callout-icon">
                <QrCode size={26} color="#004D99" />
              </div>
              <div className="qr-callout-text">
                <h4>Your Registration is Approved! Ready for QR Check-in</h4>
                <p>
                  On the drive day, scan the event QR code displayed by the Maatram coordinator to record your attendance and unlock your verified hours certificate.
                </p>
              </div>
              <button
                className="qr-callout-btn"
                onClick={() => openQRAttendance(opp)}
              >
                Open QR Scanner &rarr;
              </button>
            </div>
          )}

          {/* STRUCTURED SECTIONS TABS */}
          <div className="event-section-tabs">
            {[
              { id: "overview", label: "Overview & Mission", icon: Info },
              { id: "objectives", label: "Objectives", icon: Target },
              { id: "roles", label: "Roles & Skills", icon: ShieldCheck },
              { id: "slots", label: "Schedule & Slots", icon: Clock },
              { id: "logistics", label: "Venue & Instructions", icon: MapPin },
              { id: "cohort", label: `Volunteers (${volunteers.length})`, icon: Users },
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`section-tab-item ${activeSectionTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveSectionTab(tab.id)}
                >
                  <TabIcon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW & MISSION */}
          {activeSectionTab === "overview" && (
            <div className="structured-tab-pane">
              <h3 className="pane-heading">About This Volunteering Drive</h3>
              <p className="pane-lead-text">
                {opp.description ||
                  "Empowering underprivileged students and youth across Tamil Nadu through education, career guidance, and active social leadership."}
              </p>

              <div className="pane-subcard">
                <h4>Why This Initiative Matters</h4>
                <p>
                  Students from rural and government schools often lack awareness of career pathways, competitive entrance guidance, and communication skills. Maatram Foundation volunteer teams bridge this critical gap through empathy, structured mentorship, and peer motivation.
                </p>
              </div>

              <div className="pane-subcard highlight">
                <h4>Verified Hours & Accreditation</h4>
                <p>
                  Every participant who attends and completes this initiative receives <strong>{opp.durationHours || 4} verified volunteering hours</strong>. Hours are audited by the foundation, logged in your official record, and eligible for academic community service credits.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: OBJECTIVES */}
          {activeSectionTab === "objectives" && (
            <div className="structured-tab-pane">
              <h3 className="pane-heading">Mission Objectives & Key Deliverables</h3>
              <div className="objectives-list-grid">
                {objectivesList.map((obj, index) => (
                  <div key={index} className="objective-item-card">
                    <div className="obj-num">{index + 1}</div>
                    <div className="obj-text">{obj}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ROLES & SKILLS */}
          {activeSectionTab === "roles" && (
            <div className="structured-tab-pane">
              <h3 className="pane-heading">Volunteer Responsibilities</h3>
              <div className="responsibilities-flow">
                {responsibilitiesList.map((resp, idx) => (
                  <div key={idx} className="resp-step-row">
                    <div className="resp-check-circle">
                      <Check size={14} color="#16A34A" />
                    </div>
                    <span>{resp}</span>
                  </div>
                ))}
              </div>

              <h4 style={{ margin: "24px 0 10px", fontSize: 15, color: "#0F172A" }}>
                Target Skills Cultivated
              </h4>
              <div className="skills-cloud-wrap">
                {skillsList.map((skill, i) => (
                  <span key={i} className="skill-chip-large">
                    <Sparkles size={13} color="#0066CC" /> {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SCHEDULE & SLOTS */}
          {activeSectionTab === "slots" && (
            <div className="structured-tab-pane">
              <h3 className="pane-heading">Timing Schedule & Available Slots</h3>
              <div className="slots-timeline-list">
                {(opp.slots && opp.slots.length > 0
                  ? opp.slots
                  : [
                      {
                        slotId: "slot_std",
                        title: "Standard Volunteering Slot",
                        time: opp.time || "9:30 AM – 1:30 PM",
                        capacity: needed,
                        filled: filled,
                      },
                    ]
                ).map((slot, index) => (
                  <div key={index} className="slot-item-card">
                    <div className="slot-time-col">
                      <Clock size={16} color="#0066CC" />
                      <strong>{slot.time}</strong>
                    </div>
                    <div className="slot-info-col">
                      <h4>{slot.title}</h4>
                      <p>Reporting: 15 minutes before scheduled start for orientation briefing</p>
                    </div>
                    <div className="slot-cap-col">
                      <span className="cap-badge">
                        {Math.max(0, (slot.capacity || needed) - (slot.filled || filled))} slots open
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: VENUE & LOGISTICS */}
          {activeSectionTab === "logistics" && (
            <div className="structured-tab-pane">
              <h3 className="pane-heading">Venue & On-Ground Logistics</h3>
              <div className="logistics-card-box">
                <MapPin size={22} color="#0066CC" />
                <div>
                  <strong>Official Venue Address:</strong>
                  <p>{opp.location || "Chennai, Tamil Nadu"}</p>
                </div>
              </div>

              <div className="checklist-box">
                <h4>What Volunteers Need to Bring / Observe:</h4>
                <ul>
                  <li>College ID Card & Maatram volunteer ID tag</li>
                  <li>Smartphone with portal logged-in for instant QR Attendance scan</li>
                  <li>Modest, comfortable attire suitable for educational campus outreach</li>
                  <li>Drinking water bottle and enthusiasm to inspire youth</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 6: VOLUNTEER COHORT */}
          {activeSectionTab === "cohort" && (
            <div className="structured-tab-pane">
              <div className="cohort-header-row">
                <h3 className="pane-heading">Registered Volunteer Cohort</h3>
                {isAdmin && (
                  <button className="cohort-action-btn" onClick={handleRemindBlast}>
                    <Mail size={14} /> Send Reminder Emails
                  </button>
                )}
              </div>

              {volunteers.length === 0 ? (
                <div className="cohort-empty-state">
                  <Users size={32} color="#94A3B8" />
                  <p>No volunteers have registered yet. Be the first to apply!</p>
                </div>
              ) : (
                <div className="cohort-table-wrap">
                  <table className="cohort-roster-table">
                    <thead>
                      <tr>
                        <th>Volunteer</th>
                        <th>College / Dept</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {volunteers.map((vol) => {
                        const isSelf =
                          vol.userId === user?.id ||
                          vol.userId?._id === user?.id ||
                          vol.applicationId === user?.applicationId;

                        return (
                          <tr key={vol._id || vol.id}>
                            <td>
                              <strong>
                                {vol.applicantDetails?.name || vol.name || "Student"}
                              </strong>
                              {isSelf && <span className="self-tag">(You)</span>}
                            </td>
                            <td>
                              {vol.applicantDetails?.college || "College"}
                              <span className="sub-dept">{vol.applicantDetails?.department}</span>
                            </td>
                            <td>
                              <span
                                className={`cohort-status-pill ${(
                                  vol.status || "pending"
                                ).toLowerCase()}`}
                              >
                                {vol.status}
                              </span>
                            </td>
                            <td>
                              {isAdmin ? (
                                <div className="admin-inline-actions">
                                  {vol.status === "Pending" && (
                                    <>
                                      <button
                                        className="admin-btn approve"
                                        onClick={() => handleAdminApproveApp(vol._id || vol.id)}
                                        title="Approve"
                                      >
                                        <Check size={12} />
                                      </button>
                                      <button
                                        className="admin-btn reject"
                                        onClick={() => handleAdminRejectApp(vol._id || vol.id)}
                                        title="Decline"
                                      >
                                        <X size={12} />
                                      </button>
                                    </>
                                  )}
                                  {vol.status === "Approved" && (
                                    <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 700 }}>
                                      Approved
                                    </span>
                                  )}
                                </div>
                              ) : isSelf ? (
                                <span className="self-label">My Registration</span>
                              ) : (
                                <button
                                  className="connect-mini-btn"
                                  onClick={() =>
                                    sendConnectRequest(
                                      vol.userId,
                                      `Hi! Saw you're in the cohort for ${opp.title}!`
                                    )
                                  }
                                >
                                  Connect
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STICKY PARTICIPATION PANEL */}
        <aside className="event-sticky-sidebar-col">
          <div className="sticky-participation-card">
            <div className="sidebar-header-row">
              <span className="sidebar-mode-pill">{opp.mode || "Offline"}</span>
              <span className="sidebar-deadline">
                Deadline: <strong>{opp.deadline || "Open"}</strong>
              </span>
            </div>

            {/* Slots meter */}
            <div className="sidebar-slots-meter">
              <div className="meter-label-row">
                <span>Slots Filled</span>
                <strong>{filled} / {needed}</strong>
              </div>
              <div className="meter-track">
                <div
                  className="meter-fill"
                  style={{
                    width: `${fillRatio}%`,
                    backgroundColor: available <= 2 ? "#EF4444" : "#10B981",
                  }}
                />
              </div>
              <span className="meter-subtext">
                {available > 0 ? `${available} slots remaining for this drive` : "All slots filled"}
              </span>
            </div>

            {/* Registration state or CTA */}
            {myApp ? (
              <div className="my-registration-status-card">
                <div className="status-top-row">
                  <CheckCircle2 size={18} color="#15803D" />
                  <strong>You Are Registered</strong>
                </div>
                <div className="status-meta-lines">
                  <div>Status: <strong className={`status-text ${myApp.status.toLowerCase()}`}>{myApp.status}</strong></div>
                  <div>Slot: <strong>{myApp.slotName || "Standard Slot"}</strong></div>
                  <div>Reference: <code>{myApp.referenceId || "MAT-REF"}</code></div>
                </div>

                {isApproved && (
                  <button
                    className="sidebar-qr-btn"
                    onClick={() => openQRAttendance(opp)}
                  >
                    <QrCode size={15} /> Check-in with QR Code
                  </button>
                )}

                {isCompleted && (
                  <div className="completed-share-cluster">
                    <button
                      className="sidebar-cert-btn"
                      onClick={() =>
                        openCertificate({
                          volunteerName: user?.fullName,
                          eventTitle: opp.title,
                          eventCategory: opp.category,
                          verifiedHours: opp.durationHours || 4,
                          pointsAwarded: opp.points || 50,
                          certificateId: `MF-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                        })
                      }
                    >
                      <FileText size={15} /> View Official Certificate
                    </button>
                    <button
                      className="sidebar-linkedin-btn"
                      onClick={() =>
                        openLinkedInShare({
                          volunteerName: user?.fullName,
                          eventTitle: opp.title,
                          hours: opp.durationHours || 4,
                          category: opp.category,
                        })
                      }
                    >
                      <Share2 size={15} /> Share to LinkedIn
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="registration-cta-box">
                <Link
                  to={`/opportunities/${oppId}/apply`}
                  className="dash-btn dash-btn-primary full-width-btn"
                >
                  Register Now <ArrowRight size={16} />
                </Link>
                <p className="cta-disclaimer">
                  No participation fees. Verified certificate awarded upon participation.
                </p>
              </div>
            )}

            {/* Certificate Promise Card */}
            <div className="certificate-promise-card">
              <ShieldCheck size={20} color="#15803D" />
              <div>
                <strong>Verified Certificate Guaranteed</strong>
                <p>
                  Completing this drive credits {opp.durationHours || 4} verified hours to your Maatram profile and issues a verifiable digital credential with 1-click LinkedIn sharing!
                </p>
              </div>
            </div>

            {/* Coordinator contact box */}
            <div className="coordinator-contact-box">
              <div className="coord-header">
                <Mail size={16} color="#0066CC" />
                <span>Need assistance with this drive?</span>
              </div>
              <p>Contact the event coordinator:</p>
              <a href={`mailto:${opp.contactEmail || "coordinator@maatramfoundation.com"}`}>
                {opp.contactEmail || "coordinator@maatramfoundation.com"}
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
