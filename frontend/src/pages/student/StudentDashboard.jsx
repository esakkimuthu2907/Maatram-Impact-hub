import React, { useState, useEffect, useMemo } from "react";
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
  Share2,
  Copy,
  Check,
  History,
  Download,
  Eye,
  FileText,
  Filter,
  Search,
  Building2,
  X,
  Plus,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { usersAPI } from "../../api/usersAPI";
import "./StudentDashboard.css";

// 6 Tier System
const TIERS_CONFIG = [
  {
    tier: "Bronze",
    name: "Bronze Volunteer",
    minPoints: 50,
    targetPoints: 100,
    color: "#CD7F32",
    milestoneLabel: "100+ pts",
  },
  {
    tier: "Silver",
    name: "Silver Volunteer",
    minPoints: 100,
    targetPoints: 250,
    color: "#94A3B8",
    milestoneLabel: "250+ pts",
  },
  {
    tier: "Gold",
    name: "Gold Volunteer",
    minPoints: 250,
    targetPoints: 500,
    color: "#EAB308",
    milestoneLabel: "500+ pts",
  },
  {
    tier: "Diamond",
    name: "Diamond Volunteer",
    minPoints: 500,
    targetPoints: 1000,
    color: "#06B6D4",
    milestoneLabel: "1000+ pts",
  },
  {
    tier: "Platinum",
    name: "Platinum Volunteer",
    minPoints: 1000,
    targetPoints: 1500,
    color: "#6366F1",
    milestoneLabel: "1500+ pts",
  },
  {
    tier: "Green Gem",
    name: "Green Gem Volunteer",
    minPoints: 1500,
    targetPoints: 2000,
    color: "#10B981",
    milestoneLabel: "2000+ pts",
  },
];

export default function StudentDashboard() {
  const {
    user = {},
    opportunities = [],
    applications = [],
    pointsHistory = [],
    notifications = [],
    certificates = [],
    openCertificate,
    openLinkedInShare,
    cancelApplication,
    showToast,
  } = useApp();

  const navigate = useNavigate();

  // Tab navigation state: overview | events | certificates | linkedin | points | history
  const [dashboardSection, setDashboardSection] = useState("overview");

  // Filter state for My Events section
  const [eventFilter, setEventFilter] = useState("All"); // All | Approved | Completed | Pending

  // Filter state for History section
  const [historyCategory, setHistoryCategory] = useState("All");
  const [historySearch, setHistorySearch] = useState("");
  const [selectedHistoryEvent, setSelectedHistoryEvent] = useState(null);

  // LinkedIn copy feedback
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Peer comparison state
  const [peerLeaderboard, setPeerLeaderboard] = useState([]);

  useEffect(() => {
    async function loadPeers() {
      try {
        const res = await usersAPI.getLeaderboard();

        if (res?.data && Array.isArray(res.data)) {
          setPeerLeaderboard(res.data);
        }
      } catch (e) {
        console.error("Unable to load leaderboard:", e);
      }
    }

    loadPeers();
  }, []);

  // Filter registered upcoming events safely
  const myRegisteredEvents = (applications || []).filter(
    (app) => app?.status !== "Cancelled"
  );

  const upcomingOpportunities = (opportunities || []).slice(0, 2);

  const recommendedOpportunities = (opportunities || []).slice(2, 4);

  const userPoints = Number(user?.points) || 0;

  const verifiedHours = Number(user?.totalHours) || 0;

  const eventsCount =
    Number(user?.eventsJoined) ||
    Number(user?.completedEventsCount) ||
    0;

  const badgesCount = Number(user?.badgesEarned) || 0;

  const streakDays = Number(user?.streakDays) || 0;

  // Compute Current Tier & Next Tier
  let currentTier = TIERS_CONFIG[0];
  let nextTier = TIERS_CONFIG[1];

  for (let i = 0; i < TIERS_CONFIG.length; i++) {
    if (userPoints >= TIERS_CONFIG[i].minPoints) {
      currentTier = TIERS_CONFIG[i];
      nextTier = TIERS_CONFIG[i + 1] || null;
    }
  }

  const targetPts = nextTier
    ? nextTier.minPoints
    : currentTier.targetPoints;

  const pointsNeeded = Math.max(0, targetPts - userPoints);

  // Calculate progress percentage
  const calculateTrackFill = (pts) => {
    const p = Math.max(0, pts);
    const segCount = TIERS_CONFIG.length;
    const segW = 100 / segCount;

    for (let i = 0; i < TIERS_CONFIG.length; i++) {
      const min = TIERS_CONFIG[i].minPoints;
      const max = TIERS_CONFIG[i].targetPoints;

      if (p < max) {
        const ratio = (p - min) / (max - min);

        return Math.min(
          100,
          Math.max(3, i * segW + ratio * segW)
        );
      }
    }

    return 100;
  };

  const progressPercent = calculateTrackFill(userPoints);

  // Peer Stats
  const allPoints = peerLeaderboard.map(
    (u) => Number(u.points) || 0
  );

  const avgPoints =
    allPoints.length > 0
      ? Math.round(
          allPoints.reduce((a, b) => a + b, 0) /
            allPoints.length
        )
      : 380;

  const topScore =
    allPoints.length > 0
      ? Math.max(...allPoints)
      : 1200;

  const myRank =
    peerLeaderboard.findIndex(
      (u) =>
        u.applicationId === user?.applicationId ||
        u.email === user?.email
    ) + 1 || 5;

  const currentDate = new Date().toLocaleDateString(
    "en-GB",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="dashboard-container">

      {/* SECTION A: WELCOME BANNER */}

      <section
        style={{
          background:
            "linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #0284C7 100%)",
          borderRadius: 20,
          padding: "18px 26px",
          color: "#fff",
          marginBottom: 20,
          boxShadow:
            "0 8px 28px rgba(30, 58, 138, 0.22)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          {/* Left Side */}

          <div
            style={{
              flex: "1 1 320px",
              minWidth: 240,
            }}
          >
            <div
              style={{
                display: "inline-block",
                background: "rgba(255,255,255,0.15)",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 700,
                marginBottom: 6,
                color: "#BFDBFE",
              }}
            >
              📅 {currentDate}
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(20px, 2.5vw, 24px)",
                fontWeight: 900,
                lineHeight: 1.2,
              }}
            >
              Welcome Back,{" "}
              {user?.name ||
                user?.fullName ||
                "Student Volunteer"}{" "}
              <span className="wave-hand">👋</span>
            </h1>

            <p
              style={{
                margin: "4px 0 12px",
                fontSize: 13,
                color: "#DBEAFE",
                maxWidth: 540,
                lineHeight: 1.4,
              }}
            >
              Maatram Impact Hub • Earn verified hours,
              climb ranks, and lead community drives.
            </p>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Link
                to="/opportunities"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#FFD629",
                  color: "#0F172A",
                  padding: "8px 16px",
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 12.5,
                  textDecoration: "none",
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                <Compass size={14} />
                Explore Drives
              </Link>

              <Link
                to="/leaderboard"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 12.5,
                  textDecoration: "none",
                  border:
                    "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <Trophy size={14} />
                Leaderboard
              </Link>
            </div>
          </div>

          {/* Right Side: Quick Highlight Card */}

          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
              borderRadius: 14,
              padding: "12px 18px",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div></div>
          </div>
        </div>
      </section>

      {/* SECTION B: FOUR STATS CARDS */}

      <div className="stats-grid">

        {/* Total Points */}

        <Link
          to="/contributions"
          className="stat-card"
          style={{
            textDecoration: "none",
            color: "inherit",
            borderLeft: "4px solid #FFD629",
          }}
        >
          <div className="stat-icon-wrap yellow">
            <Award size={22} />
          </div>

          <div className="stat-content">
            <span className="stat-label">
              Volunteering Points
            </span>

            <div className="stat-value-row">
              <span className="stat-value">
                {userPoints}
              </span>

              <span className="stat-subtext">pts</span>
            </div>

            <span
              className="stat-period-tag"
              style={{
                color: "#B45309",
                fontWeight: 700,
              }}
            >
              🏆 {currentTier.name}
            </span>
          </div>
        </Link>

        {/* Leadership Rank */}

        <Link
          to="/leaderboard"
          className="stat-card"
          style={{
            textDecoration: "none",
            color: "inherit",
            borderLeft: "4px solid #2563EB",
          }}
        >
          <div className="stat-icon-wrap blue">
            <Trophy size={22} />
          </div>

          <div className="stat-content">
            <span className="stat-label">
              Leadership Rank
            </span>

            <div className="stat-value-row">
              <span className="stat-value">
                #{myRank}
              </span>

              <span className="stat-subtext">
                of {peerLeaderboard.length || 6}
              </span>
            </div>

            <span
              className="stat-period-tag"
              style={{
                color: "#2563EB",
                fontWeight: 700,
              }}
            >
              {currentTier.tier} Tier Active
            </span>
          </div>
        </Link>

        {/* Events Joined */}

        <Link
          to="/applications"
          className="stat-card"
          style={{
            textDecoration: "none",
            color: "inherit",
            borderLeft: "4px solid #16A34A",
          }}
        >
          <div className="stat-icon-wrap green">
            <Calendar size={22} />
          </div>

          <div className="stat-content">
            <span className="stat-label">
              Events Completed
            </span>

            <div className="stat-value-row">
              <span className="stat-value">
                {eventsCount}
              </span>

              <span className="stat-subtext">
                drives
              </span>
            </div>

            <span className="stat-period-tag">
              {myRegisteredEvents.length} enrolled drives
            </span>
          </div>
        </Link>

        {/* Badges Earned */}

        <Link
          to="/profile"
          className="stat-card"
          style={{
            textDecoration: "none",
            color: "inherit",
            borderLeft: "4px solid #D97706",
          }}
        >
          <div className="stat-icon-wrap amber">
            <Zap size={22} />
          </div>

          <div className="stat-content">
            <span className="stat-label">
              Badges Earned
            </span>

            <div className="stat-value-row">
              <span className="stat-value">
                {badgesCount}
              </span>

              <span className="stat-subtext">
                badges
              </span>
            </div>

            <span className="stat-period-tag">
              {streakDays} Day Activity Streak 🔥
            </span>
          </div>
        </Link>
      </div>

      {/* ─── DYNAMIC SECTION TABS BAR ────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          padding: "6px 4px 16px",
          marginBottom: 16,
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        {[
          { key: "overview", label: "Overview", icon: Compass },
          { key: "events", label: "My Events", icon: Calendar, badge: myRegisteredEvents.length },
          { key: "certificates", label: "My Certificates", icon: Award, badge: certificates.length },
          { key: "linkedin", label: "My LinkedIn Content", icon: Share2 },
          { key: "points", label: "My Points", icon: Coins, badge: `${userPoints} pts` },
          { key: "history", label: "History", icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = dashboardSection === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setDashboardSection(tab.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 12,
                border: isActive ? "1px solid #004D99" : "1px solid #E2E8F0",
                background: isActive ? "#004D99" : "#FFFFFF",
                color: isActive ? "#FFFFFF" : "#334155",
                fontWeight: isActive ? 700 : 600,
                fontSize: 13.5,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
                boxShadow: isActive ? "0 4px 12px rgba(0, 77, 153, 0.2)" : "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <Icon size={16} color={isActive ? "#FFD629" : "#64748B"} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== null && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 20,
                    background: isActive ? "rgba(255, 214, 41, 0.25)" : "#F1F5F9",
                    color: isActive ? "#FFD629" : "#64748B",
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 1: OVERVIEW DASHBOARD
      ══════════════════════════════════════════════════════════════════════ */}
      {dashboardSection === "overview" && (
        <>
      {/* SECTION: VOLUNTEER OPPORTUNITIES HUB */}

      <div
        style={{
          marginTop: 24,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: "#0F172A",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>🌟</span>
              Volunteer Opportunities Hub
            </h2>

            <p
              style={{
                margin: "2px 0 0",
                fontSize: 13,
                color: "#64748B",
              }}
            >
              Explore core foundation streams, event
              committees, special projects, and mentorship
              roles
            </p>
          </div>

          <Link
            to="/opportunities"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              color: "#2563EB",
              textDecoration: "none",
            }}
          >
            View All Drives <ArrowRight size={14} />
          </Link>
        </div>

        {/* Responsive Opportunities Grid */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {recommendedOpportunities.length > 0 ? (
            recommendedOpportunities.map((opp) => {
              const oppId = opp.id || opp._id;

              return (
                <div
                  key={oppId}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 14,
                    overflow: "hidden",
                    boxShadow:
                      "0 3px 12px rgba(15, 23, 42, 0.05)",
                  }}
                >
                  <img
                    src={
                      opp.image ||
                      "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=700&q=80"
                    }
                    alt={
                      opp.title || "Volunteer opportunity"
                    }
                    style={{
                      width: "100%",
                      height: 140,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />

                  <div style={{ padding: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          background: "#EFF6FF",
                          color: "#1D4ED8",
                          padding: "4px 8px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {opp.category || "Volunteer Drive"}
                      </span>

                      <span
                        style={{
                          background: "#F0FDF4",
                          color: "#15803D",
                          padding: "4px 8px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {opp.mode || "Offline"}
                      </span>
                    </div>

                    <h3
                      style={{
                        margin: "0 0 8px",
                        color: "#0F172A",
                        fontSize: 15,
                        fontWeight: 800,
                      }}
                    >
                      {opp.title || "Volunteer Opportunity"}
                    </h3>

                    <p
                      style={{
                        margin: "0 0 12px",
                        color: "#64748B",
                        fontSize: 12.5,
                        lineHeight: 1.5,
                      }}
                    >
                      {opp.description ||
                        "Be part of this initiative and create a positive impact in the community."}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          color: "#64748B",
                          fontSize: 11.5,
                        }}
                      >
                        <Calendar
                          size={12}
                          style={{
                            verticalAlign: "-2px",
                          }}
                        />{" "}
                        {opp.date || "Date to be announced"}
                      </span>

                      <Link
                        to={`/opportunities/${oppId}`}
                        style={{
                          color: "#2563EB",
                          fontSize: 12.5,
                          fontWeight: 800,
                          textDecoration: "none",
                        }}
                      >
                        Explore{" "}
                        <ArrowRight
                          size={13}
                          style={{
                            verticalAlign: "-2px",
                          }}
                        />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: 20,
                textAlign: "center",
                background: "#F8FAFC",
                border: "1px dashed #CBD5E1",
                borderRadius: 14,
              }}
            >
              <Compass
                size={26}
                color="#64748B"
                style={{ marginBottom: 6 }}
              />

              <p
                style={{
                  margin: 0,
                  color: "#64748B",
                  fontSize: 13,
                }}
              >
                More volunteering streams will appear here
                when opportunities are available.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION C: VOLUNTEER RANKING & POINTS PROGRESS */}

      <div
        style={{
          background: "#FFFFFF",
          padding: "24px 28px",
          borderRadius: 20,
          border: "1.5px solid #E2E8F0",
          boxShadow:
            "0 4px 18px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <strong
              style={{
                fontSize: 16,
                color: "#0F172A",
                fontWeight: 800,
              }}
            >
              Volunteer Ranking: {currentTier.name}
            </strong>

            <span
              style={{
                fontSize: 13.5,
                color: "#64748B",
                display: "block",
                marginTop: 2,
              }}
            >
              {nextTier
                ? `${pointsNeeded} points needed to reach ${nextTier.name}`
                : "You have achieved the highest Green Gem Volunteer ranking!"}
            </span>
          </div>

          <span
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: "#0066CC",
            }}
          >
            {userPoints} / {targetPts} pts
          </span>
        </div>

        {/* Progress Bar */}

        <div
          style={{
            height: 12,
            background: "#E2E8F0",
            borderRadius: 10,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              background:
                "linear-gradient(90deg, #0066CC, #38BDF8)",
              borderRadius: 10,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* Six Tier Milestones */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 14,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {TIERS_CONFIG.map((t) => (
            <div
              key={t.tier}
              style={{
                textAlign: "center",
                opacity:
                  userPoints >= t.minPoints ? 1 : 0.45,
                flex: "1 1 80px",
              }}
            >
              <strong
                style={{
                  fontSize: 12.5,
                  color: "#0F172A",
                  display: "block",
                  fontWeight: 700,
                }}
              >
                {t.name}
              </strong>

              <span
                style={{
                  fontSize: 11.5,
                  color: "#64748B",
                }}
              >
                {t.milestoneLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION D: PEER LEADERSHIP COMPARISON */}

      <div
        style={{
          background:
            "linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)",
          padding: "20px 28px",
          borderRadius: 20,
          border: "1.5px solid #E2E8F0",
          boxShadow:
            "0 2px 10px rgba(15, 23, 42, 0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <strong
              style={{
                fontSize: 15,
                color: "#0F172A",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Trophy size={16} color="#D97706" />
              Peer Leadership Comparison
            </strong>
          </div>

          <Link
            to="/leaderboard"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#2563EB",
              textDecoration: "none",
            }}
          >
            Full Leaderboard →
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
          }}
        >
          {/* Your Points */}

          <div
            style={{
              background: "#FFFDF0",
              padding: "14px 18px",
              borderRadius: 14,
              border: "1px solid #FEF08A",
            }}
          >
            <span
              style={{
                fontSize: 11.5,
                color: "#854D0E",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Your Points
            </span>

            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#0F172A",
                marginTop: 2,
              }}
            >
              {userPoints} pts
            </div>

            <span
              style={{
                fontSize: 11.5,
                color: "#B45309",
                fontWeight: 600,
              }}
            >
              Rank #{myRank} in Tamil Nadu
            </span>
          </div>

          {/* Batch Average */}

          <div
            style={{
              background: "#F8FAFC",
              padding: "14px 18px",
              borderRadius: 14,
              border: "1px solid #E2E8F0",
            }}
          >
            <span
              style={{
                fontSize: 11.5,
                color: "#64748B",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Batch Average
            </span>

            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#0F172A",
                marginTop: 2,
              }}
            >
              {avgPoints} pts
            </div>

            <span
              style={{
                fontSize: 11.5,
                color: "#64748B",
              }}
            >
              Across all students
            </span>
          </div>

          {/* Top Contributor */}

          <div
            style={{
              background: "#F0FDF4",
              padding: "14px 18px",
              borderRadius: 14,
              border: "1px solid #BBF7D0",
            }}
          >
            <span
              style={{
                fontSize: 11.5,
                color: "#166534",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Top Contributor
            </span>

            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#16A34A",
                marginTop: 2,
              }}
            >
              {topScore} pts
            </div>
          </div>
        </div>
      </div>

      {/* SECTION E: TWO-COLUMN MAIN CONTENT */}

      <div className="dashboard-grid-layout">
        <div className="dash-col-main">

          {/* OPEN VOLUNTEERING DRIVES */}

          <div className="dash-section-card">
            <div className="section-card-header">
              <div>
                <h2>Open Volunteering Drives</h2>
                <p>
                  Register now to make a difference and earn
                  impact points.
                </p>
              </div>

              <Link
                to="/opportunities"
                className="view-all-link"
              >
                All Drives ({opportunities.length}){" "}
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="opp-list">
              {upcomingOpportunities.length === 0 ? (
                <div
                  style={{
                    padding: "36px 20px",
                    textAlign: "center",
                    color: "#64748B",
                  }}
                >
                  <Calendar
                    size={32}
                    color="#94A3B8"
                    style={{ marginBottom: 8 }}
                  />

                  <h4
                    style={{
                      margin: "0 0 4px",
                      color: "#334155",
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    No volunteering drives yet
                  </h4>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                    }}
                  >
                    New opportunities created by
                    administrators will appear here.
                  </p>
                </div>
              ) : (
                upcomingOpportunities.map((opp) => {
                  const oppId = opp.id || opp._id;

                  return (
                    <div
                      key={oppId}
                      className="opp-item-card"
                    >
                      <img
                        src={
                          opp.image ||
                          "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=400&q=80"
                        }
                        alt={opp.title}
                        className="opp-item-thumb"
                      />

                      <div className="opp-item-info">
                        <div className="opp-tags-row">
                          <span className="category-pill">
                            {opp.category}
                          </span>

                          <span
                            className={`mode-pill ${(opp.mode || "offline").toLowerCase()}`}
                          >
                            {opp.mode || "Offline"}
                          </span>
                        </div>

                        <h3 className="opp-item-title">
                          <Link
                            to={`/opportunities/${oppId}`}
                          >
                            {opp.title}
                          </Link>
                        </h3>

                        <div className="opp-item-meta">
                          <span>
                            <Calendar size={13} />{" "}
                            {opp.date}
                          </span>

                          <span>
                            <Star
                              size={13}
                              color="#F59E0B"
                              fill="#F59E0B"
                            />{" "}
                            +{opp.points || 50} pts
                          </span>

                          <span>
                            <Users size={13} />{" "}
                            {opp.slotsAvailable ?? 10} slots
                            left
                          </span>
                        </div>
                      </div>

                      <div className="opp-item-actions">
                        <Link
                          to={`/opportunities/${oppId}/apply`}
                          className="apply-btn-sm"
                        >
                          Register Now
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* MY REGISTERED EVENTS */}

          <div className="dash-section-card">
            <div className="section-card-header">
              <div>
                <h2>My Upcoming Events</h2>
                <p>
                  Your accepted volunteering drives.
                </p>
              </div>

              <Link
                to="/applications"
                className="view-all-link"
              >
                All ({myRegisteredEvents.length})
              </Link>
            </div>

            <div className="my-events-list">
              {myRegisteredEvents.length === 0 ? (
                <div className="empty-events-state">
                  <Calendar
                    size={32}
                    color="#94A3B8"
                    style={{ marginBottom: 8 }}
                  />

                  <h4>No registered events yet</h4>

                  <p>
                    Browse upcoming drives and submit your
                    application to get started.
                  </p>

                  <Link
                    to="/opportunities"
                    className="dash-btn dash-btn-primary"
                    style={{
                      display: "inline-flex",
                      padding: "7px 14px",
                      fontSize: "12px",
                    }}
                  >
                    Browse Opportunities
                  </Link>
                </div>
              ) : (
                myRegisteredEvents.map((app) => (
                  <div
                    key={app.id || app._id}
                    className="my-event-card"
                  >
                    <div className="my-event-status-row">
                      <span
                        className={`status-pill ${
                          app.status === "Approved"
                            ? "approved"
                            : "pending"
                        }`}
                      >
                        {app.status === "Approved" ? (
                          <>
                            <CheckCircle2 size={12} />
                            Approved
                          </>
                        ) : (
                          "Pending Review"
                        )}
                      </span>

                      <span className="my-event-ref">
                        {app.referenceId}
                      </span>
                    </div>

                    <div className="my-event-info">
                      <h4 className="my-event-title">
                        {app.opportunityTitle}
                      </h4>

                      <p className="my-event-meta">
                        <span>
                          <Calendar size={13} />{" "}
                          {app.eventDate}
                        </span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RECENT POINTS TRANSACTIONS */}

          <div className="dash-section-card">
            <div className="section-card-header">
              <div>
                <h2>Points &amp; Rewards</h2>
                <p>Recent impact points earned.</p>
              </div>

              <Link
                to="/contributions"
                className="view-all-link"
              >
                View All
              </Link>
            </div>

            {pointsHistory && pointsHistory.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background:
                            tx.type === "DEBIT"
                              ? "#FEE2E2"
                              : "#FEF9C3",
                          color:
                            tx.type === "DEBIT"
                              ? "#DC2626"
                              : "#CA8A04",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                        }}
                      >
                        <Coins size={16} />
                      </div>

                      <div>
                        <strong
                          style={{
                            fontSize: 13,
                            color: "#0F172A",
                            display: "block",
                          }}
                        >
                          {tx.eventName ||
                            tx.reason ||
                            "Volunteer Activity"}
                        </strong>

                        <span
                          style={{
                            fontSize: 11,
                            color: "#64748B",
                          }}
                        >
                          {tx.createdAt
                            ? new Date(
                                tx.createdAt
                              ).toLocaleDateString("en-IN")
                            : "Recent"}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: 13.5,
                        color:
                          tx.type === "DEBIT"
                            ? "#DC2626"
                            : "#16A34A",
                      }}
                    >
                      {tx.type === "DEBIT" ? "-" : "+"}
                      {tx.points} pts
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  fontSize: 13,
                  color: "#94A3B8",
                  margin: 0,
                  padding: "8px 0",
                }}
              >
                No points transactions recorded yet. Join
                events to earn impact points!
              </p>
            )}
          </div>

          {/* RECENT NOTIFICATIONS */}

          <div className="dash-section-card">
            <div className="section-card-header">
              <div>
                <h2>Recent Notifications</h2>
                <p>
                  Updates, badges and drive approvals.
                </p>
              </div>

              <Link
                to="/notifications"
                className="view-all-link"
              >
                View All
              </Link>
            </div>

            {notifications && notifications.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {notifications.slice(0, 3).map((item) => (
                  <div
                    key={item._id || item.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 12px",
                      background: item.isRead
                        ? "#FFFFFF"
                        : "#EFF6FF",
                      borderRadius: 10,
                      border: "1px solid",
                      borderColor: item.isRead
                        ? "#E2E8F0"
                        : "#BFDBFE",
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

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <strong
                        style={{
                          fontSize: 13,
                          color: "#0F172A",
                          display: "block",
                        }}
                      >
                        {item.title}
                      </strong>

                      <p
                        style={{
                          fontSize: 12,
                          color: "#475569",
                          margin: "2px 0 0",
                          lineHeight: 1.4,
                        }}
                      >
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  fontSize: 13,
                  color: "#94A3B8",
                  margin: 0,
                  padding: "8px 0",
                }}
              >
                No new notifications. You're all caught
                up!
              </p>
            )}
          </div>
        </div>
      </div>
      </>
    )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 2: MY EVENTS (Registered & Participated Events)
      ══════════════════════════════════════════════════════════════════════ */}
      {dashboardSection === "events" && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px", color: "#0F172A" }}>
                My Registered &amp; Completed Events
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>
                Track your active applications, confirmed volunteer slots, and completed social drives.
              </p>
            </div>

            {/* Filter Buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["All", "Approved", "Completed", "Pending"].map((flt) => {
                const count = flt === "All"
                  ? applications.length
                  : applications.filter((a) => (a.status || "").toLowerCase() === flt.toLowerCase()).length;
                const isSelected = eventFilter === flt;
                return (
                  <button
                    key={flt}
                    type="button"
                    onClick={() => setEventFilter(flt)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: isSelected ? "1.5px solid #004D99" : "1px solid #CBD5E1",
                      background: isSelected ? "#004D99" : "#FFFFFF",
                      color: isSelected ? "#FFFFFF" : "#475569",
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {flt} <span style={{ opacity: 0.8, fontSize: 11 }}>({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {(() => {
            const filteredApps = applications.filter((app) => {
              if (eventFilter === "All") return true;
              return (app.status || "").toLowerCase() === eventFilter.toLowerCase();
            });

            if (filteredApps.length === 0) {
              return (
                <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", padding: "48px 24px", textAlign: "center", color: "#64748B" }}>
                  <Calendar size={42} color="#CBD5E1" style={{ marginBottom: 12 }} />
                  <h3 style={{ margin: "0 0 6px", color: "#1E293B", fontSize: 17, fontWeight: 800 }}>
                    No {eventFilter !== "All" ? eventFilter.toLowerCase() : ""} events found
                  </h3>
                  <p style={{ margin: "0 0 16px", fontSize: 13.5 }}>
                    Explore open community drives to join hands with fellow student volunteers.
                  </p>
                  <Link
                    to="/opportunities"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#FFD629",
                      color: "#151515",
                      fontWeight: 800,
                      fontSize: 13,
                      padding: "10px 20px",
                      borderRadius: 10,
                      textDecoration: "none",
                    }}
                  >
                    <Compass size={15} /> Browse Open Opportunities
                  </Link>
                </div>
              );
            }

            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                {filteredApps.map((app) => {
                  const ev = app.opportunity || app.event || {};
                  const eventId = app.opportunityId || app.eventId || ev._id || ev.id;
                  const isApproved = app.status === "Approved";
                  const isCompleted = app.status === "Completed";
                  const isPending = app.status === "Pending";
                  const isRejected = app.status === "Rejected";

                  return (
                    <div
                      key={app._id || app.id}
                      style={{
                        background: "#FFFFFF",
                        borderRadius: 16,
                        border: isCompleted ? "1.5px solid #8B5CF6" : isApproved ? "1.5px solid #10B981" : "1px solid #E2E8F0",
                        padding: 20,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: 4,
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          background: isCompleted ? "#8B5CF6" : isApproved ? "#10B981" : isPending ? "#F59E0B" : "#EF4444",
                        }}
                      />
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              padding: "4px 10px",
                              borderRadius: 20,
                              background: isCompleted ? "#EDE9FE" : isApproved ? "#DCFCE7" : isPending ? "#FEF3C7" : "#FEE2E2",
                              color: isCompleted ? "#6D28D9" : isApproved ? "#15803D" : isPending ? "#B45309" : "#B91C1C",
                            }}
                          >
                            {app.status || "Pending"}
                          </span>
                          <span style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 600 }}>
                            Ref: {app.referenceId || "MAT-" + String(app._id || app.id || "").slice(-4).toUpperCase()}
                          </span>
                        </div>

                        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: "#0F172A", lineHeight: 1.35 }}>
                          {app.opportunityTitle || ev.title || "Community Drive"}
                        </h3>

                        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "#64748B", marginBottom: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Calendar size={13} color="#0066CC" />
                            <span>{ev.date || "Scheduled Date"} • {ev.time || "Morning Shift"}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <MapPin size={13} color="#EF4444" />
                            <span>{ev.location || "Tamil Nadu"}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Clock size={13} color="#10B981" />
                            <span><strong>+{ev.durationHours || 4} verified hours</strong> on completion</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
                        {eventId && (
                          <Link
                            to={`/opportunities/${eventId}`}
                            style={{
                              flex: 1,
                              textAlign: "center",
                              background: "#F1F5F9",
                              color: "#1E293B",
                              padding: "8px 12px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            View Drive Details
                          </Link>
                        )}
                        {isCompleted && (
                          <button
                            type="button"
                            onClick={() => {
                              const matchingCert = certificates.find((c) => (c.eventId || "").toString() === (eventId || "").toString());
                              if (matchingCert) {
                                openCertificate?.(matchingCert);
                              } else {
                                setDashboardSection("certificates");
                              }
                            }}
                            style={{
                              flex: 1,
                              background: "#8B5CF6",
                              color: "#FFFFFF",
                              border: "none",
                              padding: "8px 12px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            📜 Certificate
                          </button>
                        )}
                        {isPending && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm("Cancel your volunteer application for this drive?")) {
                                try {
                                  await cancelApplication?.(app._id || app.id);
                                  showToast("Application cancelled.");
                                } catch (e) {
                                  showToast(e.message || "Failed to cancel", "error");
                                }
                              }
                            }}
                            style={{
                              background: "#FFF1F2",
                              color: "#E11D48",
                              border: "1px solid #FECDD3",
                              padding: "8px 12px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 3: MY CERTIFICATES (Gold Border Recognition & PDF Download)
      ══════════════════════════════════════════════════════════════════════ */}
      {dashboardSection === "certificates" && (
        <div style={{ marginTop: 8 }}>
          {/* Header & Stats Banner */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <span style={{ color: "#B45309", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase" }}>
                STUDENT ACHIEVEMENTS
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 900, margin: "4px 0", color: "#0F172A" }}>
                My Official Certificates <span style={{ color: "#F59E0B" }}>.</span>
              </h2>
              <p style={{ margin: 0, fontSize: 13.5, color: "#64748B" }}>
                Authentic, verifiable volunteer credentials awarded for your on-ground impact.
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
            <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "18px 20px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FEF3C7", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                🏆
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>{certificates.length}</div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>Certificates Earned</div>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "18px 20px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                🤝
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>{eventsCount}</div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>Completed Drives</div>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "18px 20px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#DBEAFE", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                ⌛
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>{verifiedHours} Hrs</div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>Volunteering Hours</div>
              </div>
            </div>
          </div>

          {/* Certificates Grid */}
          {certificates.length === 0 ? (
            <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", padding: "50px 20px", textAlign: "center", color: "#64748B" }}>
              <Award size={48} color="#CBD5E1" style={{ marginBottom: 12 }} />
              <h3 style={{ margin: "0 0 6px", color: "#1E293B", fontSize: 18, fontWeight: 800 }}>No Certificates Yet</h3>
              <p style={{ margin: "0 0 18px", fontSize: 13.5, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
                Participate in verified volunteering drives. When the administrator completes the event, your official certificate will be generated and credited here!
              </p>
              <Link
                to="/opportunities"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#FFD629",
                  color: "#151515",
                  fontWeight: 800,
                  fontSize: 13,
                  padding: "10px 22px",
                  borderRadius: 10,
                  textDecoration: "none",
                }}
              >
                <Compass size={15} /> Find Volunteering Drives
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
              {certificates.map((cert) => (
                <div
                  key={cert.certificateId || cert.id}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 16,
                    border: "1px solid #E2E8F0",
                    overflow: "hidden",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  {/* Decorative Mini Certificate Preview Header */}
                  <div
                    style={{
                      background: "#171717",
                      padding: "16px 20px",
                      position: "relative",
                      color: "#FFFFFF",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        border: "2px solid #FFD629",
                        outline: "1px solid rgba(255,255,255,0.4)",
                        outlineOffset: -4,
                        padding: "12px 10px",
                        background: "#0A0A0A",
                      }}
                    >
                      <span style={{ fontSize: 18, color: "#FFD629" }}>✦</span>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: "#FFD629", textTransform: "uppercase" }}>
                        MAATRAM FOUNDATION
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 2, margin: "2px 0 0" }}>
                        CERTIFICATE
                      </div>
                      <div style={{ fontSize: 9.5, color: "#E5BD00", fontWeight: 700, letterSpacing: 1 }}>
                        OF APPRECIATION
                      </div>
                      <div style={{ width: "50%", height: 1.5, background: "#FFD629", margin: "6px auto" }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#E2E8F0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {cert.eventTitle}
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, background: "#FEF3C7", color: "#B45309", padding: "3px 8px", borderRadius: 6 }}>
                        {cert.eventCategory || "Volunteering"}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 800, background: "#DCFCE7", color: "#16A34A", padding: "3px 8px", borderRadius: 6 }}>
                        ✓ Available
                      </span>
                    </div>

                    <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#0F172A", lineHeight: 1.35 }}>
                      {cert.eventTitle}
                    </h4>
                    <p style={{ margin: "0 0 12px", fontSize: 12, color: "#64748B" }}>
                      Awarded to <strong>{cert.volunteerName || user?.fullName}</strong>
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #F1F5F9", borderBottom: "1px solid #F1F5F9", fontSize: 12, color: "#475569" }}>
                      <span>📅 {cert.eventDate || cert.issueDate}</span>
                      <span>⌛ {cert.verifiedHours} Hours</span>
                    </div>

                    <div style={{ fontSize: 10.5, fontFamily: "monospace", color: "#94A3B8", margin: "10px 0 16px" }}>
                      ID: {cert.certificateId}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => openCertificate?.(cert)}
                        style={{
                          flex: 1,
                          padding: "9px 12px",
                          borderRadius: 8,
                          border: "1px solid #CBD5E1",
                          background: "#FFFFFF",
                          color: "#1E293B",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Preview
                      </button>

                      <button
                        type="button"
                        onClick={() => openCertificate?.(cert)}
                        style={{
                          flex: 1.2,
                          padding: "9px 12px",
                          borderRadius: 8,
                          border: "none",
                          background: "#FFD629",
                          color: "#0F172A",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <Download size={14} /> Download PDF
                      </button>

                      <button
                        type="button"
                        onClick={() => openLinkedInShare?.({
                          volunteerName: cert.volunteerName || user?.fullName,
                          eventTitle: cert.eventTitle,
                          hours: cert.verifiedHours,
                          category: cert.eventCategory,
                          date: cert.eventDate || cert.issueDate,
                          certificateId: cert.certificateId,
                        })}
                        title="Share on LinkedIn"
                        style={{
                          padding: "9px 12px",
                          borderRadius: 8,
                          border: "1px solid #0077B5",
                          background: "#0077B5",
                          color: "#FFFFFF",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 4: MY LINKEDIN CONTENT (Ready-to-Use Post Generator)
      ══════════════════════════════════════════════════════════════════════ */}
      {dashboardSection === "linkedin" && (
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 20 }}>
            <span style={{ color: "#0077B5", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase" }}>
              SOCIAL LEADERSHIP
            </span>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: "4px 0", color: "#0F172A" }}>
              Ready-to-Share LinkedIn Posts
            </h2>
            <p style={{ margin: 0, fontSize: 13.5, color: "#64748B" }}>
              Broaden your professional presence! Copy professionally drafted posts highlighting your social volunteering drives.
            </p>
          </div>

          {(() => {
            const completedEvents = applications.filter((a) => a.status === "Completed");
            const postsToShare = [
              {
                id: "post_summary",
                tag: "Volunteering Journey Summary",
                headline: `Milestone Achieved: ${userPoints} Points & ${verifiedHours} Verified Community Service Hours`,
                content: `Proud to share my volunteering milestone with Maatram Foundation! 🌟\n\nOver the past months, I have dedicated ${verifiedHours} hours on-ground and earned ${userPoints} leadership points empowering deserving high school students and rural communities.\n\nVolunteering has helped me sharpen my communication, team coordination, and empathetic leadership skills.\n\nThank you to the mentors and coordinators at Maatram Foundation for building this platform! 🤝\n\n#MaatramFoundation #Volunteering #SocialImpact #StudentLeadership #CommunityFirst`,
              },
              ...completedEvents.map((a, idx) => ({
                id: `post_event_${idx}`,
                tag: "Event Completion",
                headline: `Completed Initiative: ${a.opportunityTitle || a.event?.title || "Community Drive"}`,
                content: `I am proud to share that I have successfully completed the volunteering initiative for "${a.opportunityTitle || a.event?.title || 'Community Service'}" with Maatram Foundation!\n\nDedicated ${a.event?.durationHours || 4} hours to creating meaningful community impact. Grateful to be part of the change!\n\n"Thank you for being part of the Maatram community. Your contribution is helping us build a better tomorrow!"\n\n#MaatramFoundation #Volunteering #SocialImpact #StudentLeadership`,
              })),
            ];

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {postsToShare.map((postItem, idx) => (
                  <div
                    key={postItem.id}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 16,
                      border: "1px solid #E2E8F0",
                      padding: 24,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, background: "#EFF6FF", color: "#1D4ED8", padding: "4px 10px", borderRadius: 20 }}>
                        {postItem.tag}
                      </span>
                      <span style={{ fontSize: 12, color: "#64748B" }}>
                        Format: LinkedIn Post
                      </span>
                    </div>

                    <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                      {postItem.headline}
                    </h3>

                    <div
                      style={{
                        background: "#F8FAFC",
                        borderRadius: 10,
                        border: "1px solid #E2E8F0",
                        padding: 16,
                        fontFamily: "monospace",
                        fontSize: 13,
                        color: "#334155",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        marginBottom: 16,
                      }}
                    >
                      {postItem.content}
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(postItem.content);
                            setCopiedIndex(idx);
                            showToast("Content copied to clipboard! Paste it into LinkedIn.");
                            setTimeout(() => setCopiedIndex(null), 3000);
                          } catch (e) {
                            showToast("Failed to copy automatically", "error");
                          }
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "10px 18px",
                          borderRadius: 8,
                          border: "1px solid #CBD5E1",
                          background: copiedIndex === idx ? "#DCFCE7" : "#FFFFFF",
                          color: copiedIndex === idx ? "#15803D" : "#1E293B",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        {copiedIndex === idx ? <Check size={16} /> : <Copy size={16} />}
                        {copiedIndex === idx ? "Copied to Clipboard!" : "Copy Post Content"}
                      </button>

                      <a
                        href={`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(postItem.content)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "10px 20px",
                          borderRadius: 8,
                          background: "#0077B5",
                          color: "#FFFFFF",
                          fontWeight: 700,
                          fontSize: 13,
                          textDecoration: "none",
                        }}
                      >
                        <Share2 size={16} /> Share on LinkedIn
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 5: MY POINTS (Volunteer Points Ledger & Tier Breakdown)
      ══════════════════════════════════════════════════════════════════════ */}
      {dashboardSection === "points" && (
        <div style={{ marginTop: 8 }}>
          {/* Header Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)",
              borderRadius: 18,
              padding: "24px 28px",
              color: "#FFFFFF",
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#FFD629", letterSpacing: 1.5, textTransform: "uppercase" }}>
                RECOGNITION METRIC
              </span>
              <h2 style={{ fontSize: 28, fontWeight: 900, margin: "4px 0" }}>
                {userPoints} <span style={{ fontSize: 16, fontWeight: 600, color: "#BFDBFE" }}>Total Impact Points</span>
              </h2>
              <p style={{ margin: 0, fontSize: 13.5, color: "#DBEAFE" }}>
                Current Recognition Level: <strong>{currentTier.name}</strong> • Next Milestone: <strong>{targetPts} pts</strong>
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", padding: "14px 22px", borderRadius: 14, textAlign: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
              <div style={{ fontSize: 11, color: "#BFDBFE", fontWeight: 700, textTransform: "uppercase" }}>Verified Hours</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#FFD629" }}>{verifiedHours} hrs</div>
            </div>
          </div>

          {/* Points Transactions Ledger */}
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0F172A" }}>
                Points Ledger &amp; Transaction History
              </h3>
              <span style={{ fontSize: 12.5, color: "#64748B" }}>{pointsHistory.length} Transactions</span>
            </div>

            {pointsHistory.length === 0 ? (
              <div style={{ padding: "48px 20px", textAlign: "center", color: "#64748B" }}>
                <Coins size={40} color="#CBD5E1" style={{ marginBottom: 12 }} />
                <h4 style={{ margin: "0 0 6px", color: "#1E293B", fontSize: 16, fontWeight: 800 }}>No Points Transactions Yet</h4>
                <p style={{ margin: 0, fontSize: 13.5 }}>
                  Participate in volunteer drives. When an event is marked as completed by administrators, points will be credited directly here.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "left" }}>
                      <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Date</th>
                      <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Type</th>
                      <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Points</th>
                      <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Reason &amp; Activity</th>
                      <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Audited By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pointsHistory.map((tx) => {
                      const isCredit = tx.type === "CREDIT";
                      return (
                        <tr key={tx._id || tx.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "14px 18px", color: "#64748B" }}>
                            {tx.createdAt || tx.date ? new Date(tx.createdAt || tx.date).toLocaleDateString("en-IN") : "—"}
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                padding: "3px 8px",
                                borderRadius: 6,
                                background: isCredit ? "#DCFCE7" : "#FEE2E2",
                                color: isCredit ? "#15803D" : "#B91C1C",
                              }}
                            >
                              {tx.type || "CREDIT"}
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px", fontWeight: 800, color: isCredit ? "#15803D" : "#B91C1C" }}>
                            {isCredit ? `+${tx.points}` : `-${tx.points}`} pts
                          </td>
                          <td style={{ padding: "14px 18px", color: "#1E293B" }}>
                            <strong>{tx.reason}</strong>
                            {tx.adminRemarks && (
                              <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                                {tx.adminRemarks}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "14px 18px", color: "#475569", fontSize: 12 }}>
                            {tx.adminName || "Admin Coordinator"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 6: PARTICIPATION HISTORY (Full Searchable Activity Records)
      ══════════════════════════════════════════════════════════════════════ */}
      {dashboardSection === "history" && (
        <div style={{ marginTop: 8 }}>
          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <span style={{ color: "#0066CC", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase" }}>
              STUDENT ACTIVITIES
            </span>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: "4px 0", color: "#0F172A" }}>
              My Complete Activity History <span style={{ color: "#0066CC" }}>.</span>
            </h2>
            <p style={{ margin: 0, fontSize: 13.5, color: "#64748B" }}>
              Explore every event, competition, and volunteering drive you have participated in across Tamil Nadu.
            </p>
          </div>

          {/* Search & Category Filter Controls */}
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", padding: "16px 20px", marginBottom: 20, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", flex: "1 1 240px" }}>
              <Search size={15} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search history by title, category, or location..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 34px",
                  borderRadius: 8,
                  border: "1px solid #CBD5E1",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["All", "Volunteering", "School Visits", "Workshops", "Technical"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setHistoryCategory(cat)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: historyCategory === cat ? "1.5px solid #004D99" : "1px solid #CBD5E1",
                    background: historyCategory === cat ? "#004D99" : "#FFFFFF",
                    color: historyCategory === cat ? "#FFFFFF" : "#475569",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* History Event Cards Grid */}
          {(() => {
            const combinedHistory = applications.map((a) => {
              const ev = a.opportunity || a.event || {};
              return {
                id: a._id || a.id,
                title: a.opportunityTitle || ev.title || "Community Volunteering Drive",
                category: ev.category || "Volunteering",
                date: ev.date || (a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN") : "Recent"),
                location: ev.location || "Tamil Nadu",
                organizer: ev.organizer || "Maatram Foundation",
                role: a.status === "Completed" ? "Completed Volunteer" : "Registered Volunteer",
                status: a.status || "Completed",
                duration: `${ev.durationHours || 4} Hours`,
                description: ev.description || "Active participation in social service and career mentoring for underprivileged school students.",
                certificate: a.status === "Completed" ? "Yes" : "Processing",
                image: ev.image || "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800",
              };
            });

            const filteredHistory = combinedHistory.filter((item) => {
              const matchSearch =
                !historySearch.trim() ||
                item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
                item.category.toLowerCase().includes(historySearch.toLowerCase()) ||
                item.location.toLowerCase().includes(historySearch.toLowerCase());
              const matchCat =
                historyCategory === "All" ||
                item.category.toLowerCase().includes(historyCategory.toLowerCase());
              return matchSearch && matchCat;
            });

            if (filteredHistory.length === 0) {
              return (
                <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", padding: "48px 20px", textAlign: "center", color: "#64748B" }}>
                  <History size={40} color="#CBD5E1" style={{ marginBottom: 12 }} />
                  <h4 style={{ margin: "0 0 6px", color: "#1E293B", fontSize: 16, fontWeight: 800 }}>No Participation Records Found</h4>
                  <p style={{ margin: 0, fontSize: 13.5 }}>
                    Your event registrations and completed drives will be automatically archived here.
                  </p>
                </div>
              );
            }

            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedHistoryEvent(item)}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 14,
                      border: "1px solid #E2E8F0",
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ height: 140, position: "relative", overflow: "hidden", background: "#0F172A" }}>
                      <img
                        src={item.image}
                        alt={item.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          background: "#FFD629",
                          color: "#151515",
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: "4px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {item.category}
                      </span>
                    </div>

                    <div style={{ padding: 18 }}>
                      <div style={{ fontSize: 11.5, color: "#B45309", fontWeight: 700, marginBottom: 6 }}>
                        📅 {item.date}
                      </div>

                      <h4 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: "#0F172A", lineHeight: 1.35 }}>
                        {item.title}
                      </h4>

                      <p style={{ margin: "0 0 14px", fontSize: 12, color: "#64748B" }}>
                        📍 {item.location}
                      </p>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #F1F5F9" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: item.status === "Completed" ? "#EDE9FE" : "#DCFCE7",
                            color: item.status === "Completed" ? "#6D28D9" : "#15803D",
                          }}
                        >
                          {item.status}
                        </span>

                        <span style={{ fontSize: 12, fontWeight: 700, color: "#0066CC" }}>
                          View Details ↗
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* History Details Modal */}
          {selectedHistoryEvent && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
                zIndex: 1000,
              }}
              onClick={() => setSelectedHistoryEvent(null)}
            >
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 16,
                  maxWidth: 600,
                  width: "100%",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  padding: 24,
                  position: "relative",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setSelectedHistoryEvent(null)}
                  style={{
                    position: "absolute",
                    right: 16,
                    top: 16,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "none",
                    background: "#F1F5F9",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>

                <span style={{ fontSize: 11, fontWeight: 800, color: "#0066CC", letterSpacing: 1, textTransform: "uppercase" }}>
                  EVENT PARTICIPATION DETAILS
                </span>
                <h3 style={{ margin: "6px 0 12px", fontSize: 20, fontWeight: 900, color: "#0F172A" }}>
                  {selectedHistoryEvent.title}
                </h3>

                <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.6, marginBottom: 20 }}>
                  {selectedHistoryEvent.description}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
                  <div style={{ background: "#F8FAFC", padding: 12, borderRadius: 8, borderLeft: "3px solid #004D99" }}>
                    <div style={{ fontSize: 11, color: "#64748B" }}>Event Date</div>
                    <strong style={{ fontSize: 13, color: "#0F172A" }}>{selectedHistoryEvent.date}</strong>
                  </div>

                  <div style={{ background: "#F8FAFC", padding: 12, borderRadius: 8, borderLeft: "3px solid #004D99" }}>
                    <div style={{ fontSize: 11, color: "#64748B" }}>Location</div>
                    <strong style={{ fontSize: 13, color: "#0F172A" }}>{selectedHistoryEvent.location}</strong>
                  </div>

                  <div style={{ background: "#F8FAFC", padding: 12, borderRadius: 8, borderLeft: "3px solid #004D99" }}>
                    <div style={{ fontSize: 11, color: "#64748B" }}>Organizer</div>
                    <strong style={{ fontSize: 13, color: "#0F172A" }}>{selectedHistoryEvent.organizer}</strong>
                  </div>

                  <div style={{ background: "#F8FAFC", padding: 12, borderRadius: 8, borderLeft: "3px solid #004D99" }}>
                    <div style={{ fontSize: 11, color: "#64748B" }}>Duration</div>
                    <strong style={{ fontSize: 13, color: "#0F172A" }}>{selectedHistoryEvent.duration}</strong>
                  </div>

                  <div style={{ background: "#F8FAFC", padding: 12, borderRadius: 8, borderLeft: "3px solid #004D99" }}>
                    <div style={{ fontSize: 11, color: "#64748B" }}>Certificate Issued</div>
                    <strong style={{ fontSize: 13, color: "#0F172A" }}>{selectedHistoryEvent.certificate}</strong>
                  </div>

                  <div style={{ background: "#F8FAFC", padding: 12, borderRadius: 8, borderLeft: "3px solid #004D99" }}>
                    <div style={{ fontSize: 11, color: "#64748B" }}>Status</div>
                    <strong style={{ fontSize: 13, color: "#0F172A" }}>{selectedHistoryEvent.status}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedHistoryEvent(null)}
                    style={{
                      background: "#FFD629",
                      color: "#151515",
                      border: "none",
                      padding: "10px 22px",
                      borderRadius: 8,
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}