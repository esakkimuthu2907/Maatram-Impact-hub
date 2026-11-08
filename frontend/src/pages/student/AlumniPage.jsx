// frontend/src/pages/student/AlumniPage.jsx
import React, { useState } from "react";
import {
  GraduationCap,
  Briefcase,
  Building2,
  Calendar,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Star,
  ExternalLink,
  Mail,
  UserCheck,
  Sparkles,
  ShieldCheck,
  X,
  Send,
  Users,
  ClipboardList,
  AlertTriangle,
  Clock,
  Award,
  TrendingUp,
  Edit3,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import "./AlumniPage.css";

/* ─────────────────────────────────────────────────────── */
/*  DATA                                                   */
/* ─────────────────────────────────────────────────────── */
const ALUMNI_DIRECTORY = [
  {
    id: "alu_01",
    name: "Sundar R",
    role: "Senior Software Development Engineer",
    company: "Zoho Corporation",
    batch: "CEG Class of 2022",
    college: "College of Engineering Guindy (CEG)",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    domain: "Technology & Coding",
    expertise: [
      "Full Stack Engineering",
      "Python / Web Systems",
      "Campus Placements",
      "System Design",
    ],
    assignedEvent: "Karpom Karpipom – Peer Python & Web Basics Workshop",
    bio: "Former Maatram student scholar now building distributed cloud systems at Zoho. Passionate about empowering 1st-generation college coders.",
    availableFor: ["1-on-1 Mock Interviews", "Code Reviews", "Placement Strategies"],
    linkedIn: "https://linkedin.com",
  },
  {
    id: "alu_02",
    name: "Deepika K",
    role: "Civil Services Aspirant & Public Policy Fellow",
    company: "Government of Tamil Nadu Education Initiative",
    batch: "MIT Class of 2023",
    college: "Madras Institute of Technology (MIT)",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    domain: "Public Policy & Civil Services",
    expertise: [
      "UPSC / TNPSC Mentorship",
      "Rural Educational Outreach",
      "Public Speaking",
      "Essay Writing",
    ],
    assignedEvent: "School Visit – Government Higher Secondary School",
    bio: "Passionate education reformer working directly with district collectorates on rural school infrastructure. 2-time state essay champion.",
    availableFor: ["Civil Services Roadmap", "Higher Studies Planning", "Soft Skills"],
    linkedIn: "https://linkedin.com",
  },
];

const ASSIGNED_STUDENTS = [
  {
    id: "s1",
    name: "Esakkimuthu S",
    college: "Velammal Engineering College",
    dept: "CSE",
    points: 120,
    totalHours: 36,
    status: "active",
    attendance: "Present",
  },
  {
    id: "s2",
    name: "Esakkirajan G",
    college: "College of Engineering Guindy (CEG)",
    dept: "CSE",
    points: 80,
    totalHours: 12,
    status: "active",
    attendance: "Present",
  },
  {
    id: "s3",
    name: "Ajai",
    college: "Madras Institute of Technology (MIT)",
    dept: "ECE",
    points: 60,
    totalHours: 8,
    status: "active",
    attendance: "Present",
  },
];

/* ─────────────────────────────────────────────────────── */
/*  ALUMNI DASHBOARD (for role === "alumni")               */
/* ─────────────────────────────────────────────────────── */
function AlumniDashboard({ user, showToast }) {
  const [activeTab, setActiveTab] = useState("students");
  const [attendanceMap, setAttendanceMap] = useState(
    Object.fromEntries(ASSIGNED_STUDENTS.map((s) => [s.id, s.attendance]))
  );
  const [workStatus, setWorkStatus] = useState("In Progress");
  const [workNotes, setWorkNotes] = useState("");
  const [issueType, setIssueType] = useState("Technical Issue");
  const [issueDesc, setIssueDesc] = useState("");
  const [issuePriority, setIssuePriority] = useState("Medium");
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [savingWork, setSavingWork] = useState(false);
  const [submittingIssue, setSubmittingIssue] = useState(false);

  const displayName = user?.name || user?.fullName || "Alumni";

  const TABS = [
    { id: "students", label: "My Students", icon: <Users size={15} /> },
    { id: "attendance", label: "Attendance", icon: <CheckCircle2 size={15} /> },
    { id: "workstatus", label: "Work Status", icon: <TrendingUp size={15} /> },
    { id: "report", label: "Report Issue", icon: <AlertTriangle size={15} /> },
  ];

  const handleSaveAttendance = () => {
    setSavingAttendance(true);
    setTimeout(() => {
      setSavingAttendance(false);
      showToast("Attendance saved successfully!", "success");
    }, 700);
  };

  const handleWorkSubmit = (e) => {
    e.preventDefault();
    setSavingWork(true);
    setTimeout(() => {
      setSavingWork(false);
      showToast("Work status updated!", "success");
    }, 700);
  };

  const handleIssueSubmit = (e) => {
    e.preventDefault();
    if (!issueDesc.trim()) {
      showToast("Please describe the issue.", "error");
      return;
    }
    setSubmittingIssue(true);
    setTimeout(() => {
      setSubmittingIssue(false);
      setIssueDesc("");
      showToast("Issue reported! Admin notified.", "success");
    }, 800);
  };

  /* ── inline style tokens ─────────────────── */
  const card = {
    background: "#FFFFFF",
    borderRadius: 18,
    border: "1.5px solid #E2E8F0",
    boxShadow: "0 4px 18px rgba(15,23,42,0.05)",
    padding: "24px 28px",
    marginBottom: 24,
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1.5px solid #CBD5E1",
    fontSize: 13.5,
    color: "#0F172A",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
    display: "block",
    marginBottom: 6,
  };

  const btnPrimary = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 12,
    padding: "11px 22px",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  return (
    <div style={{ padding: "24px 32px 60px", maxWidth: 1200, margin: "0 auto" }}>
      {/* ── HERO ──────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #0284C7 100%)",
          borderRadius: 18,
          padding: "18px 24px",
          color: "#FFFFFF",
          marginBottom: 20,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 8px 28px rgba(30, 58, 138, 0.22)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 20,
                padding: "3px 12px",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 6,
                color: "#BFDBFE",
              }}
            >
              <GraduationCap size={12} /> Alumni Portal
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px", lineHeight: 1.2 }}>
              Welcome back, {displayName}! 🎓
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0 }}>
              Alumni management dashboard — coordinate assigned students, take attendance, and track impact.
            </p>

            {user?.assignedEvent && (
              <div
                style={{
                  marginTop: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: 8,
                  padding: "5px 12px",
                  fontSize: 12,
                }}
              >
                <Calendar size={13} />
                <span>
                  Active Assignment: <strong>{user.assignedEvent}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── QUICK STATS ROW ───────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {[
          {
            icon: <Users size={20} />,
            label: "Assigned Students",
            value: ASSIGNED_STUDENTS.length,
            color: "#7C3AED",
            bg: "#F5F3FF",
            border: "#DDD6FE",
          },
          {
            icon: <CheckCircle2 size={20} />,
            label: "Tasks Completed",
            value: 7,
            color: "#059669",
            bg: "#D1FAE5",
            border: "#6EE7B7",
          },
          {
            icon: <Clock size={20} />,
            label: "Hours Logged",
            value:
              ASSIGNED_STUDENTS.reduce((a, s) => a + s.totalHours, 0) + " hrs",
            color: "#2563EB",
            bg: "#EFF6FF",
            border: "#BFDBFE",
          },
          {
            icon: <Award size={20} />,
            label: "Impact Score",
            value: "92",
            color: "#D97706",
            bg: "#FEF3C7",
            border: "#FDE68A",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: s.bg,
              border: `1.5px solid ${s.border}`,
              borderRadius: 16,
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: s.color,
                color: "#FFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {s.icon}
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: s.color, textTransform: "uppercase" }}>
              {s.label}
            </span>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#0F172A" }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── MY ASSIGNED WORK CARD ─────────────────────── */}
      <div style={{ ...card, background: "linear-gradient(135deg, #FAFAF8 0%, #FFFFFF 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
              color: "#FFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Briefcase size={17} />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>
            My Assigned Work
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {[
            {
              label: "Assigned Event",
              value: user?.assignedEvent || "Karpom Karpipom – Python & Web Basics Workshop",
              icon: <Calendar size={15} />,
              color: "#4F46E5",
            },
            {
              label: "Role",
              value: user?.assignedRole || "Peer Mentor & Session Lead",
              icon: <UserCheck size={15} />,
              color: "#059669",
            },
            {
              label: "Work Description",
              value:
                user?.workDescription ||
                "Lead peer-learning sessions, track student progress, and report outcomes to the Maatram team.",
              icon: <Edit3 size={15} />,
              color: "#D97706",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "#FFFFFF",
                border: "1.5px solid #E2E8F0",
                borderRadius: 14,
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: item.color,
                  fontWeight: 700,
                  fontSize: 11.5,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {item.icon} {item.label}
              </div>
              <p style={{ fontSize: 13.5, color: "#334155", margin: 0, lineHeight: 1.5 }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────── */}
      <div style={card}>
        {/* Tab Header */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 24,
            borderBottom: "2px solid #F1F5F9",
            paddingBottom: 2,
            overflowX: "auto",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 18px",
                borderRadius: "12px 12px 0 0",
                border: "none",
                background: activeTab === tab.id ? "linear-gradient(135deg, #7C3AED, #4F46E5)" : "transparent",
                color: activeTab === tab.id ? "#FFFFFF" : "#64748B",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
                marginBottom: activeTab === tab.id ? -2 : 0,
                borderBottom: activeTab === tab.id ? "2px solid transparent" : "none",
                transition: "all 0.18s",
                whiteSpace: "nowrap",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: MY STUDENTS ───────────────────────── */}
        {activeTab === "students" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Assigned Students ({ASSIGNED_STUDENTS.length})
              </h3>
              <span
                style={{
                  background: "#F0FDF4",
                  color: "#15803D",
                  border: "1px solid #BBF7D0",
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                All Active
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Student", "College", "Dept", "Hours", "Points", "Status"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontWeight: 700,
                          color: "#64748B",
                          fontSize: 12,
                          textTransform: "uppercase",
                          borderBottom: "1.5px solid #E2E8F0",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ASSIGNED_STUDENTS.map((s, i) => (
                    <tr
                      key={s.id}
                      style={{
                        background: i % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                        borderBottom: "1px solid #F1F5F9",
                      }}
                    >
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                              color: "#FFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: 13,
                              flexShrink: 0,
                            }}
                          >
                            {s.name[0]}
                          </div>
                          <strong style={{ color: "#0F172A" }}>{s.name}</strong>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#475569" }}>{s.college}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            background: "#EEF2FF",
                            color: "#4338CA",
                            padding: "2px 10px",
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {s.dept}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#0F172A", fontWeight: 700 }}>
                        {s.totalHours} hrs
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            background: "#FEF9C3",
                            color: "#854D0E",
                            padding: "2px 10px",
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {s.points} pts
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            background: "#D1FAE5",
                            color: "#065F46",
                            padding: "3px 12px",
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          ● Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB: ATTENDANCE ────────────────────────── */}
        {activeTab === "attendance" && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 18 }}>
              Mark Attendance
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {ASSIGNED_STUDENTS.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#F8FAFC",
                    borderRadius: 14,
                    padding: "14px 18px",
                    border: "1.5px solid #E2E8F0",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg,#7C3AED,#4F46E5)",
                        color: "#FFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 14,
                      }}
                    >
                      {s.name[0]}
                    </div>
                    <div>
                      <strong style={{ fontSize: 14, color: "#0F172A", display: "block" }}>{s.name}</strong>
                      <span style={{ fontSize: 12, color: "#64748B" }}>{s.college}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 20 }}>
                    {["Present", "Absent"].map((opt) => (
                      <label
                        key={opt}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          cursor: "pointer",
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: attendanceMap[s.id] === opt
                            ? opt === "Present" ? "#059669" : "#DC2626"
                            : "#94A3B8",
                        }}
                      >
                        <input
                          type="radio"
                          name={`att_${s.id}`}
                          value={opt}
                          checked={attendanceMap[s.id] === opt}
                          onChange={() =>
                            setAttendanceMap((prev) => ({ ...prev, [s.id]: opt }))
                          }
                          style={{ accentColor: opt === "Present" ? "#059669" : "#DC2626" }}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={savingAttendance}
                style={btnPrimary}
              >
                <CheckCircle2 size={15} />
                {savingAttendance ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: WORK STATUS ───────────────────────── */}
        {activeTab === "workstatus" && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 18 }}>
              Update Work Progress
            </h3>
            <form onSubmit={handleWorkSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={labelStyle}>Progress Status</label>
                <select
                  value={workStatus}
                  onChange={(e) => setWorkStatus(e.target.value)}
                  style={inputStyle}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Progress Notes</label>
                <textarea
                  rows={4}
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  placeholder="Describe what you accomplished, any blockers, or next steps..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
              <div>
                <button type="submit" disabled={savingWork} style={btnPrimary}>
                  <TrendingUp size={15} />
                  {savingWork ? "Submitting..." : "Submit Progress Update"}
                </button>
              </div>
            </form>

            {/* Status display */}
            <div
              style={{
                marginTop: 24,
                padding: "16px 20px",
                borderRadius: 14,
                background:
                  workStatus === "Completed"
                    ? "#D1FAE5"
                    : workStatus === "In Progress"
                    ? "#EFF6FF"
                    : "#F1F5F9",
                border: `1.5px solid ${
                  workStatus === "Completed"
                    ? "#6EE7B7"
                    : workStatus === "In Progress"
                    ? "#BFDBFE"
                    : "#E2E8F0"
                }`,
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  color:
                    workStatus === "Completed"
                      ? "#065F46"
                      : workStatus === "In Progress"
                      ? "#1E40AF"
                      : "#475569",
                  fontSize: 13.5,
                }}
              >
                Current Status:{" "}
                {workStatus === "Completed" ? "✅" : workStatus === "In Progress" ? "🔄" : "⏳"}{" "}
                {workStatus}
              </span>
            </div>
          </div>
        )}

        {/* ── TAB: REPORT ISSUE ──────────────────────── */}
        {activeTab === "report" && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 18 }}>
              Report an Issue
            </h3>
            <form onSubmit={handleIssueSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={labelStyle}>Issue Type</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  style={inputStyle}
                >
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Student Concern">Student Concern</option>
                  <option value="Schedule Conflict">Schedule Conflict</option>
                  <option value="Resource Request">Resource Request</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Issue Description *</label>
                <textarea
                  rows={4}
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  placeholder="Describe the issue in detail so the admin team can help you quickly..."
                  style={{ ...inputStyle, resize: "vertical" }}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Priority</label>
                <div style={{ display: "flex", gap: 12 }}>
                  {["Low", "Medium", "High"].map((p) => (
                    <label
                      key={p}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 13.5,
                        color:
                          issuePriority === p
                            ? p === "High"
                              ? "#DC2626"
                              : p === "Medium"
                              ? "#D97706"
                              : "#059669"
                            : "#64748B",
                        background: issuePriority === p ? "#F8FAFC" : "transparent",
                        padding: "8px 16px",
                        border: `1.5px solid ${
                          issuePriority === p
                            ? p === "High"
                              ? "#FCA5A5"
                              : p === "Medium"
                              ? "#FDE68A"
                              : "#6EE7B7"
                            : "#E2E8F0"
                        }`,
                        borderRadius: 10,
                      }}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={issuePriority === p}
                        onChange={() => setIssuePriority(p)}
                        style={{ display: "none" }}
                      />
                      {p === "High" ? "🔴" : p === "Medium" ? "🟡" : "🟢"} {p}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submittingIssue}
                  style={{
                    ...btnPrimary,
                    background: "linear-gradient(135deg, #DC2626, #B91C1C)",
                  }}
                >
                  <AlertTriangle size={15} />
                  {submittingIssue ? "Submitting..." : "Submit Issue Report"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  STUDENT ALUMNI DIRECTORY (for role !== "alumni")       */
/* ─────────────────────────────────────────────────────── */
function StudentAlumniDirectory({ user, showToast }) {
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestTopic, setRequestTopic] = useState("Placement Advice");
  const [requestMessage, setRequestMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  const domains = [
    "All",
    "Technology & Coding",
    "Public Policy & Civil Services",
    "Core Engineering & Robotics",
    "Data Science & AI",
  ];

  const filteredMentors = ALUMNI_DIRECTORY.filter((m) => {
    const matchDomain = selectedDomain === "All" || m.domain === selectedDomain;
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.company.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()) ||
      m.expertise.some((e) => e.toLowerCase().includes(search.toLowerCase()));
    return matchDomain && matchSearch;
  });

  const handleSendMentorshipRequest = (e) => {
    e.preventDefault();
    if (!requestMessage.trim()) {
      showToast("Please enter a short message describing what guidance you need.", "error");
      return;
    }
    setSendingRequest(true);
    setTimeout(() => {
      setSendingRequest(false);
      showToast(
        `Mentorship request successfully sent to ${selectedMentor.name}! They will connect via email.`,
        "success"
      );
      setSelectedMentor(null);
      setRequestMessage("");
    }, 800);
  };

  return (
    <div className="alumni-page-container">
      {/* ── HERO BANNER (SHORT & BLUE) ─────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #0284C7 100%)",
          borderRadius: 18,
          padding: "18px 24px",
          color: "#FFFFFF",
          marginBottom: 20,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 8px 28px rgba(30, 58, 138, 0.22)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          {/* Left Column */}
          <div style={{ flex: "1 1 360px", minWidth: 260 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "#BFDBFE",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                padding: "3px 12px",
                borderRadius: 20,
                marginBottom: 6,
              }}
            >
              <GraduationCap size={12} /> Maatram Alumni Mentorship
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px", color: "#FFFFFF", lineHeight: 1.2 }}>
              Connect with Maatram Alumni Leaders
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", maxWidth: 580, lineHeight: 1.4, margin: 0 }}>
              Learn from senior scholars at Zoho, TCS, TN Govt initiatives, and core engineering firms.
            </p>
          </div>

          {/* Right Column: Stat Badges */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { val: "120+", lbl: "Active Mentors" },
              { val: "45+", lbl: "Companies" },
              { val: "100%", lbl: "Free for Scholars" },
            ].map((s) => (
              <div
                key={s.lbl}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                  padding: "8px 14px",
                  borderRadius: 12,
                  textAlign: "center",
                  minWidth: 80,
                }}
              >
                <strong style={{ display: "block", fontSize: 17, fontWeight: 900, color: "#FCD34D", lineHeight: 1.1 }}>
                  {s.val}
                </strong>
                <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.72)", fontWeight: 600 }}>{s.lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TOOLBAR & FILTERS ───────────────────────── */}
      <div className="alumni-toolbar">
        <div className="alumni-search-box">
          <Search size={18} color="#64748B" />
          <input
            type="text"
            placeholder="Search alumni by name, company, skill (e.g. Zoho, Python, UPSC)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="alumni-domain-filters">
          {domains.map((dom) => (
            <button
              key={dom}
              type="button"
              className={`alumni-domain-btn ${selectedDomain === dom ? "active" : ""}`}
              onClick={() => setSelectedDomain(dom)}
            >
              {dom}
            </button>
          ))}
        </div>
      </div>

      {/* ── ALUMNI CARDS GRID ───────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
          gap: 20,
        }}
      >
        {filteredMentors.map((mentor) => (
          <div
            key={mentor.id}
            style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(16px)",
              border: "1.5px solid #E2E8F0",
              borderRadius: 20,
              padding: 22,
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 4px 20px rgba(15,23,42,0.06)",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 14px 32px rgba(15,23,42,0.11)";
              e.currentTarget.style.borderColor = "#A7F3D0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(15,23,42,0.06)";
              e.currentTarget.style.borderColor = "#E2E8F0";
            }}
          >
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
              <img
                src={mentor.avatar}
                alt={mentor.name}
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2.5px solid #059669",
                  flexShrink: 0,
                }}
              />
              <div>
                <h3 style={{ fontSize: 16.5, fontWeight: 800, color: "#0F172A", margin: "0 0 3px" }}>
                  {mentor.name}
                </h3>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#059669", display: "block" }}>
                  {mentor.role}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                  <Building2 size={12} /> {mentor.company}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#64748B" }}>
                  <GraduationCap size={12} /> {mentor.batch}
                </span>
              </div>
            </div>

            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, margin: "0 0 12px" }}>{mentor.bio}</p>

            {mentor.assignedEvent && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  padding: "7px 11px",
                  borderRadius: 9,
                  fontSize: 11.5,
                  color: "#166534",
                  marginBottom: 12,
                }}
              >
                <Sparkles size={12} color="#16A34A" />
                <span>
                  Event Lead: <strong>{mentor.assignedEvent}</strong>
                </span>
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
              {mentor.expertise.map((skill) => (
                <span
                  key={skill}
                  style={{
                    background: "#F1F5F9",
                    color: "#334155",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 9px",
                    borderRadius: 10,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
              <button
                type="button"
                className="alumni-connect-btn"
                onClick={() => setSelectedMentor(mentor)}
              >
                <MessageSquare size={14} /> Request Mentorship
              </button>
              {mentor.linkedIn && (
                <a
                  href={mentor.linkedIn}
                  target="_blank"
                  rel="noreferrer"
                  className="alumni-linkedin-btn"
                  title="View LinkedIn Profile"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── MENTORSHIP REQUEST MODAL ─────────────────── */}
      {selectedMentor && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedMentor(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.55)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#FFFFFF",
              borderRadius: 20,
              maxWidth: 540,
              width: "100%",
              padding: 28,
              boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={selectedMentor.avatar}
                  alt={selectedMentor.name}
                  style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
                    Request Mentorship with {selectedMentor.name}
                  </h3>
                  <span style={{ fontSize: 13, color: "#64748B" }}>
                    {selectedMentor.role} at {selectedMentor.company}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMentor(null)}
                style={{
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 8px",
                  cursor: "pointer",
                  color: "#64748B",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendMentorshipRequest} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
                  Topic / Area of Guidance *
                </label>
                <select
                  value={requestTopic}
                  onChange={(e) => setRequestTopic(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1.5px solid #CBD5E1",
                    fontSize: 13.5,
                    fontFamily: "inherit",
                    outline: "none",
                    color: "#0F172A",
                  }}
                >
                  <option value="Placement Advice">Campus Placement & Aptitude Strategy</option>
                  <option value="Resume Review">Resume & Profile Audit</option>
                  <option value="Technical Interview Prep">Technical Mock Interview (Python, Web, Core)</option>
                  <option value="Civil Services Roadmap">UPSC / Civil Services Preparation</option>
                  <option value="Higher Education Guidance">GATE / Master's / Higher Studies in India or Abroad</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
                  Tell {selectedMentor.name} what specific help you need *
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Hi Anna/Akka, I am in 3rd year CSE preparing for software interviews..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 10,
                    border: "1.5px solid #CBD5E1",
                    fontSize: 13.5,
                    fontFamily: "inherit",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setSelectedMentor(null)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 12,
                    border: "1.5px solid #E2E8F0",
                    background: "#FFFFFF",
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    color: "#475569",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingRequest}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, #059669, #047857)",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Send size={15} />
                  {sendingRequest ? "Sending Request..." : "Send Mentorship Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  ROOT EXPORT (MOBILE & LAPTOP RESPONSIVE SWITCHER)     */
/* ─────────────────────────────────────────────────────── */
export default function AlumniPage() {
  const { user, showToast } = useApp();
  const isAlumni = user?.role === "alumni";
  const [viewMode, setViewMode] = useState(isAlumni ? "dashboard" : "directory");

  return (
    <div>
      {/* Top Switcher: Accessible by both mobile and laptop */}
      <div style={{ maxWidth: 1200, margin: "0 auto 12px", padding: "12px 20px 0", display: "flex", justifyContent: "flex-end" }}>
        <div style={{ background: "#E2E8F0", padding: "3px", borderRadius: 12, display: "inline-flex", gap: 3 }}>
          <button
            onClick={() => setViewMode("directory")}
            style={{
              padding: "7px 14px",
              borderRadius: 9,
              border: "none",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              background: viewMode === "directory" ? "#fff" : "transparent",
              color: viewMode === "directory" ? "#1E3A8A" : "#64748B",
              boxShadow: viewMode === "directory" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
            }}
          >
            👥 Alumni Mentors
          </button>
          <button
            onClick={() => setViewMode("dashboard")}
            style={{
              padding: "7px 14px",
              borderRadius: 9,
              border: "none",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              background: viewMode === "dashboard" ? "#1D4ED8" : "transparent",
              color: viewMode === "dashboard" ? "#fff" : "#64748B",
              boxShadow: viewMode === "dashboard" ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
            }}
          >
            🎓 Alumni Dashboard
          </button>
        </div>
      </div>

      {viewMode === "dashboard" ? (
        <AlumniDashboard user={user} showToast={showToast} />
      ) : (
        <StudentAlumniDirectory user={user} showToast={showToast} />
      )}
    </div>
  );
}
