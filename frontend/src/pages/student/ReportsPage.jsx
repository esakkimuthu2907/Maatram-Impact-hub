// frontend/src/pages/student/ReportsPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  Sparkles,
  Layers,
  PieChart,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Trophy,
  Star,
  ArrowUpRight,
  GraduationCap,
  BarChart2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { adminAPI } from "../../api/adminAPI";
import BarChart from "../../components/charts/BarChart";
import DonutChart from "../../components/charts/DonutChart";
import "./StudentDashboard.css";
import "../admin/AdminEventsPage.css";

const COLLEGES = [
  "All Colleges",
  "Velammal Engineering College, Chennai",
  "College of Engineering Guindy (CEG)",
  "Madras Institute of Technology (MIT)",
  "Anna University, Chennai",
];

const TABS = [
  { id: "event_participation", label: "Events", icon: <Calendar size={15} /> },
  { id: "student_contributions", label: "Student Leaders", icon: <Users size={15} /> },
  { id: "department_stats", label: "Departments", icon: <Layers size={15} /> },
  { id: "points_distribution", label: "Points Log", icon: <Award size={15} /> },
];

const RANK_ICONS = ["🥇", "🥈", "🥉"];

function downloadCSV(rows, filename) {
  if (!rows || rows.length === 0) return;
  const header = Object.keys(rows[0]).join(",");
  const body = rows.map((r) =>
    Object.values(r).map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
  );
  const csv = [header, ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { user, showToast } = useApp();
  const [activeTab, setActiveTab] = useState("event_participation");
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("All Colleges");

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getReports();
      if (res && res.data) setReportsData(res.data);
    } catch (err) {
      console.warn("Could not load reports:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, []);

  const summary = reportsData?.summary || {};
  const appStats = reportsData?.applicationStatistics || {};

  const summaryCards = [
    { label: "Total Students", value: summary.totalStudents ?? 3, icon: <Users size={20} />, color: "#4F46E5", bg: "#EEF2FF" },
    { label: "Total Hours", value: summary.totalHours ?? 38, icon: <Clock size={20} />, color: "#0369A1", bg: "#E0F2FE", suffix: "hrs" },
    { label: "Total Points", value: summary.totalPoints ?? 260, icon: <Award size={20} />, color: "#B45309", bg: "#FEF3C7", suffix: "pts" },
    { label: "Total Events", value: summary.totalEvents ?? 3, icon: <Calendar size={20} />, color: "#059669", bg: "#D1FAE5" },
  ];

  const filtered = (arr = []) => {
    let data = arr;
    if (collegeFilter !== "All Colleges") {
      data = data.filter((r) =>
        (r.college || "").toLowerCase().includes(collegeFilter.toLowerCase().slice(0, 10))
      );
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      data = data.filter((r) =>
        Object.values(r).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    return data;
  };

  const handleExport = () => {
    if (!reportsData) { showToast("No data to export", "error"); return; }
    const ts = new Date().toISOString().slice(0, 10);
    if (activeTab === "student_contributions") {
      const rows = filtered(reportsData.studentContributions || []).map((s) => ({
        "Name": s.fullName, "College": s.college, "Department": s.department,
        "Points": s.points, "Hours": s.totalHours, "Events": s.eventsJoined,
      }));
      downloadCSV(rows, `Maatram_Student_Leaders_${ts}.csv`);
    } else if (activeTab === "college_leaderboard") {
      const rows = (reportsData.collegeLeaderboard || []).map((c) => ({
        "Rank": c.rank, "College": c.college, "Students": c.totalStudents,
        "Points": c.totalPoints, "Hours": c.totalHours, "Avg": c.averagePoints,
      }));
      downloadCSV(rows, `Maatram_College_Leaderboard_${ts}.csv`);
    } else if (activeTab === "event_participation") {
      const rows = (reportsData.eventParticipation || []).map((e) => ({
        "Event": e.eventTitle, "Category": e.category, "Date": e.date,
        "Approved Volunteers": e.approvedVolunteers,
      }));
      downloadCSV(rows, `Maatram_Events_${ts}.csv`);
    }
    showToast("Exported successfully!", "success");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 16 }}>
        <div style={{ width: 48, height: 48, border: "4px solid #E0E7FF", borderTopColor: "#4F46E5", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#6366F1", fontWeight: 600, fontSize: 15 }}>Loading Impact Reports…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: 1200, margin: "0 auto" }}>

      {/* HERO */}
      <div style={{
        background: "linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 50%,#0284C7 100%)",
        borderRadius: 20, padding: "28px 32px", marginBottom: 24, position: "relative", overflow: "hidden",
        boxShadow: "0 10px 30px rgba(30, 58, 138, 0.25)",
      }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <BarChart2 size={18} color="#93C5FD" />
              <span style={{ color: "#93C5FD", fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>IMPACT ANALYTICS</span>
            </div>
            <h1 style={{ color: "#fff", margin: 0, fontSize: 24, fontWeight: 800 }}>Community Impact Reports</h1>
            <p style={{ color: "#BFDBFE", margin: "4px 0 0", fontSize: 13 }}>Real-time volunteering data • Verified volunteer impact</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleExport} style={heroBtnStyle("#2563EB", "#fff")}>
              <Download size={14} /> Export
            </button>
            <button onClick={loadReports} style={heroBtnStyle("rgba(255,255,255,0.15)", "#BFDBFE")}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Summary chips */}
        <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
          {summaryCards.map((s) => (
            <div key={s.label} style={{
              background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)",
              borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center",
              gap: 10, border: "1px solid rgba(255,255,255,0.15)",
            }}>
              <div style={{ background: s.bg, borderRadius: 8, padding: 7, color: s.color }}>{s.icon}</div>
              <div>
                <div style={{ color: "#DBEAFE", fontSize: 10, fontWeight: 700 }}>{s.label}</div>
                <div style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>
                  {s.value}<span style={{ fontSize: 11, color: "#BFDBFE", marginLeft: 2 }}>{s.suffix || ""}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTER ROW */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search…" style={inputStyle} />
        </div>
        {activeTab === "student_contributions" && (
          <div style={{ position: "relative" }}>
            <Filter size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#2563EB", pointerEvents: "none" }} />
            <select value={collegeFilter} onChange={(e) => setCollegeFilter(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 30, minWidth: 220 }}>
              {COLLEGES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setSearchFilter(""); }}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
              borderRadius: 50, border: activeTab === t.id ? "2px solid #2563EB" : "2px solid #E2E8F0",
              background: activeTab === t.id ? "linear-gradient(135deg,#2563EB,#0284C7)" : "#fff",
              color: activeTab === t.id ? "#fff" : "#475569", fontWeight: 600, fontSize: 13,
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: activeTab === t.id ? "0 4px 15px rgba(37,99,235,0.3)" : "none",
            }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* TAB PANELS */}
      {activeTab === "event_participation" && <EventsTab data={reportsData?.eventParticipation || []} search={searchFilter} />}
      {activeTab === "student_contributions" && <StudentsTab data={filtered(reportsData?.studentContributions || [])} />}
      {activeTab === "department_stats" && <DeptTab data={filtered(reportsData?.departmentStatistics || [])} />}
      {activeTab === "points_distribution" && <PointsTab data={filtered(reportsData?.pointsDistribution || [])} />}
    </div>
  );
}

// ─── Shared helpers ───
function Card({ title, icon, children, action }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <div style={{ background: "linear-gradient(135deg,#1D4ED8,#2563EB)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, color: "#fff" }}>{icon}<span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span></div>
        {action}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}
function Empty({ msg = "No data available" }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: "#94A3B8" }}>
      <Sparkles size={36} style={{ marginBottom: 10, opacity: 0.4 }} />
      <p style={{ fontWeight: 600, fontSize: 14 }}>{msg}</p>
    </div>
  );
}
const tbl = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
const th = { textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "2px solid #E2E8F0", background: "#F8FAFC" };
const td = { padding: "11px 14px", borderBottom: "1px solid #F1F5F9", verticalAlign: "middle" };
const rw = (i) => ({ background: i % 2 === 0 ? "#fff" : "#F9FFF9" });
const badge = (bg, color) => ({ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color });
const inputStyle = { width: "100%", padding: "9px 14px 9px 34px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13, background: "#F8FAFC", outline: "none", boxSizing: "border-box" };
const heroBtnStyle = (bg, color) => ({ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: bg, color });
const lBtn = (bg, color) => ({ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: bg, color, textDecoration: "none" });

function EventsTab({ data, search }) {
  const q = search.toLowerCase();
  const rows = data.filter((r) => !q || Object.values(r).some((v) => String(v).toLowerCase().includes(q)));
  return (
    <Card title="Community Events" icon={<Calendar size={16} />}>
      {rows.length === 0 ? <Empty msg="No events yet" /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={tbl}>
            <thead><tr>{["#", "Event", "Category", "Date", "Volunteers", "Completion"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((e, i) => (
                <tr key={i} style={rw(i)}>
                  <td style={td}><span style={badge("#EEF2FF", "#4F46E5")}>{i + 1}</span></td>
                  <td style={{ ...td, fontWeight: 700, color: "#1E293B" }}>{e.eventTitle}</td>
                  <td style={td}><span style={badge("#D1FAE5", "#065F46")}>{e.category}</span></td>
                  <td style={{ ...td, color: "#64748B" }}>{e.date}</td>
                  <td style={{ ...td, textAlign: "center" }}>{e.approvedVolunteers}/{e.volunteersNeeded}</td>
                  <td style={{ ...td, textAlign: "center" }}>
                    <span style={badge(Number(e.completionRate) >= 100 ? "#D1FAE5" : "#FEF3C7", Number(e.completionRate) >= 100 ? "#065F46" : "#B45309")}>
                      {e.completionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function StudentsTab({ data }) {
  return (
    <Card title="Student Leaders" icon={<Users size={16} />}>
      {data.length === 0 ? <Empty msg="No students found" /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={tbl}>
            <thead><tr>{["#", "Name", "College", "Dept", "Points", "Hours", "Events"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {data.map((s, i) => (
                <tr key={i} style={rw(i)}>
                  <td style={td}><span style={badge("#EEF2FF", "#4F46E5")}>{i + 1}</span></td>
                  <td style={{ ...td, fontWeight: 700, color: "#1E293B" }}>{s.fullName}</td>
                  <td style={{ ...td, color: "#64748B", fontSize: 12 }}>{s.college}</td>
                  <td style={td}><span style={badge("#F5F3FF", "#7C3AED")}>{s.department}</span></td>
                  <td style={{ ...td, textAlign: "center" }}><span style={badge("#FEF3C7", "#B45309")}>{s.points} pts</span></td>
                  <td style={{ ...td, textAlign: "center" }}><span style={badge("#E0F2FE", "#0369A1")}>{s.totalHours} hrs</span></td>
                  <td style={{ ...td, textAlign: "center" }}>{s.eventsJoined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function DeptTab({ data }) {
  const chartData = data.map((d) => ({ label: d.department, value: d.totalPoints }));
  return (
    <>
      <Card title="Department Statistics" icon={<Layers size={16} />}>
        {data.length === 0 ? <Empty msg="No department data" /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={tbl}>
              <thead><tr>{["Department", "Students", "Total Points", "Total Hours", "Avg Points"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {data.map((d, i) => (
                  <tr key={i} style={rw(i)}>
                    <td style={{ ...td, fontWeight: 700 }}>{d.department}</td>
                    <td style={{ ...td, textAlign: "center" }}>{d.totalStudents}</td>
                    <td style={{ ...td, textAlign: "center" }}><span style={badge("#FEF3C7", "#B45309")}>{d.totalPoints} pts</span></td>
                    <td style={{ ...td, textAlign: "center" }}><span style={badge("#E0F2FE", "#0369A1")}>{d.totalHours} hrs</span></td>
                    <td style={{ ...td, textAlign: "center" }}>{d.averagePoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {chartData.length > 0 && <Card title="Points by Department" icon={<BarChart2 size={16} />}><BarChart data={chartData} /></Card>}
    </>
  );
}

function PointsTab({ data }) {
  return (
    <Card title="Points Log" icon={<Award size={16} />}>
      {data.length === 0 ? <Empty msg="No points transactions yet" /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={tbl}>
            <thead><tr>{["#", "Student", "Event", "Points", "Type", "Date"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {data.map((p, i) => (
                <tr key={i} style={rw(i)}>
                  <td style={td}><span style={badge("#EEF2FF", "#4F46E5")}>{i + 1}</span></td>
                  <td style={{ ...td, fontWeight: 700 }}>{p.studentName}</td>
                  <td style={{ ...td, color: "#64748B", fontSize: 12 }}>{p.eventName}</td>
                  <td style={{ ...td, textAlign: "center" }}><span style={{ ...badge("#FEF3C7", "#B45309"), fontWeight: 800 }}>+{p.points}</span></td>
                  <td style={td}><span style={badge("#F5F3FF", "#7C3AED")}>{p.type}</span></td>
                  <td style={{ ...td, color: "#64748B", fontSize: 12 }}>{p.date ? new Date(p.date).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
