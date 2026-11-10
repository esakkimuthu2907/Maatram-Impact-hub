// frontend/src/components/common/StudentProfileDrawer.jsx
// Detailed Profile Drawer/Modal for Administrators (Phase 6)

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ExternalLink,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Calendar,
  Award,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Tag,
  Star,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import "./StudentProfileDrawer.css";

export default function StudentProfileDrawer({
  isOpen,
  onClose,
  student,
  onToggleStatus,
}) {
  const navigate = useNavigate();

  if (!isOpen || !student) return null;

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
    skills = ["Public Speaking", "Event Management", "Teaching", "Youth Outreach"],
    applications = [],
    createdAt,
    lastActiveAt,
  } = student;

  const studentId = student._id || student.id || applicationId;

  // Real activity status computation
  const computeActivityText = (date) => {
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

  const activityBadge = computeActivityText(lastActiveAt || createdAt);

  const joinedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "15 Aug 2024";

  return (
    <div className="profile-drawer-overlay" onClick={onClose}>
      <div className="profile-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header-bar">
          <span className="drawer-subheading">STUDENT PROFILE</span>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="drawer-profile-hero">
          <div className="drawer-avatar-circle">
            {fullName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </div>
          <div className="drawer-hero-details">
            <h3 className="drawer-student-name">{fullName}</h3>
            <p className="drawer-roll-dept">
              <span>{rollNumber}</span> &bull; <span>{department}</span>
            </p>
            <div className="drawer-status-chips">
              <span className={`drawer-status-pill ${status}`}>
                {status === "active" ? "● Active" : "● Inactive"}
              </span>
              <span className="drawer-activity-pill">{activityBadge}</span>
              <span className="drawer-batch-pill">Batch {batch}</span>
            </div>
          </div>
        </div>

        {/* 4 Quick Stat Counters */}
        <div className="drawer-stats-grid">
          <div className="drawer-stat-item">
            <span className="drawer-stat-label">Events</span>
            <span className="drawer-stat-val">{eventsJoined || applications.length || 0}</span>
          </div>
          <div className="drawer-stat-item">
            <span className="drawer-stat-label">Hours</span>
            <span className="drawer-stat-val">{totalHours}h</span>
          </div>
          <div className="drawer-stat-item">
            <span className="drawer-stat-label">Points</span>
            <span className="drawer-stat-val gold">{points.toLocaleString()}</span>
          </div>
          <div className="drawer-stat-item">
            <span className="drawer-stat-label">Rating</span>
            <span className="drawer-stat-val rating">{rating} ★</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="drawer-scroll-body">
          {/* Personal Information */}
          <div className="drawer-section">
            <h4 className="drawer-section-heading">Personal Information</h4>
            <div className="drawer-info-list">
              <div className="drawer-info-row">
                <span className="row-label">
                  <Mail size={13} /> Email
                </span>
                <span className="row-value">{email}</span>
              </div>
              <div className="drawer-info-row">
                <span className="row-label">
                  <Phone size={13} /> Phone
                </span>
                <span className="row-value">{phone || "+91 98765 43210"}</span>
              </div>
              <div className="drawer-info-row">
                <span className="row-label">
                  <Building size={13} /> College
                </span>
                <span className="row-value">{college}</span>
              </div>
              <div className="drawer-info-row">
                <span className="row-label">
                  <MapPin size={13} /> Zone
                </span>
                <span className="row-value zone-tag">{zone}</span>
              </div>
              <div className="drawer-info-row">
                <span className="row-label">
                  <GraduationCap size={13} /> Department
                </span>
                <span className="row-value">{department}</span>
              </div>
              <div className="drawer-info-row">
                <span className="row-label">
                  <Calendar size={13} /> Joined Date
                </span>
                <span className="row-value">{joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Volunteer Skills */}
          <div className="drawer-section">
            <h4 className="drawer-section-heading">Volunteer Skills</h4>
            <div className="drawer-skills-wrap">
              {(Array.isArray(skills) ? skills : [skills]).map((skill, idx) => (
                <span key={idx} className="drawer-skill-chip">
                  <Tag size={11} color="#EAB308" /> {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Events Participated */}
          <div className="drawer-section">
            <h4 className="drawer-section-heading">
              Recent Volunteering Drives ({applications.length})
            </h4>
            {applications.length === 0 ? (
              <p className="drawer-empty-text">No drive participations yet.</p>
            ) : (
              <div className="drawer-events-list">
                {applications.slice(0, 3).map((app) => (
                  <div key={app.id || app._id} className="drawer-event-mini-item">
                    <div>
                      <h5 className="mini-event-title">{app.opportunityTitle || "Volunteering Drive"}</h5>
                      <span className="mini-event-date">{app.eventDate || "15 Nov 2026"}</span>
                    </div>
                    <span className={`mini-event-status ${app.status.toLowerCase()}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="drawer-footer-actions">
          <button
            type="button"
            className="drawer-full-profile-btn"
            onClick={() => {
              onClose();
              navigate(`/admin/users/${studentId}`);
            }}
          >
            View Full Profile <ExternalLink size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
