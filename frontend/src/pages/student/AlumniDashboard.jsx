import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { adminAPI } from "../../api/adminAPI";
import "./StudentDashboard.css";

export default function AlumniDashboard() {
  const { user, opportunities = [], showToast } = useApp();
  const [assignedWorks, setAssignedWorks] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  // Sync user's assigned works
  useEffect(() => {
    if (user) {
      const works = Array.isArray(user.assignedWorks) && user.assignedWorks.length > 0
        ? user.assignedWorks
        : user.assignedEvent && user.assignedEvent !== "Unassigned"
        ? [
            {
              id: "work_primary",
              eventTitle: user.assignedEvent,
              role: user.assignedRole || "Event Lead & Supervisor",
              date: user.assignedDate || "Upcoming",
              description: user.workDescription || "Event supervision, student coordination, and on-ground impact mentorship.",
              status: "Assigned",
            },
          ]
        : [];
      setAssignedWorks(works);
    }
  }, [user]);

  const handleUpdateStatus = (workId, newStatus) => {
    setUpdatingId(workId);
    setAssignedWorks((prev) =>
      prev.map((w) => (w.id === workId ? { ...w, status: newStatus } : w))
    );
    showToast(`Work status updated to "${newStatus}"!`);
    setUpdatingId(null);
  };

  const totalPoints = Number(user?.points) || 0;
  const totalHours = Number(user?.totalHours) || 0;
  const menteesCount = Number(user?.eventsJoined) || 0;

  return (
    <div className="dashboard-container" style={{ paddingBottom: 60 }}>
      {/* ─── HERO BANNER ────────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #004D99 100%)",
          borderRadius: 20,
          padding: "28px 32px",
          color: "#fff",
          marginBottom: 28,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div style={{ maxWidth: 600 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255, 214, 41, 0.2)",
                border: "1px solid #FFD629",
                color: "#FFD629",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 800,
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              <ShieldCheck size={14} /> Maatram Alumni Leader
            </div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 8px 0" }}>
              Vanakkam, {user?.fullName || "Alumni Leader"}! 👋
            </h1>
            <p style={{ color: "#CBD5E1", fontSize: "0.95rem", margin: "0 0 14px 0", lineHeight: 1.5 }}>
              {user?.designation ? `${user.designation} at ` : "Alumni Leader @ "}
              <strong>{user?.organization || "Maatram Foundation"}</strong>
              {" • "}
              {user?.college || "Anna University"} ({user?.batch || user?.graduationYear || "Batch 2020-2024"})
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link
                to="/connect"
                style={{
                  background: "#FFD629",
                  color: "#151515",
                  fontWeight: 700,
                  fontSize: 13,
                  padding: "9px 18px",
                  borderRadius: 10,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Users size={15} /> Maatram Connect Feed
              </Link>
              <Link
                to="/opportunities"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13,
                  padding: "9px 18px",
                  borderRadius: 10,
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Compass size={15} /> Browse Open Drives
              </Link>
            </div>
          </div>

          {/* User ID Pill */}
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 16,
              padding: "16px 20px",
              textAlign: "center",
              minWidth: 160,
            }}
          >
            <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>
              Alumni ID
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#FFD629", letterSpacing: 1, margin: "4px 0" }}>
              {user?.applicationId || "ALU001"}
            </div>
            <div style={{ fontSize: 12, color: "#86EFAC", fontWeight: 600 }}>
              ● Verified & Active
            </div>
          </div>
        </div>
      </div>

      {/* ─── KPI METRICS ROW ────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 28 }}>
        <div style={{ background: "#fff", padding: "20px 22px", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Assigned Works</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}>
              <Briefcase size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A" }}>{assignedWorks.length}</div>
          <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>Active admin tasks</span>
        </div>

        <div style={{ background: "#fff", padding: "20px 22px", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Volunteers Guided</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16A34A" }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A" }}>{menteesCount}+</div>
          <span style={{ fontSize: 12, color: "#64748B" }}>Across Tamil Nadu colleges</span>
        </div>

        <div style={{ background: "#fff", padding: "20px 22px", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Leadership Hours</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FEF9C3", display: "flex", alignItems: "center", justifyContent: "center", color: "#CA8A04" }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A" }}>{totalHours} hrs</div>
          <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>Verified service</span>
        </div>

        <div style={{ background: "#fff", padding: "20px 22px", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Impact Points</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FAF5FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#9333EA" }}>
              <Star size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A" }}>{totalPoints}</div>
          <span style={{ fontSize: 12, color: "#9333EA", fontWeight: 600 }}>Gold Tier Volunteer</span>
        </div>
      </div>

      {/* ─── ASSIGNED WORKS SECTION (ADMIN DELEGATED) ────────────────── */}
      <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0", padding: "24px 28px", marginBottom: 28, boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
              📋 Assigned Works &amp; Leadership Tasks
            </h2>
            <p style={{ fontSize: "0.88rem", color: "#64748B", margin: "4px 0 0" }}>
              Specific volunteering drives and supervision roles delegated to you by the Maatram administration team.
            </p>
          </div>
          <span style={{ background: "#EFF6FF", color: "#1D4ED8", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>
            {assignedWorks.length} Active Work(s)
          </span>
        </div>

        {assignedWorks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", background: "#F8FAFC", borderRadius: 14, border: "1.5px dashed #CBD5E1" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#E2E8F0", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#64748B", marginBottom: 12 }}>
              <Briefcase size={22} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", margin: "0 0 6px" }}>
              Ready for Leadership Assignments
            </h3>
            <p style={{ fontSize: 13.5, color: "#64748B", maxWidth: 440, margin: "0 auto 16px" }}>
              You are currently registered as an active Alumni Mentor. When the admin assigns you to supervise or lead an upcoming drive, it will immediately appear here!
            </p>
            <Link
              to="/opportunities"
              style={{
                background: "#004D99",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                padding: "8px 18px",
                borderRadius: 8,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Browse Open Opportunities <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {assignedWorks.map((work) => {
              const status = work.status || "Assigned";
              const isCompleted = status === "Completed";
              const isInProgress = status === "In Progress";
              return (
                <div
                  key={work.id}
                  style={{
                    background: "#F8FAFC",
                    border: "1.5px solid #E2E8F0",
                    borderRadius: 14,
                    padding: "20px 22px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span
                        style={{
                          background: isCompleted ? "#DCFCE7" : isInProgress ? "#FEF9C3" : "#EFF6FF",
                          color: isCompleted ? "#15803D" : isInProgress ? "#854D0E" : "#1D4ED8",
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "3px 10px",
                          borderRadius: 20,
                          textTransform: "uppercase",
                        }}
                      >
                        {status}
                      </span>
                      <span style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={13} /> {work.date || "Upcoming Drive"}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>
                      {work.eventTitle}
                    </h3>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#004D99", marginBottom: 6 }}>
                      Role: {work.role}
                    </div>
                    <p style={{ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.5 }}>
                      <strong>Admin Instructions:</strong> {work.description || "Coordinate on-ground logistics, lead student volunteers, and verify drive execution."}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {status !== "In Progress" && !isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(work.id, "In Progress")}
                        style={{
                          background: "#F59E0B",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 14px",
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Start Task
                      </button>
                    )}

                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(work.id, "Completed")}
                        style={{
                          background: "#16A34A",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 14px",
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <CheckCircle2 size={14} /> Mark Completed
                      </button>
                    )}

                    <Link
                      to="/connect"
                      style={{
                        background: "#fff",
                        border: "1.5px solid #CBD5E1",
                        color: "#334155",
                        borderRadius: 8,
                        padding: "8px 14px",
                        fontSize: 12.5,
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <MessageSquare size={13} /> Coordinate Volunteers
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── UPCOMING DRIVES YOU CAN LEAD ────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0", padding: "24px 28px", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
              🌟 Volunteering Initiatives Open for Mentorship
            </h2>
            <p style={{ fontSize: "0.88rem", color: "#64748B", margin: "4px 0 0" }}>
              Join hands with undergraduate student volunteers in social impact drives across schools and rural centers.
            </p>
          </div>
          <Link
            to="/opportunities"
            style={{ color: "#004D99", fontWeight: 700, fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
          >
            View All Drives <ChevronRight size={14} />
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {opportunities.slice(0, 3).map((opp) => (
            <div
              key={opp.id || opp._id}
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: 14,
                overflow: "hidden",
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              }}
            >
              <img
                src={opp.image || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80"}
                alt={opp.title}
                style={{ width: "100%", height: 130, objectFit: "cover" }}
              />
              <div style={{ padding: 16, display: "flex", flexDirection: "column", flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#004D99", textTransform: "uppercase", marginBottom: 4 }}>
                  {opp.category || "School Visits"}
                </span>
                <h4 style={{ margin: "0 0 8px 0", fontSize: 15, fontWeight: 700, color: "#0F172A", lineHeight: 1.4 }}>
                  {opp.title}
                </h4>
                <div style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <MapPin size={12} /> {opp.location || "Tamil Nadu"}
                </div>
                <div style={{ marginTop: "auto" }}>
                  <Link
                    to={`/opportunities/${opp.id || opp._id}`}
                    style={{
                      display: "block",
                      textAlign: "center",
                      background: "#F1F5F9",
                      color: "#1E293B",
                      fontSize: 12.5,
                      fontWeight: 700,
                      padding: "8px 12px",
                      borderRadius: 8,
                      textDecoration: "none",
                    }}
                  >
                    View Drive Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
