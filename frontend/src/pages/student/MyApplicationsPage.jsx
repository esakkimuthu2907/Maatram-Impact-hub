// frontend/src/pages/student/MyApplicationsPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Clock3,
  Search,
  ArrowRight,
  Sparkles,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Share2,
  Award,
  Star,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import "./StudentDashboard.css";

// Status colour palette used by the filter pills and the cards
const STATUS_THEME = {
  All: { main: "#FFD629", text: "#151515", soft: "#FFFFFF", border: "#E2E8F0", idle: "#64748B" }, // brand yellow
  Approved: { main: "#2563EB", text: "#FFFFFF", soft: "#EFF6FF", border: "#BFDBFE", idle: "#1D4ED8" }, // blue
  Completed: { main: "#16A34A", text: "#FFFFFF", soft: "#F0FDF4", border: "#BBF7D0", idle: "#15803D" }, // green
  Pending: { main: "#F97316", text: "#FFFFFF", soft: "#FFF7ED", border: "#FED7AA", idle: "#C2410C" }, // orange
  Rejected: { main: "#DC2626", text: "#FFFFFF", soft: "#FEF2F2", border: "#FECACA", idle: "#B91C1C" }, // red
  Cancelled: { main: "#64748B", text: "#FFFFFF", soft: "#F8FAFC", border: "#E2E8F0", idle: "#64748B" }, // grey
};

export default function MyApplicationsPage() {
  const {
    applications = [],
    certificates = [],
    cancelApplication,
    openLinkedInShare,
    openCertificate,
    user,
  } = useApp();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filteredApps = applications.filter((app) => {
    const isAppCompleted =
      app.status === "Completed" ||
      Boolean(app.pointsAwarded && app.pointsAwarded > 0) ||
      Boolean(app.certificateId) ||
      Boolean(app.completedAt);
    let matchFilter = true;
    if (filter === "All") matchFilter = true;
    else if (filter === "Completed") matchFilter = isAppCompleted;
    else if (filter === "Approved") matchFilter = !isAppCompleted && app.status === "Approved";
    else matchFilter = (app.status || "").toLowerCase() === filter.toLowerCase();

    const title = (app.opportunityTitle || "").toLowerCase();
    const ref = (app.referenceId || "").toLowerCase();
    const q = search.toLowerCase().trim();
    const matchSearch = !q || title.includes(q) || ref.includes(q);
    return matchFilter && matchSearch;
  });

  const handleOpenCertificate = (app) => {
    // Try to find real cert from certificates context first
    const eventId = app.opportunityId;
    const matchCert =
      certificates.find(
        (c) =>
          (c.eventId || "").toString() === (eventId || "").toString() ||
          (c.eventTitle || "").toLowerCase() === (app.opportunityTitle || "").toLowerCase()
      ) || null;

    openCertificate(
      matchCert || {
        volunteerName: user?.fullName || app.applicantDetails?.name || "Volunteer",
        eventTitle: app.opportunityTitle,
        eventCategory: app.category,
        verifiedHours: app.hours || 4,
        certificateId:
          app.certificateId || `MF-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        issueDate: app.eventDate,
        pointsAwarded: app.pointsAwarded || 50,
      }
    );
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px", background: "#FFFFFF" }}>
      {/* SECTION HEADER */}
      <div className="section-header-row" style={{ marginBottom: 28 }}>
        <div>
          <h1
            className="page-heading"
            style={{
              fontSize: "clamp(24px, 3vw, 32px)",
              fontWeight: 800,
              color: "#151515",
              margin: "0 0 8px",
              letterSpacing: "-0.01em",
            }}
          >
            My Applications &amp; Participation
          </h1>
          <p
            className="page-subheading"
            style={{
              color: "#717784",
              fontSize: 15,
              lineHeight: 1.6,
              margin: 0,
              maxWidth: 620,
            }}
          >
            Track your registrations, review approval statuses, and access your certificates.
          </p>
        </div>

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
          Explore New Drives
        </Link>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div
        className="filter-search-toolbar"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          background: "#FFFFFF",
          padding: "16px 20px",
          borderRadius: 16,
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          border: "1px solid #EAECEF",
          marginBottom: 24,
        }}
      >
        <div
          className="opp-search-box"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 10,
            padding: "8px 14px",
            flex: "1 1 300px",
            maxWidth: 420,
          }}
        >
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search by event title or Reference ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 13.5,
              color: "#1E293B",
              width: "100%",
            }}
          />
        </div>

        <div className="format-pills-row" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["All", "Approved", "Completed", "Pending", "Rejected", "Cancelled"].map((st) => {
            const t = STATUS_THEME[st];
            const active = filter === st;
            return (
              <button
                key={st}
                className={`format-pill-btn ${active ? "active" : ""}`}
                onClick={() => setFilter(st)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  // White by default; colour appears only when the pill is clicked (active)
                  border: `1.5px solid ${active ? t.main : "#E2E8F0"}`,
                  background: active ? t.main : "#FFFFFF",
                  color: active ? t.text : "#64748B",
                  boxShadow: active ? `0 4px 12px ${t.main}55` : "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* APPLICATIONS LIST */}
      {filteredApps.length === 0 ? (
        <div
          className="opp-empty-state"
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            padding: "54px 24px",
            textAlign: "center",
            border: "1px dashed #CBD5E1",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#FFF7D1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <FileText size={32} color="#D97706" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1E293B", margin: "0 0 8px" }}>
            No applications found
          </h3>
          <p
            style={{
              color: "#64748B",
              fontSize: 14,
              maxWidth: 420,
              margin: "0 auto 20px",
              lineHeight: 1.5,
            }}
          >
            {search
              ? "No applications matched your search terms. Try clearing your search."
              : "You haven't submitted any volunteering applications yet. Discover open drives and make an impact!"}
          </p>
          <Link
            to="/opportunities"
            className="dash-btn dash-btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 22px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13.5,
            }}
          >
            Browse Volunteering Drives
          </Link>
        </div>
      ) : (
        <div
          className="applications-list-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 20,
          }}
        >
          {filteredApps.map((app) => {
            const isCompleted =
              app.status === "Completed" ||
              Boolean(app.pointsAwarded && app.pointsAwarded > 0) ||
              Boolean(app.certificateId) ||
              Boolean(app.completedAt);
            const isApproved = !isCompleted && app.status === "Approved";
            const isPending = app.status === "Pending";
            const isCancelled = app.status === "Cancelled";
            const isRejected = app.status === "Rejected";
            const appId = app.id || app._id;

            // Border color based on status
            const borderColor = isCompleted
              ? "#86EFAC"
              : isApproved
                ? "#93C5FD"
                : isPending
                  ? "#FDBA74"
                  : isRejected
                    ? "#FCA5A5"
                    : "#E2E8F0";

            // Status badge colors
            const badgeBg = isCompleted
              ? "#DCFCE7"
              : isApproved
                ? "#DBEAFE"
                : isPending
                  ? "#FFEDD5"
                  : isRejected
                    ? "#FEE2E2"
                    : "#F1F5F9";
            const badgeColor = isCompleted
              ? "#15803D"
              : isApproved
                ? "#1D4ED8"
                : isPending
                  ? "#C2410C"
                  : isRejected
                    ? "#B91C1C"
                    : "#64748B";

            return (
              <div
                key={appId}
                className="application-status-card"
                style={{
                  background: "#FFFFFF",
                  borderRadius: 18,
                  padding: 22,
                  boxShadow: isCompleted
                    ? "0 4px 20px rgba(34,197,94,0.12)"
                    : "0 3px 12px rgba(0,0,0,0.04)",
                  border: `1.5px solid ${borderColor}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Completed ribbon */}
                {isCompleted && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: "linear-gradient(90deg, #22C55E, #16A34A)",
                      borderRadius: "18px 18px 0 0",
                    }}
                  />
                )}

                <div>
                  {/* TOP ROW: Reference ID & Status Badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#94A3B8",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          display: "block",
                          fontWeight: 600,
                        }}
                      >
                        Application Ref
                      </span>
                      <strong style={{ fontSize: 13, color: "#1E293B", fontFamily: "monospace" }}>
                        {app.referenceId}
                      </strong>
                    </div>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        background: badgeBg,
                        color: badgeColor,
                      }}
                    >
                      {isCompleted && <CheckCircle2 size={13} color="#15803D" />}
                      {isApproved && <CheckCircle2 size={13} color="#1D4ED8" />}
                      {isPending && <Clock3 size={13} color="#C2410C" />}
                      {isRejected && <XCircle size={13} color="#B91C1C" />}
                      {isCancelled && <XCircle size={13} color="#64748B" />}
                      {isCompleted ? "✅ Completed" : app.status}
                    </span>
                  </div>

                  {/* Points awarded banner for completed */}
                  {isCompleted && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "linear-gradient(135deg, #FFF7ED, #FFFBEB)",
                        border: "1px solid #FDE68A",
                        borderRadius: 10,
                        padding: "8px 12px",
                        marginBottom: 12,
                      }}
                    >
                      <Star size={14} color="#D97706" fill="#D97706" />
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#92400E" }}>
                        +{app.pointsAwarded || 50} pts awarded · Certificate issued
                      </span>
                    </div>
                  )}

                  {/* MIDDLE: Event Title & Category */}
                  <div style={{ marginBottom: 16 }}>
                    {app.category && (
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 9px",
                          borderRadius: 6,
                          background: "#F1F5F9",
                          color: "#475569",
                          marginBottom: 8,
                        }}
                      >
                        {app.category}
                      </span>
                    )}
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#151515",
                        margin: "0 0 10px",
                        lineHeight: 1.4,
                      }}
                    >
                      {app.opportunityTitle}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        fontSize: 12.5,
                        color: "#64748B",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Calendar size={13} color="#94A3B8" />
                        <span>
                          Event Date:{" "}
                          <strong style={{ color: "#334155" }}>{app.eventDate}</strong>
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Clock size={13} color="#94A3B8" />
                        <span>
                          Volunteering Credit:{" "}
                          <strong style={{ color: "#334155" }}>{app.hours || 4} hrs</strong>
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <ShieldCheck size={13} color="#94A3B8" />
                        <span>Submitted on: {app.appliedDate || "Recently"}</span>
                      </div>
                    </div>

                    {app.notes && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: "10px 12px",
                          borderRadius: 8,
                          background: "#F8FAFC",
                          borderLeft: "3px solid #FFD629",
                          fontSize: 12,
                          color: "#334155",
                          lineHeight: 1.45,
                        }}
                      >
                        <strong>Coordinator Note:</strong> {app.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTTOM ACTIONS */}
                <div
                  style={{
                    paddingTop: 14,
                    borderTop: "1px solid #F1F5F9",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <Link
                      to={`/opportunities/${app.opportunityId}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "#0066CC",
                        textDecoration: "none",
                      }}
                    >
                      View Details <ChevronRight size={14} />
                    </Link>

                    {!isCancelled && !isCompleted && !isRejected && (
                      <button
                        onClick={() => cancelApplication(appId)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#EF4444",
                          cursor: "pointer",
                          padding: "4px 8px",
                        }}
                      >
                        Withdraw
                      </button>
                    )}
                  </div>

                  {/* Certificate & LinkedIn for Completed */}
                  {isCompleted && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleOpenCertificate(app)}
                        style={{
                          flex: 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "10px 12px",
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          background: "linear-gradient(135deg, #22C55E, #16A34A)",
                          color: "#FFFFFF",
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
                        }}
                      >
                        <Award size={15} />
                        📜 Certificate
                      </button>
                      <button
                        onClick={() =>
                          openLinkedInShare({
                            volunteerName: user?.fullName || app.applicantDetails?.name,
                            eventTitle: app.opportunityTitle,
                            hours: app.hours || 4,
                            category: app.category,
                          })
                        }
                        style={{
                          flex: 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "10px 12px",
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          background: "#0A66C2",
                          color: "#FFFFFF",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Share2 size={14} /> LinkedIn
                      </button>
                    </div>
                  )}

                  {/* Approved but not completed: show info only (no QR) */}
                  {isApproved && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "#EFF6FF",
                        border: "1px solid #BFDBFE",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 12,
                        color: "#1D4ED8",
                        fontWeight: 600,
                      }}
                    >
                      <CheckCircle2 size={13} color="#1D4ED8" />
                      Approved — Awaiting event completion for certificate
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}