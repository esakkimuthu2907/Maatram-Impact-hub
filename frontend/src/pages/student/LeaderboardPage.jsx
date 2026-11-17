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
  Filter,
  RotateCcw,
  MapPin,
  Calendar,
  Sparkles,
  X,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { usersAPI } from "../../api/usersAPI";
import { adminAPI } from "../../api/adminAPI";
import "./StudentDashboard.css";

/* ─────────────── helpers ─────────────── */
const MEDAL = ["🥇", "🥈", "🥉"];

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
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#CBD5E1",
        fontWeight: 700,
        fontSize: 13,
      }}
    >
      {rank}
    </span>
  );
}

function badgeTierColor(tier) {
  if (!tier) return { bg: "#1E3A5F", color: "#93C5FD" };
  const t = tier.toLowerCase();
  if (t.includes("green"))    return { bg: "#052e16", color: "#4ade80" };
  if (t.includes("platinum")) return { bg: "#1e293b", color: "#e2e8f0" };
  if (t.includes("diamond"))  return { bg: "#172554", color: "#93c5fd" };
  if (t.includes("gold"))     return { bg: "#2d1a00", color: "#fbbf24" };
  if (t.includes("silver"))   return { bg: "#1e293b", color: "#cbd5e1" };
  return                             { bg: "#2d1a00", color: "#fb923c" };
}

/* ─────────────── College Podium Card ─────────────── */
function CollegePodiumCard({ college, rank, isMine }) {
  const gradients = [
    "linear-gradient(135deg,#78350F,#D97706,#F59E0B)",
    "linear-gradient(135deg,#374151,#9CA3AF,#D1D5DB)",
    "linear-gradient(135deg,#431407,#9A3412,#EA580C)",
  ];
  const labels = ["🥇 1st Place", "🥈 2nd Place", "🥉 3rd Place"];
  const sizes  = [120, 100, 100];

  return (
    <div
      style={{
        flex: 1,
        minWidth: 180,
        borderRadius: 20,
        padding: "24px 20px",
        background: gradients[rank - 1],
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        position: "relative",
        boxShadow: isMine
          ? "0 0 0 3px #FBBF24, 0 8px 32px rgba(0,0,0,0.5)"
          : "0 8px 32px rgba(0,0,0,0.4)",
        order: rank === 1 ? 0 : rank === 2 ? -1 : 1,
      }}
    >
      {isMine && (
        <span
          style={{
            position: "absolute",
            top: -14,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#FBBF24",
            color: "#1C1917",
            fontSize: 11,
            fontWeight: 800,
            padding: "3px 12px",
            borderRadius: 20,
            whiteSpace: "nowrap",
          }}
        >
          Your College
        </span>
      )}

      <div
        style={{
          width: sizes[rank - 1],
          height: sizes[rank - 1],
          borderRadius: "50%",
          background: "rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: rank === 1 ? 44 : 36,
          border: "3px solid rgba(255,255,255,0.3)",
        }}
      >
        <Building2 size={rank === 1 ? 42 : 32} color="#fff" />
      </div>

      <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>
        {labels[rank - 1]}
      </span>
      <h3
        style={{
          margin: 0,
          color: "#fff",
          fontSize: 15,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        {college.collegeName || college.name || "College"}
      </h3>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
        <span
          style={{
            background: "rgba(0,0,0,0.25)",
            borderRadius: 10,
            padding: "4px 10px",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {college.totalPoints ?? 0} pts
        </span>
        <span
          style={{
            background: "rgba(0,0,0,0.2)",
            borderRadius: 10,
            padding: "4px 10px",
            color: "rgba(255,255,255,0.85)",
            fontSize: 12,
          }}
        >
          {college.totalStudents ?? 0} students
        </span>
      </div>
    </div>
  );
}

/* ─────────────── Main Component ─────────────── */
export default function LeaderboardPage() {
  const { user, opportunities = [], applications = [] } = useApp();
  const [activeTab, setActiveTab]             = useState("Overall");
  const [search, setSearch]                   = useState("");
  const [selectedCollege, setSelectedCollege] = useState("All");
  const [selectedZone, setSelectedZone]       = useState("All");
  const [selectedYear, setSelectedYear]       = useState("All");
  const [selectedEvent, setSelectedEvent]     = useState("All");
  const [collegeSearch, setCollegeSearch]     = useState("");
  const [collegeYearFilter, setCollegeYearFilter] = useState("All");
  const [zoneFilter, setZoneFilter]           = useState("All");
  const [zoneCollegeSearch, setZoneCollegeSearch] = useState("");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [collegeLeaderboard, setCollegeLeaderboard] = useState([]);
  const [loading, setLoading]                 = useState(true);

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

        /* ── college leaderboard ── */
        try {
          const rRes = await adminAPI.getReports();
          if (rRes?.data?.collegeLeaderboard) {
            setCollegeLeaderboard(rRes.data.collegeLeaderboard);
          }
        } catch (_) {
          /* college leaderboard is optional */
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
          (u.batch || "").toLowerCase().includes(q)
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
  const myCollegeName = user?.college || "Anna University";

  // 1. Student rankings filtered by search for legacy compatibility
  const filteredUsers = filteredAndRankedStudents;

  // 2. Computed College Leaderboard
  const computedColleges = React.useMemo(() => {
    const map = new Map();
    leaderboardData.forEach((u) => {
      const col = u.college || "Anna University, Chennai";
      if (!map.has(col)) {
        map.set(col, {
          collegeName: col,
          totalStudents: 0,
          totalPoints: 0,
          totalHours: 0,
          topVolunteer: u.name,
          highestPoints: 0,
        });
      }
      const entry = map.get(col);
      entry.totalStudents += 1;
      entry.totalPoints += Number(u.points) || 0;
      entry.totalHours += Number(u.totalHours) || 0;
      if ((Number(u.points) || 0) >= entry.highestPoints) {
        entry.highestPoints = Number(u.points) || 0;
        entry.topVolunteer = u.name;
      }
    });

    // Merge with any backend reports college leaderboard if available
    collegeLeaderboard.forEach((c) => {
      const name = c.collegeName || c.name;
      if (name && !map.has(name)) {
        map.set(name, {
          collegeName: name,
          totalStudents: c.totalStudents || 1,
          totalPoints: c.totalPoints || 0,
          totalHours: c.totalHours || 0,
          topVolunteer: c.topVolunteer || "Volunteers",
          highestPoints: c.totalPoints || 0,
        });
      }
    });

    const list = Array.from(map.values()).sort(
      (a, b) => b.totalPoints - a.totalPoints || b.totalStudents - a.totalStudents
    );
    return list;
  }, [leaderboardData, collegeLeaderboard]);

  const filteredColleges = computedColleges.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (c.collegeName || "").toLowerCase().includes(q);
  });

  // ── College-tab dedicated search (independent from Overall search)
  const collegeTabFiltered = React.useMemo(() => {
    // First, filter the underlying student data by year if needed
    let baseData = leaderboardData;
    if (collegeYearFilter !== "All") {
      baseData = leaderboardData.filter(
        (u) => (u.batch || "").trim() === collegeYearFilter.trim()
      );
    }

    // Re-aggregate colleges from year-filtered students
    const map = new Map();
    baseData.forEach((u) => {
      const col = u.college || "Anna University, Chennai";
      if (!map.has(col)) {
        map.set(col, {
          collegeName: col,
          totalStudents: 0,
          totalPoints: 0,
          totalHours: 0,
          topVolunteer: u.name,
          highestPoints: 0,
        });
      }
      const entry = map.get(col);
      entry.totalStudents += 1;
      entry.totalPoints += Number(u.points) || 0;
      entry.totalHours += Number(u.totalHours) || 0;
      if ((Number(u.points) || 0) >= entry.highestPoints) {
        entry.highestPoints = Number(u.points) || 0;
        entry.topVolunteer = u.name;
      }
    });
    let yearFiltered = Array.from(map.values()).sort(
      (a, b) => b.totalPoints - a.totalPoints || b.totalStudents - a.totalStudents
    );
    // If no year filter, merge backend college leaderboard too
    if (collegeYearFilter === "All") {
      collegeLeaderboard.forEach((c) => {
        const name = c.collegeName || c.name;
        if (name && !map.has(name)) {
          yearFiltered.push({
            collegeName: name,
            totalStudents: c.totalStudents || 1,
            totalPoints: c.totalPoints || 0,
            totalHours: c.totalHours || 0,
            topVolunteer: c.topVolunteer || "Volunteers",
            highestPoints: c.totalPoints || 0,
          });
        }
      });
      yearFiltered.sort((a, b) => b.totalPoints - a.totalPoints || b.totalStudents - a.totalStudents);
    }

    // Then apply the name search
    const q = collegeSearch.trim().toLowerCase();
    if (!q) return yearFiltered;
    return yearFiltered.filter((c) =>
      (c.collegeName || "").toLowerCase().includes(q) ||
      (c.topVolunteer || "").toLowerCase().includes(q)
    );
  }, [leaderboardData, collegeLeaderboard, collegeSearch, collegeYearFilter]);

  // ── Zone-tab: filter students by selected zone, aggregate colleges inside it
  const zoneTabStudents = React.useMemo(() => {
    if (zoneFilter === "All") return leaderboardData;
    return leaderboardData.filter(
      (u) => (u.zone || "Zone 1").trim() === zoneFilter.trim()
    );
  }, [leaderboardData, zoneFilter]);

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
    return zoneTabColleges.filter((c) =>
      (c.collegeName || "").toLowerCase().includes(q)
    );
  }, [zoneTabColleges, zoneCollegeSearch]);

  // 3. Computed Zone Leaderboard (Zone 1, Zone 2, Zone 3)
  const zoneRankings = React.useMemo(() => {
    const ZONES = [
      {
        zoneName: "Zone 1",
        region: "North Tamil Nadu & Chennai Region",
        districts: "Chennai, Tiruvallur, Kanchipuram, Chengalpattu, Vellore",
      },
      {
        zoneName: "Zone 2",
        region: "Central & Western Tamil Nadu",
        districts: "Coimbatore, Salem, Erode, Tiruppur, Trichy, Karur",
      },
      {
        zoneName: "Zone 3",
        region: "Southern Tamil Nadu",
        districts: "Madurai, Tirunelveli, Tenkasi, Thoothukudi, Kanyakumari, Theni",
      },
    ];

    const aggregated = ZONES.map((z) => {
      const zoneStudents = leaderboardData.filter(
        (u) => (u.zone || "").trim() === z.zoneName || (!u.zone && z.zoneName === "Zone 1")
      );
      const totalPoints = zoneStudents.reduce((sum, s) => sum + (Number(s.points) || 0), 0);
      const totalHours = zoneStudents.reduce((sum, s) => sum + (Number(s.totalHours) || 0), 0);
      const totalVolunteers = zoneStudents.length;
      const topStudent =
        [...zoneStudents].sort((a, b) => (b.points || 0) - (a.points || 0))[0]?.name ||
        "Active Volunteers";
      const leadingCollege =
        [...zoneStudents].sort((a, b) => (b.points || 0) - (a.points || 0))[0]?.college ||
        "Anna University, Chennai";

      return {
        ...z,
        totalPoints,
        totalHours,
        totalVolunteers,
        topStudent,
        leadingCollege,
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints || b.totalVolunteers - a.totalVolunteers);

    return aggregated;
  }, [leaderboardData]);

  const topThree   = leaderboardData.slice(0, 3);
  const myStanding = leaderboardData.find((u) => u.isCurrentUser) || {};
  const myRank     = myStanding.rank     ?? (user?.rank     ?? "–");
  const myPoints   = myStanding.points   ?? (user?.points   ?? 0);
  const myHours    = myStanding.totalHours ?? (user?.totalHours ?? 0);
  const myEvents   = myStanding.eventsJoined ?? (user?.eventsJoined ?? 0);

  const topColleges = computedColleges.slice(0, 3);
  const topZones = zoneRankings.slice(0, 3);

  /* ─── styles ─── */
  const heroStyle = {
    background: "linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)",
    borderRadius: 20,
    padding: "20px 26px",
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

  const tabBtnStyle = (active) => ({
    padding: "8px 18px",
    borderRadius: 50,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    transition: "all .2s",
    background: active
      ? "linear-gradient(135deg,#4F46E5,#7C3AED)"
      : "rgba(99,102,241,0.1)",
    color: active ? "#fff" : "#6366F1",
    boxShadow: active ? "0 4px 15px rgba(79,70,229,0.4)" : "none",
  });

  /* college table row highlight */
  const isMyCollege = (c) =>
    user?.college &&
    (c.collegeName || c.name || "")
      .toLowerCase()
      .trim()
      .includes(user.college.toLowerCase().trim());

  return (
    <div className="dashboard-container">

      {/* ═══════════════ HERO BANNER (COMPACT & BALANCED) ═══════════════ */}
      <div style={heroStyle}>
        {/* decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          {/* Left: Title & Subtitle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.16)",
                borderRadius: 12,
                padding: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trophy size={24} color="#FCD34D" />
            </div>
            <div>
              <h1 style={{ margin: 0, color: "#fff", fontSize: 22, fontWeight: 900, lineHeight: 1.15 }}>
                Volunteer Impact Leaderboard
              </h1>
              <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
                Top student contributors across Tamil Nadu 🌟
              </p>
            </div>
          </div>

          {/* Right: KPI Chips Row */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {[
              { label: "My Rank",   value: `#${myRank}`,       icon: <Trophy size={14} color="#FCD34D" /> },
              { label: "Points",    value: `${myPoints} pts`,   icon: <Zap size={14} color="#A78BFA" /> },
              { label: "Hours",     value: `${myHours} hrs`,    icon: <Clock size={14} color="#34D399" /> },
              { label: "Events",    value: `${myEvents} joined`,icon: <Star size={14} color="#FB923C" /> },
            ].map((chip) => (
              <div key={chip.label} style={kpiChipStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {chip.icon}
                  <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                    {chip.label}
                  </span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: 0.2 }}>
                  {chip.value}
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
                marginBottom: 0,
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
              <span style={{ color: "#6B7280", fontSize: 12, textAlign: "center" }}>{topThree[1].college}</span>
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
              <span style={{ color: "#9A3412", fontSize: 12, textAlign: "center" }}>{topThree[2].college}</span>
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
            { key: "Zone",    label: "Zone-wise Leaderboard",    icon: "📍" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={tabBtnStyle(activeTab === key)}
            >
              <span style={{ marginRight: 6 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

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
      </div>

      {/* ═══════════════ TAB 1: OVERALL STUDENT LEADERBOARD ═══════════════ */}
      {activeTab === "Overall" && (
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            border: "1px solid #E8EDF5",
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            marginBottom: 32,
          }}
        >
          {/* ── Unified Filter Bar ── */}
          <div
            style={{
              padding: "16px 20px",
              background: "linear-gradient(90deg,#F8F7FF,#EEF2FF)",
              borderBottom: "1px solid #E8EDF5",
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
            }}
          >
            {/* College filter */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Building2 size={14} color="#6366F1" />
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                style={{
                  border: "1.5px solid #C7D2FE",
                  borderRadius: 8,
                  padding: "5px 10px",
                  fontSize: 13,
                  color: "#334155",
                  background: "#fff",
                  fontWeight: selectedCollege !== "All" ? 700 : 400,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="All">All Colleges</option>
                {collegeOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Zone filter */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={14} color="#6366F1" />
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                style={{
                  border: "1.5px solid #C7D2FE",
                  borderRadius: 8,
                  padding: "5px 10px",
                  fontSize: 13,
                  color: "#334155",
                  background: "#fff",
                  fontWeight: selectedZone !== "All" ? 700 : 400,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {zoneOptions.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            {/* Year-wise filter */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} color="#6366F1" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  border: "1.5px solid #C7D2FE",
                  borderRadius: 8,
                  padding: "5px 10px",
                  fontSize: 13,
                  color: "#334155",
                  background: "#fff",
                  fontWeight: selectedYear !== "All" ? 700 : 400,
                  outline: "none",
                  cursor: "pointer",
                }}
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
              <Calendar size={14} color="#6366F1" />
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                style={{
                  border: "1.5px solid #C7D2FE",
                  borderRadius: 8,
                  padding: "5px 10px",
                  fontSize: 13,
                  color: "#334155",
                  background: "#fff",
                  fontWeight: selectedEvent !== "All" ? 700 : 400,
                  outline: "none",
                  cursor: "pointer",
                  maxWidth: 220,
                }}
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
                  border: "1.5px solid #6366F1",
                  background: "linear-gradient(135deg,#4F46E5,#7C3AED)",
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

            {/* Spacer + result count */}
            <span style={{ marginLeft: "auto", fontSize: 12.5, color: "#6B7280", fontWeight: 600 }}>
              <Sparkles size={13} color="#6366F1" style={{ marginRight: 4, verticalAlign: "middle" }} />
              Showing <strong style={{ color: "#4F46E5" }}>{filteredAndRankedStudents.length}</strong> ranked student{filteredAndRankedStudents.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Active Filter Chips */}
          {isFilterActive && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                padding: "10px 20px",
                background: "#FAFBFF",
                borderBottom: "1px solid #EEF2FF",
              }}
            >
              {selectedCollege !== "All" && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "#EEF2FF",
                    color: "#4F46E5",
                    border: "1px solid #C7D2FE",
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <Building2 size={11} /> {selectedCollege}
                  <button
                    onClick={() => setSelectedCollege("All")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "#6366F1" }}
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedZone !== "All" && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "#EEF2FF",
                    color: "#4F46E5",
                    border: "1px solid #C7D2FE",
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <MapPin size={11} /> {selectedZone}
                  <button
                    onClick={() => setSelectedZone("All")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "#6366F1" }}
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedYear !== "All" && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "#EEF2FF",
                    color: "#4F46E5",
                    border: "1px solid #C7D2FE",
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <Clock size={11} /> Year: {selectedYear}
                  <button
                    onClick={() => setSelectedYear("All")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "#6366F1" }}
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedEvent !== "All" && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "#EEF2FF",
                    color: "#4F46E5",
                    border: "1px solid #C7D2FE",
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <Calendar size={11} /> {selectedEvent}
                  <button
                    onClick={() => setSelectedEvent("All")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "#6366F1" }}
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {search.trim() && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "#EEF2FF",
                    color: "#4F46E5",
                    border: "1px solid #C7D2FE",
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <Search size={11} /> "{search.trim()}"
                  <button
                    onClick={() => setSearch("")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "#6366F1" }}
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "60px 1.4fr 1.2fr 90px 90px 100px 90px",
              padding: "14px 20px",
              background: "linear-gradient(90deg,#F8F7FF,#EEF2FF)",
              borderBottom: "1px solid #E8EDF5",
              fontWeight: 700,
              fontSize: 12,
              color: "#6366F1",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            <span>Rank</span>
            <span>Volunteer</span>
            <span className="desktop-only">College</span>
            <span className="desktop-only" style={{ textAlign: "center" }}>Zone</span>
            <span className="desktop-only" style={{ textAlign: "center" }}>Events</span>
            <span className="desktop-only" style={{ textAlign: "right" }}>Hours</span>
            <span style={{ textAlign: "right" }}>Points</span>
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
              const tierColors = badgeTierColor(u.badgeTier);
              return (
                <div
                  key={u.rank + "_" + u.name + "_" + i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1.4fr 1.2fr 90px 90px 100px 90px",
                    padding: "14px 20px",
                    alignItems: "center",
                    borderBottom: "1px solid #F1F5F9",
                    background: isMe
                      ? "linear-gradient(90deg,#FFF7ED,#FFFBEB)"
                      : i % 2 === 0
                      ? "#fff"
                      : "#FAFBFF",
                    borderLeft: isMe ? "4px solid #F59E0B" : "4px solid transparent",
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
                          background: "#F1F5F9",
                          color: "#64748B",
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        {u.rank}
                      </span>
                    )}
                  </div>

                  {/* Volunteer info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img
                      src={u.avatar}
                      alt={u.name}
                      style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", border: `2px solid ${isMe ? "#F59E0B" : "#E2E8F0"}` }}
                    />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <strong style={{ color: "#1E293B", fontSize: 14 }}>{u.name}</strong>
                        {isMe && (
                          <span
                            style={{
                              background: "linear-gradient(90deg,#F59E0B,#FBBF24)",
                              color: "#78350F",
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: 20,
                            }}
                          >
                            You
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 3,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background: tierColors.bg,
                          color: tierColors.color,
                        }}
                      >
                        {u.badgeTier}
                      </span>
                    </div>
                  </div>

                  {/* College */}
                  <div className="desktop-only" style={{ color: "#64748B", fontSize: 13 }}>
                    {u.college}
                  </div>

                  {/* Zone */}
                  <div className="desktop-only" style={{ textAlign: "center" }}>
                    <span style={{ background: "#F1F5F9", color: "#475569", padding: "3px 8px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
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
                        color: "#D97706",
                        border: "1px solid #FDE68A",
                        padding: "3px 9px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
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
                        background: "#EFF6FF",
                        color: "#2563EB",
                        borderRadius: 10,
                        padding: "4px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      <Clock size={12} color="#2563EB" />
                      {u.totalHours || 0} hrs
                    </span>
                  </div>

                  {/* Points */}
                  <div style={{ textAlign: "right" }}>
                    <strong
                      style={{
                        color: isMe ? "#D97706" : "#6366F1",
                        fontSize: 16,
                        fontWeight: 900,
                      }}
                    >
                      {u.points}
                      <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2, opacity: 0.7 }}>pts</span>
                    </strong>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══════════════ TAB 2: COLLEGE-WISE LEADERBOARD ═══════════════ */}
      {activeTab === "College" && (
        <div
          style={{
            background: "linear-gradient(135deg, #1E1B4B 0%, #2D1065 50%, #1E1035 100%)",
            borderRadius: 20,
            border: "1.5px solid rgba(167, 139, 250, 0.35)",
            boxShadow: "0 10px 36px rgba(30, 27, 75, 0.32)",
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
                  background: "linear-gradient(135deg,#4338CA,#7C3AED)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Building2 size={20} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 900 }}>
                  🏛️ College-wise Leaderboard
                </h2>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 2 }}>
                  Institutions ranked by total student volunteering impact across Tamil Nadu
                </p>
              </div>
            </div>

            {/* College Controls: Year filter + Search */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {/* Year filter dropdown */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={14} color="#A78BFA" />
                <select
                  value={collegeYearFilter}
                  onChange={(e) => setCollegeYearFilter(e.target.value)}
                  style={{
                    border: "1.5px solid rgba(167,139,250,0.4)",
                    borderRadius: 10,
                    padding: "7px 12px",
                    fontSize: 13,
                    color: "#fff",
                    background: "rgba(255,255,255,0.1)",
                    fontWeight: 700,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="All" style={{ color: "#000" }}>All Years</option>
                  <option value="4 Year" style={{ color: "#000" }}>4th Year</option>
                  <option value="3 Year" style={{ color: "#000" }}>3rd Year</option>
                  <option value="2 Year" style={{ color: "#000" }}>2nd Year</option>
                  <option value="1 Year" style={{ color: "#000" }}>1st Year</option>
                  <option value="2022-2026" style={{ color: "#000" }}>2022-2026 Batch</option>
                  <option value="2023-2027" style={{ color: "#000" }}>2023-2027 Batch</option>
                  <option value="2021-2025" style={{ color: "#000" }}>2021-2025 Batch</option>
                  <option value="2020-2024" style={{ color: "#000" }}>2020-2024 Batch</option>
                </select>
              </div>

              {/* College Search Box */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,0.1)",
                  border: "1.5px solid rgba(255,255,255,0.2)",
                  borderRadius: 12,
                  padding: "8px 14px",
                  minWidth: 240,
                }}
              >
                <Search size={15} color="rgba(255,255,255,0.7)" />
                <input
                  type="text"
                  placeholder="Search college or volunteer…"
                  value={collegeSearch}
                  onChange={(e) => setCollegeSearch(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    flex: 1,
                    fontSize: 13,
                    color: "#fff",
                  }}
                />
                {collegeSearch && (
                  <button
                    onClick={() => setCollegeSearch("")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "rgba(255,255,255,0.6)" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results counter */}
          {collegeSearch.trim() && (
            <div style={{ marginBottom: 12, fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>
              Showing <strong style={{ color: "#A5B4FC" }}>{collegeTabFiltered.length}</strong> college{collegeTabFiltered.length !== 1 ? "s" : ""} matching "{collegeSearch}"
            </div>
          )}

          {/* Top 3 College Podium */}
          {topColleges.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 16,
                marginBottom: 28,
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "stretch",
              }}
            >
              {topColleges.map((c, i) => (
                <CollegePodiumCard
                  key={c.collegeName || c.name || i}
                  college={c}
                  rank={i + 1}
                  isMine={isMyCollege(c)}
                />
              ))}
            </div>
          )}

          {/* Full College Table */}
          {collegeTabFiltered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.4)" }}>
              <Building2 size={40} style={{ marginBottom: 10, opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: 14 }}>No colleges found matching "{collegeSearch}".</p>
            </div>
          ) : (
            <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1.4fr 110px 110px 120px 1fr",
                  padding: "12px 20px",
                  background: "rgba(255,255,255,0.05)",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  fontWeight: 700,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                <span>Rank</span>
                <span>College</span>
                <span style={{ textAlign: "center" }}>Students</span>
                <span style={{ textAlign: "right" }}>Total Hours</span>
                <span style={{ textAlign: "right" }}>Total Points</span>
                <span style={{ textAlign: "right" }}>Leading Volunteer</span>
              </div>

              {/* Rows */}
              {collegeTabFiltered.map((c, i) => {
                const mine = isMyCollege(c);
                const rank = i + 1;
                return (
                  <div
                    key={c.collegeName || c.name || i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "56px 1.4fr 110px 110px 120px 1fr",
                      padding: "14px 20px",
                      alignItems: "center",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      background: mine
                        ? "rgba(251,191,36,0.07)"
                        : i % 2 === 0
                        ? "rgba(255,255,255,0.02)"
                        : "transparent",
                      borderLeft: mine ? "4px solid #FBBF24" : "4px solid transparent",
                      transition: "background .15s",
                    }}
                  >
                    <div>{rankMedal(rank)}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: mine
                            ? "linear-gradient(135deg,#B45309,#D97706)"
                            : "rgba(99,102,241,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <GraduationCap size={18} color={mine ? "#FCD34D" : "#818CF8"} />
                      </div>
                      <span style={{ color: mine ? "#FCD34D" : "#F1F5F9", fontWeight: mine ? 800 : 600, fontSize: 13.5 }}>
                        {c.collegeName || c.name}
                        {mine && (
                          <span style={{ marginLeft: 8, background: "#D97706", color: "#1C1917", fontSize: 10, fontWeight: 900, padding: "2px 7px", borderRadius: 20 }}>
                            Your College
                          </span>
                        )}
                      </span>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <span style={{ background: "rgba(99,102,241,0.15)", color: "#A5B4FC", borderRadius: 10, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>
                        <Users size={11} style={{ marginRight: 4 }} />
                        {c.totalStudents ?? 0}
                      </span>
                    </div>

                    <div style={{ textAlign: "right", color: "#6EE7B7", fontSize: 13, fontWeight: 700 }}>
                      <Clock size={11} style={{ marginRight: 3 }} />
                      {(c.totalHours ?? 0).toLocaleString()} hrs
                    </div>

                    <div style={{ textAlign: "right", color: mine ? "#FCD34D" : "#C7D2FE", fontWeight: 800, fontSize: 15 }}>
                      {(c.totalPoints ?? 0).toLocaleString()} pts
                    </div>

                    <div style={{ textAlign: "right", color: "rgba(255,255,255,0.7)", fontSize: 12.5, fontWeight: 600 }}>
                      ⭐ {c.topVolunteer || "Student Leader"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ TAB 3: ZONE-WISE LEADERBOARD ═══════════════ */}
      {activeTab === "Zone" && (
        <div
          style={{
            background: "linear-gradient(135deg, #064E3B 0%, #065F46 50%, #022C22 100%)",
            borderRadius: 20,
            border: "1.5px solid rgba(52, 211, 153, 0.35)",
            boxShadow: "0 10px 36px rgba(6, 78, 59, 0.32)",
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
                  background: "linear-gradient(135deg,#059669,#10B981)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MapPin size={22} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 900 }}>
                  📍 Zone-wise Leaderboard
                </h2>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 }}>
                  Community service performance aggregated across Zone 1, Zone 2, and Zone 3
                </p>
              </div>
            </div>

            {/* Zone Filter Controls */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              {/* Zone Selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <MapPin size={14} color="#6EE7B7" />
                <select
                  value={zoneFilter}
                  onChange={(e) => { setZoneFilter(e.target.value); setZoneCollegeSearch(""); }}
                  style={{
                    border: "1.5px solid rgba(52,211,153,0.4)",
                    borderRadius: 9,
                    padding: "6px 12px",
                    fontSize: 13,
                    color: "#fff",
                    background: "rgba(255,255,255,0.1)",
                    fontWeight: 700,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="All" style={{ color: "#000" }}>All Zones</option>
                  <option value="Zone 1" style={{ color: "#000" }}>Zone 1 – North TN & Chennai</option>
                  <option value="Zone 2" style={{ color: "#000" }}>Zone 2 – Central & Western TN</option>
                  <option value="Zone 3" style={{ color: "#000" }}>Zone 3 – Southern TN</option>
                </select>
              </div>

              {/* College search within selected zone */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,0.1)",
                  border: "1.5px solid rgba(52,211,153,0.3)",
                  borderRadius: 10,
                  padding: "6px 12px",
                  minWidth: 200,
                }}
              >
                <Search size={14} color="#6EE7B7" />
                <input
                  type="text"
                  placeholder="Search college in zone…"
                  value={zoneCollegeSearch}
                  onChange={(e) => setZoneCollegeSearch(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    flex: 1,
                    fontSize: 13,
                    color: "#fff",
                  }}
                />
                {zoneCollegeSearch && (
                  <button
                    onClick={() => setZoneCollegeSearch("")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "#6EE7B7" }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Reset zone filters */}
              {(zoneFilter !== "All" || zoneCollegeSearch) && (
                <button
                  onClick={() => { setZoneFilter("All"); setZoneCollegeSearch(""); }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 13px",
                    borderRadius: 20,
                    border: "1.5px solid #6EE7B7",
                    background: "rgba(16,185,129,0.2)",
                    color: "#6EE7B7",
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

          {/* Zone summary stats strip (when a zone is selected) */}
          {zoneFilter !== "All" && (
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                marginBottom: 20,
                padding: "14px 18px",
                background: "rgba(255,255,255,0.06)",
                borderRadius: 14,
                border: "1px solid rgba(52,211,153,0.2)",
              }}
            >
              {[
                { label: "Volunteers", value: zoneTabStudents.length, icon: <Users size={15} color="#6EE7B7" /> },
                { label: "Colleges", value: zoneTabColleges.length, icon: <Building2 size={15} color="#A5B4FC" /> },
                { label: "Total Points", value: zoneTabStudents.reduce((s, u) => s + (Number(u.points) || 0), 0).toLocaleString(), icon: <Star size={15} color="#FCD34D" fill="#FCD34D" /> },
                { label: "Total Hours", value: zoneTabStudents.reduce((s, u) => s + (Number(u.totalHours) || 0), 0) + " hrs", icon: <Clock size={15} color="#34D399" /> },
              ].map((stat) => (
                <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff" }}>
                  {stat.icon}
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{stat.label}:</span>
                  <strong style={{ fontSize: 14 }}>{stat.value}</strong>
                </div>
              ))}
            </div>
          )}

          {/* Zone Podium (Zone 1, Zone 2, Zone 3) – click to filter */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {topZones.map((z, idx) => {
              const isSelected = zoneFilter === z.zoneName;
              return (
                <div
                  key={z.zoneName}
                  onClick={() => setZoneFilter(isSelected ? "All" : z.zoneName)}
                  style={{
                    background: isSelected ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(10px)",
                    border: isSelected
                      ? "2px solid #10B981"
                      : idx === 0
                      ? "2px solid #FBBF24"
                      : "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 16,
                    padding: "20px 22px",
                    color: "#fff",
                    cursor: "pointer",
                    transition: "all .2s",
                    transform: isSelected ? "translateY(-3px)" : "none",
                    boxShadow: isSelected ? "0 8px 24px rgba(16,185,129,0.3)" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 24 }}>{MEDAL[idx] || "⭐"}</span>
                    <span style={{
                      background: isSelected ? "#10B981" : "rgba(16,185,129,0.6)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 20,
                    }}>
                      {isSelected ? "✓ Selected" : `#${idx + 1} Ranked`}
                    </span>
                  </div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900, color: "#fff" }}>
                    {z.zoneName}
                  </h3>
                  <p style={{ fontSize: 12, color: "#A7F3D0", margin: "0 0 14px", lineHeight: 1.4 }}>
                    {z.region}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 10, fontSize: 13 }}>
                    <span>Volunteers: <strong>{z.totalVolunteers}</strong></span>
                    <span style={{ color: "#FCD34D", fontWeight: 800 }}>{z.totalPoints} pts</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
                    {isSelected ? "Click to deselect" : "Click to filter"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Zone Table */}
          <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "56px 120px 1.5fr 100px 110px 120px 1fr",
                padding: "12px 20px",
                background: "rgba(255,255,255,0.06)",
                fontWeight: 700,
                fontSize: 11,
                color: "#A7F3D0",
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              <span>Rank</span>
              <span>Zone</span>
              <span>Coverage Districts</span>
              <span style={{ textAlign: "center" }}>Volunteers</span>
              <span style={{ textAlign: "right" }}>Total Hours</span>
              <span style={{ textAlign: "right" }}>Total Points</span>
              <span style={{ textAlign: "right" }}>Leading College</span>
            </div>

            {zoneRankings.map((z, idx) => (
              <div
                key={z.zoneName}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 120px 1.5fr 100px 110px 120px 1fr",
                  padding: "14px 20px",
                  alignItems: "center",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  background: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                  color: "#fff",
                }}
              >
                <div>{rankMedal(idx + 1)}</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#6EE7B7" }}>{z.zoneName}</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.8)" }}>{z.districts}</div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ background: "rgba(16,185,129,0.2)", color: "#A7F3D0", padding: "3px 8px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                    {z.totalVolunteers}
                  </span>
                </div>
                <div style={{ textAlign: "right", color: "#6EE7B7", fontSize: 13, fontWeight: 700 }}>
                  {z.totalHours} hrs
                </div>
                <div style={{ textAlign: "right", color: "#FCD34D", fontWeight: 800, fontSize: 15 }}>
                  {z.totalPoints} pts
                </div>
                <div style={{ textAlign: "right", color: "#E2E8F0", fontSize: 12.5 }}>
                  {z.leadingCollege}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
