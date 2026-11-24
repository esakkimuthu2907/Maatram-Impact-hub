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
  CalendarX,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { CATEGORIES } from "../../data/mockData";

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

// Category page URL. Must match the route in App.jsx:
// <Route path="/opportunities/category/:categorySlug" element={<OpportunitiesPage />} />
const categoryPath = (slug) => `/opportunities/category/${slug}`;

// ─── Mode badge colors ────────────────────────────────────────────────────────
const MODE_STYLES = {
  Online: { bg: "#DCFCE7", color: "#166534", dot: "#22C55E" },
  Offline: { bg: "#FEF9C3", color: "#713F12", dot: "#EAB308" },
  Hybrid: { bg: "#EDE9FE", color: "#4C1D95", dot: "#8B5CF6" },
};

// ─── Category matching ────────────────────────────────────────────────────────
// An event posted by an admin is placed in a category using its `categorySlug`.
// If that is missing, we fall back to matching the category name/short name.
const slugify = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function resolveCategorySlug(opp) {
  if (opp.categorySlug && CATEGORIES.some((c) => c.slug === opp.categorySlug)) {
    return opp.categorySlug;
  }
  const label = (opp.category || "").trim().toLowerCase();
  const found = CATEGORIES.find(
    (c) =>
      (c.name || "").toLowerCase() === label ||
      (c.shortName || "").toLowerCase() === label ||
      slugify(c.name) === slugify(opp.category)
  );
  return found ? found.slug : opp.categorySlug || slugify(opp.category);
}

// Active pill in the top category bar: same yellow for every category
const PILL_ACTIVE_BG = "#FFD629";
const PILL_ACTIVE_TEXT = "#1a1a1a";

const darkText = (color) =>
  color === "#FFD629" || color === "#F59E0B" ? "#1a1a1a" : "#fff";

// ─── Category card component (All page) ──────────────────────────────────────
function CategoryCard({ cat, count, className, style }) {
  return (
    <Link
      to={categoryPath(cat.slug)}
      className={className}
      style={{
        minWidth: 0,
        ...style,
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
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1E293B", lineHeight: 1.3 }}>
          {cat.name}
        </h3>
        <p style={{ margin: "0 0 4px", fontSize: 11.5, fontWeight: 600, color: cat.color, letterSpacing: "0.02em" }}>
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: cat.color, display: "flex", alignItems: "center", gap: 4 }}>
            Explore <ChevronRight size={14} />
          </span>
          {count === 0 && <span style={{ fontSize: 11, color: "#94A3B8" }}>Coming soon</span>}
        </div>
      </div>
    </Link>
  );
}

// ─── Empty state (used inside sections and category pages) ───────────────────
function NoOpportunities({ compact = false, message, children }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: compact ? "26px 20px" : "64px 24px",
        background: "#fff",
        borderRadius: 16,
        border: "1.5px dashed #E2E8F0",
      }}
    >
      <div
        style={{
          width: compact ? 44 : 64,
          height: compact ? 44 : 64,
          borderRadius: "50%",
          background: "#F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: compact ? "0 auto 10px" : "0 auto 16px",
        }}
      >
        <CalendarX size={compact ? 20 : 28} color="#94A3B8" />
      </div>
      <h3 style={{ margin: "0 0 4px", color: "#1E293B", fontSize: compact ? 14.5 : 18, fontWeight: 700 }}>
        No opportunities
      </h3>
      <p style={{ margin: 0, color: "#64748B", fontSize: compact ? 12.5 : 14 }}>
        {message || "No events have been posted in this category yet."}
      </p>
      {children}
    </div>
  );
}

// ─── Opportunity card component ───────────────────────────────────────────────
function OppCard({ opp, applied, app, bookmarked, toggleBookmark, setPreviewOpp, openQRAttendance }) {
  const oppId = opp.id || opp._id;
  const isApproved = app?.status === "Approved";
  const isCompleted = app?.status === "Completed" || opp.status === "Completed";
  const modeStyle = MODE_STYLES[opp.mode] || MODE_STYLES.Offline;

  const needed = Number(opp.volunteersNeeded) || 10;
  const available = Number(opp.slotsAvailable) || 0;
  const filled = Math.max(0, needed - available);
  const fillRatio = Math.min(100, Math.round((filled / needed) * 100));

  const catObj = CATEGORIES.find((c) => c.slug === resolveCategorySlug(opp));
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
      <div style={{ position: "relative", height: 150, flexShrink: 0 }}>
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

        {/* Mode badge (top-left) */}
        <div
          style={{
            position: "absolute",
            top: opp.featured ? 42 : 12,
            left: 12,
            background: "rgba(255,255,255,0.96)",
            color: modeStyle.color,
            border: `1.5px solid ${modeStyle.dot}`,
            borderRadius: 20,
            padding: "4px 11px",
            fontSize: 11.5,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 3px 10px rgba(0,0,0,0.22)",
            zIndex: 2,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: modeStyle.dot,
              display: "inline-block",
              boxShadow: `0 0 0 3px ${modeStyle.dot}33`,
            }}
          />
          {opp.mode || "Offline"}
        </div>

        {/* Completed badge (top-right): light green pill */}
        {isCompleted && (
          <div
            title="Completed"
            aria-label="Completed"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              background: "#DCFCE7",
              color: "#15803D",
              border: "1px solid #86EFAC",
              boxShadow: "0 3px 10px rgba(0,0,0,0.18)",
              zIndex: 2,
            }}
          >
            ✅ Completed
          </div>
        )}

        {/* Application status badge (top-right) */}
        {applied && (() => {
          const st = app?.status;
          if (st === "Completed") return null; // shown by the Completed badge below
          const isGreen = st === "Approved";
          const isYellow = st === "Pending";
          const bg = isGreen ? "#ECFDF5" : isYellow ? "#FEF9C3" : "#F1F5F9";
          const fg = isGreen ? "#22A06B" : isYellow ? "#713F12" : "#475569";
          const bd = isGreen ? "#A7F3D0" : isYellow ? "#FDE047" : "#CBD5E1";
          return (
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: bg,
                color: fg,
                border: `1.5px solid ${bd}`,
                borderRadius: 20,
                padding: "4px 11px",
                fontSize: 11.5,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 5,
                boxShadow: "0 3px 10px rgba(0,0,0,0.18)",
                zIndex: 2,
              }}
            >
              <CheckCircle2 size={12} /> {st}
            </div>
          );
        })()}

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
              border: `1.5px solid ${catColor}40`,
              borderRadius: 20,
              padding: "5px 13px",
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: "0.02em",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {catObj?.icon && <CategoryIcon name={catObj.icon} size={13} color={catColor} />}
            {opp.category || catObj?.name}
          </span>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
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
          <div style={{ height: 5, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${fillRatio}%`,
                borderRadius: 99,
                background: available <= 2 ? "#EF4444" : available <= 5 ? "#F59E0B" : "#10B981",
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
          {/* Preview: yellow */}
          <button
            onClick={() => setPreviewOpp(opp)}
            style={{
              background: "#FFD629",
              border: "none",
              borderRadius: 8,
              padding: "7px 12px",
              fontSize: 11.5,
              fontWeight: 700,
              color: "#1a1a1a",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#FCC531"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#FFD629"; }}
          >
            <Eye size={13} /> Preview
          </button>
          {/* Details: green */}
          <Link
            to={`/opportunities/${oppId}`}
            style={{
              background: "linear-gradient(135deg, #1E1B4B, #4338CA)",
              border: "none",
              borderRadius: 8,
              padding: "7px 12px",
              fontSize: 11.5,
              fontWeight: 700,
              color: "#fff",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 4,
              boxShadow: "0 3px 10px rgba(67,56,202,0.35)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
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
                color: darkText(catColor),
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

// ─── Opportunity list-row (list view) ─────────────────────────────────────────
function OppListRow({ opp, app, bookmarked, toggleBookmark, setPreviewOpp }) {
  const oppId = opp.id || opp._id;
  const applied = Boolean(app);
  const catObj = CATEGORIES.find((c) => c.slug === resolveCategorySlug(opp));
  const catColor = catObj?.color || "#4F46E5";
  const catBg = catObj?.bgColor || "#EEF2FF";
  const modeStyle = MODE_STYLES[opp.mode] || MODE_STYLES.Offline;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: applied ? `1.5px solid ${catColor}50` : "1.5px solid #E2E8F0",
        display: "flex",
        overflow: "hidden",
        boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.05)"; }}
    >
      <div style={{ width: 5, background: catColor, flexShrink: 0 }} />

      <div style={{ width: 100, flexShrink: 0, position: "relative" }}>
        <img
          src={opp.image}
          alt={opp.title}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      <div style={{ flex: 1, padding: "14px 16px", minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ background: catBg, color: catColor, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
            {opp.category || catObj?.name}
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
              color: darkText(catColor),
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
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OpportunitiesPage() {
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const {
    user,
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

  // Filter raw opportunities by student's zone and role targeting
  const rawOpps = useMemo(() => {
    const list = opportunities || [];
    if (!user || user.role === "admin") return list;

    const userZone = user.zone || "Zone 1";
    const isStudent = user.role === "student" || user.role === "volunteer";
    const isAlumni = user.role === "alumni" || user.role === "Alumni";

    return list.filter((opp) => {
      // 1. Zone filter: if event has targetZones specified, user's zone must be in it
      if (Array.isArray(opp.targetZones) && opp.targetZones.length > 0) {
        if (!opp.targetZones.includes(userZone)) return false;
      }
      // 2. Audience filter: Students, Alumni, or Both
      const aud = opp.targetAudience || "Both";
      if (aud === "Both") return true;
      if (isStudent && aud === "Students") return true;
      if (isAlumni && aud === "Alumni") return true;
      return false;
    });
  }, [opportunities, user]);

  // Apply search + mode filter + sort to any list of events
  const applyFilters = (list) => {
    const q = search.trim().toLowerCase();
    return list
      .filter((item) => {
        if (formatFilter !== "All" && item.mode !== formatFilter) return false;
        if (q) {
          const skillsArr = Array.isArray(item.skills)
            ? item.skills
            : typeof item.skills === "string"
              ? item.skills.split(",").map((s) => s.trim())
              : [];
          const hit =
            (item.title || "").toLowerCase().includes(q) ||
            (item.description || "").toLowerCase().includes(q) ||
            (item.category || "").toLowerCase().includes(q) ||
            (item.location || "").toLowerCase().includes(q) ||
            skillsArr.some((s) => s.toLowerCase().includes(q));
          if (!hit) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "slots") return (b.slotsAvailable || 0) - (a.slotsAvailable || 0);
        if (sortBy === "points") return (b.points || 0) - (a.points || 0);
        if (sortBy === "hours") return (b.durationHours || 0) - (a.durationHours || 0);
        return 0;
      });
  };

  // Events of one category (before filters)
  const eventsOfCategory = (slug) =>
    rawOpps.filter((o) => resolveCategorySlug(o) === slug);

  const catCount = (slug) => eventsOfCategory(slug).length;

  // Flat list: used on a category page, or on the All page while searching/filtering
  const filteredList = useMemo(() => {
    const base =
      activeCategorySlug === "all"
        ? rawOpps
        : rawOpps.filter((o) => resolveCategorySlug(o) === activeCategorySlug);
    return applyFilters(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const isFiltering = Boolean(search.trim()) || formatFilter !== "All";
  const showSections = activeCategorySlug === "all" && !isFiltering;

  // Render a list of events as grid cards or list rows
  const renderOpps = (list) =>
    viewMode === "grid" ? (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {list.map((opp) => {
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
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {list.map((opp) => {
          const oppId = opp.id || opp._id;
          return (
            <OppListRow
              key={oppId}
              opp={opp}
              app={getApplicationForEvent(oppId)}
              bookmarked={(bookmarks || []).includes(oppId)}
              toggleBookmark={toggleBookmark}
              setPreviewOpp={setPreviewOpp}
            />
          );
        })}
      </div>
    );

  // ─── Shared styles ──────────────────────────────────────────────────────────
  const selectStyle = {
    border: "1.5px solid #E2E8F0",
    borderRadius: 8,
    padding: "7px 12px",
    fontSize: 12.5,
    color: "#1E293B",
    background: "#fff",
    cursor: "pointer",
    outline: "none",
    fontWeight: 600,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ═══ HERO (Maatram Connect style banner) ═══════════════════════════════ */}
      <div
        style={{
          background: "linear-gradient(135deg, #FFD629 0%, #FCC531 60%, #F9B72A 100%)",
          position: "relative",
          overflow: "hidden",
          borderRadius: 0,
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            boxSizing: "border-box",
            padding: "26px 36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          {/* Left: title (small icon beside it) + tagline + search */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, flex: "1 1 420px", minWidth: 280 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#333333",
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {currentCategory ? (
                  <CategoryIcon name={currentCategory.icon} size={26} color="#333333" />
                ) : (
                  <HeartHandshake size={26} color="#333333" strokeWidth={2.4} />
                )}
                {currentCategory ? currentCategory.name : "Volunteer Opportunities"}
              </h1>

              {currentCategory && (
                <p style={{ margin: "4px 0 0", fontSize: 14, color: "#4A4A4A", fontWeight: 600, lineHeight: 1.4 }}>
                  {currentCategory.tagline}
                </p>
              )}

              {/* Search */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#fff",
                  borderRadius: 10,
                  padding: "0 12px",
                  maxWidth: 420,
                  marginTop: 12,
                  boxShadow: "0 3px 12px rgba(120,70,0,0.18)",
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
                    padding: "10px 0",
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
          </div>

          {/* Right: transparent glass stats panel */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.4)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.7)",
              borderRadius: 16,
              padding: "14px 6px",
              boxShadow: "0 4px 16px rgba(120,70,0,0.12)",
            }}
          >
            {[
              { label: "Active Opportunities", value: rawOpps.length },
              { label: "Open Slots", value: totalOpenSlots },
              { label: "Categories", value: CATEGORIES.length },
            ].map((st, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  padding: "0 22px",
                  borderLeft: i === 0 ? "none" : "1px solid rgba(0,0,0,0.18)",
                }}
              >
                <div style={{ fontSize: 26, fontWeight: 800, color: "#333333", lineHeight: 1.1 }}>{st.value}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#4A4A4A",
                    marginTop: 4,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {st.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CONTENT AREA ════════════════════════════════════════════════════════ */}
      <div style={{ width: "100%", boxSizing: "border-box", padding: "24px 36px 56px" }}>

        {/* ─── CATEGORY NAVIGATION PILLS (every category page is one click away) ─ */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <Link
            to="/opportunities"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 16px",
              borderRadius: 99,
              textDecoration: "none",
              whiteSpace: "nowrap",
              fontSize: 13,
              fontWeight: 700,
              transition: "all 0.18s",
              flexShrink: 0,
              ...(activeCategorySlug === "all"
                ? {
                  background: PILL_ACTIVE_BG,
                  color: PILL_ACTIVE_TEXT,
                  boxShadow: "0 4px 14px rgba(255,214,41,0.55)",
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
                background: activeCategorySlug === "all" ? "rgba(0,0,0,0.12)" : "#F1F5F9",
                color: activeCategorySlug === "all" ? PILL_ACTIVE_TEXT : "#64748B",
                borderRadius: 99,
                padding: "1px 8px",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {rawOpps.length}
            </span>
          </Link>

          {CATEGORIES.map((cat) => {
            const count = catCount(cat.slug);
            const isActive = activeCategorySlug === cat.slug;
            return (
              <Link
                key={cat.slug}
                to={categoryPath(cat.slug)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 16px",
                  borderRadius: 99,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "all 0.18s",
                  flexShrink: 0,
                  ...(isActive
                    ? {
                      background: PILL_ACTIVE_BG,
                      color: PILL_ACTIVE_TEXT,
                      boxShadow: "0 4px 14px rgba(255,214,41,0.55)",
                    }
                    : {
                      background: "#fff",
                      color: "#475569",
                      border: "1.5px solid #E2E8F0",
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
                  color={isActive ? PILL_ACTIVE_TEXT : cat.color}
                />
                {cat.name}
                {count > 0 && (
                  <span
                    style={{
                      background: isActive ? "rgba(0,0,0,0.12)" : cat.bgColor,
                      color: isActive ? PILL_ACTIVE_TEXT : cat.color,
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

        {/* ─── SMALL CATEGORY CARDS (All page only) ───────────────────────────── */}
        {showSections && (
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1E293B" }}>
                Browse by Category
              </h2>
              <span style={{ fontSize: 13, color: "#94A3B8" }}>{CATEGORIES.length} categories</span>
            </div>
            <style>{`
              .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
              .cat-grid > .cat-item { grid-column: auto; }
              @media (max-width: 1000px) { .cat-grid { grid-template-columns: repeat(2, 1fr); } }
              @media (max-width: 560px)  { .cat-grid { grid-template-columns: 1fr; } }
            `}</style>
            <div className="cat-grid">
              {CATEGORIES.map((cat) => (
                <CategoryCard
                  key={cat.slug}
                  cat={cat}
                  count={catCount(cat.slug)}
                  className="cat-item"
                />
              ))}
            </div>
          </div>
        )}

        {showSections && (
          <div style={{ borderTop: "1.5px dashed #E2E8F0", margin: "0 0 28px", display: "flex", justifyContent: "center" }}>
            <span
              style={{
                background: "#fff",
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
          <div style={{ flex: 1, fontSize: 13, color: "#64748B" }}>
            {(
              <>
                Showing <strong style={{ color: "#1E293B" }}>{filteredList.length}</strong>{" "}
                {filteredList.length === 1 ? "opportunity" : "opportunities"}
                {activeCategorySlug !== "all" && (
                  <> in <strong style={{ color: currentCategory?.color }}>{currentCategory?.name}</strong></>
                )}
                {formatFilter !== "All" && <> · {formatFilter}</>}
              </>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#94A3B8", fontSize: 12 }}>
            <Filter size={13} /> Filters:
          </div>

          <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)} style={selectStyle}>
            <option value="All">All Modes</option>
            <option value="Offline">In-Person</option>
            <option value="Online">Online</option>
            <option value="Hybrid">Hybrid</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
            <option value="date">Sort: By Date</option>
            <option value="slots">Sort: Most Slots</option>
            <option value="hours">Sort: Most Hours</option>
            <option value="points">Sort: Most Points</option>
          </select>

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

        {/* ─── OPPORTUNITIES (all events on All page, one category on category page) ─── */}
        {filteredList.length === 0 ? (
          /* ─── Category page / search with no results ─── */
          <NoOpportunities
            message={
              activeCategorySlug !== "all" && !isFiltering
                ? `No events have been posted in ${currentCategory?.name} yet. Please check back soon.`
                : isFiltering
                  ? "Try different search terms or clear your filters."
                  : "No events have been posted yet. Please check back soon."
            }
          >
            <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {isFiltering && (
                <button
                  onClick={() => { setSearch(""); setFormatFilter("All"); }}
                  style={{
                    background: "linear-gradient(135deg, #1E1B4B, #4338CA)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 22px",
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Reset Filters
                </button>
              )}
              {activeCategorySlug !== "all" && (
                <Link
                  to="/opportunities"
                  style={{
                    background: PILL_ACTIVE_BG,
                    color: PILL_ACTIVE_TEXT,
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 22px",
                    fontSize: 13.5,
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(255,214,41,0.55)",
                  }}
                >
                  Browse all categories
                </Link>
              )}
            </div>
          </NoOpportunities>
        ) : (
          renderOpps(filteredList)
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
              <div style={{ position: "absolute", bottom: 14, left: 16, display: "flex", gap: 7 }}>
                <span style={{ background: "#EAB308", color: "#1a1a1a", borderRadius: 10, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                  +{previewOpp.points}pts
                </span>
                <span style={{ background: "rgba(59,130,246,0.9)", color: "#fff", borderRadius: 10, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                  {previewOpp.durationHours}h
                </span>
                <span style={{ background: "rgba(255,255,255,0.9)", color: "#1E293B", borderRadius: 10, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                  {previewOpp.mode}
                </span>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: "20px 24px 0" }}>
              {(() => {
                const catObj = CATEGORIES.find((c) => c.slug === resolveCategorySlug(previewOpp));
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
                    {previewOpp.category || catObj?.name}
                  </span>
                );
              })()}
              <h2 style={{ margin: "10px 0 6px", fontSize: 18, fontWeight: 800, color: "#1E293B", lineHeight: 1.3 }}>
                {previewOpp.title}
              </h2>
              <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "#64748B", lineHeight: 1.6 }}>
                {previewOpp.description}
              </p>

              {/* Fact grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
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
                      <div style={{ fontSize: 10.5, color: "#94A3B8", fontWeight: 600, marginBottom: 1 }}>{f.label}</div>
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
                <span style={{ fontSize: 13, color: "#1E293B", fontWeight: 600 }}>{previewOpp.location}</span>
              </div>

              {/* Teams */}
              {previewOpp.teams && previewOpp.teams.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: "0 0 7px", fontSize: 12, fontWeight: 700, color: "#475569" }}>Available Teams</p>
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
            </div>

            {/* Modal footer */}
            <div style={{ padding: "16px 24px 20px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 10, marginTop: 8 }}>
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