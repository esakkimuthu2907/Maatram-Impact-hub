import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Award,
  Search,
  Star,
  Medal,
  Clock,
  Users,
  Building2,
  GraduationCap,
  TrendingUp,
  Zap,
  RotateCcw,
  MapPin,
  Calendar,
  X,
  Gem,
  Crown,
  Leaf,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { usersAPI } from "../../api/usersAPI";
import "./StudentDashboard.css";

/* ─────────────── helpers ─────────────── */
const MEDAL = ["🥇", "🥈", "🥉"];

/* Single source of truth for the table grid (header + rows)
   Volunteer column is now a fixed width so the gap before College is small */
const STUDENT_GRID = "56px 235px 1.3fr 80px 110px 100px 90px 200px";
const COLLEGE_STUDENT_GRID = "50px 220px 1fr 80px 90px 80px 90px 200px";
const ZONE_COLLEGE_GRID = "50px 330px 80px 90px 90px 100px 1fr";

/* Zone-wise tab shows only this zone */
const ZONE_TO_SHOW = "Zone 1";
const ZONE_REGION = "North Tamil Nadu & Chennai Region";

/* Colour theme for each tab button */
const TAB_THEME = {
  Overall: {
    grad: "linear-gradient(135deg,#0F172A,#1D4ED8)",
    tint: "#EFF6FF",
    text: "#1D4ED8",
    glow: "rgba(29,78,216,0.45)",
  },
  College: {
    grad: "linear-gradient(135deg,#6D28D9,#C026D3)",
    tint: "#FAF5FF",
    text: "#7E22CE",
    glow: "rgba(168,85,247,0.45)",
  },
  Zone: {
    grad: "linear-gradient(135deg,#047857,#14B8A6)",
    tint: "#ECFDF5",
    text: "#047857",
    glow: "rgba(16,185,129,0.45)",
  },
};

/* Work out 1st-4th year from "2023-2027" style batches (academic year starts ~June) */
function yearOfStudy(u) {
  const ay = String(u.academicYear || "").match(/[1-4]/);
  if (ay) return Number(ay[0]);
  const m = String(u.batch || "").match(/(\d{4})/);
  if (!m) return null;
  const now = new Date();
  const yr = now.getFullYear() - Number(m[1]) + (now.getMonth() >= 5 ? 1 : 0);
  return yr >= 1 && yr <= 4 ? yr : null;
}

function rankMedal(rank) {
  if (rank <= 3) return <span style={{ fontSize: 22 }}>{MEDAL[rank - 1]}</span>;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "#F1F5F9",
        border: "1px solid #E2E8F0",
        color: "#475569",
        fontWeight: 700,
        fontSize: 13,
      }}
    >
      {rank}
    </span>
  );
}

/* Tier styles – gradient, glow & icon */
function badgeTierStyle(tier) {
  const base = {
    bg: "linear-gradient(135deg,#1E3A5F,#1E40AF)",
    color: "#93C5FD",
    border: "rgba(147,197,253,0.45)",
    glow: "rgba(147,197,253,0.25)",
    iconBg: "linear-gradient(135deg,#93C5FD,#3B82F6)",
    iconColor: "#1E3A5F",
    icon: Award,
  };
  if (!tier) return base;
  const t = tier.toLowerCase();
  if (t.includes("green"))
    return {
      bg: "linear-gradient(135deg,#052e16,#14532d)",
      color: "#4ade80",
      border: "rgba(74,222,128,0.45)",
      glow: "rgba(74,222,128,0.3)",
      iconBg: "linear-gradient(135deg,#86efac,#16a34a)",
      iconColor: "#052e16",
      icon: Leaf,
    };
  if (t.includes("platinum"))
    return {
      bg: "linear-gradient(135deg,#1e293b,#334155)",
      color: "#e2e8f0",
      border: "rgba(226,232,240,0.45)",
      glow: "rgba(226,232,240,0.25)",
      iconBg: "linear-gradient(135deg,#f1f5f9,#94a3b8)",
      iconColor: "#1e293b",
      icon: Crown,
    };
  if (t.includes("diamond"))
    return {
      bg: "linear-gradient(135deg,#172554,#1e3a8a)",
      color: "#93c5fd",
      border: "rgba(147,197,253,0.5)",
      glow: "rgba(96,165,250,0.35)",
      iconBg: "linear-gradient(135deg,#bfdbfe,#3b82f6)",
      iconColor: "#172554",
      icon: Gem,
    };
  if (t.includes("gold"))
    return {
      bg: "linear-gradient(135deg,#2d1a00,#78350f)",
      color: "#fbbf24",
      border: "rgba(251,191,36,0.5)",
      glow: "rgba(251,191,36,0.3)",
      iconBg: "linear-gradient(135deg,#fde68a,#f59e0b)",
      iconColor: "#78350f",
      icon: Trophy,
    };
  if (t.includes("silver"))
    return {
      bg: "linear-gradient(135deg,#1e293b,#334155)",
      color: "#cbd5e1",
      border: "rgba(203,213,225,0.45)",
      glow: "rgba(148,163,184,0.3)",
      iconBg: "linear-gradient(135deg,#e2e8f0,#94a3b8)",
      iconColor: "#1e293b",
      icon: Star,
    };
  /* bronze / default */
  return {
    bg: "linear-gradient(135deg,#2d1a00,#431407)",
    color: "#fb923c",
    border: "rgba(251,146,60,0.45)",
    glow: "rgba(251,146,60,0.28)",
    iconBg: "linear-gradient(135deg,#fdba74,#ea580c)",
    iconColor: "#431407",
    icon: Medal,
  };
}

/* ─────────────── Tier Badge (last column pill) ─────────────── */
function TierBadge({ tier }) {
  const s = badgeTierStyle(tier);
  const Icon = s.icon;
  return (
    <span
      title={tier}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 14px 4px 4px",
        borderRadius: 999,
        background: s.bg,
        border: `1px solid ${s.border}`,
        boxShadow: `0 4px 14px ${s.glow}, inset 0 1px 0 rgba(255,255,255,0.12)`,
        color: s.color,
        fontSize: 11.5,
        fontWeight: 800,
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: s.iconBg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
          flexShrink: 0,
        }}
      >
        <Icon size={13} color={s.iconColor} strokeWidth={2.4} />
      </span>
      {tier}
    </span>
  );
}

/* ─────────────── Active filter chip ─────────────── */
function FilterChip({ icon, label, onRemove }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "#DBEAFE",
        color: "#1E3A8A",
        border: "1px solid #93C5FD",
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {icon} {label}
      <button
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          lineHeight: 1,
          color: "#1D4ED8",
        }}
      >
        <X size={12} />
      </button>
    </span>
  );
}

/* ─────────────── Main Component ─────────────── */
export default function LeaderboardPage() {
  const { user, opportunities = [], applications = [] } = useApp();
  const [activeTab, setActiveTab] = useState("Overall");
  const [search, setSearch] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("All");
  const [selectedZone, setSelectedZone] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState("All");
  const [collegeSearch, setCollegeSearch] = useState("");
  const [collegeYearFilter, setCollegeYearFilter] = useState("All");
  const [zoneCollegeSearch, setZoneCollegeSearch] = useState("");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        /* ── individual leaderboard ── */
        const res = await usersAPI.getLeaderboard();
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((u, index) => ({
            rank: u.rank || index + 1,
            id: u.id || u._id,
            applicationId: u.applicationId,
            name: u.fullName || u.name || "Student Volunteer",
            college: u.college || "Velammal Engineering college Chennai",
            department: u.department || "Engineering",
            zone: u.zone || "Zone 1",
            batch: u.batch || "2023-2027",
            eventsJoined: Number(u.eventsJoined) || Number(u.completedEventsCount) || 0,
            completedEventsCount: Number(u.completedEventsCount) || 0,
            participatedEvents: Array.isArray(u.participatedEvents) ? u.participatedEvents : [],
            participatedEventDetails: Array.isArray(u.participatedEventDetails) ? u.participatedEventDetails : [],
            badges: u.badgesEarned || 0,
            points: Number(u.points) || 0,
            totalHours: Number(u.totalHours) || 0,
            avatar:
              u.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                u.fullName || "Student"
              )}`,
            badgeTier:
              (u.points || 0) >= 1500
                ? "Green Gem Leader"
                : (u.points || 0) >= 1000
                  ? "Platinum Volunteer"
                  : (u.points || 0) >= 500
                    ? "Diamond Volunteer"
                    : (u.points || 0) >= 250
                      ? "Gold Impact Champion"
                      : (u.points || 0) >= 100
                        ? "Silver Star Volunteer"
                        : "Bronze Social Leader",
            category: "Students",
            isCurrentUser: user
              ? u.applicationId === user.applicationId ||
              u.id === user.id ||
              u.id === user._id ||
              u.email === user.email
              : false,
          }));
          setLeaderboardData(mapped);
        } else {
          setLeaderboardData([
            {
              rank: 1,
              name: user?.fullName || user?.name || "Chithiraiselvan G",
              college: user?.college || "Velammal Engineering college Chennai",
              department: user?.department || "Mechanical Engineering",
              zone: user?.zone || "Zone 1",
              batch: user?.batch || "2023-2027",
              eventsJoined: Number(user?.eventsJoined) || 1,
              completedEventsCount: Number(user?.completedEventsCount) || 1,
              participatedEvents: ["Plantation", "Charles"],
              badges: Number(user?.badgesEarned) || 0,
              points: Number(user?.points) || 160,
              totalHours: Number(user?.totalHours) || 46,
              avatar:
                user?.avatar ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
              badgeTier: "Silver Star Volunteer",
              category: "Students",
              isCurrentUser: true,
            },
          ]);
        }

      } catch (err) {
        console.warn("Could not load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  /* ── Filter Options Derived Dynamically ── */
  const collegeOptions = useMemo(() => {
    const set = new Set();
    leaderboardData.forEach((u) => { if (u.college) set.add(u.college.trim()); });
    if (user?.college) set.add(user.college.trim());
    return Array.from(set).sort();
  }, [leaderboardData, user?.college]);

  const zoneOptions = ["All", "Zone 1", "Zone 2", "Zone 3"];

  const eventOptions = useMemo(() => {
    const set = new Set();
    (opportunities || []).forEach((o) => { if (o?.title) set.add(o.title.trim()); });
    (applications || []).forEach((a) => { if (a?.opportunityTitle) set.add(a.opportunityTitle.trim()); });
    leaderboardData.forEach((u) => {
      (u.participatedEvents || []).forEach((e) => {
        const t = typeof e === "string" ? e : e?.title || e?.eventTitle;
        if (t) set.add(t.trim());
      });
    });
    return Array.from(set).sort();
  }, [opportunities, applications, leaderboardData]);

  // Combined Filters & Dynamic Rank Recalculation
  const filteredAndRankedStudents = useMemo(() => {
    let list = [...leaderboardData];

    // 1. Text Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(q) ||
          (u.college || "").toLowerCase().includes(q) ||
          (u.zone || "").toLowerCase().includes(q) ||
          (u.department || "").toLowerCase().includes(q) ||
          (u.batch || "").toLowerCase().includes(q) ||
          (u.badgeTier || "").toLowerCase().includes(q)
      );
    }

    // 2. College-Wise Filter
    if (selectedCollege && selectedCollege !== "All") {
      list = list.filter(
        (u) => (u.college || "").toLowerCase().trim() === selectedCollege.toLowerCase().trim()
      );
    }

    // 3. Zone-Wise Filter
    if (selectedZone && selectedZone !== "All") {
      list = list.filter(
        (u) => (u.zone || "Zone 1").toLowerCase().trim() === selectedZone.toLowerCase().trim()
      );
    }

    // 4. Year-Wise Filter
    if (selectedYear && selectedYear !== "All") {
      const yrClean = selectedYear.toLowerCase().replace(/st|nd|rd|th/g, "").trim();
      list = list.filter((u) => {
        const b = (u.batch || "").toLowerCase().trim();
        const a = (u.academicYear || "").toLowerCase().replace(/st|nd|rd|th/g, "").trim();
        return b === selectedYear.toLowerCase().trim() || b.includes(yrClean) || a.includes(yrClean);
      });
    }

    // 5. Event-Wise Filter
    if (selectedEvent && selectedEvent !== "All") {
      const targetEvLower = selectedEvent.toLowerCase().trim();
      list = list.filter((u) => {
        const events = u.participatedEvents || [];
        const matchInUserEvents = events.some((e) =>
          (typeof e === "string" ? e : e?.title || e?.eventTitle || "").toLowerCase().trim() === targetEvLower
        );
        if (matchInUserEvents) return true;

        return (applications || []).some((a) => {
          const aUId = (a.userId || a.user?._id || a.user?.id || (typeof a.user === "string" ? a.user : "") || "").toString();
          const aName = (a.applicantDetails?.name || a.name || "").toLowerCase().trim();
          const aEv = (a.opportunityTitle || a.title || "").toLowerCase().trim();
          const matchStudent = (u.id && aUId === u.id) || (u.applicationId && a.applicationId === u.applicationId) || (u.name && aName === u.name.toLowerCase().trim());
          return matchStudent && aEv === targetEvLower;
        });
      });
    }

    // 6. Accurate Ranking Calculation (Points descending, totalHours and eventsJoined as tiebreakers)
    list.sort(
      (a, b) =>
        (Number(b.points) || 0) - (Number(a.points) || 0) ||
        (Number(b.totalHours) || 0) - (Number(a.totalHours) || 0) ||
        (Number(b.eventsJoined) || 0) - (Number(a.eventsJoined) || 0)
    );

    return list.map((u, idx) => ({
      ...u,
      rank: idx + 1,
    }));
  }, [leaderboardData, search, selectedCollege, selectedZone, selectedYear, selectedEvent, applications]);

  const isFilterActive = selectedCollege !== "All" || selectedZone !== "All" || selectedYear !== "All" || selectedEvent !== "All" || Boolean(search.trim());
  const activeFiltersCount = (selectedCollege !== "All" ? 1 : 0) + (selectedZone !== "All" ? 1 : 0) + (selectedYear !== "All" ? 1 : 0) + (selectedEvent !== "All" ? 1 : 0) + (search.trim() ? 1 : 0);

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCollege("All");
    setSelectedZone("All");
    setSelectedYear("All");
    setSelectedEvent("All");
  };

  /* derived stats & rankings */
  const filteredUsers = filteredAndRankedStudents;

  // Zone-tab: filter students by selected zone, aggregate colleges inside it
  const zoneTabStudents = React.useMemo(
    () =>
      leaderboardData.filter(
        (u) => (u.zone || "Zone 1").trim() === ZONE_TO_SHOW
      ),
    [leaderboardData]
  );

  const zoneTabColleges = React.useMemo(() => {
    const map = new Map();
    zoneTabStudents.forEach((u) => {
      const col = u.college || "—";
      if (!map.has(col)) {
        map.set(col, { collegeName: col, totalStudents: 0, totalPoints: 0, totalHours: 0, topVolunteer: u.name, highestPoints: 0 });
      }
      const e = map.get(col);
      e.totalStudents += 1;
      e.totalPoints += Number(u.points) || 0;
      e.totalHours += Number(u.totalHours) || 0;
      if ((Number(u.points) || 0) >= e.highestPoints) {
        e.highestPoints = Number(u.points) || 0;
        e.topVolunteer = u.name;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [zoneTabStudents]);

  const zoneTabCollegesFiltered = React.useMemo(() => {
    const q = zoneCollegeSearch.trim().toLowerCase();
    if (!q) return zoneTabColleges;
    return zoneTabColleges.filter(
      (c) =>
        (c.collegeName || "").toLowerCase().includes(q) ||
        (c.topVolunteer || "").toLowerCase().includes(q)
    );
  }, [zoneTabColleges, zoneCollegeSearch]);

  const topThree = leaderboardData.slice(0, 3);
  const myStanding = leaderboardData.find((u) => u.isCurrentUser) || {};
  const myRank = myStanding.rank ?? (user?.rank ?? "–");
  const myPoints = myStanding.points ?? (user?.points ?? 0);
  const myHours = myStanding.totalHours ?? (user?.totalHours ?? 0);
  const myEvents = myStanding.eventsJoined ?? (user?.eventsJoined ?? 0);

  /* ── My college only ── */
  const myCollegeLabel = user?.college || myStanding.college || "";
  const myZoneLabel = myStanding.zone || user?.zone || "Zone 1";

  const myCollegeAll = useMemo(() => {
    const mine = myCollegeLabel.toLowerCase().trim();
    if (!mine) return [];
    return leaderboardData.filter((u) => {
      const c = (u.college || "").toLowerCase().trim();
      return c && (c === mine || c.includes(mine) || mine.includes(c));
    });
  }, [leaderboardData, myCollegeLabel]);

  const myCollegeRanked = useMemo(() => {
    let list = [...myCollegeAll];
    if (collegeYearFilter !== "All") {
      if (/^[1-4]/.test(collegeYearFilter)) {
        list = list.filter((u) => yearOfStudy(u) === Number(collegeYearFilter[0]));
      } else {
        list = list.filter((u) => (u.batch || "").trim() === collegeYearFilter.trim());
      }
    }
    const q = collegeSearch.trim().toLowerCase();
    if (q) list = list.filter((u) => (u.name || "").toLowerCase().includes(q));
    list.sort(
      (a, b) =>
        (Number(b.points) || 0) - (Number(a.points) || 0) ||
        (Number(b.totalHours) || 0) - (Number(a.totalHours) || 0) ||
        (Number(b.eventsJoined) || 0) - (Number(a.eventsJoined) || 0)
    );
    return list.map((u, idx) => ({ ...u, rank: idx + 1 }));
  }, [myCollegeAll, collegeYearFilter, collegeSearch]);

  const myCollegeTotals = {
    students: myCollegeAll.length,
    points: myCollegeAll.reduce((sum, u) => sum + (Number(u.points) || 0), 0),
    hours: myCollegeAll.reduce((sum, u) => sum + (Number(u.totalHours) || 0), 0),
    top: [...myCollegeAll].sort((a, b) => (b.points || 0) - (a.points || 0))[0]?.name || "—",
  };

  /* ─── styles ─── */
  const heroStyle = {
    background: "linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)",
    borderRadius: 20,
    padding: "28px 26px",
    marginBottom: 24,
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 8px 30px rgba(30,27,75,0.25)",
  };

  const kpiChipStyle = {
    background: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(10px)",
    borderRadius: 12,
    padding: "8px 16px",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#fff",
    minWidth: 95,
    display: "flex",
    flexDirection: "column",
    gap: 1,
  };

  /* Tab buttons – each tab has its own colour */
  const tabBtnStyle = (active, key) => {
    const t = TAB_THEME[key];
    return {
      padding: "10px 22px",
      borderRadius: 50,
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 13.5,
      letterSpacing: 0.2,
      transition: "all .2s",
      border: active ? "1.5px solid transparent" : `1.5px solid ${t.text}33`,
      background: active ? t.grad : t.tint,
      color: active ? "#fff" : t.text,
      boxShadow: active ? `0 6px 18px ${t.glow}` : "none",
      transform: active ? "translateY(-1px)" : "none",
    };
  };

  const filterSelectStyle = (isActive) => ({
    border: "1.5px solid #93C5FD",
    borderRadius: 8,
    padding: "5px 10px",
    fontSize: 13,
    color: "#0F172A",
    background: "#fff",
    fontWeight: isActive ? 700 : 500,
    outline: "none",
    cursor: "pointer",
  });

  const rowBorderLeft = (u, isMe) =>
    isMe
      ? "4px solid #F59E0B"
      : u.rank === 1
        ? "4px solid #FBBF24"
        : u.rank === 2
          ? "4px solid #94A3B8"
          : u.rank === 3
            ? "4px solid #EA580C"
            : "4px solid transparent";

  const rowBackground = (isMe, i) =>
    isMe
      ? "linear-gradient(90deg,#FFF7ED,#FFFBEB)"
      : i % 2 === 0
        ? "#fff"
        : "#F8FAFF";

  return (
    <div
      className="dashboard-container"
      style={{ background: "transparent", minHeight: 0 }}
    >

      {/* ═══════════════ HERO BANNER (ordered, justified row) ═══════════════ */}
      <div style={heroStyle}>
        {/* decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 170,
            height: 170,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -40,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* Title */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 14, flexWrap: "wrap", alignSelf: "flex-start" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.18)",
                borderRadius: 14,
                padding: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trophy size={30} color="#FCD34D" />
            </div>
            <div style={{ textAlign: "left" }}>
              <h1 style={{ margin: 0, color: "#fff", fontSize: 28, fontWeight: 900, lineHeight: 1.15, letterSpacing: 0.2 }}>
                Volunteer Impact Leaderboard
              </h1>
              <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.88)", fontSize: 14.5, fontWeight: 500 }}>
                Top student contributors across Tamil Nadu 🌟
              </p>
            </div>
          </div>

          {/* One ordered row: College · Zone · Rank · Points · Hours · Events */}
          <div
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 14,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            {[
              { label: "College", value: myCollegeLabel || "Not set", icon: <Building2 size={16} color="#C7D2FE" />, span: 2, small: true },
              { label: "Zone", value: myZoneLabel, icon: <MapPin size={16} color="#FCD34D" />, gold: true },
              { label: "My Rank", value: `#${myRank}`, icon: <Trophy size={16} color="#FCD34D" /> },
              { label: "Points", value: `${myPoints} pts`, icon: <Zap size={16} color="#C4B5FD" /> },
              { label: "Hours", value: `${myHours} hrs`, icon: <Clock size={16} color="#34D399" /> },
              { label: "Events", value: `${myEvents} joined`, icon: <Star size={16} color="#FB923C" /> },
            ].map((tile) => (
              <div
                key={tile.label}
                style={{
                  gridColumn: tile.span ? `span ${tile.span}` : undefined,
                  minHeight: 94,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  textAlign: "center",
                  borderRadius: 14,
                  background: tile.gold ? "rgba(252,211,77,0.16)" : "rgba(255,255,255,0.12)",
                  border: tile.gold
                    ? "1px solid rgba(252,211,77,0.6)"
                    : "1px solid rgba(255,255,255,0.22)",
                  backdropFilter: "blur(10px)",
                  color: "#fff",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {tile.icon}
                  <span
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.88)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                    }}
                  >
                    {tile.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: tile.small ? 16 : 22,
                    fontWeight: tile.small ? 800 : 900,
                    lineHeight: 1.25,
                    color: tile.gold ? "#FDE68A" : "#fff",
                  }}
                >
                  {tile.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ INDIVIDUAL PODIUM (Top 3) ═══════════════ */}
      {topThree.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            alignItems: "flex-end",
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          {/* 2nd Place */}
          {topThree[1] && (
            <div
              style={{
                flex: "0 0 220px",
                borderRadius: 20,
                padding: "24px 20px 20px",
                background: "linear-gradient(160deg,#374151,#1F2937)",
                border: "1px solid rgba(156,163,175,0.3)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#9CA3AF,#D1D5DB)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Medal size={22} color="#374151" />
              </div>
              <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700 }}>#2 Silver Star</span>
              <img
                src={topThree[1].avatar}
                alt={topThree[1].name}
                style={{ width: 68, height: 68, borderRadius: "50%", border: "3px solid #9CA3AF", objectFit: "cover" }}
              />
              <strong style={{ color: "#F9FAFB", fontSize: 14, textAlign: "center" }}>{topThree[1].name}</strong>
              <span style={{ color: "#9CA3AF", fontSize: 12, textAlign: "center" }}>{topThree[1].college}</span>
              <div
                style={{
                  background: "rgba(156,163,175,0.15)",
                  borderRadius: 20,
                  padding: "5px 14px",
                  color: "#D1D5DB",
                  fontSize: 13,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Star size={13} color="#9CA3AF" fill="#9CA3AF" />
                {topThree[1].points} pts
              </div>
            </div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <div
              style={{
                flex: "0 0 240px",
                borderRadius: 24,
                padding: "28px 20px 24px",
                background: "linear-gradient(160deg,#78350F,#B45309,#D97706)",
                border: "2px solid #FCD34D",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 0 40px rgba(251,191,36,0.35), 0 12px 40px rgba(0,0,0,0.4)",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div style={{ fontSize: 28, position: "absolute", top: -18 }}>👑</div>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#FCD34D,#F59E0B)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 12,
                }}
              >
                <Trophy size={28} color="#78350F" />
              </div>
              <span style={{ fontSize: 12, color: "#FDE68A", fontWeight: 800 }}>#1 Top Contributor</span>
              <img
                src={topThree[0].avatar}
                alt={topThree[0].name}
                style={{ width: 84, height: 84, borderRadius: "50%", border: "4px solid #FCD34D", objectFit: "cover" }}
              />
              <strong style={{ color: "#FFF", fontSize: 16, textAlign: "center" }}>{topThree[0].name}</strong>
              <span style={{ color: "#FDE68A", fontSize: 12, textAlign: "center" }}>{topThree[0].college}</span>
              <div
                style={{
                  background: "rgba(0,0,0,0.25)",
                  borderRadius: 20,
                  padding: "6px 18px",
                  color: "#FCD34D",
                  fontSize: 15,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Star size={15} color="#FCD34D" fill="#FCD34D" />
                {topThree[0].points} pts
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div
              style={{
                flex: "0 0 220px",
                borderRadius: 20,
                padding: "24px 20px 20px",
                background: "linear-gradient(160deg,#431407,#7C2D12)",
                border: "1px solid rgba(234,88,12,0.3)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#EA580C,#C2410C)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Medal size={22} color="#fff" />
              </div>
              <span style={{ fontSize: 11, color: "#FB923C", fontWeight: 700 }}>#3 Bronze Hero</span>
              <img
                src={topThree[2].avatar}
                alt={topThree[2].name}
                style={{ width: 68, height: 68, borderRadius: "50%", border: "3px solid #EA580C", objectFit: "cover" }}
              />
              <strong style={{ color: "#F9FAFB", fontSize: 14, textAlign: "center" }}>{topThree[2].name}</strong>
              <span style={{ color: "#FDBA74", fontSize: 12, textAlign: "center" }}>{topThree[2].college}</span>
              <div
                style={{
                  background: "rgba(234,88,12,0.2)",
                  borderRadius: 20,
                  padding: "5px 14px",
                  color: "#FB923C",
                  fontSize: 13,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Star size={13} color="#FB923C" fill="#FB923C" />
                {topThree[2].points} pts
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ TABS + SEARCH ═══════════════ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { key: "Overall", label: "Overall Student Leaderboard", icon: "🏆" },
            { key: "College", label: "College-wise Leaderboard", icon: "🏛️" },
            { key: "Zone", label: "Zone-wise Leaderboard", icon: "📍" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={tabBtnStyle(activeTab === key, key)}
            >
              <span style={{ marginRight: 6 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {activeTab === "Overall" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#F8FAFC",
              border: "1.5px solid #E2E8F0",
              borderRadius: 12,
              padding: "9px 14px",
              maxWidth: 320,
              flex: 1,
            }}
          >
            <Search size={16} color="#94A3B8" />
            <input
              type="text"
              placeholder={
                activeTab === "Zone"
                  ? "Search zone or district…"
                  : activeTab === "College"
                    ? "Search college…"
                    : "Search student, college, zone…"
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "none", outline: "none", background: "transparent", flex: 1, fontSize: 13.5, color: "#334155" }}
            />
          </div>
        )}
      </div>

      {/* ═══════════════ TAB 1: OVERALL STUDENT LEADERBOARD ═══════════════ */}
      {activeTab === "Overall" && (
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            border: "1px solid #DBEAFE",
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(15,23,42,0.10)",
            marginBottom: 32,
          }}
        >
          {/* ── Unified Filter Bar ── */}
          <div
            style={{
              padding: "16px 20px",
              background: "linear-gradient(90deg,#EFF6FF,#DBEAFE)",
              borderBottom: "1px solid #BFDBFE",
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
            }}
          >
            {/* College filter */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Building2 size={14} color="#1D4ED8" />
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                style={filterSelectStyle(selectedCollege !== "All")}
              >
                <option value="All">All Colleges</option>
                {collegeOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Zone filter */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={14} color="#1D4ED8" />
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                style={filterSelectStyle(selectedZone !== "All")}
              >
                {zoneOptions.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            {/* Year-wise filter */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} color="#1D4ED8" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={filterSelectStyle(selectedYear !== "All")}
              >
                <option value="All">All Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="2022-2026">2022-2026 Batch</option>
                <option value="2023-2027">2023-2027 Batch</option>
                <option value="2021-2025">2021-2025 Batch</option>
                <option value="2020-2024">2020-2024 Batch</option>
              </select>
            </div>

            {/* Event filter */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={14} color="#1D4ED8" />
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                style={{ ...filterSelectStyle(selectedEvent !== "All"), maxWidth: 220 }}
              >
                <option value="All">All Events</option>
                {eventOptions.map((ev) => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>
            </div>

            {/* Reset Button (shown only when filters active) */}
            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 14px",
                  borderRadius: 20,
                  border: "1.5px solid #1D4ED8",
                  background: "linear-gradient(135deg,#0F172A,#1D4ED8)",
                  color: "#fff",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={13} />
                Reset Filters
                <span
                  style={{
                    background: "rgba(255,255,255,0.3)",
                    borderRadius: 20,
                    padding: "1px 7px",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {activeFiltersCount}
                </span>
              </button>
            )}

          </div>

          {/* Active Filter Chips */}
          {isFilterActive && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                padding: "10px 20px",
                background: "#F8FBFF",
                borderBottom: "1px solid #DBEAFE",
              }}
            >
              {selectedCollege !== "All" && (
                <FilterChip icon={<Building2 size={11} />} label={selectedCollege} onRemove={() => setSelectedCollege("All")} />
              )}
              {selectedZone !== "All" && (
                <FilterChip icon={<MapPin size={11} />} label={selectedZone} onRemove={() => setSelectedZone("All")} />
              )}
              {selectedYear !== "All" && (
                <FilterChip icon={<Clock size={11} />} label={`Year: ${selectedYear}`} onRemove={() => setSelectedYear("All")} />
              )}
              {selectedEvent !== "All" && (
                <FilterChip icon={<Calendar size={11} />} label={selectedEvent} onRemove={() => setSelectedEvent("All")} />
              )}
              {search.trim() && (
                <FilterChip icon={<Search size={11} />} label={`"${search.trim()}"`} onRemove={() => setSearch("")} />
              )}
            </div>
          )}

          {/* Table header – dark navy with white text */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: STUDENT_GRID,
              columnGap: 10,
              padding: "16px 20px",
              background: "linear-gradient(90deg,#0F172A 0%,#1E3A8A 100%)",
              borderBottom: "3px solid #3B82F6",
              fontWeight: 800,
              fontSize: 12.5,
              color: "#FFFFFF",
              textTransform: "uppercase",
              letterSpacing: 0.9,
            }}
          >
            <span>Rank</span>
            <span>Volunteer</span>
            <span className="desktop-only">College</span>
            <span className="desktop-only" style={{ textAlign: "center" }}>Zone</span>
            <span className="desktop-only" style={{ textAlign: "center" }}>Events</span>
            <span className="desktop-only" style={{ textAlign: "right" }}>Hours</span>
            <span style={{ textAlign: "right" }}>Points</span>
            <span className="desktop-only" style={{ textAlign: "center" }}>Badge</span>
          </div>

          {/* Table rows */}
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>
              <TrendingUp size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <p style={{ margin: 0 }}>Loading student leaderboard…</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>
              No registered students found matching search.
            </div>
          ) : (
            filteredUsers.map((u, i) => {
              const isMe = u.isCurrentUser || (user && u.name === user.name);
              return (
                <div
                  key={u.rank + "_" + u.name + "_" + i}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#EEF4FF")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = rowBackground(isMe, i))}
                  style={{
                    display: "grid",
                    gridTemplateColumns: STUDENT_GRID,
                    columnGap: 10,
                    padding: "12px 20px",
                    alignItems: "center",
                    borderBottom: "1px solid #E2E8F0",
                    background: rowBackground(isMe, i),
                    borderLeft: rowBorderLeft(u, isMe),
                    transition: "background .15s",
                  }}
                >
                  {/* Rank */}
                  <div>
                    {u.rank <= 3 ? (
                      <span style={{ fontSize: 22 }}>{MEDAL[u.rank - 1]}</span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "#E0E7FF",
                          color: "#1E3A8A",
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        {u.rank}
                      </span>
                    )}
                  </div>

                  {/* Volunteer info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <img
                      src={u.avatar}
                      alt={u.name}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                        border: `2px solid ${isMe ? "#F59E0B" : "#BFDBFE"}`,
                      }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <strong
                        style={{
                          color: "#0F172A",
                          fontSize: 15,
                          fontWeight: 800,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {u.name}
                      </strong>
                      {isMe && (
                        <span
                          style={{
                            background: "linear-gradient(90deg,#F59E0B,#FBBF24)",
                            color: "#78350F",
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 20,
                            flexShrink: 0,
                          }}
                        >
                          You
                        </span>
                      )}
                    </div>
                  </div>

                  {/* College */}
                  <div className="desktop-only" style={{ color: "#334155", fontSize: 13.5, fontWeight: 600 }}>
                    {u.college}
                  </div>

                  {/* Zone */}
                  <div className="desktop-only" style={{ textAlign: "center" }}>
                    <span style={{ background: "#E0E7FF", color: "#1E3A8A", padding: "3px 8px", borderRadius: 8, fontSize: 12, fontWeight: 800 }}>
                      {u.zone || "Zone 1"}
                    </span>
                  </div>

                  {/* Event Participation */}
                  <div className="desktop-only" style={{ textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "#FFF7ED",
                        color: "#C2410C",
                        border: "1px solid #FDBA74",
                        padding: "3px 9px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      <Star size={11} color="#F59E0B" fill="#F59E0B" />
                      {u.eventsJoined || u.completedEventsCount || 0} Events
                    </span>
                  </div>

                  {/* Hours */}
                  <div className="desktop-only" style={{ textAlign: "right" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        background: "#DBEAFE",
                        color: "#1D4ED8",
                        borderRadius: 10,
                        padding: "4px 10px",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      <Clock size={12} color="#1D4ED8" />
                      {u.totalHours || 0} hrs
                    </span>
                  </div>

                  {/* Points */}
                  <div style={{ textAlign: "right" }}>
                    <strong
                      style={{
                        color: isMe ? "#D97706" : "#1D4ED8",
                        fontSize: 18,
                        fontWeight: 900,
                      }}
                    >
                      {u.points}
                      <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2, opacity: 0.7 }}>pts</span>
                    </strong>
                  </div>

                  {/* Badge (last column) */}
                  <div className="desktop-only" style={{ textAlign: "center" }}>
                    <TierBadge tier={u.badgeTier} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══════════════ TAB 2: MY COLLEGE LEADERBOARD (white) ═══════════════ */}
      {activeTab === "College" && (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 24px rgba(15,23,42,0.08)",
            padding: "24px 22px",
            marginBottom: 32,
          }}
        >
          {/* Section Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "linear-gradient(135deg,#6D28D9,#C026D3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 16px rgba(168,85,247,0.35)",
                }}
              >
                <GraduationCap size={22} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, color: "#0F172A", fontSize: 20, fontWeight: 900 }}>
                  🏛️ {myCollegeLabel || "My College"} Leaderboard
                </h2>
                <p style={{ margin: "2px 0 0", color: "#64748B", fontSize: 13 }}>
                  Volunteers from your college ranked by impact points
                </p>
              </div>
            </div>

            {/* Controls: Year filter + Search + Reset */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={14} color="#7E22CE" />
                <select
                  value={collegeYearFilter}
                  onChange={(e) => setCollegeYearFilter(e.target.value)}
                  style={{
                    border: "1.5px solid #DDD6FE",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: "#0F172A",
                    background: "#fff",
                    fontWeight: collegeYearFilter !== "All" ? 800 : 600,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="All">All Years</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="2023-2027">2023-2027 Batch</option>
                  <option value="2022-2026">2022-2026 Batch</option>
                  <option value="2021-2025">2021-2025 Batch</option>
                  <option value="2020-2024">2020-2024 Batch</option>
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 12,
                  padding: "8px 14px",
                  minWidth: 240,
                }}
              >
                <Search size={15} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Search volunteer…"
                  value={collegeSearch}
                  onChange={(e) => setCollegeSearch(e.target.value)}
                  style={{ border: "none", outline: "none", background: "transparent", flex: 1, fontSize: 13, color: "#334155" }}
                />
                {collegeSearch && (
                  <button
                    onClick={() => setCollegeSearch("")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "#94A3B8" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {(collegeYearFilter !== "All" || collegeSearch) && (
                <button
                  onClick={() => { setCollegeYearFilter("All"); setCollegeSearch(""); }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "8px 14px",
                    borderRadius: 20,
                    border: "none",
                    background: "linear-gradient(135deg,#6D28D9,#C026D3)",
                    color: "#fff",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw size={12} /> Reset
                </button>
              )}
            </div>
          </div>

          {/* College summary strip */}
          <div
            style={{
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              marginBottom: 20,
              padding: "14px 18px",
              background: "#FAF5FF",
              borderRadius: 14,
              border: "1px solid #E9D5FF",
            }}
          >
            {[
              { label: "Volunteers", value: myCollegeTotals.students, icon: <Users size={15} color="#7E22CE" /> },
              { label: "Total Points", value: myCollegeTotals.points.toLocaleString(), icon: <Star size={15} color="#F59E0B" fill="#F59E0B" /> },
              { label: "Total Hours", value: myCollegeTotals.hours + " hrs", icon: <Clock size={15} color="#059669" /> },
              { label: "Top Volunteer", value: myCollegeTotals.top, icon: <Trophy size={15} color="#D97706" /> },
            ].map((stat) => (
              <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {stat.icon}
                <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>{stat.label}:</span>
                <strong style={{ fontSize: 14, color: "#0F172A" }}>{stat.value}</strong>
              </div>
            ))}
          </div>

          {/* Volunteers table (own college only) */}
          {myCollegeRanked.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94A3B8" }}>
              <Building2 size={40} style={{ marginBottom: 10, opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: 14 }}>No volunteers found for this filter.</p>
            </div>
          ) : (
            <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #E2E8F0", maxWidth: 1180, margin: "0 auto" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: COLLEGE_STUDENT_GRID,
                  columnGap: 10,
                  padding: "15px 20px",
                  background: "linear-gradient(90deg,#0F172A,#4C1D95)",
                  borderBottom: "3px solid #C026D3",
                  fontWeight: 800,
                  fontSize: 12,
                  color: "#FFFFFF",
                  textTransform: "uppercase",
                  letterSpacing: 0.9,
                }}
              >
                <span>Rank</span>
                <span>Volunteer</span>
                <span>College</span>
                <span style={{ textAlign: "center" }}>Zone</span>
                <span style={{ textAlign: "center" }}>Events</span>
                <span style={{ textAlign: "center" }}>Hours</span>
                <span style={{ textAlign: "center" }}>Points</span>
                <span style={{ textAlign: "center" }}>Badge</span>
              </div>

              {myCollegeRanked.map((u, i) => {
                const isMe = u.isCurrentUser;
                const base = isMe
                  ? "linear-gradient(90deg,#FFF7ED,#FFFBEB)"
                  : i % 2 === 0
                    ? "#FFFFFF"
                    : "#FAFAFF";
                return (
                  <div
                    key={u.rank + "_" + u.name + "_" + i}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F3FF")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = base)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: COLLEGE_STUDENT_GRID,
                      columnGap: 10,
                      padding: "12px 20px",
                      alignItems: "center",
                      borderBottom: "1px solid #F1F5F9",
                      background: base,
                      borderLeft: isMe ? "4px solid #F59E0B" : "4px solid transparent",
                      transition: "background .15s",
                    }}
                  >
                    <div>{rankMedal(u.rank)}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <img
                        src={u.avatar}
                        alt={u.name}
                        style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${isMe ? "#F59E0B" : "#E9D5FF"}` }}
                      />
                      <strong style={{ color: "#0F172A", fontSize: 15, fontWeight: 800 }}>{u.name}</strong>
                      {isMe && (
                        <span style={{ background: "linear-gradient(90deg,#F59E0B,#FBBF24)", color: "#78350F", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>
                          You
                        </span>
                      )}
                    </div>
                    <div style={{ color: "#334155", fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>
                      {u.college}
                    </div>
                    <div style={{ textAlign: "center", color: "#0F172A", fontSize: 13.5, fontWeight: 800 }}>
                      {u.zone || "Zone 1"}
                    </div>
                    <div style={{ textAlign: "center", color: "#7E22CE", fontWeight: 800, fontSize: 15 }}>
                      {u.eventsJoined || u.completedEventsCount || 0}
                      <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 3, opacity: 0.7 }}>Events</span>
                    </div>
                    <div style={{ textAlign: "center", color: "#047857", fontWeight: 800, fontSize: 15 }}>
                      {u.totalHours || 0}
                      <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 3, opacity: 0.7 }}>hrs</span>
                    </div>
                    <div style={{ textAlign: "center", color: isMe ? "#D97706" : "#6D28D9", fontWeight: 900, fontSize: 17 }}>
                      {u.points}
                      <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2, opacity: 0.7 }}>pts</span>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <TierBadge tier={u.badgeTier} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ TAB 3: ZONE 1 COLLEGE LEADERBOARD (white) ═══════════════ */}
      {activeTab === "Zone" && (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 24px rgba(15,23,42,0.08)",
            padding: "24px 22px",
            marginBottom: 32,
          }}
        >
          {/* Section Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "linear-gradient(135deg,#047857,#14B8A6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 16px rgba(16,185,129,0.35)",
                }}
              >
                <MapPin size={22} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, color: "#0F172A", fontSize: 20, fontWeight: 900 }}>
                  📍 {ZONE_TO_SHOW} College Leaderboard
                </h2>
                <p style={{ margin: "2px 0 0", color: "#64748B", fontSize: 13 }}>
                  Colleges in {ZONE_TO_SHOW} ({ZONE_REGION}) ranked by volunteering impact
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#F8FAFC",
                border: "1.5px solid #E2E8F0",
                borderRadius: 12,
                padding: "8px 14px",
                minWidth: 240,
              }}
            >
              <Search size={15} color="#94A3B8" />
              <input
                type="text"
                placeholder="Search college…"
                value={zoneCollegeSearch}
                onChange={(e) => setZoneCollegeSearch(e.target.value)}
                style={{ border: "none", outline: "none", background: "transparent", flex: 1, fontSize: 13, color: "#334155" }}
              />
              {zoneCollegeSearch && (
                <button
                  onClick={() => setZoneCollegeSearch("")}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "#94A3B8" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Zone summary strip */}
          <div
            style={{
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              marginBottom: 20,
              padding: "14px 18px",
              background: "#ECFDF5",
              borderRadius: 14,
              border: "1px solid #A7F3D0",
            }}
          >
            {[
              { label: "Colleges", value: zoneTabColleges.length, icon: <Building2 size={15} color="#047857" /> },
              { label: "Volunteers", value: zoneTabStudents.length, icon: <Users size={15} color="#047857" /> },
              { label: "Total Points", value: zoneTabStudents.reduce((sum, u) => sum + (Number(u.points) || 0), 0).toLocaleString(), icon: <Star size={15} color="#F59E0B" fill="#F59E0B" /> },
              { label: "Total Hours", value: zoneTabStudents.reduce((sum, u) => sum + (Number(u.totalHours) || 0), 0) + " hrs", icon: <Clock size={15} color="#059669" /> },
            ].map((stat) => (
              <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {stat.icon}
                <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>{stat.label}:</span>
                <strong style={{ fontSize: 14, color: "#0F172A" }}>{stat.value}</strong>
              </div>
            ))}
          </div>

          {/* Colleges table (Zone 1 only) */}
          {zoneTabCollegesFiltered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94A3B8" }}>
              <Building2 size={40} style={{ marginBottom: 10, opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: 14 }}>No colleges found in {ZONE_TO_SHOW}.</p>
            </div>
          ) : (
            <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #E2E8F0", maxWidth: 1100, margin: "0 auto" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: ZONE_COLLEGE_GRID,
                  columnGap: 10,
                  padding: "15px 20px",
                  background: "linear-gradient(90deg,#022C22,#047857)",
                  borderBottom: "3px solid #14B8A6",
                  fontWeight: 800,
                  fontSize: 12,
                  color: "#FFFFFF",
                  textTransform: "uppercase",
                  letterSpacing: 0.9,
                }}
              >
                <span>Rank</span>
                <span>College</span>
                <span style={{ textAlign: "center" }}>Zone</span>
                <span style={{ textAlign: "center" }}>Volunteers</span>
                <span style={{ textAlign: "center" }}>Hours</span>
                <span style={{ textAlign: "center" }}>Points</span>
                <span>Leading Volunteer</span>
              </div>

              {zoneTabCollegesFiltered.map((c, idx) => {
                const mine =
                  myCollegeLabel &&
                  (c.collegeName || "").toLowerCase().includes(myCollegeLabel.toLowerCase().trim());
                const base = mine
                  ? "linear-gradient(90deg,#FFF7ED,#FFFBEB)"
                  : idx % 2 === 0
                    ? "#FFFFFF"
                    : "#F7FDFA";
                return (
                  <div
                    key={c.collegeName + idx}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#ECFDF5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = base)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: ZONE_COLLEGE_GRID,
                      columnGap: 10,
                      padding: "14px 20px",
                      alignItems: "center",
                      borderBottom: "1px solid #F1F5F9",
                      background: base,
                      borderLeft: mine ? "4px solid #F59E0B" : "4px solid transparent",
                      transition: "background .15s",
                    }}
                  >
                    <div>{rankMedal(idx + 1)}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: mine ? "linear-gradient(135deg,#F59E0B,#FBBF24)" : "#D1FAE5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <GraduationCap size={18} color={mine ? "#78350F" : "#047857"} />
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 14, color: "#0F172A" }}>
                        {c.collegeName}
                        {mine && (
                          <span style={{ marginLeft: 8, background: "linear-gradient(90deg,#F59E0B,#FBBF24)", color: "#78350F", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>
                            Your College
                          </span>
                        )}
                      </span>
                    </div>
                    <div style={{ textAlign: "center", color: "#0F172A", fontSize: 13.5, fontWeight: 800 }}>
                      {ZONE_TO_SHOW}
                    </div>
                    <div style={{ textAlign: "center", color: "#7E22CE", fontWeight: 800, fontSize: 15 }}>
                      {c.totalStudents}
                    </div>
                    <div style={{ textAlign: "center", color: "#047857", fontWeight: 800, fontSize: 15 }}>
                      {c.totalHours}
                      <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 3, opacity: 0.7 }}>hrs</span>
                    </div>
                    <div style={{ textAlign: "center", color: mine ? "#D97706" : "#047857", fontWeight: 900, fontSize: 17 }}>
                      {c.totalPoints}
                      <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2, opacity: 0.7 }}>pts</span>
                    </div>
                    <div style={{ color: "#334155", fontSize: 13.5, fontWeight: 700 }}>
                      ⭐ {c.topVolunteer}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}