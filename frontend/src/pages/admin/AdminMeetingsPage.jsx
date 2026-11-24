// frontend/src/pages/admin/AdminMeetingsPage.jsx
// Admin Meeting Management Command Center & Student Availability Tracker

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Video,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  UserCheck,
} from "lucide-react";
import { meetingsAPI } from "../../api/meetingsAPI";

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("meetings"); // 'meetings' | 'availability'
  const [selectedMeetingId, setSelectedMeetingId] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    tag: "NSS",
    date: new Date().toISOString().split("T")[0],
    time: "10:00 AM – 11:00 AM",
    mode: "Google Meet",
    meetLink: "https://meet.google.com/xyz-maatram",
    location: "Google Meet · Chennai, Tamil Nadu",
    coord: "Karthik R",
    role: "NSS Programme Coordinator",
    phone: "+91 98765 43210",
    email: "karthik@maatram.org",
    people: "15 Volunteers",
    tone: "gn",
    grad: "b",
    emoji: "📋",
    desc: "",
    agenda: "1. Welcome and goals\n2. Volunteer role assignment\n3. Q&A and next steps",
    note: "Keep your college ID ready. Join 5 minutes early.",
    targetAudience: "Both",
    zone: "All Zones",
  });

  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await meetingsAPI.getAll();
      if (res.data?.success && Array.isArray(res.data.data)) {
        setMeetings(res.data.data);
      }
    } catch (err) {
      showToast(err.message || "Failed to load meetings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Please enter meeting title.", "error");
      return;
    }
    try {
      setSubmitting(true);
      const res = await meetingsAPI.create(formData);
      showToast(res.data?.message || "Meeting scheduled successfully!");
      setShowCreateModal(false);
      setFormData({
        title: "",
        tag: "NSS",
        date: new Date().toISOString().split("T")[0],
        time: "10:00 AM – 11:00 AM",
        mode: "Google Meet",
        meetLink: "https://meet.google.com/xyz-maatram",
        location: "Google Meet · Chennai, Tamil Nadu",
        coord: "Karthik R",
        role: "NSS Programme Coordinator",
        phone: "+91 98765 43210",
        email: "karthik@maatram.org",
        people: "15 Volunteers",
        tone: "gn",
        grad: "b",
        emoji: "📋",
        desc: "",
        agenda: "1. Welcome and goals\n2. Volunteer role assignment\n3. Q&A and next steps",
        note: "Keep your college ID ready. Join 5 minutes early.",
      });
      fetchMeetings();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeeting = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete meeting "${title}"?`)) return;
    try {
      await meetingsAPI.remove(id);
      showToast("Meeting deleted successfully.");
      fetchMeetings();
    } catch (err) {
      showToast(err.message || "Failed to delete meeting", "error");
    }
  };

  // Extract all student availabilities
  const allAvailabilities = [];
  meetings.forEach((m) => {
    (m.availabilities || []).forEach((a) => {
      allAvailabilities.push({
        ...a,
        meetingId: m.id || m._id,
        meetingTitle: m.title,
        meetingDate: m.date,
        meetingTime: m.time,
      });
    });
  });

  const filteredAvailabilities =
    selectedMeetingId === "all"
      ? allAvailabilities
      : allAvailabilities.filter((a) => a.meetingId === selectedMeetingId);

  const availableCount = allAvailabilities.filter((a) => a.response === "available").length;
  const unavailableCount = allAvailabilities.filter((a) => a.response === "unavailable").length;

  return (
    <div style={{ padding: "28px 36px", background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: toastMessage.type === "error" ? "#EF4444" : "#0F172A",
            color: "#FFFFFF",
            padding: "14px 22px",
            borderRadius: 12,
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {toastMessage.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} style={{ color: "#4ADE80" }} />}
          {toastMessage.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 900, color: "#CA8A04", textTransform: "uppercase", letterSpacing: 0.8 }}>
            Admin Command Center
          </span>
          <h1 style={{ margin: "4px 0", fontSize: 28, fontWeight: 900, color: "#0F172A" }}>
            Meetings &amp; Volunteer Availability Hub
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#64748B" }}>
            Schedule and manage volunteer briefing meets, review student availability responses, and track attendance.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={fetchMeetings}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 12,
              border: "1.5px solid #CBD5E1",
              background: "#FFFFFF",
              color: "#334155",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={15} /> Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 12,
              border: "none",
              background: "#FACC15",
              color: "#000000",
              fontSize: 14,
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(250, 204, 21, 0.35)",
            }}
          >
            <Plus size={16} strokeWidth={3} /> Post / Schedule New Meeting
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 16, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calendar size={22} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#0F172A" }}>{meetings.length}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Total Meetings</div>
          </div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 16, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FEF9C3", color: "#CA8A04", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#0F172A" }}>
              {meetings.filter((m) => !m.past).length}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Upcoming Meetings</div>
          </div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 16, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#DCFCE7", color: "#166534", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#166534" }}>{availableCount}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Available Submissions</div>
          </div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 16, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FEE2E2", color: "#991B1B", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <XCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#991B1B" }}>{unavailableCount}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Unavailable Submissions</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, borderBottom: "1.5px solid #E2E8F0", paddingBottom: 14, marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setActiveTab("meetings")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 20px",
            borderRadius: 12,
            fontSize: 13.5,
            fontWeight: 800,
            cursor: "pointer",
            background: activeTab === "meetings" ? "#0F172A" : "#FFFFFF",
            color: activeTab === "meetings" ? "#FACC15" : "#334155",
            border: activeTab === "meetings" ? "2px solid #0F172A" : "1.5px solid #CBD5E1",
          }}
        >
          <Calendar size={16} /> Scheduled Meetings ({meetings.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("availability")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 20px",
            borderRadius: 12,
            fontSize: 13.5,
            fontWeight: 800,
            cursor: "pointer",
            background: activeTab === "availability" ? "#0F172A" : "#FFFFFF",
            color: activeTab === "availability" ? "#FACC15" : "#334155",
            border: activeTab === "availability" ? "2px solid #0F172A" : "1.5px solid #CBD5E1",
          }}
        >
          <Users size={16} /> Volunteer Availability Submissions ({allAvailabilities.length})
        </button>
      </div>

      {/* TAB 1: SCHEDULED MEETINGS */}
      {activeTab === "meetings" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 18 }}>
          {meetings.map((m) => (
            <div
              key={m.id || m._id}
              style={{
                background: "#FFFFFF",
                border: "1.5px solid #E2E8F0",
                borderRadius: 18,
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span
                  style={{
                    background: "#0F172A",
                    color: "#FDE047",
                    fontSize: 11.5,
                    fontWeight: 900,
                    padding: "3px 10px",
                    borderRadius: 8,
                    letterSpacing: 0.5,
                  }}
                >
                  {m.tag || "NSS"}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      background: m.status === "Confirmed" ? "#DCFCE7" : "#FEF08A",
                      color: m.status === "Confirmed" ? "#166534" : "#854D0E",
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 6,
                    }}
                  >
                    {m.status || "Upcoming"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteMeeting(m.id || m._id, m.title)}
                    title="Delete meeting"
                    style={{
                      background: "#FEE2E2",
                      border: "none",
                      color: "#DC2626",
                      borderRadius: 8,
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 900, color: "#0F172A" }}>
                {m.title}
              </h3>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
                {m.desc}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "#334155", marginBottom: 16 }}>
                <div>📅 <strong>Date:</strong> {m.date}</div>
                <div>🕙 <strong>Time:</strong> {m.time}</div>
                <div>📍 <strong>Location:</strong> {m.location || "Google Meet"}</div>
                <div>👤 <strong>Coordinator:</strong> {m.coord} ({m.phone})</div>
                <div>👥 <strong>Capacity:</strong> {m.people || "15 Volunteers"}</div>
                <div>
                  📩 <strong>Student Availability:</strong>{" "}
                  <span style={{ color: "#166534", fontWeight: 800 }}>
                    {(m.availabilities || []).filter((a) => a.response === "available").length} Available
                  </span>{" "}
                  &bull;{" "}
                  <span style={{ color: "#991B1B", fontWeight: 800 }}>
                    {(m.availabilities || []).filter((a) => a.response === "unavailable").length} Unavailable
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: "auto", paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
                <a
                  href={m.meetLink || "https://meet.google.com/xyz-maatram"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    textDecoration: "none",
                    background: "#0F172A",
                    color: "#FFFFFF",
                    padding: "9px 12px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Video size={14} color="#FACC15" /> Join Meet
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMeetingId(m.id || m._id);
                    setActiveTab("availability");
                  }}
                  style={{
                    flex: 1,
                    background: "#F8FAFC",
                    color: "#0F172A",
                    border: "1.5px solid #CBD5E1",
                    padding: "9px 12px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  View Responses ({ (m.availabilities || []).length })
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: VOLUNTEER AVAILABILITY SUBMISSIONS */}
      {activeTab === "availability" && (
        <div style={{ background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 18, padding: 22, boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>Filter by Meeting:</span>
              <select
                value={selectedMeetingId}
                onChange={(e) => setSelectedMeetingId(e.target.value)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 10,
                  border: "1.5px solid #CBD5E1",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0F172A",
                  outline: "none",
                }}
              >
                <option value="all">All Meetings ({allAvailabilities.length} responses)</option>
                {meetings.map((m) => (
                  <option key={m.id || m._id} value={m.id || m._id}>
                    {m.title} ({ (m.availabilities || []).length } responses)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F1F5F9", color: "#475569", borderBottom: "1.5px solid #E2E8F0" }}>
                  <th style={{ padding: "12px 14px", fontWeight: 800 }}>Student Volunteer</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800 }}>Meeting Title</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800 }}>Availability Status</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800 }}>Preferred Date &amp; Slot</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800 }}>Reason (if unavailable)</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800 }}>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {filteredAvailabilities.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "36px 14px", textAlign: "center", color: "#64748B" }}>
                      No student availability responses submitted yet for this selection.
                    </td>
                  </tr>
                ) : (
                  filteredAvailabilities.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 800, color: "#0F172A" }}>{r.studentName}</div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{r.studentEmail || "—"}</div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{r.college || "Anna University"}</div>
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0F172A" }}>
                        {r.meetingTitle}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            background: r.response === "available" ? "#DCFCE7" : "#FEE2E2",
                            color: r.response === "available" ? "#166534" : "#991B1B",
                            border: r.response === "available" ? "1px solid #86EFAC" : "1px solid #FCA5A5",
                            padding: "3px 10px",
                            borderRadius: 6,
                            fontWeight: 900,
                            fontSize: 12,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          {r.response === "available" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                          {r.response === "available" ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#334155" }}>
                        <div>📅 {r.selectedDate || "—"}</div>
                        <div style={{ fontSize: 11.5, color: "#64748B" }}>🕙 {r.selectedSlot || "—"}</div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#475569", maxWidth: 220 }}>
                        {r.reason ? (
                          <div style={{ fontStyle: "italic", background: "#FEF2F2", padding: "4px 8px", borderRadius: 6, border: "1px solid #FECACA" }}>
                            "{r.reason}"
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#64748B", fontSize: 12 }}>
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("en-IN") : "Today"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MEETING MODAL */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 9999,
          }}
          onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 22,
              maxWidth: 620,
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ background: "#0F172A", color: "#FFFFFF", padding: "20px 26px", borderTopLeftRadius: 22, borderTopRightRadius: 22 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Post / Schedule New Meeting</h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94A3B8" }}>
                Add an upcoming volunteer meet, allocate coordinators, and notify volunteers.
              </p>
            </div>

            <form onSubmit={handleCreateMeeting} style={{ padding: "22px 26px", maxHeight: "calc(88vh - 85px)", overflowY: "auto", scrollbarWidth: "thin" }}>
              {/* TARGET AUDIENCE & ZONE TYPE */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 800, color: "#1E293B", marginBottom: 6 }}>
                    Target Audience *
                  </label>
                  <select
                    value={formData.targetAudience || "Both"}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #2563EB", fontSize: 13, fontWeight: 700, color: "#1E293B", boxSizing: "border-box" }}
                  >
                    <option value="Both">Both Students &amp; Alumni (Open for Everyone)</option>
                    <option value="Students">Students Only (Send to Students Alone): Event is visible/accessible to student volunteers only.</option>
                    <option value="Alumni">Alumni Only (Send to Alumni Alone)</option>
                  </select>
                  <small style={{ color: "#2563EB", fontSize: 11, marginTop: 4, display: "block", fontWeight: 600 }}>
                    {formData.targetAudience === "Students" ? "🔒 Students only" : formData.targetAudience === "Alumni" ? "🎓 Alumni only" : "🌐 Everyone"}
                  </small>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 800, color: "#1E293B", marginBottom: 6 }}>
                    Zone Type *
                  </label>
                  <select
                    value={formData.zone || "All Zones"}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #059669", fontSize: 13, fontWeight: 700, color: "#1E293B", boxSizing: "border-box" }}
                  >
                    <option value="All Zones">All Zones (Universal Access)</option>
                    <option value="Zone 1">Zone 1 (Shows to Zone 1 students alone)</option>
                    <option value="Zone 2">Zone 2 (Shows to Zone 2 students alone)</option>
                    <option value="Zone 3">Zone 3 (Shows to Zone 3 students alone)</option>
                    <option value="Zone 4">Zone 4 (Shows to Zone 4 students alone)</option>
                  </select>
                  <small style={{ color: "#059669", fontSize: 11, marginTop: 4, display: "block", fontWeight: 600 }}>
                    {formData.zone === "All Zones" ? "🌍 All zones" : `📍 ${formData.zone} only`}
                  </small>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#1E293B", marginBottom: 5 }}>
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NSS Planning Discussion or Year-End Review"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: 13.5, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#1E293B", marginBottom: 5 }}>
                    Tag / Category
                  </label>
                  <select
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: 13.5 }}
                  >
                    <option value="NSS">NSS</option>
                    <option value="Events">Events</option>
                    <option value="Outreach">Outreach</option>
                    <option value="Orientation">Orientation</option>
                    <option value="Kickoff">Kickoff</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#1E293B", marginBottom: 5 }}>
                    Emoji Icon
                  </label>
                  <input
                    type="text"
                    value={formData.emoji}
                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: 13.5, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#1E293B", marginBottom: 5 }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: 13.5, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#1E293B", marginBottom: 5 }}>
                    Time *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM – 11:00 AM"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: 13.5, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#1E293B", marginBottom: 5 }}>
                  Google Meet Link
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz-maatram"
                  value={formData.meetLink}
                  onChange={(e) => setFormData({ ...formData, meetLink: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: 13.5, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#1E293B", marginBottom: 5 }}>
                    Coordinator Name
                  </label>
                  <input
                    type="text"
                    value={formData.coord}
                    onChange={(e) => setFormData({ ...formData, coord: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: 13.5, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#1E293B", marginBottom: 5 }}>
                    Coordinator Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: 13.5, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#1E293B", marginBottom: 5 }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of what the meeting covers..."
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: 13.5, boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#1E293B", marginBottom: 5 }}>
                  Agenda (one point per line)
                </label>
                <textarea
                  rows={3}
                  value={formData.agenda}
                  onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: 13.5, boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#1E293B", marginBottom: 5 }}>
                  Note for Volunteers
                </label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: 13.5, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid #CBD5E1", background: "#FFFFFF", color: "#475569", fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "#FACC15", color: "#000000", fontWeight: 900, cursor: submitting ? "not-allowed" : "pointer" }}
                >
                  {submitting ? "Posting..." : "Schedule Meeting →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
