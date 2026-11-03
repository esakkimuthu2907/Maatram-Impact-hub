import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock,
  Calendar,
  Award,
  Zap,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Users,
  Compass,
  FileCheck,
  BarChart2,
  Sparkles,
  ExternalLink,
  BookOpen,
  Trophy,
  Shield,
  Crown,
  Star,
  Bell,
  Coins,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { usersAPI } from "../../api/usersAPI";
import TrendAreaChart from "../../components/charts/TrendAreaChart";
import { MONTHLY_HOURS_TREND, BADGES_LIST } from "../../data/mockData";
import "./StudentDashboard.css";

// 6 Tier System requested by user:
// 100 for Bronze, 250 for Silver, 500 for Gold, 1000 for Diamond, 1500 for Platinum, 2000 Green Gem
const TIERS_CONFIG = [
  { tier: "Bronze", name: "Bronze Volunteer", minPoints: 0, targetPoints: 100, color: "#CD7F32", milestoneLabel: "100+ pts" },
  { tier: "Silver", name: "Silver Volunteer", minPoints: 100, targetPoints: 250, color: "#94A3B8", milestoneLabel: "250+ pts" },
  { tier: "Gold", name: "Gold Volunteer", minPoints: 250, targetPoints: 500, color: "#EAB308", milestoneLabel: "500+ pts" },
  { tier: "Diamond", name: "Diamond Volunteer", minPoints: 500, targetPoints: 1000, color: "#06B6D4", milestoneLabel: "1000+ pts" },
  { tier: "Platinum", name: "Platinum Volunteer", minPoints: 1000, targetPoints: 1500, color: "#6366F1", milestoneLabel: "1500+ pts" },
  { tier: "Green Gem", name: "Green Gem Volunteer", minPoints: 1500, targetPoints: 2000, color: "#10B981", milestoneLabel: "2000+ pts" },
];

export default function StudentDashboard() {
  const { user = {}, opportunities = [], applications = [], pointsHistory = [], notifications = [] } = useApp();
  const navigate = useNavigate();

  // Peer comparison state
  const [peerLeaderboard, setPeerLeaderboard] = useState([]);

  useEffect(() => {
    async function loadPeers() {
      try {
        const res = await usersAPI.getLeaderboard();
        if (res?.data && Array.isArray(res.data)) {
          setPeerLeaderboard(res.data);
        }
      } catch (e) {}
    }
    loadPeers();
  }, []);

  // Filter approved or registered upcoming events safely
  const myRegisteredEvents = (applications || []).filter((app) => app?.status !== "Cancelled");
  const upcomingOpportunities = (opportunities || []).slice(0, 3);
  const recommendedOpportunities = (opportunities || []).slice(3, 6);

  const userPoints = Number(user?.points) || 50;
  const verifiedHours = user?.totalHours ?? 0;
  const eventsCount = user?.eventsJoined ?? (myRegisteredEvents.length > 0 ? myRegisteredEvents.length : 1);
  const badgesCount = user?.badgesEarned ?? (userPoints > 0 ? 1 : 0);
  const streakDays = user?.streakDays ?? (userPoints > 0 ? 3 : 0);

  // Compute Current Tier & Next Tier
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

  // Accurate Blue Level Track Percentage (proportional to 6 tiers scale)
  const calculateTrackFill = (pts) => {
    const p = Math.max(0, pts);
    const segCount = TIERS_CONFIG.length;
    const segW = 100 / segCount;
    for (let i = 0; i < TIERS_CONFIG.length; i++) {
      const min = TIERS_CONFIG[i].minPoints;
      const max = TIERS_CONFIG[i].targetPoints;
      if (p < max) {
        const ratio = (p - min) / (max - min);
        // At 50 pts, sits cleanly in the first 0-100 Bronze segment
        return Math.min(100, Math.max(3, i * segW + ratio * segW));
      }
    }
    return 100;
  };
  const progressPercent = calculateTrackFill(userPoints);

  // Peer Stats
  const allPoints = peerLeaderboard.map((u) => Number(u.points) || 0);
  const avgPoints = allPoints.length > 0 ? Math.round(allPoints.reduce((a, b) => a + b, 0) / allPoints.length) : 380;
  const topScore = allPoints.length > 0 ? Math.max(...allPoints) : 1200;
  const myRank = peerLeaderboard.findIndex((u) => u.applicationId === user?.applicationId || u.email === user?.email) + 1 || 5;

  const currentDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="dashboard-container">
      {/* SECTION A: WELCOME HEADER */}
      <section className="dashboard-welcome-banner">
        <div className="welcome-text-col">
          <div className="welcome-date-chip">
            <Sparkles size={14} color="#D97706" /> {currentDate}
          </div>
          <h1 className="welcome-title">
            Vanakkam, {user?.name || user?.fullName || "Student Volunteer"}! <span className="wave-hand">👋</span>
          </h1>
          <p className="welcome-subtitle">
            Welcome to your Maatram Foundation volunteering hub. Earn impact points, climb leadership ranks, and explore upcoming community outreach drives.
          </p>

          <div className="welcome-actions">
            <Link to="/opportunities" className="dash-btn dash-btn-primary">
              <Compass size={16} /> Explore Opportunities
            </Link>
            <Link to="/leaderboard" className="dash-btn dash-btn-secondary">
              <Trophy size={16} /> View Leaderboard
            </Link>
          </div>
        </div>

        {/* Featured Impact Banner */}
        <div className="featured-impact-banner">
          <div>
            <span className="banner-badge">Volunteering Impact</span>
            <h2>Youth Social Leadership Initiative</h2>
            <p>Join student volunteers across Tamil Nadu making a real generational difference.</p>
          </div>
          <div className="banner-art-row">
            <Link to="/opportunities" className="banner-link">
              Browse Drives <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION B: 4 STATS CARDS */}
      <div className="stats-grid">
        {/* Total Points */}
        <Link to="/contributions" className="stat-card" style={{ textDecoration: "none", color: "inherit", borderLeft: "4px solid #FFD629" }}>
          <div className="stat-icon-wrap yellow">
            <Award size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Volunteering Points</span>
            <div className="stat-value-row">
              <span className="stat-value">{userPoints}</span>
              <span className="stat-subtext">pts</span>
            </div>
            <span className="stat-period-tag" style={{ color: "#B45309", fontWeight: 700 }}>
              🏆 {currentTier.name}
            </span>
          </div>
        </Link>

        {/* Leadership Rank */}
        <Link to="/leaderboard" className="stat-card" style={{ textDecoration: "none", color: "inherit", borderLeft: "4px solid #2563EB" }}>
          <div className="stat-icon-wrap blue">
            <Trophy size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Leadership Rank</span>
            <div className="stat-value-row">
              <span className="stat-value">#{myRank}</span>
              <span className="stat-subtext">of {peerLeaderboard.length || 6}</span>
            </div>
            <span className="stat-period-tag" style={{ color: "#2563EB", fontWeight: 700 }}>
              {currentTier.tier} Tier Active
            </span>
          </div>
        </Link>

        {/* Events Joined */}
        <Link to="/applications" className="stat-card" style={{ textDecoration: "none", color: "inherit", borderLeft: "4px solid #16A34A" }}>
          <div className="stat-icon-wrap green">
            <Calendar size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Events Completed</span>
            <div className="stat-value-row">
              <span className="stat-value">{eventsCount}</span>
              <span className="stat-subtext">drives</span>
            </div>
            <span className="stat-period-tag">
              {myRegisteredEvents.length} enrolled drives
            </span>
          </div>
        </Link>

        {/* Badges Earned */}
        <Link to="/profile" className="stat-card" style={{ textDecoration: "none", color: "inherit", borderLeft: "4px solid #D97706" }}>
          <div className="stat-icon-wrap amber">
            <Zap size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Badges Earned</span>
            <div className="stat-value-row">
              <span className="stat-value">{badgesCount}</span>
              <span className="stat-subtext">badges</span>
            </div>
            <span className="stat-period-tag">
              {streakDays} Day Activity Streak 🔥
            </span>
          </div>
        </Link>
      </div>

      {/* SECTION C: VOLUNTEER RANKING & POINTS PROGRESS CARD (EXACT TO USER SPECIFICATION) */}
      <div
        style={{
          background: "#FFFFFF",
          padding: "24px 28px",
          borderRadius: 20,
          border: "1.5px solid #E2E8F0",
          boxShadow: "0 4px 18px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
          <div>
            <strong style={{ fontSize: 16, color: "#0F172A", fontWeight: 800 }}>
              Volunteer Ranking: {currentTier.name}
            </strong>
            <span style={{ fontSize: 13.5, color: "#64748B", display: "block", marginTop: 2 }}>
              {nextTier
                ? `${pointsNeeded} points needed to reach ${nextTier.name}`
                : "You have achieved the highest Green Gem Volunteer ranking!"}
            </span>
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: "#0066CC" }}>
            {userPoints} / {targetPts} pts
          </span>
        </div>

        {/* Blue Level Progress Bar Track */}
        <div style={{ height: 12, background: "#E2E8F0", borderRadius: 10, overflow: "hidden", position: "relative" }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              background: "linear-gradient(90deg, #0066CC, #38BDF8)",
              borderRadius: 10,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* 6 Tiers Milestone Markers */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 8 }}>
          {TIERS_CONFIG.map((t) => (
            <div
              key={t.tier}
              style={{
                textAlign: "center",
                opacity: userPoints >= t.minPoints ? 1 : 0.45,
                flex: "1 1 80px",
              }}
            >
              <strong style={{ fontSize: 12.5, color: "#0F172A", display: "block", fontWeight: 700 }}>
                {t.name}
              </strong>
              <span style={{ fontSize: 11.5, color: "#64748B" }}>{t.milestoneLabel}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION D: PEER LEADERSHIP COMPARISON */}
      <div
        style={{
          background: "linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)",
          padding: "20px 28px",
          borderRadius: 20,
          border: "1.5px solid #E2E8F0",
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div>
            <strong style={{ fontSize: 15, color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
              <Trophy size={16} color="#D97706" /> Peer Leadership Comparison
            </strong>
            <span style={{ fontSize: 12.5, color: "#64748B" }}>
              See how your volunteering impact compares with other enrolled student volunteers.
            </span>
          </div>
          <Link to="/leaderboard" style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", textDecoration: "none" }}>
            Full Leaderboard →
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          <div style={{ background: "#FFFDF0", padding: "14px 18px", borderRadius: 14, border: "1px solid #FEF08A" }}>
            <span style={{ fontSize: 11.5, color: "#854D0E", fontWeight: 700, textTransform: "uppercase" }}>Your Points</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
              {userPoints} pts
            </div>
            <span style={{ fontSize: 11.5, color: "#B45309", fontWeight: 600 }}>Rank #{myRank} in Tamil Nadu</span>
          </div>

          <div style={{ background: "#F8FAFC", padding: "14px 18px", borderRadius: 14, border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Batch Average</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
              {avgPoints} pts
            </div>
            <span style={{ fontSize: 11.5, color: "#64748B" }}>Across all college scholars</span>
          </div>

          <div style={{ background: "#F0FDF4", padding: "14px 18px", borderRadius: 14, border: "1px solid #BBF7D0" }}>
            <span style={{ fontSize: 11.5, color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Top Contributor</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#16A34A", marginTop: 2 }}>
              {topScore} pts
            </div>
            <span style={{ fontSize: 11.5, color: "#15803D" }}>Meenakshi V (Loyola)</span>
          </div>
        </div>
      </div>

      {/* SECTION E: TWO-COLUMN MAIN CONTENT (ONE SECTION PER COLUMN) */}
      <div className="dashboard-grid-layout">
        <div className="dash-col-main">
          {/* OPEN VOLUNTEERING DRIVES */}
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

          {/* VOLUNTEERING HOURS TREND CHART */}
          <div className="dash-section-card">
            <div className="section-card-header">
              <div>
                <h2>Volunteering Impact Trajectory</h2>
                <p>Monthly verified participation and commitment trend.</p>
              </div>
              <Link to="/contributions" className="view-all-link">
                Contributions <ArrowRight size={15} />
              </Link>
            </div>

            <div className="chart-wrapper">
              <TrendAreaChart data={MONTHLY_HOURS_TREND} height={210} />
            </div>
          </div>
        </div>

        <div className="dash-col-side">
          {/* MY REGISTERED EVENTS / APPLICATIONS */}
          <div className="dash-section-card">
            <div className="section-card-header">
              <div>
                <h2>My Upcoming Events</h2>
                <p>Your accepted volunteering drives.</p>
              </div>
              <Link to="/applications" className="view-all-link">
                All ({myRegisteredEvents.length})
              </Link>
            </div>

            <div className="my-events-list">
              {myRegisteredEvents.length === 0 ? (
                <div className="empty-events-state">
                  <Calendar size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
                  <h4>No registered events yet</h4>
                  <p>Browse upcoming drives and submit your application to get started.</p>
                  <Link to="/opportunities" className="dash-btn dash-btn-primary" style={{ display: "inline-flex", padding: "7px 14px", fontSize: "12px" }}>
                    Browse Opportunities
                  </Link>
                </div>
              ) : (
                myRegisteredEvents.map((app) => (
                  <div key={app.id || app._id} className="my-event-card">
                    <div className="my-event-status-row">
                      <span className={`status-pill ${app.status === "Approved" ? "approved" : "pending"}`}>
                        {app.status === "Approved" ? (
                          <>
                            <CheckCircle2 size={12} /> Approved
                          </>
                        ) : (
                          "Pending Review"
                        )}
                      </span>
                      <span className="my-event-ref">{app.referenceId}</span>
                    </div>

                    <div className="my-event-info">
                      <h4 className="my-event-title">{app.opportunityTitle}</h4>
                      <p className="my-event-meta">
                        <span>
                          <Calendar size={13} /> {app.eventDate}
                        </span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* EARNED RECOGNITION */}
          <div className="dash-section-card">
            <div className="section-card-header">
              <div>
                <h2>Earned Recognition</h2>
                <p>Badges earned for social impact.</p>
              </div>
              <Link to="/profile" className="view-all-link">
                View All
              </Link>
            </div>

            <div className="badges-showcase-grid">
              {BADGES_LIST.slice(0, 4).map((badge) => {
                const isUnlocked = badgesCount > 0 && badge.unlocked;
                return (
                  <div key={badge.id} className="badge-item-mini" style={{ opacity: isUnlocked ? 1 : 0.65 }}>
                    <div
                      className="badge-medal-icon"
                      style={{
                        borderColor: isUnlocked ? badge.color : "#CBD5E1",
                        background: isUnlocked ? "#FFFFFF" : "#F8FAFC",
                      }}
                    >
                      <Award size={22} color={isUnlocked ? badge.color : "#94A3B8"} />
                    </div>
                    <span className="badge-mini-title">{badge.title}</span>
                    <span className="badge-mini-date" style={{ color: isUnlocked ? "#64748B" : "#D97706", fontWeight: isUnlocked ? 500 : 700 }}>
                      {isUnlocked ? badge.date : "To Unlock"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RECENT POINTS TRANSACTIONS */}
          <div className="dash-section-card">
            <div className="section-card-header">
              <div>
                <h2>Points &amp; Rewards</h2>
                <p>Recent impact points earned.</p>
              </div>
              <Link to="/contributions" className="view-all-link">
                View All
              </Link>
            </div>

            {pointsHistory && pointsHistory.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pointsHistory.slice(0, 3).map((tx) => (
                  <div
                    key={tx._id || tx.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      background: "#F8FAFC",
                      borderRadius: 10,
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: tx.type === "DEBIT" ? "#FEE2E2" : "#FEF9C3",
                          color: tx.type === "DEBIT" ? "#DC2626" : "#CA8A04",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                        }}
                      >
                        <Coins size={16} />
                      </div>
                      <div>
                        <strong style={{ fontSize: 13, color: "#0F172A", display: "block" }}>
                          {tx.eventName || tx.reason || "Volunteer Activity"}
                        </strong>
                        <span style={{ fontSize: 11, color: "#64748B" }}>
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("en-IN") : "Recent"}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: 13.5,
                        color: tx.type === "DEBIT" ? "#DC2626" : "#16A34A",
                      }}
                    >
                      {tx.type === "DEBIT" ? "-" : "+"}{tx.points} pts
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "#94A3B8", margin: 0, padding: "8px 0" }}>
                No points transactions recorded yet. Join events to earn impact points!
              </p>
            )}
          </div>

          {/* RECENT NOTIFICATIONS */}
          <div className="dash-section-card">
            <div className="section-card-header">
              <div>
                <h2>Recent Notifications</h2>
                <p>Updates, badges and drive approvals.</p>
              </div>
              <Link to="/notifications" className="view-all-link">
                View All
              </Link>
            </div>

            {notifications && notifications.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {notifications.slice(0, 3).map((item) => (
                  <div
                    key={item._id || item.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 12px",
                      background: item.isRead ? "#FFFFFF" : "#EFF6FF",
                      borderRadius: 10,
                      border: "1px solid",
                      borderColor: item.isRead ? "#E2E8F0" : "#BFDBFE",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "#DBEAFE",
                        color: "#1E40AF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      <Bell size={14} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: 13, color: "#0F172A", display: "block" }}>
                        {item.title}
                      </strong>
                      <p style={{ fontSize: 12, color: "#475569", margin: "2px 0 0", lineHeight: 1.4 }}>
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "#94A3B8", margin: 0, padding: "8px 0" }}>
                No new notifications. You're all caught up!
              </p>
            )}
          </div>

          {/* QUICK SHORTCUTS */}
          <div className="dash-section-card">
            <div className="section-card-header">
              <div>
                <h2>Quick Actions</h2>
                <p>Frequently accessed volunteering actions.</p>
              </div>
            </div>

            <div className="quick-actions-list">
              <Link to="/opportunities" className="quick-action-link">
                <Compass size={18} color="#FFD629" />
                <span>Explore Opportunities</span>
                <ArrowRight size={14} className="qa-arrow" />
              </Link>
              <Link to="/applications" className="quick-action-link">
                <FileCheck size={18} color="#20A464" />
                <span>Track My Applications</span>
                <ArrowRight size={14} className="qa-arrow" />
              </Link>
              <Link to="/leaderboard" className="quick-action-link">
                <Trophy size={18} color="#EAB308" />
                <span>Leaderboard Standings</span>
                <ArrowRight size={14} className="qa-arrow" />
              </Link>
              <Link to="/connect" className="quick-action-link">
                <Users size={18} color="#2563EB" />
                <span>Connect With Volunteers</span>
                <ArrowRight size={14} className="qa-arrow" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
