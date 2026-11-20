import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock,
  Calendar,
  Award,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Users,
  Compass,
  ShieldCheck,
  Zap,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  BarChart2,
  ExternalLink,
  BookOpen,
  Trophy,
  Shield,
  Crown,
  Star,
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


// ─────────────────────────────────────────────────────────────────────────────
// Working student calendar: month navigation, event dots, day selection,
// day-detail list. Uses registered applications + open drives.
// ─────────────────────────────────────────────────────────────────────────────
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_KINDS = {
  completed: { label: "Completed", color: "#16A34A" },
  approved: { label: "Approved", color: "#2563EB" },
  pending: { label: "Pending review", color: "#F59E0B" },
  open: { label: "Open drive", color: "#8B5CF6" },
};

const parseEventDate = (value) => {
  if (!value) return null;
  let d;
  if (value instanceof Date) {
    d = value;
  } else {
    const str = String(value).trim();
    const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (iso) d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    else if (dmy) d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    else d = new Date(str);
  }
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const dateKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function DashboardCalendar({ events = [], applications = [], onSelectEvent }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate())
  );

  // Map: day key -> list of events happening that day
  const eventsByDay = useMemo(() => {
    const map = {};
    const seen = new Set();

    const push = (item) => {
      const d = parseEventDate(item.date);
      if (!d) return;
      const k = dateKey(d);
      (map[k] = map[k] || []).push(item);
    };

    (applications || []).forEach((app) => {
      if (!app || app.status === "Cancelled" || app.status === "Rejected") return;
      const ev = app.opportunity || app.event || {};
      const id = app.opportunityId || app.eventId || ev._id || ev.id || null;
      const title = app.opportunityTitle || ev.title || "Community Drive";
      const done =
        app.status === "Completed" ||
        Boolean(app.pointsAwarded && app.pointsAwarded > 0) ||
        Boolean(app.certificateId) ||
        Boolean(app.completedAt);
      const kind = done ? "completed" : app.status === "Approved" ? "approved" : "pending";

      if (id) seen.add(String(id));
      seen.add(title.toLowerCase());
      push({ id, title, date: app.eventDate || ev.date, kind });
    });

    (events || []).forEach((opp) => {
      if (!opp) return;
      const id = opp.id || opp._id || null;
      const title = opp.title || "Volunteering Drive";
      if ((id && seen.has(String(id))) || seen.has(title.toLowerCase())) return;
      push({ id, title, date: opp.date, kind: "open" });
    });

    return map;
  }, [events, applications]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));

  const goMonth = (delta) => setViewDate(new Date(year, month + delta, 1));
  const goToday = () => {
    const t = new Date();
    setViewDate(new Date(t.getFullYear(), t.getMonth(), 1));
    setSelectedDate(new Date(t.getFullYear(), t.getMonth(), t.getDate()));
  };

  const selectedEvents = eventsByDay[dateKey(selectedDate)] || [];
  const todayKey = dateKey(today);
  const selectedKey = dateKey(selectedDate);

  const navBtn = {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "1.5px solid #E2E8F0",
    background: "#FFFFFF",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#0F172A",
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1,
  };

  return (
    <div>
      {/* Month header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <strong style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>
          {viewDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </strong>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={goToday}
            style={{
              padding: "7px 14px",
              borderRadius: 10,
              border: "1.5px solid #FDE68A",
              background: "#FFFBEB",
              color: "#92400E",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Today
          </button>
          <button type="button" aria-label="Previous month" onClick={() => goMonth(-1)} style={navBtn}>
            ‹
          </button>
          <button type="button" aria-label="Next month" onClick={() => goMonth(1)} style={navBtn}>
            ›
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {WEEKDAY_LABELS.map((w) => (
          <div
            key={w}
            style={{
              textAlign: "center",
              fontSize: 11.5,
              fontWeight: 700,
              color: "#64748B",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              padding: "6px 0",
            }}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`blank-${i}`} />;
          const k = dateKey(d);
          const dayEvents = eventsByDay[k] || [];
          // Requests (completed / approved / pending) fill the date as a coloured circle
          const fillKind = ["completed", "approved", "pending"].find((kind) =>
            dayEvents.some((e) => e.kind === kind)
          );
          const fillColor = fillKind ? EVENT_KINDS[fillKind].color : null;
          const hasOpen = dayEvents.some((e) => e.kind === "open");
          const isToday = k === todayKey;
          const isSelected = k === selectedKey;

          return (
            <button
              key={k}
              type="button"
              onClick={() => setSelectedDate(d)}
              aria-label={`${d.toDateString()}${dayEvents.length ? `, ${dayEvents.length} event(s)` : ""}`}
              aria-pressed={isSelected}
              style={{
                position: "relative",
                height: 46,
                borderRadius: 12,
                border: isSelected ? "1.5px solid #0F172A" : "1.5px solid transparent",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: fillColor || "transparent",
                  color: fillColor ? "#FFFFFF" : "#0F172A",
                  fontSize: 13.5,
                  fontWeight: fillColor || isToday ? 800 : 600,
                  outline: isToday ? "2px solid #FFD629" : "none",
                  outlineOffset: 1,
                }}
              >
                {d.getDate()}
              </span>
              {hasOpen && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 2,
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: EVENT_KINDS.open.color,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 14 }}>
        {Object.values(EVENT_KINDS).map((kd) => (
          <span
            key={kd.label}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#64748B", fontWeight: 600 }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: kd.color }} />
            {kd.label}
          </span>
        ))}
      </div>

      {/* Selected day details */}
      <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>
          {selectedDate.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>

        {selectedEvents.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "#94A3B8" }}>
            No events on this day.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {selectedEvents.map((ev, idx) => (
              <button
                key={`${ev.id || ev.title}-${idx}`}
                type="button"
                onClick={() => onSelectEvent?.(ev)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  textAlign: "left",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                  borderLeft: `4px solid ${EVENT_KINDS[ev.kind].color}`,
                  background: "#FFFFFF",
                  cursor: ev.id ? "pointer" : "default",
                }}
              >
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                  {ev.title}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: EVENT_KINDS[ev.kind].color, whiteSpace: "nowrap" }}>
                  {EVENT_KINDS[ev.kind].label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Upcoming Events carousel — rich opportunity cards
// (mode + status badges, points/hours chips, availability bar, Preview /
//  My Application actions)
// ─────────────────────────────────────────────────────────────────────────────
function UpcomingEventsCarousel({
  events = [],
  applications = [],
  onRegister,
  onViewDetails,
  onMyApplication,
}) {
  const scrollRef = useRef(null);
  const scrollByCards = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 412, behavior: "smooth" });
  };

  const arrowBtn = {
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: "1.5px solid #E2E8F0",
    background: "#FFFFFF",
    color: "#0F172A",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 12 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 28,
            fontWeight: 800,
            color: "#0F172A",
          }}
        >
          Upcoming Events
        </h2>
        {events.length > 1 && (
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" aria-label="Scroll left" onClick={() => scrollByCards(-1)} style={arrowBtn}>
              <ChevronLeft size={18} />
            </button>
            <button type="button" aria-label="Scroll right" onClick={() => scrollByCards(1)} style={arrowBtn}>
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div style={{ padding: "36px 20px", textAlign: "center", color: "#64748B", border: "2px dashed #E2E8F0", borderRadius: 20 }}>
          No upcoming events right now. Completed events are available in History.
        </div>
      ) : (
        <div
          ref={scrollRef}
          style={{
            display: "flex",
            gap: 24,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            padding: "6px 4px 24px",
          }}
        >
          {events.map((ev) => (
            <EventCard
              key={ev.id || ev._id || ev.title}
              ev={ev}
              applications={applications}
              width={380}
              onRegister={onRegister}
              onViewDetails={onViewDetails}
              onMyApplication={onMyApplication}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Single event card (used in Upcoming Events and in History)
function EventCard({ ev, app: appProp, applications = [], width = 380, compact = false, onRegister, onViewDetails, onMyApplication }) {
  const [saved, setSaved] = useState(false);

  const findApplication = (e) => {
    const id = String(e.id || e._id || "");
    const title = (e.title || "").toLowerCase();
    return (applications || []).find((a) => {
      if (!a || a.status === "Cancelled" || a.status === "Rejected") return false;
      const aid = String(a.opportunityId || a.eventId || a.opportunity?._id || a.opportunity?.id || "");
      return (id && aid && aid === id) || (a.opportunityTitle || "").toLowerCase() === title;
    });
  };

  const statusOf = (a) => {
    if (!a) return null;
    const done =
      a.status === "Completed" ||
      Boolean(a.pointsAwarded && a.pointsAwarded > 0) ||
      Boolean(a.certificateId) ||
      Boolean(a.completedAt);
    if (done) return { label: "Completed", bg: "#DCFCE7", border: "#86EFAC", color: "#166534" };
    if (a.status === "Rejected") return { label: "Rejected", bg: "#FEE2E2", border: "#FCA5A5", color: "#991B1B" };
    if (a.status === "Cancelled") return { label: "Cancelled", bg: "#F1F5F9", border: "#CBD5E1", color: "#475569" };
    if (a.status === "Approved") return { label: "Approved", bg: "#DBEAFE", border: "#93C5FD", color: "#1E40AF" };
    return { label: "Pending", bg: "#FEF3C7", border: "#FCD34D", color: "#92400E" };
  };

  const id = ev.id || ev._id;
  const app = appProp !== undefined ? appProp : findApplication(ev);
  const status = statusOf(app);
  const mode = ev.mode || "Offline";
  const isOnline = mode.toLowerCase() === "online";
  const hours = ev.durationHours || ev.hours;
  const points = ev.points || 50;

  const avail = ev.slotsAvailable !== undefined && ev.slotsAvailable !== null ? Number(ev.slotsAvailable) : null;
  const total = Number(ev.totalSlots ?? ev.slots ?? ev.capacity ?? ev.maxVolunteers) || 0;
  const isFull = avail !== null && avail <= 0;
  const fillPct = isFull ? 100 : total > 0 && avail !== null ? Math.min(100, Math.round(((total - avail) / total) * 100)) : 100;
  const barColor = isFull ? "#EF4444" : fillPct >= 80 ? "#F59E0B" : "#22C55E";

  return (
    <div
      key={id || ev.title}
      style={{
        flex: width ? `0 0 ${width}px` : undefined,
        scrollSnapAlign: "start",
        background: "#FFFFFF",
        borderRadius: 20,
        border: "1.5px solid #FDE9B0",
        boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image + overlays */}
      <div style={{ position: "relative", height: compact ? 112 : 140, background: "#0F172A" }}>
        <img
          src={
            ev.image ||
            "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80"
          }
          alt={ev.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />

        <span
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "#FFFFFF",
            border: "1.5px solid #FDE68A",
            borderRadius: 999,
            padding: "3px 10px",
            fontSize: 13,
            fontWeight: 800,
            color: "#0F172A",
          }}
        >
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: isOnline ? "#22C55E" : "#EAB308" }} />
          {mode}
        </span>

        {status && (
          <span
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: status.bg,
              border: `1.5px solid ${status.border}`,
              color: status.color,
              borderRadius: 999,
              padding: "3px 10px",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            <CheckCircle2 size={14} />
            {status.label}
          </span>
        )}

        <div style={{ position: "absolute", left: 14, bottom: 12, display: "flex", gap: 8 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "#EAB308",
              color: "#0F172A",
              borderRadius: 999,
              padding: "4px 10px",
              fontSize: 12.5,
              fontWeight: 800,
            }}
          >
            <Zap size={12} /> +{points} pts
          </span>
          {hours ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "#3B82F6",
                color: "#FFFFFF",
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 12.5,
                fontWeight: 800,
              }}
            >
              <Clock size={12} /> {hours}h
            </span>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={saved ? "Remove bookmark" : "Bookmark event"}
          onClick={() => setSaved((v) => !v)}
          style={{
            position: "absolute",
            right: 14,
            bottom: 12,
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.7)",
            background: "rgba(255,255,255,0.9)",
            color: saved ? "#D97706" : "#475569",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bookmark size={17} fill={saved ? "#F59E0B" : "none"} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 16px 14px", display: "flex", flexDirection: "column", flex: 1 }}>
        {ev.category && (
          <span
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "#FEF3C7",
              border: "1.5px solid #FDE68A",
              color: "#D97706",
              borderRadius: 999,
              padding: "3px 11px",
              fontSize: 12,
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            <BookOpen size={15} /> {ev.category}
          </span>
        )}

        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: "#0F172A", lineHeight: 1.3 }}>
          {ev.title}
        </h3>

        {!compact && ev.description && (
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 12.5,
              color: "#64748B",
              lineHeight: 1.55,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {ev.description}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10, fontSize: 12.5, color: "#475569" }}>
          {ev.date && (
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Calendar size={15} color="#6366F1" />
              <span>{ev.date}</span>
            </div>
          )}
          {ev.location && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
              <MapPin size={15} color="#EF4444" style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {ev.location}
              </span>
            </div>
          )}
        </div>

        {!compact && avail !== null && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
              <span style={{ color: "#64748B" }}>Availability</span>
              <strong style={{ color: isFull ? "#EF4444" : "#16A34A" }}>
                {isFull ? "Full" : `${avail} left`}
              </strong>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: "#E2E8F0", overflow: "hidden" }}>
              <div style={{ width: `${fillPct}%`, height: "100%", background: barColor, borderRadius: 999 }} />
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            paddingTop: 10,
            marginTop: "auto",
            borderTop: "1px solid #F1F5F9",
          }}
        >
          <button
            type="button"
            onClick={() => onViewDetails?.(ev)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              background: "#FFD629",
              color: "#0F172A",
              border: "none",
              borderRadius: 14,
              padding: "8px 14px",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            <Eye size={16} /> Preview
          </button>

          {app ? (
            <button
              type="button"
              onClick={() => onMyApplication?.(app, ev)}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                background: "linear-gradient(135deg, #1E1B4B 0%, #3730A3 100%)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 14,
                padding: "8px 12px",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 6px 16px rgba(55,48,163,0.3)",
              }}
            >
              My Application <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              disabled={isFull}
              onClick={() => onRegister?.(ev)}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                background: isFull ? "#E2E8F0" : "linear-gradient(135deg, #1E1B4B 0%, #3730A3 100%)",
                color: isFull ? "#94A3B8" : "#FFFFFF",
                border: "none",
                borderRadius: 14,
                padding: "8px 12px",
                fontSize: 14,
                fontWeight: 800,
                cursor: isFull ? "not-allowed" : "pointer",
                boxShadow: isFull ? "none" : "0 6px 16px rgba(55,48,163,0.3)",
              }}
            >
              {isFull ? "Full" : "Register"} {!isFull && <ArrowRight size={15} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Event preview popup (opened from the Preview button on Upcoming Events)
// ─────────────────────────────────────────────────────────────────────────────
function EventPreviewModal({ event, applications = [], onClose, onFullDetails, onRegister, onMyApplication }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!event) return null;

  const id = String(event.id || event._id || "");
  const title = (event.title || "").toLowerCase();
  const app = (applications || []).find((a) => {
    if (!a || a.status === "Cancelled" || a.status === "Rejected") return false;
    const aid = String(a.opportunityId || a.eventId || a.opportunity?._id || a.opportunity?.id || "");
    return (id && aid && aid === id) || (a.opportunityTitle || "").toLowerCase() === title;
  });

  const hours = event.durationHours || event.hours;
  const avail = event.slotsAvailable !== undefined && event.slotsAvailable !== null ? Number(event.slotsAvailable) : null;
  const time =
    event.time ||
    event.timing ||
    (event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : "To be announced");

  const infoTile = (icon, label, value) => (
    <div style={{ background: "#F8FAFC", borderRadius: 14, padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#94A3B8", fontWeight: 600, marginBottom: 4 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>{value}</div>
    </div>
  );

  const chip = (bg, color, children) => (
    <span style={{ background: bg, color, borderRadius: 999, padding: "5px 12px", fontSize: 13.5, fontWeight: 800 }}>
      {children}
    </span>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 1000,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          borderRadius: 28,
          width: "100%",
          maxWidth: 600,
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ position: "relative", height: 200, background: "#0F172A" }}>
          <img
            src={event.image || "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1000&q=80"}
            alt={event.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,255,255,0.92)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0F172A",
            }}
          >
            <X size={18} />
          </button>
          <div style={{ position: "absolute", left: 14, bottom: 12, display: "flex", gap: 8 }}>
            {chip("#EAB308", "#0F172A", `+${event.points || 50}pts`)}
            {hours ? chip("#3B82F6", "#FFFFFF", `${hours}h`) : null}
            {chip("#E5E7EB", "#0F172A", event.mode || "Offline")}
          </div>
        </div>

        <div style={{ padding: "22px 28px 24px" }}>
          {event.category && (
            <span
              style={{
                display: "inline-block",
                background: "#FEF3C7",
                color: "#D97706",
                borderRadius: 999,
                padding: "5px 14px",
                fontSize: 13,
                fontWeight: 800,
                marginBottom: 12,
              }}
            >
              {event.category}
            </span>
          )}
          <h3 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: "#0F172A" }}>{event.title}</h3>
          {event.description && (
            <p style={{ margin: "0 0 20px", fontSize: 15, lineHeight: 1.65, color: "#64748B" }}>{event.description}</p>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
            {infoTile(<Calendar size={15} color="#6366F1" />, "Date", event.date || "To be announced")}
            {infoTile(<Clock size={15} color="#F59E0B" />, "Time", time)}
            {infoTile(<ShieldCheck size={15} color="#16A34A" />, "Hours", hours ? `${hours}h verified` : "—")}
            {infoTile(<Users size={15} color="#EC4899" />, "Slots Left", avail !== null ? `${avail} slots` : "—")}
          </div>

          {event.location && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#F8FAFC",
                borderRadius: 14,
                padding: "14px 16px",
                fontSize: 15,
                fontWeight: 800,
                color: "#0F172A",
              }}
            >
              <MapPin size={16} color="#EF4444" style={{ flexShrink: 0 }} />
              {event.location}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 14, padding: "18px 28px 24px", borderTop: "1px solid #F1F5F9" }}>
          <button
            type="button"
            onClick={() => onFullDetails?.(event)}
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRadius: 14,
              border: "1.5px solid #E2E8F0",
              background: "#F8FAFC",
              color: "#0F172A",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Full Details →
          </button>
          <button
            type="button"
            onClick={() => (app ? onMyApplication?.(app, event) : onRegister?.(event))}
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #1E1B4B 0%, #3730A3 100%)",
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(55,48,163,0.35)",
            }}
          >
            {app ? "My Application →" : "Register Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const {
    user = {},
    opportunities = [],
    applications = [],
    pointsHistory = [],
    certificates = [],
    openCertificate,
    openLinkedInShare,
    applyForOpportunity,
    cancelApplication,
    showToast,
  } = useApp();

  const navigate = useNavigate();

  // Tab navigation state: overview | events | certificates | linkedin | points | history
  const [dashboardSection, setDashboardSection] = useState("overview");

  // Filter state for History section
  const [historyCategory, setHistoryCategory] = useState("All");
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState("All");

  // LinkedIn copy feedback
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Event preview popup
  const [previewEvent, setPreviewEvent] = useState(null);

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

  // Unified certificates list: from certificates API + derived from completed applications
  const allCertificates = useMemo(() => {
    const certMap = new Map();
    (certificates || []).forEach((c) => {
      const k = c.certificateId || `${c.eventId}_${c.eventTitle}`;
      certMap.set(k, c);
    });
    (applications || []).forEach((app) => {
      const isCompleted =
        app.status === "Completed" ||
        Boolean(app.pointsAwarded && app.pointsAwarded > 0) ||
        Boolean(app.certificateId) ||
        Boolean(app.completedAt);
      if (isCompleted) {
        const title = app.opportunityTitle || "Volunteering Drive";
        const cId = app.certificateId || `MF-CERT-2026-${String(app.referenceId || "8799").replace(/[^0-9]/g, "") || "8799"}`;
        const k = cId || title;
        if (!certMap.has(k) && !Array.from(certMap.values()).some((c) => (c.eventTitle || "").toLowerCase() === title.toLowerCase())) {
          certMap.set(k, {
            id: cId,
            _id: cId,
            certificateId: cId,
            eventTitle: title,
            eventCategory: app.category || "Maatram Core",
            volunteerName: app.applicantDetails?.name || user?.fullName || "Student Volunteer",
            volunteerEmail: app.applicantDetails?.email || user?.email || "",
            verifiedHours: app.hours || 4,
            pointsAwarded: app.pointsAwarded || 50,
            issueDate: app.eventDate || "15 Nov 2026",
            linkedInPost: `🌟 Proud to share that I have completed the volunteering initiative for "${title}" with Maatram Foundation! #MaatramFoundation #Volunteering #SocialImpact`,
          });
        }
      }
    });
    return Array.from(certMap.values());
  }, [certificates, applications, user?.fullName, user?.email]);

  // Filter registered upcoming events safely
  const myRegisteredEvents = (applications || []).filter(
    (app) => app?.status !== "Cancelled" && app?.status !== "Rejected"
  );

  // Completed events are archived in History, not shown as "upcoming"
  const isAppDone = (app) =>
    app?.status === "Completed" ||
    Boolean(app?.pointsAwarded && app.pointsAwarded > 0) ||
    Boolean(app?.certificateId) ||
    Boolean(app?.completedAt);

  const upcomingRegisteredEvents = myRegisteredEvents.filter((app) => !isAppDone(app));

  const completedEventIds = new Set();
  const completedEventTitles = new Set();
  (applications || []).forEach((app) => {
    if (!isAppDone(app)) return;
    const cid = app.opportunityId || app.eventId || app.opportunity?._id || app.opportunity?.id;
    if (cid) completedEventIds.add(String(cid));
    if (app.opportunityTitle) completedEventTitles.add(app.opportunityTitle.toLowerCase());
  });

  const activeOpportunities = (opportunities || []).filter((opp) => {
    const oid = String(opp.id || opp._id || "");
    return !(
      (oid && completedEventIds.has(oid)) ||
      completedEventTitles.has((opp.title || "").toLowerCase())
    );
  });

  const upcomingOpportunities = activeOpportunities.slice(0, 2);

  const recommendedOpportunities = activeOpportunities.slice(2, 4);

  const userPoints = Number(user?.points) || 0;

  const verifiedHours = Number(user?.totalHours) || 0;

  // Count completed events from applications state (always accurate, even after real-time update)
  const completedAppsCount = (applications || []).filter(
    (a) => a?.status === "Completed"
  ).length;
  const eventsCount =
    completedAppsCount ||
    Number(user?.completedEventsCount) ||
    Number(user?.eventsJoined) ||
    0;

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
      : 0;

  const topScore =
    allPoints.length > 0
      ? Math.max(...allPoints)
      : 0;

  const myRankIndex = peerLeaderboard.findIndex(
    (u) =>
      (u.applicationId && u.applicationId === user?.applicationId) ||
      (u.email && u.email === user?.email)
  );
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : "–";

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
    <div className="dashboard-container" style={{ background: "#FFFFFF" }}>

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
                margin: "0 0 12px",
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

      {/* VOLUNTEER RANKING & POINTS PROGRESS — prominent card between the welcome banner and stats */}
      <div
        style={{
          background: "#FFFFFF",
          padding: "14px 20px",
          borderRadius: 16,
          border: "1.5px solid #E2E8F0",
          boxShadow: "none",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: "linear-gradient(135deg, #FFD629 0%, #F59E0B 100%)",
                color: "#0F172A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "none",
              }}
            >
              <Trophy size={20} />
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.02em" }}>
                Volunteer Ranking: {currentTier.name}
              </h3>
              <span style={{ display: "block", marginTop: 2, fontSize: 13.5, fontWeight: 700, color: "#334155" }}>
                {nextTier
                  ? `${pointsNeeded} points needed to reach ${nextTier.name}`
                  : "You have achieved the highest Green Gem Volunteer ranking!"}
              </span>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: "#B45309", letterSpacing: "-0.03em", lineHeight: 1 }}>
              {userPoints}
            </span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#334155" }}> / {targetPts} pts</span>
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 10,
            background: "#E2E8F0",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "inset 0 1px 3px rgba(15, 23, 42, 0.12)",
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              background: "linear-gradient(90deg, #FFD629, #F59E0B)",
              borderRadius: 12,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* Six tier milestones */}
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {TIERS_CONFIG.map((t) => {
            const reached = userPoints >= t.minPoints;
            const isCurrent = t.tier === currentTier.tier;
            return (
              <div
                key={t.tier}
                style={{
                  flex: "1 1 90px",
                  textAlign: "center",
                  padding: "5px 6px",
                  borderRadius: 10,
                  background: isCurrent ? "#FFF7D6" : "transparent",
                  border: isCurrent ? "1.5px solid #FDE68A" : "1.5px solid transparent",
                  opacity: 1,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: reached || isCurrent ? t.color : "#94A3B8",
                    marginBottom: 2,
                  }}
                />
                <strong style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: reached || isCurrent ? "#0F172A" : "#475569" }}>
                  {t.name}
                </strong>
                <span style={{ fontSize: 12, color: "#475569", fontWeight: 700 }}>{t.milestoneLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

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
                {myRank === "–" ? "–" : `#${myRank}`}
              </span>

              <span className="stat-subtext">
                of {peerLeaderboard.length}
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

        {/* Verified Hours */}

        <Link
          to="/contributions"
          className="stat-card"
          style={{
            textDecoration: "none",
            color: "inherit",
            borderLeft: "4px solid #D97706",
          }}
        >
          <div className="stat-icon-wrap amber">
            <Clock size={22} />
          </div>

          <div className="stat-content">
            <span className="stat-label">
              Hours
            </span>

            <div className="stat-value-row">
              <span className="stat-value">
                {verifiedHours}
              </span>

              <span className="stat-subtext">
                hrs
              </span>
            </div>

            <span className="stat-period-tag">
              Verified volunteering hours
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
          { key: "certificates", label: "My Certificates", icon: Award, badge: allCertificates.length },
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
                border: isActive ? "1px solid #EAB308" : "1px solid #E2E8F0",
                background: isActive ? "#FFD629" : "#FFFFFF",
                color: isActive ? "#0F172A" : "#334155",
                fontWeight: isActive ? 700 : 600,
                fontSize: 13.5,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
                boxShadow: isActive ? "0 4px 12px rgba(234, 179, 8, 0.3)" : "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <Icon size={16} color={isActive ? "#0F172A" : "#64748B"} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== null && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 20,
                    background: isActive ? "rgba(15, 23, 42, 0.12)" : "#F1F5F9",
                    color: isActive ? "#0F172A" : "#64748B",
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
          {/* PHASE 4: HORIZONTAL UPCOMING EVENTS CAROUSEL (Left-to-Right Scrolling) */}
          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <UpcomingEventsCarousel
              events={activeOpportunities}
              applications={applications}
              onRegister={async (event) => {
                try {
                  await applyForOpportunity(event.id || event._id, {
                    motivation: "Eager to contribute and volunteer for this drive.",
                  });
                  showToast(`Successfully registered for "${event.title}"! Application submitted for review.`);
                } catch (err) {
                  showToast(err.message || "Failed to submit application", "error");
                }
              }}
              onViewDetails={(event) => setPreviewEvent(event)}
              onMyApplication={() => navigate("/applications")}
            />
          </div>

          {/* ROW: OPEN DRIVES + MY UPCOMING EVENTS + CALENDAR (single row) */}

          <div className="dashboard-grid-layout">
            <div
              className="dash-col-main"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))",
                gap: 24,
                alignItems: "start",
              }}
            >

              {/* OPEN VOLUNTEERING DRIVES */}

              <div className="dash-section-card" style={{ padding: "26px 24px", minWidth: 0 }}>
                <div className="section-card-header" style={{ minHeight: 40, flexWrap: "nowrap" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, whiteSpace: "nowrap" }}>Open Volunteering Drives</h2>
                  </div>

                  <Link
                    to="/opportunities"
                    className="view-all-link"
                  >
                    All ({activeOpportunities.length}){" "}
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
                          style={{ flexDirection: "column", alignItems: "flex-start", gap: 14 }}
                        >
                          <img
                            src={
                              opp.image ||
                              "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=400&q=80"
                            }
                            alt={opp.title}
                            className="opp-item-thumb"
                            style={{ width: "100%", height: 150 }}
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

                          <div className="opp-item-actions" style={{ width: "100%" }}>
                            <Link
                              to={`/opportunities/${oppId}/apply`}
                              className="apply-btn-sm"
                              style={{ width: "100%" }}
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

              <div className="dash-section-card" style={{ padding: "26px 24px", minWidth: 0 }}>
                <div className="section-card-header" style={{ minHeight: 40, flexWrap: "nowrap" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, whiteSpace: "nowrap" }}>My Upcoming Events</h2>
                  </div>

                  <Link
                    to="/applications"
                    className="view-all-link"
                  >
                    All ({upcomingRegisteredEvents.length})
                  </Link>
                </div>

                <div className="my-events-list">
                  {upcomingRegisteredEvents.length === 0 ? (
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
                    upcomingRegisteredEvents.map((app) => (
                      <div
                        key={app.id || app._id}
                        className="my-event-card"
                      >
                        <div className="my-event-status-row">
                          {(() => {
                            const isAppCompleted =
                              app.status === "Completed" ||
                              Boolean(app.pointsAwarded && app.pointsAwarded > 0) ||
                              Boolean(app.certificateId) ||
                              Boolean(app.completedAt);
                            if (isAppCompleted) {
                              return (
                                <span className="status-pill completed" style={{ background: "#DCFCE7", color: "#15803D", borderColor: "#86EFAC" }}>
                                  <CheckCircle2 size={12} />
                                  Completed
                                </span>
                              );
                            }
                            if (app.status === "Approved") {
                              return (
                                <span className="status-pill approved">
                                  <CheckCircle2 size={12} />
                                  Approved
                                </span>
                              );
                            }
                            return (
                              <span className="status-pill pending">
                                Pending Review
                              </span>
                            );
                          })()}

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

              {/* STUDENT INTERACTIVE EVENT CALENDAR */}
              <div className="dash-section-card" style={{ padding: "26px 24px", minWidth: 0 }}>
                <div className="section-card-header" style={{ minHeight: 40, flexWrap: "nowrap" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, whiteSpace: "nowrap" }}>Event Calendar</h2>
                  </div>
                </div>

                <DashboardCalendar
                  events={opportunities}
                  applications={applications}
                  onSelectEvent={(ev) => ev.id && navigate(`/opportunities/${ev.id}`)}
                />
              </div>
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

        </>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 3: MY CERTIFICATES (Gold Border Recognition & PDF Download)
      ══════════════════════════════════════════════════════════════════════ */}
      {dashboardSection === "certificates" && (
        <div style={{ marginTop: 8 }}>
          {/* Quick Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
            <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "18px 20px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FEF3C7", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                🏆
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>{allCertificates.length}</div>
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
          {allCertificates.length === 0 ? (
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
              {allCertificates.map((cert) => (
                <div
                  key={cert.certificateId || cert.id}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 22,
                    border: "1.5px solid #FDE9B0",
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.07)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Header band */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "18px 22px",
                      background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
                      borderBottom: "1px solid #FDE9B0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 14,
                          background: "linear-gradient(135deg, #FFD629 0%, #F59E0B 100%)",
                          color: "#0F172A",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Award size={24} />
                      </div>
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 800,
                          color: "#B45309",
                          background: "#FFFFFF",
                          border: "1.5px solid #FDE68A",
                          padding: "5px 12px",
                          borderRadius: 999,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {cert.eventCategory || "Volunteering"}
                      </span>
                    </div>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: "#166534",
                        background: "#DCFCE7",
                        border: "1.5px solid #86EFAC",
                        padding: "5px 12px",
                        borderRadius: 999,
                        flexShrink: 0,
                      }}
                    >
                      <CheckCircle2 size={14} /> Verified
                    </span>
                  </div>

                  {/* Body */}
                  <div style={{ padding: "20px 22px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <h4 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: "#0F172A", lineHeight: 1.3 }}>
                      {cert.eventTitle}
                    </h4>
                    <p style={{ margin: "0 0 16px", fontSize: 14, color: "#64748B" }}>
                      Awarded to <strong style={{ color: "#0F172A" }}>{cert.volunteerName || user?.fullName}</strong>
                    </p>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "6px 12px", fontSize: 13, fontWeight: 700, color: "#334155" }}>
                        <Calendar size={14} color="#6366F1" /> {cert.eventDate || cert.issueDate}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "6px 12px", fontSize: 13, fontWeight: 700, color: "#334155" }}>
                        <Clock size={14} color="#F59E0B" /> {cert.verifiedHours} Hours
                      </span>
                      {cert.pointsAwarded ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "6px 12px", fontSize: 13, fontWeight: 800, color: "#B45309" }}>
                          <Star size={14} color="#F59E0B" fill="#F59E0B" /> +{cert.pointsAwarded} pts
                        </span>
                      ) : null}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        fontFamily: "monospace",
                        color: "#64748B",
                        background: "#F8FAFC",
                        border: "1.5px dashed #CBD5E1",
                        borderRadius: 10,
                        padding: "8px 12px",
                        marginBottom: 18,
                        wordBreak: "break-all",
                      }}
                    >
                      ID: {cert.certificateId}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                      <button
                        type="button"
                        onClick={() => openCertificate?.(cert)}
                        style={{
                          flex: 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "11px 12px",
                          borderRadius: 12,
                          border: "1.5px solid #CBD5E1",
                          background: "#FFFFFF",
                          color: "#0F172A",
                          fontSize: 13.5,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        <Eye size={15} /> Preview
                      </button>

                      <button
                        type="button"
                        onClick={() => openCertificate?.(cert)}
                        style={{
                          flex: 1.4,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "11px 12px",
                          borderRadius: 12,
                          border: "none",
                          background: "#FFD629",
                          color: "#0F172A",
                          fontSize: 13.5,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        <Download size={15} /> Download PDF
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
                          width: 44,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 12,
                          border: "none",
                          background: "#0A66C2",
                          color: "#FFFFFF",
                          cursor: "pointer",
                        }}
                      >
                        <Share2 size={16} />
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
            const certPosts = (allCertificates || []).map((c, idx) => ({
              id: `post_cert_${c.certificateId || idx}`,
              tag: `Official Certificate • ${c.certificateId}`,
              headline: `Participation Certificate: ${c.eventTitle}`,
              content: c.linkedInPost || `I am proud to share that I have completed the volunteering initiative for "${c.eventTitle}" with Maatram Foundation! Dedicated ${c.verifiedHours || 4} hours to empower deserving youth. Grateful to be part of this impactful journey. Certificate ID: ${c.certificateId}. #MaatramFoundation #Volunteering #SocialImpact #StudentLeadership`,
            }));

            const eventPosts = completedEvents
              .filter((a) => !certificates.some((c) => c.eventTitle === (a.opportunityTitle || a.event?.title)))
              .map((a, idx) => ({
                id: `post_event_${idx}`,
                tag: "Event Completion",
                headline: `Completed Initiative: ${a.opportunityTitle || a.event?.title || "Community Drive"}`,
                content: `I am proud to share that I have successfully completed the volunteering initiative for "${a.opportunityTitle || a.event?.title || 'Community Service'}" with Maatram Foundation!\n\nDedicated ${a.event?.durationHours || 4} hours to creating meaningful community impact. Grateful to be part of the change!\n\n"Thank you for being part of the Maatram community. Your contribution is helping us build a better tomorrow!"\n\n#MaatramFoundation #Volunteering #SocialImpact #StudentLeadership`,
              }));

            const postsToShare = [
              {
                id: "post_summary",
                tag: "Volunteering Journey Summary",
                headline: `Milestone Achieved: ${userPoints} Points & ${verifiedHours} Verified Community Service Hours`,
                content: `Proud to share my volunteering milestone with Maatram Foundation! 🌟\n\nOver the past months, I have dedicated ${verifiedHours} hours on-ground and earned ${userPoints} leadership points empowering deserving high school students and rural communities.\n\nVolunteering has helped me sharpen my communication, team coordination, and empathetic leadership skills.\n\nThank you to the mentors and coordinators at Maatram Foundation for building this platform! 🤝\n\n#MaatramFoundation #Volunteering #SocialImpact #StudentLeadership #CommunityFirst`,
              },
              ...certPosts,
              ...eventPosts,
            ];

            const authorName = user?.name || user?.fullName || "Student Volunteer";
            const renderPost = (text) =>
              text.split(/(#[A-Za-z0-9_]+)/g).map((part, i) =>
                part.startsWith("#") ? (
                  <span key={i} style={{ color: "#0A66C2", fontWeight: 600 }}>{part}</span>
                ) : (
                  part
                )
              );

            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(440px, 100%), 1fr))", gap: 22, alignItems: "start" }}>
                {postsToShare.map((postItem, idx) => (
                  <div
                    key={postItem.id}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 22,
                      border: "1.5px solid #E2E8F0",
                      boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Card header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        padding: "14px 20px",
                        background: "linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)",
                        borderBottom: "1px solid #E2E8F0",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 800, color: "#0A66C2" }}>
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: "#0A66C2",
                            color: "#FFFFFF",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Share2 size={14} />
                        </span>
                        {postItem.tag}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>LinkedIn Post</span>
                    </div>

                    <div style={{ padding: "18px 20px 20px" }}>
                      <h3 style={{ margin: "0 0 14px", fontSize: 17, fontWeight: 900, color: "#0F172A", lineHeight: 1.35 }}>
                        {postItem.headline}
                      </h3>

                      {/* LinkedIn-style post preview */}
                      <div
                        style={{
                          background: "#F8FAFC",
                          border: "1px solid #E2E8F0",
                          borderRadius: 16,
                          padding: 16,
                          marginBottom: 16,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #FFD629 0%, #F59E0B 100%)",
                              color: "#0F172A",
                              fontWeight: 900,
                              fontSize: 17,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {authorName.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ lineHeight: 1.3 }}>
                            <strong style={{ display: "block", fontSize: 14, color: "#0F172A" }}>{authorName}</strong>
                            <span style={{ fontSize: 12, color: "#64748B" }}>Volunteer • Maatram Foundation</span>
                          </div>
                        </div>

                        <div style={{ fontSize: 14, color: "#1E293B", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                          {renderPost(postItem.content)}
                        </div>
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
                            flex: 1,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 7,
                            padding: "11px 16px",
                            borderRadius: 12,
                            border: copiedIndex === idx ? "1.5px solid #86EFAC" : "1.5px solid #CBD5E1",
                            background: copiedIndex === idx ? "#DCFCE7" : "#FFFFFF",
                            color: copiedIndex === idx ? "#15803D" : "#0F172A",
                            fontWeight: 800,
                            fontSize: 13.5,
                            cursor: "pointer",
                          }}
                        >
                          {copiedIndex === idx ? <Check size={16} /> : <Copy size={16} />}
                          {copiedIndex === idx ? "Copied!" : "Copy Post"}
                        </button>

                        <a
                          href={`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(postItem.content)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            flex: 1.3,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 7,
                            padding: "11px 16px",
                            borderRadius: 12,
                            background: "#0A66C2",
                            color: "#FFFFFF",
                            fontWeight: 800,
                            fontSize: 13.5,
                            textDecoration: "none",
                            boxShadow: "0 6px 16px rgba(10, 102, 194, 0.28)",
                          }}
                        >
                          <Share2 size={16} /> Share on LinkedIn
                        </a>
                      </div>
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
          <h2 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 18px", color: "#0F172A" }}>
            My Complete Activity History <span style={{ color: "#F59E0B" }}>.</span>
          </h2>

          {/* Search & Status Filter Controls */}
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", padding: "16px 20px", marginBottom: 20, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", flex: "1 1 240px" }}>
              <Search size={15} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search history by title or location..."
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

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", width: "100%" }}>
              {["All", "Completed", "Approved", "Pending"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setHistoryStatus(st)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 999,
                    border: historyStatus === st ? "1.5px solid #EAB308" : "1px solid #CBD5E1",
                    background: historyStatus === st ? "#FFD629" : "#FFFFFF",
                    color: historyStatus === st ? "#0F172A" : "#475569",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* History Event Cards Grid — every registered / completed event is stored here */}
          {(() => {
            const items = (applications || []).map((a) => {
              const base = a.opportunity || a.event || {};
              const aid = String(a.opportunityId || a.eventId || base._id || base.id || "");
              const full =
                (opportunities || []).find((o) => {
                  const oid = String(o.id || o._id || "");
                  return (
                    (aid && oid === aid) ||
                    (a.opportunityTitle || "").toLowerCase() === (o.title || "").toLowerCase()
                  );
                }) || {};
              const ev = {
                ...base,
                ...full,
                id: full.id || full._id || base.id || base._id || aid,
                title: full.title || a.opportunityTitle || base.title || "Community Volunteering Drive",
                date:
                  full.date ||
                  base.date ||
                  a.eventDate ||
                  (a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN") : ""),
                category: full.category || base.category || a.category || "Volunteering",
              };
              return {
                key: a._id || a.id || ev.id,
                app: a,
                ev,
                statusKey: isAppDone(a) ? "Completed" : a.status || "Pending",
              };
            });

            const filtered = items.filter((it) => {
              const q = historySearch.trim().toLowerCase();
              const matchSearch =
                !q ||
                (it.ev.title || "").toLowerCase().includes(q) ||
                (it.ev.category || "").toLowerCase().includes(q) ||
                (it.ev.location || "").toLowerCase().includes(q);
              const matchCat =
                historyCategory === "All" ||
                (it.ev.category || "").toLowerCase().includes(historyCategory.toLowerCase());
              const matchStatus = historyStatus === "All" || it.statusKey === historyStatus;
              return matchSearch && matchCat && matchStatus;
            });

            if (filtered.length === 0) {
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 320px))", justifyContent: "start", gap: 20 }}>
                {filtered.map((it) => (
                  <EventCard
                    key={it.key}
                    ev={it.ev}
                    app={it.app}
                    applications={applications}
                    width={null}
                    compact
                    onRegister={(e) => navigate(`/opportunities/${e.id || e._id}/apply`)}
                    onViewDetails={(e) => setPreviewEvent(e)}
                    onMyApplication={() => navigate("/applications")}
                  />
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* EVENT PREVIEW POPUP */}
      {previewEvent && (
        <EventPreviewModal
          event={previewEvent}
          applications={applications}
          onClose={() => setPreviewEvent(null)}
          onFullDetails={(ev) => {
            setPreviewEvent(null);
            navigate(`/opportunities/${ev.id || ev._id}`);
          }}
          onRegister={(ev) => {
            setPreviewEvent(null);
            navigate(`/opportunities/${ev.id || ev._id}/apply`);
          }}
          onMyApplication={() => {
            setPreviewEvent(null);
            navigate("/applications");
          }}
        />
      )}

    </div>
  );
}