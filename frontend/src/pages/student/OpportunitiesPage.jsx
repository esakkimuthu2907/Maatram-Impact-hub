// frontend/src/pages/student/OpportunitiesPage.jsx
import React, { useMemo, useState } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import {
  Search,
  Bookmark,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Globe,
  BookOpen,
  HeartHandshake,
  Sparkles,
  Award,
  ShieldCheck,
  QrCode,
  Eye,
  LayoutGrid,
  List,
  X,
  ChevronRight,
  Zap,
  Star,
  Filter,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { CATEGORIES, INITIAL_OPPORTUNITIES } from "../../data/mockData";

// ─── Icon resolver ────────────────────────────────────────────────────────────
const ICON_MAP = {
  GraduationCap,
  Users,
  Globe,
  BookOpen,
  HeartHandshake,
  Sparkles,
  Award,
  Star,
};
function CategoryIcon({ name, size = 22, color = "currentColor" }) {
  const Icon = ICON_MAP[name] || Sparkles;
  return <Icon size={size} color={color} />;
}

// ─── Mode badge colors ────────────────────────────────────────────────────────
const MODE_STYLES = {
  Online:  { bg: "#DCFCE7", color: "#166534", dot: "#22C55E" },
  Offline: { bg: "#FEF9C3", color: "#713F12", dot: "#EAB308" },
  Hybrid:  { bg: "#EDE9FE", color: "#4C1D95", dot: "#8B5CF6" },
};

// ─── Category card component ──────────────────────────────────────────────────
function CategoryCard({ cat, count }) {
  return (
    <Link
      to={`/opportunities/${cat.slug}`}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRadius: 20,
        overflow: "hidden",
        textDecoration: "none",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        border: "1.5px solid #F1F5F9",
        transition: "all 0.22s cubic-bezier(.4,0,.2,1)",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 12px 32px ${cat.color}30`;
        e.currentTarget.style.borderColor = cat.color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)";
        e.currentTarget.style.borderColor = "#F1F5F9";
      }}
    >
      {/* Banner image strip */}
      <div style={{ position: "relative", height: 90, overflow: "hidden" }}>
        <img
          src={cat.bannerImage}
          alt={cat.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          loading="lazy"
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${cat.color}CC 0%, ${cat.color}66 100%)`,
          }}
        />
        {/* Icon */}
        <div
          style={{
            position: "absolute",
            bottom: -18,
            left: 20,
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 4px 12px ${cat.color}50`,
            border: `2px solid ${cat.color}30`,
          }}
        >
          <CategoryIcon name={cat.icon} size={20} color={cat.color} />
        </div>
        {/* Count badge */}
        {count > 0 && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "rgba(255,255,255,0.95)",
              borderRadius: 20,
              padding: "2px 10px",
              fontSize: 12,
              fontWeight: 700,
              color: cat.color,
            }}
          >
            {count} {count === 1 ? "opp" : "opps"}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "28px 20px 18px" }}>
        <h3
          style={{
            margin: "0 0 4px",
            fontSize: 15,
            fontWeight: 700,
            color: "#1E293B",
            lineHeight: 1.3,
          }}
        >
          {cat.name}
        </h3>
        <p
          style={{
            margin: "0 0 4px",
            fontSize: 11.5,
            fontWeight: 600,
            color: cat.color,
            letterSpacing: "0.02em",
          }}
        >
          {cat.tagline}
        </p>
        <p
          style={{
            margin: "6px 0 14px",
            fontSize: 12,
            color: "#64748B",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {cat.description}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: cat.color,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Explore <ChevronRight size={14} />
          </span>
          {count === 0 && (
            <span style={{ fontSize: 11, color: "#94A3B8" }}>Coming soon</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Opportunity card component ───────────────────────────────────────────────
function OppCard({ opp, applied, app, bookmarked, toggleBookmark, setPreviewOpp, openQRAttendance }) {
  const oppId = opp.id || opp._id;
  const isApproved = app?.status === "Approved";
  const modeStyle = MODE_STYLES[opp.mode] || MODE_STYLES.Offline;

  const needed = Number(opp.volunteersNeeded) || 10;
  const available = Number(opp.slotsAvailable) || 0;
  const filled = Math.max(0, needed - available);
  const fillRatio = Math.min(100, Math.round((filled / needed) * 100));

  const catObj = CATEGORIES.find((c) => c.slug === opp.categorySlug);
  const catColor = catObj?.color || "#4F46E5";
  const catBg = catObj?.bgColor || "#EEF2FF";

  const skillsList = Array.isArray(opp.skills)
    ? opp.skills
    : typeof opp.skills === "string"
    ? opp.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        border: applied ? `1.5px solid ${catColor}50` : "1.5px solid #F1F5F9",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.22s cubic-bezier(.4,0,.2,1)",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,0.11)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)";
      }}
    >
      {/* Featured ribbon */}
      {opp.featured && (
        <div
          style={{
            position: "absolute",
            top: 14,
            left: -8,
            background: "linear-gradient(90deg, #F59E0B, #EF4444)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 12px 3px 14px",
            borderRadius: "0 6px 6px 0",
            letterSpacing: "0.06em",
            zIndex: 3,
            boxShadow: "2px 2px 6px rgba(0,0,0,0.15)",
          }}
        >
          ★ FEATURED
        </div>
      )}

      {/* Image */}
      <div style={{ position: "relative", height: 180, flexShrink: 0 }}>
        <img
          src={opp.image}
          alt={opp.title}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)",
          }}
        />

        {/* Mode badge */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: modeStyle.bg,
            color: modeStyle.color,
            borderRadius: 20,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: modeStyle.dot,
              display: "inline-block",
            }}
          />
          {opp.mode || "Offline"}
        </div>

        {/* Bookmark */}
        <button
          onClick={() => toggleBookmark(oppId)}
          aria-label={bookmarked ? "Remove bookmark" : "Save"}
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "none",
            background: bookmarked ? "#FFD629" : "rgba(255,255,255,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.18s",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <Bookmark
            size={14}
            fill={bookmarked ? "#1E293B" : "none"}
            color={bookmarked ? "#1E293B" : "#475569"}
          />
        </button>

        {/* Points & Hours overlaid at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 12,
            display: "flex",
            gap: 6,
          }}
        >
          <span
            style={{
              background: "rgba(234,179,8,0.95)",
              color: "#1a1a1a",
              borderRadius: 10,
              padding: "3px 9px",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Zap size={10} />+{opp.points || 50} pts
          </span>
          <span
            style={{
              background: "rgba(59,130,246,0.92)",
              color: "#fff",
              borderRadius: 10,
              padding: "3px 9px",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Clock size={10} />{opp.durationHours || 4}h
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px 0", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Category badge */}
        <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span
            style={{
              background: catBg,
              color: catColor,
              borderRadius: 20,
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            {opp.category}
          </span>
          {applied && (
            <span
              style={{
                background: app?.status === "Approved" ? "#DCFCE7" : app?.status === "Pending" ? "#FEF9C3" : "#F1F5F9",
                color: app?.status === "Approved" ? "#166534" : app?.status === "Pending" ? "#713F12" : "#475569",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <CheckCircle2 size={10} /> {app?.status}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            margin: "0 0 6px",
            fontSize: 14.5,
            fontWeight: 700,
            color: "#1E293B",
            lineHeight: 1.35,
          }}
        >
          <Link
            to={`/opportunities/${oppId}`}
            style={{ color: "inherit", textDecoration: "none" }}
            onMouseEnter={(e) => (e.target.style.color = catColor)}
            onMouseLeave={(e) => (e.target.style.color = "#1E293B")}
          >
            {opp.title}
          </Link>
        </h3>

        {/* Description */}
        <p
          style={{
            margin: "0 0 10px",
            fontSize: 12,
            color: "#64748B",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {opp.description}
        </p>

        {/* Teams list (if present) */}
        {opp.teams && opp.teams.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.05em" }}>
              TEAMS
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {opp.teams.slice(0, 4).map((team, i) => (
                <span
                  key={i}
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    color: "#475569",
                    borderRadius: 6,
                    padding: "2px 7px",
                    fontSize: 10.5,
                    fontWeight: 600,
                  }}
                >
                  {team}
                </span>
              ))}
              {opp.teams.length > 4 && (
                <span
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    color: "#94A3B8",
                    borderRadius: 6,
                    padding: "2px 7px",
                    fontSize: 10.5,
                    fontWeight: 600,
                  }}
                >
                  +{opp.teams.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Info row */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 5,
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569" }}>
            <Calendar size={12} color="#4F46E5" />
            <span>{opp.date}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569" }}>
            <MapPin size={12} color="#EF4444" />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "90%",
              }}
            >
              {opp.location}
            </span>
          </div>
        </div>

        {/* Slots progress */}
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "#64748B",
              marginBottom: 4,
            }}
          >
            <span>Availability</span>
            <strong
              style={{
                color: available <= 2 ? "#EF4444" : available <= 5 ? "#F59E0B" : "#10B981",
              }}
            >
              {available > 0 ? `${available} slots left` : "Full"}
            </strong>
          </div>
          <div
            style={{
              height: 5,
              background: "#F1F5F9",
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${fillRatio}%`,
                borderRadius: 99,
                background:
                  available <= 2
                    ? "#EF4444"
                    : available <= 5
                    ? "#F59E0B"
                    : "#10B981",
                transition: "width 0.4s",
              }}
            />
          </div>
        </div>

        {/* Skills pills */}
        {skillsList.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
            {skillsList.slice(0, 3).map((sk, i) => (
              <span
                key={i}
                style={{
                  background: "#F0F4FF",
                  color: "#4338CA",
                  borderRadius: 6,
                  padding: "2px 8px",
                  fontSize: 10.5,
                  fontWeight: 600,
                }}
              >
                {sk}
              </span>
            ))}
            {skillsList.length > 3 && (
              <span
                style={{
                  background: "#F8FAFC",
                  color: "#94A3B8",
                  borderRadius: 6,
                  padding: "2px 8px",
                  fontSize: 10.5,
                  fontWeight: 600,
                }}
              >
                +{skillsList.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #F1F5F9",
          padding: "10px 16px",
          display: "flex",
          gap: 8,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setPreviewOpp(opp)}
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 11.5,
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#EEF2FF"; e.currentTarget.style.color = catColor; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.color = "#475569"; }}
          >
            <Eye size={13} /> Preview
          </button>
          <Link
            to={`/opportunities/${oppId}`}
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 11.5,
              fontWeight: 600,
              color: "#475569",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F0FDF4"; e.currentTarget.style.color = "#16A34A"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.color = "#475569"; }}
          >
            Details
          </Link>
        </div>

        <div>
          {applied ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {isApproved && (
                <button
                  onClick={() => openQRAttendance(opp)}
                  style={{
                    background: "#4F46E5",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <QrCode size={12} /> QR Check-in
                </button>
              )}
            </div>
          ) : (
            <Link
              to={`/opportunities/${oppId}/apply`}
              style={{
                background: `linear-gradient(135deg, ${catColor}, ${catColor}CC)`,
                color: "#fff",
                borderRadius: 8,
                padding: "7px 14px",
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
                boxShadow: `0 3px 10px ${catColor}40`,
              }}
            >
              Apply <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OpportunitiesPage() {
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const {
    opportunities = [],
    applications = [],
    bookmarks = [],
    toggleBookmark,
    openQRAttendance,
  } = useApp();

  const urlSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(urlSearch);
  const [formatFilter, setFormatFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState("grid");
  const [previewOpp, setPreviewOpp] = useState(null);

  const currentCategory = categorySlug
    ? CATEGORIES.find((c) => c.slug === categorySlug)
    : null;
  const activeCategorySlug = currentCategory ? currentCategory.slug : "all";

  const rawOpps = opportunities || [];

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rawOpps
      .filter((item) => {
        if (activeCategorySlug !== "all") {
          const itemSlug =
            item.categorySlug ||
            (item.category || "").toLowerCase().replace(/\s+/g, "-");
          if (itemSlug !== activeCategorySlug) return false;
        }
        if (formatFilter !== "All" && item.mode !== formatFilter) return false;
        if (q) {
          const matchTitle = (item.title || "").toLowerCase().includes(q);
          const matchDesc = (item.description || "").toLowerCase().includes(q);
          const matchCategory = (item.category || "").toLowerCase().includes(q);
          const matchLoc = (item.location || "").toLowerCase().includes(q);
          const skillsArr = Array.isArray(item.skills)
            ? item.skills
            : typeof item.skills === "string"
            ? item.skills.split(",").map((s) => s.trim())
            : [];
          const matchSkills = skillsArr.some((s) => s.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchCategory && !matchLoc && !matchSkills) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "slots") return (b.slotsAvailable || 0) - (a.slotsAvailable || 0);
        if (sortBy === "points") return (b.points || 0) - (a.points || 0);
        if (sortBy === "hours") return (b.durationHours || 0) - (a.durationHours || 0);
        return 0;
      });
  }, [rawOpps, activeCategorySlug, formatFilter, search, sortBy]);

  const getApplicationForEvent = (oppId) =>
    applications.find(
      (app) =>
        (app.opportunityId === oppId || app.opportunityId?._id === oppId) &&
        app.status !== "Cancelled"
    );

  const totalOpenSlots = rawOpps.reduce(
    (acc, opp) => acc + (Number(opp.slotsAvailable) || 0),
    0
  );

  // Count per category
  const catCount = (slug) =>
    rawOpps.filter((o) => {
      const s = o.categorySlug || (o.category || "").toLowerCase().replace(/\s+/g, "-");
      return s === slug;
    }).length;

  // ─── Shared styles ──────────────────────────────────────────────────────────
  const heroGradient =
    currentCategory
      ? `linear-gradient(135deg, ${currentCategory.color}22 0%, #1E1B4B 60%)`
      : "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)";

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ═══ HERO (COMPACT, SHORT & PROPERLY ALIGNED) ═══════════════════════════════ */}
      <div
        style={{
          background: heroGradient,
          padding: "18px 28px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 6px 24px rgba(30,27,75,0.22)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          {/* Left Column: Title + Subtitle + Search */}
          <div style={{ flex: "1 1 380px", minWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <Link
                to="/opportunities"
                style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", textDecoration: "none", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                All Opportunities
              </Link>
              {currentCategory && (
                <>
                  <ChevronRight size={11} color="rgba(255,255,255,0.6)" />
                  <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{currentCategory.name}</span>
                </>
              )}
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
              }}
            >
              {currentCategory ? currentCategory.name : "Volunteer Opportunities"}
            </h1>
            <p
              style={{
                margin: "2px 0 10px",
                fontSize: 12.5,
                color: "rgba(255,255,255,0.72)",
                lineHeight: 1.4,
              }}
            >
              {currentCategory
                ? currentCategory.tagline
                : "Impactful volunteering drives across Tamil Nadu • Verified certificates & points"}
            </p>

            {/* Compact inline search bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#fff",
                borderRadius: 10,
                padding: "0 12px",
                maxWidth: 420,
                boxShadow: "0 3px 12px rgba(0,0,0,0.12)",
                gap: 8,
              }}
            >
              <Search size={15} color="#94A3B8" />
              <input
                type="text"
                placeholder="Search title, team, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  padding: "9px 0",
                  fontSize: 13,
                  color: "#1E293B",
                  background: "transparent",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    border: "none",
                    background: "#F1F5F9",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#64748B",
                    padding: 0,
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Right Column: 3 Stat Chips */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {[
              { label: "Active Opportunities", value: rawOpps.length, icon: <Sparkles size={14} color="#FCD34D" /> },
              { label: "Open Slots", value: totalOpenSlots, icon: <Users size={14} color="#6EE7B7" /> },
              { label: "Categories", value: CATEGORIES.length, icon: <LayoutGrid size={14} color="#93C5FD" /> },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 12,
                  padding: "8px 16px",
                  border: "1px solid rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.7)", marginTop: 1, fontWeight: 600 }}>
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CONTENT AREA ════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 48px" }}>

        {/* ─── CATEGORY NAVIGATION PILLS ──────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 4,
            marginBottom: 28,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {/* All pill */}
          <Link
            to="/opportunities"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              borderRadius: 99,
              textDecoration: "none",
              whiteSpace: "nowrap",
              fontSize: 13,
              fontWeight: 700,
              transition: "all 0.18s",
              flexShrink: 0,
              ...(activeCategorySlug === "all"
                ? {
                    background: "linear-gradient(135deg, #1E1B4B, #4338CA)",
                    color: "#fff",
                    boxShadow: "0 4px 14px rgba(67,56,202,0.35)",
                  }
                : {
                    background: "#fff",
                    color: "#475569",
                    border: "1.5px solid #E2E8F0",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }),
            }}
          >
            <LayoutGrid size={14} />
            All
            <span
              style={{
                background: activeCategorySlug === "all" ? "rgba(255,255,255,0.25)" : "#F1F5F9",
                color: activeCategorySlug === "all" ? "#fff" : "#64748B",
                borderRadius: 99,
                padding: "1px 8px",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {opportunities.length}
            </span>
          </Link>

          {CATEGORIES.map((cat) => {
            const count = catCount(cat.slug);
            const isActive = activeCategorySlug === cat.slug;
            return (
              <Link
                key={cat.slug}
                to={`/opportunities/${cat.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 16px",
                  borderRadius: 99,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "all 0.18s",
                  flexShrink: 0,
                  ...(isActive
                    ? {
                        background: cat.color,
                        color: cat.color === "#FFD629" || cat.color === "#F59E0B" ? "#1a1a1a" : "#fff",
                        boxShadow: `0 4px 14px ${cat.color}50`,
                      }
                    : {
                        background: "#fff",
                        color: "#475569",
                        border: "1.5px solid #E2E8F0",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                      }),
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = cat.bgColor;
                    e.currentTarget.style.color = cat.color;
                    e.currentTarget.style.borderColor = cat.color;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.color = "#475569";
                    e.currentTarget.style.borderColor = "#E2E8F0";
                  }
                }}
              >
                <CategoryIcon
                  name={cat.icon}
                  size={13}
                  color={
                    isActive
                      ? cat.color === "#FFD629" || cat.color === "#F59E0B"
                        ? "#1a1a1a"
                        : "#fff"
                      : cat.color
                  }
                />
                {cat.shortName}
                {count > 0 && (
                  <span
                    style={{
                      background: isActive ? "rgba(255,255,255,0.3)" : cat.bgColor,
                      color: isActive
                        ? cat.color === "#FFD629" || cat.color === "#F59E0B"
                          ? "#1a1a1a"
                          : "#fff"
                        : cat.color,
                      borderRadius: 99,
                      padding: "1px 7px",
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* ─── CATEGORY CARDS GRID (shown when no specific category or search) ─ */}
        {activeCategorySlug === "all" && !search && !formatFilter.match(/Online|Offline|Hybrid/) && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 18,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1E293B" }}>
                Browse by Category
              </h2>
              <span style={{ fontSize: 13, color: "#94A3B8" }}>
                {CATEGORIES.length} categories
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 18,
                marginBottom: 40,
              }}
            >
              {CATEGORIES.map((cat) => (
                <CategoryCard key={cat.slug} cat={cat} count={catCount(cat.slug)} />
              ))}
            </div>
            {/* Divider */}
            <div
              style={{
                borderTop: "1.5px dashed #E2E8F0",
                margin: "0 0 32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  background: "#F8FAFC",
                  padding: "4px 16px",
                  fontSize: 12,
                  color: "#94A3B8",
                  fontWeight: 600,
                  marginTop: -12,
                  borderRadius: 20,
                  border: "1px solid #E2E8F0",
                }}
              >
                All Opportunities
              </span>
            </div>
          </div>
        )}

        {/* ─── TOOLBAR ──────────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          {/* Results count */}
          <div style={{ flex: 1, fontSize: 13, color: "#64748B" }}>
            Showing{" "}
            <strong style={{ color: "#1E293B" }}>{filteredList.length}</strong>{" "}
            {filteredList.length === 1 ? "opportunity" : "opportunities"}
            {activeCategorySlug !== "all" && (
              <> in <strong style={{ color: currentCategory?.color }}>{currentCategory?.name}</strong></>
            )}
            {formatFilter !== "All" && <> · {formatFilter}</>}
          </div>

          {/* Filter icon */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#94A3B8", fontSize: 12 }}>
            <Filter size={13} /> Filters:
          </div>

          {/* Mode filter */}
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            style={{
              border: "1.5px solid #E2E8F0",
              borderRadius: 8,
              padding: "7px 12px",
              fontSize: 12.5,
              color: "#1E293B",
              background: "#fff",
              cursor: "pointer",
              outline: "none",
              fontWeight: 600,
            }}
          >
            <option value="All">All Modes</option>
            <option value="Offline">In-Person</option>
            <option value="Online">Online</option>
            <option value="Hybrid">Hybrid</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              border: "1.5px solid #E2E8F0",
              borderRadius: 8,
              padding: "7px 12px",
              fontSize: 12.5,
              color: "#1E293B",
              background: "#fff",
              cursor: "pointer",
              outline: "none",
              fontWeight: 600,
            }}
          >
            <option value="date">Sort: By Date</option>
            <option value="slots">Sort: Most Slots</option>
            <option value="hours">Sort: Most Hours</option>
            <option value="points">Sort: Most Points</option>
          </select>

          {/* View mode */}
          <div
            style={{
              display: "flex",
              border: "1.5px solid #E2E8F0",
              borderRadius: 8,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {[
              { mode: "grid", Icon: LayoutGrid },
              { mode: "list", Icon: List },
            ].map(({ mode, Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  border: "none",
                  background: viewMode === mode ? "#4338CA" : "transparent",
                  color: viewMode === mode ? "#fff" : "#64748B",
                  padding: "7px 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  transition: "all 0.15s",
                }}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>

        {/* ─── OPPORTUNITIES GRID / LIST ─────────────────────────────────────── */}
        {filteredList.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 24px",
              background: "#fff",
              borderRadius: 20,
              border: "1.5px dashed #E2E8F0",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <Search size={30} color="#94A3B8" />
            </div>
            <h3 style={{ margin: "0 0 8px", color: "#1E293B", fontSize: 18, fontWeight: 700 }}>
              No opportunities found
            </h3>
            <p style={{ margin: "0 0 24px", color: "#64748B", fontSize: 14 }}>
              Try different search terms or clear your filters.
            </p>
            <button
              onClick={() => { setSearch(""); setFormatFilter("All"); }}
              style={{
                background: "linear-gradient(135deg, #1E1B4B, #4338CA)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 24px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 20,
            }}
          >
            {filteredList.map((opp) => {
              const oppId = opp.id || opp._id;
              const app = getApplicationForEvent(oppId);
              return (
                <OppCard
                  key={oppId}
                  opp={opp}
                  applied={Boolean(app)}
                  app={app}
                  bookmarked={(bookmarks || []).includes(oppId)}
                  toggleBookmark={toggleBookmark}
                  setPreviewOpp={setPreviewOpp}
                  openQRAttendance={openQRAttendance}
                />
              );
            })}
          </div>
        ) : (
          /* ── LIST VIEW ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredList.map((opp) => {
              const oppId = opp.id || opp._id;
              const app = getApplicationForEvent(oppId);
              const applied = Boolean(app);
              const bookmarked = (bookmarks || []).includes(oppId);
              const catObj = CATEGORIES.find((c) => c.slug === opp.categorySlug);
              const catColor = catObj?.color || "#4F46E5";
              const catBg = catObj?.bgColor || "#EEF2FF";
              const modeStyle = MODE_STYLES[opp.mode] || MODE_STYLES.Offline;
              return (
                <div
                  key={oppId}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    border: applied ? `1.5px solid ${catColor}50` : "1.5px solid #F1F5F9",
                    display: "flex",
                    gap: 0,
                    overflow: "hidden",
                    boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.06)"; }}
                >
                  {/* Colored left accent */}
                  <div style={{ width: 5, background: catColor, flexShrink: 0 }} />

                  {/* Thumbnail */}
                  <div style={{ width: 100, flexShrink: 0, position: "relative" }}>
                    <img
                      src={opp.image}
                      alt={opp.title}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, padding: "14px 16px", minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ background: catBg, color: catColor, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                        {opp.category}
                      </span>
                      <span style={{ background: modeStyle.bg, color: modeStyle.color, borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>
                        {opp.mode}
                      </span>
                      <span style={{ background: "#FEF9C3", color: "#713F12", borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>
                        +{opp.points}pts
                      </span>
                      <span style={{ background: "#DBEAFE", color: "#1D4ED8", borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>
                        {opp.durationHours}h
                      </span>
                    </div>
                    <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#1E293B", lineHeight: 1.3 }}>
                      <Link to={`/opportunities/${oppId}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {opp.title}
                      </Link>
                    </h3>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={11} color="#4F46E5" /> {opp.date}
                      </span>
                      <span style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={11} color="#EF4444" /> {opp.location}
                      </span>
                      <span style={{ fontSize: 12, color: opp.slotsAvailable <= 3 ? "#EF4444" : "#10B981", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <Users size={11} /> {opp.slotsAvailable} slots
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 16px", borderLeft: "1px solid #F1F5F9" }}>
                    <button
                      onClick={() => toggleBookmark(oppId)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: bookmarked ? "#F59E0B" : "#94A3B8" }}
                    >
                      <Bookmark size={16} fill={bookmarked ? "#F59E0B" : "none"} />
                    </button>
                    <button
                      onClick={() => setPreviewOpp(opp)}
                      style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 7, padding: "5px 10px", fontSize: 11, fontWeight: 600, color: "#475569", cursor: "pointer" }}
                    >
                      <Eye size={12} />
                    </button>
                    {applied ? (
                      <span style={{ background: "#DCFCE7", color: "#166534", borderRadius: 7, padding: "5px 10px", fontSize: 11, fontWeight: 700 }}>
                        {app?.status}
                      </span>
                    ) : (
                      <Link
                        to={`/opportunities/${oppId}/apply`}
                        style={{
                          background: catColor,
                          color: catColor === "#FFD629" || catColor === "#F59E0B" ? "#1a1a1a" : "#fff",
                          borderRadius: 7,
                          padding: "6px 12px",
                          fontSize: 11.5,
                          fontWeight: 700,
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Apply
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ QUICK PREVIEW MODAL ═════════════════════════════════════════════════ */}
      {previewOpp && (
        <div
          onClick={() => setPreviewOpp(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(6px)",
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
              background: "#fff",
              borderRadius: 24,
              width: "100%",
              maxWidth: 520,
              maxHeight: "88vh",
              overflowY: "auto",
              boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal image header */}
            <div style={{ position: "relative", height: 180, flexShrink: 0 }}>
              <img
                src={previewOpp.image}
                alt={previewOpp.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%)",
                }}
              />
              <button
                onClick={() => setPreviewOpp(null)}
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(255,255,255,0.9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                <X size={16} color="#1E293B" />
              </button>
              {previewOpp.featured && (
                <span
                  style={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    background: "linear-gradient(90deg,#F59E0B,#EF4444)",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 20,
                  }}
                >
                  ★ FEATURED
                </span>
              )}
              <div
                style={{
                  position: "absolute",
                  bottom: 14,
                  left: 16,
                  display: "flex",
                  gap: 7,
                }}
              >
                <span
                  style={{
                    background: "#EAB308",
                    color: "#1a1a1a",
                    borderRadius: 10,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  +{previewOpp.points}pts
                </span>
                <span
                  style={{
                    background: "rgba(59,130,246,0.9)",
                    color: "#fff",
                    borderRadius: 10,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {previewOpp.durationHours}h
                </span>
                <span
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    color: "#1E293B",
                    borderRadius: 10,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {previewOpp.mode}
                </span>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: "20px 24px 0" }}>
              {/* Category */}
              {(() => {
                const catObj = CATEGORIES.find((c) => c.slug === previewOpp.categorySlug);
                const cc = catObj?.color || "#4F46E5";
                const cb = catObj?.bgColor || "#EEF2FF";
                return (
                  <span
                    style={{
                      background: cb,
                      color: cc,
                      borderRadius: 20,
                      padding: "3px 12px",
                      fontSize: 11.5,
                      fontWeight: 700,
                    }}
                  >
                    {previewOpp.category}
                  </span>
                );
              })()}
              <h2
                style={{
                  margin: "10px 0 6px",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#1E293B",
                  lineHeight: 1.3,
                }}
              >
                {previewOpp.title}
              </h2>
              <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "#64748B", lineHeight: 1.6 }}>
                {previewOpp.description}
              </p>

              {/* Fact grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                {[
                  { icon: <Calendar size={15} color="#4F46E5" />, label: "Date", val: previewOpp.date },
                  { icon: <Clock size={15} color="#D97706" />, label: "Time", val: previewOpp.time },
                  { icon: <ShieldCheck size={15} color="#16A34A" />, label: "Hours", val: `${previewOpp.durationHours}h verified` },
                  { icon: <Users size={15} color="#EC4899" />, label: "Slots Left", val: `${previewOpp.slotsAvailable} slots` },
                ].map((f, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#F8FAFC",
                      borderRadius: 10,
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    {f.icon}
                    <div>
                      <div style={{ fontSize: 10.5, color: "#94A3B8", fontWeight: 600, marginBottom: 1 }}>
                        {f.label}
                      </div>
                      <div style={{ fontSize: 12.5, color: "#1E293B", fontWeight: 700 }}>{f.val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Location */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#F8FAFC",
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginBottom: 16,
                }}
              >
                <MapPin size={15} color="#EF4444" />
                <span style={{ fontSize: 13, color: "#1E293B", fontWeight: 600 }}>
                  {previewOpp.location}
                </span>
              </div>

              {/* Teams */}
              {previewOpp.teams && previewOpp.teams.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: "0 0 7px", fontSize: 12, fontWeight: 700, color: "#475569" }}>
                    Available Teams
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {previewOpp.teams.map((t, i) => (
                      <span
                        key={i}
                        style={{
                          background: "#F0F4FF",
                          color: "#4338CA",
                          borderRadius: 7,
                          padding: "4px 10px",
                          fontSize: 11.5,
                          fontWeight: 600,
                          border: "1px solid #C7D2FE",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Objectives */}
              {previewOpp.objectives && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: "0 0 7px", fontSize: 12, fontWeight: 700, color: "#475569" }}>
                    Key Objectives
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {(Array.isArray(previewOpp.objectives) ? previewOpp.objectives : [previewOpp.objectives]).map(
                      (obj, i) => (
                        <li key={i} style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.6, marginBottom: 3 }}>
                          {obj}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div
              style={{
                padding: "16px 24px 20px",
                borderTop: "1px solid #F1F5F9",
                display: "flex",
                gap: 10,
                marginTop: 8,
              }}
            >
              <Link
                to={`/opportunities/${previewOpp.id || previewOpp._id}`}
                onClick={() => setPreviewOpp(null)}
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "#F8FAFC",
                  color: "#1E293B",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "11px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Full Details →
              </Link>
              <Link
                to={`/opportunities/${previewOpp.id || previewOpp._id}/apply`}
                onClick={() => setPreviewOpp(null)}
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "linear-gradient(135deg, #1E1B4B, #4338CA)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "11px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(67,56,202,0.35)",
                }}
              >
                Register Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
