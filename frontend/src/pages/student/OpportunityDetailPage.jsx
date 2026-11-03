// frontend/src/pages/OpportunityDetailPage.jsx
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
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { eventsAPI } from "../../api/eventsAPI";
import { adminAPI } from "../../api/adminAPI";
import "./OpportunitiesPage.css";
import "../admin/AdminEventsPage.css";

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    user,
    opportunities = [],
    bookmarks = [],
    toggleBookmark,
    showToast,
    updateApplicationStatus,
    trackAttendanceAndAwardPoints,
    sendConnectRequest,
  } = useApp();

  const isAdmin = user?.role === "admin";
  const [copiedLink, setCopiedLink] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [loadingVolunteers, setLoadingVolunteers] = useState(true);

  // Attendance state for each volunteer: { [applicationId]: "Present" | "Absent" }
  const [attendanceMap, setAttendanceMap] = useState({});
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [activeVolunteerTab, setActiveVolunteerTab] = useState("All"); // All | Approved | Pending | Completed | Rejected

  // Fetch event + registered volunteers from API
  const loadEventAndVolunteers = async () => {
    try {
      setLoadingVolunteers(true);
      const res = await eventsAPI.getById(id);
      if (res && res.data) {
        setEventDetails(res.data);
        const vols = res.data.registeredVolunteers || [];
        setVolunteers(vols);

        // Initialize attendance map
        const initialMap = {};
        vols.forEach((v) => {
          initialMap[v._id || v.id] = v.attendanceStatus || (v.status === "Completed" ? "Present" : "Unmarked");
        });
        setAttendanceMap(initialMap);
      }
    } catch (err) {
      console.warn("Event detail fetch error:", err.message);
    } finally {
      setLoadingVolunteers(false);
    }
  };

  useEffect(() => {
    loadEventAndVolunteers();
  }, [id]);

  const opp = eventDetails || opportunities.find((o) => o.id === id || o._id === id) || opportunities[0];

  if (!opp) {
    return (
      <div className="opportunity-detail-container" style={{ padding: "40px 24px", textAlign: "center" }}>
        <button className="back-nav-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back to Opportunities
        </button>
        <div style={{ background: "#FFFFFF", padding: "48px 24px", borderRadius: 20, marginTop: 20, border: "1px dashed #CBD5E1" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "16px 0 8px" }}>Loading Opportunity...</h2>
          <p style={{ color: "#64748B", fontSize: 14, marginBottom: 20 }}>Please wait while we fetch the volunteering drive details.</p>
          <Link to="/opportunities" className="dash-btn dash-btn-primary">
            Browse All Opportunities
          </Link>
        </div>
      </div>
    );
  }

  const oppId = opp.id || opp._id;
  const bookmarked = (bookmarks || []).includes(oppId);

  // Check if current user already applied
  const myApp = (volunteers || []).find(
    (app) => (app.userId === user?.id || app.userId === user?._id || app.applicationId === user?.applicationId) &&
      app.status !== "Cancelled"
  );

  const skillsList = Array.isArray(opp.skills)
    ? opp.skills
    : typeof opp.skills === "string"
    ? opp.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : ["Communication", "Teamwork", "Empathy"];

  const objectivesList = Array.isArray(opp.objectives)
    ? opp.objectives
    : typeof opp.objectives === "string"
    ? [opp.objectives]
    : [];

  const responsibilitiesList = Array.isArray(opp.responsibilities)
    ? opp.responsibilities
    : typeof opp.responsibilities === "string"
    ? [opp.responsibilities]
    : [];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    showToast?.("Opportunity link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const needed = Number(opp.volunteersNeeded) || 10;
  const available = Number(opp.slotsAvailable) || 0;
  const filled = Math.max(0, needed - available);
  const fillPercent = Math.min(100, Math.round((filled / needed) * 100));

  // Admin: Approve / Reject Application
  const handleApprove = async (appId) => {
    await updateApplicationStatus(appId, "Approved", "Verified and approved by admin coordinator.");
    loadEventAndVolunteers();
  };

  const handleReject = async (appId) => {
    const reason = window.prompt("Reason for rejection (student will be notified):", "Slot capacity reached.");
    if (reason === null) return;
    await updateApplicationStatus(appId, "Rejected", reason || "Slot capacity reached.");
    loadEventAndVolunteers();
  };

  // Admin: Submit Attendance & Award Points
  const handleAttendanceSubmit = async () => {
    const approvedVolunteers = volunteers.filter((v) => v.status === "Approved" || v.status === "Completed");
    if (approvedVolunteers.length === 0) {
      showToast("No approved volunteers to track attendance for.", "error");
      return;
    }

    const attendanceRecords = approvedVolunteers.map((v) => ({
      applicationId: v._id || v.id,
      userId: v.userId,
      status: attendanceMap[v._id || v.id] === "Present" ? "Present" : "Absent",
    }));

    const confirmPoints = window.confirm(
      `Award ${opp.points || 50} Volunteering Points to all volunteers marked as 'Present'? Points will be credited permanently to their profiles.`
    );
    if (!confirmPoints) return;

    try {
      setSubmittingAttendance(true);
      await trackAttendanceAndAwardPoints(oppId, attendanceRecords);
      loadEventAndVolunteers();
    } catch (err) {
      showToast(err.message || "Attendance submission failed", "error");
    } finally {
      setSubmittingAttendance(false);
    }
  };

  // Filter volunteers by tab
  const filteredVolunteers = volunteers.filter((v) => {
    if (activeVolunteerTab === "All") return true;
    return v.status === activeVolunteerTab;
  });

  return (
    <div className="opportunity-detail-container">
      {/* Top navigation */}
      <div className="detail-top-nav">
        <button className="back-nav-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back to Opportunities
        </button>
        <div className="top-action-btns">
          <button
            className={`detail-icon-btn ${bookmarked ? "active" : ""}`}
            onClick={() => toggleBookmark(oppId)}
            aria-label="Save opportunity"
          >
            <Bookmark size={18} fill={bookmarked ? "#FFD629" : "none"} />
            <span>{bookmarked ? "Saved" : "Save"}</span>
          </button>
          <button
            className="detail-icon-btn"
            onClick={handleShare}
            aria-label="Share opportunity"
          >
            <Share2 size={18} />
            <span>{copiedLink ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </div>

      {/* Hero Media Banner */}
      <div className="detail-hero-media">
        <img src={opp.image} alt={opp.title} className="detail-hero-img" />
        <div className="detail-hero-badges">
          <span className={`opp-mode-badge ${(opp.mode || "offline").toLowerCase()}`}>
            {opp.mode || "Offline"}
          </span>
          <span className="opp-category-tag">{opp.category}</span>
          {opp.eventStatus && (
            <span
              style={{
                background: opp.eventStatus === "Completed" ? "#DCFCE7" : "#EFF6FF",
                color: opp.eventStatus === "Completed" ? "#16A34A" : "#1D4ED8",
                fontWeight: 700,
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 20,
              }}
            >
              {opp.eventStatus}
            </span>
          )}
        </div>
      </div>

      {/* Main Detail Content & Side Sticky Action Card */}
      <div className="detail-main-layout">
        <div className="detail-content-col">
          <div className="detail-header-info">
            <span className="detail-organizer">
              <Building size={15} /> Organized by {opp.organizer || "Maatram Foundation"}
            </span>
            <h1 className="detail-title">{opp.title}</h1>

            <div className="detail-metrics-bar">
              <div className="metric-box">
                <Calendar size={18} color="#FFD629" />
                <div>
                  <small>Event Date</small>
                  <strong>{opp.date}</strong>
                </div>
              </div>
              <div className="metric-box">
                <Clock size={18} color="#20A464" />
                <div>
                  <small>Timing / Duration</small>
                  <strong>{opp.time || `${opp.durationHours || 4} Hours`}</strong>
                </div>
              </div>
              <div className="metric-box">
                <Award size={18} color="#EAB308" />
                <div>
                  <small>Volunteering Points</small>
                  <strong>+{opp.points || 50} Points</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Section: About Drive */}
          <div className="detail-section">
            <h2>About This Volunteering Drive</h2>
            <p className="detail-body-text">{opp.description}</p>
          </div>

          {/* Section: Available Slots */}
          {opp.slots && opp.slots.length > 0 && (
            <div className="detail-section">
              <h2>Available Volunteering Slots</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                {opp.slots.map((s) => (
                  <div
                    key={s.slotId}
                    style={{
                      background: "#F8FAFC",
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <strong style={{ fontSize: 14, color: "#0F172A", display: "block" }}>
                      {s.title}
                    </strong>
                    <span style={{ fontSize: 12, color: "#64748B", display: "block", marginTop: 4 }}>
                      🕒 {s.time} • Capacity: {s.capacity} volunteers ({s.capacity - (s.filled || 0)} available)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Key Objectives */}
          {objectivesList.length > 0 && (
            <div className="detail-section">
              <h2>Key Objectives</h2>
              <ul className="bullet-feature-list">
                {objectivesList.map((obj, i) => (
                  <li key={i}>
                    <Target size={16} color="#FFD629" className="li-icon" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section: Volunteer Responsibilities */}
          {responsibilitiesList.length > 0 && (
            <div className="detail-section">
              <h2>Volunteer Responsibilities</h2>
              <ul className="bullet-feature-list">
                {responsibilitiesList.map((resp, i) => (
                  <li key={i}>
                    <CheckCircle2 size={16} color="#3B82F6" className="li-icon" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section: Required Skills */}
          <div className="detail-section">
            <h2>Required Skills</h2>
            <div className="skills-badge-wrap">
              {skillsList.map((skill, i) => (
                <span key={i} className="skill-pill-large">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* ============================================================== */}
          {/* REGISTERED VOLUNTEERS & APPLICATIONS SECTION                   */}
          {/* (Exact Requirement: Registered volunteers appear in Event Details)*/}
          {/* ============================================================== */}
          <div
            className="detail-section"
            style={{
              background: "#FFFFFF",
              borderRadius: 20,
              padding: "28px 24px",
              border: "1.5px solid #E2E8F0",
              boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
              marginTop: 32,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Users size={20} color="#0066CC" />
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#0F172A" }}>
                    Registered Volunteers for this Drive
                  </h2>
                </div>
                <p style={{ color: "#64748B", fontSize: 13.5, margin: "4px 0 0" }}>
                  {volunteers.length} student application(s) received for {opp.title}.
                </p>
              </div>

              {/* Status Tabs */}
              <div className="format-pills-row" style={{ margin: 0 }}>
                {["All", "Approved", "Pending", "Completed", "Rejected"].map((st) => (
                  <button
                    key={st}
                    className={`format-pill-btn ${activeVolunteerTab === st ? "active" : ""}`}
                    onClick={() => setActiveVolunteerTab(st)}
                    style={{ fontSize: 12, padding: "5px 12px" }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Attendance & Points Allocation Controls (Admin Only) */}
            {isAdmin && volunteers.some((v) => v.status === "Approved") && (
              <div
                style={{
                  background: "#FEF08A",
                  padding: "16px 20px",
                  borderRadius: 14,
                  border: "1px solid #FDE047",
                  marginBottom: 20,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <strong style={{ fontSize: 14, color: "#854D0E", display: "flex", alignItems: "center", gap: 6 }}>
                    <Award size={16} /> Admin Attendance & Points Allocation
                  </strong>
                  <span style={{ fontSize: 12.5, color: "#713F12", display: "block", marginTop: 2 }}>
                    Mark attendance for approved volunteers below. Completed volunteers will receive{" "}
                    <strong>+{opp.points || 50} points</strong> and their status will update to Completed.
                  </span>
                </div>

                <button
                  type="button"
                  className="dash-btn dash-btn-primary"
                  onClick={handleAttendanceSubmit}
                  disabled={submittingAttendance}
                  style={{ background: "#854D0E", borderColor: "#713F12" }}
                >
                  <Award size={15} />{" "}
                  {submittingAttendance ? "Processing..." : `Award Points (+${opp.points || 50} pts)`}
                </button>
              </div>
            )}

            {/* Volunteers Table / Cards */}
            {filteredVolunteers.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>Volunteer Student</th>
                      <th>Application ID</th>
                      <th>College & Dept</th>
                      <th>Selected Slot</th>
                      <th>Application Status</th>
                      {isAdmin && <th>Attendance</th>}
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVolunteers.map((vol) => (
                      <tr key={vol._id || vol.id}>
                        {/* Student Name */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <img
                              src={
                                vol.applicantDetails?.avatar ||
                                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                              }
                              alt={vol.applicantDetails?.name || "Student"}
                              style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }}
                            />
                            <div>
                              <strong style={{ fontSize: 13.5, color: "#0F172A", display: "block" }}>
                                {vol.applicantDetails?.name || "Volunteer Student"}
                              </strong>
                              <span style={{ fontSize: 11.5, color: "#64748B" }}>
                                {vol.applicantDetails?.email || ""}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* ID */}
                        <td>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0066CC" }}>
                            {vol.applicationId || vol.referenceId}
                          </span>
                        </td>

                        {/* College */}
                        <td>
                          <span style={{ fontSize: 12.5, color: "#334155" }}>
                            {vol.applicantDetails?.college || "College of Engineering"}
                          </span>
                          <span style={{ fontSize: 11, color: "#64748B", display: "block" }}>
                            {vol.applicantDetails?.department || ""}
                          </span>
                        </td>

                        {/* Selected Slot */}
                        <td>
                          <span
                            style={{
                              background: "#F1F5F9",
                              color: "#334155",
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {vol.slotName || "General Slot"}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            style={{
                              padding: "3px 9px",
                              borderRadius: 12,
                              fontSize: 11.5,
                              fontWeight: 700,
                              background:
                                vol.status === "Approved"
                                  ? "#DBEAFE"
                                  : vol.status === "Completed"
                                  ? "#DCFCE7"
                                  : vol.status === "Rejected"
                                  ? "#FEE2E2"
                                  : "#FEF08A",
                              color:
                                vol.status === "Approved"
                                  ? "#1D4ED8"
                                  : vol.status === "Completed"
                                  ? "#15803D"
                                  : vol.status === "Rejected"
                                  ? "#B91C1C"
                                  : "#854D0E",
                            }}
                          >
                            {vol.status}
                          </span>
                        </td>

                        {/* Attendance Toggle for Admin */}
                        {isAdmin && (
                          <td>
                            {vol.status === "Approved" || vol.status === "Completed" ? (
                              <select
                                value={attendanceMap[vol._id || vol.id] || "Unmarked"}
                                onChange={(e) =>
                                  setAttendanceMap({
                                    ...attendanceMap,
                                    [vol._id || vol.id]: e.target.value,
                                  })
                                }
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  border: "1px solid #CBD5E1",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background:
                                    attendanceMap[vol._id || vol.id] === "Present" ? "#DCFCE7" : "#FFFFFF",
                                }}
                              >
                                <option value="Unmarked">Unmarked</option>
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                              </select>
                            ) : (
                              <span style={{ fontSize: 11.5, color: "#94A3B8" }}>N/A</span>
                            )}
                          </td>
                        )}

                        {/* Actions */}
                        <td style={{ textAlign: "right" }}>
                          {isAdmin ? (
                            <div style={{ display: "inline-flex", gap: 6 }}>
                              {vol.status !== "Approved" && vol.status !== "Completed" && (
                                <button
                                  className="action-btn-approve"
                                  onClick={() => handleApprove(vol._id || vol.id)}
                                  title="Approve Application"
                                  style={{ padding: "4px 8px", fontSize: 12 }}
                                >
                                  <Check size={13} /> Approve
                                </button>
                              )}
                              {vol.status !== "Rejected" && vol.status !== "Completed" && (
                                <button
                                  className="action-btn-reject"
                                  onClick={() => handleReject(vol._id || vol.id)}
                                  title="Reject Application"
                                  style={{ padding: "4px 8px", fontSize: 12 }}
                                >
                                  <X size={13} /> Reject
                                </button>
                              )}
                              {vol.status === "Completed" && (
                                <span style={{ color: "#16A34A", fontSize: 12, fontWeight: 700 }}>
                                  ✓ +{vol.pointsAwarded || opp.points || 50} pts
                                </span>
                              )}
                            </div>
                          ) : (
                            /* Peer Student view */
                            vol.userId !== user?.id && vol.userId !== user?._id && (
                              <button
                                className="dash-btn dash-btn-outline"
                                onClick={() => sendConnectRequest(vol.userId, `Saw you registered for ${opp.title}!`)}
                                style={{ fontSize: 12, padding: "4px 10px" }}
                              >
                                Connect
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: "30px 20px", textAlign: "center", color: "#64748B" }}>
                <Users size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
                <p>No registered volunteers in this status yet.</p>
              </div>
            )}
          </div>

          {/* Contact organizer */}
          <div className="organizer-contact-card" style={{ marginTop: 24 }}>
            <Mail size={18} color="#717784" />
            <div>
              <strong>Questions about this drive?</strong>
              <span>
                Contact the event coordinator at{" "}
                <a href={`mailto:${opp.contactEmail || "coordinator@maatramfoundation.com"}`}>
                  {opp.contactEmail || "coordinator@maatramfoundation.com"}
                </a>
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT STICKY ACTION CARD */}
        <aside className="detail-sidebar-col">
          <div className="apply-sticky-card">
            <div className="sticky-card-header">
              <span className="sticky-mode-tag">{opp.mode || "Offline"} Event</span>
              <span className="sticky-deadline">
                Deadline: <strong>{opp.deadline || "Open"}</strong>
              </span>
            </div>

            <div className="sticky-location-box">
              <MapPin size={18} color="#FFD629" className="loc-icon" />
              <div>
                <strong>Venue / Meeting Information:</strong>
                <p>{opp.location || "Tamil Nadu"}</p>
              </div>
            </div>

            <div className="sticky-slots-progress">
              <div className="slots-text-row">
                <span>Slots Filled</span>
                <strong>
                  {filled} / {needed}
                </strong>
              </div>
              <div className="slots-track">
                <div className="slots-fill" style={{ width: `${fillPercent}%` }} />
              </div>
            </div>

            {/* Check already applied state */}
            {myApp ? (
              <div className="already-applied-box">
                <div className="applied-heading">
                  <CheckCircle2 size={18} color="#20A464" />
                  <strong>You Have Registered</strong>
                </div>
                <p style={{ margin: "4px 0" }}>
                  Status: <strong style={{ color: myApp.status === "Approved" ? "#0066CC" : "#F59E0B" }}>{myApp.status}</strong>
                </p>
                <p style={{ margin: "4px 0", fontSize: 12.5, color: "#64748B" }}>
                  Slot: <strong>{myApp.slotName || "Confirmed"}</strong>
                </p>
                <Link to="/applications" className="view-app-link">
                  View My Applications <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="sticky-apply-actions">
                <Link
                  to={`/opportunities/${oppId}/apply`}
                  className="dash-btn dash-btn-primary sticky-apply-btn"
                >
                  Register Now <ArrowRight size={16} />
                </Link>
                <p className="sticky-disclaimer">
                  No participation fees. Free verified certificate awarded upon completion.
                </p>
              </div>
            )}

            {/* Points & Hours Badges */}
            <div
              style={{
                marginTop: 16,
                padding: "12px",
                background: "#FEF08A",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Award size={20} color="#854D0E" />
              <div>
                <strong style={{ fontSize: 13, color: "#713F12" }}>+{opp.points || 50} Volunteering Points</strong>
                <span style={{ fontSize: 11, color: "#854D0E", display: "block" }}>
                  Awarded to approved volunteers upon event completion
                </span>
              </div>
            </div>

            <div className="credited-hours-badge" style={{ marginTop: 10 }}>
              <ShieldCheck size={16} color="#20A464" />
              <span>Verified {opp.durationHours || 4} Volunteering Hours Credited</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
