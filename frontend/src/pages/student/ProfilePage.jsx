// frontend/src/pages/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Users,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Award,
  Clock,
  Sparkles,
  Camera,
  Edit3,
  CheckCircle2,
  FileCheck,
  HeartHandshake,
  Settings,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Download,
  Palette,
  Crown,
  Star,
  Shield,
  Coins,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { BADGES_LIST } from "../../data/mockData";
import { usersAPI } from "../../api/usersAPI";
import { adminAPI } from "../../api/adminAPI";
import "./StudentDashboard.css";

export default function ProfilePage() {
  const { user, updateProfile, showToast, gradingLevels: contextGradingLevels } = useApp();

  const currentUser = user || {
    name: "Student Volunteer",
    fullName: "Student Volunteer",
    id: "MAA001",
    applicationId: "MAA001",
    college: "",
    department: "",
    role: "student",
    points: 0,
    totalHours: 0,
    eventsJoined: 0,
    completedEventsCount: 0,
    badgesEarned: 0,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, points_ledger, badges, certificates, connect
  const [pointsHistory, setPointsHistory] = useState([]);
  const [gradingTiers, setGradingTiers] = useState([]);

  const [bgTheme, setBgTheme] = useState(() => {
    try {
      return localStorage.getItem("maatram_profile_theme") || "blue";
    } catch {
      return "blue";
    }
  });

  const handleThemeChange = (newTheme) => {
    setBgTheme(newTheme);
    try {
      localStorage.setItem("maatram_profile_theme", newTheme);
    } catch {}
    showToast(`Background theme set to ${newTheme === "blue" ? "Maatram Blue" : "Maatram Yellow"}!`);
  };

  const [editForm, setEditForm] = useState({
    name: currentUser.name || currentUser.fullName || "Student Volunteer",
    college: currentUser.college || "Anna University, Chennai",
    department: currentUser.department || "Information Technology",
    phone: currentUser.phone || "+91 9876543210",
    bio: currentUser.bio || "Passionate student volunteer enthusiastic about education outreach.",
    skills: Array.isArray(currentUser.skills) ? currentUser.skills.join(", ") : (currentUser.skills || ""),
  });

  // Fetch points history & grading tiers from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const pRes = await usersAPI.getPointsHistory();
        if (pRes && pRes.data) {
          setPointsHistory(pRes.data);
        }
        const gRes = await adminAPI.getGradingLevels();
        if (gRes && gRes.data) {
          setGradingTiers(gRes.data);
        }
      } catch (err) {
        console.warn("Profile data fetch notice:", err.message);
      }
    };
    fetchData();
  }, []);

  // 6 Tier System: 100 Bronze, 250 Silver, 500 Gold, 1000 Diamond, 1500 Platinum, 2000 Green Gem
  const TIERS_CONFIG = [
    { tier: "Bronze", name: "Bronze Volunteer", minPoints: 0, targetPoints: 100, color: "#CD7F32", milestoneLabel: "100+ pts" },
    { tier: "Silver", name: "Silver Volunteer", minPoints: 100, targetPoints: 250, color: "#94A3B8", milestoneLabel: "250+ pts" },
    { tier: "Gold", name: "Gold Volunteer", minPoints: 250, targetPoints: 500, color: "#EAB308", milestoneLabel: "500+ pts" },
    { tier: "Diamond", name: "Diamond Volunteer", minPoints: 500, targetPoints: 1000, color: "#06B6D4", milestoneLabel: "1000+ pts" },
    { tier: "Platinum", name: "Platinum Volunteer", minPoints: 1000, targetPoints: 1500, color: "#6366F1", milestoneLabel: "1500+ pts" },
    { tier: "Green Gem", name: "Green Gem Volunteer", minPoints: 1500, targetPoints: 2000, color: "#10B981", milestoneLabel: "2000+ pts" },
  ];

  const userPoints = Number(currentUser.points) || 0;
  
  // Find current tier & next tier
  let currentTier = TIERS_CONFIG[0];
  let nextTier = TIERS_CONFIG[1];
  for (let i = 0; i < TIERS_CONFIG.length; i++) {
    if (userPoints >= TIERS_CONFIG[i].minPoints) {
      currentTier = TIERS_CONFIG[i];
      nextTier = TIERS_CONFIG[i + 1] || null;
    }
  }

  const targetPts = nextTier ? nextTier.minPoints : currentTier.targetPoints;
  const pointsNeeded = Math.max(0, targetPts - userPoints);

  // Calculate accurate blue bar fill percent across the 6-milestone scale (0 to 2000 pts)
  const calculateTrackFill = (pts) => {
    const p = Math.max(0, pts);
    const segCount = TIERS_CONFIG.length;
    const segW = 100 / segCount; // ~16.66% per tier
    for (let i = 0; i < TIERS_CONFIG.length; i++) {
      const min = TIERS_CONFIG[i].minPoints;
      const max = TIERS_CONFIG[i].targetPoints;
      if (p < max) {
        const ratio = (p - min) / (max - min);
        return Math.min(100, Math.max(3, i * segW + ratio * segW));
      }
    }
    return 100;
  };
  const progressPercent = calculateTrackFill(userPoints);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("Image size must be under 2MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await updateProfile({ avatar: reader.result });
          showToast("Profile photo permanently saved to database!");
        } catch (err) {
          showToast(err.message || "Failed to save photo", "error");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const skillsArray = editForm.skills
      ? (typeof editForm.skills === "string" ? editForm.skills.split(",").map((s) => s.trim()).filter(Boolean) : editForm.skills)
      : [];

    const updates = {
      name: editForm.name.trim(),
      fullName: editForm.name.trim(),
      college: editForm.college.trim(),
      department: editForm.department.trim(),
      phone: editForm.phone.trim(),
      bio: editForm.bio.trim(),
      skills: skillsArray,
    };

    updateProfile(updates);
    showToast("Profile saved successfully!");
    setIsEditing(false);
  };

  return (
    <div
      className="dashboard-container profile-container-themed"
      style={{
        background:
          bgTheme === "yellow"
            ? "radial-gradient(ellipse at 10% 10%, rgba(255, 214, 41, 0.20), transparent 45%), #FFFDF5"
            : "radial-gradient(ellipse at 10% 10%, rgba(37, 99, 235, 0.15), transparent 45%), #F8FAFC",
        borderRadius: 24,
        padding: "24px 20px 48px",
        transition: "background 0.3s ease",
      }}
    >
      {/* THEME BAR */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "12px 18px",
          background: "#FFFFFF",
          borderRadius: 16,
          border: "1.5px solid #E2E8F0",
          marginBottom: 20,
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 700, color: "#1E293B" }}>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => handleThemeChange("blue")}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: bgTheme === "blue" ? "2px solid #1D4ED8" : "1.5px solid #CBD5E1",
              background: bgTheme === "blue" ? "#2563EB" : "#F8FAFC",
              color: bgTheme === "blue" ? "#FFFFFF" : "#475569",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Maatram Blue
          </button>
          <button
            type="button"
            onClick={() => handleThemeChange("yellow")}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: bgTheme === "yellow" ? "2px solid #D97706" : "1.5px solid #CBD5E1",
              background: bgTheme === "yellow" ? "#FFD629" : "#F8FAFC",
              color: bgTheme === "yellow" ? "#0F172A" : "#475569",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Maatram Yellow
          </button>
        </div>
      </div>

      {/* PROFILE HERO CARD */}
      <div
        className={`profile-hero-card profile-hero-${bgTheme}`}
        style={{
          background:
            bgTheme === "yellow"
              ? "linear-gradient(135deg, #FFF9DB 0%, #FFF3B8 50%, #FFE98A 100%)"
              : "linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #1D4ED8 100%)",
          border: bgTheme === "yellow" ? "2px solid #FDE68A" : "2px solid #3B82F6",
          color: bgTheme === "yellow" ? "#0F172A" : "#FFFFFF",
          boxShadow: "0 8px 28px rgba(0,0,0,0.08)",
        }}
      >
        <div className="profile-hero-top">
          <div className="profile-avatar-wrap">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="profile-big-avatar"
              />
            ) : (
              <div
                className="profile-big-avatar"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#FFD629",
                  color: "#151515",
                  fontSize: 36,
                  fontWeight: 800,
                }}
              >
                {(currentUser.name || "S")[0]?.toUpperCase()}
              </div>
            )}
            <label className="avatar-upload-btn" title="Update Profile Photo">
              <Camera size={15} color="#151515" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
            </label>
          </div>

          <div className="profile-hero-info">
            <div className="profile-name-row">
              <h2 style={{ color: bgTheme === "yellow" ? "#0F172A" : "#FFFFFF" }}>{currentUser.name}</h2>
              <span
                className="app-id-pill"
                style={{
                  background: bgTheme === "yellow" ? "#FEF08A" : "rgba(255,255,255,0.2)",
                  color: bgTheme === "yellow" ? "#854D0E" : "#FFFFFF",
                }}
              >
                {currentUser.applicationId || currentUser.id || "MAA001"}
              </span>

              {/* Achievement Badge Tier Pill */}
              <span
                style={{
                  background: "#FFFFFF",
                  color: "#0F172A",
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              >
                🏆 {currentTier.name}
              </span>
            </div>

            <p className="profile-hero-college" style={{ color: bgTheme === "yellow" ? "#475569" : "#E2E8F0" }}>
              <GraduationCap size={16} /> {currentUser.department} • {currentUser.college}
            </p>

            <div className="profile-hero-contacts">
              <span style={{ color: bgTheme === "yellow" ? "#475569" : "#E2E8F0" }}>
                <Mail size={14} /> {currentUser.email}
              </span>
              <span style={{ color: bgTheme === "yellow" ? "#475569" : "#E2E8F0" }}>
                <Phone size={14} /> {currentUser.phone || "+91 9876543210"}
              </span>
            </div>
          </div>

          <button
            className="profile-edit-trigger-btn"
            onClick={() => setIsEditing((prev) => !prev)}
            style={{
              background: bgTheme === "yellow" ? "#0F172A" : "#FFFFFF",
              color: bgTheme === "yellow" ? "#FFD629" : "#0F172A",
              border: "none",
            }}
          >
            <Edit3 size={15} /> {isEditing ? "Cancel Edit" : "Edit Profile"}
          </button>
        </div>

        {/* 4 HERO STAT COUNTERS */}
        <div
          className="profile-stats-bar"
          style={{
            background: bgTheme === "yellow" ? "#FEF9C3" : "#0F172A",
            borderTop: bgTheme === "yellow" ? "1.5px solid #FDE68A" : "1.5px solid rgba(255,255,255,0.1)",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
          }}
        >
          <div className="profile-stat-cell">
            <strong style={{ color: bgTheme === "yellow" ? "#854D0E" : "#FFD629" }}>
              {userPoints}
            </strong>
            <span style={{ color: bgTheme === "yellow" ? "#64748B" : "#94A3B8" }}>Volunteering Points</span>
          </div>
          <div className="profile-stat-cell">
            <strong style={{ color: bgTheme === "yellow" ? "#0F172A" : "#FFFFFF" }}>
              {currentUser.badgesEarned || 1}
            </strong>
            <span style={{ color: bgTheme === "yellow" ? "#64748B" : "#94A3B8" }}>Badges Earned</span>
          </div>
          <div className="profile-stat-cell">
            <strong style={{ color: bgTheme === "yellow" ? "#0F172A" : "#FFFFFF" }}>
              {currentUser.completedEventsCount || currentUser.eventsJoined || 0}
            </strong>
            <span style={{ color: bgTheme === "yellow" ? "#64748B" : "#94A3B8" }}>Completed Events</span>
          </div>
          <div className="profile-stat-cell">
            <strong style={{ color: bgTheme === "yellow" ? "#0F172A" : "#FFFFFF" }}>
              {currentTier.tier}
            </strong>
            <span style={{ color: bgTheme === "yellow" ? "#64748B" : "#94A3B8" }}>Achievement Tier</span>
          </div>
        </div>
      </div>

      {/* ACHIEVEMENT TIER PROGRESS BAR */}
      <div
        style={{
          background: "#FFFFFF",
          padding: "20px 24px",
          borderRadius: 16,
          border: "1px solid #E2E8F0",
          marginTop: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <strong style={{ fontSize: 15, color: "#0F172A" }}>
              Volunteer Ranking: {currentTier.name}
            </strong>
            <span style={{ fontSize: 13, color: "#64748B", display: "block" }}>
              {nextTier
                ? `${pointsNeeded} points needed to reach ${nextTier.name}`
                : "You have achieved the highest Green Gem Volunteer ranking!"}
            </span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#0066CC" }}>
            {userPoints} / {targetPts} pts
          </span>
        </div>

        <div style={{ height: 10, background: "#E2E8F0", borderRadius: 8, overflow: "hidden" }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              background: "linear-gradient(90deg, #0066CC, #38BDF8)",
              borderRadius: 8,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* Tier Badges Row */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          {TIERS_CONFIG.map((t) => (
            <div
              key={t.tier}
              style={{
                textAlign: "center",
                opacity: userPoints >= t.minPoints ? 1 : 0.45,
                flex: 1,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", display: "block" }}>
                {t.name}
              </span>
              <span style={{ fontSize: 11, color: "#64748B" }}>{t.milestoneLabel}</span>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT PROFILE FORM MODAL */}
      {isEditing && (
        <div className="profile-edit-box">
          <h3>Edit Volunteer Profile</h3>
          <form onSubmit={handleSaveProfile} className="edit-form-grid">
            <div className="register-field">
              <label>Full Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="register-field">
              <label>Phone Number</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="register-field">
              <label>College / Institution</label>
              <input
                type="text"
                value={editForm.college}
                onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                required
              />
            </div>
            <div className="register-field">
              <label>Department</label>
              <input
                type="text"
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              />
            </div>
            <div className="register-field" style={{ gridColumn: "1 / -1" }}>
              <label>Short Bio</label>
              <textarea
                rows={2}
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="apply-textarea"
              />
            </div>
            <div className="register-field" style={{ gridColumn: "1 / -1" }}>
              <label>Skills & Interests (comma-separated)</label>
              <input
                type="text"
                value={editForm.skills}
                onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
              />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className="dash-btn dash-btn-primary">
                Save Changes
              </button>
              <button
                type="button"
                className="dash-btn dash-btn-outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PROFILE TABS */}
      <div className="profile-content-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview & Bio
        </button>
        <button
          className={`tab-btn ${activeTab === "points_ledger" ? "active" : ""}`}
          onClick={() => setActiveTab("points_ledger")}
        >
          Points & Contribution Ledger ({pointsHistory.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "badges" ? "active" : ""}`}
          onClick={() => setActiveTab("badges")}
        >
          Badges
        </button>
        <button
          className={`tab-btn ${activeTab === "connect" ? "active" : ""}`}
          onClick={() => setActiveTab("connect")}
        >
          Network & Connections
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="profile-tab-grid">
          <div className="profile-card-section">
            <h3>About Me</h3>
            <p className="profile-bio-text">{currentUser.bio || "Passionate student volunteer enthusiastic about education outreach."}</p>

            <h4 style={{ marginTop: 20, marginBottom: 8, fontSize: 14 }}>
              Skills & Expertise
            </h4>
            <div className="profile-skills-row">
              {(currentUser.skills || ["Mentoring", "Public Speaking", "Event Coordination"]).map(
                (skill, idx) => (
                  <span key={idx} className="skill-pill-large">
                    {skill}
                  </span>
                )
              )}
            </div>

            <h4 style={{ marginTop: 20, marginBottom: 8, fontSize: 14 }}>
              Social Impact Interests
            </h4>
            <div className="profile-skills-row">
              {["Education", "Youth Development", "Environment"].map((interest, idx) => (
                <span key={idx} className="interest-pill">
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* QUICK SHORTCUTS */}
          <div className="profile-card-section">
            <h3>Quick Links</h3>
            <div className="profile-menu-links">
              <Link to="/contributions" className="profile-menu-row">
                <div className="menu-left">
                  <HeartHandshake size={18} color="#FFD629" />
                  <span>My Impact Points & Activity</span>
                </div>
                <ChevronRight size={16} color="#717784" />
              </Link>
              <Link to="/applications" className="profile-menu-row">
                <div className="menu-left">
                  <FileCheck size={18} color="#20A464" />
                  <span>My Applications</span>
                </div>
                <ChevronRight size={16} color="#717784" />
              </Link>
              <Link to="/connect" className="profile-menu-row">
                <div className="menu-left">
                  <Users size={18} color="#3B82F6" />
                  <span>Peer Connections</span>
                </div>
                <ChevronRight size={16} color="#717784" />
              </Link>
              <Link to="/reports" className="profile-menu-row">
                <div className="menu-left">
                  <Download size={18} color="#6366F1" />
                  <span>Download Volunteer Certificate</span>
                </div>
                <ChevronRight size={16} color="#717784" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: POINTS LEDGER (Exact Requirement) */}
      {activeTab === "points_ledger" && (
        <div className="dash-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #E2E8F0" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0F172A" }}>
              Complete Points Transaction History
            </h3>
            <span style={{ fontSize: 12.5, color: "#64748B" }}>
              Verified ledger of points earned from completed drives and official coordinator remarks.
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Event / Context</th>
                  <th>Points</th>
                  <th>Reason</th>
                  <th>Admin Remarks</th>
                </tr>
              </thead>
              <tbody>
                {pointsHistory.length > 0 ? (
                  pointsHistory.map((tx) => (
                    <tr key={tx._id || tx.id}>
                      <td>{new Date(tx.date || tx.createdAt).toLocaleDateString()}</td>
                      <td>
                        <strong>{tx.eventName || "Volunteering Activity"}</strong>
                      </td>
                      <td>
                        <strong
                          style={{
                            color: tx.type === "DEBIT" || tx.points < 0 ? "#DC2626" : "#16A34A",
                            fontSize: 14,
                          }}
                        >
                          {tx.type === "DEBIT" || tx.points < 0 ? `${tx.points}` : `+${tx.points}`} pts
                        </strong>
                      </td>
                      <td>{tx.reason}</td>
                      <td style={{ color: "#64748B" }}>{tx.adminRemarks || "Verified"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "#64748B" }}>
                      No points transactions recorded yet. Join and complete volunteering drives to earn points!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BADGES */}
      {activeTab === "badges" && (
        <div className="badges-grid-tab">
          {BADGES_LIST.map((badge) => (
            <div key={badge.id} className={`profile-badge-card ${badge.unlocked ? "unlocked" : "locked"}`}>
              <div className="badge-icon-circ">
                <Award size={26} color={badge.unlocked ? "#FFD629" : "#717784"} />
              </div>
              <h4>{badge.title}</h4>
              <p>{badge.desc}</p>
              <span className="badge-state-tag">{badge.unlocked ? "Earned" : "Locked"}</span>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: CONNECT */}
      {activeTab === "connect" && (
        <div style={{ background: "#FFFFFF", padding: "32px", borderRadius: 16, textAlign: "center", border: "1px solid #E2E8F0" }}>
          <Users size={40} color="#0066CC" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Peer Connections & Collaboration</h3>
          <p style={{ color: "#64748B", fontSize: 14, maxWidth: 500, margin: "0 auto 20px" }}>
            Connect with student volunteers from other colleges to form teams for large-scale social drives.
          </p>
          <Link to="/connect" className="dash-btn dash-btn-primary">
            Open Maatram Connect Directory <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
