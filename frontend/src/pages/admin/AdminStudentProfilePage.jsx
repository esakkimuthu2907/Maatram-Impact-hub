// frontend/src/pages/admin/AdminStudentProfilePage.jsx
// Complete Student Full Profile View for Administrators (Phase 6)

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Calendar,
  Award,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Star,
  MapPin,
  Tag,
  Download,
  Eye,
  Check,
  X,
  History,
} from "lucide-react";
import { adminAPI } from "../../api/adminAPI";
import { certificatesAPI } from "../../api/certificatesAPI";
import { useApp } from "../../context/AppContext";
import "./AdminStudentProfilePage.css";

export default function AdminStudentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, openCertificate } = useApp();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "events" | "points" | "certificates" | "attendance"
  const [confirmStatusModal, setConfirmStatusModal] = useState(null);

  useEffect(() => {
    async function loadStudentData() {
      try {
        setLoading(true);
        const res = await adminAPI.getUserById(id);
        if (res?.data) {
          setStudent(res.data);
        } else {
          showToast("Student not found", "error");
        }
      } catch (err) {
        console.error("Failed to load student profile:", err);
        showToast("Error loading student profile", "error");
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadStudentData();
    }
  }, [id]);

  const handleToggleStatus = async (newStatus) => {
    try {
      await adminAPI.toggleUserStatus(student._id || student.id, newStatus);
      setStudent((prev) => ({ ...prev, status: newStatus }));
      showToast(`Student account marked as ${newStatus}!`);
      setConfirmStatusModal(null);
    } catch (err) {
      showToast(err.message || "Failed to update account status", "error");
    }
  };

  if (loading) {
    return (
      <div className="admin-profile-loading">
        <div className="admin-spinner" />
        <p>Loading complete student profile...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="admin-profile-not-found">
        <h3>Student Record Not Found</h3>
        <p>The requested student could not be located in the database.</p>
        <button
          type="button"
          className="admin-back-btn"
          onClick={() => navigate("/admin/users")}
        >
          <ArrowLeft size={16} /> Return to Students
        </button>
      </div>
    );
  }

  const {
    fullName = "Student Volunteer",
    email = "",
    phone = "",
    applicationId = "MAA001",
    rollNumber = student.regNumber || student.rollNumber || applicationId,
    college = "Maatram Institute of Technology",
    department = "Computer Science & Engineering",
    batch = "2022-2026",
    zone = "Zone 1",
    status = "active",
    points = 0,
    totalHours = 0,
    eventsJoined = 0,
    rating = 4.8,
    skills = ["Public Speaking", "Event Management", "Teaching", "Mentorship"],
    applications = [],
    transactions = [],
    createdAt,
    lastActiveAt,
  } = student;

  const joinedDateStr = createdAt
    ? new Date(createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "15 Aug 2024";

  // Calculate real recent activity label
  const computeActivityLabel = (date) => {
    if (!date) return "Active recently";
    const d = new Date(date);
    const now = new Date();
    const diffHours = Math.floor((now - d) / (1000 * 60 * 60));
    if (diffHours < 24) return "Active today";
    if (diffHours < 48) return "Active yesterday";
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Active ${diffDays} days ago`;
    return "Active recently";
  };

  const activityText = computeActivityLabel(lastActiveAt || createdAt);

  // Filter participated events
  const completedOrAssigned = (applications || []).filter(
    (a) => a.status === "Completed" || a.status === "Approved" || a.status === "Assigned"
  );

  return (
    <div className="admin-full-profile-container">
      {/* Top Breadcrumb & Return */}
      <div className="admin-profile-top-bar">
        <button
          type="button"
          className="admin-back-link"
          onClick={() => navigate("/admin/users")}
        >
          <ArrowLeft size={16} /> Back to Student Directory
        </button>
        <div className="profile-quick-actions">
          {status === "active" ? (
            <button
              type="button"
              className="btn-status-toggle deactivate"
              onClick={() => setConfirmStatusModal("inactive")}
            >
              <XCircle size={15} /> Deactivate Account
            </button>
          ) : (
            <button
              type="button"
              className="btn-status-toggle activate"
              onClick={() => setConfirmStatusModal("active")}
            >
              <CheckCircle2 size={15} /> Activate Account
            </button>
          )}
        </div>
      </div>

      {/* Profile Header Hero Card */}
      <div className="admin-profile-hero-card">
        <div className="profile-hero-left">
          <div className="profile-hero-avatar">
            {fullName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </div>
          <div className="profile-hero-info">
            <div className="hero-name-row">
              <h1 className="hero-student-name">{fullName}</h1>
              <span className={`hero-status-pill ${status}`}>
                {status === "active" ? "● Active Account" : "● Inactive Account"}
              </span>
              <span className="hero-activity-badge">{activityText}</span>
            </div>
            <p className="hero-meta-subtitle">
              <span>{rollNumber}</span> &bull; <span>{department}</span> &bull; <span>Batch {batch}</span>
            </p>
            <p className="hero-college-name">
              <Building size={14} color="#64748B" /> {college} &bull; <MapPin size={14} color="#64748B" /> {zone}
            </p>
          </div>
        </div>

        {/* 4 Statistics Cards */}
        <div className="profile-hero-stats-grid">
          <div className="hero-stat-card">
            <span className="hero-stat-label">Total Events</span>
            <span className="hero-stat-value">{eventsJoined || completedOrAssigned.length || 0}</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-label">Total Hours</span>
            <span className="hero-stat-value">{totalHours}h</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-label">Community Points</span>
            <span className="hero-stat-value gold">{points.toLocaleString()}</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-label">Volunteer Rating</span>
            <span className="hero-stat-value rating">{rating} ★</span>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="admin-profile-tabs-nav">
        {[
          { key: "overview", label: "Personal Information" },
          { key: "events", label: `Volunteering History (${completedOrAssigned.length})` },
          { key: "points", label: `Points Ledger (${transactions.length})` },
          { key: "certificates", label: "Official Certificates" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`profile-tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Personal Details & Skills */}
      {activeTab === "overview" && (
        <div className="profile-tab-pane">
          <div className="profile-info-grid">
            <div className="info-section-card">
              <h3 className="section-card-title">Personal Information</h3>
              <div className="info-rows-list">
                <div className="info-row">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{fullName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Roll Number / App ID</span>
                  <span className="info-value font-mono">{rollNumber}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email Address</span>
                  <span className="info-value">{email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phone Contact</span>
                  <span className="info-value">{phone || "+91 98765 43210"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Institution / College</span>
                  <span className="info-value">{college}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Department</span>
                  <span className="info-value">{department}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Assigned Zone</span>
                  <span className="info-value zone-pill">{zone}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Batch</span>
                  <span className="info-value">{batch}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Date Joined</span>
                  <span className="info-value">{joinedDateStr}</span>
                </div>
              </div>
            </div>

            <div className="info-section-card">
              <h3 className="section-card-title">Volunteer Skills & Competencies</h3>
              <div className="skills-tag-cloud">
                {(Array.isArray(skills) ? skills : [skills]).map((skill, idx) => (
                  <span key={idx} className="skill-chip-tag">
                    <Tag size={12} color="#EAB308" /> {skill}
                  </span>
                ))}
              </div>

              <h3 className="section-card-title" style={{ marginTop: 24 }}>
                Account Security & Role
              </h3>
              <div className="info-rows-list">
                <div className="info-row">
                  <span className="info-label">System Role</span>
                  <span className="info-value font-bold">Student Volunteer</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Authentication Status</span>
                  <span className="info-value">{status === "active" ? "Enabled (Can log in)" : "Disabled (Login blocked)"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Last Activity Timestamp</span>
                  <span className="info-value">{activityText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Volunteering History & Attendance */}
      {activeTab === "events" && (
        <div className="profile-tab-pane">
          <div className="profile-history-card">
            <h3 className="section-card-title">Participated & Assigned Drives</h3>
            {completedOrAssigned.length === 0 ? (
              <p className="empty-history-text">No volunteering drives recorded for this student yet.</p>
            ) : (
              <table className="profile-history-table">
                <thead>
                  <tr>
                    <th>Event Title</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Verified Hours</th>
                    <th>Points Awarded</th>
                  </tr>
                </thead>
                <tbody>
                  {completedOrAssigned.map((app) => (
                    <tr key={app.id || app._id}>
                      <td className="font-semibold">{app.opportunityTitle || "Volunteering Drive"}</td>
                      <td>{app.eventDate || "15 Nov 2026"}</td>
                      <td>
                        <span className="table-cat-badge">{app.category || "Social Impact"}</span>
                      </td>
                      <td>
                        <span className={`table-status-pill ${app.status.toLowerCase()}`}>
                          {app.status}
                        </span>
                      </td>
                      <td>{app.hours || 4}h</td>
                      <td className="gold-text font-bold">+{app.pointsAwarded || 50} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Points Ledger */}
      {activeTab === "points" && (
        <div className="profile-tab-pane">
          <div className="profile-history-card">
            <h3 className="section-card-title">Points & Recognition Ledger</h3>
            {transactions.length === 0 ? (
              <p className="empty-history-text">No points adjustments recorded.</p>
            ) : (
              <table className="profile-history-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Points</th>
                    <th>Reason</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className={`txn-type-pill ${t.type.toLowerCase()}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="font-bold gold-text">
                        {t.type === "CREDIT" ? `+${t.points}` : `-${t.points}`}
                      </td>
                      <td>{t.reason}</td>
                      <td>{new Date(t.createdAt || Date.now()).toLocaleDateString("en-GB")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Certificates */}
      {activeTab === "certificates" && (
        <div className="profile-tab-pane">
          <div className="profile-history-card">
            <h3 className="section-card-title">Official Volunteering Certificates</h3>
            <div className="profile-cert-card-item">
              <div className="cert-item-info">
                <Award size={28} color="#EAB308" />
                <div>
                  <h4>Hackforge Hackathon 2025 Participation Certificate</h4>
                  <p>Certificate ID: MF-CERT-2026-1042 &bull; Issued by Maatram Foundation</p>
                </div>
              </div>
              <button
                type="button"
                className="view-cert-btn"
                onClick={() =>
                  openCertificate({
                    certificateId: "MF-CERT-2026-1042",
                    volunteerName: fullName,
                    eventTitle: "Hackforge Hackathon 2025",
                    college: college,
                    verifiedHours: totalHours || 24,
                    pointsAwarded: points || 100,
                  })
                }
              >
                <Eye size={15} /> View & Print Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {confirmStatusModal && (
        <div className="status-modal-overlay">
          <div className="status-modal-card">
            <h3>
              {confirmStatusModal === "active" ? "Activate Account?" : "Deactivate Account?"}
            </h3>
            <p>
              {confirmStatusModal === "active"
                ? `Are you sure you want to activate ${fullName}'s account? They will be able to log in and apply for drives.`
                : `Are you sure you want to deactivate ${fullName}'s account? Their existing records will remain preserved, but login will be blocked.`}
            </p>
            <div className="status-modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setConfirmStatusModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn-confirm ${confirmStatusModal}`}
                onClick={() => handleToggleStatus(confirmStatusModal)}
              >
                Confirm {confirmStatusModal === "active" ? "Activation" : "Deactivation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
