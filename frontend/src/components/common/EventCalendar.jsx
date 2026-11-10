// frontend/src/components/common/EventCalendar.jsx
import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Check,
  Users,
  AlertCircle,
  Tag,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import "./EventCalendar.css";

// Colour system required:
// - Yellow: Registered event
// - Blue: Application pending
// - Green: Approved event
// - Orange: Upcoming event reminder
// - Red: Rejected or cancelled
// - Grey: Completed event
export const CALENDAR_STATUS_COLORS = {
  registered: { bg: "#FBBF24", text: "#1E293B", border: "#F59E0B", label: "Registered Event" },
  pending:    { bg: "#3B82F6", text: "#FFFFFF", border: "#2563EB", label: "Application Pending" },
  approved:   { bg: "#10B981", text: "#FFFFFF", border: "#059669", label: "Approved Event" },
  reminder:   { bg: "#F97316", text: "#FFFFFF", border: "#EA580C", label: "Upcoming Reminder" },
  rejected:   { bg: "#EF4444", text: "#FFFFFF", border: "#DC2626", label: "Rejected / Cancelled" },
  completed:  { bg: "#94A3B8", text: "#FFFFFF", border: "#64748B", label: "Completed Event" },
};

function parseDateString(dateStr) {
  if (!dateStr) return null;
  // Try direct Date parse
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  // Try "15 Nov 2026" or "15-11-2026" or "2026-11-15"
  const parts = String(dateStr).trim().split(/[\s,/-]+/);
  if (parts.length >= 3) {
    // Check if parts[1] is a month name
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthIdx = monthNames.findIndex((m) => parts[1].toLowerCase().startsWith(m));
    if (monthIdx !== -1) {
      const day = parseInt(parts[0], 10);
      const year = parseInt(parts[2], 10);
      return new Date(year, monthIdx, day);
    }
  }
  return null;
}

function formatDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function EventCalendar({
  mode = "student", // "student" | "admin"
  events = [],
  applications = [],
  onSelectEvent,
  onNavigateToManage,
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [adminStatusFilter, setAdminStatusFilter] = useState("All");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDateKey(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDateKey(null);
  };

  const monthName = currentDate.toLocaleString("en-US", { month: "long" });

  // Map events to date keys YYYY-MM-DD
  const calendarMap = useMemo(() => {
    const map = {};

    if (mode === "student") {
      // Index student's applications
      (applications || []).forEach((app) => {
        if (!app) return;
        const evDate = parseDateString(app.eventDate || app.appliedDate);
        if (!evDate) return;
        const key = formatDateKey(evDate.getFullYear(), evDate.getMonth(), evDate.getDate());

        if (!map[key]) map[key] = [];

        let statusKey = "registered";
        const st = (app.status || "Pending").toLowerCase();
        if (st === "pending") statusKey = "pending";
        else if (st === "approved" || st === "assigned") statusKey = "approved";
        else if (st === "completed") statusKey = "completed";
        else if (st === "rejected" || st === "cancelled") statusKey = "rejected";

        // Check if event is upcoming within 3 days for reminder status
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 3 && (st === "approved" || st === "assigned" || st === "pending")) {
          statusKey = "reminder";
        }

        map[key].push({
          id: app.id || app._id || app.referenceId,
          title: app.opportunityTitle || "Volunteering Drive",
          time: app.time || "9:30 AM - 1:30 PM",
          location: app.location || "On-ground Venue",
          category: app.category || "Volunteering",
          status: app.status || "Pending",
          statusKey,
          isApplication: true,
          raw: app,
        });
      });
    } else {
      // Admin Mode: Map all events
      (events || []).forEach((ev) => {
        if (!ev) return;
        const evDate = parseDateString(ev.date);
        if (!evDate) return;
        const key = formatDateKey(evDate.getFullYear(), evDate.getMonth(), evDate.getDate());

        if (!map[key]) map[key] = [];

        let statusKey = "registered";
        const st = (ev.eventStatus || "Upcoming").toLowerCase();
        if (st === "completed") statusKey = "completed";
        else if (st === "cancelled") statusKey = "rejected";
        else if (st === "ongoing") statusKey = "approved";
        else statusKey = "registered";

        map[key].push({
          id: ev.id || ev._id,
          title: ev.title || "Community Event",
          time: ev.time || "9:30 AM - 1:30 PM",
          location: ev.location || "Venue",
          category: ev.category || "General",
          status: ev.eventStatus || "Upcoming",
          statusKey,
          slotsAvailable: ev.slotsAvailable,
          volunteersNeeded: ev.volunteersNeeded,
          registeredCount: ev.registeredVolunteers?.length || 0,
          approvedCount: (ev.registeredVolunteers || []).filter((v) => v.status === "Approved" || v.status === "Assigned").length,
          pendingCount: (ev.registeredVolunteers || []).filter((v) => v.status === "Pending").length,
          isApplication: false,
          raw: ev,
        });
      });
    }

    return map;
  }, [mode, events, applications]);

  // Filter events in Admin mode if a filter is chosen
  const filteredEventsForDate = useMemo(() => {
    if (!selectedDateKey || !calendarMap[selectedDateKey]) return [];
    const list = calendarMap[selectedDateKey];
    if (mode !== "admin" || adminStatusFilter === "All") return list;
    return list.filter((item) => (item.status || "").toLowerCase() === adminStatusFilter.toLowerCase());
  }, [selectedDateKey, calendarMap, mode, adminStatusFilter]);

  // Generate grid days: leading month days, current days, trailing days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = lastDayOfPrevMonth - i;
      const prevDateKey = formatDateKey(
        month === 0 ? year - 1 : year,
        month === 0 ? 11 : month - 1,
        prevDay
      );
      days.push({
        dayNumber: prevDay,
        dateKey: prevDateKey,
        isCurrentMonth: false,
        events: calendarMap[prevDateKey] || [],
      });
    }

    // Days in current month
    for (let d = 1; d <= lastDayOfMonth; d++) {
      const dateKey = formatDateKey(year, month, d);
      days.push({
        dayNumber: d,
        dateKey,
        isCurrentMonth: true,
        events: calendarMap[dateKey] || [],
      });
    }

    // Trailing days to fill 35 or 42 cells (exact 7 columns)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let t = 1; t <= remaining; t++) {
      const nextDateKey = formatDateKey(
        month === 11 ? year + 1 : year,
        month === 11 ? 0 : month + 1,
        t
      );
      days.push({
        dayNumber: t,
        dateKey: nextDateKey,
        isCurrentMonth: false,
        events: calendarMap[nextDateKey] || [],
      });
    }

    return days;
  }, [year, month, calendarMap]);

  const todayKey = useMemo(() => {
    const now = new Date();
    return formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  return (
    <div className="event-calendar-widget">
      {/* Calendar Header matching Reference Image 2 */}
      <div className="cal-header-row">
        <h3 className="cal-widget-title">Calendar</h3>
        <div className="cal-month-nav">
          <button
            type="button"
            className="cal-nav-btn"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            title="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="cal-month-heading">
            {monthName} {year}
          </span>
          <button
            type="button"
            className="cal-nav-btn"
            onClick={handleNextMonth}
            aria-label="Next month"
            title="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Admin Mode Filter Bar */}
      {mode === "admin" && (
        <div className="cal-admin-filter-bar">
          <span className="cal-filter-label">Filter:</span>
          {["All", "Upcoming", "Ongoing", "Completed"].map((st) => (
            <button
              key={st}
              type="button"
              className={`cal-filter-pill ${adminStatusFilter === st ? "active" : ""}`}
              onClick={() => setAdminStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      )}

      {/* Weekday Names */}
      <div className="cal-weekdays-grid">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Days Grid */}
      <div className="cal-days-grid">
        {calendarDays.map((cell, idx) => {
          const hasEvents = cell.events && cell.events.length > 0;
          const isToday = cell.dateKey === todayKey;
          const isSelected = cell.dateKey === selectedDateKey;

          // Determine predominant color from event status
          const firstEvent = hasEvents ? cell.events[0] : null;
          const statusConfig = firstEvent
            ? CALENDAR_STATUS_COLORS[firstEvent.statusKey] || CALENDAR_STATUS_COLORS.registered
            : null;

          return (
            <div
              key={`${cell.dateKey}-${idx}`}
              className={`cal-day-cell ${cell.isCurrentMonth ? "current-month" : "muted-month"} ${
                hasEvents ? "has-events" : ""
              } ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
              onClick={() => {
                if (hasEvents) {
                  setSelectedDateKey(selectedDateKey === cell.dateKey ? null : cell.dateKey);
                } else {
                  setSelectedDateKey(null);
                }
              }}
            >
              {hasEvents ? (
                <div
                  className="cal-event-highlight-circle"
                  style={{
                    backgroundColor: statusConfig.bg,
                    color: statusConfig.text,
                    border: `2px solid ${statusConfig.border}`,
                  }}
                  title={`${cell.events.length} event(s) scheduled on this day`}
                >
                  <span className="cal-day-number">{cell.dayNumber}</span>
                  {/* Black circle with checkmark badge on top right (matches reference image) */}
                  <span className="cal-check-badge">
                    <Check size={9} strokeWidth={3} color="#FFFFFF" />
                  </span>
                </div>
              ) : (
                <span className="cal-day-number-plain">{cell.dayNumber}</span>
              )}

              {/* Multiple events indicator dot */}
              {cell.events.length > 1 && (
                <span className="cal-multi-dot" title={`${cell.events.length} events`}>
                  +{cell.events.length}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Colour System Legend required by prompt */}
      <div className="cal-legend-container">
        <div className="cal-legend-item">
          <span className="cal-legend-dot" style={{ backgroundColor: CALENDAR_STATUS_COLORS.registered.bg }} />
          <span>Registered</span>
        </div>
        <div className="cal-legend-item">
          <span className="cal-legend-dot" style={{ backgroundColor: CALENDAR_STATUS_COLORS.pending.bg }} />
          <span>Pending</span>
        </div>
        <div className="cal-legend-item">
          <span className="cal-legend-dot" style={{ backgroundColor: CALENDAR_STATUS_COLORS.approved.bg }} />
          <span>Approved</span>
        </div>
        <div className="cal-legend-item">
          <span className="cal-legend-dot" style={{ backgroundColor: CALENDAR_STATUS_COLORS.reminder.bg }} />
          <span>Reminder</span>
        </div>
        <div className="cal-legend-item">
          <span className="cal-legend-dot" style={{ backgroundColor: CALENDAR_STATUS_COLORS.completed.bg }} />
          <span>Completed</span>
        </div>
        <div className="cal-legend-item">
          <span className="cal-legend-dot" style={{ backgroundColor: CALENDAR_STATUS_COLORS.rejected.bg }} />
          <span>Rejected</span>
        </div>
      </div>

      {/* Selected Date Event Popover / Detail Drawer */}
      {selectedDateKey && (
        <div className="cal-selected-date-details">
          <div className="cal-details-header">
            <div className="cal-details-title-row">
              <CalendarIcon size={16} color="#EAB308" />
              <h4>
                Events on{" "}
                {new Date(selectedDateKey + "T00:00:00").toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </h4>
            </div>
            <button
              type="button"
              className="cal-close-details-btn"
              onClick={() => setSelectedDateKey(null)}
              aria-label="Close details"
            >
              <X size={16} />
            </button>
          </div>

          {filteredEventsForDate.length === 0 ? (
            <div className="cal-empty-state">
              <AlertCircle size={20} color="#94A3B8" />
              <p>No matching events scheduled on this date.</p>
            </div>
          ) : (
            <div className="cal-event-cards-list">
              {filteredEventsForDate.map((ev) => {
                const colorConfig = CALENDAR_STATUS_COLORS[ev.statusKey] || CALENDAR_STATUS_COLORS.registered;

                return (
                  <div key={ev.id} className="cal-event-detail-item">
                    <div className="cal-item-top">
                      <span className="cal-cat-badge">{ev.category}</span>
                      <span
                        className="cal-status-pill"
                        style={{
                          backgroundColor: `${colorConfig.bg}22`,
                          color: colorConfig.border,
                          border: `1px solid ${colorConfig.border}`,
                        }}
                      >
                        {ev.status}
                      </span>
                    </div>

                    <h5 className="cal-item-title">{ev.title}</h5>

                    <div className="cal-item-meta-grid">
                      <div className="cal-meta-entry">
                        <Clock size={13} color="#64748B" />
                        <span>{ev.time}</span>
                      </div>
                      <div className="cal-meta-entry">
                        <MapPin size={13} color="#64748B" />
                        <span>{ev.location}</span>
                      </div>
                    </div>

                    {mode === "admin" && (
                      <div className="cal-admin-metrics-row">
                        <span className="cal-metric-badge">
                          <Users size={12} /> {ev.registeredCount} Registered
                        </span>
                        <span className="cal-metric-badge green">
                          <Check size={12} /> {ev.approvedCount} Approved
                        </span>
                        {ev.pendingCount > 0 && (
                          <span className="cal-metric-badge orange">
                            <Clock size={12} /> {ev.pendingCount} Pending
                          </span>
                        )}
                      </div>
                    )}

                    <div className="cal-item-action-row">
                      {onSelectEvent && (
                        <button
                          type="button"
                          className="cal-action-btn view-btn"
                          onClick={() => onSelectEvent(ev.raw)}
                        >
                          View Details <ArrowRight size={13} />
                        </button>
                      )}
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
