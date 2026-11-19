// frontend/src/components/common/HorizontalEventCarousel.jsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Clock3,
  XCircle,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Tag,
} from "lucide-react";
import "./HorizontalEventCarousel.css";

export default function HorizontalEventCarousel({
  events = [],
  applications = [],
  onRegister,
  onViewDetails,
  loading = false,
  showBadge = false,
}) {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [registeringId, setRegisteringId] = useState(null);

  // Check scroll position to enable/disable arrow buttons
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [events]);

  const handleScroll = (direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = 340; // width of a card + gap
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Map application status by event ID
  const appStatusMap = React.useMemo(() => {
    const map = {};
    (applications || []).forEach((app) => {
      if (!app) return;
      const evId = (app.opportunityId || app.eventId || "").toString();
      if (evId) {
        map[evId] = app;
      }
    });
    return map;
  }, [applications]);

  // Sort upcoming events chronologically
  const sortedUpcomingEvents = React.useMemo(() => {
    return [...(events || [])]
      .filter((e) => (e.eventStatus || "Upcoming") !== "Cancelled")
      .sort((a, b) => {
        const da = new Date(a.date || 0).getTime();
        const db = new Date(b.date || 0).getTime();
        return da - db;
      });
  }, [events]);

  const handleRegisterClick = async (event) => {
    const evId = (event.id || event._id).toString();
    setRegisteringId(evId);
    try {
      if (onRegister) {
        await onRegister(event);
      } else {
        navigate(`/opportunities/${evId}/apply`);
      }
    } finally {
      setRegisteringId(null);
    }
  };

  if (sortedUpcomingEvents.length === 0) {
    return (
      <div className="horizontal-carousel-empty">
        <Calendar size={36} color="#94A3B8" />
        <h4>No Upcoming Events Right Now</h4>
        <p>New volunteering opportunities and student drives will appear here soon.</p>
      </div>
    );
  }

  return (
    <div className="horizontal-carousel-section">
      {/* Header Row with Navigation Arrows */}
      <div className="carousel-header">
        <div className="carousel-title-group">
          {showBadge && (
            <span className="carousel-badge">
              <Sparkles size={13} color="#EAB308" /> Drives & Opportunities
            </span>
          )}
          <h3 className="carousel-main-title">Upcoming Events</h3>
        </div>

        <div className="carousel-nav-arrows">
          <button
            type="button"
            className={`carousel-arrow-btn ${!canScrollLeft ? "disabled" : ""}`}
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            title="Previous events"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className={`carousel-arrow-btn ${!canScrollRight ? "disabled" : ""}`}
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            title="Next events"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div
        className="carousel-scroll-track"
        ref={scrollContainerRef}
        tabIndex={0}
        aria-label="Upcoming Events horizontal list"
      >
        {sortedUpcomingEvents.map((ev) => {
          const evId = (ev.id || ev._id).toString();
          const userApp = appStatusMap[evId];
          const isRegistered = Boolean(userApp && userApp.status !== "Cancelled");
          const slots = ev.slotsAvailable !== undefined ? Number(ev.slotsAvailable) : 10;
          const isClosed = slots <= 0 && !isRegistered;
          const isRegistering = registeringId === evId;

          // Status representation
          let statusBadge = null;
          if (userApp) {
            const st = (userApp.status || "Pending").toLowerCase();
            if (st === "approved" || st === "assigned") {
              statusBadge = (
                <span className="ev-status-tag approved">
                  <CheckCircle2 size={13} /> {userApp.status === "Assigned" ? "Assigned" : "Approved"}
                </span>
              );
            } else if (st === "completed") {
              statusBadge = (
                <span className="ev-status-tag completed">
                  <CheckCircle2 size={13} /> Completed
                </span>
              );
            } else if (st === "rejected") {
              statusBadge = (
                <span className="ev-status-tag rejected">
                  <XCircle size={13} /> Rejected
                </span>
              );
            } else {
              statusBadge = (
                <span className="ev-status-tag pending">
                  <Clock3 size={13} /> Applied - Pending
                </span>
              );
            }
          }

          return (
            <div key={evId} className="h-event-card">
              {/* Event Banner Media */}
              <div className="h-card-media">
                <img
                  src={
                    ev.image ||
                    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80"
                  }
                  alt={ev.title}
                  className="h-card-img"
                  loading="lazy"
                />
                <span className="h-card-cat-pill">{ev.category || "Drive"}</span>
                {slots > 0 && !isRegistered && (
                  <span className="h-card-slots-pill">
                    <Users size={11} /> {slots} slots left
                  </span>
                )}
                {isClosed && <span className="h-card-closed-pill">Registration Closed</span>}
              </div>

              {/* Event Content */}
              <div className="h-card-body">
                <div className="h-card-meta-row">
                  <span className="h-card-date">
                    <Calendar size={13} color="#EAB308" /> {ev.date}
                  </span>
                  <span className="h-card-time">
                    <Clock size={13} color="#64748B" /> {ev.time || "9:30 AM"}
                  </span>
                </div>

                <h4 className="h-card-title" title={ev.title}>
                  {ev.title}
                </h4>

                <div className="h-card-venue">
                  <MapPin size={13} color="#64748B" />
                  <span>{ev.location || "Tamil Nadu, India"}</span>
                </div>

                <p className="h-card-desc">
                  {ev.description || "Join fellow Maatram student volunteers in creating meaningful social impact."}
                </p>

                {/* Status Indicator if registered */}
                {statusBadge && <div className="h-card-status-box">{statusBadge}</div>}

                {/* Card Actions */}
                <div className="h-card-actions">
                  <button
                    type="button"
                    className="h-btn-details"
                    onClick={() => {
                      if (onViewDetails) onViewDetails(ev);
                      else navigate(`/opportunities/${evId}`);
                    }}
                  >
                    View Details
                  </button>

                  {!isRegistered && !isClosed && (
                    <button
                      type="button"
                      className="h-btn-register"
                      onClick={() => handleRegisterClick(ev)}
                      disabled={isRegistering}
                    >
                      {isRegistering ? "Registering..." : "Register Now"}
                    </button>
                  )}

                  {isRegistered && (
                    <button
                      type="button"
                      className="h-btn-registered-view"
                      onClick={() => navigate("/applications")}
                    >
                      My Application <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
