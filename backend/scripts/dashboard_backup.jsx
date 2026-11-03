import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Award,
  Zap,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Users,
  Compass,
  FileCheck,
  Star,
  Sparkles,
  Crown,
  Shield,
  Trophy,
  BookOpen,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { BADGES_LIST } from "../../data/mockData";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const { user = {}, opportunities = [], applications = [] } = useApp();
  const navigate = useNavigate();

  // Filter approved or registered upcoming events safely
  const myRegisteredEvents = (applications || []).filter((app) => app?.status !== "Cancelled");
  const upcomingOpportunities = (opportunities || []).slice(0, 3);
  const recommendedOpportunities = (opportunities || []).slice(3, 6);

  const userPoints = Number(user?.points) || 0;
  const eventsCount = user?.eventsJoined ?? (myRegisteredEvents.length > 0 ? myRegisteredEvents.length : 0);
  const badgesCount = user?.badgesEarned ?? (userPoints > 0 ? 1 : 0);
  const streakDays = user?.streakDays ?? (userPoints > 0 ? 3 : 0);

  const currentTier =
    userPoints >= 500 ? "Platinum" : userPoints >= 250 ? "Gold" : userPoints >= 100 ? "Silver" : "Bronze";
  const nextTierPoints = userPoints < 100 ? 100 : userPoints < 250 ? 250 : userPoints < 500 ? 500 : 500;
  const nextTierName =
    userPoints < 100 ? "Silver" : userPoints < 250 ? "Gold" : userPoints < 500 ? "Platinum" : "Platinum Elite";
  const progressPercent =
    userPoints >= 500 ? 100 : Math.min(100, Math.round((userPoints / nextTierPoints) * 100));

  const currentDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="dashboard-container" style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 20px" }}>
      {/* SECTION A: WELCOME HEADER */}
      <section
        className="dashboard-welcome-banner"
        style={{
          background: "linear-gradient(135deg, #FFFDF0 0%, #FFFFFF 100%)",
          border: "1.5px solid #FFD629",
          borderRadius: 20,
          padding: "28px 32px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          marginBottom: 32,
          boxShadow: "0 4px 20px rgba(255, 214, 41, 0.12)",
        }}
      >
        <div className="welcome-text-col" style={{ maxWidth: 640 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFF9DB", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 10 }}>
            <Sparkles size={14} color="#D97706" /> {currentDate}
          </div>
          <h1 style={{ fontSize: "clamp(22px, 2.5vw, 28px)", fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
            Vanakkam, {user?.fullName || user?.name || "Student Leader"}! 👋
          </h1>
          <p style={{ color: "#64748B", fontSize: 14.5, margin: 0, lineHeight: 1.6 }}>
            Track your social impact points, review your volunteering drives, and climb the Maatram student leadership rankings.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Link
            to="/opportunities"
            className="dash-btn dash-btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              boxShadow: "0 4px 14px rgba(255, 214, 41, 0.4)",
            }}
          >
            <Compass size={16} /> Explore Open Drives
          </Link>
          <Link
            to="/leaderboard"
            className="dash-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              color: "#1E293B",
            }}
          >
            <Trophy size={16} color="#F59E0B" /> Leaderboard
          </Link>
        </div>
      </section>

      {/* SECTION B: 4 STATS CARDS (100% POINTS BASED) */}
      <div
        className="stats-cards-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        {/* Total Points */}
        <Link to="/leaderboard" className="stat-card" style={{ textDecoration: "none", color: "inherit", borderLeft: "4px solid #FFD629" }}>
          <div className="stat-icon-wrap yellow">
            <Star size={22} color="#D97706" fill="#D97706" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Impact Points</span>
            <div className="stat-value-row">
              <span className="stat-value">{userPoints}</span>
              <span className="stat-subtext">pts</span>
            </div>
            <span className="stat-period-tag" style={{ color: "#B45309", fontWeight: 700 }}>
              ★ Ranked on Leaderboard
            </span>
          </div>
        </Link>

        {/* Leadership Tier */}
        <Link to="/leaderboard" className="stat-card" style={{ textDecoration: "none", color: "inherit", borderLeft: "4px solid #6366F1" }}>
          <div className="stat-icon-wrap blue" style={{ background: "#EEF2FF", color: "#4F46E5" }}>
            <Crown size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Leadership Tier</span>
            <div className="stat-value-row">
              <span className="stat-value" style={{ fontSize: "1.35rem" }}>{currentTier}</span>
            </div>
            <span className="stat-period-tag" style={{ color: "#4F46E5", fontWeight: 700 }}>
              {userPoints >= 500 ? "Elite Tier Achieved" : `${nextTierPoints - userPoints} pts to ${nextTierName}`}
            </span>
          </div>
        </Link>

        {/* Events Participated */}
        <Link to="/applications" className="stat-card" style={{ textDecoration: "none", color: "inherit", borderLeft: "4px solid #10B981" }}>
          <div className="stat-icon-wrap green">
            <Calendar size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Events & Drives</span>
            <div className="stat-value-row">
              <span className="stat-value">{eventsCount}</span>
              <span className="stat-subtext">drives</span>
            </div>
            <span className="stat-period-tag" style={{ color: "#059669", fontWeight: 700 }}>
              {myRegisteredEvents.length} applications active
            </span>
          </div>
        </Link>

        {/* Impact Badges */}
        <Link to="/profile" className="stat-card" style={{ textDecoration: "none", color: "inherit", borderLeft: "4px solid #F59E0B" }}>
          <div className="stat-icon-wrap purple" style={{ background: "#FFFBEB", color: "#D97706" }}>
            <Award size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Social Impact Badges</span>
            <div className="stat-value-row">
              <span className="stat-value">{badgesCount}</span>
              <span className="stat-subtext">earned</span>
            </div>
            <span className="stat-period-tag" style={{ color: "#D97706", fontWeight: 700 }}>
              {streakDays} Day Activity Streak 🔥
            </span>
          </div>
        </Link>
      </div>

      {/* SECTION C: 2-COLUMN MAIN LAYOUT */}
      <div
        className="dashboard-content-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 28,
          marginBottom: 32,
        }}
      >
        {/* LEFT COLUMN: UPCOMING DRIVES & LEADERSHIP PROGRESS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* AVAILABLE DRIVES */}
          <div className="dash-section-card">
            <div className="section-card-header">
              <div>
                <h2>Open Volunteering Drives</h2>
                <p>Register now to make a difference and earn impact points.</p>
              </div>
              <Link to="/opportunities" className="view-all-link">
                All Drives ({opportunities.length}) <ArrowRight size={15} />
              </Link>
            </div>

            <div className="opp-list">
              {upcomingOpportunities.map((opp) => {
                const oppId = opp.id || opp._id;
                return (
                  <div key={oppId} className="opp-item-card">
                    <img
                      src={opp.image || "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=400&q=80"}
                      alt={opp.title}
                      className="opp-item-thumb"
                    />

                    <div className="opp-item-info">
                      <div className="opp-tags-row">
                        <span className="category-pill">{opp.category}</span>
                        <span className={`mode-pill ${(opp.mode || "offline").toLowerCase()}`}>{opp.mode || "Offline"}</span>
                      </div>

                      <h3 className="opp-item-title">
                        <Link to={`/opportunities/${oppId}`}>{opp.title}</Link>
                      </h3>

                      <div className="opp-item-meta">
                        <span>
                          <Calendar size={13} /> {opp.date}
                        </span>
                        <span>
                          <Star size={13} color="#F59E0B" fill="#F59E0B" /> +{opp.points || 50} pts
                        </span>
                        <span>
                          <Users size={13} /> {opp.slotsAvailable ?? 10} slots left
                        </span>
                      </div>
                    </div>

                    <div className="opp-item-actions">
                      <Link to={`/opportunities/${oppId}/apply`} className="apply-btn-sm">
                        Register Now
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LEADERSHIP MILESTONE & TIER PROGRESSION */}
          <div className="dash-section-card">
            <div className="section-card-header">
              <div>
                <h2>Leadership Milestone Progress</h2>
                <p>Climb tiers through community service to unlock official certificates.</p>
              </div>
              <Link to="/leaderboard" className="view-all-link">
                Leaderboard <ArrowRight size={15} />
              </Link>
            </div>

            <div style={{ padding: "6px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                  Current Tier: <strong style={{ color: "#B45309" }}>{currentTier} Volunteer</strong>
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#64748B" }}>
                  {userPoints} / {nextTierPoints} Points ({progressPercent}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ width: "100%", height: 10, background: "#E2E8F0", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #FDE047 0%, #FFD629 100%)",
                    borderRadius: 10,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>

              {/* Tier Cards Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <div style={{ padding: "14px", borderRadius: 12, background: userPoints >= 100 ? "#F0FDF4" : "#F8FAFC", border: userPoints >= 100 ? "1px solid #BBF7D0" : "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Shield size={16} color={userPoints >= 100 ? "#16A34A" : "#94A3B8"} />
                    <strong style={{ fontSize: 13, color: userPoints >= 100 ? "#16A34A" : "#64748B" }}>Silver Tier</strong>
                  </div>
                  <span style={{ fontSize: 11.5, color: "#64748B" }}>100 Points • Drive Priority</span>
                </div>

                <div style={{ padding: "14px", borderRadius: 12, background: userPoints >= 250 ? "#FEFCE8" : "#F8FAFC", border: userPoints >= 250 ? "1px solid #FEF08A" : "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Trophy size={16} color={userPoints >= 250 ? "#CA8A04" : "#94A3B8"} />
                    <strong style={{ fontSize: 13, color: userPoints >= 250 ? "#CA8A04" : "#64748B" }}>Gold Tier</strong>
                  </div>
                  <span style={{ fontSize: 11.5, color: "#64748B" }}>250 Points • Campus Ambassador</span>
                </div>

                <div style={{ padding: "14px", borderRadius: 12, background: userPoints >= 500 ? "#EEF2FF" : "#F8FAFC", border: userPoints >= 500 ? "1px solid #C7D2FE" : "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Crown size={16} color={userPoints >= 500 ? "#4F46E5" : "#94A3B8"} />
                    <strong style={{ fontSize: 13, color: userPoints >= 500 ? "#4F46E5" : "#64748B" }}>Platinum</strong>
                  </div>
                  <span style={{ fontSize: 11.5, color: "#64748B" }}>500 Points • Maatram Letter</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MY REGISTERED EVENTS & QUICK ACTIONS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* MY REGISTERED EVENTS / APPLICATIONS */}
          <div className="dash-section-card">
            <div className="section-card-header">
              <div>
                <h2>My Applications</h2>
                <p>Your volunteer drive applications & review status.</p>
              </div>
              <Link to="/applications" className="view-all-link">
                All ({myRegisteredEvents.length}) <ArrowRight size={15} />
              </Link>
            </div>

            <div className="my-events-list">
              {myRegisteredEvents.length === 0 ? (
                <div
                  className="empty-events-state"
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    background: "#F8FAFC",
                    borderRadius: "14px",
                    border: "1px dashed #CBD5E1",
                  }}
                >
                  <Calendar size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
                  <h4 style={{ margin: "0 0 4px", fontSize: "14px", color: "#1E293B", fontWeight: 700 }}>
                    No registrations yet
                  </h4>
                  <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#64748B", lineHeight: 1.45 }}>
                    Browse open volunteering drives and submit your first application.
                  </p>
                  <Link
                    to="/opportunities"
                    className="dash-btn dash-btn-primary"
                    style={{ display: "inline-flex", padding: "8px 16px", fontSize: "12.5px" }}
                  >
                    Browse Opportunities
                  </Link>
                </div>
              ) : (
                myRegisteredEvents.map((app) => (
                  <div
                    key={app.id || app._id}
                    className="my-event-card"
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 14,
                      padding: "16px",
                      border: "1px solid #E2E8F0",
                      marginBottom: 12,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span
                        className={`status-pill ${app.status === "Approved" ? "approved" : "pending"}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 12,
                          background: app.status === "Approved" ? "#ECFDF5" : "#FFFBEB",
                          color: app.status === "Approved" ? "#059669" : "#D97706",
                        }}
                      >
                        {app.status === "Approved" ? (
                          <>
                            <CheckCircle2 size={12} /> Approved Volunteer
                          </>
                        ) : (
                          "Pending Review"
                        )}
                      </span>
                      <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace", fontWeight: 600 }}>
                        {app.referenceId || "MAT-APP"}
                      </span>
                    </div>

                    <h4 style={{ margin: "0 0 6px", fontSize: 14.5, fontWeight: 700, color: "#0F172A" }}>
                      {app.opportunityTitle}
                    </h4>
                    <p style={{ margin: 0, fontSize: 12.5, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
                      <Calendar size={13} /> {app.eventDate}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="dash-section-card">
            <div className="section-card-header">
              <div>
                <h2>Quick Shortcuts</h2>
                <p>Navigate easily across the platform.</p>
              </div>
            </div>

            <div className="quick-actions-list">
              <Link to="/opportunities" className="quick-action-link">
                <Compass size={18} color="#FFD629" />
                <span>Explore Volunteering Opportunities</span>
                <ArrowRight size={14} className="qa-arrow" />
              </Link>
              <Link to="/applications" className="quick-action-link">
                <FileCheck size={18} color="#20A464" />
                <span>Track My Applications</span>
                <ArrowRight size={14} className="qa-arrow" />
              </Link>
              <Link to="/leaderboard" className="quick-action-link">
                <Trophy size={18} color="#EAB308" />
                <span>View Leaderboard Standings</span>
                <ArrowRight size={14} className="qa-arrow" />
              </Link>
              <Link to="/connect" className="quick-action-link">
                <Users size={18} color="#8B5CF6" />
                <span>Connect with Student Volunteers</span>
                <ArrowRight size={14} className="qa-arrow" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
