// frontend/src/pages/MyApplicationsPage.jsx
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
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import "./StudentDashboard.css";

export default function MyApplicationsPage() {
  const { applications = [], cancelApplication } = useApp();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filteredApps = applications.filter((app) => {
    const matchFilter = filter === "All" || app.status === filter;
    const title = (app.opportunityTitle || "").toLowerCase();
    const ref = (app.referenceId || "").toLowerCase();
    const q = search.toLowerCase().trim();
    const matchSearch = !q || title.includes(q) || ref.includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div className="dashboard-container" style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px" }}>
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
            My Applications & Participation
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
          Track your registrations, review approval statuses, and prepare for upcoming volunteer drives.
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

        <div className="format-pills-row" style={{ display: "flex", gap: 8 }}>
          {["All", "Approved", "Pending", "Cancelled"].map((st) => (
            <button
              key={st}
              className={`format-pill-btn ${filter === st ? "active" : ""}`}
              onClick={() => setFilter(st)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                border: filter === st ? "1px solid #FFD629" : "1px solid #E2E8F0",
                background: filter === st ? "#FFD629" : "#FFFFFF",
                color: filter === st ? "#151515" : "#64748B",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {st}
            </button>
          ))}
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
            const isApproved = app.status === "Approved";
            const isPending = app.status === "Pending";
            const isCancelled = app.status === "Cancelled";
            const appId = app.id || app._id;

            return (
              <div
                key={appId}
                className="application-status-card"
                style={{
                  background: "#FFFFFF",
                  borderRadius: 18,
                  padding: 22,
                  boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
                  border: isApproved
                    ? "1px solid #86EFAC"
                    : isPending
                    ? "1px solid #FDE68A"
                    : "1px solid #E2E8F0",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
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
                        background: isApproved
                          ? "#DCFCE7"
                          : isPending
                          ? "#FEF3C7"
                          : "#F1F5F9",
                        color: isApproved
                          ? "#166534"
                          : isPending
                          ? "#92400E"
                          : "#64748B",
                      }}
                    >
                      {isApproved && <CheckCircle2 size={13} color="#166534" />}
                      {isPending && <Clock3 size={13} color="#92400E" />}
                      {isCancelled && <XCircle size={13} color="#64748B" />}
                      {app.status}
                    </span>
                  </div>

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
                        <span>Event Date: <strong style={{ color: "#334155" }}>{app.eventDate}</strong></span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Clock size={13} color="#94A3B8" />
                        <span>Volunteering Credit: <strong style={{ color: "#334155" }}>{app.hours || 4} hrs</strong></span>
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
                      color: "#1E293B",
                      textDecoration: "none",
                    }}
                  >
                    View Drive Details <ChevronRight size={14} />
                  </Link>

                  {!isCancelled && (
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
