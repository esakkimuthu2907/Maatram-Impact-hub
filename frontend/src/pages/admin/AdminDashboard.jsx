// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  Clock3,
  FileCheck,
  TrendingUp,
  Send,
  PlusCircle,
  GraduationCap,
  Layers,
  MapPin,
  Edit3,
  Trash2,
  Eye,
  Star,
  FileText,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { adminAPI } from "../../api/adminAPI";
import DonutChart from "../../components/charts/DonutChart";
import "../student/StudentDashboard.css";
import "./AdminEventsPage.css";

export default function AdminDashboard() {
  const {
    user,
    events = [],
    opportunities = [],
    applications = [],
    deleteOpportunity,
    showToast,
  } = useApp();
  const [statsData, setStatsData] = useState(null);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Broadcast Notification Modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    targetType: "ALL", // "ALL" | "EVENT_APPROVED" | "SELECTED"
    targetEventId: "",
    title: "",
    message: "",
    link: "/dashboard",
  });
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);

  // Fetch KPI & Analytics Data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.allSettled([
        adminAPI.getStats(),
        adminAPI.getUsers(),
      ]);
      if (statsRes.status === "fulfilled" && statsRes.value?.data) {
        setStatsData(statsRes.value.data);
      }
      if (usersRes.status === "fulfilled" && usersRes.value?.data) {
        setUserList(usersRes.value.data);
      }
    } catch (err) {
      console.warn("Could not fetch admin KPIs:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const handleSync = () => {
      loadDashboardData();
    };
    window.addEventListener("storage", handleSync);
    window.addEventListener("maatram_event_completed", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("maatram_event_completed", handleSync);
    };
  }, []);

  const allOpps = opportunities.length > 0 ? opportunities : events;
  const displayEvents = allOpps.slice(0, 3);

  // Dynamic real-time metrics computed directly from database
  const studentUsers = userList.filter((u) => u.role === "student");
  const alumniUsers = userList.filter((u) => u.role === "alumni");
  const activeStudentUsers = studentUsers.filter((u) => u.status === "active");

  const totalRegisteredStudents = statsData?.kpis?.totalRegisteredStudents ?? studentUsers.length;
  const totalActiveVolunteers = statsData?.kpis?.totalActiveVolunteers ?? activeStudentUsers.length;
  const totalRegisteredAlumni = statsData?.kpis?.totalRegisteredAlumni ?? alumniUsers.length;
  const totalApplications =
    statsData?.kpis?.pendingApplications !== undefined
      ? (statsData.kpis.pendingApplications || 0) + (statsData.kpis.approvedVolunteers || 0)
      : applications.length;
  const openEventsCount = allOpps.filter(
    (e) => e.status !== "Completed" && e.eventStatus !== "Completed" && !e.pointsDistributed
  ).length;

  const kpis = {
    totalRegisteredStudents,
    totalActiveVolunteers,
    totalRegisteredAlumni,
    totalEvents: openEventsCount,
    totalInterests: totalApplications,
    pendingApplications:
      statsData?.kpis?.pendingApplications ?? applications.filter((a) => a.status === "Pending").length,
    approvedVolunteers:
      statsData?.kpis?.approvedVolunteers ?? applications.filter((a) => a.status === "Approved").length,
    completedEvents: allOpps.filter(
      (e) => e.status === "Completed" || e.eventStatus === "Completed" || Boolean(e.pointsDistributed)
    ).length,
    totalVolunteerContributions:
      statsData?.kpis?.totalVolunteerContributions ?? statsData?.kpis?.totalVerifiedHours ?? 0,
    totalPointsDistributed: statsData?.kpis?.totalPointsDistributed ?? 0,
  };

  const handleDeleteEvent = async (eventId, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      try {
        if (deleteOpportunity) {
          await deleteOpportunity(eventId);
        }
        showToast(`Event "${title}" deleted successfully!`);
      } catch (err) {
        showToast(err.message || "Failed to delete event", "error");
      }
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      showToast("Title and message are required.", "error");
      return;
    }
    try {
      setSubmittingBroadcast(true);
      const res = await adminAPI.broadcastNotification(broadcastForm);
      showToast(res.message || "Notification sent successfully!");
      setShowBroadcastModal(false);
      setBroadcastForm({
        targetType: "ALL",
        targetEventId: "",
        title: "",
        message: "",
        link: "/dashboard",
      });
      loadDashboardData();
    } catch (err) {
      showToast(err.message || "Broadcast failed", "error");
    } finally {
      setSubmittingBroadcast(false);
    }
  };

  const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 };
  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1" };

  return (
    // White page background (was grey)
    <div className="dashboard-container" style={{ background: "#FFFFFF", minHeight: "100vh" }}>
      {/* 1. TOP BANNER */}
      <div className="adm-banner-hero">
        <div className="adm-banner-left">
          <h1 className="adm-banner-title">
            Welcome, <span>{user?.fullName || "Admin"}</span>!
          </h1>
          <p className="adm-banner-sub">
            You have {openEventsCount} open events, {kpis.totalActiveVolunteers} active volunteers, and{" "}
            {kpis.totalRegisteredAlumni} registered alumni leads.
          </p>
        </div>

        <div className="adm-banner-stats-row">
          <div className="adm-banner-stat-item">
            <Calendar size={20} className="stat-icon" />
            <strong>{kpis.totalEvents}</strong>
            <span>Events</span>
          </div>
          <div className="adm-banner-stat-item">
            <Users size={20} className="stat-icon" />
            <strong>{kpis.totalInterests}</strong>
            <span>Interests</span>
          </div>
          <div className="adm-banner-stat-item">
            <Star size={20} className="stat-icon" />
            <strong>{kpis.totalActiveVolunteers}</strong>
            <span>Active</span>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY CARDS ROW */}
      <div className="adm-summary-cards-row">
        <div className="adm-summary-card">
          <div className="adm-summary-circle-icon">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="adm-summary-value">{kpis.totalRegisteredStudents}</div>
            <div className="adm-summary-label">Total Students</div>
          </div>
        </div>

        <div className="adm-summary-card">
          <div className="adm-summary-circle-icon">
            <Users size={24} />
          </div>
          <div>
            <div className="adm-summary-value">{kpis.totalActiveVolunteers}</div>
            <div className="adm-summary-label">Active Volunteers</div>
          </div>
        </div>

        <div className="adm-summary-card">
          <div className="adm-summary-circle-icon" style={{ background: "#F3E8FF", color: "#7E22CE" }}>
            <Award size={24} />
          </div>
          <div>
            <div className="adm-summary-value">{kpis.totalRegisteredAlumni}</div>
            <div className="adm-summary-label">Registered Alumni</div>
          </div>
        </div>

        <div className="adm-summary-card">
          <div className="adm-summary-circle-icon">
            <FileText size={24} />
          </div>
          <div>
            <div className="adm-summary-value">{kpis.totalInterests}</div>
            <div className="adm-summary-label">Event Interests</div>
          </div>
        </div>

        <Link to="/admin/events" className="adm-post-event-btn">
          <PlusCircle size={18} /> Post Event
        </Link>
      </div>

      {/* 3. UPCOMING EVENTS */}
      <div className="adm-upcoming-box">
        <div className="adm-upcoming-header">
          <h2 className="adm-upcoming-title">
            <Calendar size={20} color="#CA8A04" /> Upcoming Events
          </h2>
          <Link to="/admin/events" className="adm-view-all-link">
            View All →
          </Link>
        </div>

        <div className="adm-events-cards-grid">
          {displayEvents.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", padding: "40px 20px", textAlign: "center", color: "#64748B" }}>
              <Calendar size={36} color="#CA8A04" style={{ marginBottom: 10 }} />
              <h4 style={{ margin: "0 0 6px", color: "#1E293B", fontSize: 16, fontWeight: 700 }}>
                No upcoming events posted
              </h4>
              <p style={{ margin: "0 0 16px", fontSize: 13.5 }}>
                Click "+ Post Event" above to create an event drive for students.
              </p>
              <Link to="/admin/events" className="adm-post-event-btn" style={{ display: "inline-flex" }}>
                <PlusCircle size={16} /> Create First Event
              </Link>
            </div>
          ) : (
            displayEvents.map((opp, idx) => {
              const oppId = opp.id || opp._id || `opp_${idx}`;
              const isCompleted =
                opp.status === "Completed" || opp.eventStatus === "Completed" || Boolean(opp.pointsDistributed);
              const isShortlisted = opp.status === "Shortlisted";
              const statusClass = isCompleted ? "completed" : isShortlisted ? "shortlisted" : "open";
              const statusText = isCompleted ? "Completed" : isShortlisted ? "Shortlisted" : "Open";

              return (
                <div key={oppId} className="adm-event-card">
                  <div className="adm-event-card-media">
                    <img
                      src={
                        opp.image ||
                        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80"
                      }
                      alt={opp.title}
                      className="adm-event-card-img"
                    />
                    <span className={`adm-event-status-badge ${statusClass}`}>{statusText}</span>
                  </div>

                  <div className="adm-event-card-body">
                    <h3 className="adm-event-title" title={opp.title}>
                      {opp.title}
                    </h3>
                    <p className="adm-event-desc">
                      {opp.description ||
                        "Join us to clean the Marina shoreline and coordinate on-ground volunteer impact drives."}
                    </p>

                    <div className="adm-event-meta-list">
                      <div className="adm-event-meta-item">
                        <Calendar size={13} />
                        <span>{opp.date || "15 Aug 2025"}</span>
                      </div>
                      <div className="adm-event-meta-item">
                        <Clock size={13} />
                        <span>{opp.time || "09:00 AM"}</span>
                      </div>
                      <div className="adm-event-meta-item">
                        <MapPin size={13} />
                        <span>{opp.location || "Marina Beach, Chennai"}</span>
                      </div>
                    </div>

                    <div className="adm-event-counts-row">
                      <span>
                        <Users size={13} color="#64748B" />
                        {opp.applicationsCount || 12 + idx * 4} Interested
                      </span>
                      <span>
                        <CheckCircle2 size={13} color="#16A34A" />
                        {opp.volunteersNeeded
                          ? `${Math.min(
                            opp.volunteersNeeded - (opp.slotsAvailable || 0),
                            opp.volunteersNeeded
                          )}/${opp.volunteersNeeded}`
                          : `${idx * 5}/30`}{" "}
                        Selected
                      </span>
                    </div>

                    <div className="adm-event-actions-row">
                      <Link to="/admin/events" className="adm-card-btn-manage">
                        <Eye size={14} /> {isCompleted ? "View" : "Manage"}
                      </Link>
                      <Link to="/admin/events" className="adm-card-btn-edit" title="Edit Event">
                        <Edit3 size={14} /> Edit
                      </Link>
                      <button
                        type="button"
                        className="adm-card-btn-delete"
                        title="Delete Event"
                        onClick={() => handleDeleteEvent(oppId, opp.title)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 8 KPI METRIC CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="stat-card" style={{ borderLeft: "4px solid #0066CC" }}>
          <div className="stat-icon-wrap blue">
            <GraduationCap size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Registered Students</span>
            <div className="stat-value-row">
              <span className="stat-value">{kpis.totalRegisteredStudents}</span>
              <span className="stat-subtext">students</span>
            </div>
            <Link to="/admin/users" style={{ fontSize: 12, color: "#0066CC", fontWeight: 600, textDecoration: "none" }}>
              View user directory →
            </Link>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid #10B981" }}>
          <div className="stat-icon-wrap green">
            <Users size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Active Volunteers</span>
            <div className="stat-value-row">
              <span className="stat-value">{kpis.totalActiveVolunteers}</span>
              <span className="stat-subtext">field heroes</span>
            </div>
            <span className="stat-period-tag">Engaged in drives</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid #F59E0B" }}>
          <div className="stat-icon-wrap yellow">
            <Calendar size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Volunteering Events</span>
            <div className="stat-value-row">
              <span className="stat-value">{kpis.totalEvents}</span>
              <span className="stat-subtext">initiatives</span>
            </div>
            <Link to="/admin/events" style={{ fontSize: 12, color: "#D97706", fontWeight: 600, textDecoration: "none" }}>
              Manage event drives →
            </Link>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid #F97316" }}>
          <div className="stat-icon-wrap" style={{ background: "#FFEDD5", color: "#EA580C" }}>
            <Clock3 size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Pending Applications</span>
            <div className="stat-value-row">
              <span className="stat-value">{kpis.pendingApplications}</span>
              <span className="stat-subtext">awaiting review</span>
            </div>
            <Link
              to="/admin/events?tab=applications"
              style={{ fontSize: 12, color: "#EA580C", fontWeight: 600, textDecoration: "none" }}
            >
              Review applications →
            </Link>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid #059669" }}>
          <div className="stat-icon-wrap green">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Approved Volunteers</span>
            <div className="stat-value-row">
              <span className="stat-value">{kpis.approvedVolunteers}</span>
              <span className="stat-subtext">slots confirmed</span>
            </div>
            <span className="stat-period-tag">Ready for duty</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid #8B5CF6" }}>
          <div className="stat-icon-wrap" style={{ background: "#EDE9FE", color: "#7C3AED" }}>
            <FileCheck size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Completed Events</span>
            <div className="stat-value-row">
              <span className="stat-value">{kpis.completedEvents}</span>
              <span className="stat-subtext">executed</span>
            </div>
            <span className="stat-period-tag">Audited & Verified</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid #0284C7" }}>
          <div className="stat-icon-wrap blue">
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Volunteer Contributions</span>
            <div className="stat-value-row">
              <span className="stat-value">{kpis.totalVolunteerContributions}</span>
              <span className="stat-subtext">hours</span>
            </div>
            <span className="stat-period-tag">Community Service</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid #EAB308" }}>
          <div className="stat-icon-wrap yellow">
            <Award size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Points Distributed</span>
            <div className="stat-value-row">
              <span className="stat-value">{kpis.totalPointsDistributed}</span>
              <span className="stat-subtext">pts</span>
            </div>
            <Link to="/admin/users" style={{ fontSize: 12, color: "#854D0E", fontWeight: 600, textDecoration: "none" }}>
              Points management →
            </Link>
          </div>
        </div>
      </div>

      {/* QUICK HUB NAVIGATION BAR */}
      <div
        style={{
          background: "#FFFFFF",
          padding: "16px 20px",
          borderRadius: 16,
          border: "1px solid #E2E8F0",
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Layers size={18} color="#0066CC" />
          <strong style={{ fontSize: 14, color: "#0F172A" }}>Admin Quick Links:</strong>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Link to="/admin/events" className="dash-btn dash-btn-outline" style={{ fontSize: 13, padding: "6px 14px" }}>
            <Calendar size={14} /> Events & Slots
          </Link>
          <Link to="/admin/users" className="dash-btn dash-btn-outline" style={{ fontSize: 13, padding: "6px 14px" }}>
            <Users size={14} /> User Management
          </Link>
          <Link to="/reports" className="dash-btn dash-btn-outline" style={{ fontSize: 13, padding: "6px 14px" }}>
            <TrendingUp size={14} /> PDF & Excel Reports
          </Link>
          <Link
            to="/admin/events?tab=applications"
            className="dash-btn dash-btn-outline"
            style={{ fontSize: 13, padding: "6px 14px" }}
          >
            <FileCheck size={14} /> Applications Queue
          </Link>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: 20,
          marginBottom: 24,
        }}
      >
        <div className="dash-card">
          <div className="card-header-row">
            <div>
              <h2 className="card-title">Volunteer Applications Breakdown</h2>
              <p className="card-subtext">Current status of all submitted volunteering drive applications</p>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#0066CC",
                background: "#EFF6FF",
                padding: "4px 10px",
                borderRadius: 12,
              }}
            >
              Active Cycle
            </span>
          </div>
          <div style={{ padding: "16px 0" }}>
            <DonutChart
              data={[
                { label: "Approved Volunteers", value: kpis.approvedVolunteers, color: "#10B981" },
                { label: "Pending Review", value: kpis.pendingApplications, color: "#F59E0B" },
                { label: "Completed Drives", value: kpis.completedEvents, color: "#6366F1" },
                { label: "Rejected / Full", value: 1, color: "#EF4444" },
              ]}
              centerValue={kpis.approvedVolunteers + kpis.pendingApplications}
              centerLabel="Total Applications"
            />
          </div>
        </div>
      </div>

      {/* BROADCAST ANNOUNCEMENT MODAL */}
      {showBroadcastModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Send Live Broadcast Notification</h3>
                <p style={{ color: "#64748B", fontSize: 13, margin: "4px 0 0" }}>
                  Notify students instantly inside their dashboard and push alerts.
                </p>
              </div>
              <button className="close-modal-btn" onClick={() => setShowBroadcastModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} style={{ padding: "20px 24px" }}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Target Audience *</label>
                <select
                  value={broadcastForm.targetType}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, targetType: e.target.value })}
                  style={inputStyle}
                >
                  <option value="ALL">All Registered Students</option>
                  <option value="EVENT_APPROVED">Approved Volunteers of a Specific Event</option>
                </select>
              </div>

              {broadcastForm.targetType === "EVENT_APPROVED" && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Select Event *</label>
                  <select
                    value={broadcastForm.targetEventId}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, targetEventId: e.target.value })}
                    required
                    style={inputStyle}
                  >
                    <option value="">-- Choose Event --</option>
                    {events.map((evt) => (
                      <option key={evt.id || evt._id} value={evt.id || evt._id}>
                        {evt.title} ({evt.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Notification Headline *</label>
                <input
                  type="text"
                  placeholder="e.g. Venue Change Notice / Important Briefing"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Notification Message *</label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed notification message for volunteers..."
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Destination Link</label>
                <input
                  type="text"
                  placeholder="/opportunities or /dashboard"
                  value={broadcastForm.link}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, link: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" className="dash-btn dash-btn-outline" onClick={() => setShowBroadcastModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="dash-btn dash-btn-primary" disabled={submittingBroadcast}>
                  <Send size={15} /> {submittingBroadcast ? "Sending..." : "Send Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}