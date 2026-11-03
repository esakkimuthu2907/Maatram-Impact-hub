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
  XCircle,
  FileCheck,
  TrendingUp,
  Send,
  PlusCircle,
  ShieldCheck,
  Building,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Filter,
  RefreshCw,
  Bell,
  Layers,
  Settings,
  Download,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { adminAPI } from "../../api/adminAPI";
import BarChart from "../../components/charts/BarChart";
import DonutChart from "../../components/charts/DonutChart";
import TrendAreaChart from "../../components/charts/TrendAreaChart";
import '../student/StudentDashboard.css';
import "./AdminEventsPage.css";

export default function AdminDashboard() {
  const { user, events, applications, showToast } = useApp();
  const [statsData, setStatsData] = useState(null);
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
      const res = await adminAPI.getStats();
      if (res && res.data) {
        setStatsData(res.data);
      }
    } catch (err) {
      console.warn("Could not fetch admin KPIs:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const kpis = statsData?.kpis || {
    totalRegisteredStudents: 4,
    totalActiveVolunteers: 4,
    totalEvents: events.length || 3,
    pendingApplications: applications.filter((a) => a.status === "Pending").length || 1,
    approvedVolunteers: applications.filter((a) => a.status === "Approved").length || 2,
    completedEvents: events.filter((e) => e.eventStatus === "Completed").length || 1,
    totalVolunteerContributions: 112,
    totalPointsDistributed: 1085,
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

  return (
    <div className="dashboard-container">
      {/* HEADER ROW WITH QUICK ACTIONS */}
      <div className="section-header-row">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                background: "#FEF08A",
                color: "#854D0E",
                fontSize: 12,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 20,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <ShieldCheck size={14} /> Maatram Admin Portal
            </span>
            <span style={{ color: "#94A3B8", fontSize: 13 }}>Live System Overview</span>
          </div>
          <h1 className="page-heading" style={{ marginTop: 6 }}>
            Impact Operations Command Center
          </h1>
          <p className="page-subheading">
            Real-time monitoring of student registrations, volunteering drives, attendance, and points distribution.
          </p>
        </div>

        <div className="header-action-group">
          <button
            className="dash-btn dash-btn-outline"
            onClick={loadDashboardData}
            title="Refresh statistics"
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button
            className="dash-btn dash-btn-outline"
            onClick={() => setShowBroadcastModal(true)}
            style={{ borderColor: "#0066CC", color: "#0066CC" }}
          >
            <Send size={15} /> Broadcast Alert
          </button>
          <Link to="/admin/events" className="dash-btn dash-btn-primary">
            <PlusCircle size={15} /> Create Drive
          </Link>
        </div>
      </div>

      {/* 8 INTERACTIVE KPI METRIC CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* 1. Total Registered Students */}
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

        {/* 2. Total Active Volunteers */}
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

        {/* 3. Total Events */}
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

        {/* 4. Pending Applications */}
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
            <Link to="/admin/events?tab=applications" style={{ fontSize: 12, color: "#EA580C", fontWeight: 600, textDecoration: "none" }}>
              Review applications →
            </Link>
          </div>
        </div>

        {/* 5. Approved Volunteers */}
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

        {/* 6. Completed Events */}
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

        {/* 7. Total Volunteer Contributions */}
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

        {/* 8. Total Points Distributed */}
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
          <Link to="/admin/events?tab=applications" className="dash-btn dash-btn-outline" style={{ fontSize: 13, padding: "6px 14px" }}>
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
        {/* Chart 1: Applications Status Distribution */}
        <div className="dash-card">
          <div className="card-header-row">
            <div>
              <h2 className="card-title">Volunteer Applications Breakdown</h2>
              <p className="card-subtext">Current status of all submitted volunteering drive applications</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0066CC", background: "#EFF6FF", padding: "4px 10px", borderRadius: 12 }}>
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

        {/* Chart 2: Monthly Volunteering Activity */}
        <div className="dash-card">
          <div className="card-header-row">
            <div>
              <h2 className="card-title">Monthly Volunteering Trajectory</h2>
              <p className="card-subtext">Verified volunteer engagement & social service drives across months</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#10B981", background: "#ECFDF5", padding: "4px 10px", borderRadius: 12 }}>
              +28% Growth
            </span>
          </div>
          <div style={{ height: 260, marginTop: 12 }}>
            <TrendAreaChart
              data={
                statsData?.charts?.monthlyActivity || [
                  { month: "Jan", count: 12 },
                  { month: "Feb", count: 19 },
                  { month: "Mar", count: 24 },
                  { month: "Apr", count: 32 },
                  { month: "May", count: 28 },
                  { month: "Jun", count: 35 },
                ]
              }
              valueKey="count"
              labelKey="month"
              stroke="#0066CC"
              fill="rgba(0, 102, 204, 0.12)"
            />
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITIES & AUDIT LOG */}
      <div className="dash-card">
        <div className="card-header-row">
          <div>
            <h2 className="card-title">Recent Administrative Activities & Audit Log</h2>
            <p className="card-subtext">Real-time log of approvals, points allocation, drive postings, and account updates</p>
          </div>
          <span style={{ fontSize: 12, color: "#64748B" }}>Auto-synced</span>
        </div>

        <div style={{ marginTop: 16 }}>
          {statsData?.recentActivities && statsData.recentActivities.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {statsData.recentActivities.map((act) => (
                <div
                  key={act._id || act.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    padding: "12px 16px",
                    background: "#F8FAFC",
                    borderRadius: 12,
                    border: "1px solid #EDF2F7",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background:
                        act.action.includes("APPROVED")
                          ? "#DCFCE7"
                          : act.action.includes("POINTS")
                          ? "#FEF08A"
                          : act.action.includes("CREATED")
                          ? "#DBEAFE"
                          : "#F1F5F9",
                      color:
                        act.action.includes("APPROVED")
                          ? "#16A34A"
                          : act.action.includes("POINTS")
                          ? "#CA8A04"
                          : act.action.includes("CREATED")
                          ? "#2563EB"
                          : "#475569",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {act.action.includes("APPROVED") ? (
                      <CheckCircle2 size={18} />
                    ) : act.action.includes("POINTS") ? (
                      <Award size={18} />
                    ) : act.action.includes("CREATED") ? (
                      <Calendar size={18} />
                    ) : (
                      <Clock size={18} />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: 14, color: "#0F172A" }}>
                        {act.action.replace(/_/g, " ")}
                      </strong>
                      <span style={{ fontSize: 12, color: "#94A3B8" }}>
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "#475569" }}>
                      {act.details}
                    </p>
                    <span style={{ fontSize: 11, color: "#64748B", marginTop: 4, display: "inline-block" }}>
                      Operator: <strong>{act.adminName || "System Administrator"}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "30px 20px", textAlign: "center", color: "#64748B" }}>
              <Clock size={28} color="#94A3B8" style={{ marginBottom: 8 }} />
              <p>No recent admin activities recorded yet.</p>
            </div>
          )}
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
              <button
                className="close-modal-btn"
                onClick={() => setShowBroadcastModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} style={{ padding: "20px 24px" }}>
              {/* Target Audience */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Target Audience *
                </label>
                <select
                  value={broadcastForm.targetType}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, targetType: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                >
                  <option value="ALL">All Registered Students</option>
                  <option value="EVENT_APPROVED">Approved Volunteers of a Specific Event</option>
                </select>
              </div>

              {/* Event selection if EVENT_APPROVED */}
              {broadcastForm.targetType === "EVENT_APPROVED" && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Select Event *
                  </label>
                  <select
                    value={broadcastForm.targetEventId}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, targetEventId: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
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

              {/* Title */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Notification Headline *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Venue Change Notice / Important Briefing"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Notification Message *
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed notification message for volunteers..."
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
              </div>

              {/* Target Link */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Destination Link
                </label>
                <input
                  type="text"
                  placeholder="/opportunities or /dashboard"
                  value={broadcastForm.link}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, link: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button
                  type="button"
                  className="dash-btn dash-btn-outline"
                  onClick={() => setShowBroadcastModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dash-btn dash-btn-primary"
                  disabled={submittingBroadcast}
                >
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
